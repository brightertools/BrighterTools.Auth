import { useAuth } from "./useAuth.js";
import type { RefreshTokenRequest } from "../types/api.js";

export const useRefreshToken = () => {
  const { refreshSessionResult } = useAuth();
  return (request: RefreshTokenRequest) => refreshSessionResult(request);
};
