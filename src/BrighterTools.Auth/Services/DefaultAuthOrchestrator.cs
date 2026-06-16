using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Defaults;
using BrighterTools.Auth.Dtos;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Services;

/// <summary>
/// Coordinates authentication workflows using the configured BrighterTools.Auth abstractions.
/// </summary>
public sealed class DefaultAuthOrchestrator : IAuthOrchestrator
{
    private readonly IUserLookupService _userLookupService;
    private readonly IUserProvisioningService _userProvisioningService;
    private readonly IRegistrationWorkflowService _registrationWorkflowService;
    private readonly ISignupEmailVerificationWorkflowService _signupEmailVerificationWorkflowService;
    private readonly IPasswordVerifier _passwordVerifier;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILegacyPasswordVerifier _legacyPasswordVerifier;
    private readonly IPasswordRehashPolicy _passwordRehashPolicy;
    private readonly IEnumerable<IExternalAuthProviderValidator> _externalValidators;
    private readonly IExternalLoginStore _externalLoginStore;
    private readonly IExternalUserProvisioningPolicy _externalUserProvisioningPolicy;
    private readonly IExternalSignupPolicy _externalSignupPolicy;
    private readonly IJwtPayloadBuilder _jwtPayloadBuilder;
    private readonly ITokenIssuer _tokenIssuer;
    private readonly IRefreshTokenStore _refreshTokenStore;
    private readonly IAuthSessionStore _authSessionStore;
    private readonly ITenantContextResolver _tenantContextResolver;
    private readonly IOnboardingStateEvaluator _onboardingStateEvaluator;
    private readonly IOnboardingCompletionService _onboardingCompletionService;
    private readonly IEmailWorkflowService _emailWorkflowService;
    private readonly IAccountLoginMethodWorkflowService _accountLoginMethodWorkflowService;
    private readonly IPasswordlessEmailLoginWorkflowService _passwordlessEmailLoginWorkflowService;
    private readonly IMfaSecretStore _mfaSecretStore;
    private readonly IMfaChallengeService _mfaChallengeService;
    private readonly IRecoveryCodeService _recoveryCodeService;
    private readonly IUserLoginProviderPolicy _loginProviderPolicy;
    private readonly IUserLoginProviderUnlinkPolicy _loginProviderUnlinkPolicy;
    private readonly IUserSecurityEventRecorder _securityEventRecorder;
    private readonly IClock _clock;
    private readonly BrighterToolsAuthOptions _options;

