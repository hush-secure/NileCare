using System.Security.Claims;
using HospitalSystem.Data;
using HospitalSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Controllers;

public record StatDto(string Label, int Value);

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        var stats = new List<StatDto>();

        if (User.IsInRole(Roles.Admin))
        {
            stats.Add(new("Patients", await db.Users.CountAsync(u => u.Role == Roles.Patient)));
            stats.Add(new("Doctors", await db.Doctors.CountAsync()));
            stats.Add(new("Clinics", await db.Clinics.CountAsync()));
            stats.Add(new("Visits today", await db.Appointments.CountAsync(a => a.Date == today && a.Status == AppointmentStatus.Booked)));
            stats.Add(new("Upcoming visits", await db.Appointments.CountAsync(a => a.Date >= today && a.Status == AppointmentStatus.Booked)));
            stats.Add(new("Completed visits", await db.Appointments.CountAsync(a => a.Status == AppointmentStatus.Completed)));
        }
        else if (User.IsInRole(Roles.Doctor))
        {
            var doctorId = await db.Doctors.Where(d => d.UserId == uid).Select(d => (int?)d.Id).FirstOrDefaultAsync();
            var mine = db.Appointments.Where(a => a.DoctorId == doctorId);
            stats.Add(new("Today", await mine.CountAsync(a => a.Date == today && a.Status == AppointmentStatus.Booked)));
            stats.Add(new("Upcoming", await mine.CountAsync(a => a.Date >= today && a.Status == AppointmentStatus.Booked)));
            stats.Add(new("Completed", await mine.CountAsync(a => a.Status == AppointmentStatus.Completed)));
            stats.Add(new("Cancelled", await mine.CountAsync(a => a.Status == AppointmentStatus.Cancelled)));
            stats.Add(new("Reviews", await db.Reviews.CountAsync(r => r.DoctorId == doctorId)));
            stats.Add(new("Different patients", await mine.Select(a => a.PatientUserId).Distinct().CountAsync()));
        }
        else
        {
            var mine = db.Appointments.Where(a => a.PatientUserId == uid);
            stats.Add(new("Upcoming", await mine.CountAsync(a => a.Date >= today && a.Status == AppointmentStatus.Booked)));
            stats.Add(new("Completed", await mine.CountAsync(a => a.Status == AppointmentStatus.Completed)));
            stats.Add(new("Cancelled", await mine.CountAsync(a => a.Status == AppointmentStatus.Cancelled)));
        }

        return Ok(stats);
    }
}
