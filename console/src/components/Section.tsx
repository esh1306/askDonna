export function Section({ title, count, action, children, className = "" }: { title: React.ReactNode; count?: number; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`block ${className}`}>
      <h3 className="h">{title}{count != null && <span className="c">{count}</span>}{action && <span className="toggle">{action}</span>}</h3>
      {children}
    </section>
  );
}
