using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an implementation of mFA Challenge Service that reports the feature as unsupported.
/// </summary>
public sealed class UnsupportedMfaChallengeService : IMfaChallengeService
{
    /// <summary>
    /// Performs the begin Enrollment operation.
    /// </summary>
    public Task<MfaEnrollmentStart> BeginEnrollmentAsync(AuthUser user, CancellationToken cancellationToken = default)
        => Task.FromException<MfaEnrollmentStart>(new NotSupportedException("MFA is not configured."));

    /// <summary>
    /// Performs the challenge operation.
    /// </summary>
    public Task<MfaChallengeResult> ChallengeAsync(AuthUser user, string code, CancellationToken cancellationToken = default)
        => Task.FromException<MfaChallengeResult>(new NotSupportedException("MFA is not configured."));

    /// <summary>
    /// Performs the verify Enrollment operation.
    /// </summary>
    public Task<MfaVerificationResult> VerifyEnrollmentAsync(AuthUser user, string code, CancellationToken cancellationToken = default)
        => Task.FromException<MfaVerificationResult>(new NotSupportedException("MFA is not configured."));
}

