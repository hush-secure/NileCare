using HospitalSystem.Data;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HospitalSystem.Models;

namespace HospitalSystem.Controllers;

public record DoctorDto(int Id, string Name, int ClinicId, int SpecialtyId, string Specialty, int Experience,
    int Fee, string Days, string StartTime, string EndTime, string Bio, double Rating, int ReviewCount);
public record ReviewDto(int Id, string PatientName, int Rating, string Comment, DateTime CreatedAt);
public record SlotDto(string Time, bool Available);

public static class DoctorQueries
{
    public static IQueryable<DoctorDto> All(AppDbContext db) => ForDoctors(db, db.Doctors);

    public static IQueryable<DoctorDto> ById(AppDbContext db, int id) =>
        ForDoctors(db, db.Doctors.Where(d => d.Id == id));

    private static IQueryable<DoctorDto> ForDoctors(AppDbContext db, IQueryable<Doctor> doctors) =>
        doctors
            .Join(db.Specialties, d => d.SpecialtyId, s => s.Id, (d, s) => new { d, s })
            .OrderBy(x => x.d.Id)
            .Select(x => new DoctorDto(
                x.d.Id, x.d.Name, x.d.ClinicId, x.d.SpecialtyId, x.s.Name,
                x.d.Experience, x.d.Fee, x.d.Days, x.d.StartTime, x.d.EndTime, x.d.Bio,
                db.Reviews.Where(r => r.DoctorId == x.d.Id).Average(r => (double?)r.Rating) ?? 0,
                db.Reviews.Count(r => r.DoctorId == x.d.Id)));
}
[ApiController]
[Route("api")]
public class CatalogController(AppDbContext db) : ControllerBase
{
    [HttpGet("clinics")]
    public async Task<IActionResult> Clinics() =>
        Ok(await db.Clinics.OrderBy(c => c.Id).ToListAsync());

    [HttpGet("specialties")]
    public async Task<IActionResult> Specialties() =>
        Ok(await db.Specialties.OrderBy(s => s.Name).ToListAsync());

    [HttpGet("doctors")]
    public async Task<IActionResult> Doctors() =>
        Ok(await DoctorQueries.All(db).ToListAsync());

    [HttpGet("doctors/{id:int}/reviews")]
    public async Task<IActionResult> Reviews(int id)
    {
        var reviews = await db.Reviews.Where(r => r.DoctorId == id)
            .OrderByDescending(r => r.CreatedAt).Take(50).ToListAsync();
        var ids = reviews.Select(r => r.PatientUserId).Distinct().ToList();
        var users = await db.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        var names = users.ToDictionary(u => u.Id, u => ShortName(u.FullName));

        return Ok(reviews.Select(r => new ReviewDto(r.Id, names.GetValueOrDefault(r.PatientUserId, "Patient"),
            r.Rating, r.Comment, r.CreatedAt)));
    }

    private static string ShortName(string full)
    {
        var parts = full.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0) return "Patient";
        return parts.Length == 1 ? parts[0] : parts[0] + " " + parts[^1][0] + ".";
    }

    [HttpGet("doctors/{id:int}/slots")]
    public async Task<IActionResult> Slots(int id, [FromQuery] string date)
    {
        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out var day))
            return BadRequest(new { message = "Invalid date." });

        var doctor = await db.Doctors.FindAsync(id);
        if (doctor == null) return NotFound(new { message = "Doctor not found." });

        if (!Schedule.WorksOn(doctor.Days, day)) return Ok(Array.Empty<SlotDto>());

        var booked = await db.Appointments
            .Where(a => a.DoctorId == id && a.Date == day && a.Status != "cancelled")
            .Select(a => a.Time)
            .ToListAsync();

        return Ok(Schedule.Times(doctor.StartTime, doctor.EndTime).Select(t => new SlotDto(t, !booked.Contains(t))));
    }
}
