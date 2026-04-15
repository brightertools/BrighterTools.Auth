namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the provider Policy Result.
/// </summary>
public sealed class ProviderPolicyResult
{
    /// <summary>
    /// Gets or sets a value indicating whether the provider is allowed.
    /// </summary>
    public bool Allowed { get; init; }
    /// <summary>
    /// Gets or sets the reason.
    /// </summary>
    public string? Reason { get; init; }

    /// <summary>
    /// Creates a provider policy result that allows the provider.
    /// </summary>
    public static ProviderPolicyResult Permit() => new() { Allowed = true };
    /// <summary>
    /// Creates a provider policy result that denies the provider.
    /// </summary>
    public static ProviderPolicyResult Deny(string reason) => new() { Allowed = false, Reason = reason };
}

