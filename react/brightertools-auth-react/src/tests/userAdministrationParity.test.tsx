import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemberManagementPanel } from "../components/MemberManagementPanel";
import { InvitationManagementPanel } from "../components/InvitationManagementPanel";
import { UserAdministrationPanel } from "../components/UserAdministrationPanel";
import type { InvitationImportPreview, InvitationListItem } from "../types/invitations";
import type { MemberListItem } from "../types/members";

const member: MemberListItem = { id: "opaque-user-guid", firstName: "Alex", lastName: "Example", email: "alex@example.test",
  role: "member", accessEnabled: true, canEdit: true, canRemove: true };
const invitation: InvitationListItem = { id: "opaque-invite-guid", firstName: "Blair", lastName: "Example", email: "blair@example.test",
  role: "member", message: "Welcome back", status: "pending", expiryDate: "2099-01-01", canResend: true, canCancel: true, canCopyLink: true };
const roles = [{ value: "member", label: "Member" }, { value: "admin", label: "Administrator" }];
const memberApi = (items = [member]) => ({
  getMemberList: vi.fn().mockResolvedValue({ success: true, data: { items, totalCount: items.length } }),
  getMember: vi.fn().mockResolvedValue({ success: true, data: items[0] }),
  updateMember: vi.fn().mockResolvedValue({ success: true }), removeMember: vi.fn().mockResolvedValue({ success: true })
});
const inviteApi = (items = [invitation]) => ({
  getInvitationList: vi.fn().mockResolvedValue({ success: true, data: { items, totalCount: items.length } }),
  inviteUser: vi.fn().mockResolvedValue({ success: true }), importInvitations: vi.fn(),
  getInvitation: vi.fn().mockResolvedValue({ success: true, data: items[0] })
});
const preview: InvitationImportPreview = { previewId: "preview-1", validationSucceeded: true, queued: false,
  validRowCount: 1, invalidRowCount: 0, invalidRows: [], previewRows: [{ rowNumber: 2, firstName: "Imported", lastName: "Person", emailAddress: "import@example.test" }] };
const importApi = () => ({ ...inviteApi([]),
  previewInvitationImport: vi.fn().mockResolvedValue({ success: true, data: preview }),
  commitInvitationImport: vi.fn().mockResolvedValue({ success: true, data: { ...preview, queued: true, jobId: "job-1" } }),
  downloadInvitationTemplate: vi.fn().mockResolvedValue(undefined)
});
const file = () => new File(["safe,fixture"], "invites.csv", { type: "text/csv" });
const chooseFile = () => { const selected = file(); fireEvent.change(screen.getByLabelText("Choose File"), { target: { files: [selected] } }); return selected; };
const confirm = () => fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirm", exact: true }));
const defer = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; };

