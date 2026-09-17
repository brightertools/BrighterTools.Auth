import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AccountLoginMethodsManager } from "../components/AccountLoginMethodsManager";
import type { AccountLoginMethods } from "../types/auth";

const loadMock = vi.fn();
const beginContactMock = vi.fn();
const selectContactMock = vi.fn();

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
    beginNotificationEmailChange: beginContactMock,
    selectNotificationEmail: selectContactMock,
    removeContactEmail: vi.fn(),
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
    beginContactMock.mockReset();
    selectContactMock.mockReset();
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

  it("adds a contact without changing the notification selection", async () => {
    const account = { ...details, notificationEmail: details.email, notificationEmailVerified: true,
      notificationEmailCandidates: [{ email: details.email!, isVerified: true, canUseForNotifications: true, isCurrentNotificationEmail: true, isPrivateRelay: false }] };
    loadMock.mockResolvedValue({ success: true, data: account });
    beginContactMock.mockResolvedValue({ success: true, data: { email: "new@example.com", challengeId: "contact-challenge", codeSent: true } });
    render(<AccountLoginMethodsManager />);
    const section = (await screen.findByRole("heading", { name: "Contact emails and notifications" })).closest("section")!;
    fireEvent.change(within(section).getByPlaceholderText("Enter your email address"), { target: { value: "new@example.com" } });
    fireEvent.click(within(section).getByRole("button", { name: "Verify email" }));
    await waitFor(() => expect(beginContactMock).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", addOnly: true })));
    expect(selectContactMock).not.toHaveBeenCalled();
    expect(within(section).getByText("Notification default")).toBeTruthy();
  });

  it("shows a retryable error when the first login details fetch fails", async () => {
    loadMock.mockResolvedValue({ success: false, message: "Could not load login methods." });

    render(<AccountLoginMethodsManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });
  });
});
