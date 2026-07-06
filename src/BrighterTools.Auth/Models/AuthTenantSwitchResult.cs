namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the host application's persisted tenant switch result.
/// </summary>
public sealed class AuthTenantSwitchResult
{
    /// <summary>
    /// Gets the host user identifier after switching.
    /// </summary>
    public required string UserId { get; init; }

    /// <summary>
    /// Gets the tenant identifier that is now current for the user.
    /// </summary>
    public required string TenantId { get; init; }
}
