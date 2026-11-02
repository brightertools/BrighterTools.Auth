import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatAuthText } from "../authUi";
import type { InvitationOperationResult, InvitationRoleOption } from "../types/invitations";
import { defaultMemberManagementText } from "../types/members";
import type { MemberListItem, MemberManagementTextOverrides, MemberManagementView, MemberServiceAdapter } from "../types/members";
import { AdministrationConfirmation } from "./AdministrationConfirmation";

export type MemberManagementAction = "edit" | "remove" | "transferOwnership" | "save" | "cancel" | "protected" | "emailUnconfirmed" | "enabled" | "disabled";

export interface MemberManagementPanelProps {
  icons?: Partial<Record<MemberManagementAction, ReactNode>>;
  adapter: MemberServiceAdapter;
  scopeKey?: string;
  roleOptions?: InvitationRoleOption[];
  textOverrides?: MemberManagementTextOverrides;
  className?: string;
  sectionLabel?: ReactNode;
  helpContent?: ReactNode;
  toolbarContent?: ReactNode;
  pageSizeOptions?: number[];
  view?: MemberManagementView;
  onViewChange?: (view: MemberManagementView) => void;
  onTransferOwnership?: (member: MemberListItem) => void | Promise<void>;
  renderMemberActions?: (member: MemberListItem, refresh: () => Promise<void>) => ReactNode;
}

export function MemberManagementPanel(props: MemberManagementPanelProps) {
  return <MemberManagementContent key={props.scopeKey} {...props} />;
}

