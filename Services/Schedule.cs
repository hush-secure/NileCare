namespace HospitalSystem.Services;

public static class Schedule
{
    public const int SlotMinutes = 30;

    public static readonly string[] DayNames = { "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri" };

    public static List<string> Times(string start, string end)
    {
        var list = new List<string>();
        if (!TimeSpan.TryParse(start, out var from) || !TimeSpan.TryParse(end, out var to)) return list;
        for (var t = from; t + TimeSpan.FromMinutes(SlotMinutes) <= to; t += TimeSpan.FromMinutes(SlotMinutes))
            list.Add(t.ToString(@"hh\:mm"));
        return list;
    }

    public static bool WorksOn(string days, DateOnly date)
    {
        var name = date.DayOfWeek.ToString()[..3];
        return days.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(d => d.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsValidTime(string value) =>
        value.Length == 5 && TimeSpan.TryParseExact(value, @"hh\:mm", null, out _);
}
