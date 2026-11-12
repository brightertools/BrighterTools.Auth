import { useAuth } from "./useAuth.js";
import type { RefreshTokenRequest } from "../types/api.js";

export const useRefreshToken = () => {
  const { api, setSession } = useAuth();

  return async (request: RefreshTokenRequest) => {
    const response = await api.refresh(request);
    setSession(response.data?.session ?? null);
    return response;
  };
};
