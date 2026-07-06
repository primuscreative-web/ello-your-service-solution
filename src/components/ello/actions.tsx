import type React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ className = "", fullWidth = true, ...props }: ButtonProps) {
  return (
    <button
      className={`relative flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-extrabold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary-dark active:scale-95 ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({ className = "", fullWidth = true, ...props }: ButtonProps) {
  return (
    <button
      className={`relative flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-extrabold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 active:scale-95 ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}

export function GhostButton({ className = "", ...props }: ButtonProps) {
  return <button className={`ello-btn-ghost btn-tactile ${className}`} {...props} />;
}
