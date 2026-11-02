import { useState } from "react";
import { createRoot } from "react-dom/client";
import { UserAdministrationPanel } from "../src/components/UserAdministrationPanel";
import type { MemberListItem } from "../src/types/members";
import type { InvitationListItem } from "../src/types/invitations";
import "host-bootstrap";
import "../styles/invitations.css";
const users:MemberListItem[]=[{id:"owner",firstName:"Robin",lastName:"Owner",email:"robin@example.test",role:"admin",roleLabel:"Administrator",accessEnabled:true,isOwner:true,isSelf:true},
  {id:"member",firstName:"Alex",lastName:"Example",email:"alex@example.test",role:"member",roleLabel:"Member",accessEnabled:true,active:true,canEdit:true,canRemove:true,canTransferOwnership:true,lastLoginDate:"2026-10-18T10:30:00Z"}];
const invites:InvitationListItem[]=[{id:"pending",firstName:"Blair",lastName:"Invitee",email:"blair@example.test",role:"member",roleLabel:"Member",message:"Welcome to the workspace",status:"pending",canChangeEmailAddress:true,canCopyLink:true,canResend:true,canCancel:true,expiryDate:"2099-10-22T10:00:00Z"},
{id:"accepted",firstName:"Casey",lastName:"Joined",email:"old@example.test",acceptedEmailAddress:"casey@example.test",acceptedLoginProvider:"4",role:"member",roleLabel:"Member",status:"accepted",canArchive:true,responseMessage:""}];
const members={getMemberList:async()=>({success:true,data:{items:users,totalCount:users.length}}),getMember:async(id:string)=>({success:true,data:users.find(x=>x.id===id)!}),updateMember:async()=>({success:true}),removeMember:async()=>({success:true})};
const preview={validationSucceeded:true,queued:false,validRowCount:1,invalidRowCount:0,previewRows:[{rowNumber:2,firstName:"Imported",lastName:"Person",emailAddress:"import@example.test"}],invalidRows:[]};
const invitationAdapter={getInvitationList:async()=>({success:true,data:{items:invites,totalCount:invites.length}}),getInvitation:async(id:string)=>({success:true,data:invites.find(x=>x.id===id)!}),inviteUser:async()=>({success:true}),importInvitations:async()=>({success:true,data:{...preview,queued:true}}),
editAndResendInvitation:async()=>({success:true}),cancelInvitation:async()=>({success:true}),archiveInvitation:async()=>({success:true}),getInvitationLink:async()=>({success:true,data:{url:"https://example.test/invitation/fixture-only"}}),previewInvitationImport:async()=>({success:true,data:preview}),commitInvitationImport:async()=>({success:true,data:{...preview,queued:true,jobId:"fixture-job"}}),downloadInvitationTemplate:async()=>{}};
const roles=[{value:"member",label:"Member",description:"Collaborate in this workspace."},{value:"admin",label:"Administrator",description:"Manage members and invitations."}];
function Preview(){const[dark,setDark]=useState(false);const[narrow,setNarrow]=useState(false);return <main data-bs-theme={dark?"dark":"light"} className="bg-body text-body min-vh-100 p-3">
<div className="container mb-3 d-flex gap-2 flex-wrap"><button className="btn btn-outline-secondary" onClick={()=>setDark(!dark)}>Toggle theme</button><button className="btn btn-outline-secondary" onClick={()=>setNarrow(!narrow)}>Toggle narrow layout</button><span className="align-self-center">Mock adapters only. No emails or live changes.</span></div>
<div className="mx-auto" style={{maxWidth:narrow?375:1120}}><UserAdministrationPanel scopeKey="fixture" members={{adapter:members,roleOptions:roles,sectionLabel:"Workspace access",onTransferOwnership:()=>window.alert("Host-owned protected ownership flow"),helpContent:<p>Access applies to this workspace only.</p>}}
invitations={{adapter:invitationAdapter,roleOptions:roles,defaultRole:"member",defaultCanChangeEmailAddress:false,sectionLabel:"Workspace invitations",expiryHelpContent:<p>New invitations expire after the host-configured period.</p>}} /></div></main>};
createRoot(document.getElementById("root")!).render(<Preview/>);
