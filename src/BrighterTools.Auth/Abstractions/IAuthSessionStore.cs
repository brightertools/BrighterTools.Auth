using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Persists and retrieves the current auth session view that the host application wants to expose for a signed-in user.
/// </summary>
public interface IAuthSessionStore
{
    /// <summary>
    /// Returns the current session view stored for the specified user.
    /// </summary>
    Task<AuthSession?> GetCurrentSessionAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Persists the current auth session view for a user.
    /// </summary>
    Task SaveAsync(AuthSession session, CancellationToken cancellationToken = default);
}

