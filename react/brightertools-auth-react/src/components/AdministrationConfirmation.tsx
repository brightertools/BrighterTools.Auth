import { useEffect, useId, useRef } from "react";

export function AdministrationConfirmation({ message, confirmLabel, cancelLabel, busy, onConfirm, onCancel }: {
  message: string; confirmLabel: string; cancelLabel: string; busy: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const id = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="alert alert-warning" role="alertdialog" aria-labelledby={id}
    onKeyDown={event => { if (event.key === "Escape" && !busy) onCancel(); }}>
    <p id={id}>{message}</p>
    <div className="d-flex gap-2 flex-wrap">
      <button type="button" className="btn btn-danger" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
      <button ref={cancel} type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
    </div>
  </div>;
}
