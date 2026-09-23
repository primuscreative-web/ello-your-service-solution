import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Heart,
  Home,
  LifeBuoy,
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
  message: MessageSquare,
  menu: Menu,
  receipt: ReceiptText,
  search: Search,
  user: UserRound,
  users: Users,
} as const;

export function ElloAppShell({
  children,
  footer,
  dark = false,
  mode = "client",
  userLabel,
}: {
  children: ReactNode;
  footer?: ReactNode;
  statusBarClassName?: string;
  dark?: boolean;
  mode?: AppMode;
  userLabel?: string;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const items = getBottomNavigation(mode);
  const initials = userLabel?.trim().slice(0, 1).toUpperCase() || "E";

  return (
    <div
      className={`desktop-mockup-bg ${footer ? "ello-app-shell" : "ello-app-shell ello-app-shell-immersive"}`}
    >
      {footer ? (
        <aside className="ello-desktop-sidebar">
          <Link to="/app" className="ello-sidebar-brand" aria-label="ELLO, ir ao início">
            <span className="ello-sidebar-brand-mark">E</span>
            <span className="ello-sidebar-brand-word">ELLO</span>
          </Link>
          <div className="ello-sidebar-caption">SEU ESPAÇO</div>
          <nav className="ello-sidebar-nav" aria-label="Navegação principal">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              const active =
                item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`ello-sidebar-link ${active ? "ello-sidebar-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ello-sidebar-bottom">
            <Link to="/app/settings" className="ello-sidebar-link">
              <LifeBuoy size={18} strokeWidth={1.8} />
              <span>Ajuda e configurações</span>
            </Link>
            <Link to="/app/profile" className="ello-sidebar-account">
              <span className="ello-sidebar-avatar">{initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">
                  {userLabel || "Minha conta"}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {mode === "professional" ? "Conta profissional" : "Conta cliente"}
                </span>
              </span>
            </Link>
          </div>
        </aside>
      ) : null}
      <div className={`phone-chassis ${dark ? "ello-app-dark" : ""}`}>
        <div className="phone-screen relative isolate overflow-hidden">
          <div className="phone-screen-content-scroll">
            <div className="ello-app-content">{children}</div>
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
