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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#778253]">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-[#292b25] sm:text-[36px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        )}
      </div>
      {action}
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[10px] border border-[#dedfd6] bg-white px-4 py-3 text-sm text-[#292b25] outline-none transition placeholder:text-slate-400 focus:border-[#8a9668] focus:ring-2 focus:ring-[#edf0e5]";
export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#292b25] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#414338] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#dedfd6] bg-white px-4 py-2.5 text-sm font-semibold text-[#51534c] transition hover:border-[#c7c9bc] hover:bg-[#fafaf7] active:scale-[.98]";

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
