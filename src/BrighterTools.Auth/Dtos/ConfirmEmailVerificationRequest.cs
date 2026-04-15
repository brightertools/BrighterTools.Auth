using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for confirming email verification.
/// </summary>
public sealed class ConfirmEmailVerificationRequest
{
    /// <summary>
    /// Gets the email verification token.
    /// </summary>
    [Required]
    public string Token { get; init; } = string.Empty;
}


