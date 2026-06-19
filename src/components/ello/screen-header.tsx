import type React from "react";
import { Bell, MapPin, UserRound } from "lucide-react";

export function ClientHomeHeader({
  action,
  location = "São Paulo, SP",
}: {
  action?: React.ReactNode;
  location?: string;
}) {
  return (
    <header className="flex items-center justify-between px-5 pb-4 pt-[calc(1.1rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
        <MapPin className="size-5 text-foreground" />
        <span>{location}</span>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <button className="relative grid size-9 place-items-center rounded-full bg-white text-foreground">
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-destructive text-[0.55rem] font-black text-white">
            3
          </span>
        </button>
        <button className="grid size-9 place-items-center rounded-full border border-border bg-white text-foreground">
          <UserRound className="size-5" />
        </button>
      </div>
    </header>
  );
}
