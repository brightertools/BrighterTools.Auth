import { PublicClientApplication, type AuthenticationResult } from "@azure/msal-browser";

export interface MicrosoftAuthResult {
  credential: string;
  email?: string;
  preferredUsername?: string;
  displayName?: string;
}

const instances = new Map<string, PublicClientApplication>();
const interactiveSignIns = new Map<string, Promise<MicrosoftAuthResult>>();
const interactionInProgressMessage = "Microsoft sign-in is already in progress. Please finish the Microsoft sign-in window that is already open.";

const normalizeRedirectUri = (redirectPath?: string) => {
  const path = redirectPath?.trim() || "/";
  return new URL(path.startsWith("/") ? path : `/${path}`, window.location.origin).toString();
};

const getCacheKey = (clientId: string, authority: string, redirectUri: string) => `${clientId}|${authority}|${redirectUri}`;

const getInstance = async (clientId: string, authority: string, redirectPath?: string) => {
  const redirectUri = normalizeRedirectUri(redirectPath);
  const cacheKey = getCacheKey(clientId, authority, redirectUri);

  let instance = instances.get(cacheKey);
  if (!instance) {
    instance = new PublicClientApplication({
      auth: {
        clientId,
        authority,
        redirectUri
      },
      cache: {
        cacheLocation: "sessionStorage"
      }
    });
    instances.set(cacheKey, instance);
  }

  await instance.initialize();

  try {
    await instance.handleRedirectPromise();
  } catch {
    // Popup flow remains the source of truth here. Ignore stale redirect state.
  }

  return { instance, cacheKey };
};

const mapResult = (response: AuthenticationResult): MicrosoftAuthResult => {
  const claims = response.idTokenClaims as Record<string, unknown> | undefined;
  const email = typeof claims?.["email"] === "string" ? claims["email"] : undefined;
  const preferredUsername = typeof claims?.["preferred_username"] === "string"
    ? claims["preferred_username"]
    : response.account?.username;

  if (!response.idToken) {
    throw new Error("Microsoft did not return a login credential. Please try again.");
  }

  return {
    credential: response.idToken,
    email,
    preferredUsername,
    displayName: response.account?.name ?? undefined
  };
};

const hasErrorCode = (error: unknown, code: string) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorCode = (error as { errorCode?: string }).errorCode;
  if (typeof errorCode === "string" && errorCode.toLowerCase() === code.toLowerCase()) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes(code.toLowerCase());
};

const normalizeMicrosoftError = (error: unknown) => {
  if (hasErrorCode(error, "interaction_in_progress")) {
    return new Error(interactionInProgressMessage);
  }

  if (hasErrorCode(error, "user_cancelled") || hasErrorCode(error, "popup_window_error") || hasErrorCode(error, "monitor_popup_timeout")) {
    return new Error("Microsoft sign-in was cancelled or interrupted. Please try again.");
  }

  return error instanceof Error ? error : new Error("Microsoft sign-in was cancelled or failed.");
};

export const signInWithMicrosoft = async (clientId: string, authority: string, redirectPath?: string): Promise<MicrosoftAuthResult> => {
  if (!clientId.trim()) {
    throw new Error("Microsoft sign-in is not configured.");
  }

  if (!authority.trim()) {
    throw new Error("Microsoft sign-in authority is not configured.");
  }

  const normalizedClientId = clientId.trim();
  const normalizedAuthority = authority.trim();
  const redirectUri = normalizeRedirectUri(redirectPath);
  const cacheKey = getCacheKey(normalizedClientId, normalizedAuthority, redirectUri);

  if (interactiveSignIns.has(cacheKey)) {
    throw new Error(interactionInProgressMessage);
  }

  const signInPromise = (async () => {
    const { instance } = await getInstance(normalizedClientId, normalizedAuthority, redirectPath);
    const response = await instance.loginPopup({
      scopes: ["openid", "profile", "email"],
      prompt: "select_account",
      redirectUri
    });

    return mapResult(response);
  })();

  interactiveSignIns.set(cacheKey, signInPromise);

  try {
    return await signInPromise;
  } catch (error) {
    throw normalizeMicrosoftError(error);
  } finally {
    interactiveSignIns.delete(cacheKey);
  }
};