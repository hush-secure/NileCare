using HospitalSystem.Data;
using HospitalSystem.Models;

namespace HospitalSystem.Services;

public class AuditService(AppDbContext db, IHttpContextAccessor accessor)
{
    public async Task Log(int? userId, string action, string entity, int? entityId = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            Ip = accessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "",
            At = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
