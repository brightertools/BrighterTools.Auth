using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Produces password hashes using the host application's current password hashing implementation.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Produces a password hash for the supplied user and plaintext password.
    /// </summary>
    Task<string> HashAsync(AuthUser user, string password, CancellationToken cancellationToken = default);
}

