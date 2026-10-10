import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Small floating panel anchored to its trigger. Portalled, so it is never clipped by overflow. */
export function Popover({ trigger, children, width = 320, align = "start" }: {
  trigger: (o: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  width?: number; align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open || !anchor.current) return;
    const place = () => {
      const r = anchor.current!.getBoundingClientRect();
      const h = panel.current?.offsetHeight ?? 200;
      let left = align === "end" ? r.right - width : r.left;
      left = Math.max(12, Math.min(window.innerWidth - width - 12, left));
      const up = r.bottom + h + 16 > window.innerHeight && r.top > h + 16;
      setPos({ left, top: up ? r.top - 8 - h : r.bottom + 8, up });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, width, align]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      close();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down, true); document.removeEventListener("keydown", key); };
  }, [open]);

  return (
    <>
      <span ref={anchor} className="pop-anchor">{trigger({ open, toggle: () => setOpen((o) => !o) })}</span>
      {open && createPortal(
        <div ref={panel} className="popover" style={{ left: pos?.left ?? -999, top: pos?.top ?? -999, width }} role="dialog">
          {children(close)}
        </div>, document.body)}
    </>
  );
}
