using BrighterTools.Auth.Models;
using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to issue a session for a user whose identity has already been trusted by the host application.
/// </summary>
public sealed class IssueSessionRequest
{
    /// <summary>
    /// Gets the host user identifier to issue the session for.
    /// </summary>
    [Required]
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the provider context to stamp onto the issued session.
    /// </summary>
    public AuthProviderType Provider { get; init; } = AuthProviderType.Unknown;

    /// <summary>
    /// Gets the requested tenant identifier when the host supports tenant selection.
    /// </summary>
    public string? TenantId { get; init; }

    /// <summary>
    /// Gets a value indicating whether the host should resolve the user's current tenant rather than the default tenant.
    /// </summary>
    public bool SwitchToCurrentTenant { get; init; }
}