using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Begins, verifies, and challenges MFA enrollment using the host application's MFA implementation.
/// </summary>
public interface IMfaChallengeService
{
    /// <summary>
    /// Begins MFA enrollment and returns the secret or QR payload required by the host UX.
    /// </summary>
    Task<MfaEnrollmentStart> BeginEnrollmentAsync(AuthUser user, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies an enrollment code and returns any recovery codes issued by the host.
    /// </summary>
    Task<MfaVerificationResult> VerifyEnrollmentAsync(AuthUser user, string code, CancellationToken cancellationToken = default);
    /// <summary>
    /// Validates an MFA challenge code or recovery code.
    /// </summary>
    Task<MfaChallengeResult> ChallengeAsync(AuthUser user, string code, CancellationToken cancellationToken = default);
}

