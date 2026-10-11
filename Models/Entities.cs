namespace HospitalSystem.Models;

public static class Roles
{
    public const string Patient = "patient";
    public const string Doctor = "doctor";
    public const string Admin = "admin";
}

public static class AppointmentStatus
{
    public const string Booked = "booked";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";        
    public string EmailHash { get; set; } = "";   
    public string PasswordHash { get; set; } = ""; 
    public string FullName { get; set; } = "";     
    public string Phone { get; set; } = "";        
    public string Role { get; set; } = Roles.Patient;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public int FailedLogins { get; set; }
    public DateTime? LockedUntil { get; set; }
}

public class PatientProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string DateOfBirth { get; set; } = "";      
    public string Gender { get; set; } = "";
    public string BloodType { get; set; } = "";
    public string Allergies { get; set; } = "";         
    public string ChronicConditions { get; set; } = ""; 
    public string EmergencyContact { get; set; } = "";  
}

public class Clinic
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Floor { get; set; } = "";
    public string Description { get; set; } = "";
    public string Phone { get; set; } = "";
}

public class Specialty
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
}

public class Doctor
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = "";
    public int ClinicId { get; set; }
    public int SpecialtyId { get; set; }
    public int Experience { get; set; }
    public int Fee { get; set; }
    public string Days { get; set; } = "";  
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "17:00";
    public string Bio { get; set; } = "";
}

public class Appointment
{
    public int Id { get; set; }
    public int PatientUserId { get; set; }
    public string PatientName { get; set; } = ""; 
    public string Phone { get; set; } = "";       
    public int ClinicId { get; set; }
    public int DoctorId { get; set; }
    public DateOnly Date { get; set; }
    public string Time { get; set; } = "";  
    public string Status { get; set; } = AppointmentStatus.Booked;
    public string Reason { get; set; } = "";       
    public string Diagnosis { get; set; } = "";  
    public string Prescription { get; set; } = ""; 
    public string DoctorNotes { get; set; } = ""; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Review
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public int PatientUserId { get; set; }
    public int AppointmentId { get; set; }  
    public int Rating { get; set; }      
    public string Comment { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = "";
    public string Entity { get; set; } = "";
    public int? EntityId { get; set; }
    public string Ip { get; set; } = "";
    public DateTime At { get; set; } = DateTime.UtcNow;
}
