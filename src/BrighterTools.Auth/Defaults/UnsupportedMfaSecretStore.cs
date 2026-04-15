using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an implementation of mFA Secret Store that reports the feature as unsupported.
/// </summary>
public sealed class UnsupportedMfaSecretStore : IMfaSecretStore
{
    /// <summary>
    /// Performs the disable operation.
    /// </summary>
    public Task DisableAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("MFA is not configured."));

    /// <summary>
    /// Performs the get operation.
    /// </summary>
    public Task<MfaEnrollment?> GetAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromException<MfaEnrollment?>(new NotSupportedException("MFA is not configured."));

    /// <summary>
    /// Performs the save operation.
    /// </summary>
    public Task SaveAsync(MfaEnrollment enrollment, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("MFA is not configured."));
}

