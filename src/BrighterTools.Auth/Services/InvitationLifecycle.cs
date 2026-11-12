namespace BrighterTools.Auth.Services;

/// <summary>Common invitation transitions. Hosts still authorize actors and lock/reload persisted state.</summary>
public static class InvitationLifecycle
{
    /// <summary>Archiving hides history; it never revokes membership or refunds a consumed seat.</summary>
    public static bool CanArchive(string status, DateTimeOffset expiresUtc, DateTimeOffset now) =>
        status.ToLowerInvariant() switch
        {
            "pending" => expiresUtc <= now,
            "accepted" or "declined" or "expired" or "revoked" or "cancelled" => true,
            _ => false
        };

    /// <summary>Only unconsumed invitations can be cancelled. Unknown states fail closed.</summary>
    public static bool CanCancel(string status) => status.ToLowerInvariant() is "pending" or "expired";
}
