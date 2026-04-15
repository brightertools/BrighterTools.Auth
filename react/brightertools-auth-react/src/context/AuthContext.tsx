import { createContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { AuthApiClient } from "../services/createAuthApi";
import type { TokenStorage } from "../services/tokenStorage";
import type { AuthSession } from "../types/auth";

export interface AuthContextValue {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  api: AuthApiClient;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps extends PropsWithChildren {
  api: AuthApiClient;
  storage: TokenStorage;
}

export const AuthProvider = ({ api, storage, children }: AuthProviderProps) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => storage.get());

  useEffect(() => {
    storage.set(session);
  }, [session, storage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      api,
      setSession: setSessionState
    }),
    [api, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
