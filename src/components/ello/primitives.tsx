import type React from "react";
import { Link } from "@tanstack/react-router";

export function ElloEyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
      {children}
    </span>
  );
}

export function ElloSectionHeader({
  title,
  subtitle,
  action,
  actionTo,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: string;
  actionTo?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs font-semibold text-slate-500/80">{subtitle}</p>
        ) : null}
      </div>
      {action && actionTo ? (
        <Link
          to={actionTo}
          className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-slate-100 active:scale-95"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function ElloSurface({
  children,
  className = "",
  elevated = false,
}: {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <div
      className={`${
        elevated
          ? "border-white/80 bg-white/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]"
          : "border-slate-100/50 bg-white/70 backdrop-blur-md"
      } rounded-[2rem] border p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function ElloInfoBanner({
  icon,
  eyebrow,
  title,
  body,
  className = "",
}: {
  icon: React.ReactNode;
  eyebrow?: string;
  title?: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={`ello-info-banner ${className}`}>
      <div className="ello-info-banner-icon">{icon}</div>
      <div className="min-w-0">
        {eyebrow ? <p className="ello-info-banner-eyebrow">{eyebrow}</p> : null}
        {title ? <p className="ello-info-banner-title">{title}</p> : null}
        <p className="ello-info-banner-body">{body}</p>
      </div>
    </div>
  );
}

export function ElloDivider({
  label = "ou",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`ello-divider ${className}`}>
      <span className="ello-divider-line" />
      <span className="ello-divider-label">{label}</span>
      <span className="ello-divider-line" />
    </div>
  );
}
