import type React from "react";
import { Link } from "@tanstack/react-router";
import { Bell, MapPin, UserRound } from "lucide-react";
import { ElloLogo } from "@/components/ello/logo";

export function ClientHomeHeader({
  action,
  location = "São Paulo, SP",
}: {
  action?: React.ReactNode;
  location?: string;
}) {
  return (
    <header className="ello-header-bar flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/app" aria-label="ELLO">
          <ElloLogo tone="dark" height={22} />
        </Link>
        <button type="button" className="ello-header-pill btn-tactile text-xs">
          <MapPin className="size-3 text-primary stroke-[2.5px]" />
          <span>{location}</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {action}
        <Link
          to="/app/notifications"
          className="ello-icon-btn btn-tactile"
          aria-label="Notificações"
        >
          <Bell className="size-4" />
        </Link>
        <Link to="/app/profile" className="ello-icon-btn btn-tactile" aria-label="Perfil">
          <UserRound className="size-4" />
        </Link>
      </div>
    </header>
  );
}
