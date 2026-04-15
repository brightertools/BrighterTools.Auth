using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Applies onboarding completion changes and returns the resulting onboarding state for the current user context.
/// </summary>
public interface IOnboardingCompletionService
{
    /// <summary>
    /// Applies onboarding completion changes and returns the resulting onboarding state.
    /// </summary>
    Task<OnboardingState> CompleteAsync(string userId, string? tenantId, IDictionary<string, object?> fields, CancellationToken cancellationToken = default);
}

