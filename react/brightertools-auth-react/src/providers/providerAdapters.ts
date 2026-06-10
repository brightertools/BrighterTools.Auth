import type { AuthProviderType } from "../types/auth";

export interface ExternalProviderAdapter {
  provider: AuthProviderType;
  beginLogin(): Promise<string>;
}


