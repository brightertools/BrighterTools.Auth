using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Determines whether a successful password verification result should trigger a rehash.
/// </summary>
public interface IPasswordRehashPolicy
{
    /// <summary>
    /// Determines whether the supplied verification result should trigger password rehashing.
    /// </summary>
    bool ShouldRehash(AuthUser user, PasswordVerificationResult verificationResult);
}

