using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Fail-closed default tenant switch store used when the host application has not enabled tenant switching.
/// </summary>
public sealed class UnsupportedAuthTenantSwitchStore : IAuthTenantSwitchStore
{
    public Task<AuthTenantSwitchResult> SwitchTenantAsync(SwitchTenantRequest request, CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Tenant switching is not configured for this application.");
}
