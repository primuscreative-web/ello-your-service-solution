import type React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function ScreenPage({
  children,
  className = "",
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={`min-h-dvh ello-mesh-bg pb-24 ${noPadding ? "" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  backTo,
  backLabel = "Voltar",
  action,
  sticky = true,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
  sticky?: boolean;
}) {
  return (
    <header
      className={`ello-header-bar ${sticky ? "" : "!static"} flex items-center gap-3 pt-[calc(0.25rem+env(safe-area-inset-top))]`}
    >
      {backTo ? (
        <Link to={backTo} aria-label={backLabel} className="ello-icon-btn btn-tactile shrink-0">
          <ChevronLeft className="size-5" />
        </Link>
      ) : (
        <span className="size-10 shrink-0" />
      )}
      <div className="min-w-0 flex-1 text-center">
        <h1 className="truncate text-[0.95rem] font-black tracking-[-0.02em]">{title}</h1>
        {subtitle ? (
          <p className="truncate text-[11px] font-medium text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ?? <span className="size-10 shrink-0" />}
    </header>
  );
}

export function ScreenMain({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={`space-y-5 px-4 py-4 sm:px-5 ${className}`}>{children}</main>;
}

export function ScreenTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ value: string; label: string }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid border-b border-border/70 bg-white/60 backdrop-blur-xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`border-b-2 py-3.5 text-sm font-bold transition-colors ${
            active === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`grid rounded-full border border-border/80 bg-white/70 p-1 ${className}`} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full py-2.5 text-xs font-bold transition-all ${
            value === option.value
              ? "bg-primary text-white shadow-[var(--ello-shadow-glow)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="ello-surface-elevated px-6 py-14 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-[var(--ello-shadow-sm)]">
        {icon}
      </span>
      <h2 className="ello-section-title mt-4 text-base">{title}</h2>
      <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function StatusPill({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "muted" | "danger";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    muted: "bg-secondary text-muted-foreground",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`ello-surface p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <strong className="mt-2 block text-2xl font-black tracking-tight">{value}</strong>
    </article>
  );
}

export function DarkHeroCard({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="animate-reveal overflow-hidden rounded-[1.875rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-[oklch(0.28_0.1_264)] p-5 text-white shadow-[0_28px_80px_-32px_rgba(0,0,0,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-black leading-tight tracking-[-0.03em]">{title}</h2>
          <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-white/70">{description}</p>
        </div>
        {icon ? (
          <div className="rounded-2xl border border-white/12 bg-white/8 p-2.5 backdrop-blur-sm">
            {icon}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function ListRowLink({
  to,
  search,
  icon,
  title,
  subtitle,
  trailing,
  className = "",
}: {
  to: string;
  search?: Record<string, string>;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className={`premium-card flex items-center gap-3 rounded-[1.25rem] p-4 transition-all hover:-translate-y-0.5 ${className}`}
    >
      {icon ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-black">{title}</strong>
        {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
      </span>
      {trailing}
    </Link>
  );
}
