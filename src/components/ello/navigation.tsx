import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Heart,
  Home,
  Menu,
  MessageSquare,
  ReceiptText,
  Search,
  Users,
  UserRound,
} from "lucide-react";
import { getBottomNavigation, type AppMode } from "@/lib/ello-navigation";

const ICONS = {
  calendar: CalendarDays,
  heart: Heart,
  home: Home,
  menu: Menu,
  message: MessageSquare,
  receipt: ReceiptText,
  search: Search,
  user: UserRound,
  users: Users,
} as const;

export function BottomNavigation({ mode }: { mode: AppMode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const items = getBottomNavigation(mode);

  return (
    <nav className="absolute bottom-5 left-4 right-4 z-40 flex items-center justify-around rounded-[24px] border border-white/40 bg-white/70 px-2 py-2 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`btn-tactile flex flex-col items-center gap-1.5 rounded-[18px] px-3.5 py-2 text-[0.65rem] font-extrabold tracking-tight transition-all duration-300 ${
              active
                ? "bg-primary/10 text-primary scale-105"
                : "text-foreground/60 hover:bg-slate-50/40 hover:text-foreground/85"
            }`}
          >
            <Icon className={`size-4.5 transition-transform duration-300 ${active ? "stroke-[2.5px] fill-primary/10" : "stroke-[2px]"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