describe("shared member administration", () => {
  it("edits scoped access/activation separately without sending personal identity", async () => {
    const api = memberApi([{ ...member, active: true, accessHelp: "Workspace access, not global identity." }]);
    render(<MemberManagementPanel adapter={api} roleOptions={roles} />);
    await screen.findByText("Unknown");
    fireEvent.click(screen.getByRole("button", { name: "Edit", exact: true }));
    await screen.findByText("Personal details are managed by the member.");
    expect(screen.queryByRole("textbox", { name: "Email" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "admin" } });
    fireEvent.click(screen.getByLabelText("Access enabled"));
    expect((screen.getByLabelText("Membership active") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
    await waitFor(() => expect(api.updateMember).toHaveBeenCalledWith(member.id, { role: "admin", accessEnabled: false, active: true }));
    await screen.findByText("Member updated.");
  });

  it("uses authoritative capabilities and blocks owner/self edits and removals", async () => {
    const api = memberApi([{ ...member, isOwner: true }, { ...member, id: "self", isSelf: true }, { ...member, id: "read-only", canEdit: false, canRemove: false }]);
    render(<MemberManagementPanel adapter={api} roleOptions={roles} />);
    await screen.findByText("Owner");
    expect(screen.queryByRole("button", { name: "Edit", exact: true })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove member" })).toBeNull();
  });

  it("keeps integration activation help and disabled fields", async () => {
    const api = memberApi([{ ...member, accessEnabled: false, canChangeAccess: false, canChangeRole: false, active: true, canChangeActive: false, accessHelp: "Activate through an invitation." }]);
    render(<MemberManagementPanel adapter={api} roleOptions={roles} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit", exact: true }));
    await screen.findByText("Activate through an invitation.");
    expect((screen.getByLabelText("Access enabled") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Membership active") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Role") as HTMLSelectElement).disabled).toBe(true);
  });

  it("confirms member removal, cancels safely and retains failure for retry", async () => {
    const api = memberApi(); api.removeMember.mockRejectedValueOnce(new Error("offline"));
    render(<MemberManagementPanel adapter={api} />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove member" }));
    expect(api.removeMember).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove member" })); confirm();
    await screen.findByText("Unable to remove member.");
    expect(screen.getByRole("alertdialog")).toBeTruthy(); confirm();
    await screen.findByText("Member removed.");
    expect(api.removeMember).toHaveBeenCalledTimes(2);
  });

  it("retains drafts after rejection and prevents duplicate member saves", async () => {
    const api = memberApi(); const pending = defer<{success: boolean; message: string}>(); api.updateMember.mockReturnValue(pending.promise);
    render(<MemberManagementPanel adapter={api} roleOptions={roles} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit", exact: true }));
    await screen.findByLabelText("Role"); fireEvent.change(screen.getByLabelText("Role"), { target: { value: "admin" } });
    const save = screen.getByRole("button", { name: "Save", exact: true }); fireEvent.click(save); fireEvent.click(save);
    expect(api.updateMember).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ success: false, message: "Quota exceeded" }));
    expect((screen.getByLabelText("Role") as HTMLSelectElement).value).toBe("admin");
    expect(screen.getByText("Quota exceeded")).toBeTruthy();
  });

  it("delegates ownership with custom host slots rather than changing ownership itself", async () => {
    const item = { ...member, isOwner: true, canTransferOwnership: true }; const api = memberApi([item]); const transfer = vi.fn();
    render(<MemberManagementPanel adapter={api} onTransferOwnership={transfer} toolbarContent={<span>Host protected flow</span>}
      renderMemberActions={row => <span>Host action for {row.id}</span>} />);
    fireEvent.click(await screen.findByRole("button", { name: "Transfer ownership" }));
    expect(transfer).toHaveBeenCalledWith(item); expect(api.updateMember).not.toHaveBeenCalled();
    expect(screen.getByText("Host protected flow")).toBeTruthy(); expect(screen.getByText("Host action for " + item.id)).toBeTruthy();
  });

  it("discards tenant-owned drafts and ignores late detail responses", async () => {
    const a = memberApi(); const b = memberApi([{ ...member, id: "tenant-b", firstName: "New" }]);
    const pending = defer<unknown>(); a.getMember.mockReturnValue(pending.promise);
    const { rerender } = render(<MemberManagementPanel adapter={a} scopeKey="a" />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit", exact: true }));
    rerender(<MemberManagementPanel adapter={b} scopeKey="b" />); await screen.findByText("New Example");
    await act(async () => pending.resolve({ success: true, data: member }));
    expect(screen.queryByText("Personal details are managed by the member.")).toBeNull();
  });

  it("supports direct edit and back navigation in StrictMode", async () => {
    const api = memberApi(); const onViewChange = vi.fn();
    const { rerender } = render(<StrictMode><MemberManagementPanel adapter={api} view={{mode:"edit", memberId:member.id}} roleOptions={roles} onViewChange={onViewChange} /></StrictMode>);
    await screen.findByLabelText("Role");
    rerender(<StrictMode><MemberManagementPanel adapter={api} view={{mode:"list"}} roleOptions={roles} onViewChange={onViewChange} /></StrictMode>);
    await screen.findByText("Alex Example"); expect(screen.queryByLabelText("Role")).toBeNull();
  });

  it("keeps member search and pagination when returning from an editor", async () => {
    const api = memberApi(); api.getMemberList.mockResolvedValue({ success: true, data: { items: [member], totalCount: 60 } });
    render(<MemberManagementPanel adapter={api} roleOptions={roles} />); await screen.findByText("Alex Example");
    fireEvent.change(screen.getByRole("textbox", { name:"Search" }), { target: { value:"Alex" } });
    fireEvent.click(screen.getByRole("button", { name:"Search", exact:true }));
    await waitFor(() => expect(api.getMemberList).toHaveBeenLastCalledWith(expect.objectContaining({query:"Alex",page:1})));
    fireEvent.click(screen.getByRole("button", {name:"Next"}));
    await screen.findByText("Page 2 of 3 (60 total)");
    fireEvent.click(screen.getByRole("button", {name:"Edit",exact:true})); await screen.findByLabelText("Role");
    fireEvent.click(screen.getByRole("button", {name:"Cancel",exact:true}));
    expect((screen.getByRole("textbox",{name:"Search"}) as HTMLInputElement).value).toBe("Alex");
    expect(screen.getByText("Page 2 of 3 (60 total)")).toBeTruthy();
  });
});

describe("shared invitation parity", () => {
  it("loads current values for editable resend, confirms and never overloads inviteUser", async () => {
    const api = { ...inviteApi(), editAndResendInvitation:vi.fn().mockResolvedValue({success:false,message:"Already accepted"}), resendInvitation:vi.fn() };
    render(<InvitationManagementPanel adapter={api} presentation="workspace" roleOptions={roles} />);
    fireEvent.click(await screen.findByRole("button", {name:"Resend",exact:true}));
    expect((await screen.findByLabelText("Optional Message") as HTMLTextAreaElement).value).toBe("Welcome back");
    fireEvent.change(screen.getByLabelText("Email"), {target:{value:"updated@example.test"}});
    fireEvent.click(screen.getByRole("button",{name:"Save and resend"}));
    expect(api.editAndResendInvitation).not.toHaveBeenCalled(); confirm();
    await screen.findByText("Already accepted");
    expect(api.editAndResendInvitation).toHaveBeenCalledWith(invitation.id,expect.objectContaining({email:"updated@example.test",message:"Welcome back"}));
    expect(api.inviteUser).not.toHaveBeenCalled(); expect(api.resendInvitation).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("updated@example.test");
  });

  it("opens a direct resend URL in StrictMode", async () => {
    const api = {...inviteApi(),editAndResendInvitation:vi.fn()};
    render(<StrictMode><InvitationManagementPanel adapter={api} view={{mode:"resend",invitationId:invitation.id}} presentation="workspace" /></StrictMode>);
    expect((await screen.findByLabelText("Email") as HTMLInputElement).value).toBe(invitation.email);
    expect(api.editAndResendInvitation).not.toHaveBeenCalled();
  });

  it("fetches protected links only explicitly, copies without resend and exposes clipboard fallback", async () => {
    const clipboard = vi.fn().mockRejectedValue(new Error("denied")); Object.assign(navigator,{clipboard:{writeText:clipboard}});
    const api = {...inviteApi(),getInvitationLink:vi.fn().mockResolvedValue({success:true,data:{url:"https://example.test/current-secret"}}),resendInvitation:vi.fn(),buildInvitationUrl:vi.fn()};
    render(<InvitationManagementPanel adapter={api} />);
    await screen.findByText("Blair Example"); expect(api.getInvitationLink).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", {name:"Copy Link"}));
    await screen.findByText("Unable to copy invite link from browser clipboard API.");
    expect((screen.getByLabelText("Invite URL") as HTMLInputElement).value).toBe("https://example.test/current-secret");
    expect(clipboard).toHaveBeenCalledWith("https://example.test/current-secret");
    expect(api.resendInvitation).not.toHaveBeenCalled(); expect(api.buildInvitationUrl).not.toHaveBeenCalled();
  });

  it("does not offer protected links for expired or accepted invitations", async () => {
    const api = {...inviteApi([{...invitation,expiryDate:"2000-01-01"},{...invitation,id:"accepted",status:"accepted"}]),getInvitationLink:vi.fn()};
    render(<InvitationManagementPanel adapter={api} />);
    await screen.findByText("Expired"); expect(screen.queryByRole("button",{name:"Copy Link"})).toBeNull();
    expect(api.getInvitationLink).not.toHaveBeenCalled();
  });

  it("fails protected retrieval safely without falling back or rotating", async () => {
    const api = {...inviteApi(),getInvitationLink:vi.fn().mockResolvedValue({success:false,message:"Legacy link unavailable. Resend explicitly."}),buildInvitationUrl:vi.fn(),resendInvitation:vi.fn()};
    render(<InvitationManagementPanel adapter={api} />);
    fireEvent.click(await screen.findByRole("button",{name:"Show link"}));
    await screen.findByText("Legacy link unavailable. Resend explicitly.");
    expect(api.buildInvitationUrl).not.toHaveBeenCalled();expect(api.resendInvitation).not.toHaveBeenCalled();
  });

  it("ignores protected retrieval resolving after a scope switch", async () => {
    const pending = defer<unknown>();const api={...inviteApi(),getInvitationLink:vi.fn().mockReturnValue(pending.promise)};
    const {rerender}=render(<InvitationManagementPanel scopeKey="a" adapter={api} />);
    fireEvent.click(await screen.findByRole("button",{name:"Show link"}));
    rerender(<InvitationManagementPanel scopeKey="b" adapter={inviteApi([])} />);
    await act(async()=>pending.resolve({success:true,data:{url:"https://example.test/old-tenant-secret"}}));
    await screen.findByText("No invitations found.");expect(screen.queryByDisplayValue("https://example.test/old-tenant-secret")).toBeNull();
  });

  it("confirms revoke and archive separately, leaving completed members alone", async () => {
    const api={...inviteApi([{...invitation,status:"accepted",canResend:false,canCancel:false,canArchive:true}]),archiveInvitation:vi.fn().mockResolvedValue({success:true}),cancelInvitation:vi.fn()};
    render(<InvitationManagementPanel adapter={api} presentation="workspace" />);
    fireEvent.click(await screen.findByRole("button",{name:"Archive",exact:true}));
    expect(screen.getByText(/does not remove the associated member/)).toBeTruthy(); expect(api.archiveInvitation).not.toHaveBeenCalled(); confirm();
    await screen.findByText("Invitation removed.");expect(api.archiveInvitation).toHaveBeenCalledWith(invitation.id);expect(api.cancelInvitation).not.toHaveBeenCalled();
  });

  it("retains default legacy immediate resend but confirms workspace revoke", async () => {
    const api={...inviteApi(),resendInvitation:vi.fn().mockResolvedValue({success:true}),cancelInvitation:vi.fn().mockRejectedValue(new Error("offline"))};
    const {rerender}=render(<InvitationManagementPanel adapter={api} />);
    fireEvent.click(await screen.findByRole("button",{name:"Resend",exact:true}));
    await waitFor(()=>expect(api.resendInvitation).toHaveBeenCalledWith(invitation.id)); await screen.findByText("Invitation resent.");
    rerender(<InvitationManagementPanel adapter={api} presentation="workspace" />);
    fireEvent.click(screen.getByRole("button",{name:"Cancel",exact:true}));expect(api.cancelInvitation).not.toHaveBeenCalled();confirm();
    await screen.findByText("Failed to cancel invitation.");
  });

  it("downloads host template and previews without sending, then explicitly commits exact file/message", async () => {
    const api=importApi();render(<InvitationManagementPanel adapter={api} presentation="workspace" />);
    fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));
    fireEvent.click(screen.getByRole("button",{name:"Download template"}));await waitFor(()=>expect(api.downloadInvitationTemplate).toHaveBeenCalledTimes(1));
    await waitFor(()=>expect((screen.getByRole("button",{name:"Download template"}) as HTMLButtonElement).disabled).toBe(false));
    const selected=chooseFile();fireEvent.change(screen.getByLabelText("Message to all invited users (optional)"),{target:{value:"Welcome"}});
    expect(api.previewInvitationImport).not.toHaveBeenCalled();expect(api.commitInvitationImport).not.toHaveBeenCalled();expect(api.importInvitations).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Preview import"}));await screen.findByText("Imported");
    expect(api.previewInvitationImport).toHaveBeenCalledWith(selected,"Welcome");expect(api.commitInvitationImport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Confirm and send invitations"}));
    await screen.findByText("Import queued: job-1");expect(api.commitInvitationImport).toHaveBeenCalledWith(preview,selected,"Welcome");
    expect(api.importInvitations).not.toHaveBeenCalled();
  });

  it("invalidates preview when file or message changes and disables commit for invalid rows", async () => {
    const api=importApi();render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));chooseFile();
    fireEvent.click(screen.getByRole("button",{name:"Preview import"}));await screen.findByText("Imported");
    fireEvent.change(screen.getByLabelText("Message to all invited users (optional)"),{target:{value:"Changed"}});
    expect(screen.queryByRole("button",{name:"Confirm and send invitations"})).toBeNull();
    api.previewInvitationImport.mockResolvedValue({success:true,data:{...preview,validationSucceeded:false,invalidRowCount:1,invalidRows:[{...preview.previewRows[0],error:"Invalid address"}]}});
    fireEvent.click(screen.getByRole("button",{name:"Preview import"}));await screen.findByText("Invalid address");
    expect((screen.getByRole("button",{name:"Confirm and send invitations"}) as HTMLButtonElement).disabled).toBe(true);
    chooseFile();expect(screen.queryByText("Invalid address")).toBeNull();expect(api.commitInvitationImport).not.toHaveBeenCalled();
  });

  it("prevents duplicate imports and permits legacy combined adapters only on explicit submit", async () => {
    const api=inviteApi([]);const pending=defer<unknown>();api.importInvitations.mockReturnValue(pending.promise);
    render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));const selected=chooseFile();
    expect(api.importInvitations).not.toHaveBeenCalled();const send=screen.getByRole("button",{name:"Import and Send"});fireEvent.click(send);fireEvent.click(send);
    expect(api.importInvitations).toHaveBeenCalledTimes(1);expect(api.importInvitations).toHaveBeenCalledWith(selected,"");
    await act(async()=>pending.resolve({success:true,data:{...preview,queued:true}}));await screen.findByText("1 invitation(s) queued/sent successfully.");
    fireEvent.click(screen.getByRole("button",{name:"Import and Send"}));expect(api.importInvitations).toHaveBeenCalledTimes(1);
  });

  it("does not silently fall back to sending if a two-stage import adapter is incomplete", () => {
    const api={...inviteApi([]),previewInvitationImport:vi.fn()};
    render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));chooseFile();
    expect(screen.getByText("Import requires both preview and commit capabilities.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Import and Send"}));expect(api.importInvitations).not.toHaveBeenCalled();
  });

  it("allows a MyRipple preview adapter to delegate the combined server import only at commit", async () => {
    const legacy=vi.fn().mockResolvedValue({success:true,data:{...preview,queued:true}});
    const api={...importApi(),commitInvitationImport:vi.fn((_preview, file, message)=>legacy(file,message))};
    render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));const selected=chooseFile();
    fireEvent.click(screen.getByRole("button",{name:"Preview import"}));await screen.findByText("Imported");expect(legacy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Confirm and send invitations"}));await waitFor(()=>expect(legacy).toHaveBeenCalledWith(selected,""));
  });

  it("blocks further submission when a broken preview adapter claims it queued work", async () => {
    const api=importApi();api.previewInvitationImport.mockResolvedValue({success:true,data:{...preview,queued:true}});
    render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));chooseFile();
    fireEvent.click(screen.getByRole("button",{name:"Preview import"}));await screen.findByText(/preview adapter returned a queued import/);
    expect((screen.getByRole("button",{name:"Preview import"}) as HTMLButtonElement).disabled).toBe(true);expect(api.commitInvitationImport).not.toHaveBeenCalled();
  });

  it("reports download and import exceptions rather than leaving busy controls", async () => {
    const api=importApi();api.downloadInvitationTemplate.mockRejectedValue(new Error("denied"));api.previewInvitationImport.mockRejectedValue(new Error("offline"));
    render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));
    fireEvent.click(screen.getByRole("button",{name:"Download template"}));await screen.findByText("Unable to download the invitation template.");
    chooseFile();fireEvent.click(screen.getByRole("button",{name:"Preview import"}));await screen.findByText("Import failed.");
    expect((screen.getByRole("button",{name:"Preview import"}) as HTMLButtonElement).disabled).toBe(false);
  });

  it("composes focused forms while keeping hidden list/search state and resetting on tenant change", async () => {
    const members={adapter:memberApi(),roleOptions:roles};const invitations={adapter:inviteApi([])};
    const {rerender}=render(<UserAdministrationPanel scopeKey="a" members={members} invitations={invitations} />);
    await screen.findByText("Alex Example");fireEvent.change(screen.getAllByRole("textbox",{name:"Search"})[0],{target:{value:"Preserved"}});
    fireEvent.click(screen.getByRole("button",{name:"Invite User"}));expect(screen.queryByRole("heading",{name:"Users (1)"})).toBeNull();
    fireEvent.change(screen.getByLabelText("First Name"),{target:{value:"Draft"}});fireEvent.click(screen.getByRole("button",{name:"Cancel",exact:true}));
    expect((screen.getAllByRole("textbox",{name:"Search"})[0] as HTMLInputElement).value).toBe("Preserved");
    fireEvent.click(screen.getByRole("button",{name:"Invite User"}));rerender(<UserAdministrationPanel scopeKey="b" members={members} invitations={invitations} />);
    await screen.findByRole("heading",{name:"Users (1)"});expect(screen.queryByDisplayValue("Draft")).toBeNull();
    expect((screen.getAllByRole("textbox",{name:"Search"})[0] as HTMLInputElement).value).toBe("");
  });
});


