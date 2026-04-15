import type { AuthProvider } from "../types/auth";

export interface ExternalProviderAdapter {
  provider: AuthProvider;
  beginLogin(): Promise<string>;
}
