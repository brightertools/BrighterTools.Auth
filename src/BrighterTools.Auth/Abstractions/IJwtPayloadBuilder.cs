using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Builds the application-owned token descriptor that will be passed to the access token issuer.
/// </summary>
public interface IJwtPayloadBuilder
{
    /// <summary>
    /// Builds the token descriptor that should be issued for the supplied user, tenant context, and provider.
    /// </summary>
    Task<AuthTokenDescriptor> BuildAsync(AuthUser user, AuthTenantMembership? tenantMembership, AuthProviderType provider, CancellationToken cancellationToken = default);
}

