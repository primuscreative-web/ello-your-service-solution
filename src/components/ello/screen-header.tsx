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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100/60 bg-white/70 px-5 py-3.5 backdrop-blur-md">
      <button className="btn-tactile flex items-center gap-1.5 rounded-full border border-slate-100/80 bg-slate-50/70 px-3.5 py-1.5 text-xs font-black text-foreground/80 hover:bg-slate-100/80 transition-colors">
        <MapPin className="size-3.5 text-primary stroke-[2.5px]" />
        <span>{location}</span>
      </button>
      <div className="flex items-center gap-2.5">
        {action}
        <button className="btn-tactile relative grid size-10 place-items-center rounded-full border border-slate-100/80 bg-slate-50/70 text-foreground/85 hover:bg-slate-100 hover:text-foreground transition-all duration-300">
          <Bell className="size-4.5" />
          <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-destructive text-[0.55rem] font-black text-white ring-2 ring-white pulse-active">
            3
          </span>
        </button>
        <button className="btn-tactile grid size-10 place-items-center rounded-full border border-slate-100/80 bg-slate-50/70 text-foreground/85 hover:bg-slate-100 hover:text-foreground transition-all duration-300">
          <UserRound className="size-4.5" />
        </button>
      </div>
    </header>
  );
}
