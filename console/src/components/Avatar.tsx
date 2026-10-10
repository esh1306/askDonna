export { DonnaMark, DonnaVoice, Check } from "../Brand.tsx";
export function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const ini = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  return <span className="av" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>{ini}</span>;
}
