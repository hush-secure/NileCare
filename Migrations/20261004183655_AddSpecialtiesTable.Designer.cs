using System;
using HospitalSystem.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HospitalSystem.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261004183655_AddSpecialtiesTable")]
    partial class AddSpecialtiesTable
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.20")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("HospitalSystem.Models.Appointment", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<int>("ClinicId")
                        .HasColumnType("integer");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateOnly>("Date")
                        .HasColumnType("date");

                    b.Property<string>("Diagnosis")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("DoctorId")
                        .HasColumnType("integer");

                    b.Property<string>("DoctorNotes")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("PatientName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("PatientUserId")
                        .HasColumnType("integer");

                    b.Property<string>("Phone")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Prescription")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Reason")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Time")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("ClinicId");

                    b.HasIndex("PatientUserId");

                    b.HasIndex("DoctorId", "Date", "Time")
                        .IsUnique()
                        .HasFilter("\"Status\" <> 'cancelled'");

                    b.ToTable("Appointments");
                });

            modelBuilder.Entity("HospitalSystem.Models.AuditLog", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Action")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("At")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Entity")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int?>("EntityId")
                        .HasColumnType("integer");

                    b.Property<string>("Ip")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int?>("UserId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("At");

                    b.HasIndex("UserId");

                    b.ToTable("AuditLogs");
                });

            modelBuilder.Entity("HospitalSystem.Models.Clinic", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Floor")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Phone")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Clinics");
                });

            modelBuilder.Entity("HospitalSystem.Models.Doctor", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Bio")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("ClinicId")
                        .HasColumnType("integer");

                    b.Property<string>("Days")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("EndTime")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("Experience")
                        .HasColumnType("integer");

                    b.Property<int>("Fee")
                        .HasColumnType("integer");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("SpecialtyId")
                        .HasColumnType("integer");

                    b.Property<string>("StartTime")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("UserId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("ClinicId");

                    b.HasIndex("SpecialtyId");

                    b.HasIndex("UserId")
                        .IsUnique();

                    b.ToTable("Doctors");
                });

            modelBuilder.Entity("HospitalSystem.Models.PatientProfile", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Allergies")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("BloodType")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("ChronicConditions")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("DateOfBirth")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("EmergencyContact")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Gender")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("UserId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("UserId")
                        .IsUnique();

                    b.ToTable("PatientProfiles");
                });

            modelBuilder.Entity("HospitalSystem.Models.Review", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<int>("AppointmentId")
                        .HasColumnType("integer");

                    b.Property<string>("Comment")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<int>("DoctorId")
                        .HasColumnType("integer");

                    b.Property<int>("PatientUserId")
                        .HasColumnType("integer");

                    b.Property<int>("Rating")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("AppointmentId")
                        .IsUnique();

                    b.HasIndex("DoctorId");

                    b.HasIndex("PatientUserId");

                    b.ToTable("Reviews");
                });

            modelBuilder.Entity("HospitalSystem.Models.Specialty", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("Specialties");
                });

            modelBuilder.Entity("HospitalSystem.Models.User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("EmailHash")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int>("FailedLogins")
                        .HasColumnType("integer");

                    b.Property<string>("FullName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<DateTime?>("LastLoginAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("LockedUntil")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Phone")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Role")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("EmailHash")
                        .IsUnique();

                    b.ToTable("Users");
                });

            modelBuilder.Entity("HospitalSystem.Models.Appointment", b =>
                {
                    b.HasOne("HospitalSystem.Models.Clinic", null)
                        .WithMany()
                        .HasForeignKey("ClinicId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("HospitalSystem.Models.Doctor", null)
                        .WithMany()
                        .HasForeignKey("DoctorId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("HospitalSystem.Models.User", null)
                        .WithMany()
                        .HasForeignKey("PatientUserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("HospitalSystem.Models.AuditLog", b =>
                {
                    b.HasOne("HospitalSystem.Models.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.SetNull);
                });

            modelBuilder.Entity("HospitalSystem.Models.Doctor", b =>
                {
                    b.HasOne("HospitalSystem.Models.Clinic", null)
                        .WithMany()
                        .HasForeignKey("ClinicId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("HospitalSystem.Models.Specialty", null)
                        .WithMany()
                        .HasForeignKey("SpecialtyId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("HospitalSystem.Models.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("HospitalSystem.Models.PatientProfile", b =>
                {
                    b.HasOne("HospitalSystem.Models.User", null)
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("HospitalSystem.Models.Review", b =>
                {
                    b.HasOne("HospitalSystem.Models.Appointment", null)
                        .WithMany()
                        .HasForeignKey("AppointmentId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("HospitalSystem.Models.Doctor", null)
                        .WithMany()
                        .HasForeignKey("DoctorId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("HospitalSystem.Models.User", null)
                        .WithMany()
                        .HasForeignKey("PatientUserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });
#pragma warning restore 612, 618
        }
    }
}
