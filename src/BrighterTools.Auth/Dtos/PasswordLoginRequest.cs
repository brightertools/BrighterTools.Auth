using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for password-based sign-in.
/// </summary>
public sealed class PasswordLoginRequest
{
    /// <summary>
    /// Gets the login identifier supplied by the user.
    /// </summary>
    [Required]
    public string Login { get; init; } = string.Empty;

    /// <summary>
    /// Gets the password supplied by the user.
    /// </summary>
    [Required]
    public string Password { get; init; } = string.Empty;

    /// <summary>
    /// Gets the optional reCAPTCHA token associated with this login attempt.
    /// </summary>
    public string? ReCaptchaToken { get; init; }

    /// <summary>
    /// Gets the requested tenant identifier when the host supports tenant selection.
    /// </summary>
    public string? TenantId { get; init; }
}
