export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`card ${className}`}>{children}</div>;
}
