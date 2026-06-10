using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Abstractions;

public interface IAuthEmailAddressSyncService
{
    Task SyncAsync(AuthEmailAddressSyncRequest request, CancellationToken cancellationToken = default);
}
