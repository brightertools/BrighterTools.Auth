using BrighterTools.Auth.Models;
using System.ComponentModel.DataAnnotations;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the request payload for creating an account with an external provider.
/// </summary>
public sealed class ExternalSignupRequest
{
    /// <summary>
    /// Gets the external provider being used for sign-up.
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

    /// <summary>
    /// Gets the date of birth supplied for age-gated sign-up flows.
    /// </summary>
    public string? DateOfBirth { get; init; }

    /// <summary>
    /// Gets a value indicating whether the user confirmed they meet the configured minimum age.
    /// </summary>
    public bool MinimumAgeConfirmed { get; init; }

    /// <summary>
    /// Gets a value indicating whether the terms of service were accepted.
    /// </summary>
    public bool TermsAccepted { get; init; }

    /// <summary>
    /// Gets a value indicating whether the privacy policy was accepted.
    /// </summary>
    public bool PrivacyPolicyAccepted { get; init; }

    /// <summary>
    /// Gets a value indicating whether help/product emails were accepted.
    /// </summary>
    public bool ConsentToHelpEmails { get; init; }

    /// <summary>
    /// Gets a value indicating whether marketing emails were accepted.
    /// </summary>
    public bool ConsentToMarketingEmails { get; init; }

    /// <summary>
    /// Gets host-defined metadata to pass through the signup workflow.
    /// </summary>
    public IDictionary<string, object?> Metadata { get; init; } = new Dictionary<string, object?>();
}
