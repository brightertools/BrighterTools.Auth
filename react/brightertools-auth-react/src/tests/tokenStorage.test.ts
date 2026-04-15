import { describe, expect, it } from "vitest";
import { createLocalStorageTokenStorage } from "../services/tokenStorage";

describe("tokenStorage", () => {
  it("persists and clears auth session", () => {
    const storage = createLocalStorageTokenStorage("bt.auth.test");
    storage.set({
      accessToken: "a",
      refreshToken: "r",
      expiresAtUtc: "2026-03-16T09:00:00Z",
      provider: "password",
      user: { id: "1", subjectId: "1" },
      onboarding: { required: false, status: "complete" }
    });

    expect(storage.get()?.refreshToken).toBe("r");

    storage.set(null);
    expect(storage.get()).toBeNull();
  });
});
