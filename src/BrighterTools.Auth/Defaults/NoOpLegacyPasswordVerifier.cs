using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a no-op implementation of legacy Password Verifier.
/// </summary>
public sealed class NoOpLegacyPasswordVerifier : ILegacyPasswordVerifier
{
    /// <summary>
    /// Performs the verify operation.
    /// </summary>
    public Task<LegacyPasswordVerificationResult> VerifyAsync(AuthUser user, string password, CancellationToken cancellationToken = default)
        => Task.FromResult(new LegacyPasswordVerificationResult { Succeeded = false, RequiresUpgrade = false });
}

