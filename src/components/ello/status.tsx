import { Star } from "lucide-react";
import { TRUST_STYLES, type TrustLevel } from "@/lib/ello-data";

export function Rating({ value }: { value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
      <Star className="size-3.5 fill-[oklch(0.78_0.14_75)] text-[oklch(0.78_0.14_75)]" />
      {value}
    </span>
  );
}

export function Availability({ label = "Disponível hoje" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
      <span className="size-1.5 rounded-full bg-success shadow-[0_0_6px_oklch(0.62_0.18_148_/_0.6)]" />
      {label}
    </span>
  );
}

export function TrustLevelBadge({ level }: { level: TrustLevel }) {
  const style = TRUST_STYLES[level];
  return (
    <span
      className={`ello-trust-badge inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold ${style.bg} ${style.text}`}
    >
      {level}
    </span>
  );
}
