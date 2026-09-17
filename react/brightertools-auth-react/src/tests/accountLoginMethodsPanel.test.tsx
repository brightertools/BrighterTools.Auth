import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountLoginMethodsPanel } from "../components/AccountLoginMethodsPanel";
import type { AccountLoginMethods, AuthProviderType } from "../types/auth";

const createDetails = (): AccountLoginMethods => ({
  email: "mark.redman@wirebox.co.uk",
  emailVerified: true,
  hasPassword: true,
  providers: [
    {
      provider: "4" as AuthProviderType,
      providerSubject: "microsoft-subject",
      email: "mark.redman@wirebox.co.uk",
      emailVerified: true,
      linkedAtUtc: "2026-07-11T00:00:00Z"
    }
  ],
  notificationEmailCandidates: [
    {
      email: "mark.redman@wirebox.co.uk",
      isVerified: true,
      sourceProvider: "4" as AuthProviderType,
      source: "4",
      isPrivateRelay: false,
      canUseForNotifications: true,
      isCurrentNotificationEmail: false
    }
  ],
  recommendedNotificationEmail: "mark.redman@wirebox.co.uk",
  notificationEmail: null,
  notificationEmailVerified: false,
  primaryEmailIsPrivateRelay: false,
  requiresNotificationEmailSetup: true
});

describe("AccountLoginMethodsPanel", () => {
  it.each(["privaterelay.appleid.com", "private.icloud.com"])("allows a verified %s address without demanding a personal address", domain => {
    const email = `relay@${domain}`;
    const details = createDetails();
    details.email = email;
    details.notificationEmail = email;
    details.primaryEmailIsPrivateRelay = true;
    details.requiresNotificationEmailSetup = false;
    details.notificationEmailCandidates = [{ email, isVerified: true, isPrivateRelay: true, canUseForNotifications: true, isCurrentNotificationEmail: true }];
    render(<AccountLoginMethodsPanel details={details}
      onRequestLoginEmailChange={vi.fn()} onVerifyLoginEmailCode={vi.fn()}
      onRequestNotificationEmailChange={vi.fn()} onVerifyNotificationEmailCode={vi.fn()}
      onRequestPasswordSetup={vi.fn()} onUnlinkProvider={vi.fn()}
      onSelectNotificationEmail={vi.fn()} onRemoveContactEmail={vi.fn()} />);
    expect(screen.getByText("Notification default")).toBeTruthy();
    expect(screen.queryByText("Notification email required.")).toBeNull();
    expect(screen.queryByRole("button", { name: `Remove contact email ${email}` })).toBeNull();
    expect(screen.getAllByDisplayValue(email).length).toBeGreaterThan(0);
  });

  it("offers explicit selection and removal for a verified non-default address", () => {
    const details = createDetails();
    const select = vi.fn();
    const remove = vi.fn();
    render(<AccountLoginMethodsPanel details={details}
      onRequestLoginEmailChange={vi.fn()} onVerifyLoginEmailCode={vi.fn()}
      onRequestNotificationEmailChange={vi.fn()} onVerifyNotificationEmailCode={vi.fn()}
      onRequestPasswordSetup={vi.fn()} onUnlinkProvider={vi.fn()}
      onSelectNotificationEmail={select} onRemoveContactEmail={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Use mark.redman@wirebox.co.uk for notifications" }));
    expect(select).toHaveBeenCalledWith("mark.redman@wirebox.co.uk");
    fireEvent.click(screen.getByRole("button", { name: "Remove contact email mark.redman@wirebox.co.uk" }));
    expect(remove).toHaveBeenCalledWith("mark.redman@wirebox.co.uk");
  });
  it("maps numeric provider values to friendly names in provider and candidate labels", () => {
    render(
      <AccountLoginMethodsPanel
        details={createDetails()}
        verificationCode=""
        notificationVerificationCode=""
        onRequestLoginEmailChange={vi.fn()}
        onVerifyLoginEmailCode={vi.fn()}
        onRequestNotificationEmailChange={vi.fn()}
        onVerifyNotificationEmailCode={vi.fn()}
        onRequestPasswordSetup={vi.fn()}
        onUnlinkProvider={vi.fn()}
      />
    );

    expect(screen.getByText("Verified by Microsoft")).toBeTruthy();
    expect(screen.getByText("mark.redman@wirebox.co.uk (Microsoft)")).toBeTruthy();
  });

  it("shows a read-only legacy username when the supplied login identity is a username", () => {
    render(
      <AccountLoginMethodsPanel
        details={createDetails()}
        loginIdentity={{ value: "aroche", type: "unknown" }}
        verificationCode=""
        notificationVerificationCode=""
        onRequestLoginEmailChange={vi.fn()}
        onVerifyLoginEmailCode={vi.fn()}
        onRequestNotificationEmailChange={vi.fn()}
        onVerifyNotificationEmailCode={vi.fn()}
        onRequestPasswordSetup={vi.fn()}
        onUnlinkProvider={vi.fn()}
      />
    );

    expect(screen.getByText("Legacy Username")).toBeTruthy();
    expect(screen.getByText("aroche")).toBeTruthy();
  });

  it("does not show the legacy username row when the supplied login identity is an email", () => {
    render(
      <AccountLoginMethodsPanel
        details={createDetails()}
        loginIdentity={{ value: "mark.redman@wirebox.co.uk", type: "unknown" }}
        verificationCode=""
        notificationVerificationCode=""
        onRequestLoginEmailChange={vi.fn()}
        onVerifyLoginEmailCode={vi.fn()}
        onRequestNotificationEmailChange={vi.fn()}
        onVerifyNotificationEmailCode={vi.fn()}
        onRequestPasswordSetup={vi.fn()}
        onUnlinkProvider={vi.fn()}
      />
    );

    expect(screen.queryByText("Legacy Username")).toBeNull();
  });
});
