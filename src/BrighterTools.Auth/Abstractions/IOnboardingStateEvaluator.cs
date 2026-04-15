using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Evaluates whether the current user and tenant context still requires onboarding.
/// </summary>
public interface IOnboardingStateEvaluator
{
    /// <summary>
    /// Evaluates the onboarding state for the supplied user and tenant context.
    /// </summary>
    Task<OnboardingState> EvaluateAsync(AuthUser user, AuthTenantMembership? tenantMembership, CancellationToken cancellationToken = default);
}

