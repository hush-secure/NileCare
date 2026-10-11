using System.Security.Claims;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Controllers;

public record DoctorProfileRequest(string Name, int ClinicId, int SpecialtyId, int Experience, int Fee,
    string Days, string StartTime, string EndTime, string? Bio);

[ApiController]
[Route("api/doctor/profile")]
[Authorize(Roles = Roles.Doctor)]
public class DoctorProfileController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpPut]
    public async Task<IActionResult> Save(DoctorProfileRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var days = req.Days.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(d => Schedule.DayNames.FirstOrDefault(n => n.Equals(d, StringComparison.OrdinalIgnoreCase)))
            .Where(d => d != null)
            .Distinct()
            .ToList();

        if (req.Name.Trim().Length < 3) return BadRequest(new { message = "Please enter your name." });
        if (req.Experience < 0 || req.Experience > 70) return BadRequest(new { message = "Invalid years of experience." });
        if (req.Fee < 0) return BadRequest(new { message = "Invalid fee." });
        if (days.Count == 0) return BadRequest(new { message = "Choose at least one working day." });
        if (!Schedule.IsValidTime(req.StartTime) || !Schedule.IsValidTime(req.EndTime) ||
            Schedule.Times(req.StartTime, req.EndTime).Count == 0)
            return BadRequest(new { message = "Working hours are not valid (the end must be after the start)." });
        if (!await db.Clinics.AnyAsync(c => c.Id == req.ClinicId)) return BadRequest(new { message = "Choose a clinic." });
        if (!await db.Specialties.AnyAsync(s => s.Id == req.SpecialtyId)) return BadRequest(new { message = "Choose a specialty." });

        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        if (doctor == null)
        {
            doctor = new Doctor { UserId = userId };
            db.Doctors.Add(doctor);
        }

        doctor.Name = req.Name.Trim();
        doctor.ClinicId = req.ClinicId;
        doctor.SpecialtyId = req.SpecialtyId;
        doctor.Experience = req.Experience;
        doctor.Fee = req.Fee;
        doctor.Days = string.Join(", ", days);
        doctor.StartTime = req.StartTime;
        doctor.EndTime = req.EndTime;
        doctor.Bio = (req.Bio ?? "").Trim();

        await db.SaveChangesAsync();

        var clinicId = doctor.ClinicId;
        var doctorId = doctor.Id;
        await db.Appointments.Where(a => a.DoctorId == doctorId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.ClinicId, clinicId));

        await audit.Log(userId, "save_doctor_profile", "Doctor", doctor.Id);

        var dto = await DoctorQueries.ById(db, doctor.Id).FirstAsync();
        return Ok(dto);
    }
}
