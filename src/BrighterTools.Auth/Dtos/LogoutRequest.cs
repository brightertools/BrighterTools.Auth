using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for logging out a refresh token.
/// </summary>
public sealed class LogoutRequest
{
    /// <summary>
    /// Gets the refresh token to revoke.
    /// </summary>
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}


