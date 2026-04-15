import { useAuth } from "./useAuth";
import type { RefreshTokenRequest } from "../types/api";

export const useRefreshToken = () => {
  const { api, setSession } = useAuth();

  return async (request: RefreshTokenRequest) => {
    const response = await api.refresh(request);
    setSession(response.session ?? null);
    return response;
  };
};
