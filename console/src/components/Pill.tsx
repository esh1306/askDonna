export type Tone = "neutral" | "good" | "warn" | "bad" | "accent";
const cls: Record<Tone, string> = { neutral: "", good: "pass", warn: "partial", bad: "fail", accent: "ran" };
export function Pill({ tone = "neutral", children, title }: { tone?: Tone; children: React.ReactNode; title?: string }) {
  return <span className={`badge ${cls[tone]}`} title={title}>{children}</span>;
}
export const Badge = Pill;
