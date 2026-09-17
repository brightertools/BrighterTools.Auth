import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvitationAcceptancePanel } from "../components/InvitationAcceptancePanel";
import type { InvitationServiceAdapter } from "../types/invitations";

describe("InvitationAcceptancePanel", () => {
  it("blocks accepting with the current account when the user already belongs to the invited tenant", async () => {
    const adapter: Pick<InvitationServiceAdapter, "getInvitationDetails" | "acceptInvitation" | "connectInvitation" | "declineInvitation"> = {
      getInvitationDetails: vi.fn().mockResolvedValue({
        success: true,
        data: {
          email: "member@example.com",
          firstName: "Member",
          lastName: "User",
          accountName: "Example Org",
          canChangeEmailAddress: false,
          tenantGuid: "tenant-1",
          status: "pending"
        }
      }),
      acceptInvitation: vi.fn(),
      connectInvitation: vi.fn(),
      declineInvitation: vi.fn()
    };

    render(
      <InvitationAcceptancePanel
        invitationKey="invite-key"
        adapter={adapter}
        currentUser={{ tenantIds: ["tenant-1"] }}
        getCurrentUserDisplayName={() => "Current User"}
        getCurrentUserEmail={() => "member@example.com"}
        isCurrentUserAlreadyInInvitedTenant={(user, details) => Boolean(details.tenantGuid && user.tenantIds.includes(details.tenantGuid))}
      />
    );

    await screen.findByText("You also already belong to this organisation/group, so you cannot accept this invitation on this login.");
    expect(screen.queryByRole("button", { name: "Accept invitation with this account" })).toBeNull();
    expect(screen.getByRole("button", { name: "Logout and use another account" })).not.toBeNull();
  });

  it("submits base and extension fields and completes with login when activated", async () => {
    const adapter: Pick<InvitationServiceAdapter, "getInvitationDetails" | "acceptInvitation" | "connectInvitation" | "declineInvitation"> = {
      getInvitationDetails: vi.fn().mockResolvedValue({
        success: true,
        data: {
          email: "invitee@example.com",
          firstName: "Invitee",
          lastName: "User",
          accountName: "Example Org",
          canChangeEmailAddress: true,
          status: "pending"
        }
      }),
      acceptInvitation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          activated: true
        }
      }),
      connectInvitation: vi.fn(),
      declineInvitation: vi.fn()
    };
    const loginWithPassword = vi.fn().mockResolvedValue({ success: true });
    const onCompleted = vi.fn();

    render(
      <InvitationAcceptancePanel
        invitationKey="invite-key"
        adapter={adapter}
        loginWithPassword={loginWithPassword}
        createAccountExtension={{
          content: <div>Extension content</div>,
          validate: () => [],
          getFields: () => ({ phone: "01234", handle: "invitee" })
        }}
        onCompleted={onCompleted}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "Create a new account and accept invitation" }));
    await screen.findByText("Create a new account and accept invitation");

    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Taylor" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "alex@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Password1!" } });
    fireEvent.click(screen.getByLabelText(/I have read and accept the/i));
    fireEvent.click(screen.getByLabelText(/I accept the/i));
    fireEvent.click(screen.getByRole("button", { name: "Create account and accept invitation" }));

    await waitFor(() => {
      expect(adapter.acceptInvitation).toHaveBeenCalledWith(expect.objectContaining({
        userInvitationKey: "invite-key",
        firstName: "Alex",
        lastName: "Taylor",
        email: "alex@example.com",
        fields: {
          phone: "01234",
          handle: "invitee"
        }
      }));
    });
    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith("alex@example.com", "Password1!");
      expect(onCompleted).toHaveBeenCalledWith("accepted");
    });
  });

  it("connects a current account when its email matches a restricted invitation", async () => {
    const connectInvitation = vi.fn().mockResolvedValue({ success: true });
    const adapter: Pick<InvitationServiceAdapter, "getInvitationDetails" | "acceptInvitation" | "connectInvitation" | "declineInvitation"> = {
      getInvitationDetails: vi.fn().mockResolvedValue({
        success: true,
        data: {
          email: "invitee@example.com",
          accountName: "Example Org",
          canChangeEmailAddress: false,
          status: "pending"
        }
      }),
      acceptInvitation: vi.fn(),
      connectInvitation,
      declineInvitation: vi.fn()
    };

    render(
      <InvitationAcceptancePanel
        invitationKey="invite-key"
        adapter={adapter}
        currentUser={{ email: "invitee@example.com" }}
        getCurrentUserDisplayName={() => "Invitee User"}
        getCurrentUserEmail={user => user.email}
        getCurrentUserLoginProvider={() => "Google"}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation with this account" }));
    await waitFor(() => expect(connectInvitation).toHaveBeenCalledWith({ userInvitationKey: "invite-key" }));
  });

  it("allows a current account with a different email when the invitation permits any email", async () => {
    const connectInvitation = vi.fn().mockResolvedValue({ success: true });
    const adapter: Pick<InvitationServiceAdapter, "getInvitationDetails" | "acceptInvitation" | "connectInvitation" | "declineInvitation"> = {
      getInvitationDetails: vi.fn().mockResolvedValue({
        success: true,
        data: {
          email: "corporate@example.com",
          accountName: "Example Org",
          canChangeEmailAddress: true,
          status: "pending"
        }
      }),
      acceptInvitation: vi.fn(),
      connectInvitation,
      declineInvitation: vi.fn()
    };

    render(
      <InvitationAcceptancePanel
        invitationKey="invite-key"
        adapter={adapter}
        currentUser={{ email: "personal@example.com" }}
        getCurrentUserEmail={user => user.email}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "Accept invitation with this account" }));
    await waitFor(() => expect(connectInvitation).toHaveBeenCalledWith({ userInvitationKey: "invite-key" }));
  });

  it("requires an explicit decline before requesting an update for a restricted email mismatch", async () => {
    const declineInvitation = vi.fn().mockResolvedValue({ success: true });
    const adapter: Pick<InvitationServiceAdapter, "getInvitationDetails" | "acceptInvitation" | "connectInvitation" | "declineInvitation"> = {
      getInvitationDetails: vi.fn().mockResolvedValue({
        success: true,
        data: {
          email: "corporate@example.com",
          accountName: "Example Org",
          canChangeEmailAddress: false,
          status: "pending"
        }
      }),
      acceptInvitation: vi.fn(),
      connectInvitation: vi.fn(),
      declineInvitation
    };

    render(
      <InvitationAcceptancePanel
        invitationKey="invite-key"
        adapter={adapter}
        currentUser={{ email: "personal@example.com" }}
        getCurrentUserEmail={user => user.email}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "Decline invitation and request an update" }));

    const response = await screen.findByLabelText("Message to the inviter (optional)");
    expect((response as HTMLTextAreaElement).value).toBe("Please resend this invitation to personal@example.com, or update this invitation to allow any email address.");
    expect(declineInvitation).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Accept invitation with this account" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Logout and use another account" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Decline invitation" }));
    await waitFor(() => expect(declineInvitation).toHaveBeenCalledWith({
      userInvitationKey: "invite-key",
      message: "Please resend this invitation to personal@example.com, or update this invitation to allow any email address."
    }));
  });
});
