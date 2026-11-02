import { createSessionCoordinator } from "../services/sessionCoordinator";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
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
  const coordinator = useMemo(() => createSessionCoordinator(api, storage, {
    storageKey, refreshEarlyMs, clockSkewMs, refreshRetryDelaysMs, onUnauthorized
  }), [api, storage, storageKey, refreshEarlyMs, clockSkewMs, refreshRetryDelaysMs, onUnauthorized]);
  const [state, setState] = useState(coordinator.getSnapshot);
  useEffect(() => {
    const unsubscribe = coordinator.subscribe(() => setState(coordinator.getSnapshot()));
    coordinator.start();
    return () => { unsubscribe(); coordinator.stop(); };
  }, [coordinator]);
  const { session, loading, now } = state;
  const setSession = useCallback((next: AuthSession | null) => coordinator.setSession(next), [coordinator]);
  const refreshSession = useCallback((tenantId?: string, current = false) => coordinator.refresh(tenantId, current), [coordinator]);
  const setAuthenticatedSession = useCallback((nextSession: AuthSession) => setSession(nextSession), [setSession]);

  const login = useCallback(async (loginValue: string, password: string, tenantId?: string) => coordinator.authenticate(async () => {
    const response = await api.loginWithPassword({ login: loginValue, password, tenantId });
    if (!response.success || !response.data?.session) throw toAuthApiError(response.message ?? "Login failed.", response.code);
    return response.data.session;
  }), [api, coordinator]);

  const externalLogin = useCallback(async (provider: AuthProviderType, credential: string, tenantId?: string) => coordinator.authenticate(async () => {
    const response = await api.loginWithExternalProvider({ provider, credential, tenantId });
    if (!response.success || !response.data?.session) throw toAuthApiError(response.message ?? "Login failed.", response.code);
    return response.data.session;
  }), [api, coordinator]);

  const externalSignup = useCallback(async (request: ExternalSignupRequest) => coordinator.authenticate(async () => {
    const response = await api.signupWithExternalProvider(request);
    if (!response.success || !response.data?.session) throw toAuthApiError(response.message ?? "Signup failed.", response.code);
    return response.data.session;
  }), [api, coordinator]);

  const logout = useCallback(() => coordinator.logout(), [coordinator]);

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
