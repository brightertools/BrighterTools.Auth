using BrighterTools.Auth.Abstractions;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an implementation of recovery Code Service that reports the feature as unsupported.
/// </summary>
public sealed class UnsupportedRecoveryCodeService : IRecoveryCodeService
{
    /// <summary>
    /// Performs the generate operation.
    /// </summary>
    public Task<IReadOnlyList<string>> GenerateAsync(string userId, int count, CancellationToken cancellationToken = default)
        => Task.FromException<IReadOnlyList<string>>(new NotSupportedException("Recovery codes are not configured."));

    /// <summary>
    /// Performs the redeem operation.
    /// </summary>
    public Task<bool> RedeemAsync(string userId, string recoveryCode, CancellationToken cancellationToken = default)
        => Task.FromException<bool>(new NotSupportedException("Recovery codes are not configured."));
}

