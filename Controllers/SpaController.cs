using Microsoft.AspNetCore.Mvc;

namespace HospitalSystem.Controllers;

public class SpaController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Missing()
    {
        Response.StatusCode = StatusCodes.Status404NotFound;
        return View("Index");
    }
}
