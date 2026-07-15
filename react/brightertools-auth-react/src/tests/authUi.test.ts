import { describe, expect, it } from "vitest";
import {
  authLocalizationManifest,
  createAuthLocalizationManifest,
  createLocalizedAuthUiText,
  mergeAuthUiTextOverrides,
  resolveAuthProviderUiConfigs
} from "../authUi";

describe("resolveAuthProviderUiConfigs", () => {
  it("orders providers by buttonOrder before falling back to declaration order", () => {
    const result = resolveAuthProviderUiConfigs({
      providerUi: [
        { provider: "Apple", buttonOrder: 2 },
        { provider: "Google", buttonOrder: 1 },
        { provider: "Microsoft" }
      ],
      googleClientId: "google",
      appleClientId: "apple",
      microsoftClientId: "microsoft",
      microsoftAuthority: "authority"
    });

    expect(result.map(item => item.provider)).toEqual(["Google", "Apple", "Microsoft"]);
  });

  it("preserves declared order when buttonOrder is not set", () => {
    const result = resolveAuthProviderUiConfigs({
      providerUi: [
        { provider: "Microsoft" },
        { provider: "Google" },
        { provider: "Apple" }
      ],
      googleClientId: "google",
      appleClientId: "apple",
      microsoftClientId: "microsoft",
      microsoftAuthority: "authority"
    });

    expect(result.map(item => item.provider)).toEqual(["Microsoft", "Google", "Apple"]);
  });
});

describe("createLocalizedAuthUiText", () => {
  it("uses auth.* keys and shared English fallbacks", () => {
    const calls: Array<{ key: string; fallback?: string; }> = [];
    const translate = (key: string, fallback?: string) => {
      calls.push({ key, fallback });
      return `translated:${key}`;
    };

    const result = createLocalizedAuthUiText(translate);

    expect(result.login?.signInLabel).toBe("translated:auth.login.signInLabel");
    expect(result.passwordLogin?.submitLabel).toBe("translated:auth.passwordLogin.submitLabel");
    expect(result.accountLoginMethods?.verifiedByProviderMessage).toBe("translated:auth.accountLoginMethods.verifiedByProviderMessage");
    expect(result.invitationAcceptance?.acceptInvitationLabel).toBe("translated:auth.invitationAcceptance.acceptInvitationLabel");
    expect(result.invitationManagement?.title).toBe("translated:auth.invitationManagement.title");
    expect(result.invitationImport?.importAndSendLabel).toBe("translated:auth.invitationImport.importAndSendLabel");
    expect(result.shared?.providerLabels?.Microsoft).toBe("translated:auth.shared.providerLabels.Microsoft");
    expect(result.shared?.providerLabels?.["4"]).toBe("translated:auth.shared.providerLabels.4");

    expect(calls).toContainEqual({ key: "auth.login.signInLabel", fallback: "Sign in" });
    expect(calls).toContainEqual({ key: "auth.accountLoginMethods.verifiedByProviderMessage", fallback: "Verified by {provider}" });
    expect(calls).toContainEqual({ key: "auth.invitationAcceptance.acceptInvitationLabel", fallback: "Accept Invitation" });
    expect(calls).toContainEqual({ key: "auth.invitationManagement.title", fallback: "User Invitations" });
    expect(calls).toContainEqual({ key: "auth.invitationImport.importAndSendLabel", fallback: "Import and Send" });
    expect(calls).toContainEqual({ key: "auth.shared.providerLabels.Microsoft", fallback: "Microsoft" });
    expect(calls).toContainEqual({ key: "auth.shared.providerLabels.4", fallback: "Microsoft" });
  });

  it("applies explicit overrides after localization", () => {
    const translate = (key: string) => `translated:${key}`;
    const result = createLocalizedAuthUiText(translate, {
      login: {
        signInLabel: "Custom sign in"
      },
      shared: {
        providerLabels: {
          Microsoft: "Entra ID"
        }
      }
    });

    expect(result.login?.signInLabel).toBe("Custom sign in");
    expect(result.shared?.providerLabels?.Microsoft).toBe("Entra ID");
    expect(result.shared?.providerLabels?.Google).toBe("translated:auth.shared.providerLabels.Google");
  });
});

describe("createAuthLocalizationManifest", () => {
  it("exports flattened auth keys with auth.* defaults", () => {
    expect(authLocalizationManifest).toContainEqual({
      key: "auth.login.signInLabel",
      defaultValue: "Sign in"
    });
    expect(authLocalizationManifest).toContainEqual({
      key: "auth.shared.providerLabels.Microsoft",
      defaultValue: "Microsoft"
    });
  });

  it("supports namespaced manifest creation for host apps", () => {
    const manifest = createAuthLocalizationManifest("common");

    expect(manifest).toContainEqual({
      key: "common.auth.emailVerificationField.resendCodeLabel",
      defaultValue: "Resend code"
    });
  });
});

describe("mergeAuthUiTextOverrides", () => {
  it("preserves nested sections while applying overrides", () => {
    const result = mergeAuthUiTextOverrides(
      {
        login: {
          signInLabel: "Sign in",
          passwordLabel: "Password"
        },
        shared: {
          providerLabels: {
            Google: "Google",
            Microsoft: "Microsoft"
          }
        }
      },
      {
        login: {
          signInLabel: "Continue"
        },
        shared: {
          providerLabels: {
            Microsoft: "Entra ID"
          }
        }
      }
    );

    expect(result.login?.signInLabel).toBe("Continue");
    expect(result.login?.passwordLabel).toBe("Password");
    expect(result.shared?.providerLabels?.Google).toBe("Google");
    expect(result.shared?.providerLabels?.Microsoft).toBe("Entra ID");
  });
});