    /// <summary>
    /// Initializes a new instance of the DefaultAuthOrchestrator class.
    /// </summary>
    public DefaultAuthOrchestrator(
        IUserLookupService userLookupService,
        IUserProvisioningService userProvisioningService,
        IRegistrationWorkflowService registrationWorkflowService,
        IPasswordVerifier passwordVerifier,
        IPasswordHasher passwordHasher,
        ILegacyPasswordVerifier legacyPasswordVerifier,
        IPasswordRehashPolicy passwordRehashPolicy,
        IEnumerable<IExternalAuthProviderValidator> externalValidators,
        IExternalLoginStore externalLoginStore,
        IExternalUserProvisioningPolicy externalUserProvisioningPolicy,
        IExternalSignupPolicy externalSignupPolicy,
        IJwtPayloadBuilder jwtPayloadBuilder,
        ITokenIssuer tokenIssuer,
        IRefreshTokenStore refreshTokenStore,
        IAuthSessionStore authSessionStore,
        ITenantContextResolver tenantContextResolver,
        IOnboardingStateEvaluator onboardingStateEvaluator,
        IOnboardingCompletionService onboardingCompletionService,
        IEmailWorkflowService emailWorkflowService,
        IAccountLoginMethodWorkflowService accountLoginMethodWorkflowService,
        IPasswordlessEmailLoginWorkflowService passwordlessEmailLoginWorkflowService,
        IMfaSecretStore mfaSecretStore,
        IMfaChallengeService mfaChallengeService,
        IRecoveryCodeService recoveryCodeService,
        IUserLoginProviderPolicy loginProviderPolicy,
        IUserLoginProviderUnlinkPolicy loginProviderUnlinkPolicy,
        IUserSecurityEventRecorder securityEventRecorder,
        IClock clock,
        IOptions<BrighterToolsAuthOptions> options,
        ISignupEmailVerificationWorkflowService? signupEmailVerificationWorkflowService = null)
    {
        _userLookupService = userLookupService;
        _userProvisioningService = userProvisioningService;
        _registrationWorkflowService = registrationWorkflowService;
        _signupEmailVerificationWorkflowService = signupEmailVerificationWorkflowService ?? new UnsupportedSignupEmailVerificationWorkflowService();
        _passwordVerifier = passwordVerifier;
        _passwordHasher = passwordHasher;
        _legacyPasswordVerifier = legacyPasswordVerifier;
        _passwordRehashPolicy = passwordRehashPolicy;
        _externalValidators = externalValidators;
        _externalLoginStore = externalLoginStore;
        _externalUserProvisioningPolicy = externalUserProvisioningPolicy;
        _externalSignupPolicy = externalSignupPolicy;
        _jwtPayloadBuilder = jwtPayloadBuilder;
        _tokenIssuer = tokenIssuer;
        _refreshTokenStore = refreshTokenStore;
        _authSessionStore = authSessionStore;
        _tenantContextResolver = tenantContextResolver;
        _onboardingStateEvaluator = onboardingStateEvaluator;
        _onboardingCompletionService = onboardingCompletionService;
        _emailWorkflowService = emailWorkflowService;
        _accountLoginMethodWorkflowService = accountLoginMethodWorkflowService;
        _passwordlessEmailLoginWorkflowService = passwordlessEmailLoginWorkflowService;
        _mfaSecretStore = mfaSecretStore;
        _mfaChallengeService = mfaChallengeService;
        _recoveryCodeService = recoveryCodeService;
        _loginProviderPolicy = loginProviderPolicy;
        _loginProviderUnlinkPolicy = loginProviderUnlinkPolicy;
        _securityEventRecorder = securityEventRecorder;
        _clock = clock;
        _options = options.Value;
    }

    /// <summary>
    /// Authenticates a user with a password.
    /// </summary>
    public async Task<AuthResponse> LoginWithPasswordAsync(PasswordLoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userLookupService.FindByLoginAsync(request.Login, cancellationToken)
            ?? throw new InvalidOperationException("Invalid credentials.");

        EnsureProviderEnabled(AuthProviderType.Password);
        EnsureUserCanSignIn(user);
        await EnsureProviderAllowedAsync(user, AuthProviderType.Password, request.TenantId, cancellationToken);

        var verification = await _passwordVerifier.VerifyAsync(user, request.Password, cancellationToken);
        if (!verification.Succeeded)
        {
            var legacyResult = await _legacyPasswordVerifier.VerifyAsync(user, request.Password, cancellationToken);
            if (!legacyResult.Succeeded)
            {
                throw new InvalidOperationException("Invalid credentials.");
            }

            if (_options.PasswordMigration.TransparentLegacyUpgradeEnabled && legacyResult.RequiresUpgrade)
            {
                var upgradedHash = legacyResult.UpgradedHash ?? await _passwordHasher.HashAsync(user, request.Password, cancellationToken);
                await _userProvisioningService.UpdatePasswordHashAsync(user, upgradedHash, cancellationToken);
            }
        }
        else if (_passwordRehashPolicy.ShouldRehash(user, verification))
        {
            var upgradedHash = await _passwordHasher.HashAsync(user, request.Password, cancellationToken);
            await _userProvisioningService.UpdatePasswordHashAsync(user, upgradedHash, cancellationToken);
        }

        await _securityEventRecorder.RecordAsync(user.Id, "password_login_succeeded", cancellationToken: cancellationToken);
        return await CreateAuthResponseAsync(user, AuthProviderType.Password, request.TenantId, false, cancellationToken);
    }

