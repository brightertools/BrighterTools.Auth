using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Persists, rotates, and revokes refresh tokens using the host application's storage model.
/// </summary>
public interface IRefreshTokenStore
{
    /// <summary>
    /// Finds a refresh token by its opaque token value.
    /// </summary>
    Task<AuthRefreshToken?> FindAsync(string refreshToken, CancellationToken cancellationToken = default);
    /// <summary>
    /// Creates and persists a new refresh token.
    /// </summary>
    Task<AuthRefreshToken> IssueAsync(RefreshTokenIssueRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Replaces an existing refresh token with a newly issued token.
    /// </summary>
    Task<AuthRefreshToken> RotateAsync(AuthRefreshToken currentToken, RefreshTokenIssueRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Revokes a refresh token and records an optional reason.
    /// </summary>
    Task RevokeAsync(string refreshToken, string? reason, CancellationToken cancellationToken = default);
}

