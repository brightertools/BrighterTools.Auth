import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth.js";
import type { BeginPasswordlessEmailLoginRequest, CompletePasswordlessEmailLoginRequest } from "../types/api.js";

export const usePasswordlessEmailLogin = () => {
  const { api, transitionSession } = useAuth();

  const begin = useCallback((request: BeginPasswordlessEmailLoginRequest) => api.beginPasswordlessEmailLogin(request), [api]);

  const complete = useCallback((request: CompletePasswordlessEmailLoginRequest) => transitionSession(
    () => api.completePasswordlessEmailLogin(request), response => response.success ? response.data?.session : null),
    [api, transitionSession]);

  return useMemo(() => ({ begin, complete }), [begin, complete]);
};
