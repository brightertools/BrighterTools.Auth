import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { InvitationAcceptancePanel } from "../components/InvitationAcceptancePanel";
import { InvitationManagementPanel } from "../components/InvitationManagementPanel";
afterEach(cleanup);
const acceptance = () => ({
  getInvitationDetails: vi.fn().mockResolvedValue({ success: true, data: { email: "company@example.test", firstName: "", lastName: "", accountName: "Company", status: "pending", isValid: true, canChangeEmailAddress: false } }),
  acceptInvitation: vi.fn(), connectInvitation: vi.fn(), declineInvitation: vi.fn()
});
it("accepts server-verified linked-provider eligibility without changing the primary email", async () => {
  render(<InvitationAcceptancePanel invitationKey="token" adapter={acceptance()} currentUser={{ email: "personal@example.test" }} getCurrentUserEmail={user => user.email} canCurrentUserAccept />);
  expect(await screen.findByRole("button", { name: "Accept invitation with this account" })).toBeTruthy();
});
it("retains primary-email enforcement without the optional eligibility result", async () => {
  render(<InvitationAcceptancePanel invitationKey="token" adapter={acceptance()} currentUser={{ email: "personal@example.test" }} getCurrentUserEmail={user => user.email} />);
  await screen.findByText(/cannot be accepted with this account/);
  expect(screen.queryByRole("button", { name: "Accept invitation with this account" })).toBeNull();
});
it("lets hosts hide unsupported import without changing the shared default", async () => {
  render(<InvitationManagementPanel showImport={false} adapter={{ getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }), inviteUser: vi.fn(), importInvitations: vi.fn() }} />);
  expect(screen.queryByRole("button", { name: /import/i })).toBeNull();
});
it("displays revoked history without treating it as an unknown state", async () => {
  render(<InvitationManagementPanel adapter={{ getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items: [{ id: "revoked", email: "company@example.test", firstName: "", lastName: "", status: "revoked" }], totalCount: 1 } }), inviteUser: vi.fn(), importInvitations: vi.fn() }} />);
  expect(await screen.findByText("Revoked")).toBeTruthy();
});
