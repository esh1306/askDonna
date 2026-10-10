import { DonnaMark } from "../Brand.tsx";
export function EmptyState({ title, hint, card }: { title: string; hint?: React.ReactNode; card?: boolean }) {
  return (
    <div className={`empty big ${card ? "card" : ""}`}>
      <DonnaMark size={36} />
      <div className="eh">{title}</div>
      {hint && <div className="small">{hint}</div>}
    </div>
  );
}
