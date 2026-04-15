namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Verifies whether a request was made by a human for a given action.
/// </summary>
public interface IHumanVerificationService
{
    Task<bool> VerifyAsync(string? token, string action, CancellationToken cancellationToken = default);
}
