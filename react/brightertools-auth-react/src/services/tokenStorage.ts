import type { AuthSession } from "../types/auth";

export interface TokenStorage {
  get(): AuthSession | null;
  set(session: AuthSession | null): void;
}

export const createLocalStorageTokenStorage = (key = "bt.auth.session"): TokenStorage => ({
  get() {
    const value = globalThis.localStorage?.getItem(key);
    return value ? (JSON.parse(value) as AuthSession) : null;
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
