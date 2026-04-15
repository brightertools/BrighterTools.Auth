namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Creates and redeems MFA recovery codes using the host application's persistence rules.
/// </summary>
public interface IRecoveryCodeService
{
    /// <summary>
    /// Generates recovery codes for the specified user.
    /// </summary>
    Task<IReadOnlyList<string>> GenerateAsync(string userId, int count, CancellationToken cancellationToken = default);
    /// <summary>
    /// Attempts to redeem a recovery code for the specified user.
    /// </summary>
    Task<bool> RedeemAsync(string userId, string recoveryCode, CancellationToken cancellationToken = default);
}

