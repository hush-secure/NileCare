using System.Security.Claims;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Controllers;

public record NewAppointmentRequest(string PatientName, string Phone, int ClinicId, int DoctorId, string Date,
    string Time, string? Reason);
public record CompleteRequest(string Diagnosis, string Prescription, string? Notes);
public record ReviewRequest(int Rating, string? Comment);
public record AppointmentDto(int Id, string PatientName, string Phone, int ClinicId, int DoctorId, DateOnly Date,
    string Time, string Status, string Reason, string Diagnosis, string Prescription, string DoctorNotes, int Rating);

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController(AppDbContext db, AuditService audit) : ControllerBase
{
    private const string TakenMessage = "Sorry, this time was just booked. Please choose another one.";

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<int?> MyDoctorId()
    {
        var uid = UserId;
        return await db.Doctors.Where(d => d.UserId == uid).Select(d => (int?)d.Id).FirstOrDefaultAsync();
    }

    private static AppointmentDto Map(Appointment a, bool forDoctor, int rating = 0) =>
        new(a.Id, a.PatientName, a.Phone, a.ClinicId, a.DoctorId, a.Date, a.Time, a.Status, a.Reason,
            a.Diagnosis, a.Prescription, forDoctor ? a.DoctorNotes : "", rating);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        IQueryable<Appointment> query = db.Appointments;
        var isDoctor = User.IsInRole(Roles.Doctor);

        if (isDoctor)
        {
            var doctorId = await MyDoctorId();
            query = query.Where(a => a.DoctorId == doctorId);
        }
        else if (User.IsInRole(Roles.Patient))
        {
            var uid = UserId;
            query = query.Where(a => a.PatientUserId == uid);
        }
        else
        {
            return Ok(Array.Empty<AppointmentDto>());
        }

        var list = await query.OrderBy(a => a.Date).ThenBy(a => a.Time).ToListAsync();
        var ids = list.Select(a => a.Id).ToList();
        var ratings = await db.Reviews.Where(r => ids.Contains(r.AppointmentId))
            .ToDictionaryAsync(r => r.AppointmentId, r => r.Rating);
        return Ok(list.Select(a => Map(a, isDoctor, ratings.GetValueOrDefault(a.Id))));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> Create(NewAppointmentRequest req)
    {
        if (!DateOnly.TryParseExact(req.Date, "yyyy-MM-dd", out var day))
            return BadRequest(new { message = "Invalid date." });
            
        if (day < DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3))) 
            return BadRequest(new { message = "The date cannot be in the past." });
            
        if (req.PatientName.Trim().Length < 3) return BadRequest(new { message = "Please enter your full name." });

        if (req.Phone.Trim().Length < 10) return BadRequest(new { message = "Please enter a valid phone number." });
        
        if ((req.Reason ?? "").Length > 500) return BadRequest(new { message = "The reason is too long." });

        var doctor = await db.Doctors.FindAsync(req.DoctorId);
        if (doctor == null) return BadRequest(new { message = "Doctor not found." });
        if (doctor.ClinicId != req.ClinicId) return BadRequest(new { message = "This doctor does not work in that clinic." });
        if (!Schedule.WorksOn(doctor.Days, day)) return BadRequest(new { message = "The doctor does not work on that day." });
        if (!Schedule.Times(doctor.StartTime, doctor.EndTime).Contains(req.Time)) return BadRequest(new { message = "Invalid time." });

        var taken = await db.Appointments.AnyAsync(a =>
            a.DoctorId == doctor.Id && a.Date == day && a.Time == req.Time && a.Status != AppointmentStatus.Cancelled);
        if (taken) return Conflict(new { message = TakenMessage });

        var appointment = new Appointment
        {
            PatientUserId = UserId,
            PatientName = req.PatientName.Trim(),
            Phone = req.Phone.Trim(),
            ClinicId = doctor.ClinicId,
            DoctorId = doctor.Id,
            Date = day,
            Time = req.Time,
            Reason = (req.Reason ?? "").Trim()
        };
        db.Appointments.Add(appointment);

        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict(new { message = TakenMessage }); } 
        
        await audit.Log(UserId, "book_appointment", "Appointment", appointment.Id);
        return Ok(Map(appointment, false));
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var appointment = await FindMine(id);
        if (appointment == null) return NotFound(new { message = "Appointment not found." });
        if (appointment.Status != AppointmentStatus.Booked)
            return BadRequest(new { message = "Only booked appointments can be cancelled." });

        appointment.Status = AppointmentStatus.Cancelled;
        await db.SaveChangesAsync();
        await audit.Log(UserId, "cancel_appointment", "Appointment", id);
        return Ok(Map(appointment, User.IsInRole(Roles.Doctor)));
    }

    [HttpPost("{id:int}/complete")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<IActionResult> Complete(int id, CompleteRequest req)
    {
        var appointment = await FindMine(id);
        if (appointment == null) return NotFound(new { message = "Appointment not found." });
        if (appointment.Status != AppointmentStatus.Booked)
            return BadRequest(new { message = "Only booked appointments can be completed." });
        if (appointment.Date > DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)))
            return BadRequest(new { message = "You cannot complete a visit that is still in the future." });
        if (req.Diagnosis.Trim().Length < 2) return BadRequest(new { message = "Please write the diagnosis." });

        appointment.Status = AppointmentStatus.Completed;
        appointment.Diagnosis = req.Diagnosis.Trim();
        appointment.Prescription = req.Prescription.Trim();
        appointment.DoctorNotes = (req.Notes ?? "").Trim();
        await db.SaveChangesAsync();
        await audit.Log(UserId, "complete_appointment", "Appointment", id);
        return Ok(Map(appointment, true));
    }

    [HttpPost("{id:int}/review")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> AddReview(int id, ReviewRequest req)
    {
        var appointment = await FindMine(id);
        if (appointment == null) return NotFound(new { message = "Appointment not found." });
        if (appointment.Status != AppointmentStatus.Completed)
            return BadRequest(new { message = "You can rate a visit only after it is completed." });
        if (req.Rating < 1 || req.Rating > 5) return BadRequest(new { message = "Choose a rating from 1 to 5." });
        if ((req.Comment ?? "").Length > 500) return BadRequest(new { message = "The comment is too long." });
        if (await db.Reviews.AnyAsync(r => r.AppointmentId == id))
            return Conflict(new { message = "You already rated this visit." });

        var review = new Review
        {
            DoctorId = appointment.DoctorId,
            PatientUserId = UserId,
            AppointmentId = id,
            Rating = req.Rating,
            Comment = (req.Comment ?? "").Trim()
        };
        db.Reviews.Add(review);

        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) { return Conflict(new { message = "You already rated this visit." }); }

        await audit.Log(UserId, "add_review", "Review", review.Id);
        return Ok(Map(appointment, false, review.Rating));
    }

    [HttpGet("{id:int}/patient-profile")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<IActionResult> PatientProfile(int id)
    {
        var appointment = await FindMine(id);
        if (appointment == null) return NotFound(new { message = "Appointment not found." });

        var patientId = appointment.PatientUserId;
        var profile = await db.PatientProfiles.FirstOrDefaultAsync(p => p.UserId == patientId);
        await audit.Log(UserId, "view_patient_profile", "PatientProfile", profile?.Id);
        return Ok(profile == null ? new PatientProfileDto("", "", "", "", "", "") : PatientProfileController.ToDto(profile));
    }

    private async Task<Appointment?> FindMine(int id)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment == null) return null;

        var allowed = User.IsInRole(Roles.Doctor)
            ? appointment.DoctorId == await MyDoctorId()
            : appointment.PatientUserId == UserId;
        return allowed ? appointment : null;
    }
}
