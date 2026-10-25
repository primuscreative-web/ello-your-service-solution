import type { ReactNode } from "react";

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col items-start justify-between gap-3 border-b border-[#e2e0d5]/80 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:gap-4 sm:pb-6">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#768452]/25 bg-[#edf0e5]/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#4d5733] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <span className="size-1.5 rounded-full bg-[#768452] animate-pulse" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[clamp(1.35rem,6vw,1.75rem)] font-black leading-tight tracking-[-0.04em] text-[#171914] sm:text-3xl lg:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-[#686b60]">{description}</p>
        )}
      </div>
      {action && <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#4c4f44]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-[#7e8275]">{hint}</span>}
    </label>
  );
}

export function SurfaceCard({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#dedfd6]/80 bg-white p-6 shadow-[0_1px_2px_rgba(20,24,15,0.02),0_4px_16px_-2px_rgba(20,24,15,0.03),0_0_0_1px_rgba(20,24,15,0.04)] transition-all duration-200 ${
        hover
          ? "hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:shadow-[0_4px_12px_rgba(20,24,15,0.05),0_16px_36px_-6px_rgba(20,24,15,0.08),0_0_0_1px_rgba(118,132,82,0.25)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  status = "neutral",
  label,
}: {
  status?: "active" | "warning" | "neutral" | "danger";
  label: string;
}) {
  const styles = {
    active: "bg-emerald-50 text-emerald-800 border-emerald-300/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
    warning: "bg-amber-50 text-amber-800 border-amber-300/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
    neutral: "bg-[#f0efe9] text-[#4c4f44] border-[#dcdad0] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
    danger: "bg-rose-50 text-rose-800 border-rose-300/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
  };
  const dots = {
    active: "bg-emerald-500",
    warning: "bg-amber-500",
    neutral: "bg-stone-400",
    danger: "bg-rose-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-tight ${styles[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dots[status]}`} />
      {label}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2.5 text-sm text-[#1b1d18] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-slate-400 hover:border-[#b8bcad] focus:border-[#768452] focus:ring-4 focus:ring-[#768452]/15";

export const textareaClass =
  "w-full rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2.5 text-sm text-[#1b1d18] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 placeholder:text-slate-400 hover:border-[#b8bcad] focus:border-[#768452] focus:ring-4 focus:ring-[#768452]/15 resize-y min-h-[100px]";

export const selectClass =
  "w-full rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2.5 text-sm text-[#1b1d18] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] outline-none transition-all duration-150 hover:border-[#b8bcad] focus:border-[#768452] focus:ring-4 focus:ring-[#768452]/15 cursor-pointer";

export const primaryButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#171914] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_2px_8px_-1px_rgba(23,25,20,0.35),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#282b22] hover:shadow-[0_6px_16px_-2px_rgba(23,25,20,0.45)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none";

export const secondaryButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dedfd6] bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#4c4f44] shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#b8bcad] hover:bg-[#fbfbf8] hover:text-[#171914] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const accentButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#d4f455] px-5 py-2.5 text-xs sm:text-sm font-black text-[#151712] shadow-[0_4px_14px_-2px_rgba(212,244,85,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#dff96b] hover:shadow-[0_6px_20px_-2px_rgba(212,244,85,0.6)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const dangerButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300/80 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 shadow-2xs transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-rose-100 hover:border-rose-400 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export const ghostButtonClass =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-[#55584d] transition-all duration-150 hover:bg-[#edf0e5]/80 hover:text-[#171914] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
