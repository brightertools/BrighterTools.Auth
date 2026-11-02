import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { UserAdministrationPanel } from "../dist/components/UserAdministrationPanel";
it("renders rebuilt public components with the actual React 19 consumer runtime", async () => {
  expect(React.version.startsWith("19.")).toBe(true);
  render(<UserAdministrationPanel scopeKey="react19" members={{adapter:{getMemberList:vi.fn().mockResolvedValue({success:true,data:{items:[],totalCount:0}})}}}
    invitations={{adapter:{getInvitationList:vi.fn().mockResolvedValue({success:true,data:{items:[],totalCount:0}}),inviteUser:vi.fn(),importInvitations:vi.fn()}}} />);
  await screen.findByText("No members found."); await screen.findByText("No invitations found.");
});
