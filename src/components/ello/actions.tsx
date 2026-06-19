import type React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ className = "", fullWidth = true, ...props }: ButtonProps) {
  return (
    <button
      className={`h-12 rounded-xl bg-primary px-5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-50 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({ className = "", fullWidth = true, ...props }: ButtonProps) {
  return (
    <button
      className={`h-12 rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground transition active:scale-[0.99] disabled:opacity-50 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    />
  );
}
