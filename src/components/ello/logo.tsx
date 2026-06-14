export function ElloLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      ELLO<span className="text-primary">.</span>
    </span>
  );
}