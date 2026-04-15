using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Evaluates whether a user is allowed to sign in with a specific provider in the current context.
/// </summary>
public interface IUserLoginProviderPolicy
{
    /// <summary>
    /// Determines whether the specified provider may be used for the supplied user and tenant context.
    /// </summary>
    Task<ProviderPolicyResult> EvaluateAsync(AuthUser user, AuthProviderType provider, string? tenantId, CancellationToken cancellationToken = default);
}

