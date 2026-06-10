using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a fail-closed mobile handoff implementation for apps that have not configured native shell support.
/// </summary>
public sealed class UnsupportedMobileWebHandoffService : IMobileWebHandoffService
{
    /// <summary>
    /// Creates a one-time handoff code for an already authenticated native/mobile context.
    /// </summary>
    public Task<MobileWebHandoffResponse> CreateAsync(CreateMobileWebHandoffRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<MobileWebHandoffResponse>(new NotSupportedException("Mobile web handoff is not configured."));

    /// <summary>
    /// Exchanges a one-time handoff code for a web authentication response.
    /// </summary>
    public Task<AuthResponse> ExchangeAsync(ExchangeMobileWebHandoffRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<AuthResponse>(new NotSupportedException("Mobile web handoff is not configured."));
}
