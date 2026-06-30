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
    <nav className="ello-nav-dock">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`ello-nav-item btn-tactile ${active ? "ello-nav-item-active" : ""}`}
          >
            <Icon
              className={`size-[1.125rem] transition-transform duration-300 ${
                active ? "stroke-[2.5px]" : "stroke-[2px]"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
