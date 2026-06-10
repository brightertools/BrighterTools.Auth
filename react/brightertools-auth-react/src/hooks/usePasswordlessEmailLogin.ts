import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import type { BeginPasswordlessEmailLoginRequest, CompletePasswordlessEmailLoginRequest } from "../types/api";

export const usePasswordlessEmailLogin = () => {
  const { api, setSession } = useAuth();

  const begin = useCallback((request: BeginPasswordlessEmailLoginRequest) => api.beginPasswordlessEmailLogin(request), [api]);

  const complete = useCallback(async (request: CompletePasswordlessEmailLoginRequest) => {
    const response = await api.completePasswordlessEmailLogin(request);
    setSession(response.data?.session ?? null);
    return response;
  }, [api, setSession]);

  return useMemo(() => ({ begin, complete }), [begin, complete]);
};
