using System.Security.Claims;
using System.Text.RegularExpressions;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Controllers;

public record RegisterRequest(string FullName, string Email, string? Phone, string Password, string Role);
public record LoginRequest(string Email, string Password);
public record UserDto(int Id, string Email, string FullName, string Phone, string Role, int? DoctorId);

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, FieldCipher cipher, AuditService audit) : ControllerBase
{
    private static readonly PasswordHasher<User> Hasher = new();
    private const int MaxFailedLogins = 5;
    private static readonly TimeSpan LockTime = TimeSpan.FromMinutes(10);

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var role = req.Role.Trim().ToLowerInvariant();

        if (req.FullName.Trim().Length < 3) return BadRequest(new { message = "Please enter your full name." });
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$")) return BadRequest(new { message = "Please enter a valid email." });
        if (req.Password.Length < 8 || !req.Password.Any(char.IsLetter) || !req.Password.Any(char.IsDigit))
            return BadRequest(new { message = "Password must be at least 8 characters with letters and numbers." });
        if (role != Roles.Patient && role != Roles.Doctor) return BadRequest(new { message = "Role must be patient or doctor." });

        var hash = cipher.BlindIndex(email);
        if (await db.Users.AnyAsync(u => u.EmailHash == hash))
            return Conflict(new { message = "This email is already registered." });

        var user = new User
        {
            Email = email,
            EmailHash = hash,
            FullName = req.FullName.Trim(),
            Phone = (req.Phone ?? "").Trim(),
            Role = role,
            LastLoginAt = DateTime.UtcNow
        };
        user.PasswordHash = Hasher.HashPassword(user, req.Password);
        db.Users.Add(user);

        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict(new { message = "This email is already registered." }); }

        await audit.Log(user.Id, "register", "User", user.Id);
        await SignInUser(user);
        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.Phone, user.Role, null));
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var hash = cipher.BlindIndex(req.Email);
        var user = await db.Users.FirstOrDefaultAsync(u => u.EmailHash == hash);

        if (user != null && user.LockedUntil > DateTime.UtcNow)
            return StatusCode(423, new { message = "Too many failed attempts. Try again in a few minutes." });

        if (user == null ||
            Hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
        {
            if (user != null)
            {
                user.FailedLogins++;
                if (user.FailedLogins >= MaxFailedLogins)
                {
                    user.LockedUntil = DateTime.UtcNow + LockTime;
                    user.FailedLogins = 0;
                }
                await db.SaveChangesAsync();
                await audit.Log(user.Id, "login_failed", "User", user.Id);
            }
            return Unauthorized(new { message = "Wrong email or password." });
        }

        user.FailedLogins = 0;
        user.LockedUntil = null;
        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await audit.Log(user.Id, "login", "User", user.Id);
        await SignInUser(user);
        return Ok(await ToDto(user));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(id);
        if (user == null)
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }
        return Ok(await ToDto(user));
    }

    private async Task<UserDto> ToDto(User u)
    {
        var doctorId = await db.Doctors.Where(d => d.UserId == u.Id).Select(d => (int?)d.Id).FirstOrDefaultAsync();
        return new UserDto(u.Id, u.Email, u.FullName, u.Phone, u.Role, doctorId);
    }

    private Task SignInUser(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role)
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        return HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true });
    }
}
