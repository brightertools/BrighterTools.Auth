using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for completing account activation.
/// </summary>
public sealed class AccountActivationRequest
{
    /// <summary>
    /// Gets the activation token.
    /// </summary>
    [Required]
    public string Token { get; init; } = string.Empty;
}


