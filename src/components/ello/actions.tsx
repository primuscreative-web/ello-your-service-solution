import type React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ className = "", fullWidth = true, ...props }: ButtonProps) {
  return (
    <button
      className={`ello-btn-primary btn-tactile ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({ className = "", fullWidth = true, ...props }: ButtonProps) {
  return (
    <button
      className={`ello-btn-secondary btn-tactile ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}

export function GhostButton({ className = "", ...props }: ButtonProps) {
  return <button className={`ello-btn-ghost btn-tactile ${className}`} {...props} />;
}
