import { label } from "../api.ts";
export function Stepper({ steps, current, extra }: { steps: readonly string[]; current: string; extra?: string }) {
  const idx = steps.indexOf(current);
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s} className={i === idx ? "now" : i < idx ? "past" : ""}><i /><span>{label(s)}</span></li>
      ))}
      {extra && <li className="now"><i /><span>{label(extra)}</span></li>}
    </ol>
  );
}
