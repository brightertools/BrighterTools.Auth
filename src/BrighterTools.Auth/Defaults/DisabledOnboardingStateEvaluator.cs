using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an onboarding evaluator that always reports onboarding as not required.
/// </summary>
public sealed class DisabledOnboardingStateEvaluator : IOnboardingStateEvaluator
{
    /// <summary>
    /// Performs the evaluate operation.
    /// </summary>
    public Task<OnboardingState> EvaluateAsync(AuthUser user, AuthTenantMembership? tenantMembership, CancellationToken cancellationToken = default)
        => Task.FromResult(OnboardingState.NotRequired());
}

