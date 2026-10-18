import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import type { ExternalSignupRequest } from "../types/api";
import type { AuthApiClient } from "../services/createAuthApi";
import type { TokenStorage } from "../services/tokenStorage";
import type { AuthProviderType, AuthSession } from "../types/auth";
import { toAuthApiError } from "../errors/AuthApiError";

export type JwtPayload = Record<string, unknown> & { exp?: number; sub?: string };

export interface AuthContextValue<TUser = unknown, TPayload extends JwtPayload = JwtPayload> {
  session: AuthSession | null;
  user: TUser | null;
  payload: TPayload | null;
  loading: boolean;
  isAuthenticated: boolean;
  api: AuthApiClient;
  setSession: (session: AuthSession | null) => void;
  setAuthenticatedSession: (session: AuthSession) => void;
  login: (login: string, password: string, tenantId?: string) => Promise<void>;
  externalLogin: (provider: AuthProviderType, credential: string, tenantId?: string) => Promise<void>;
  externalSignup: (request: ExternalSignupRequest) => Promise<void>;
  refreshSession: (tenantId?: string, switchToCurrentTenant?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps<TUser = unknown, TPayload extends JwtPayload = JwtPayload> extends PropsWithChildren {
  api: AuthApiClient;
  storage: TokenStorage;
  storageKey?: string;
  refreshEarlyMs?: number;
  clockSkewMs?: number;
  /** Bounded automatic retries. Reconnection/focus may start a new retry cycle. */
  refreshRetryDelaysMs?: readonly number[];
  mapUser?: (session: AuthSession, payload: TPayload) => TUser | null;
  onUnauthorized?: () => void;
}

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return decodeURIComponent(
    Array.from(globalThis.atob(padded))
      .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
};

export const decodeJwtPayload = <TPayload extends JwtPayload = JwtPayload>(token?: string | null): TPayload | null => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as TPayload;
  } catch {
    return null;
  }
};

const getAccessToken = (session: AuthSession | null) => session?.accessToken || null;
const defaultRetryDelays = [1_000, 5_000, 15_000, 30_000, 60_000];
const accessExpiresAt = (session: AuthSession | null): number => {
  const exp = decodeJwtPayload(getAccessToken(session))?.exp;
  return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : 0;
};
const sameSession = (left: AuthSession | null, right: AuthSession | null) =>
  left?.accessToken === right?.accessToken && left?.refreshToken === right?.refreshToken;

