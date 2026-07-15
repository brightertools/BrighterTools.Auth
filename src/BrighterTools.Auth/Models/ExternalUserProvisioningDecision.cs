namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the external User Provisioning Decision.
/// </summary>
public sealed class ExternalUserProvisioningDecision
{
    /// <summary>
    /// Gets or sets a value indicating whether automatic user provisioning is allowed.
    /// </summary>
    public bool AllowProvisioning { get; init; }

    /// <summary>
    /// Gets or sets the denial reason.
    /// </summary>
    public string? Reason { get; init; }

    /// <summary>
    /// Gets or sets the stable denial code.
    /// </summary>
    public string? Code { get; init; }

    /// <summary>
    /// Creates a provisioning decision that allows automatic user creation.
    /// </summary>
    public static ExternalUserProvisioningDecision Allow() => new() { AllowProvisioning = true };

    /// <summary>
    /// Creates a provisioning decision that denies automatic user creation.
    /// </summary>
    public static ExternalUserProvisioningDecision Deny(string? reason = null)
        => new() { AllowProvisioning = false, Reason = reason };

    /// <summary>
    /// Creates a provisioning decision that denies automatic user creation with a stable failure code.
    /// </summary>
    public static ExternalUserProvisioningDecision DenyWithCode(string code, string? reason = null)
        => new() { AllowProvisioning = false, Code = code, Reason = reason };
}