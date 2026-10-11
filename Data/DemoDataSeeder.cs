using System.Globalization;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HospitalSystem.Data;

public static class DemoDataSeeder
{
    public const string Domain = "nilecare.test";
    private const string MainPatientEmail = "patient@" + Domain;
    private const int PatientCount = 48;

    private sealed record DoctorSeed(string Name, string Specialty, int Years, int Fee, string Days, string Start, string End);

    private static readonly DoctorSeed[] Doctors =
    {
        new("Ahmed Samir", "Orthopedics", 18, 600, "Sat, Sun, Mon, Tue, Wed, Thu", "09:00", "15:00"),
        new("Mona Fouad", "Orthopedics", 11, 450, "Sun, Tue, Thu", "13:00", "19:00"),
        new("Omar Farouk", "Orthopedics", 25, 800, "Mon, Wed", "15:00", "20:00"),
        new("Tarek Hassan", "Cardiology", 22, 700, "Sat, Mon, Wed", "10:00", "16:00"),
        new("Heba Mansour", "Cardiology", 12, 500, "Sun, Tue, Thu", "14:00", "20:00"),
        new("Mostafa El-Gendy", "Cardiology", 30, 900, "Sat, Tue", "16:00", "20:00"),
        new("Dina Fathy", "Pediatrics", 14, 400, "Sat, Sun, Mon, Tue, Wed, Thu", "09:00", "15:00"),
        new("Karim Adel", "Pediatrics", 8, 300, "Sun, Tue, Thu", "15:00", "20:00"),
        new("Noha Abdel Aziz", "Pediatrics", 20, 450, "Mon, Wed", "10:00", "16:00"),
        new("Sara Nabil", "Dermatology", 9, 350, "Sat, Mon, Wed", "12:00", "18:00"),
        new("Youssef Gamal", "Dermatology", 16, 500, "Sun, Tue", "10:00", "16:00"),
        new("Mariam Zaki", "Dermatology", 6, 300, "Thu, Sat", "16:00", "20:00"),
        new("Yasmin Gamal", "Neurology", 13, 550, "Sun, Tue", "10:00", "16:00"),
        new("Hossam Ragab", "Neurology", 27, 850, "Sat, Wed", "14:00", "20:00"),
        new("Amr Sherif", "Internal Medicine", 17, 400, "Sat, Sun, Mon, Tue, Wed, Thu", "09:00", "15:00"),
        new("Lamia Saad", "Internal Medicine", 10, 350, "Sat, Mon, Wed", "14:00", "20:00"),
        new("Walid Mahmoud", "Internal Medicine", 28, 600, "Sun, Thu", "11:00", "17:00"),
        new("Rania Khaled", "Ophthalmology", 15, 450, "Sun, Tue, Thu", "10:00", "16:00"),
        new("Adel Wahba", "Ophthalmology", 21, 600, "Sat, Mon", "15:00", "20:00"),
        new("Sherif Anwar", "ENT", 19, 450, "Sun, Wed", "10:00", "16:00"),
        new("Reem Taha", "ENT", 7, 350, "Tue, Thu, Sat", "13:00", "19:00"),
        new("Hala Ibrahim", "Gynecology", 23, 600, "Sat, Mon, Wed", "11:00", "17:00"),
        new("Dalia Younis", "Gynecology", 12, 450, "Sun, Tue, Thu", "14:00", "20:00"),
        new("Nermine Fawzy", "Gynecology", 30, 800, "Tue, Thu", "16:00", "20:00"),
        new("Hazem Lotfy", "Dentistry", 9, 300, "Sat, Sun, Mon, Tue, Wed, Thu", "12:00", "20:00"),
        new("Salma Reda", "Dentistry", 6, 250, "Sun, Tue, Thu", "10:00", "16:00"),
        new("Tamer Soliman", "Dentistry", 18, 500, "Mon, Wed, Sat", "14:00", "20:00"),
        new("Ashraf Kamel", "Urology", 24, 650, "Sat, Tue", "13:00", "19:00"),
        new("Mahmoud Ezzat", "Urology", 11, 450, "Sun, Wed", "10:00", "16:00"),
        new("Ghada Hamed", "Psychiatry", 16, 600, "Sun, Tue, Thu", "15:00", "20:00"),
        new("Ibrahim Nour", "Psychiatry", 10, 500, "Sat, Mon", "11:00", "17:00"),
        new("Laila Sabry", "Endocrinology", 19, 550, "Sat, Wed", "10:00", "16:00"),
        new("Sameh Barakat", "Endocrinology", 13, 450, "Mon, Thu", "14:00", "20:00"),
        new("Medhat Zaher", "Gastroenterology", 26, 700, "Sun, Tue", "12:00", "18:00"),
        new("Nadine Alaa", "Gastroenterology", 8, 400, "Sat, Wed, Thu", "10:00", "16:00"),
        new("Wael Abdallah", "Pulmonology", 20, 600, "Sat, Tue", "11:00", "17:00"),
        new("Hend Salah", "Pulmonology", 9, 400, "Sun, Thu", "15:00", "20:00"),
        new("Rana Elsayed", "Nutrition", 7, 300, "Sat, Mon, Wed", "12:00", "18:00"),
        new("Moataz Fahmy", "Nutrition", 11, 350, "Sun, Tue, Thu", "16:00", "20:00"),
        new("Aya Mostafa", "Physiotherapy", 6, 300, "Sat, Sun, Mon, Tue, Wed, Thu", "09:00", "17:00"),
        new("Khaled Younes", "Physiotherapy", 14, 400, "Sat, Mon, Wed", "13:00", "20:00"),
    };