function MemberManagementContent({ icons, adapter, roleOptions = [], textOverrides, className, sectionLabel,
  helpContent, toolbarContent, pageSizeOptions = [10, 25, 50, 100], view, onViewChange,
  onTransferOwnership, renderMemberActions }: MemberManagementPanelProps) {
  const text = { ...defaultMemberManagementText, ...textOverrides };
  const icon = (action: MemberManagementAction) => icons?.[action] ? <span aria-hidden="true" className="me-1">{icons[action]}</span> : null;
  const [items, setItems] = useState<MemberListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[1] ?? pageSizeOptions[0] ?? 25);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [selected, setSelected] = useState<MemberListItem | null>(null);
  const [removing, setRemoving] = useState<MemberListItem | null>(null);
  const [role, setRole] = useState("");
  const [access, setAccess] = useState(false);
  const [active, setActive] = useState<boolean | undefined>();
  const alive = useRef(true);
  const locked = useRef(false);
  const sequence = useRef(0);
  const detailSequence = useRef(0);
  const roleInput = useRef<HTMLSelectElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const id = useId();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canEdit = (item: MemberListItem) => !!adapter.updateMember && !!item.canEdit && !item.isOwner && !item.isSelf;
  const canRemove = (item: MemberListItem) => !!adapter.removeMember && !!item.canRemove && !item.isOwner && !item.isSelf;
  const error = (result: InvitationOperationResult<unknown> | undefined, fallback: string) =>
    setFeedback({ error: true, message: result?.messages?.filter(Boolean).join(" ") || result?.message || fallback });

  useEffect(() => { alive.current = true; return () => { alive.current = false; sequence.current++; detailSequence.current++; }; }, []);
  useEffect(() => { if (selected) { if (roleInput.current && !roleInput.current.disabled) roleInput.current.focus(); else editor.current?.focus(); } }, [selected]);
  const load = async (nextPage = page, size = pageSize, search = query) => {
    const request = ++sequence.current;
    setLoading(true);
    try {
      const result = await adapter.getMemberList({ query: search, page: nextPage, pageSize: size, sortBy: "LastLoginDate", sortDescending: true });
      if (!alive.current || request !== sequence.current) return;
      if (!result.success || !result.data) { error(result, text.loadFailedMessage); return; }
      setItems(result.data.items); setTotalCount(result.data.totalCount); setPage(nextPage); setPageSize(size);
    } catch { if (alive.current && request === sequence.current) error(undefined, text.loadFailedMessage); }
    finally { if (alive.current && request === sequence.current) setLoading(false); }
  };
  useEffect(() => { void load(1, pageSize, ""); }, []);
  const open = async (item: MemberListItem | string, notify = true) => {
    if (locked.current) return;
    const request = ++detailSequence.current;
    setSelected(null); setFeedback(null);
    try {
      const result = adapter.getMember ? await adapter.getMember(typeof item === "string" ? item : item.id)
        : { success: typeof item !== "string", data: typeof item === "string" ? undefined : item };
      if (!alive.current || request !== detailSequence.current) return;
      if (!result.success || !result.data || !canEdit(result.data)) { error(result, text.loadFailedMessage); return; }
      setSelected(result.data); setRole(result.data.role); setAccess(result.data.accessEnabled); setActive(result.data.active);
      if (notify) onViewChange?.({ mode: "edit", memberId: result.data.id });
    } catch { if (alive.current && request === detailSequence.current) error(undefined, text.loadFailedMessage); }
  };
  const close = (notify = true) => {
    detailSequence.current++; setSelected(null); setRemoving(null);
    if (notify) onViewChange?.({ mode: "list" });
    heading.current?.focus();
  };
  const externalId = view?.mode === "edit" ? view.memberId : undefined;
  useEffect(() => {
    if (view?.mode === "list") close(false);
    else if (externalId && selected?.id !== externalId) void open(externalId, false);
  }, [view?.mode, externalId]);

  const operate = async (operation: () => Promise<InvitationOperationResult<void>>, success: string, failure: string) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setFeedback(null);
    try {
      const result = await operation();
      if (!alive.current) return;
      if (!result.success) { error(result, failure); return; }
      close(); setFeedback({ error: false, message: result.message || success }); await load();
    } catch { if (alive.current) error(undefined, failure); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const transfer = async (item: MemberListItem) => {
    if (locked.current || !item.canTransferOwnership || !onTransferOwnership) return;
    locked.current = true; setBusy(true); setFeedback(null);
    try { await onTransferOwnership(item); }
    catch { if (alive.current) error(undefined, text.actionFailedMessage); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  return <section className={["card bt-member-management", className].filter(Boolean).join(" ")} data-view={selected ? "edit" : "list"}>
    <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>{sectionLabel && <div className="small text-body-secondary">{sectionLabel}</div>}
        <h2 ref={heading} tabIndex={-1} className="h5 mb-0">{selected ? text.editHeading : <>{text.title} ({totalCount})</>}</h2>
      </div>{!selected && toolbarContent}
    </div>
    <div className="card-body">
      {feedback && <div role="alert" className={feedback.error ? "alert alert-danger" : "alert alert-success"}>{feedback.message}</div>}
      {removing && <AdministrationConfirmation message={formatAuthText(text.removeConfirmation, { name: removing.fullName || removing.firstName + " " + removing.lastName })}
        confirmLabel={text.confirmLabel} cancelLabel={text.cancelLabel} busy={busy} onCancel={() => setRemoving(null)}
        onConfirm={() => { if (canRemove(removing)) void operate(() => adapter.removeMember!(removing.id), text.removedMessage, text.removeFailedMessage); }} />}
      {selected ? <div ref={editor} tabIndex={-1}>
        <p>{text.identityHelp}</p><dl className="row"><dt className="col-sm-3">{text.nameLabel}</dt><dd className="col-sm-9">{selected.fullName || selected.firstName + " " + selected.lastName}</dd>
          <dt className="col-sm-3">{text.emailLabel}</dt><dd className="col-sm-9 text-break">{selected.email}</dd></dl>
        {helpContent}
        <form onSubmit={event => { event.preventDefault(); if (canEdit(selected) && (role === selected.role || !roleOptions.length || roleOptions.some(option => option.value === role)))
          void operate(() => adapter.updateMember!(selected.id, { role, accessEnabled: access, ...(active === undefined ? {} : { active }) }), text.updatedMessage, text.updateFailedMessage); }}>
          <fieldset disabled={busy || !!removing}>
            <div className="mb-3"><label className="form-label" htmlFor={id + "role"}>{text.roleLabel}</label>
              <select ref={roleInput} id={id + "role"} className="form-select" value={role} disabled={selected.canChangeRole === false || roleOptions.length === 0} onChange={event => setRole(event.target.value)}>
                {!roleOptions.some(option => option.value === role) && <option value={role}>{selected.roleLabel || role}</option>}
                {roleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>{roleOptions.find(option => option.value === role)?.description && <p className="form-text">{roleOptions.find(option => option.value === role)?.description}</p>}
            </div>
            <div className="form-check mb-3"><input id={id + "access"} type="checkbox" className="form-check-input" checked={access}
              disabled={selected.canChangeAccess === false} onChange={event => setAccess(event.target.checked)} />
              <label className="form-check-label" htmlFor={id + "access"}>{text.accessLabel}</label></div>
            {selected.accessHelp && <p className="form-text">{selected.accessHelp}</p>}
            {active !== undefined && <div className="form-check mb-3"><input id={id + "active"} type="checkbox" className="form-check-input" checked={active}
              disabled={selected.canChangeActive === false} onChange={event => setActive(event.target.checked)} />
              <label className="form-check-label" htmlFor={id + "active"}>{text.activeLabel}</label></div>}
            <div className="d-flex gap-2 flex-wrap"><button type="submit" className="btn btn-primary" aria-busy={busy}>{icon("save")}{text.saveLabel}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => close()}>{icon("cancel")}{text.cancelLabel}</button></div>
          </fieldset>
        </form>
      </div> : <>
        <form className="d-flex gap-2 mb-3 flex-wrap" onSubmit={event => { event.preventDefault(); setFeedback(null); void load(1); }}>
          <input className="form-control w-auto" aria-label={text.searchLabel} placeholder={text.searchPlaceholder} value={query} onChange={event => setQuery(event.target.value)} />
          <button className="btn btn-outline-primary" disabled={loading || busy}>{text.searchLabel}</button>
          <button type="button" className="btn btn-outline-secondary" disabled={loading || busy} onClick={() => { setQuery(""); setFeedback(null); void load(1, pageSize, ""); }}>{text.clearLabel}</button>
          <select className="form-select w-auto" aria-label={text.pageSizeLabel} value={pageSize} disabled={loading || busy} onChange={event => void load(1, Number(event.target.value))}>
            {pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </form>
        <div className="table-responsive" role="region" aria-label={text.title} tabIndex={0}><table className="table align-middle"><thead><tr>
          {[text.nameLabel, text.emailLabel, text.lastLoginLabel, text.roleLabel, text.accessLabel, text.actionsLabel].map((label, index) => <th key={index} scope="col">{label}</th>)}
        </tr></thead><tbody>
          {loading ? <tr><td colSpan={6} role="status">{text.loadingMessage}</td></tr> : !items.length ? <tr><td colSpan={6}>{text.emptyMessage}</td></tr> : items.map(item => <tr key={item.id}>
            <td>{item.fullName || item.firstName + " " + item.lastName}</td><td className="text-break" style={{minWidth:"12rem"}}>{item.email} {item.emailConfirmed === false && <span className="badge text-bg-warning" aria-label={text.emailUnconfirmedLabel}>{icon("emailUnconfirmed")}{text.emailUnconfirmedLabel}</span>}</td>
            <td>{item.lastLoginDate && !Number.isNaN(Date.parse(item.lastLoginDate)) ? new Date(item.lastLoginDate).toLocaleString() : text.unknownLoginLabel}</td>
            <td>{item.roleLabel || item.role} {item.isOwner && <span className="badge text-bg-primary">{text.ownerLabel}</span>}</td>
            <td>{icon(item.accessEnabled ? "enabled" : "disabled")}{item.accessEnabled ? text.enabledLabel : text.disabledLabel}</td>
            <td><div className="d-flex gap-2 flex-wrap">
              {(item.isOwner || item.isSelf) && <span className="small text-body-secondary" title={item.isSelf ? text.protectedSelfMessage : text.protectedOwnerMessage}>{icon("protected")}{item.isSelf ? text.protectedSelfMessage : text.protectedOwnerMessage}</span>}
              {canEdit(item) && <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy || !!removing} onClick={() => void open(item)}>{icon("edit")}{text.editLabel}</button>}
              {canRemove(item) && <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy || !!removing} onClick={() => setRemoving(item)}>{icon("remove")}{text.removeLabel}</button>}
              {item.canTransferOwnership && onTransferOwnership && <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy || !!removing} onClick={() => void transfer(item)}>{icon("transferOwnership")}{text.transferOwnershipLabel}</button>}
              {renderMemberActions?.(item, () => load())}
            </div></td>
          </tr>)}
        </tbody></table></div>
        <div className="d-flex justify-content-between gap-2 flex-wrap"><span>{formatAuthText(text.pageSummary, {page, totalPages, totalCount})}</span>
          <div className="btn-group"><button className="btn btn-outline-secondary" disabled={loading || busy || page <= 1} onClick={() => void load(page - 1)}>{text.previousLabel}</button>
            <button className="btn btn-outline-secondary" disabled={loading || busy || page >= totalPages} onClick={() => void load(page + 1)}>{text.nextLabel}</button></div>
        </div>
      </>}
    </div>
  </section>;
}
