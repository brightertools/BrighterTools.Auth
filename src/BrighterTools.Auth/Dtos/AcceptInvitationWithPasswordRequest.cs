using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for accepting an invitation with a password.
/// </summary>
public sealed class AcceptInvitationWithPasswordRequest
{
    /// <summary>
    /// Gets the invitation token.
    /// </summary>
    [Required]
    public string InvitationToken { get; init; } = string.Empty;

    /// <summary>
    /// Gets the invited email address.
    /// </summary>
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// Gets the password to assign to the invited account.
    /// </summary>
    [Required]
    public string Password { get; init; } = string.Empty;

    /// <summary>
    /// Gets the first name captured during acceptance.
    /// </summary>
    public string? FirstName { get; init; }

    /// <summary>
    /// Gets the last name captured during acceptance.
    /// </summary>
    public string? LastName { get; init; }

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
    /// Gets the client IP address captured during acceptance.
    /// </summary>
    public string? ClientIpAddress { get; init; }

    /// <summary>
    /// Gets the application-specific extra fields captured during acceptance.
    /// </summary>
    [Required]
    public IDictionary<string, object?> Fields { get; init; } = new Dictionary<string, object?>();
}


