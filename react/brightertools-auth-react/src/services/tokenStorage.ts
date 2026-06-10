import type { AuthSession } from "../types/auth";

export interface TokenStorage {
  get(): AuthSession | null;
  set(session: AuthSession | null): void;
}

export const createLocalStorageTokenStorage = (key = "bt.auth.session"): TokenStorage => ({
  get() {
    const value = globalThis.localStorage?.getItem(key);
    if (!value) return null;

    const parsed = JSON.parse(value) as AuthSession & { jwtToken?: string; expiresAt?: string };
    if (!parsed.accessToken && parsed.jwtToken) {
      return {
        ...parsed,
        accessToken: parsed.jwtToken,
        expiresAtUtc: parsed.expiresAt ?? parsed.expiresAtUtc ?? ""
      };
    }

    return parsed;
  },
  set(session) {
    if (!globalThis.localStorage) {
      return;
    }

    if (!session) {
      globalThis.localStorage.removeItem(key);
      return;
    }

    globalThis.localStorage.setItem(key, JSON.stringify(session));
  }
});


