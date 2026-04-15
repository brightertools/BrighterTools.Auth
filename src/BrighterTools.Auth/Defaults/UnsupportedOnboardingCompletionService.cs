using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an implementation of onboarding Completion Service that reports the feature as unsupported.
/// </summary>
public sealed class UnsupportedOnboardingCompletionService : IOnboardingCompletionService
{
    /// <summary>
    /// Performs the complete operation.
    /// </summary>
    public Task<OnboardingState> CompleteAsync(string userId, string? tenantId, IDictionary<string, object?> fields, CancellationToken cancellationToken = default)
        => Task.FromException<OnboardingState>(new NotSupportedException("Onboarding is not configured."));
}

