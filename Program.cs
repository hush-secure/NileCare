using System.Threading.RateLimiting;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Routing;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var cfg = builder.Configuration;
void FromEnv(string envName, string configKey)
{
    var v = cfg[envName];
    if (!string.IsNullOrWhiteSpace(v)) cfg[configKey] = v;
}
FromEnv("ENCRYPTION_KEY", "Encryption:Key");
FromEnv("ADMIN_EMAIL", "Admin:Email");
FromEnv("ADMIN_PASSWORD", "Admin:Password");
FromEnv("REQUIRE_HTTPS", "Security:RequireHttps");
FromEnv("TRUST_PROXY_HEADERS", "Security:TrustProxyHeaders");
FromEnv("DATA_PROTECTION_KEYS_PATH", "DataProtection:KeysPath");
FromEnv("ASSISTANT_BASE_URL", "Assistant:BaseUrl");
FromEnv("ASSISTANT_TIMEOUT_SECONDS", "Assistant:TimeoutSeconds");
FromEnv("INTERNAL_KEY", "Assistant:InternalKey");
FromEnv("LLM_MODEL", "Assistant:Model");

var connectionString = cfg.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString) && !string.IsNullOrWhiteSpace(cfg["POSTGRES_DB"]))
{
    connectionString = new NpgsqlConnectionStringBuilder
    {
        Host = cfg["DB_HOST"] ?? "localhost",
        Port = cfg.GetValue("DB_PORT", 5432),
        Database = cfg["POSTGRES_DB"],
        Username = cfg["POSTGRES_USER"],
        Password = cfg["POSTGRES_PASSWORD"]
    }.ConnectionString;
}

builder.Services.AddControllersWithViews();
builder.Services.AddHttpContextAccessor();

var requireHttps = builder.Configuration.GetValue("Security:RequireHttps", !builder.Environment.IsDevelopment());
var trustProxy = builder.Configuration.GetValue("Security:TrustProxyHeaders", false);

if (trustProxy)
{
    builder.Services.Configure<ForwardedHeadersOptions>(o =>
    {
        o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        o.KnownNetworks.Clear(); 
        o.KnownProxies.Clear();
    });
}

var keysPath = builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(keysPath))
{
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
        .SetApplicationName("nilecare");
}

builder.Services.AddSingleton<FieldCipher>();
builder.Services.AddScoped<AuditService>();

var assistantUrl = builder.Configuration["Assistant:BaseUrl"];
if (!string.IsNullOrWhiteSpace(assistantUrl))
{
    builder.Services.AddHttpClient<IAssistantService, GemmaAssistantService>(http =>
    {
        http.BaseAddress = new Uri(assistantUrl.TrimEnd('/') + "/");
        http.Timeout = TimeSpan.FromSeconds(builder.Configuration.GetValue("Assistant:TimeoutSeconds", 90));
        var key = builder.Configuration["Assistant:InternalKey"];
        if (!string.IsNullOrEmpty(key)) http.DefaultRequestHeaders.Add("X-Internal-Key", key);
    });
}
else
{
    builder.Services.AddSingleton<IAssistantService, PlaceholderAssistantService>();
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "nilecare.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = requireHttps
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromHours(12);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
        options.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        "auth:" + (ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown"),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));
    options.AddPolicy("chat", ctx => RateLimitPartition.GetFixedWindowLimiter(
        "chat:" + (ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown"),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1) }));
});

var app = builder.Build();

if (trustProxy) app.UseForwardedHeaders();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    var cipher = scope.ServiceProvider.GetRequiredService<FieldCipher>();
    db.Database.EnsureCreated();

    if (!db.Clinics.Any())
    {
        db.Clinics.AddRange(
            new Clinic { Name = "Cardiology", Floor = "Floor 2", Phone = "02 2555 0110", Description = "Heart checkups, ECG, echo and blood pressure care." },
            new Clinic { Name = "Pediatrics", Floor = "Floor 1", Phone = "02 2555 0120", Description = "Care for babies, children and teenagers, including vaccinations." },
            new Clinic { Name = "Dermatology", Floor = "Floor 3", Phone = "02 2555 0130", Description = "Skin, hair and nail conditions and cosmetic treatments." },
            new Clinic { Name = "Orthopedics", Floor = "Floor 2", Phone = "02 2555 0140", Description = "Bones, joints, sports injuries and rehabilitation." });
    }

    if (!db.Specialties.Any())
    {
        db.Specialties.AddRange(
            new Specialty { Name = "Cardiology", Description = "Heart and blood vessels" },
            new Specialty { Name = "Pediatrics", Description = "Children and teenagers" },
            new Specialty { Name = "Dermatology", Description = "Skin, hair and nails" },
            new Specialty { Name = "Orthopedics", Description = "Bones and joints" },
            new Specialty { Name = "Neurology", Description = "Brain and nerves" },
            new Specialty { Name = "Internal Medicine", Description = "Adult general medicine" },
            new Specialty { Name = "Ophthalmology", Description = "Eyes" },
            new Specialty { Name = "ENT", Description = "Ear, nose and throat" },
            new Specialty { Name = "Gynecology", Description = "Women's health" },
            new Specialty { Name = "Dentistry", Description = "Teeth and gums" });
    }
    db.SaveChanges();

    var adminEmail = builder.Configuration["Admin:Email"]?.Trim().ToLowerInvariant();
    var adminPassword = builder.Configuration["Admin:Password"];
    if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
    {
        var hash = cipher.BlindIndex(adminEmail);
        if (!db.Users.Any(u => u.EmailHash == hash))
        {
            var admin = new User { Email = adminEmail, EmailHash = hash, FullName = "Administrator", Role = Roles.Admin };
            admin.PasswordHash = new PasswordHasher<User>().HashPassword(admin, adminPassword);
            db.Users.Add(admin);
            db.SaveChanges();
        }
    }

    // شوية بيانات ديمو
    if (cfg.GetValue("SEED_DEMO_DATA", false))
    {
        try { DemoDataSeeder.Seed(db, cipher, cfg["DEMO_PASSWORD"] ?? "Demo@12345", app.Logger); }
        catch (Exception ex) { app.Logger.LogError(ex, "Demo data could not be added."); }
    }
}

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "same-origin";
    await next();
});

if (requireHttps)
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapSpaRoutes();
app.MapControllers();

app.Run();














