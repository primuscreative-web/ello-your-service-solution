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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#e8e6df]/70 pb-6">
      <div>
        {eyebrow && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#d6dcce]/60 bg-[#edf0e5]/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#586341] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <span className="size-1.5 rounded-full bg-[#758455] animate-pulse" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-[#292b25] sm:text-[36px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#72756a]">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
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
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#55584d]">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-[#8c8f84]">{hint}</span>}
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
      className={`rounded-2xl border border-[#dedfd6]/80 bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_-2px_rgba(0,0,0,0.03)] transition-all duration-200 ${
        hover
          ? "hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_16px_-2px_rgba(0,0,0,0.06)]"
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
    active: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
    neutral: "bg-stone-100 text-stone-700 border-stone-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
  };
  const dots = {
    active: "bg-emerald-500",
    warning: "bg-amber-500",
    neutral: "bg-stone-400",
    danger: "bg-rose-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight ${styles[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dots[status]}`} />
      {label}
    </span>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#dedfd6] bg-white px-4 py-3 text-sm text-[#292b25] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-[#c7c9bc] focus:border-[#778253] focus:ring-4 focus:ring-[#edf0e5]/90";

export const textareaClass =
  "w-full rounded-xl border border-[#dedfd6] bg-white px-4 py-3 text-sm text-[#292b25] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-[#c7c9bc] focus:border-[#778253] focus:ring-4 focus:ring-[#edf0e5]/90 resize-y min-h-[100px]";

export const selectClass =
  "w-full rounded-xl border border-[#dedfd6] bg-white px-4 py-3 text-sm text-[#292b25] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 hover:border-[#c7c9bc] focus:border-[#778253] focus:ring-4 focus:ring-[#edf0e5]/90 cursor-pointer";

export const primaryButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#292b25] px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_-4px_rgba(41,43,37,0.28)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#363830] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_8px_rgba(0,0,0,0.08),0_12px_24px_-4px_rgba(41,43,37,0.36)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none";

export const secondaryButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dedfd6] bg-white px-4 py-2.5 text-sm font-semibold text-[#51534c] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:bg-[#fafaf7] hover:text-[#292b25] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

export const accentButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#d0f25a] px-5 py-2.5 text-sm font-bold text-[#242620] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-4px_rgba(208,242,90,0.5)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#d9f76a] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_4px_8px_rgba(0,0,0,0.06),0_14px_28px_-4px_rgba(208,242,90,0.65)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

export const dangerButtonClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-rose-100 hover:border-rose-300 hover:shadow-[0_4px_12px_rgba(225,29,72,0.12)] active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

export const ghostButtonClass =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-[#62655b] transition-all duration-200 hover:bg-[#edf0e5]/70 hover:text-[#292b25] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