    private static readonly (string Name, string Description, string Floor, string ClinicDescription)[] SpecialtyInfo =
    {
        ("Cardiology", "Heart and blood vessels", "Floor 2", "Heart checkups, ECG, echo and blood pressure care."),
        ("Pediatrics", "Children and teenagers", "Floor 1", "Care for babies, children and teenagers, including vaccinations."),
        ("Dermatology", "Skin, hair and nails", "Floor 3", "Skin, hair and nail conditions and cosmetic treatments."),
        ("Orthopedics", "Bones and joints", "Floor 2", "Bones, joints, sports injuries and rehabilitation."),
        ("Neurology", "Brain and nerves", "Floor 4", "Headaches, nerve disorders, epilepsy and stroke follow-up."),
        ("Internal Medicine", "Adult general medicine", "Floor 1", "General adult care, chronic disease follow-up and checkups."),
        ("Ophthalmology", "Eyes", "Floor 3", "Eye exams, glasses, cataract and retina care."),
        ("ENT", "Ear, nose and throat", "Floor 3", "Hearing, sinus, tonsil and voice problems."),
        ("Gynecology", "Women's health", "Floor 4", "Pregnancy care, women's health and fertility."),
        ("Dentistry", "Teeth and gums", "Floor 1", "Fillings, cleaning, orthodontics and dental surgery."),
        ("Urology", "Kidneys, bladder and male reproductive health", "Floor 4", "Kidney stones, urinary tract and prostate care."),
        ("Psychiatry", "Mental health and behavior", "Floor 5", "Anxiety, depression, sleep and behavior therapy."),
        ("Endocrinology", "Diabetes, thyroid and hormones", "Floor 5", "Diabetes, thyroid and hormone disorders."),
        ("Gastroenterology", "Stomach, liver and digestion", "Floor 5", "Digestive problems, liver care and endoscopy."),
        ("Pulmonology", "Lungs and breathing", "Floor 5", "Asthma, chronic cough and sleep breathing tests."),
        ("Nutrition", "Diet plans and weight management", "Floor 1", "Personal diet plans and weight management."),
        ("Physiotherapy", "Rehabilitation and movement", "Floor 2", "Rehabilitation after injuries and surgery."),
    };

