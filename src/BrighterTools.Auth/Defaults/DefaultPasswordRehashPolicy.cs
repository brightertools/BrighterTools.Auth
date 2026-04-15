using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides the default implementation of password Rehash Policy.
/// </summary>
public sealed class DefaultPasswordRehashPolicy : IPasswordRehashPolicy
{
    /// <summary>
    /// Performs the should Rehash operation.
    /// </summary>
    public bool ShouldRehash(AuthUser user, PasswordVerificationResult verificationResult) => verificationResult.RequiresRehash;
}

