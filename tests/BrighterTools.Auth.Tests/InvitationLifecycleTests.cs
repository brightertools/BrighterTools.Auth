using BrighterTools.Auth.Services;
using Xunit;

namespace BrighterTools.Auth.Tests;
public class InvitationLifecycleTests
{
    [Theory]
    [InlineData("Pending", false, false, true)]
    [InlineData("Pending", true, true, true)]
    [InlineData("Accepted", false, true, false)]
    [InlineData("Declined", false, true, false)]
    [InlineData("Expired", false, true, true)]
    [InlineData("Revoked", false, true, false)]
    [InlineData("Cancelled", false, true, false)]
    [InlineData("Unknown", true, false, false)]
    public void TransitionsPreserveConsumedHistory(string status, bool expired, bool archive, bool cancel)
    {
        var now = DateTimeOffset.UtcNow;
        Assert.Equal(archive, InvitationLifecycle.CanArchive(status, now.AddMinutes(expired ? -1 : 1), now));
        Assert.Equal(cancel, InvitationLifecycle.CanCancel(status));
    }
}