    /// <summary>
    /// Authenticates a user with an external provider.
    /// </summary>
    public async Task<AuthResponse> LoginWithExternalProviderAsync(ExternalLoginRequest request, CancellationToken cancellationToken = default)
    {
        EnsureProviderEnabled(request.Provider);
        var validator = _externalValidators.FirstOrDefault(x => x.Provider == request.Provider)
            ?? throw new InvalidOperationException($"No validator registered for provider '{request.Provider}'.");

        var identity = await validator.ValidateAsync(request.Credential, cancellationToken);
        var user = await _userLookupService.FindByExternalLoginAsync(identity.Provider, identity.ProviderSubject, cancellationToken);
        if (user is null)
        {
            if (!request.AllowProvisioning || !_options.ExternalSignup.AllowProvisioningFromLogin)
            {
                throw new InvalidOperationException("No account is linked to this login method.");
            }

            var provisioningDecision = await _externalUserProvisioningPolicy.EvaluateAsync(identity, cancellationToken);
            if (!provisioningDecision.AllowProvisioning)
            {
                throw new InvalidOperationException(provisioningDecision.Reason ?? "No account is linked to this login method.");
            }

            var signupContext = new ExternalSignupContext
            {
                Request = new ExternalSignupRequest
                {
                    Provider = request.Provider,
                    Credential = request.Credential,
                    TenantId = request.TenantId
                },
                Identity = identity,
                IsExplicitSignup = false
            };

            var signupDecision = await _externalSignupPolicy.EvaluateAsync(signupContext, cancellationToken);
            if (!signupDecision.Allowed)
            {
                throw new InvalidOperationException(signupDecision.Reason ?? "This external login cannot create an account.");
            }

            user = await _userProvisioningService.CreateExternalUserAsync(signupContext, cancellationToken);
            await _externalLoginStore.LinkAsync(user.Id, identity, cancellationToken);
        }

        EnsureUserCanSignIn(user);
        await EnsureProviderAllowedAsync(user, request.Provider, request.TenantId, cancellationToken);
        return await CreateAuthResponseAsync(user, request.Provider, request.TenantId, false, cancellationToken);
    }

    /// <summary>
    /// Creates and authenticates a user with an external provider.
    /// </summary>
    public async Task<AuthResponse> SignupWithExternalProviderAsync(ExternalSignupRequest request, CancellationToken cancellationToken = default)
    {
        EnsureProviderEnabled(request.Provider);

        var validator = _externalValidators.FirstOrDefault(x => x.Provider == request.Provider)
            ?? throw new InvalidOperationException($"No validator registered for provider '{request.Provider}'.");

        var identity = await validator.ValidateAsync(request.Credential, cancellationToken);
        var existingUser = await _userLookupService.FindByExternalLoginAsync(identity.Provider, identity.ProviderSubject, cancellationToken);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("This external login is already linked to an account.");
        }

        var signupContext = new ExternalSignupContext
        {
            Request = request,
            Identity = identity,
            IsExplicitSignup = true
        };

        var signupDecision = await _externalSignupPolicy.EvaluateAsync(signupContext, cancellationToken);
        if (!signupDecision.Allowed)
        {
            throw new InvalidOperationException(signupDecision.Reason ?? "This external login cannot create an account.");
        }

        var user = await _userProvisioningService.CreateExternalUserAsync(signupContext, cancellationToken);
        await _externalLoginStore.LinkAsync(user.Id, identity, cancellationToken);

