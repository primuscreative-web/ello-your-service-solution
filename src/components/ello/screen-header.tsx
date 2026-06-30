import type React from "react";
import { Link } from "@tanstack/react-router";
import { Bell, MapPin, UserRound } from "lucide-react";

export function ClientHomeHeader({
  action,
  location = "São Paulo, SP",
}: {
  action?: React.ReactNode;
  location?: string;
}) {
  return (
    <header className="ello-header-bar">
      <button type="button" className="ello-header-pill btn-tactile">
        <MapPin className="size-3.5 text-primary stroke-[2.5px]" />
        <span>{location}</span>
      </button>
      <div className="flex items-center gap-2">
        {action}
        <Link to="/app/notifications" className="ello-icon-btn btn-tactile" aria-label="Notificações">
          <Bell className="size-4" />
          <span className="ello-icon-btn-badge pulse-active">3</span>
        </Link>
        <Link to="/app/profile" className="ello-icon-btn btn-tactile" aria-label="Perfil">
          <UserRound className="size-4" />
        </Link>
      </div>
    </header>
  );
}