describe("MyRipple complete row and import parity", () => {
  it("downloads the template directly from the overview without opening import", async () => {
    const api=importApi();render(<InvitationManagementPanel adapter={api} presentation="workspace" />);
    fireEvent.click(screen.getByRole("button",{name:"Download template"}));
    await waitFor(()=>expect(api.downloadInvitationTemplate).toHaveBeenCalledOnce());expect(api.importInvitations).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Choose File")).toBeNull();
  });
  it("displays eligible legacy links and decline responses inline but never auto-fetches protected links", async () => {
    const api={...inviteApi([invitation,{...invitation,id:"declined",status:"declined",responseMessage:"No thanks, not today."}]),buildInvitationUrl:vi.fn().mockReturnValue("https://example.test/existing-link")};
    const view=render(<InvitationManagementPanel adapter={api} />);
    await screen.findByText("https://example.test/existing-link");await screen.findByText("No thanks, not today.");expect(api.getInvitation).not.toHaveBeenCalled();
    const protectedApi={...api,getInvitationLink:vi.fn()};view.rerender(<InvitationManagementPanel adapter={protectedApi} />);
    expect(screen.queryByText("https://example.test/existing-link")).toBeNull();expect(protectedApi.getInvitationLink).not.toHaveBeenCalled();
  });
  it("shows host unavailable-link guidance without offering Copy", async () => {
    render(<InvitationManagementPanel adapter={inviteApi([{...invitation,canCopyLink:false,linkUnavailableMessage:"Resend to make a new link available."}])} />);
    await screen.findByText("Resend to make a new link available.");expect(screen.queryByRole("button",{name:"Copy Link"})).toBeNull();
  });
  it("preserves separate import names, role, email policy and every invalid-row error", async () => {
    const api=importApi();api.previewInvitationImport.mockResolvedValue({success:true,data:{...preview,validationSucceeded:false,previewRows:[],invalidRowCount:30,
      invalidRows:Array.from({length:30},(_,index)=>({rowNumber:index+2,firstName:"First-"+index,lastName:"Last-"+index,emailAddress:"bad-"+index,role:"admin",roleLabel:"Administrator",allowAnyEmail:index%2===0,error:"Error-"+index}))}});
    render(<InvitationManagementPanel adapter={api} />);fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));chooseFile();fireEvent.click(screen.getByRole("button",{name:"Preview import"}));
    await screen.findByText("Row 31: Error-29");
    for(const label of ["First Name","Last Name","Role","Allow Any Email","Error"])expect(screen.getByRole("columnheader",{name:label,exact:true})).toBeTruthy();
    expect(screen.getByText("First-4")).toBeTruthy();expect(screen.queryByText("First-5")).toBeNull();
    const row=screen.getByText("First-0").closest("tr")!;expect(within(row).getByText("Last-0")).toBeTruthy();expect(within(row).getByText("Administrator")).toBeTruthy();expect(within(row).getByText("Yes")).toBeTruthy();
    expect(api.commitInvitationImport).not.toHaveBeenCalled();
  });
  it("preserves preferred full name and email warning at the email cell, with host icons", async () => {
    const api=memberApi([{...member,fullName:"Alex Preferred Display",emailConfirmed:false}]);
    render(<MemberManagementPanel adapter={api} icons={{edit:<span data-testid="host-edit-icon">decorative</span>,emailUnconfirmed:<span>!</span>}} />);
    await screen.findByText("Alex Preferred Display");
    const warning=screen.getByLabelText("Email requires confirmation");expect(warning.closest("td")?.textContent).toContain(member.email);
    expect(screen.getByRole("button",{name:"Edit",exact:true})).toBeTruthy();expect(screen.getByTestId("host-edit-icon").parentElement?.getAttribute("aria-hidden")).toBe("true");
  });
});


