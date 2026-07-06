using BrighterTools.Auth.Models;
using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to switch the authenticated user's active tenant and issue a new session.
/// </summary>
public sealed class SwitchTenantRequest
{
    /// <summary>
    /// Gets the host user identifier whose active tenant should be switched.
    /// </summary>
    [Required]
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the target tenant identifier.
    /// </summary>
    [Required]
    public string TenantId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the provider context to stamp onto the issued session.
    /// </summary>
    public AuthProviderType Provider { get; init; } = AuthProviderType.Unknown;

    /// <summary>
    /// Gets a value indicating whether the session issuer should resolve the host-persisted current tenant.
    /// </summary>
    public bool SwitchToCurrentTenant { get; init; } = true;
}