    private static readonly Dictionary<string, string> BioCore = new()
    {
        ["Cardiology"] = "Consultant cardiologist with {0} years of experience in heart disease, ECG, echo and blood pressure care.",
        ["Pediatrics"] = "Pediatrician with {0} years of experience caring for babies, children and teenagers, including vaccinations.",
        ["Dermatology"] = "Dermatologist with {0} years of experience in skin, hair and nail conditions and cosmetic treatments.",
        ["Orthopedics"] = "Orthopedic specialist with {0} years of experience in joint problems, sports injuries and fractures.",
        ["Neurology"] = "Neurologist with {0} years of experience treating headaches, nerve disorders and epilepsy.",
        ["Internal Medicine"] = "Internal medicine physician with {0} years of experience in adult general care and chronic diseases.",
        ["Ophthalmology"] = "Eye specialist with {0} years of experience in eye exams, cataract and retina care.",
        ["ENT"] = "ENT specialist with {0} years of experience in hearing, sinus, tonsil and voice problems.",
        ["Gynecology"] = "Obstetrician and gynecologist with {0} years of experience in pregnancy care and women's health.",
        ["Dentistry"] = "Dentist with {0} years of experience in fillings, orthodontics and cosmetic dentistry.",
        ["Urology"] = "Urologist with {0} years of experience in kidney stones, urinary tract and prostate care.",
        ["Psychiatry"] = "Psychiatrist with {0} years of experience in anxiety, depression and sleep disorders.",
        ["Endocrinology"] = "Endocrinologist with {0} years of experience in diabetes, thyroid and hormone disorders.",
        ["Gastroenterology"] = "Gastroenterologist with {0} years of experience in digestive and liver diseases and endoscopy.",
        ["Pulmonology"] = "Chest physician with {0} years of experience in asthma, chronic cough and sleep breathing disorders.",
        ["Nutrition"] = "Clinical nutritionist with {0} years of experience in weight management and diet plans for chronic diseases.",
        ["Physiotherapy"] = "Physiotherapist with {0} years of experience in rehabilitation after injuries and surgery.",
    };

    private static readonly string[] BioSuffix =
    {
        "Known for clear explanations and a calm approach.",
        "Speaks Arabic and English.",
        "Active in medical training and research.",
        "Offers follow-up by phone for existing patients.",
    };

