using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to create a short-lived mobile-to-web session handoff code.
/// </summary>
public sealed class CreateMobileWebHandoffRequest
{
    /// <summary>
    /// Gets the authenticated user identifier.
    /// </summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the provider used for the source session.
    /// </summary>
    public AuthProviderType Provider { get; init; }

    /// <summary>
    /// Gets the tenant identifier when the host app supports tenants.
    /// </summary>
    public string? TenantId { get; init; }

    /// <summary>
    /// Gets a value indicating whether the issued web session should use the user's current tenant.
    /// </summary>
    public bool SwitchToCurrentTenant { get; init; } = true;
}
