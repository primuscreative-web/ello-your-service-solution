import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  ChevronLeft,
  ClipboardList,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  Star,
  User,
  Wrench,
} from "lucide-react";
import type React from "react";
import { ElloLogo } from "@/components/ello/logo";

export const servicePhotos = [
  "linear-gradient(135deg, #f8d789, #8fc0af)",
  "linear-gradient(135deg, #174b72, #f7a35d)",
  "linear-gradient(135deg, #d7d5c7, #4e6872)",
  "linear-gradient(135deg, #f1c261, #1c7b8c)",
  "linear-gradient(135deg, #f2efe7, #9b623f)",
  "linear-gradient(135deg, #d7e8ee, #0d3c61)",
];

export function AppTopBar({
  title,
  subtitle,
  logo = false,
  backTo,
}: {
  title: string;
  subtitle?: string;
  logo?: boolean;
  backTo?: string;
}) {
  return (
    <header className="ello-header-bar !static rounded-none border-x-0 border-t-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {backTo ? (
          <Link to={backTo} className="ello-icon-btn btn-tactile !size-9 shrink-0">
            <ChevronLeft className="size-5" />
          </Link>
        ) : null}
        <div className="min-w-0">
          {logo ? (
            <ElloLogo className="w-[4.4rem]" />
          ) : (
            <>
              <h1 className="truncate text-[0.95rem] font-black tracking-[-0.02em]">{title}</h1>
              {subtitle ? (
                <p className="truncate text-[11px] font-medium text-muted-foreground">{subtitle}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
      <Link to="/app/notifications" className="ello-icon-btn btn-tactile" aria-label="Notificações">
        <Bell className="size-4" />
        <span className="ello-icon-btn-badge" />
      </Link>
    </header>
  );
}

export function SearchBox({ placeholder = "O que você precisa hoje?" }: { placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export function SmartSearchBox({
  onChange,
  onSubmit,
  placeholder = "O que você precisa hoje?",
  value,
}: {
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  value?: string;
}) {
  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}

export function ProPhoto({
  initials = "CS",
  imageUrl,
  size = 56,
  className = "",
}: {
  initials?: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-sky-100 shadow-[0_16px_34px_-18px_rgba(15,23,42,0.35)] ${className}`}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#16496c]" />
          <div className="absolute top-[18%] size-[34%] rounded-full bg-[#f0c4a4]" />
          <div className="absolute bottom-[18%] h-[30%] w-[54%] rounded-t-full bg-[#0faebb]" />
          <span className="relative mt-auto pb-1 text-[9px] font-black text-white/90">
            {initials}
          </span>
        </>
      )}
    </div>
  );
}

export function ServicePhoto({
  index,
  label,
  imageUrl,
  className = "",
}: {
  index: number;
  label?: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const icons = [Wrench, Camera, ShieldCheck, ClipboardList, User, BriefcaseBusiness];
  const Icon = icons[index % icons.length];
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={
        imageUrl
          ? {
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : { background: servicePhotos[index % servicePhotos.length] }
      }
    >
      <div className="absolute inset-0 bg-black/5" />
      <Icon className="absolute left-2 top-2 size-5 text-white drop-shadow" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent p-2">
        {label ? <p className="text-[10px] font-bold leading-tight text-white">{label}</p> : null}
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="ello-card rounded-lg p-3 text-center">
      <p className={`text-lg font-black ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function TrustBadge({ label = "Diamante" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-[#0c436a]">
      <ShieldCheck className="size-3.5 text-primary" />
      {label}
    </span>
  );
}

export function RatingLine({
  rating = "4.9",
  reviews = "112 serviços",
}: {
  rating?: string;
  reviews?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Star className="size-3.5 fill-primary text-primary" />
      <strong>{rating}</strong>
      <span className="text-muted-foreground">({reviews})</span>
    </span>
  );
}

export function CyanButton({
  children,
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`ello-action btn-tactile h-11 rounded-[1.125rem] px-4 text-xs font-bold ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/app", label: "Home", icon: Home },
    { to: "/app/messages", label: "Chat", icon: MessageCircle },
    { to: "/app/agenda", label: "Agenda", icon: CalendarDays },
    { to: "/app/favorites", label: "Favoritos", icon: Heart },
    { to: "/app/profile", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-2 left-1/2 z-50 grid w-[calc(100%-1rem)] max-w-[381px] -translate-x-1/2 grid-cols-5 rounded-[24px] border border-white/70 bg-white/85 px-1.5 py-1.5 shadow-[0_18px_44px_-22px_rgba(15,23,42,0.5)] backdrop-blur-2xl">
      {items.map((item) => {
        const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-0.5 rounded-[16px] py-1.5 text-[10px] font-semibold transition-all duration-300 ${
              active ? "bg-primary/10 text-primary shadow-[0_8px_20px_-12px_rgba(15,111,255,0.55)]" : "text-muted-foreground"
            }`}
          >
            <Icon className={`size-4 ${active ? "fill-primary/15" : ""}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MiniMap() {
  const people = [
    { left: "49%", top: "18%", initials: "CS" },
    { left: "24%", top: "45%", initials: "AB" },
    { left: "63%", top: "44%", initials: "JP" },
    { left: "45%", top: "68%", initials: "MS" },
  ];

  return (
    <div className="relative h-32 overflow-hidden rounded-xl bg-[#dce9ed]">
      <div className="absolute inset-0 opacity-75">
        <div className="absolute left-0 top-7 h-px w-full rotate-[-12deg] bg-white" />
        <div className="absolute left-0 top-20 h-px w-full rotate-[10deg] bg-white" />
        <div className="absolute left-16 top-0 h-full w-px rotate-[18deg] bg-white" />
        <div className="absolute right-16 top-0 h-full w-px rotate-[-20deg] bg-white" />
      </div>
      <MapPin className="absolute right-3 top-3 size-5 rounded-full bg-white p-1 text-[#083d63] shadow" />
      <span className="absolute left-1/2 top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white ring-4 ring-white/80" />
      {people.map((p) => (
        <div
          key={p.initials}
          className="absolute grid size-9 place-items-center rounded-full border-2 border-white bg-[#0faebb] text-[10px] font-black text-white shadow"
          style={{ left: p.left, top: p.top }}
        >
          {p.initials}
        </div>
      ))}
    </div>
  );
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Enviar mensagem",
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-border bg-white px-3 py-2">
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend?.();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="h-9 flex-1 rounded-full border border-border bg-background px-4 text-xs outline-none"
      />
      <button
        disabled={disabled}
        onClick={onSend}
        className="grid size-10 place-items-center rounded-full bg-primary text-white disabled:bg-muted disabled:text-muted-foreground"
      >
        <Send className="size-4 fill-white" />
      </button>
    </div>
  );
}

export function MoreButton() {
  return (
    <button className="grid size-8 place-items-center rounded-full bg-white/10">
      <MoreHorizontal className="size-5" />
    </button>
  );
}
