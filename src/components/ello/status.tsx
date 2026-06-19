import { Star } from "lucide-react";

export function Rating({ value }: { value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
      <Star className="size-3.5 fill-warning text-warning" />
      {value}
    </span>
  );
}

export function Availability({ label = "Disponível hoje" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
      <span className="size-1.5 rounded-full bg-success" />
      {label}
    </span>
  );
}