    private static readonly Dictionary<string, (string[] Reasons, string[] Diagnoses, string[] Prescriptions)> Clinical = new()
    {
        ["Cardiology"] = (new[] { "Chest tightness when climbing stairs", "Routine heart checkup", "High blood pressure follow-up" },
            new[] { "Mild hypertension", "Normal ECG and echo, no acute findings", "Benign palpitations" },
            new[] { "Amlodipine 5 mg once daily", "Low-salt diet and walking 30 minutes daily" }),
        ["Pediatrics"] = (new[] { "Fever and cough for three days", "Routine vaccination", "Poor appetite" },
            new[] { "Viral upper respiratory infection", "Growth and development normal", "Mild iron deficiency" },
            new[] { "Paracetamol syrup when needed and plenty of fluids", "Iron drops once daily for 8 weeks" }),
        ["Dermatology"] = (new[] { "Itchy rash on the arms", "Acne that is getting worse", "Hair loss" },
            new[] { "Contact dermatitis", "Moderate acne", "Seborrheic dermatitis" },
            new[] { "Topical steroid cream twice daily for 7 days", "Gentle cleanser and benzoyl peroxide gel" }),
        ["Orthopedics"] = (new[] { "Knee pain for two weeks", "Lower back pain after lifting", "Shoulder pain when raising the arm" },
            new[] { "Mild knee osteoarthritis", "Lumbar muscle strain", "Rotator cuff tendinitis" },
            new[] { "Anti-inflammatory gel and physiotherapy for 4 weeks", "Rest, hot packs and gentle stretching" }),
        ["Neurology"] = (new[] { "Frequent headaches", "Numbness in the hands", "Dizziness and poor sleep" },
            new[] { "Tension-type headache", "Mild carpal tunnel syndrome", "Migraine without aura" },
            new[] { "Regular sleep schedule and hydration, review in 3 weeks", "Wrist splint at night" }),
        ["Internal Medicine"] = (new[] { "Annual checkup and blood tests", "Tiredness and weight change", "Diabetes follow-up" },
            new[] { "Healthy, mild vitamin D deficiency", "Type 2 diabetes, well controlled", "Gastritis" },
            new[] { "Vitamin D3 weekly for 8 weeks", "Continue current medication, repeat HbA1c in 3 months" }),
        ["Ophthalmology"] = (new[] { "Blurred vision when reading", "Red and itchy eyes", "Routine eye exam" },
            new[] { "Mild myopia", "Allergic conjunctivitis", "Dry eye syndrome" },
            new[] { "New glasses prescription", "Lubricating eye drops three times daily" }),
        ["ENT"] = (new[] { "Sore throat and difficulty swallowing", "Blocked nose for weeks", "Ear pain" },
            new[] { "Chronic tonsillitis", "Allergic rhinitis", "Outer ear infection" },
            new[] { "Saline nasal spray twice daily", "Ear drops for 7 days, keep the ear dry" }),
        ["Gynecology"] = (new[] { "Routine women's health checkup", "Irregular periods", "Pregnancy follow-up" },
            new[] { "Normal examination", "Mild hormonal imbalance", "Healthy pregnancy, 20 weeks" },
            new[] { "Folic acid and iron supplements daily", "Repeat ultrasound and blood tests in 4 weeks" }),
        ["Dentistry"] = (new[] { "Tooth pain when eating sweets", "Teeth cleaning", "Bleeding gums" },
            new[] { "Dental cavity", "Mild gingivitis", "Normal oral health" },
            new[] { "Filling completed, avoid hard food for 24 hours", "Antiseptic mouthwash twice daily for 10 days" }),
        ["Urology"] = (new[] { "Burning when urinating", "Lower abdominal pain", "Routine prostate checkup" },
            new[] { "Urinary tract infection", "Small kidney stone", "Normal prostate examination" },
            new[] { "Plenty of water and a 5-day antibiotic course", "Follow-up ultrasound in one month" }),
        ["Psychiatry"] = (new[] { "Trouble sleeping and constant worry", "Low mood for several weeks", "Stress at work" },
            new[] { "Mild generalized anxiety", "Adjustment disorder", "Sleep difficulties" },
            new[] { "Weekly therapy sessions and a sleep hygiene plan", "Follow-up visit in two weeks" }),
        ["Endocrinology"] = (new[] { "Thyroid test follow-up", "High blood sugar", "Weight gain and tiredness" },
            new[] { "Stable hypothyroidism", "Prediabetes", "Type 2 diabetes" },
            new[] { "Thyroid hormone daily on an empty stomach", "Diet plan and repeat blood sugar tests in 6 weeks" }),
        ["Gastroenterology"] = (new[] { "Heartburn after meals", "Stomach pain and bloating", "Constipation" },
            new[] { "Acid reflux", "Irritable bowel syndrome", "Mild gastritis" },
            new[] { "Acid reducer before breakfast for 4 weeks", "More fibre and water, avoid trigger foods" }),
        ["Pulmonology"] = (new[] { "Cough lasting more than three weeks", "Shortness of breath when walking", "Wheezing at night" },
            new[] { "Mild asthma", "Post-viral cough", "Normal lung function" },
            new[] { "Inhaler as needed and breathing test in one month", "Avoid dust and smoke, review in 2 weeks" }),
        ["Nutrition"] = (new[] { "Weight loss plan", "Healthy eating with diabetes", "Gaining weight in a healthy way" },
            new[] { "Overweight, BMI 28", "Poor eating habits", "Underweight, BMI 18" },
            new[] { "1600 kcal balanced meal plan", "High-protein snacks and weekly follow-up" }),
        ["Physiotherapy"] = (new[] { "Rehabilitation after a knee injury", "Neck stiffness from desk work", "Back strengthening" },
            new[] { "Recovering ligament sprain", "Postural neck pain", "Weak core muscles" },
            new[] { "Ten sessions of stretching and strengthening", "Home exercises twice daily" }),
    };

    private static readonly string[] DoctorNotes =
    {
        "Follow up in two weeks.", "Advised rest and plenty of fluids.", "Patient is responding well.",
        "Lab tests requested.", "Lifestyle changes discussed with the patient.", "Review the results at the next visit.",
    };

    private static readonly string[] Comments5 =
    {
        "Excellent doctor, explained everything clearly.", "Very professional and kind. Highly recommended!",
        "Best experience I have had in a clinic.", "Took time to listen to me and the treatment worked.",
        "دكتور ممتاز وشرح كل حاجة بالتفصيل", "تجربة رائعة وأنصح بيه جدا", "Great care, clean clinic and on-time appointment.",
    };
    private static readonly string[] Comments4 =
    {
        "Good doctor, but the waiting time was a bit long.", "Professional and helpful, would visit again.",
        "Clear diagnosis and a fair price.", "Nice staff and good follow-up.", "الدكتور محترم بس الانتظار كان طويل شوية",
    };
    private static readonly string[] Comments3 = { "Okay visit, the explanation was a bit short.", "Doctor is fine, the clinic was crowded.", "Average experience." };
    private static readonly string[] Comments2 = { "Waited more than an hour for a short visit.", "Not very clear explanation." };
    private static readonly string[] Comments1 = { "Not satisfied, the visit felt rushed." };