describe("host action icon distinctions", () => {
  it("distinguishes row revoke, form cancellation and invitation sending without changing labels", async () => {
    const api={...inviteApi(),cancelInvitation:vi.fn(),editAndResendInvitation:vi.fn()};
    render(<InvitationManagementPanel adapter={api} presentation="workspace" icons={{cancel:<span data-testid="row-cancel-icon">circle</span>,formCancel:<span data-testid="form-cancel-icon">times</span>,send:<span data-testid="send-icon">plane</span>}} />);
    expect(within(await screen.findByRole("button",{name:"Cancel",exact:true})).getByTestId("row-cancel-icon")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Invite User",exact:true}));
    expect(within(screen.getByRole("button",{name:"Send Invitation",exact:true})).getByTestId("send-icon")).toBeTruthy();
    expect(within(screen.getByRole("button",{name:"Cancel",exact:true})).getByTestId("form-cancel-icon")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Cancel",exact:true}));
    fireEvent.click(screen.getByRole("button",{name:"Resend",exact:true}));
    expect(within(await screen.findByRole("button",{name:"Save and resend",exact:true})).getByTestId("send-icon")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Cancel",exact:true}));
    fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));
    expect(within(screen.getByRole("button",{name:"Import and Send",exact:true})).getByTestId("send-icon")).toBeTruthy();
    expect(within(screen.getByRole("button",{name:"Cancel",exact:true})).getByTestId("form-cancel-icon")).toBeTruthy();
    expect(api.inviteUser).not.toHaveBeenCalled();expect(api.editAndResendInvitation).not.toHaveBeenCalled();expect(api.importInvitations).not.toHaveBeenCalled();
  });
  it("does not use a sending icon for side-effect-free import preview", async () => {
    render(<InvitationManagementPanel adapter={importApi()} icons={{send:<span data-testid="send-icon">plane</span>}} />);
    fireEvent.click(screen.getByRole("button",{name:"Import",exact:true}));
    expect(within(screen.getByRole("button",{name:"Preview import"})).queryByTestId("send-icon")).toBeNull();chooseFile();
    fireEvent.click(screen.getByRole("button",{name:"Preview import"}));
    expect(within(await screen.findByRole("button",{name:"Confirm and send invitations"})).getByTestId("send-icon")).toBeTruthy();
  });
  it("renders host enabled/disabled icons beside accessible access-state text", async () => {
    render(<MemberManagementPanel adapter={memberApi([member,{...member,id:"disabled",accessEnabled:false}])} icons={{enabled:<span data-testid="enabled-icon">check</span>,disabled:<span data-testid="disabled-icon">cross</span>}} />);
    await screen.findByText("Enabled");expect(screen.getByText("Disabled")).toBeTruthy();
    expect(screen.getByTestId("enabled-icon").parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByTestId("disabled-icon").parentElement?.getAttribute("aria-hidden")).toBe("true");
  });
});

it("resets only members when a host changes their filter scope", async () => {
  const api = memberApi(); const invites = inviteApi();
  const view = render(<UserAdministrationPanel scopeKey="tenant" members={{ adapter: api, scopeKey: "web" }} invitations={{ adapter: invites }} />);
  await screen.findByText("alex@example.test");
  await screen.findByText("blair@example.test");
  const calls = invites.getInvitationList.mock.calls.length;
  view.rerender(<UserAdministrationPanel scopeKey="tenant" members={{ adapter: api, scopeKey: "api" }} invitations={{ adapter: invites }} />);
  await waitFor(() => expect(api.getMemberList).toHaveBeenCalledTimes(2));
  expect(api.getMemberList.mock.calls[1][0]).toMatchObject({ page: 1, query: "" });
  expect(invites.getInvitationList).toHaveBeenCalledTimes(calls);
});