        EnsureUserCanSignIn(user);
        await EnsureProviderAllowedAsync(user, request.Provider, request.TenantId, cancellationToken);
        return await CreateAuthResponseAsync(user, request.Provider, request.TenantId, false, cancellationToken);
    }

    /// <summary>
    /// Issues a new session for a user whose identity has already been trusted by the host application.
    /// </summary>
    public async Task<AuthResponse> IssueSessionAsync(IssueSessionRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            throw new InvalidOperationException("User id is required.");
        }

        EnsureProviderEnabled(request.Provider);
        var user = await RequireUserAsync(request.UserId, cancellationToken);
        EnsureUserCanSignIn(user);
        await EnsureProviderAllowedAsync(user, request.Provider, request.TenantId, cancellationToken);
        return await CreateAuthResponseAsync(user, request.Provider, request.TenantId, request.SwitchToCurrentTenant, cancellationToken);
    }
    /// <summary>
    /// Refreshes an existing authentication session.
    /// </summary>
    public async Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var refreshToken = await _refreshTokenStore.FindAsync(request.RefreshToken, cancellationToken)
            ?? throw new InvalidOperationException("Refresh token is invalid.");

        if (refreshToken.IsRevoked)
        {
            if (_options.RefreshTokens.RevokeOnUseOfRevokedAncestor)
            {
                await _refreshTokenStore.RevokeAsync(request.RefreshToken, "revoked_token_reused", cancellationToken);
            }

            throw new InvalidOperationException("Refresh token is invalid.");
        }

        if (refreshToken.ExpiresAtUtc <= _clock.UtcNow)
        {
            throw new InvalidOperationException("Refresh token is invalid.");
        }

        var user = await RequireUserAsync(refreshToken.UserId, cancellationToken);
        return await CreateAuthResponseAsync(user, refreshToken.Provider, request.TenantId ?? refreshToken.TenantId, request.SwitchToCurrentTenant, cancellationToken, refreshToken);
    }

    /// <summary>
    /// Revokes the supplied refresh token.
    /// </summary>
    public Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
        => _refreshTokenStore.RevokeAsync(request.RefreshToken, "logout", cancellationToken);

    /// <summary>
    /// Signs up a user with a password-based flow.
    /// </summary>
    public Task<PasswordSignupResult> SignupWithPasswordAsync(PasswordSignupRequest request, CancellationToken cancellationToken = default)
        => _registrationWorkflowService.SignupWithPasswordAsync(request, cancellationToken);

    /// <summary>
    /// Begins email verification before password-based sign-up.
    /// </summary>
    public Task<BeginSignupEmailVerificationResponse> BeginSignupEmailVerificationAsync(BeginSignupEmailVerificationRequest request, CancellationToken cancellationToken = default)
        => _signupEmailVerificationWorkflowService.BeginSignupEmailVerificationAsync(request, cancellationToken);

    /// <summary>
    /// Verifies a signup email challenge code before password-based sign-up.
    /// </summary>
    public Task<VerifySignupEmailVerificationCodeResponse> VerifySignupEmailVerificationCodeAsync(VerifySignupEmailVerificationCodeRequest request, CancellationToken cancellationToken = default)
        => _signupEmailVerificationWorkflowService.VerifySignupEmailVerificationCodeAsync(request, cancellationToken);

    /// <summary>
    /// Accepts an invitation using a password-based flow.
    /// </summary>
    public Task<InvitationAcceptanceResult> AcceptInvitationWithPasswordAsync(AcceptInvitationWithPasswordRequest request, CancellationToken cancellationToken = default)
        => _registrationWorkflowService.AcceptInvitationWithPasswordAsync(request, cancellationToken);

    /// <summary>
    /// Begins the password reset flow.
    /// </summary>
    public Task BeginPasswordResetAsync(BeginPasswordResetRequest request, CancellationToken cancellationToken = default)
        => _emailWorkflowService.BeginPasswordResetAsync(request.Login, cancellationToken);

    /// <summary>
    /// Completes the password reset flow.
    /// </summary>
    public Task CompletePasswordResetAsync(CompletePasswordResetRequest request, CancellationToken cancellationToken = default)
        => _emailWorkflowService.CompletePasswordResetAsync(request.Token, request.NewPassword, cancellationToken);

    /// <summary>
    /// Begins the email verification flow.
    /// </summary>
    public Task BeginEmailVerificationAsync(string userId, CancellationToken cancellationToken = default)
        => _emailWorkflowService.BeginEmailVerificationAsync(userId, cancellationToken);

    /// <summary>
    /// Confirms an email verification token.
    /// </summary>
    public Task ConfirmEmailVerificationAsync(ConfirmEmailVerificationRequest request, CancellationToken cancellationToken = default)
        => _emailWorkflowService.ConfirmEmailVerificationAsync(request.Token, cancellationToken);

    /// <summary>
    /// Activates an account using the supplied token.
    /// </summary>
    public Task ActivateAccountAsync(AccountActivationRequest request, CancellationToken cancellationToken = default)
        => _emailWorkflowService.ActivateAccountAsync(request.Token, cancellationToken);

    /// <summary>
    /// Begins MFA enrollment for the supplied user.
    /// </summary>
    public async Task<MfaEnrollmentResponse> BeginMfaEnrollmentAsync(string userId, CancellationToken cancellationToken = default)
    {
        EnsureMfaEnabled();

        var user = await RequireUserAsync(userId, cancellationToken);
        var enrollment = await _mfaChallengeService.BeginEnrollmentAsync(user, cancellationToken);
        await _mfaSecretStore.SaveAsync(new MfaEnrollment
        {
            UserId = user.Id,
            Secret = enrollment.Secret,
            Confirmed = false,
            CreatedAtUtc = _clock.UtcNow
        }, cancellationToken);

        return new MfaEnrollmentResponse
        {
            Secret = enrollment.Secret,
            OtpauthUri = enrollment.OtpauthUri,
            QrCodeSvg = enrollment.QrCodeSvg
        };
    }

    /// <summary>
    /// Verifies MFA enrollment for the supplied user.
    /// </summary>
    public async Task<MfaEnrollmentResponse> VerifyMfaEnrollmentAsync(string userId, string code, CancellationToken cancellationToken = default)
    {
        EnsureMfaEnabled();

        var user = await RequireUserAsync(userId, cancellationToken);
        var verification = await _mfaChallengeService.VerifyEnrollmentAsync(user, code, cancellationToken);
        if (!verification.Succeeded)
        {
            throw new InvalidOperationException("MFA verification failed.");
        }

        var current = await _mfaSecretStore.GetAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("MFA enrollment not found.");

        await _mfaSecretStore.SaveAsync(new MfaEnrollment
        {
            UserId = current.UserId,
            Secret = current.Secret,
            Confirmed = true,
            CreatedAtUtc = current.CreatedAtUtc
        }, cancellationToken);

        return new MfaEnrollmentResponse
        {
            Secret = current.Secret,
            RecoveryCodes = verification.RecoveryCodes
        };
    }

    /// <summary>
    /// Challenges the supplied user with an MFA code.
    /// </summary>
    public async Task<MfaChallengeResponse> ChallengeMfaAsync(string userId, string code, CancellationToken cancellationToken = default)
    {
        EnsureMfaEnabled();

        var user = await RequireUserAsync(userId, cancellationToken);
        var result = await _mfaChallengeService.ChallengeAsync(user, code, cancellationToken);
        if (!result.Succeeded)
        {
            var redeemed = await _recoveryCodeService.RedeemAsync(userId, code, cancellationToken);
            result = new MfaChallengeResult { Succeeded = redeemed, UsedRecoveryCode = redeemed };
        }

        return new MfaChallengeResponse
        {
            Succeeded = result.Succeeded,
            UsedRecoveryCode = result.UsedRecoveryCode
        };
    }

    /// <summary>
    /// Disables MFA for the supplied user.
    /// </summary>
    public Task DisableMfaAsync(string userId, CancellationToken cancellationToken = default)
    {
        EnsureMfaEnabled();
        return _mfaSecretStore.DisableAsync(userId, cancellationToken);
    }

    /// <summary>
    /// Gets the external providers linked to the supplied user.
    /// </summary>
    public async Task<LinkedProvidersResponse> GetLinkedProvidersAsync(string userId, CancellationToken cancellationToken = default)
        => new() { Providers = await _externalLoginStore.GetLinkedLoginsAsync(userId, cancellationToken) };

    /// <summary>
    /// Links an external provider to the supplied user.
    /// </summary>
    public async Task<LinkedProvidersResponse> LinkProviderAsync(string userId, AuthProviderType provider, string credential, CancellationToken cancellationToken = default)
    {
        EnsureProviderEnabled(provider);
        var validator = _externalValidators.FirstOrDefault(x => x.Provider == provider)
            ?? throw new InvalidOperationException($"No validator registered for provider '{provider}'.");

        var identity = await validator.ValidateAsync(credential, cancellationToken);
        var existingUser = await _userLookupService.FindByExternalLoginAsync(identity.Provider, identity.ProviderSubject, cancellationToken);
        if (existingUser is not null && !string.Equals(existingUser.Id, userId, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("This external login is already linked to another user.");
        }

        await _externalLoginStore.LinkAsync(userId, identity, cancellationToken);
        return await GetLinkedProvidersAsync(userId, cancellationToken);
    }

    /// <summary>
    /// Unlinks an external provider from the supplied user.
    /// </summary>
    public async Task<LinkedProvidersResponse> UnlinkProviderAsync(string userId, AuthProviderType provider, string providerSubject, CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var linkedLogins = await _externalLoginStore.GetLinkedLoginsAsync(userId, cancellationToken);
        var unlinkDecision = await _loginProviderUnlinkPolicy.EvaluateAsync(new ProviderUnlinkContext
        {
            User = user,
            Provider = provider,
            ProviderSubject = providerSubject,
            LinkedLogins = linkedLogins
        }, cancellationToken);

        if (!unlinkDecision.Allowed)
        {
            throw new InvalidOperationException(unlinkDecision.Reason ?? "This login provider cannot be removed.");
        }

        await _externalLoginStore.UnlinkAsync(userId, provider, providerSubject, cancellationToken);
        return await GetLinkedProvidersAsync(userId, cancellationToken);
    }

    /// <summary>
    /// Gets account login methods for the supplied user.
    /// </summary>
    public Task<AccountLoginMethodsResponse> GetAccountLoginMethodsAsync(string userId, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.GetAccountLoginMethodsAsync(userId, cancellationToken);

    /// <summary>
    /// Begins a login email change challenge.
    /// </summary>
    public Task<BeginLoginEmailChangeResponse> BeginLoginEmailChangeAsync(string userId, BeginLoginEmailChangeRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.BeginLoginEmailChangeAsync(userId, request, cancellationToken);

    /// <summary>
    /// Verifies a login email change with a code.
    /// </summary>
    public Task<VerifyLoginEmailChangeResponse> VerifyLoginEmailChangeCodeAsync(string userId, VerifyLoginEmailChangeCodeRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.VerifyLoginEmailChangeCodeAsync(userId, request, cancellationToken);

    /// <summary>
    /// Verifies a login email change with a link token.
    /// </summary>
    public Task<VerifyLoginEmailChangeResponse> ConfirmLoginEmailChangeAsync(ConfirmLoginEmailChangeRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.ConfirmLoginEmailChangeAsync(request, cancellationToken);

    /// <summary>
    /// Begins a notification email change challenge.
    /// </summary>
    public Task<BeginLoginEmailChangeResponse> BeginNotificationEmailChangeAsync(string userId, BeginNotificationEmailChangeRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.BeginNotificationEmailChangeAsync(userId, request, cancellationToken);

    /// <summary>
    /// Verifies a notification email change with a code.
    /// </summary>
    public Task<VerifyNotificationEmailChangeResponse> VerifyNotificationEmailChangeCodeAsync(string userId, VerifyNotificationEmailChangeCodeRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.VerifyNotificationEmailChangeCodeAsync(userId, request, cancellationToken);

    /// <summary>
    /// Verifies a notification email change with a link token.
    /// </summary>
    public Task<VerifyNotificationEmailChangeResponse> ConfirmNotificationEmailChangeAsync(ConfirmNotificationEmailChangeRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.ConfirmNotificationEmailChangeAsync(request, cancellationToken);

    /// <summary>
    /// Begins password setup for the supplied user.
    /// </summary>
    public Task<BeginPasswordSetupResponse> BeginPasswordSetupAsync(string userId, BeginPasswordSetupRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.BeginPasswordSetupAsync(userId, request, cancellationToken);

    /// <summary>
    /// Completes inline password setup for the supplied user.
    /// </summary>
    public Task<CompletePasswordSetupResponse> CompletePasswordSetupAsync(string userId, CompletePasswordSetupRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.CompletePasswordSetupAsync(userId, request, cancellationToken);

    /// <summary>
    /// Changes the password for an authenticated user.
    /// </summary>
    public Task<ChangePasswordResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.ChangePasswordAsync(userId, request, cancellationToken);

    /// <summary>
    /// Removes password login for the supplied user.
    /// </summary>
    public Task<RemovePasswordLoginResponse> RemovePasswordLoginAsync(string userId, CancellationToken cancellationToken = default)
        => _accountLoginMethodWorkflowService.RemovePasswordLoginAsync(userId, cancellationToken);

    /// <summary>
    /// Begins a passwordless email login challenge.
    /// </summary>
    public Task<BeginPasswordlessEmailLoginResponse> BeginPasswordlessEmailLoginAsync(BeginPasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default)
        => _passwordlessEmailLoginWorkflowService.BeginAsync(request, cancellationToken);

    /// <summary>
    /// Completes passwordless email login and issues a session.
    /// </summary>
    public async Task<AuthResponse> CompletePasswordlessEmailLoginAsync(CompletePasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default)
    {
        EnsureProviderEnabled(AuthProviderType.EmailOtp);
        var result = await _passwordlessEmailLoginWorkflowService.CompleteAsync(request, cancellationToken);
        if (string.IsNullOrWhiteSpace(result.UserId))
        {
            throw new InvalidOperationException("Passwordless email login failed.");
        }

        var user = await RequireUserAsync(result.UserId, cancellationToken);
        EnsureUserCanSignIn(user);
        await EnsureProviderAllowedAsync(user, AuthProviderType.EmailOtp, request.TenantId, cancellationToken);
        return await CreateAuthResponseAsync(user, AuthProviderType.EmailOtp, request.TenantId, request.SwitchToCurrentTenant, cancellationToken);
    }
    /// <summary>
    /// Gets onboarding status for the supplied user and tenant context.
    /// </summary>
    public async Task<OnboardingStatusResponse> GetOnboardingStatusAsync(string userId, string? tenantId, CancellationToken cancellationToken = default)
    {
        if (!_options.Onboarding.Enabled)
        {
            return new OnboardingStatusResponse { Onboarding = OnboardingState.NotRequired() };
        }

        var user = await RequireUserAsync(userId, cancellationToken);
        var tenant = await _tenantContextResolver.ResolveAsync(user, tenantId, false, cancellationToken);
        var onboarding = await _onboardingStateEvaluator.EvaluateAsync(user, tenant, cancellationToken);
        return new OnboardingStatusResponse { Onboarding = onboarding };
    }

    /// <summary>
    /// Completes onboarding for the supplied user and tenant context.
    /// </summary>
    public async Task<OnboardingStatusResponse> CompleteOnboardingAsync(string userId, string? tenantId, IDictionary<string, object?> fields, CancellationToken cancellationToken = default)
    {
        EnsureOnboardingEnabled();

        var onboarding = await _onboardingCompletionService.CompleteAsync(userId, tenantId, fields, cancellationToken);
        return new OnboardingStatusResponse { Onboarding = onboarding };
    }

    /// <summary>
    /// Gets the current session for the supplied user.
    /// </summary>
    public async Task<CurrentSessionResponse> GetCurrentSessionAsync(string userId, CancellationToken cancellationToken = default)
        => new() { Session = await BuildCurrentSessionResponseAsync(userId, cancellationToken) };

    private async Task<AuthResponse> CreateAuthResponseAsync(AuthUser user, AuthProviderType provider, string? requestedTenantId, bool switchToCurrentTenant, CancellationToken cancellationToken, AuthRefreshToken? currentRefreshToken = null)
    {
        var tenantMembership = await _tenantContextResolver.ResolveAsync(user, requestedTenantId, switchToCurrentTenant, cancellationToken);
        var descriptor = await _jwtPayloadBuilder.BuildAsync(user, tenantMembership, provider, cancellationToken);
        var accessToken = await _tokenIssuer.IssueAsync(descriptor, cancellationToken);
        var issueRequest = new RefreshTokenIssueRequest
        {
            UserId = user.Id,
            TenantId = tenantMembership?.TenantId,
            Provider = provider,
            IssuedAtUtc = _clock.UtcNow,
            ExpiresAtUtc = _clock.UtcNow.Add(_options.RefreshTokens.Lifetime)
        };

        var refreshToken = currentRefreshToken is null || !_options.RefreshTokens.RotateOnRefresh
            ? await _refreshTokenStore.IssueAsync(issueRequest, cancellationToken)
            : await _refreshTokenStore.RotateAsync(currentRefreshToken, issueRequest, cancellationToken);

        var onboarding = await EvaluateOnboardingStateAsync(user, tenantMembership, cancellationToken);
        var session = new AuthSession
        {
            UserId = user.Id,
            AccessToken = accessToken.Token,
            RefreshToken = refreshToken.Token,
            ExpiresAtUtc = accessToken.ExpiresAtUtc,
            Provider = provider,
            CurrentTenant = tenantMembership,
            Onboarding = onboarding,
            Payload = descriptor.Properties
        };

        await _authSessionStore.SaveAsync(session, cancellationToken);

        return new AuthResponse
        {
            Session = new AuthSessionResponse
            {
                AccessToken = session.AccessToken,
                RefreshToken = session.RefreshToken,
                ExpiresAtUtc = session.ExpiresAtUtc,
                Provider = provider,
                CurrentTenant = tenantMembership,
                Onboarding = onboarding,
                Payload = session.Payload,
                User = new AuthUserSummary
                {
                    Id = user.Id,
                    SubjectId = user.SubjectId,
                    Email = user.Email,
                    UserName = user.UserName,
                    DisplayName = user.DisplayName
                }
            }
        };
    }

    private async Task<AuthSessionResponse?> BuildCurrentSessionResponseAsync(string userId, CancellationToken cancellationToken)
    {
        var session = await _authSessionStore.GetCurrentSessionAsync(userId, cancellationToken);
        if (session is null)
        {
            return null;
        }

        var user = await RequireUserAsync(userId, cancellationToken);
        return new AuthSessionResponse
        {
            AccessToken = session.AccessToken,
            RefreshToken = session.RefreshToken,
            ExpiresAtUtc = session.ExpiresAtUtc,
            Provider = session.Provider,
            CurrentTenant = session.CurrentTenant,
            Onboarding = _options.Onboarding.Enabled ? session.Onboarding : OnboardingState.NotRequired(),
            Payload = session.Payload,
            User = new AuthUserSummary
            {
                Id = user.Id,
                SubjectId = user.SubjectId,
                Email = user.Email,
                UserName = user.UserName,
                DisplayName = user.DisplayName
            }
        };
    }

    private async Task<AuthUser> RequireUserAsync(string userId, CancellationToken cancellationToken)
        => await _userLookupService.FindByIdAsync(userId, cancellationToken) ?? throw new InvalidOperationException("User not found.");

    private async Task<OnboardingState> EvaluateOnboardingStateAsync(AuthUser user, AuthTenantMembership? tenantMembership, CancellationToken cancellationToken)
    {
        if (!_options.Onboarding.Enabled)
        {
            return OnboardingState.NotRequired();
        }

        return await _onboardingStateEvaluator.EvaluateAsync(user, tenantMembership, cancellationToken);
    }

    private void EnsureMfaEnabled()
    {
        if (!_options.Mfa.Enabled)
        {
            throw new NotSupportedException("MFA is not enabled.");
        }
    }

    private void EnsureOnboardingEnabled()
    {
        if (!_options.Onboarding.Enabled)
        {
            throw new NotSupportedException("Onboarding is not enabled.");
        }
    }

    private static void EnsureUserCanSignIn(AuthUser user)
    {
        if (!user.CanSignIn)
        {
            throw new InvalidOperationException("User cannot sign in.");
        }
    }

    private void EnsureProviderEnabled(AuthProviderType provider)
    {
        if (!_options.Providers.EnabledProviders.Contains(provider))
        {
            throw new InvalidOperationException($"Provider '{provider}' is disabled.");
        }
    }

    private async Task EnsureProviderAllowedAsync(AuthUser user, AuthProviderType provider, string? tenantId, CancellationToken cancellationToken)
    {
        var result = await _loginProviderPolicy.EvaluateAsync(user, provider, tenantId, cancellationToken);
        if (!result.Allowed)
        {
            throw new InvalidOperationException(result.Reason ?? "Provider is not allowed.");
        }
    }
}





