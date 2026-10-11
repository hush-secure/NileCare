namespace HospitalSystem.Services;

public record ChatMessage(string Role, string Content); 

public record AssistantUser(bool Authenticated, string? Role, string? Name);

public record BookingProposal(int DoctorId, string DoctorName, int ClinicId, string ClinicName,
    string Date, string Time, string Reason, string PatientName, string Phone);

public record AssistantReply(string Reply, BookingProposal? Booking = null);

public interface IAssistantService
{
    string Model { get; }
    Task<bool> IsReadyAsync(CancellationToken ct = default);
    Task<AssistantReply> ReplyAsync(IReadOnlyList<ChatMessage> history, AssistantUser user, CancellationToken ct = default);
}

public class PlaceholderAssistantService(IConfiguration config) : IAssistantService
{
    public string Model => config["Assistant:Model"] ?? "Qwen3";
    public Task<bool> IsReadyAsync(CancellationToken ct = default) => Task.FromResult(false);

    public Task<AssistantReply> ReplyAsync(IReadOnlyList<ChatMessage> history, AssistantUser user, CancellationToken ct = default) =>
        Task.FromResult(new AssistantReply(
            "The AI assistant is not connected yet. For now you can browse the Doctors page or book a visit " +
            "from the Book page."));
}