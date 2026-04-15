using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a null-object implementation of auth Session Store.
/// </summary>
public sealed class NullAuthSessionStore : IAuthSessionStore
{
    /// <summary>
    /// Performs the get Current Session operation.
    /// </summary>
    public Task<AuthSession?> GetCurrentSessionAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromResult<AuthSession?>(null);

    /// <summary>
    /// Performs the save operation.
    /// </summary>
    public Task SaveAsync(AuthSession session, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}

