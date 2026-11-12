import type { AuthProviderType } from "../types/auth.js";

export interface ExternalProviderAdapter {
  provider: AuthProviderType;
  beginLogin(): Promise<string>;
}


