using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Defaults;
using BrighterTools.Auth.Dtos;
using BrighterTools.Auth.Models;
using BrighterTools.Auth.Options;
using BrighterTools.Auth.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace BrighterTools.Auth.Tests;

public sealed class DefaultAuthOrchestratorTests
{
    [Fact]
    public async Task LoginWithPassword_IssuesSessionAndRefreshToken()
    {
        var harness = TestHarness.Create();

        var response = await harness.Orchestrator.LoginWithPasswordAsync(new PasswordLoginRequest
        {
            Login = "alice@example.com",
            Password = "secret",
            TenantId = "tenant-a"
        });

        Assert.NotNull(response.Session);
        Assert.Equal("issued-access-token", response.Session!.AccessToken);
        Assert.Equal("refresh-1", response.Session.RefreshToken);
        Assert.Equal("tenant-a", response.Session.CurrentTenant?.TenantId);
    }

    [Fact]
    public async Task SignupWithPassword_DelegatesToRegistrationWorkflowService()
    {
        var harness = TestHarness.Create();
        harness.RegistrationWorkflowService.SignupResult = new PasswordSignupResult
        {
            UserId = "user-1",
            Auth = new AuthResponse
            {
                Session = new AuthSessionResponse
                {
                    AccessToken = "signup-access",
                    RefreshToken = "signup-refresh",
                    Provider = AuthProviderType.Password,
                    ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(15)
                }
            }
        };

        var response = await harness.Orchestrator.SignupWithPasswordAsync(new PasswordSignupRequest
        {
            Email = "alice@example.com",
            Password = "signup-secret",
            FirstName = "Alice"
        });

        Assert.Equal("signup-access", response.Auth?.Session?.AccessToken);
        Assert.Equal("alice@example.com", harness.RegistrationWorkflowService.SignupRequest?.Email);
        Assert.Equal("Alice", harness.RegistrationWorkflowService.SignupRequest?.FirstName);
    }

    [Fact]
    public async Task AcceptInvitationWithPassword_DelegatesToRegistrationWorkflowService()
    {
        var harness = TestHarness.Create();
        harness.RegistrationWorkflowService.InvitationResult = new InvitationAcceptanceResult
        {
            UserId = "user-1",
            Activated = true,
            Messages = ["invitation accepted"]
        };

        var response = await harness.Orchestrator.AcceptInvitationWithPasswordAsync(new AcceptInvitationWithPasswordRequest
        {
            InvitationToken = "invite-1",
            Email = "alice@example.com",
            Password = "secret"
        });

        Assert.True(response.Activated);
        Assert.Equal("invite-1", harness.RegistrationWorkflowService.AcceptInvitationRequest?.InvitationToken);
    }

    [Fact]
    public async Task LoginWithPassword_UsesLegacyVerifierAndRehashes()
    {
        var harness = TestHarness.Create(passwordShouldSucceed: false, legacyShouldSucceed: true);

        await harness.Orchestrator.LoginWithPasswordAsync(new PasswordLoginRequest
        {
            Login = "alice@example.com",
            Password = "legacy-secret"
        });

        Assert.Equal("hashed:legacy-secret", harness.UserProvisioningService.UpdatedPasswordHash);
    }

    [Fact]
    public async Task Refresh_RotatesRefreshToken()
    {
        var harness = TestHarness.Create();
        harness.RefreshTokenStore.StoredToken = new AuthRefreshToken
        {
            Token = "refresh-0",
            UserId = "user-1",
            TenantId = "tenant-a",
            Provider = AuthProviderType.Password,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(1)
        };

        var response = await harness.Orchestrator.RefreshAsync(new RefreshTokenRequest
        {
            RefreshToken = "refresh-0"
        });

        Assert.Equal("refresh-rotated", response.Session!.RefreshToken);
    }

    [Fact]
    public async Task CompletePasswordReset_DelegatesToEmailWorkflowService()
    {
        var harness = TestHarness.Create();

        await harness.Orchestrator.CompletePasswordResetAsync(new CompletePasswordResetRequest
        {
            Token = "reset-token",
            NewPassword = "new-secret"
        });

        Assert.Equal("reset-token", harness.EmailWorkflowService.CompletedPasswordResetToken);
        Assert.Equal("new-secret", harness.EmailWorkflowService.CompletedPasswordResetPassword);
    }

