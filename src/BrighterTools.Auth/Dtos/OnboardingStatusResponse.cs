using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the onboarding status returned for the current user context.
/// </summary>
public sealed class OnboardingStatusResponse
{
    /// <summary>
    /// Gets the onboarding state evaluated for the current user and tenant context.
    /// </summary>
    public OnboardingState Onboarding { get; init; } = OnboardingState.NotRequired();
}

