import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icons.tsx";

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
}

export function Drawer({ open, onClose, title, subtitle, width = 760, children }: { open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; width?: number; children: React.ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" style={{ width: `min(${width}px, 96vw)` }} role="dialog" aria-label="Document preview">
        <header className="dr-head">
          <div className="grow"><div className="dr-title">{title}</div>{subtitle && <div className="muted small">{subtitle}</div>}</div>
          <button className="btn ghost small" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </header>
        <div className="dr-body">{children}</div>
      </aside>
    </div>, document.body);
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal card" role="dialog">
        <div className="modal-h"><b>{title}</b><button className="btn ghost small" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button></div>
        {children}
      </div>
    </div>, document.body);
}
