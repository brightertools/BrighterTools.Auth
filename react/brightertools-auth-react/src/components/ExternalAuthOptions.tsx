import { AuthProviderButton } from "./AuthProviderButton";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import type { AuthProviderType } from "../types/auth";

export interface ExternalAuthOptionsProps {
  googleClientId?: string;
  appleEnabled?: boolean;
  googleText?: "signin_with" | "signup_with" | "continue_with" | "signin";
  appleLabel?: string;
  busyProvider?: AuthProviderType | null;
  onGoogleCredential: (credential: string) => void;
  onAppleClick?: () => void;
  onError?: (message: string) => void;
}

export function ExternalAuthOptions({ googleClientId, appleEnabled, googleText = "continue_with", appleLabel = "Continue with Apple", busyProvider, onGoogleCredential, onAppleClick, onError }: ExternalAuthOptionsProps) {
  return (
    <div className="d-grid gap-3 bt-auth-external-options">
      {googleClientId && (
        <GoogleCredentialButton clientId={googleClientId} text={googleText} onCredential={onGoogleCredential} onError={onError} />
      )}
      {appleEnabled && onAppleClick && (
        <AuthProviderButton variant="apple" label={appleLabel} busyLabel="Opening Apple..." busy={busyProvider === "Apple"} onClick={onAppleClick} />
      )}
    </div>
  );
}


