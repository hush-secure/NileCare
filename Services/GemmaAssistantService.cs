using System.Net.Http.Json;

namespace HospitalSystem.Services;

internal record NoorHealth(bool Ready);
internal record NoorReply(string Reply, BookingProposal? Booking);
public class GemmaAssistantService(HttpClient http, IConfiguration config, ILogger<GemmaAssistantService> log) : IAssistantService
{
    private const string Unavailable =
        "المساعد مش متاح دلوقتي، حاول تاني بعد شوية. / The assistant is temporarily unavailable, please try again shortly.";

    public string Model => config["Assistant:Model"] ?? "Qwen3";

    public async Task<bool> IsReadyAsync(CancellationToken ct = default)
    {
        try
        {
            var h = await http.GetFromJsonAsync<NoorHealth>("health", ct);
            return h?.Ready == true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch { return false; }
    }

    public async Task<AssistantReply> ReplyAsync(IReadOnlyList<ChatMessage> history, AssistantUser user, CancellationToken ct = default)
    {
        try
        {
            var payload = new
            {
                messages = history.Select(m => new { role = m.Role, content = m.Content }),
                user = new { authenticated = user.Authenticated, role = user.Role, name = user.Name }
            };

            using var res = await http.PostAsJsonAsync("chat", payload, ct);
            if (!res.IsSuccessStatusCode)
            {
                log.LogWarning("Assistant service answered {Status}", (int)res.StatusCode);
                return new AssistantReply(Unavailable);
            }

            var body = await res.Content.ReadFromJsonAsync<NoorReply>(ct);
            if (body is null || string.IsNullOrWhiteSpace(body.Reply)) return new AssistantReply(Unavailable);
            return new AssistantReply(body.Reply, body.Booking);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Assistant service call failed");
            return new AssistantReply(Unavailable);
        }
    }
}
