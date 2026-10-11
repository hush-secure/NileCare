using System.Security.Claims;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Controllers;

public record ClinicRequest(string Name, string Floor, string Description, string Phone);
public record SpecialtyRequest(string Name, string? Description);
public record AdminUserDto(int Id, string FullName, string Email, string Role, DateTime CreatedAt, DateTime? LastLoginAt);
public record AdminReviewDto(int Id, string DoctorName, string PatientName, int Rating, string Comment, DateTime CreatedAt);
public record AuditDto(int Id, string UserName, string Action, string Entity, int? EntityId, string Ip, DateTime At);

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController(AppDbContext db, AuditService audit) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("clinics")]
    public async Task<IActionResult> AddClinic(ClinicRequest req)
    {
        if (req.Name.Trim().Length < 2) return BadRequest(new { message = "Please enter the clinic name." });
        var clinic = new Clinic { Name = req.Name.Trim(), Floor = req.Floor.Trim(), Description = req.Description.Trim(), Phone = req.Phone.Trim() };
        db.Clinics.Add(clinic);
        await db.SaveChangesAsync();
        await audit.Log(UserId, "add_clinic", "Clinic", clinic.Id);
        return Ok(clinic);
    }

    [HttpDelete("clinics/{id:int}")]
    public async Task<IActionResult> DeleteClinic(int id)
    {
        var clinic = await db.Clinics.FindAsync(id);
        if (clinic == null) return NotFound(new { message = "Clinic not found." });
        if (await db.Doctors.AnyAsync(d => d.ClinicId == id) || await db.Appointments.AnyAsync(a => a.ClinicId == id))
            return Conflict(new { message = "This clinic has doctors or appointments, so it cannot be deleted." });

        db.Clinics.Remove(clinic);
        await db.SaveChangesAsync();
        await audit.Log(UserId, "delete_clinic", "Clinic", id);
        return NoContent();
    }

    [HttpPost("specialties")]
    public async Task<IActionResult> AddSpecialty(SpecialtyRequest req)
    {
        var name = req.Name.Trim();
        if (name.Length < 2) return BadRequest(new { message = "Please enter the specialty name." });
        if (await db.Specialties.AnyAsync(s => s.Name == name)) return Conflict(new { message = "This specialty already exists." });

        var specialty = new Specialty { Name = name, Description = (req.Description ?? "").Trim() };
        db.Specialties.Add(specialty);
        await db.SaveChangesAsync();
        await audit.Log(UserId, "add_specialty", "Specialty", specialty.Id);
        return Ok(specialty);
    }

    [HttpDelete("specialties/{id:int}")]
    public async Task<IActionResult> DeleteSpecialty(int id)
    {
        var specialty = await db.Specialties.FindAsync(id);
        if (specialty == null) return NotFound(new { message = "Specialty not found." });
        if (await db.Doctors.AnyAsync(d => d.SpecialtyId == id))
            return Conflict(new { message = "Doctors use this specialty, so it cannot be deleted." });

        db.Specialties.Remove(specialty);
        await db.SaveChangesAsync();
        await audit.Log(UserId, "delete_specialty", "Specialty", id);
        return NoContent();
    }

    [HttpGet("reviews")]
    public async Task<IActionResult> Reviews()
    {
        var reviews = await db.Reviews.OrderByDescending(r => r.CreatedAt).Take(100).ToListAsync();
        var doctorIds = reviews.Select(r => r.DoctorId).Distinct().ToList();
        var patientIds = reviews.Select(r => r.PatientUserId).Distinct().ToList();
        var doctors = await db.Doctors.Where(d => doctorIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, d => d.Name);
        var patients = (await db.Users.Where(u => patientIds.Contains(u.Id)).ToListAsync())
            .ToDictionary(u => u.Id, u => u.FullName);

        return Ok(reviews.Select(r => new AdminReviewDto(r.Id,
            doctors.GetValueOrDefault(r.DoctorId, "-"), patients.GetValueOrDefault(r.PatientUserId, "-"),
            r.Rating, r.Comment, r.CreatedAt)));
    }

    [HttpDelete("reviews/{id:int}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await db.Reviews.FindAsync(id);
        if (review == null) return NotFound(new { message = "Review not found." });
        db.Reviews.Remove(review);
        await db.SaveChangesAsync();
        await audit.Log(UserId, "delete_review", "Review", id);
        return NoContent();
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users()
    {
        var users = await db.Users.OrderByDescending(u => u.CreatedAt).Take(200).ToListAsync();
        return Ok(users.Select(u => new AdminUserDto(u.Id, u.FullName, u.Email, u.Role, u.CreatedAt, u.LastLoginAt)));
    }

    [HttpGet("audit")]
    public async Task<IActionResult> Audit()
    {
        var logs = await db.AuditLogs.OrderByDescending(l => l.At).Take(100).ToListAsync();
        var ids = logs.Where(l => l.UserId != null).Select(l => l.UserId!.Value).Distinct().ToList();
        var names = (await db.Users.Where(u => ids.Contains(u.Id)).ToListAsync()).ToDictionary(u => u.Id, u => u.FullName);

        return Ok(logs.Select(l => new AuditDto(l.Id,
            l.UserId != null && names.TryGetValue(l.UserId.Value, out var n) ? n : "-",
            l.Action, l.Entity, l.EntityId, l.Ip, l.At)));
    }
}
