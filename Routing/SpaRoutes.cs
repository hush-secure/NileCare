using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace HospitalSystem.Routing;

public static class SpaRoutes
{
    public static readonly string[] Pages =
    {
        "",
        "clinics",
        "doctors",
        "book",
        "appointments",
        "login",
        "register",
        "dashboard",
        "health-profile",
        "doctor/profile",
        "admin"
    };

    public static IEndpointRouteBuilder MapSpaRoutes(this IEndpointRouteBuilder endpoints)
    {
        foreach (var page in Pages)
        {
            endpoints.MapControllerRoute(
                name: "spa-" + (page == "" ? "home" : page.Replace('/', '-')),
                pattern: page,
                defaults: new { controller = "Spa", action = "Index" });
        }

        endpoints.MapFallbackToController(
            "{*path:nonfile:regex(^(?!api/).*$)}",
            "Missing",
            "Spa");

        return endpoints;
    }
}
