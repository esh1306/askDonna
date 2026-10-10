export function DonnaMark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`dmark ${className}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M10.5 8.5h5a7.5 7.5 0 0 1 0 15h-5z" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinejoin="round" />
      <circle className="dmark-dot" cx="16" cy="16" r="2.1" fill="#fff" />
    </svg>
  );
}

/** Donna speaking: mark + name. Use everywhere Donna is the author. */
export function DonnaVoice({ children, size = 18 }: { children?: React.ReactNode; size?: number }) {
  return (
    <span className="voice"><DonnaMark size={size} /><b>Donna</b>{children}</span>
  );
}

export function Check({ size = 16 }: { size?: number }) {
  return (
    <svg className="check" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--good)" />
      <path d="M5.8 10.4l2.9 2.9 5.5-5.9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
