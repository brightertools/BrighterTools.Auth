using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Validates plaintext passwords against the host application's current password hash format.
/// </summary>
public interface IPasswordVerifier
{
    /// <summary>
    /// Validates the supplied plaintext password against the current password hash.
    /// </summary>
    Task<PasswordVerificationResult> VerifyAsync(AuthUser user, string password, CancellationToken cancellationToken = default);
}

