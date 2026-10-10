const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const paths: Record<string, React.ReactNode> = {
  note: <><path d="M4 3.5h8l3 3V16.5H4z" {...P} /><path d="M7 9h5M7 12h5" {...P} /></>,
  user: <><circle cx="10" cy="7" r="3" {...P} /><path d="M4 16.5c.7-3 3-4.5 6-4.5s5.3 1.5 6 4.5" {...P} /></>,
  mail: <><rect x="3" y="5" width="14" height="10.5" rx="2" {...P} /><path d="M3.5 6l6.5 5 6.5-5" {...P} /></>,
  stage: <><path d="M4 10h11M11 6l4 4-4 4" {...P} /></>,
  file: <><path d="M5 2.8h6l4 4v10.4H5z" {...P} /><path d="M11 3v4h4" {...P} /></>,
  image: <><rect x="3" y="4" width="14" height="12" rx="2" {...P} /><circle cx="7.5" cy="8.5" r="1.4" {...P} /><path d="M4 15l4.5-4 3 2.5 2.5-2L17 14" {...P} /></>,
  ticket: <><path d="M3.5 7a1.5 1.5 0 0 0 0 3v2.5h13V10a1.5 1.5 0 0 1 0-3V4.5h-13z" {...P} /></>,
  phone: <><path d="M5 3h3l1.4 3.6-1.8 1.2a9 9 0 0 0 4.6 4.6l1.2-1.8L17 12v3a2 2 0 0 1-2 2A12 12 0 0 1 3 5a2 2 0 0 1 2-2z" {...P} /></>,
  check: <path d="M5 10.5l3.3 3.3L15 7" {...P} />,
  x: <path d="M5 5l10 10M15 5L5 15" {...P} />,
  open: <><path d="M8 4H4.5v11.5H16V12M11 4h5v5M16 4l-7 7" {...P} /></>,
};
export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <svg className="ico" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">{paths[name] ?? null}</svg>;
}
export function Chev({ open }: { open: boolean }) {
  return <svg className={`chev ${open ? "open" : ""}`} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5L7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
