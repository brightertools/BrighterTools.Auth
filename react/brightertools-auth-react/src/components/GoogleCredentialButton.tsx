import { useEffect, useRef } from "react";

interface GoogleAccountsId {
  initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
}

export interface GoogleCredentialButtonProps {
  clientId: string;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number | string;
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}

const scriptId = "brightertools-google-identity";

const getGoogle = () => (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } }).google;

const loadGoogleScript = () => new Promise<void>((resolve, reject) => {
  if (getGoogle()?.accounts?.id) {
    resolve();
    return;
  }

  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (existing) {
    existing.addEventListener("load", () => resolve(), { once: true });
    existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")), { once: true });
    return;
  }

  const script = document.createElement("script");
  script.id = scriptId;
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error("Google sign-in failed to load."));
  document.head.appendChild(script);
});

const measureGoogleButtonWidth = (element: HTMLElement) => {
  const availableWidth = element.parentElement?.clientWidth || element.clientWidth || 400;
  return Math.max(240, Math.min(400, Math.floor(availableWidth)));
};

export function GoogleCredentialButton({ clientId, text = "continue_with", theme = "outline", size = "large", shape = "rectangular", width, onCredential, onError }: GoogleCredentialButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!clientId || !containerRef.current) return;

      try {
        await loadGoogleScript();
        if (cancelled || !containerRef.current || !getGoogle()?.accounts?.id) return;

        containerRef.current.innerHTML = "";
        const google = getGoogle();
        if (!google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: response => {
            if (response.credential) onCredential(response.credential);
            else onError?.("Google did not return a credential.");
          }
        });
        const renderedWidth = width ?? measureGoogleButtonWidth(containerRef.current);
        google.accounts.id.renderButton(containerRef.current, { text, theme, size, shape, width: renderedWidth });
      } catch (error) {
        onError?.(error instanceof Error ? error.message : "Google sign-in failed to load.");
      }
    };

    void render();
    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, onError, shape, size, text, theme, width]);

  return (
    <div className="bt-auth-provider-button-shell" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div ref={containerRef} className="bt-auth-google-button" style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
    </div>
  );
}



