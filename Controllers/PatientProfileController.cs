using System.Security.Claims;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Controllers;

public record PatientProfileDto(string DateOfBirth, string Gender, string BloodType, string Allergies,
    string ChronicConditions, string EmergencyContact);

[ApiController]
[Route("api/patient/profile")]
[Authorize(Roles = Roles.Patient)]
public class PatientProfileController(AppDbContext db, AuditService audit) : ControllerBase
{
    private static readonly string[] Genders = { "", "male", "female" };
    private static readonly string[] BloodTypes = { "", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var uid = UserId;
        var p = await db.PatientProfiles.FirstOrDefaultAsync(x => x.UserId == uid);
        return Ok(p == null ? new PatientProfileDto("", "", "", "", "", "") : ToDto(p));
    }

    [HttpPut]
    public async Task<IActionResult> Save(PatientProfileDto req)
    {
        if (req.DateOfBirth != "" && !DateOnly.TryParseExact(req.DateOfBirth, "yyyy-MM-dd", out var dob))
            return BadRequest(new { message = "Invalid date of birth." });
        if (req.DateOfBirth != "" && DateOnly.ParseExact(req.DateOfBirth, "yyyy-MM-dd") > DateOnly.FromDateTime(DateTime.UtcNow))
            return BadRequest(new { message = "Date of birth cannot be in the future." });
        if (!Genders.Contains(req.Gender)) return BadRequest(new { message = "Invalid gender." });
        if (!BloodTypes.Contains(req.BloodType)) return BadRequest(new { message = "Invalid blood type." });

        var uid = UserId;
        var p = await db.PatientProfiles.FirstOrDefaultAsync(x => x.UserId == uid);
        if (p == null)
        {
            p = new PatientProfile { UserId = uid };
            db.PatientProfiles.Add(p);
        }

        p.DateOfBirth = req.DateOfBirth;
        p.Gender = req.Gender;
        p.BloodType = req.BloodType;
        p.Allergies = req.Allergies.Trim();
        p.ChronicConditions = req.ChronicConditions.Trim();
        p.EmergencyContact = req.EmergencyContact.Trim();
        await db.SaveChangesAsync();

        await audit.Log(uid, "save_patient_profile", "PatientProfile", p.Id);
        return Ok(ToDto(p));
    }

    public static PatientProfileDto ToDto(PatientProfile p) =>
        new(p.DateOfBirth, p.Gender, p.BloodType, p.Allergies, p.ChronicConditions, p.EmergencyContact);
}
