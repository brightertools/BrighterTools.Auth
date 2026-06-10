namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the result of evaluating whether an external identity may create an account.
/// </summary>
public sealed class ExternalSignupDecision
{
    /// <summary>
    /// Gets a value indicating whether sign-up is allowed.
    /// </summary>
    public bool Allowed { get; init; }

    /// <summary>
    /// Gets the denial reason when sign-up is blocked.
    /// </summary>
    public string? Reason { get; init; }

    /// <summary>
    /// Creates an allow decision.
    /// </summary>
    public static ExternalSignupDecision Allow() => new() { Allowed = true };

    /// <summary>
    /// Creates a deny decision.
    /// </summary>
    public static ExternalSignupDecision Deny(string? reason = null) => new() { Allowed = false, Reason = reason };
}
