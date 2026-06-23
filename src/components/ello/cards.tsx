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
      className="btn-tactile w-[8.2rem] shrink-0 rounded-[24px] border border-slate-100 bg-white p-3.5 shadow-[0_12px_28px_-8px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.1)] transition-all duration-300 flex flex-col items-center text-center"
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
      <div className="mt-2.5 flex items-center justify-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full">
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
    <div className="group flex items-center gap-4 rounded-3xl border border-transparent p-3 -mx-3 hover:bg-slate-50/50 hover:border-slate-100/50 transition-all duration-300">
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
      <span className="grid size-12 place-items-center rounded-2xl border border-slate-100/60 bg-white text-primary shadow-[0_8px_20px_-4px_rgba(15,23,42,0.05)] group-hover:scale-110 group-hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.1)] group-hover:text-[#0052ff] transition-all duration-300">
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
      className="btn-tactile flex items-center justify-between rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] transition-all duration-300"
    >
      <div className="flex-1 min-w-0 pr-4">{children}</div>
      <ChevronRight className="size-5 text-muted-foreground/60 shrink-0" />
    </Link>
  );
}
