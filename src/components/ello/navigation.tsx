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
    <nav className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-border bg-white px-3 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[0.68rem] font-semibold ${
              active ? "text-primary" : "text-foreground/70"
            }`}
          >
            <Icon className={`size-5 ${active ? "fill-primary/10" : ""}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
