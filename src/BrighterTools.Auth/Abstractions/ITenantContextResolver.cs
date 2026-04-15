using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Resolves the tenant membership that should apply to the current authentication flow.
/// </summary>
public interface ITenantContextResolver
{
    /// <summary>
    /// Resolves the tenant membership that should be applied to the current authentication operation.
    /// </summary>
    Task<AuthTenantMembership?> ResolveAsync(AuthUser user, string? requestedTenantId, bool switchToCurrentTenant, CancellationToken cancellationToken = default);
}

