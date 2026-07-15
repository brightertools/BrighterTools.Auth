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

    await screen.findByText("You already belong to this organisation/group with this account, so this invitation cannot be accepted again.");
    expect(screen.queryByRole("button", { name: "Use this account to accept invitation" })).toBeNull();
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

    await screen.findByText("Create New Account And Accept Invitation");

    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Taylor" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "alex@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Password1!" } });
    fireEvent.click(screen.getByLabelText(/I have read and accept the/i));
    fireEvent.click(screen.getByLabelText(/I accept the/i));
    fireEvent.click(screen.getByRole("button", { name: "Accept Invitation" }));

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
});