    [Fact]
    public async Task ActivateAccount_DelegatesToEmailWorkflowService()
    {
        var harness = TestHarness.Create();

        await harness.Orchestrator.ActivateAccountAsync(new AccountActivationRequest
        {
            Token = "activation-token"
        });

        Assert.Equal("activation-token", harness.EmailWorkflowService.ActivatedAccountToken);
    }

    [Fact]
    public async Task OnboardingState_IsSurfacedInSession()
    {
        var harness = TestHarness.Create(onboarding: new OnboardingState { Required = true, Status = "required" });

        var response = await harness.Orchestrator.LoginWithPasswordAsync(new PasswordLoginRequest
        {
            Login = "alice@example.com",
            Password = "secret"
        });

        Assert.True(response.RequiresOnboarding);
        Assert.Equal("required", response.Session!.Onboarding.Status);
    }

    [Fact]
    public async Task LinkProvider_UsesExternalValidatorAndStore()
    {
        var harness = TestHarness.Create();

        var response = await harness.Orchestrator.LinkProviderAsync(
            "user-1",
            AuthProviderType.Google,
            "google-token");

        Assert.Single(response.Providers);
        Assert.Equal(AuthProviderType.Google, response.Providers[0].Provider);
    }

    [Fact]
    public async Task ChallengeMfa_FallsBackToRecoveryCodes()
    {
        var harness = TestHarness.Create(mfaChallengeShouldSucceed: false, recoveryCodeShouldSucceed: true);

        var response = await harness.Orchestrator.ChallengeMfaAsync("user-1", "recovery-1");

        Assert.True(response.Succeeded);
        Assert.True(response.UsedRecoveryCode);
    }

    [Fact]
    public async Task ProviderPolicy_CanBlockProvider()
    {
        var harness = TestHarness.Create(providerPolicyAllowed: false);

        await Assert.ThrowsAsync<InvalidOperationException>(() => harness.Orchestrator.LoginWithPasswordAsync(new PasswordLoginRequest
        {
            Login = "alice@example.com",
            Password = "secret"
        }));
    }

    [Fact]
    public async Task GetCurrentSession_DoesNotMintTokens_WhenNoSessionIsStored()
    {
        var harness = TestHarness.Create();

        var response = await harness.Orchestrator.GetCurrentSessionAsync("user-1");

        Assert.Null(response.Session);
    }

    private sealed class TestHarness
    {
        public required DefaultAuthOrchestrator Orchestrator { get; init; }
        public required FakeUserProvisioningService UserProvisioningService { get; init; }
        public required FakeRegistrationWorkflowService RegistrationWorkflowService { get; init; }
        public required FakeEmailWorkflowService EmailWorkflowService { get; init; }
        public required FakeRefreshTokenStore RefreshTokenStore { get; init; }

        public static TestHarness Create(
            bool passwordShouldSucceed = true,
            bool legacyShouldSucceed = false,
            OnboardingState? onboarding = null,
            bool mfaChallengeShouldSucceed = true,
            bool recoveryCodeShouldSucceed = false,
            bool providerPolicyAllowed = true)
        {
            var user = new AuthUser
            {
                Id = "user-1",
                SubjectId = "subject-1",
                Email = "alice@example.com",
                DisplayName = "Alice",
                CanSignIn = true,
                TenantMemberships = [new AuthTenantMembership { TenantId = "tenant-a", TenantName = "Tenant A", Role = "Admin", IsCurrent = true }]
            };

            var userLookup = new FakeUserLookupService(user);
            var userProvisioning = new FakeUserProvisioningService(user);
            var registrationWorkflow = new FakeRegistrationWorkflowService();
            var emailWorkflow = new FakeEmailWorkflowService();
            var refreshTokenStore = new FakeRefreshTokenStore();

            var orchestrator = new DefaultAuthOrchestrator(
                userLookup,
                userProvisioning,
                registrationWorkflow,
                new FakePasswordVerifier(passwordShouldSucceed),
                new FakePasswordHasher(),
                new FakeLegacyPasswordVerifier(legacyShouldSucceed),
                new DefaultPasswordRehashPolicy(),
                [new FakeExternalValidator()],
                new FakeExternalLoginStore(),
                new FakeExternalUserProvisioningPolicy(true),
                new FakeJwtPayloadBuilder(),
                new FakeTokenIssuer(),
                refreshTokenStore,
                new FakeAuthSessionStore(),
                new FakeTenantContextResolver(),
                new FakeOnboardingEvaluator(onboarding ?? OnboardingState.NotRequired()),
                new FakeOnboardingCompletionService(),
                emailWorkflow,
                new UnsupportedMfaSecretStore(),
                new FakeMfaChallengeService(mfaChallengeShouldSucceed),
                new FakeRecoveryCodeService(recoveryCodeShouldSucceed),
                new FakeProviderPolicy(providerPolicyAllowed),
                new NoOpSecurityEventRecorder(),
                new FixedClock(),
                Microsoft.Extensions.Options.Options.Create(new BrighterToolsAuthOptions
                {
                    Providers = new ProviderOptions
                    {
                        EnabledProviders = new HashSet<AuthProviderType>
                        {
                            AuthProviderType.Password,
                            AuthProviderType.Google
                        }
                    },
                    Mfa = new MfaOptions
                    {
                        Enabled = true,
                        RecoveryCodeCount = 8
                    },
                    Onboarding = new OnboardingOptions
                    {
                        Enabled = true
                    },
                    PasswordMigration = new PasswordMigrationOptions
                    {
                        TransparentLegacyUpgradeEnabled = true
                    }
                }));

            return new TestHarness
            {
                Orchestrator = orchestrator,
                UserProvisioningService = userProvisioning,
                RegistrationWorkflowService = registrationWorkflow,
                EmailWorkflowService = emailWorkflow,
                RefreshTokenStore = refreshTokenStore
            };
        }
    }

