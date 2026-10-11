using System.Security.Claims;
using HospitalSystem.Data;
using HospitalSystem.Models;
using HospitalSystem.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HospitalSystem.Controllers;

public record ChatRequest(List<ChatMessage> Messages);
public record ChatReply(string Reply, BookingProposal? Booking = null);
public record AssistantStatus(bool Ready, string Model);

[ApiController]
[Route("api/assistant")]
public class AssistantController(IAssistantService assistant, AppDbContext db) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken ct) =>
        Ok(new AssistantStatus(await assistant.IsReadyAsync(ct), assistant.Model));

    [HttpPost("chat")]
    [EnableRateLimiting("chat")]
    public async Task<IActionResult> Chat(ChatRequest req, CancellationToken ct)
    {
        if (req.Messages.Count == 0 || req.Messages.Count > 30)
            return BadRequest(new { message = "Invalid conversation." });
        if (req.Messages.Any(m => m.Content.Length > 2000 || (m.Role != "user" && m.Role != "assistant")))
            return BadRequest(new { message = "Invalid message." });
        if (req.Messages[^1].Role != "user")
            return BadRequest(new { message = "The last message must be from the user." });

        var signedIn = User.Identity?.IsAuthenticated == true;
        var who = new AssistantUser(signedIn,
            signedIn ? User.FindFirstValue(ClaimTypes.Role) : null,
            signedIn ? User.FindFirstValue(ClaimTypes.Name) : null);

        var result = await assistant.ReplyAsync(req.Messages, who, ct);
        var booking = result.Booking;

        if (booking != null)
        {
            if (!User.IsInRole(Roles.Patient)) booking = null;
            else
            {
                var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var me = await db.Users.FindAsync(new object[] { uid }, ct);
                booking = me == null ? null : booking with { PatientName = me.FullName, Phone = me.Phone };
            }
        }

        return Ok(new ChatReply(result.Reply, booking));
    }
}