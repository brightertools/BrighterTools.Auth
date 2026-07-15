import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationManagementPanel } from "../components/InvitationManagementPanel";
import type { InvitationServiceAdapter } from "../types/invitations";

const clipboardWriteText = vi.fn();

Object.assign(globalThis.navigator, {
  clipboard: {
    writeText: clipboardWriteText
  }
});

describe("InvitationManagementPanel", () => {
  beforeEach(() => {
    clipboardWriteText.mockReset();
  });

  it("submits invitation requests using the configured role options", async () => {
    const adapter: Pick<
      InvitationServiceAdapter,
      | "getInvitationList"
      | "inviteUser"
      | "importInvitations"
      | "getInvitation"
      | "resendInvitation"
      | "cancelInvitation"
      | "removeInvitation"
      | "buildInvitationUrl"
    > = {
      getInvitationList: vi.fn().mockResolvedValue({
        success: true,
        data: {
          items: [],
          totalCount: 0
        }
      }),
      inviteUser: vi.fn().mockResolvedValue({ success: true }),
      importInvitations: vi.fn(),
      getInvitation: vi.fn(),
      resendInvitation: vi.fn(),
      cancelInvitation: vi.fn(),
      removeInvitation: vi.fn(),
      buildInvitationUrl: vi.fn()
    };

    render(
      <InvitationManagementPanel
        adapter={adapter}
        roleOptions={[
          { value: "user", label: "Standard User" },
          { value: "admin", label: "Administrator" }
        ]}
        defaultRole="user"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Taylor" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "alex@example.com" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));

    await waitFor(() => {
      expect(adapter.inviteUser).toHaveBeenCalledWith(expect.objectContaining({
        firstName: "Alex",
        lastName: "Taylor",
        email: "alex@example.com",
        role: "admin"
      }));
    });
  });

  it("renders accepted alternate email details and copies invite links", async () => {
    const adapter: Pick<
      InvitationServiceAdapter,
      | "getInvitationList"
      | "inviteUser"
      | "importInvitations"
      | "getInvitation"
      | "resendInvitation"
      | "cancelInvitation"
      | "removeInvitation"
      | "buildInvitationUrl"
    > = {
      getInvitationList: vi.fn().mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: "invite-1",
              guid: "invite-1",
              userInvitationKey: "key-1",
              firstName: "Alex",
              lastName: "Taylor",
              email: "old@example.com",
              acceptedEmailAddress: "new@example.com",
              canChangeEmailAddress: true,
              roleLabel: "Administrator",
              status: "accepted",
              invitationDate: "2026-07-11T00:00:00Z",
              expiryDate: "2026-07-18T00:00:00Z",
              canCopyLink: true,
              canViewDetails: true
            }
          ],
          totalCount: 1
        }
      }),
      inviteUser: vi.fn(),
      importInvitations: vi.fn(),
      getInvitation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: "invite-1",
          guid: "invite-1",
          userInvitationKey: "key-1",
          firstName: "Alex",
          lastName: "Taylor",
          email: "old@example.com",
          acceptedEmailAddress: "new@example.com",
          acceptedLoginProvider: "4",
          canChangeEmailAddress: true,
          roleLabel: "Administrator",
          status: "accepted"
        }
      }),
      resendInvitation: vi.fn(),
      cancelInvitation: vi.fn(),
      removeInvitation: vi.fn(),
      buildInvitationUrl: vi.fn().mockReturnValue("https://example.test/invitation/key-1")
    };

    render(<InvitationManagementPanel adapter={adapter} />);

    await screen.findByText("new@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith("https://example.test/invitation/key-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    await screen.findByText("Verified by Microsoft");
  });
});
