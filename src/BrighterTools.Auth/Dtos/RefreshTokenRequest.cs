using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for refreshing an auth session.
/// </summary>
public sealed class RefreshTokenRequest
{
    /// <summary>
    /// Gets the refresh token being exchanged.
    /// </summary>
    [Required]
    public string RefreshToken { get; init; } = string.Empty;

    /// <summary>
    /// Gets the requested tenant identifier when the host supports tenant switching.
    /// </summary>
    public string? TenantId { get; init; }

    /// <summary>
    /// Gets a value indicating whether the current tenant should be used when no tenant is supplied.
    /// </summary>
    public bool SwitchToCurrentTenant { get; init; }
}


