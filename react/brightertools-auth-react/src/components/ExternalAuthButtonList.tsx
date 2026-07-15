import { AuthProviderButton } from "./AuthProviderButton";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import { resolveAuthProviderUiConfigs, type AuthProviderUiConfig, type AuthUiTextOverrides, type GoogleButtonText } from "../authUi";
import type { AuthProviderType } from "../types/auth";

export interface ExternalAuthButtonListProps {
  providerUi?: AuthProviderUiConfig[];
  googleClientId?: string;
  appleClientId?: string;
  microsoftClientId?: string;
  microsoftAuthority?: string;
  googleText?: GoogleButtonText;
  appleLabel: string;
  appleBusyLabel: string;
  microsoftLabel: string;
  microsoftBusyLabel: string;
  busyProvider?: AuthProviderType | null;
  onGoogleCredential?: (credential: string) => void;
  onAppleClick?: () => void;
  onMicrosoftClick?: () => void;
  onError?: (message: string) => void;
  textOverrides?: AuthUiTextOverrides;
}

export function ExternalAuthButtonList({
  providerUi,
  googleClientId,
  appleClientId,
  microsoftClientId,
  microsoftAuthority,
  googleText = "continue_with",
  appleLabel,
  appleBusyLabel,
  microsoftLabel,
  microsoftBusyLabel,
  busyProvider,
  onGoogleCredential,
  onAppleClick,
  onMicrosoftClick,
  onError
}: ExternalAuthButtonListProps) {
  const resolvedProviderUi = resolveAuthProviderUiConfigs({
    providerUi,
    googleClientId,
    appleClientId,
    microsoftClientId,
    microsoftAuthority,
    defaultGoogleText: googleText
  });

  if (resolvedProviderUi.length === 0) {
    return null;
  }

  return (
    <div className="d-grid gap-3 justify-items-center">
      {resolvedProviderUi.map(config => {
        if (config.provider === "Google" && googleClientId && onGoogleCredential) {
          return (
            <GoogleCredentialButton
              key={config.provider}
              clientId={googleClientId}
              text={config.googleText ?? googleText}
              onCredential={credential => onGoogleCredential(credential)}
              onError={onError}
            />
          );
        }

        if (config.provider === "Apple" && appleClientId && onAppleClick) {
          return (
            <AuthProviderButton
              key={config.provider}
              variant="apple"
              label={config.label ?? appleLabel}
              busyLabel={config.busyLabel ?? appleBusyLabel}
              busy={busyProvider === "Apple"}
              disabled={busyProvider !== null}
              onClick={onAppleClick}
            />
          );
        }

        if (config.provider === "Microsoft" && microsoftClientId && microsoftAuthority && onMicrosoftClick) {
          return (
            <AuthProviderButton
              key={config.provider}
              variant="microsoft"
              label={config.label ?? microsoftLabel}
              busyLabel={config.busyLabel ?? microsoftBusyLabel}
              busy={busyProvider === "Microsoft"}
              disabled={busyProvider !== null}
              onClick={onMicrosoftClick}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
