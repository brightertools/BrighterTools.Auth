import { useAuth } from "./useAuth.js";

export const useLogout = () => {
  const { api, setSession } = useAuth();

  return async (refreshToken?: string) => {
    const response = await api.logout(refreshToken ? { refreshToken } : undefined);
    setSession(null);
    return response;
  };
};
