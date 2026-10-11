using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace HospitalSystem.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options, FieldCipher cipher) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<PatientProfile> PatientProfiles => Set<PatientProfile>();
    public DbSet<Clinic> Clinics => Set<Clinic>();
    public DbSet<Specialty> Specialties => Set<Specialty>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        var c = cipher;
        var encrypted = new ValueConverter<string, string>(v => c.Encrypt(v), v => c.Decrypt(v));

        b.Entity<User>().Property(u => u.Email).HasConversion(encrypted);
        b.Entity<User>().Property(u => u.FullName).HasConversion(encrypted);
        b.Entity<User>().Property(u => u.Phone).HasConversion(encrypted);

        b.Entity<PatientProfile>().Property(p => p.DateOfBirth).HasConversion(encrypted);
        b.Entity<PatientProfile>().Property(p => p.Allergies).HasConversion(encrypted);
        b.Entity<PatientProfile>().Property(p => p.ChronicConditions).HasConversion(encrypted);
        b.Entity<PatientProfile>().Property(p => p.EmergencyContact).HasConversion(encrypted);

        b.Entity<Appointment>().Property(a => a.PatientName).HasConversion(encrypted);
        b.Entity<Appointment>().Property(a => a.Phone).HasConversion(encrypted);
        b.Entity<Appointment>().Property(a => a.Reason).HasConversion(encrypted);
        b.Entity<Appointment>().Property(a => a.Diagnosis).HasConversion(encrypted);
        b.Entity<Appointment>().Property(a => a.Prescription).HasConversion(encrypted);
        b.Entity<Appointment>().Property(a => a.DoctorNotes).HasConversion(encrypted);

        b.Entity<User>().HasIndex(u => u.EmailHash).IsUnique();

        b.Entity<PatientProfile>().HasIndex(p => p.UserId).IsUnique();
        b.Entity<PatientProfile>().HasOne<User>().WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Specialty>().HasIndex(s => s.Name).IsUnique();

        b.Entity<Doctor>().HasIndex(d => d.UserId).IsUnique(); 
        b.Entity<Doctor>().HasOne<User>().WithMany().HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Doctor>().HasOne<Clinic>().WithMany().HasForeignKey(d => d.ClinicId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Doctor>().HasOne<Specialty>().WithMany().HasForeignKey(d => d.SpecialtyId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Appointment>().HasOne<Doctor>().WithMany().HasForeignKey(a => a.DoctorId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Appointment>().HasOne<User>().WithMany().HasForeignKey(a => a.PatientUserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Appointment>().HasOne<Clinic>().WithMany().HasForeignKey(a => a.ClinicId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Appointment>().HasIndex(a => new { a.DoctorId, a.Date, a.Time })
            .IsUnique()
            .HasFilter("\"Status\" <> 'cancelled'");

        b.Entity<Review>().HasIndex(r => r.AppointmentId).IsUnique();
        b.Entity<Review>().HasIndex(r => r.DoctorId);
        b.Entity<Review>().HasOne<Doctor>().WithMany().HasForeignKey(r => r.DoctorId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Review>().HasOne<User>().WithMany().HasForeignKey(r => r.PatientUserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Review>().HasOne<Appointment>().WithMany().HasForeignKey(r => r.AppointmentId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<AuditLog>().HasOne<User>().WithMany().HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<AuditLog>().HasIndex(l => l.At);
    }
}
