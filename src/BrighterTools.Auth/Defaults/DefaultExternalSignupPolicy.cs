using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides secure default checks for external sign-up requests.
/// </summary>
public sealed class DefaultExternalSignupPolicy : IExternalSignupPolicy
{
    private readonly BrighterToolsAuthOptions _options;

    /// <summary>
    /// Initializes a new instance of the <see cref="DefaultExternalSignupPolicy"/> class.
    /// </summary>
    public DefaultExternalSignupPolicy(IOptions<BrighterToolsAuthOptions> options)
    {
        _options = options.Value;
    }

    /// <summary>
    /// Evaluates whether external sign-up is allowed.
    /// </summary>
    public Task<ExternalSignupDecision> EvaluateAsync(ExternalSignupContext context, CancellationToken cancellationToken = default)
    {
        if (!context.IsExplicitSignup && !_options.ExternalSignup.AllowProvisioningFromLogin)
        {
            return Task.FromResult(ExternalSignupDecision.Deny("External login cannot create an account."));
        }

        if (_options.ExternalSignup.RequireTermsAcceptance && !context.Request.TermsAccepted)
        {
            return Task.FromResult(ExternalSignupDecision.Deny("Terms of service must be accepted."));
        }

        if (_options.ExternalSignup.RequirePrivacyPolicyAcceptance && !context.Request.PrivacyPolicyAccepted)
        {
            return Task.FromResult(ExternalSignupDecision.Deny("Privacy policy must be accepted."));
        }

        if (_options.ExternalSignup.RequireVerifiedEmail && (string.IsNullOrWhiteSpace(context.Identity.Email) || !context.Identity.EmailVerified))
        {
            return Task.FromResult(ExternalSignupDecision.Deny("A verified email address is required."));
        }

        return Task.FromResult(ExternalSignupDecision.Allow());
    }
}
