using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Issues access tokens from an application-owned token descriptor.
/// </summary>
public interface ITokenIssuer
{
    /// <summary>
    /// Issues an access token from the supplied token descriptor.
    /// </summary>
    Task<IssuedAccessToken> IssueAsync(AuthTokenDescriptor descriptor, CancellationToken cancellationToken = default);
}

