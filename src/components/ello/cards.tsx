import { Link } from "@tanstack/react-router";
import { ChevronRight, Heart } from "lucide-react";
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
      className="btn-tactile premium-card flex w-[8.5rem] shrink-0 flex-col items-center rounded-[1.5rem] p-3.5 text-center transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative">
        <AvatarPhoto imageUrl={professional.avatarUrl} initials={professional.initials} size={64} />
        {professional.available === "yes" && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>
      <h3 className="mt-3 line-clamp-1 text-xs font-black tracking-tight text-foreground">
        {professional.name}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-muted-foreground">
        {professional.profession}
      </p>
      <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-full bg-slate-50/90 px-2 py-0.5">
        <Rating value={professional.rating} />
      </div>
    </Link>
  );
}

export function ProfessionalListRow({
  favorite = false,
  favoriteDisabled = false,
  onFavorite,
  professional,
}: {
  favorite?: boolean;
  favoriteDisabled?: boolean;
  onFavorite?: () => void;
  professional: Professional;
}) {
  return (
    <div className="group -mx-3 flex items-center gap-4 rounded-[24px] border border-transparent p-3 transition-all duration-300 hover:border-white/80 hover:bg-white/80 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)]">
      <div className="relative shrink-0">
        <AvatarPhoto imageUrl={professional.avatarUrl} initials={professional.initials} size={58} />
        {professional.available === "yes" && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
        )}
      </div>
      <Link to="/app/professional/$id" params={{ id: professional.id }} className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">{professional.name}</h3>
        <p className="truncate text-xs font-medium text-muted-foreground">{professional.profession}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Rating value={professional.rating} />
          <span className="text-[10px] font-semibold text-muted-foreground">
            • {professional.completedJobs} jobs
          </span>
        </div>
      </Link>
      {onFavorite ? (
        <button
          type="button"
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          disabled={favoriteDisabled}
          onClick={onFavorite}
          className="btn-tactile grid size-9 place-items-center rounded-full bg-slate-50/60 hover:bg-slate-100/80 transition-colors disabled:opacity-40"
        >
          <Heart
            className={`size-4.5 transition-all duration-350 ${favorite ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          />
        </button>
      ) : null}
      <ChevronRight className="size-5 shrink-0 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
    </div>
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
    <Link to={to} className="btn-tactile flex flex-col items-center gap-2 text-center group">
      <span className="grid size-[3.25rem] place-items-center rounded-[1.125rem] border border-white/80 bg-white text-primary shadow-[var(--ello-shadow-sm)] transition-all duration-300 group-hover:scale-105 group-hover:border-primary/25 group-hover:shadow-[var(--ello-shadow-md)]">
        {icon}
      </span>
      <span className="text-[10px] font-extrabold text-foreground/75 tracking-tight group-hover:text-primary transition-colors">{label}</span>
    </Link>
  );
}

export function ListRow({ children, to }: { children: React.ReactNode; to: string }) {
  return (
    <Link
      to={to}
      className="btn-tactile premium-card flex items-center justify-between rounded-[24px] p-4 transition-all duration-300 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.24)]"
    >
      <div className="flex-1 min-w-0 pr-4">{children}</div>
      <ChevronRight className="size-5 text-muted-foreground/60 shrink-0" />
    </Link>
  );
}
