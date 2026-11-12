import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { InvitationManagementPanel } from "../components/InvitationManagementPanel.js";
afterEach(cleanup);
const setup = () => {
  const api = { getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items: [], totalCount: 0 } }), inviteUser: vi.fn().mockResolvedValue({ success: true }), importInvitations: vi.fn() };
  render(<InvitationManagementPanel adapter={api} />);
  fireEvent.click(screen.getByRole("button", { name: "Invite User" }));
  return api;
};
it("identifies missing names and invalid email without calling the transport", async () => {
  const api = setup();
  await screen.findByLabelText("Email");
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
  fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
  expect(screen.getByText("Enter the recipient's first name.")).toBeTruthy();
  expect(screen.getByText("Enter the recipient's last name.")).toBeTruthy();
  expect(screen.getByText(/Enter a valid recipient email/)).toBeTruthy();
  expect(screen.queryByText("Failed to send invitation.")).toBeNull();
  expect(api.inviteUser).not.toHaveBeenCalled();
});
it("accepts plus addressing and sends the corrected retained draft", async () => {
  const api = setup();
  await screen.findByLabelText("Email");
  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Mark" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Test" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mark@" } });
  fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
  expect(api.inviteUser).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: " mark+invite@brightertools.com " } });
  fireEvent.click(screen.getByRole("button", { name: "Send Invitation" }));
  expect(api.inviteUser).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Mark", lastName: "Test", email: "mark+invite@brightertools.com" }));
});
