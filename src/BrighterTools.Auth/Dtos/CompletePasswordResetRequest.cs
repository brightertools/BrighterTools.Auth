using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for completing a password reset.
/// </summary>
public sealed class CompletePasswordResetRequest
{
    /// <summary>
    /// Gets the password reset token.
    /// </summary>
    [Required]
    public string Token { get; init; } = string.Empty;

    /// <summary>
    /// Gets the replacement password.
    /// </summary>
    [Required]
    public string NewPassword { get; init; } = string.Empty;
}


