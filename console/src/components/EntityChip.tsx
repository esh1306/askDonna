import { Icon } from "./Icons.tsx";
import { Avatar } from "./Avatar.tsx";
import { Popover } from "./Popover.tsx";

export type EntityKind = "file" | "person" | "ticket" | "money" | "ref";
export type PersonCard = { name: string; role?: string; company?: string | null; email?: string | null; phone?: string | null; facts?: { key: string; value: string }[] };

/** Inline pill for something that is more than text: a document, a person, a case, an amount or a reference code. */
export function EntityChip({ kind, label, onClick, title, icon, person }: {
  kind: EntityKind; label: string; onClick?: () => void; title?: string; icon?: string; person?: PersonCard | null;
}) {
  if (kind === "money") return <span className="ent money" title={title}>{label}</span>;
  const body = (
    <>
      {kind === "person" ? <Avatar name={label} size={16} /> : icon === "none" ? null : <Icon name={icon ?? (kind === "ticket" ? "ticket" : "file")} size={13} />}
      <span className="ent-l">{label}</span>
    </>
  );
  if (kind === "person")
    return (
      <Popover width={280} trigger={({ toggle }) => <button type="button" className="ent person" onClick={toggle}>{body}</button>}>
        {() => (
          <div className="person-pop">
            <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}><Avatar name={label} size={34} /><div><b>{person?.name ?? label}</b><div className="muted small">{[person?.role, person?.company].filter(Boolean).join(" · ") || "Not on record for this case"}</div></div></div>
            {(person?.email || person?.phone) && <div className="small" style={{ marginTop: 8 }}>{[person.email, person.phone].filter(Boolean).join(" · ")}</div>}
            {person?.facts && person.facts.length > 0 && (
              <dl className="facts">{person.facts.slice(0, 4).map((f, i) => <span key={i} style={{ display: "contents" }}><dt>{f.key.replace(/_/g, " ")}</dt><dd>{f.value}</dd></span>)}</dl>
            )}
          </div>
        )}
      </Popover>
    );
  const cls = `ent ${kind} ${onClick ? "click" : ""}`;
  return onClick
    ? <button type="button" className={cls} onClick={onClick} title={title}>{body}</button>
    : <span className={cls} title={title}>{body}</span>;
}
