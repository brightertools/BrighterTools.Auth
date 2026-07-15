import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AccountLoginMethodsManager } from "../components/AccountLoginMethodsManager";
import type { AccountLoginMethods } from "../types/auth";

const loadMock = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    loading: false,
    isAuthenticated: true
  })
}));

vi.mock("../hooks/useLoginMethods", () => ({
  useLoginMethods: () => ({
    load: loadMock,
    linkedProviders: vi.fn(),
    linkProvider: vi.fn(),
    unlinkProvider: vi.fn(),
    beginLoginEmailChange: vi.fn(),
    verifyLoginEmailChangeCode: vi.fn(),
    beginNotificationEmailChange: vi.fn(),
    verifyNotificationEmailChangeCode: vi.fn(),
    beginPasswordSetup: vi.fn(),
    completePasswordSetup: vi.fn(),
    changePassword: vi.fn(),
    removePasswordLogin: vi.fn()
  })
}));

vi.mock("../services/appleAuth", () => ({
  signInWithApple: vi.fn()
}));

vi.mock("../services/microsoftAuth", () => ({
  signInWithMicrosoft: vi.fn()
}));

const details: AccountLoginMethods = {
  email: "legacy.user@example.com",
  emailVerified: true,
  hasPassword: true,
  providers: [],
  notificationEmail: null,
  notificationEmailVerified: false,
  notificationEmailCandidates: [],
  primaryEmailIsPrivateRelay: false,
  requiresNotificationEmailSetup: false
};

describe("AccountLoginMethodsManager", () => {
  beforeEach(() => {
    loadMock.mockReset();
  });

  it("shows a loading state before login details arrive instead of rendering the not set up state", async () => {
    let resolveLoad: ((value: unknown) => void) | null = null;
    loadMock.mockReturnValue(new Promise(resolve => {
      resolveLoad = resolve;
    }));

    render(<AccountLoginMethodsManager />);

    expect(screen.getByText("Loading your login methods...")).toBeTruthy();
    expect(screen.queryByText("Not set up")).toBeNull();

    resolveLoad?.({ success: true, data: details });

    await waitFor(() => {
      expect(screen.getByText("Login email")).toBeTruthy();
    });
  });

  it("shows a retryable error when the first login details fetch fails", async () => {
    loadMock.mockResolvedValue({ success: false, message: "Could not load login methods." });

    render(<AccountLoginMethodsManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });
  });
});
