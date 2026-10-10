import { useCallback, useRef, useState } from "react";
import { DonnaMark } from "../Brand.tsx";

export type Notify = (lead: string, lesson?: string) => void;

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
export { reduced };

/** Remember what the user last pressed so the "learned" animation can start from it. */
let lastSrc: Element | null = null;
if (typeof window !== "undefined")
  window.addEventListener("pointerdown", (e) => { const t = e.target as Element; lastSrc = t.closest?.("[data-learn-src]") ?? t.closest?.("button") ?? null; }, true);

/** Toast + the "learning moment" animation: the lesson card materialises at the acted-on element and shrinks into the Lessons tab. */
export function useToaster(dest: React.RefObject<HTMLElement | null>, onLearned: () => void) {
  const [toast, setToast] = useState<{ lead: string; lesson?: string; k: number } | null>(null);
  const timer = useRef<number>(0);

  const notify = useCallback<Notify>((lead, lesson) => {
    const fire = () => {
      setToast({ lead, lesson, k: Date.now() });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(null), 6000);
    };
    if (!lesson) return fire();
    const src = lastSrc && document.contains(lastSrc) ? lastSrc.getBoundingClientRect() : null;
    const dst = dest.current?.getBoundingClientRect();
    const land = () => { onLearned(); fire(); };
    if (reduced() || !dst) return land();
    const el = document.createElement("div");
    el.className = "fly";
    el.innerHTML = `<div class="fly-h"><svg width="16" height="16" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#a3265f"/><path d="M10.5 8.5h5a7.5 7.5 0 0 1 0 15h-5z" fill="none" stroke="#fff" stroke-width="2.8" stroke-linejoin="round"/><circle cx="16" cy="16" r="2.1" fill="#fff"/></svg><b>New lesson</b></div><p></p>`;
    el.querySelector("p")!.textContent = lesson;
    document.body.appendChild(el);
    const w = 300, h = el.offsetHeight || 84;
    const sx = (src ? src.left + src.width / 2 : window.innerWidth / 2) - w / 2;
    const sy = (src ? src.top + Math.min(src.height / 2, 60) : window.innerHeight / 2) - h / 2;
    const tx = dst.left + dst.width / 2 - w / 2;
    const ty = dst.top + dst.height / 2 - h / 2;
    const clampX = Math.max(12, Math.min(window.innerWidth - w - 12, sx));
    const clampY = Math.max(12, Math.min(window.innerHeight - h - 12, sy));
    el.style.left = "0"; el.style.top = "0";
    const at = (x: number, y: number, s: number, o: number) => ({ transform: `translate(${x}px,${y}px) scale(${s})`, opacity: o });
    const anim = el.animate([
      at(clampX, clampY + 14, 0.82, 0),
      { ...at(clampX, clampY, 1, 1), offset: 0.28 },
      { ...at(clampX, clampY - 6, 1.02, 1), offset: 0.62 },
      { ...at(tx, ty, 0.12, 0.2) },
    ], { duration: 1900, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" });
    anim.onfinish = () => { el.remove(); land(); };
  }, [dest, onLearned]);

  const node = toast ? (
    <div className="toast" key={toast.k} role="status">
      <DonnaMark size={22} />
      <div>{toast.lesson ? <>Donna learned: <b>{toast.lesson}</b></> : toast.lead}</div>
    </div>
  ) : null;
  return { notify, node };
}
