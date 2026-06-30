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
    <span className={`ello-eyebrow ${className}`}>
      <span className="ello-eyebrow-dot" aria-hidden="true" />
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
    <div className={`flex items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="ello-section-title">{title}</h2>
        {subtitle ? <p className="ello-section-subtitle">{subtitle}</p> : null}
      </div>
      {action && actionTo ? (
        <Link to={actionTo} className="ello-link-action shrink-0">
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
    <div className={`${elevated ? "ello-surface-elevated" : "ello-surface"} ${className}`}>
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

export function ElloDivider({ label = "ou", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`ello-divider ${className}`}>
      <span className="ello-divider-line" />
      <span className="ello-divider-label">{label}</span>
      <span className="ello-divider-line" />
    </div>
  );
}
