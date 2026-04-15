using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for password-based sign-up.
/// </summary>
public sealed class PasswordSignupRequest
{
    /// <summary>
    /// Gets the email address for the new account.
    /// </summary>
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets the password for the new account.
    /// </summary>
    [Required]
    public string Password { get; init; } = string.Empty;

    /// <summary>
    /// Gets the first name captured during sign-up.
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Gets the last name captured during sign-up.
    /// </summary>
    public string? LastName { get; init; }

    /// <summary>
    /// Gets the phone number captured during sign-up.
    /// </summary>
    public string? Phone { get; init; }

    /// <summary>
    /// Gets a value indicating whether the user accepted the terms.
    /// </summary>
    public bool TermsAccepted { get; init; }

    /// <summary>
    /// Gets a value indicating whether the user accepted the privacy policy.
    /// </summary>
    public bool PrivacyPolicyAccepted { get; init; }

    /// <summary>
    /// Gets a value indicating whether the user opted into help emails.
    /// </summary>
    public bool? ConsentToHelpEmails { get; init; }

    /// <summary>
    /// Gets a value indicating whether the user opted into marketing emails.
    /// </summary>
    public bool? ConsentToMarketingEmails { get; init; }

    /// <summary>
    /// Gets the client IP address captured during sign-up.
    /// </summary>
    public string? ClientIpAddress { get; init; }

    /// <summary>
    /// Gets the application-specific extra fields captured during sign-up.
    /// </summary>
    [Required]
    public IDictionary<string, object?> Fields { get; init; } = new Dictionary<string, object?>();
}


