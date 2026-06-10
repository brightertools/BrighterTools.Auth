using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Evaluates whether a validated external identity may create a user for a specific sign-up request.
/// </summary>
public interface IExternalSignupPolicy
{
    /// <summary>
    /// Evaluates whether external sign-up is allowed.
    /// </summary>
    Task<ExternalSignupDecision> EvaluateAsync(ExternalSignupContext context, CancellationToken cancellationToken = default);
}
