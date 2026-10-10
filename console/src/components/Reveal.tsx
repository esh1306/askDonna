export function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return <div className={`reveal ${open ? "open" : ""}`}><div><div className="reveal-in">{children}</div></div></div>;
}
