import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import type { ExternalSignupRequest } from "../types/api";
import type { AuthApiClient } from "../services/createAuthApi";
import type { TokenStorage } from "../services/tokenStorage";
import type { AuthProviderType, AuthSession } from "../types/auth";

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

export const AuthProvider = <TUser, TPayload extends JwtPayload = JwtPayload>({
  api,
  storage,
  storageKey = "bt.auth.session",
  refreshEarlyMs = 60_000,
  clockSkewMs = 30_000,
  mapUser,
  onUnauthorized,
  children
}: AuthProviderProps<TUser, TPayload>) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => storage.get());
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<AuthSession | null>(session);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef(false);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      globalThis.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const setSession = useCallback((nextSession: AuthSession | null) => {
    sessionRef.current = nextSession;
    setSessionState(nextSession);
    storage.set(nextSession);
  }, [storage]);

  const refreshSession = useCallback(async (tenantId?: string, switchToCurrentTenant = false): Promise<boolean> => {
    if (refreshInFlightRef.current) return false;
    refreshInFlightRef.current = true;
    setLoading(true);

    try {
      const current = sessionRef.current;
      const response = await api.refresh({ refreshToken: current?.refreshToken ?? "", tenantId, switchToCurrentTenant });
      if (!response.success || !response.data?.session) {
        setSession(null);
        onUnauthorized?.();
        return false;
      }

      setSession(response.data.session);
      return true;
    } catch {
      setSession(null);
      onUnauthorized?.();
      return false;
    } finally {
      refreshInFlightRef.current = false;
      setLoading(false);
    }
  }, [api, onUnauthorized, setSession]);

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
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setSessionState(storage.get());
      sessionRef.current = storage.get();
    };

    globalThis.addEventListener?.("storage", onStorage);
    return () => {
      globalThis.removeEventListener?.("storage", onStorage);
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, storage, storageKey]);

  const setAuthenticatedSession = useCallback((nextSession: AuthSession) => setSession(nextSession), [setSession]);

  const login = useCallback(async (loginValue: string, password: string, tenantId?: string) => {
    const response = await api.loginWithPassword({ login: loginValue, password, tenantId });
    if (!response.success || !response.data?.session) throw new Error(response.message ?? "Login failed.");
    setAuthenticatedSession(response.data.session);
  }, [api, setAuthenticatedSession]);

  const externalLogin = useCallback(async (provider: AuthProviderType, credential: string, tenantId?: string) => {
    const response = await api.loginWithExternalProvider({ provider, credential, tenantId });
    if (!response.success || !response.data?.session) throw new Error(response.message ?? "Login failed.");
    setAuthenticatedSession(response.data.session);
  }, [api, setAuthenticatedSession]);

  const externalSignup = useCallback(async (request: ExternalSignupRequest) => {
    const response = await api.signupWithExternalProvider(request);
    if (!response.success || !response.data?.session) throw new Error(response.message ?? "Signup failed.");
    setAuthenticatedSession(response.data.session);
  }, [api, setAuthenticatedSession]);

  const logout = useCallback(async () => {
    try {
      await api.logout(sessionRef.current?.refreshToken ? { refreshToken: sessionRef.current.refreshToken } : undefined);
    } catch {
      // Logout should clear local state even if the server call fails.
    }

    setSession(null);
  }, [api, setSession]);

  const payload = useMemo(() => decodeJwtPayload<TPayload>(getAccessToken(session)), [session]);
  const user = useMemo(() => (session && payload && mapUser ? mapUser(session, payload) : null), [mapUser, payload, session]);

  const value = useMemo<AuthContextValue<TUser, TPayload>>(
    () => ({
      session,
      user,
      payload,
      loading,
      isAuthenticated: !!session?.accessToken,
      api,
      setSession,
      setAuthenticatedSession,
      login,
      externalLogin,
      externalSignup,
      refreshSession,
      logout
    }),
    [api, externalLogin, externalSignup, loading, login, logout, payload, refreshSession, session, setAuthenticatedSession, setSession, user]
  );

  return <AuthContext.Provider value={value as AuthContextValue}>{children}</AuthContext.Provider>;
};
