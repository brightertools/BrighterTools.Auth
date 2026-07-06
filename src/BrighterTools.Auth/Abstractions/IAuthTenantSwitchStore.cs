using BrighterTools.Auth.Dtos;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Persists host-owned current-tenant state for tenant switching workflows.
/// </summary>
public interface IAuthTenantSwitchStore
{
    /// <summary>
    /// Validates access to the requested tenant and persists it as the user's current tenant.
    /// </summary>
    Task<AuthTenantSwitchResult> SwitchTenantAsync(SwitchTenantRequest request, CancellationToken cancellationToken = default);
}
