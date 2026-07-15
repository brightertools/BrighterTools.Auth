import { ExternalAuthButtonList } from "./ExternalAuthButtonList";
import type { AuthProviderUiConfig, AuthUiTextOverrides, GoogleButtonText } from "../authUi";
import type { AuthProviderType } from "../types/auth";

export interface ExternalAuthOptionsProps {
  providerUi?: AuthProviderUiConfig[];
  googleClientId?: string;
  appleClientId?: string;
  appleEnabled?: boolean;
  microsoftClientId?: string;
  microsoftAuthority?: string;
  googleText?: GoogleButtonText;
  appleLabel?: string;
  appleBusyLabel?: string;
  microsoftLabel?: string;
  microsoftBusyLabel?: string;
  busyProvider?: AuthProviderType | null;
  onGoogleCredential?: (credential: string) => void;
  onAppleClick?: () => void;
  onMicrosoftClick?: () => void;
  onError?: (message: string) => void;
  textOverrides?: AuthUiTextOverrides;
}

export function ExternalAuthOptions({
  providerUi,
  googleClientId,
  appleClientId,
  appleEnabled,
  microsoftClientId,
  microsoftAuthority,
  googleText = "continue_with",
  appleLabel = "Continue with Apple",
  appleBusyLabel = "Opening Apple...",
  microsoftLabel = "Continue with Microsoft",
  microsoftBusyLabel = "Opening Microsoft...",
  busyProvider,
  onGoogleCredential,
  onAppleClick,
  onMicrosoftClick,
  onError
}: ExternalAuthOptionsProps) {
  return (
    <ExternalAuthButtonList
      providerUi={providerUi}
      googleClientId={googleClientId}
      appleClientId={appleClientId ?? (appleEnabled ? "enabled" : undefined)}
      microsoftClientId={microsoftClientId}
      microsoftAuthority={microsoftAuthority}
      googleText={googleText}
      appleLabel={appleLabel}
      appleBusyLabel={appleBusyLabel}
      microsoftLabel={microsoftLabel}
      microsoftBusyLabel={microsoftBusyLabel}
      busyProvider={busyProvider}
      onGoogleCredential={onGoogleCredential}
      onAppleClick={onAppleClick}
      onMicrosoftClick={onMicrosoftClick}
      onError={onError}
    />
  );
}


