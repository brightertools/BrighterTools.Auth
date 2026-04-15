using BrighterTools.Auth.Models;
using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for signing in with an external provider.
/// </summary>
public sealed class ExternalLoginRequest
{
    /// <summary>
    /// Gets the external provider being used for sign-in.
    /// </summary>
    public AuthProviderType Provider { get; init; }

    /// <summary>
    /// Gets the provider-issued credential to validate.
    /// </summary>
    [Required]
    public string Credential { get; init; } = string.Empty;

    /// <summary>
    /// Gets the requested tenant identifier when the host supports tenant selection.
    /// </summary>
    public string? TenantId { get; init; }
}


