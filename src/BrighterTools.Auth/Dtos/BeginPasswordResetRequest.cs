using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for beginning a password reset flow.
/// </summary>
public sealed class BeginPasswordResetRequest
{
    /// <summary>
    /// Gets the login identifier to start a password reset for.
    /// </summary>
    [Required]
    public string Login { get; init; } = string.Empty;
}


