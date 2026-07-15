using BrighterTools.Auth.Defaults;
using BrighterTools.Auth.Dtos;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Options;
using Xunit;

namespace BrighterTools.Auth.Tests;

public sealed class DefaultExternalSignupPolicyTests
{
    [Fact]
    public async Task EvaluateAsync_AllowsVerifiedFallbackEmail_WhenProviderDoesNotSupplyEmail()
    {
        var policy = CreatePolicy();

        var decision = await policy.EvaluateAsync(new ExternalSignupContext
        {
            IsExplicitSignup = true,
            Identity = new ExternalIdentity
            {
                Provider = AuthProviderType.Microsoft,
                ProviderSubject = "microsoft-subject",
                Email = null,
                EmailVerified = false
            },
            Request = new ExternalSignupRequest
            {
                Provider = AuthProviderType.Microsoft,
                Credential = "microsoft-id-token",
                TermsAccepted = true,
                PrivacyPolicyAccepted = true,
                VerifiedEmail = "user@example.com",
                EmailVerificationChallengeId = "signup-challenge-1"
            }
        });

        Assert.True(decision.Allowed);
    }

    [Fact]
    public async Task EvaluateAsync_DeniesMissingVerifiedEmail_WhenProviderDoesNotSupplyEmail()
    {
        var policy = CreatePolicy();

        var decision = await policy.EvaluateAsync(new ExternalSignupContext
        {
            IsExplicitSignup = true,
            Identity = new ExternalIdentity
            {
                Provider = AuthProviderType.Microsoft,
                ProviderSubject = "microsoft-subject",
                Email = null,
                EmailVerified = false
            },
            Request = new ExternalSignupRequest
            {
                Provider = AuthProviderType.Microsoft,
                Credential = "microsoft-id-token",
                TermsAccepted = true,
                PrivacyPolicyAccepted = true
            }
        });

        Assert.False(decision.Allowed);
        Assert.Equal("A verified email address is required.", decision.Reason);
    }

    private static DefaultExternalSignupPolicy CreatePolicy()
        => new(Microsoft.Extensions.Options.Options.Create(new BrighterToolsAuthOptions
        {
            ExternalSignup = new ExternalSignupOptions
            {
                RequireVerifiedEmail = true,
                RequireTermsAcceptance = true,
                RequirePrivacyPolicyAcceptance = true
            }
        }));
}