    private sealed class FakeUserLookupService(AuthUser user) : IUserLookupService
    {
        public Task<AuthUser?> FindByExternalLoginAsync(AuthProviderType provider, string providerSubject, CancellationToken cancellationToken = default)
            => Task.FromResult<AuthUser?>(providerSubject == "google-subject" ? user : null);

        public Task<AuthUser?> FindByIdAsync(string userId, CancellationToken cancellationToken = default)
            => Task.FromResult<AuthUser?>(userId == user.Id ? user : null);

        public Task<AuthUser?> FindByLoginAsync(string login, CancellationToken cancellationToken = default)
            => Task.FromResult<AuthUser?>(login == user.Email ? user : null);
    }

    private sealed class FakeUserProvisioningService(AuthUser user) : IUserProvisioningService
    {
        public string? UpdatedPasswordHash { get; private set; }

        public Task<AuthUser> CreateExternalUserAsync(ExternalIdentity identity, CancellationToken cancellationToken = default)
            => Task.FromResult(user);

        public Task<AuthUser> CreatePasswordUserAsync(AuthUser inputUser, string password, CancellationToken cancellationToken = default)
            => Task.FromResult(inputUser);

        public Task UpdatePasswordHashAsync(AuthUser user, string newPasswordHash, CancellationToken cancellationToken = default)
        {
            UpdatedPasswordHash = newPasswordHash;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeRegistrationWorkflowService : IRegistrationWorkflowService
    {
        public PasswordSignupRequest? SignupRequest { get; private set; }
        public AcceptInvitationWithPasswordRequest? AcceptInvitationRequest { get; private set; }
        public PasswordSignupResult SignupResult { get; set; } = new();
        public InvitationAcceptanceResult InvitationResult { get; set; } = new();

        public Task<PasswordSignupResult> SignupWithPasswordAsync(PasswordSignupRequest request, CancellationToken cancellationToken = default)
        {
            SignupRequest = request;
            return Task.FromResult(SignupResult);
        }

        public Task<InvitationAcceptanceResult> AcceptInvitationWithPasswordAsync(AcceptInvitationWithPasswordRequest request, CancellationToken cancellationToken = default)
        {
            AcceptInvitationRequest = request;
            return Task.FromResult(InvitationResult);
        }
    }

    private sealed class FakeEmailWorkflowService : IEmailWorkflowService
    {
        public string? BegunPasswordResetLogin { get; private set; }
        public string? CompletedPasswordResetToken { get; private set; }
        public string? CompletedPasswordResetPassword { get; private set; }
        public string? BegunEmailVerificationUserId { get; private set; }
        public string? ConfirmedEmailVerificationToken { get; private set; }
        public string? ActivatedAccountToken { get; private set; }

        public Task BeginPasswordResetAsync(string login, CancellationToken cancellationToken = default)
        {
            BegunPasswordResetLogin = login;
            return Task.CompletedTask;
        }

        public Task CompletePasswordResetAsync(string token, string newPassword, CancellationToken cancellationToken = default)
        {
            CompletedPasswordResetToken = token;
            CompletedPasswordResetPassword = newPassword;
            return Task.CompletedTask;
        }

        public Task BeginEmailVerificationAsync(string userId, CancellationToken cancellationToken = default)
        {
            BegunEmailVerificationUserId = userId;
            return Task.CompletedTask;
        }

        public Task ConfirmEmailVerificationAsync(string token, CancellationToken cancellationToken = default)
        {
            ConfirmedEmailVerificationToken = token;
            return Task.CompletedTask;
        }

        public Task ActivateAccountAsync(string token, CancellationToken cancellationToken = default)
        {
            ActivatedAccountToken = token;
            return Task.CompletedTask;
        }
    }

    private sealed class FakePasswordVerifier(bool succeeds) : IPasswordVerifier
    {
        public Task<PasswordVerificationResult> VerifyAsync(AuthUser user, string password, CancellationToken cancellationToken = default)
            => Task.FromResult(succeeds ? PasswordVerificationResult.Success() : PasswordVerificationResult.Failed("invalid"));
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public Task<string> HashAsync(AuthUser user, string password, CancellationToken cancellationToken = default)
            => Task.FromResult($"hashed:{password}");
    }

    private sealed class FakeLegacyPasswordVerifier(bool succeeds) : ILegacyPasswordVerifier
    {
        public Task<LegacyPasswordVerificationResult> VerifyAsync(AuthUser user, string password, CancellationToken cancellationToken = default)
            => Task.FromResult(new LegacyPasswordVerificationResult { Succeeded = succeeds, RequiresUpgrade = succeeds });
    }

    private sealed class FakeExternalValidator : IExternalAuthProviderValidator
    {
        public AuthProviderType Provider => AuthProviderType.Google;

        public Task<ExternalIdentity> ValidateAsync(string credential, CancellationToken cancellationToken = default)
            => Task.FromResult(new ExternalIdentity { Provider = AuthProviderType.Google, ProviderSubject = "google-subject", Email = "alice@example.com", EmailVerified = true });
    }

    private sealed class FakeExternalLoginStore : IExternalLoginStore
    {
        private readonly List<ExternalLogin> _linked = [];

        public Task<IReadOnlyList<ExternalLogin>> GetLinkedLoginsAsync(string userId, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<ExternalLogin>>(_linked);

        public Task LinkAsync(string userId, ExternalIdentity identity, CancellationToken cancellationToken = default)
        {
            _linked.Add(new ExternalLogin { Provider = identity.Provider, ProviderSubject = identity.ProviderSubject, Email = identity.Email, LinkedAtUtc = DateTimeOffset.UtcNow });
            return Task.CompletedTask;
        }

        public Task UnlinkAsync(string userId, AuthProviderType provider, string providerSubject, CancellationToken cancellationToken = default)
        {
            _linked.RemoveAll(x => x.Provider == provider && x.ProviderSubject == providerSubject);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeExternalUserProvisioningPolicy(bool allowProvisioning) : IExternalUserProvisioningPolicy
    {
        public Task<ExternalUserProvisioningDecision> EvaluateAsync(ExternalIdentity identity, CancellationToken cancellationToken = default)
            => Task.FromResult(allowProvisioning
                ? ExternalUserProvisioningDecision.Allow()
                : ExternalUserProvisioningDecision.Deny("No account is linked to this login method."));
    }

    private sealed class FakeJwtPayloadBuilder : IJwtPayloadBuilder
    {
        public Task<AuthTokenDescriptor> BuildAsync(AuthUser user, AuthTenantMembership? tenantMembership, AuthProviderType provider, CancellationToken cancellationToken = default)
            => Task.FromResult(new AuthTokenDescriptor { Subject = user.SubjectId, ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(15) });
    }

    private sealed class FakeTokenIssuer : ITokenIssuer
    {
        public Task<IssuedAccessToken> IssueAsync(AuthTokenDescriptor descriptor, CancellationToken cancellationToken = default)
            => Task.FromResult(new IssuedAccessToken { Token = "issued-access-token", ExpiresAtUtc = descriptor.ExpiresAtUtc });
    }

    private sealed class FakeRefreshTokenStore : IRefreshTokenStore
    {
        public AuthRefreshToken? StoredToken { get; set; }

        public Task<AuthRefreshToken?> FindAsync(string refreshToken, CancellationToken cancellationToken = default)
            => Task.FromResult(StoredToken);

        public Task<AuthRefreshToken> IssueAsync(RefreshTokenIssueRequest request, CancellationToken cancellationToken = default)
        {
            StoredToken = new AuthRefreshToken
            {
                Token = "refresh-1",
                UserId = request.UserId,
                TenantId = request.TenantId,
                Provider = request.Provider,
                CreatedAtUtc = request.IssuedAtUtc,
                ExpiresAtUtc = request.ExpiresAtUtc
            };

            return Task.FromResult(StoredToken);
        }

        public Task RevokeAsync(string refreshToken, string? reason, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<AuthRefreshToken> RotateAsync(AuthRefreshToken currentToken, RefreshTokenIssueRequest request, CancellationToken cancellationToken = default)
        {
            StoredToken = new AuthRefreshToken
            {
                Token = "refresh-rotated",
                UserId = currentToken.UserId,
                TenantId = request.TenantId,
                Provider = request.Provider,
                CreatedAtUtc = request.IssuedAtUtc,
                ExpiresAtUtc = request.ExpiresAtUtc
            };

            return Task.FromResult(StoredToken);
        }
    }

    private sealed class FakeAuthSessionStore : IAuthSessionStore
    {
        public AuthSession? Session { get; private set; }

        public Task<AuthSession?> GetCurrentSessionAsync(string userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Session);

        public Task SaveAsync(AuthSession session, CancellationToken cancellationToken = default)
        {
            Session = session;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeTenantContextResolver : ITenantContextResolver
    {
        public Task<AuthTenantMembership?> ResolveAsync(AuthUser user, string? requestedTenantId, bool switchToCurrentTenant, CancellationToken cancellationToken = default)
            => Task.FromResult<AuthTenantMembership?>(user.TenantMemberships.FirstOrDefault(x => x.TenantId == (requestedTenantId ?? "tenant-a")) ?? user.TenantMemberships.FirstOrDefault());
    }

    private sealed class FakeOnboardingEvaluator(OnboardingState onboarding) : IOnboardingStateEvaluator
    {
        public Task<OnboardingState> EvaluateAsync(AuthUser user, AuthTenantMembership? tenantMembership, CancellationToken cancellationToken = default)
            => Task.FromResult(onboarding);
    }

    private sealed class FakeOnboardingCompletionService : IOnboardingCompletionService
    {
        public Task<OnboardingState> CompleteAsync(string userId, string? tenantId, IDictionary<string, object?> fields, CancellationToken cancellationToken = default)
            => Task.FromResult(OnboardingState.NotRequired());
    }

    private sealed class FakeMfaChallengeService(bool succeeds) : IMfaChallengeService
    {
        public Task<MfaEnrollmentStart> BeginEnrollmentAsync(AuthUser user, CancellationToken cancellationToken = default)
            => Task.FromResult(new MfaEnrollmentStart { UserId = user.Id, Secret = "secret", OtpauthUri = "otpauth://brightertools", QrCodeSvg = "<svg />" });

        public Task<MfaChallengeResult> ChallengeAsync(AuthUser user, string code, CancellationToken cancellationToken = default)
            => Task.FromResult(new MfaChallengeResult { Succeeded = succeeds, UsedRecoveryCode = false });

        public Task<MfaVerificationResult> VerifyEnrollmentAsync(AuthUser user, string code, CancellationToken cancellationToken = default)
            => Task.FromResult(new MfaVerificationResult { Succeeded = true, RecoveryCodes = ["code-1"] });
    }

    private sealed class FakeRecoveryCodeService(bool succeeds) : IRecoveryCodeService
    {
        public Task<IReadOnlyList<string>> GenerateAsync(string userId, int count, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<string>>(["recovery-1"]);

        public Task<bool> RedeemAsync(string userId, string recoveryCode, CancellationToken cancellationToken = default)
            => Task.FromResult(succeeds);
    }

    private sealed class FakeProviderPolicy(bool allowed) : IUserLoginProviderPolicy
    {
        public Task<ProviderPolicyResult> EvaluateAsync(AuthUser user, AuthProviderType provider, string? tenantId, CancellationToken cancellationToken = default)
            => Task.FromResult(allowed ? ProviderPolicyResult.Permit() : ProviderPolicyResult.Deny("blocked"));
    }

    private sealed class FixedClock : IClock
    {
        public DateTimeOffset UtcNow => new(2026, 03, 16, 9, 0, 0, TimeSpan.Zero);
    }
}