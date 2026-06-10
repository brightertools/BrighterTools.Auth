using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Evaluates whether a linked login provider may be removed without locking the user out.
/// </summary>
public interface IUserLoginProviderUnlinkPolicy
{
    /// <summary>
    /// Evaluates whether the provider may be unlinked.
    /// </summary>
    Task<ProviderPolicyResult> EvaluateAsync(ProviderUnlinkContext context, CancellationToken cancellationToken = default);
}
