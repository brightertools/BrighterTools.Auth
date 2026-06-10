using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Creates and exchanges short-lived one-time codes for native shell to WebView session handoff.
/// </summary>
public interface IMobileWebHandoffService
{
    /// <summary>
    /// Creates a one-time handoff code for an already authenticated native/mobile context.
    /// </summary>
    Task<MobileWebHandoffResponse> CreateAsync(CreateMobileWebHandoffRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Exchanges a one-time handoff code for a web authentication response.
    /// </summary>
    Task<AuthResponse> ExchangeAsync(ExchangeMobileWebHandoffRequest request, CancellationToken cancellationToken = default);
}
