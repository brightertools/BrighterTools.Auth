const appleAuthScriptId = "brightertools-apple-auth-js";
const appleAuthScriptUrl = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

interface AppleAuthorizationResponse {
  authorization?: {
    id_token?: string;
  };
}

interface AppleAuthApi {
  auth: {
    init: (options: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void;
    signIn: () => Promise<AppleAuthorizationResponse>;
  };
}

declare global {
  interface Window {
    AppleID?: AppleAuthApi;
  }
}

const loadAppleAuthScript = async (): Promise<void> => {
  if (window.AppleID) return;

  const existingScript = document.getElementById(appleAuthScriptId) as HTMLScriptElement | null;
  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Apple sign-in could not be loaded.")), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = appleAuthScriptId;
    script.src = appleAuthScriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Apple sign-in could not be loaded."));
    document.head.appendChild(script);
  });
};

const buildRedirectUri = (redirectPath: string, redirectOrigin?: string) => {
  const origin = redirectOrigin?.trim().replace(/\/+$/, "") || window.location.origin;
  return `${origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;
};

export const signInWithApple = async (clientId: string, redirectPath: string, redirectOrigin?: string): Promise<string> => {
  if (!clientId.trim()) throw new Error("Apple sign-in is not configured.");

  await loadAppleAuthScript();
  if (!window.AppleID) throw new Error("Apple sign-in is unavailable.");

  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: buildRedirectUri(redirectPath, redirectOrigin),
    usePopup: true
  });

  const response = await window.AppleID.auth.signIn();
  const idToken = response.authorization?.id_token;
  if (!idToken) throw new Error("Apple did not return a login credential. Please try again.");

  return idToken;
};
