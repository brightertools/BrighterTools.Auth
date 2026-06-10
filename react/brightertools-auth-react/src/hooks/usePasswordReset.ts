import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";

export const usePasswordReset = () => {
  const { api } = useAuth();

  const begin = useCallback((login: string) => api.beginPasswordReset(login), [api]);
  const complete = useCallback((token: string, newPassword: string) => api.completePasswordReset(token, newPassword), [api]);

  return useMemo(() => ({ begin, complete }), [begin, complete]);
};
