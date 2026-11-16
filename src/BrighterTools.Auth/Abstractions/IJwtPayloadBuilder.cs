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

    /// <summary>Builds a descriptor with correlation established before signing. Existing hosts retain their claims.</summary>
    Task<AuthTokenDescriptor> BuildAsync(AuthUser user, AuthTenantMembership? tenantMembership, AuthProviderType provider,
        AuthSessionMetadata session, CancellationToken cancellationToken = default)
        => BuildAsync(user, tenantMembership, provider, cancellationToken);
}

