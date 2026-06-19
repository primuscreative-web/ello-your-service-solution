import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type React from "react";
import type { Professional } from "@/lib/ello-data";
import { AVAILABILITY_LABEL } from "@/lib/ello-data";
import { AvatarPhoto } from "./media";
import { Availability, Rating } from "./status";

export function ProfessionalMiniCard({ professional }: { professional: Professional }) {
  return (
    <Link
      to="/app/professional/$id"
      params={{ id: professional.id }}
      className="w-[7.4rem] shrink-0 rounded-2xl bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
    >
      <AvatarPhoto imageUrl={professional.avatarUrl} initials={professional.initials} size={60} />
      <h3 className="mt-3 line-clamp-2 text-sm font-black leading-tight text-foreground">
        {professional.name}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-muted-foreground">
        {professional.profession}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Rating value={professional.rating} />
      </div>
      <div className="mt-1">
        <Availability label={AVAILABILITY_LABEL[professional.available]} />
      </div>
    </Link>
  );
}

export function ServiceCategoryCard({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-border bg-white text-primary shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
        {icon}
      </span>
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </Link>
  );
}

export function ListRow({ children, to }: { children: React.ReactNode; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-2xl border border-border bg-white p-4"
    >
      {children}
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}
