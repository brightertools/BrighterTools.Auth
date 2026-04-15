using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Validates passwords against a legacy hash format owned by the host application.
/// </summary>
public interface ILegacyPasswordVerifier
{
    /// <summary>
    /// Validates a password against the host application's legacy hash representation.
    /// </summary>
    Task<LegacyPasswordVerificationResult> VerifyAsync(AuthUser user, string password, CancellationToken cancellationToken = default);
}

