using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Defaults;

public sealed class NoOpAuthEmailAddressSyncService : IAuthEmailAddressSyncService
{
    public Task SyncAsync(AuthEmailAddressSyncRequest request, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