export const AuthProvider = <TUser, TPayload extends JwtPayload = JwtPayload>({
  api,
  storage,
  storageKey = "bt.auth.session",
  refreshEarlyMs = 60_000,
  clockSkewMs = 30_000,
  refreshRetryDelaysMs = defaultRetryDelays,
  mapUser,
  onUnauthorized,
  children
}: AuthProviderProps<TUser, TPayload>) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => storage.get());
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<AuthSession | null>(session);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);
  const retryIndexRef = useRef(0);
  const retryAtRef = useRef(0);
  const failedRef = useRef(false);
  const refreshCallRef = useRef<() => Promise<boolean>>(async () => false);
  const [now, setNow] = useState(Date.now());

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      globalThis.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const setSession = useCallback((nextSession: AuthSession | null) => {
    generationRef.current++;
    clearRefreshTimer();
    retryIndexRef.current = 0;
    failedRef.current = false;
    sessionRef.current = nextSession;
    setSessionState(nextSession);
    setNow(Date.now());
    storage.set(nextSession);
  }, [clearRefreshTimer, storage]);

  const refreshSession = useCallback((tenantId?: string, switchToCurrentTenant = false): Promise<boolean> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;
    clearRefreshTimer();
    const generation = generationRef.current;
    const original = sessionRef.current;
    const currentRequest = () => mountedRef.current && generationRef.current === generation;
    const run = async (): Promise<boolean> => {
      if (!currentRequest()) return false;
      // Another tab may have rotated the token while this tab waited for the lock.
      const stored = storage.get();
      if (!sameSession(stored, original)) {
        setSession(stored);
        return accessExpiresAt(stored) > Date.now();
      }
      const current = sessionRef.current;
      if (!current) return false;
      // Background refresh must not unmount an otherwise valid form.
      setLoading(accessExpiresAt(current) <= Date.now());
      try {
        const response = await api.refresh({ refreshToken: current.refreshToken ?? "", tenantId, switchToCurrentTenant });
        if (!currentRequest()) return false;
        if (!sameSession(storage.get(), current)) { setSession(storage.get()); return false; }
        if (response.success && response.data?.session && accessExpiresAt(response.data.session) > Date.now()) {
          setSession(response.data.session);
          return true;
        }
        const transportFailure = response.httpStatus === 0 || response.httpStatus === 408 || response.httpStatus === 429 || (response.httpStatus ?? 0) >= 500;
        const terminal = !transportFailure && (response.httpStatus === 401 ||
          ["invalid_refresh_token", "refresh_token_expired", "refresh_token_revoked", "session_revoked"].includes(response.code ?? ""));
        if (terminal) { setSession(null); onUnauthorized?.(); return false; }
        defer(response.retryAfterMs);
      } catch {
        if (currentRequest()) defer();
      } finally {
        if (mountedRef.current) setLoading(false);
      }
      return false;
    };
    const defer = (retryAfterMs = 0) => {
      failedRef.current = true;
      setNow(Date.now());
      const delay = refreshRetryDelaysMs[retryIndexRef.current++];
      retryAtRef.current = Date.now() + Math.max(delay ?? 30_000, retryAfterMs, 1_000);
      if (delay !== undefined) refreshTimerRef.current = globalThis.setTimeout(
        () => void refreshCallRef.current(), Math.min(2_147_483_647, retryAtRef.current - Date.now()));
    };
    // Serialize rotating refresh tokens between tabs on HTTPS browsers supporting Web Locks.
    const task = Promise.resolve().then(() => typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request(`brightertools-refresh:${storageKey}`, run) : run()).catch(() => {
        if (currentRequest()) defer();
        return false;
      }).finally(() => {
        if (refreshInFlightRef.current === task) refreshInFlightRef.current = null;
      });
    refreshInFlightRef.current = task;
    return task;
  }, [api, clearRefreshTimer, onUnauthorized, refreshRetryDelaysMs, setSession, storage, storageKey]);
  refreshCallRef.current = refreshSession;

  const scheduleRefresh = useCallback((nextSession: AuthSession | null) => {
    clearRefreshTimer();
    const payload = decodeJwtPayload<TPayload>(getAccessToken(nextSession));
    const exp = payload?.exp;
    if (!exp) return;

    const now = Date.now();
    const expMs = exp * 1000;
    const refreshAt = Math.max(now + 5_000, expMs - refreshEarlyMs - clockSkewMs);
    refreshTimerRef.current = globalThis.setTimeout(() => void refreshSession(), refreshAt - now);
  }, [clearRefreshTimer, clockSkewMs, refreshEarlyMs, refreshSession]);

  useEffect(() => {
    sessionRef.current = session;
    scheduleRefresh(session);
  }, [scheduleRefresh, session]);

  useEffect(() => {
    const remaining = accessExpiresAt(session) - Date.now();
    if (remaining <= 0) return;
    const timer = globalThis.setTimeout(() => setNow(Date.now()), Math.min(remaining, 2_147_483_647));
    return () => globalThis.clearTimeout(timer);
  }, [session, now]);

  useEffect(() => {
    mountedRef.current = true;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      generationRef.current++;
      retryIndexRef.current = 0; failedRef.current = false;
      const next = storage.get();
      setSessionState(next); sessionRef.current = next; setNow(Date.now());
    };
    const resume = () => {
      if (!sessionRef.current || !failedRef.current || Date.now() < retryAtRef.current) return;
      retryIndexRef.current = 0;
      void refreshCallRef.current();
    };

    globalThis.addEventListener?.("storage", onStorage);
    globalThis.addEventListener?.("online", resume);
    globalThis.addEventListener?.("focus", resume);
    return () => {
      mountedRef.current = false;
      generationRef.current++;
      globalThis.removeEventListener?.("storage", onStorage);
      globalThis.removeEventListener?.("online", resume);
      globalThis.removeEventListener?.("focus", resume);
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, storage, storageKey]);

  const setAuthenticatedSession = useCallback((nextSession: AuthSession) => setSession(nextSession), [setSession]);

  const login = useCallback(async (loginValue: string, password: string, tenantId?: string) => {
    const response = await api.loginWithPassword({ login: loginValue, password, tenantId });
    if (!response.success || !response.data?.session) throw toAuthApiError(response.message ?? "Login failed.", response.code);
    setAuthenticatedSession(response.data.session);
  }, [api, setAuthenticatedSession]);

  const externalLogin = useCallback(async (provider: AuthProviderType, credential: string, tenantId?: string) => {
    const response = await api.loginWithExternalProvider({ provider, credential, tenantId });
    if (!response.success || !response.data?.session) throw toAuthApiError(response.message ?? "Login failed.", response.code);
    setAuthenticatedSession(response.data.session);
  }, [api, setAuthenticatedSession]);

  const externalSignup = useCallback(async (request: ExternalSignupRequest) => {
    const response = await api.signupWithExternalProvider(request);
    if (!response.success || !response.data?.session) throw toAuthApiError(response.message ?? "Signup failed.", response.code);
    setAuthenticatedSession(response.data.session);
  }, [api, setAuthenticatedSession]);

  const logout = useCallback(async () => {
    const refreshToken = sessionRef.current?.refreshToken;
    // Invalidate in-flight refresh before the logout request, not afterwards.
    setSession(null);
    try {
      await api.logout(refreshToken ? { refreshToken } : undefined);
    } catch {
      // Logout should clear local state even if the server call fails.
    }
  }, [api, setSession]);

  const payload = useMemo(() => decodeJwtPayload<TPayload>(getAccessToken(session)), [session]);
  const isAuthenticated = accessExpiresAt(session) > Math.max(now, Date.now());
  const user = useMemo(() => (isAuthenticated && session && payload && mapUser ? mapUser(session, payload) : null), [isAuthenticated, mapUser, payload, session]);

  const value = useMemo<AuthContextValue<TUser, TPayload>>(
    () => ({
      session,
      user,
      payload,
      loading,
      isAuthenticated,
      api,
      setSession,
      setAuthenticatedSession,
      login,
      externalLogin,
      externalSignup,
      refreshSession,
      logout
    }),
    [api, externalLogin, externalSignup, isAuthenticated, loading, login, logout, payload, refreshSession, session, setAuthenticatedSession, setSession, user]
  );

  return <AuthContext.Provider value={value as AuthContextValue}>{children}</AuthContext.Provider>;
};