    private static readonly string[] MaleNames = { "Ahmed", "Mohamed", "Mahmoud", "Omar", "Ali", "Hassan", "Khaled", "Ibrahim", "Youssef", "Karim", "Mostafa", "Amr", "Tamer", "Hany", "Sherif", "Ziad", "Hamza", "Adham" };
    private static readonly string[] FemaleNames = { "Fatma", "Mona", "Aya", "Nour", "Salma", "Mariam", "Heba", "Rana", "Dina", "Yara", "Jana", "Laila", "Esraa", "Hagar", "Farida", "Nada", "Malak", "Habiba" };
    private static readonly string[] LastNames = { "Hassan", "Ibrahim", "Mahmoud", "Ali", "Salem", "Mostafa", "Abdelrahman", "Sayed", "Fawzy", "Gaber", "Shawky", "Nasser", "Ramadan", "Helmy", "Zidan", "Kamal", "Anwar", "Morsy", "Farag", "Badawy" };
    private static readonly string[] Relations = { "brother", "sister", "father", "mother", "spouse", "friend" };
    private static readonly string[] BloodTypes = { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "O+", "A+", "B+" };
    private static readonly string[] Allergies = { "Penicillin", "Peanuts", "Dust and pollen", "Aspirin", "Shellfish", "Latex" };
    private static readonly string[] Chronic = { "Type 2 diabetes", "Hypertension", "Asthma", "Hypothyroidism", "Migraine", "High cholesterol", "Hypertension and type 2 diabetes" };

