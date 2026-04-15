namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the onboarding State.
/// </summary>
public sealed class OnboardingState
{
    /// <summary>
    /// Gets or sets a value indicating whether onboarding is required.
    /// </summary>
    public bool Required { get; init; }
    /// <summary>
    /// Gets or sets the status.
    /// </summary>
    public string Status { get; init; } = "complete";
    /// <summary>
    /// Gets or sets the collection of fields.
    /// </summary>
    public IDictionary<string, object?> Fields { get; init; } = new Dictionary<string, object?>();

    /// <summary>
    /// Creates an onboarding state that indicates onboarding is not required.
    /// </summary>
    public static OnboardingState NotRequired() => new() { Required = false, Status = "complete" };
}