    public static void Seed(AppDbContext db, FieldCipher cipher, string password, ILogger logger)
    {
        var markerHash = cipher.BlindIndex(MainPatientEmail);
        if (db.Users.Any(u => u.EmailHash == markerHash))
        {
            logger.LogInformation("Demo data is already in the database, skipping.");
            return;
        }

        var rnd = new Random(2024);
        var now = DateTime.UtcNow;
        var cairoNow = now.AddHours(3); 
        var today = DateOnly.FromDateTime(cairoNow);
        var nowTime = cairoNow.ToString("HH:mm", CultureInfo.InvariantCulture);

        T Pick<T>(IReadOnlyList<T> items) => items[rnd.Next(items.Count)];
        string Phone() => "01" + new[] { "0", "1", "2", "5" }[rnd.Next(4)] + rnd.Next(10000000, 100000000);
        string Slug(string name) => string.Join(".", name.ToLowerInvariant().Split(new[] { ' ', '-', '\'' }, StringSplitOptions.RemoveEmptyEntries));
        DateTime Utc(DateOnly d, int hour, int minute) => DateTime.SpecifyKind(d.ToDateTime(new TimeOnly(hour, minute)), DateTimeKind.Utc);

        using var tx = db.Database.BeginTransaction();

        var haveSpecialties = db.Specialties.Select(sp => sp.Name).ToHashSet();
        foreach (var info in SpecialtyInfo.Where(x => !haveSpecialties.Contains(x.Name)))
            db.Specialties.Add(new Specialty { Name = info.Name, Description = info.Description });

        var haveClinics = db.Clinics.Select(cl => cl.Name).ToHashSet();
        var newClinics = 0;
        foreach (var info in SpecialtyInfo.Where(x => !haveClinics.Contains(x.Name)))
        {
            db.Clinics.Add(new Clinic { Name = info.Name, Floor = info.Floor, Phone = "02 2555 0" + (150 + newClinics * 10), Description = info.ClinicDescription });
            newClinics++;
        }
        db.SaveChanges();

        var specialtyId = db.Specialties.ToList().GroupBy(s => s.Name).ToDictionary(g => g.Key, g => g.First().Id);
        var clinicId = db.Clinics.ToList().GroupBy(c => c.Name).ToDictionary(g => g.Key, g => g.First().Id);

        var hash = new PasswordHasher<User>().HashPassword(new User(), password);
        User NewUser(string name, string email, string role, string phone, int createdDaysAgo) => new()
        {
            Email = email,
            EmailHash = cipher.BlindIndex(email),
            PasswordHash = hash,
            FullName = name,
            Phone = phone,
            Role = role,
            CreatedAt = now.AddDays(-createdDaysAgo),
            LastLoginAt = now.AddHours(-rnd.Next(1, 24 * 20)),
        };

        var doctorUsers = Doctors.Select(d => NewUser(d.Name, $"dr.{Slug(d.Name)}@{Domain}", Roles.Doctor, Phone(), rnd.Next(60, 400))).ToList();

        var patientUsers = new List<User> { NewUser("Omar Hassan", MainPatientEmail, Roles.Patient, "01012345678", 90) };
        var genders = new List<string> { "male" };
        var usedNames = new HashSet<string> { "Omar Hassan" };
        while (patientUsers.Count < PatientCount)
        {
            var female = patientUsers.Count % 2 == 0;
            var name = $"{Pick(female ? FemaleNames : MaleNames)} {Pick(LastNames)}";
            if (!usedNames.Add(name)) continue;
            patientUsers.Add(NewUser(name, $"{Slug(name)}@{Domain}", Roles.Patient, Phone(), rnd.Next(5, 200)));
            genders.Add(female ? "female" : "male");
        }
        db.Users.AddRange(doctorUsers);
        db.Users.AddRange(patientUsers);
        db.SaveChanges();

        var docs = new List<(Doctor Entity, DoctorSeed Seed)>();
        for (var i = 0; i < Doctors.Length; i++)
        {
            var s = Doctors[i];
            var doctor = new Doctor
            {
                UserId = doctorUsers[i].Id,
                Name = "Dr. " + s.Name, 
                ClinicId = clinicId[s.Specialty],
                SpecialtyId = specialtyId[s.Specialty],
                Experience = s.Years,
                Fee = s.Fee,
                Days = s.Days,
                StartTime = s.Start,
                EndTime = s.End,
                Bio = string.Format(CultureInfo.InvariantCulture, BioCore[s.Specialty], s.Years) + " " + Pick(BioSuffix),
            };
            docs.Add((doctor, s));
            db.Doctors.Add(doctor);
        }
        db.SaveChanges();

        for (var i = 0; i < patientUsers.Count; i++)
        {
            var born = new DateOnly(rnd.Next(1955, 2007), rnd.Next(1, 13), rnd.Next(1, 28));
            var age = today.Year - born.Year;
            var chronic = (age > 40 && rnd.NextDouble() < 0.6) || rnd.NextDouble() < 0.1 ? Pick(Chronic) : "";
            db.PatientProfiles.Add(new PatientProfile
            {
                UserId = patientUsers[i].Id,
                DateOfBirth = born.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Gender = genders[i],
                BloodType = Pick(BloodTypes),
                Allergies = rnd.NextDouble() < 0.3 ? Pick(Allergies) : "",
                ChronicConditions = chronic,
                EmergencyContact = $"{Pick(MaleNames)} {Pick(LastNames)} ({Pick(Relations)}) - {Phone()}",
            });
        }
        db.SaveChanges();

        var used = new HashSet<string>();
        var appointments = new List<Appointment>();
        string Key(Doctor d, DateOnly date, string time) => $"{d.Id}|{date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}|{time}";

        bool Add(Doctor d, string specialty, DateOnly date, string time, User patient, string status)
        {
            if (!used.Add(Key(d, date, time))) return false;
            var clinical = Clinical[specialty];
            var created = Utc(date, 9, 0).AddDays(-rnd.Next(1, 10));
            if (created > now) created = now.AddHours(-rnd.Next(1, 72));
            var a = new Appointment
            {
                PatientUserId = patient.Id,
                PatientName = patient.FullName,
                Phone = patient.Phone,
                ClinicId = d.ClinicId,
                DoctorId = d.Id,
                Date = date,
                Time = time,
                Status = status,
                Reason = Pick(clinical.Reasons),
                CreatedAt = created,
            };
            if (status == AppointmentStatus.Completed)
            {
                a.Diagnosis = Pick(clinical.Diagnoses);
                a.Prescription = Pick(clinical.Prescriptions);
                a.DoctorNotes = Pick(DoctorNotes);
            }
            appointments.Add(a);
            return true;
        }

        foreach (var (doctor, seed) in docs)
        {
            var times = Schedule.Times(seed.Start, seed.End);
            for (var offset = -45; offset <= 10; offset++)
            {
                var date = today.AddDays(offset);
                if (!Schedule.WorksOn(seed.Days, date)) continue;
                var count = Math.Min(times.Count, offset < 0 ? rnd.Next(0, 5) : rnd.Next(1, 6));
                foreach (var time in times.OrderBy(_ => rnd.Next()).Take(count))
                {
                    string status;
                    if (offset < 0) status = rnd.NextDouble() < 0.12 ? AppointmentStatus.Cancelled : AppointmentStatus.Completed;
                    else if (offset == 0) status = string.CompareOrdinal(time, nowTime) < 0 ? AppointmentStatus.Completed : AppointmentStatus.Booked;
                    else status = rnd.NextDouble() < 0.08 ? AppointmentStatus.Cancelled : AppointmentStatus.Booked;

                    var patient = rnd.NextDouble() < 0.01 ? patientUsers[0] : Pick(patientUsers);
                    Add(doctor, seed.Specialty, date, time, patient, status);
                }
            }
        }

        var forced = 0;
        foreach (var (doctor, seed) in docs.OrderBy(_ => rnd.Next()))
        {
            if (forced >= 3) break;
            var times = Schedule.Times(seed.Start, seed.End);
            for (var off = 1 + forced; off <= 12; off++)
            {
                var date = today.AddDays(off);
                if (!Schedule.WorksOn(seed.Days, date)) continue;
                var free = times.FirstOrDefault(t => !used.Contains(Key(doctor, date, t)));
                if (free != null && Add(doctor, seed.Specialty, date, free, patientUsers[0], AppointmentStatus.Booked)) { forced++; break; }
            }
        }
        db.Appointments.AddRange(appointments);
        db.SaveChanges();

        var bias = docs.ToDictionary(d => d.Entity.Id, _ => 3.4 + rnd.NextDouble() * 1.5);
        var reviews = 0;
        foreach (var a in appointments.Where(a => a.Status == AppointmentStatus.Completed))
        {
            if (rnd.NextDouble() > 0.55) continue;
            var rating = Math.Clamp((int)Math.Round(bias[a.DoctorId] + (rnd.NextDouble() - 0.5) * 2.2), 1, 5);
            var comment = rating switch
            {
                5 => Pick(Comments5),
                4 => Pick(Comments4),
                3 => Pick(Comments3),
                2 => Pick(Comments2),
                _ => Pick(Comments1),
            };
            var created = Utc(a.Date, rnd.Next(9, 22), rnd.Next(0, 60)).AddDays(rnd.Next(0, 4));
            if (created > now) created = now;
            db.Reviews.Add(new Review { DoctorId = a.DoctorId, PatientUserId = a.PatientUserId, AppointmentId = a.Id, Rating = rating, Comment = comment, CreatedAt = created });
            reviews++;
        }
        db.SaveChanges();

        var actors = doctorUsers.Concat(patientUsers).ToList();
        var actions = new[]
        {
            ("login", "User"), ("login", "User"), ("book_appointment", "Appointment"), ("cancel_appointment", "Appointment"),
            ("complete_appointment", "Appointment"), ("add_review", "Review"), ("save_patient_profile", "PatientProfile"),
            ("view_patient_profile", "PatientProfile"), ("login_failed", "User"),
        };
        for (var i = 0; i < 150; i++)
        {
            var actor = Pick(actors);
            var (action, entity) = Pick(actions);
            int entityId = entity == "User" ? actor.Id : Pick(appointments).Id;
            db.AuditLogs.Add(new AuditLog
            {
                UserId = actor.Id,
                Action = action,
                Entity = entity,
                EntityId = entityId,
                Ip = $"41.{rnd.Next(32, 255)}.{rnd.Next(0, 255)}.{rnd.Next(1, 255)}",
                At = now.AddMinutes(-rnd.Next(5, 60 * 24 * 14)),
            });
        }
        db.SaveChanges();
        tx.Commit();

        logger.LogInformation(
            "Demo data added: {Doctors} doctors, {Patients} patients, {Appointments} appointments, {Reviews} reviews. " +
            "Login: {Patient} or dr.ahmed.samir@{Domain}",
            docs.Count, patientUsers.Count, appointments.Count, reviews, MainPatientEmail, Domain);
    }
}
