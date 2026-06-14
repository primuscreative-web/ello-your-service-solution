export function ProAvatar({
  initials,
  tone,
  size = 56,
  className = "",
}: {
  initials: string;
  tone: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl font-display font-bold text-foreground/80 outline -outline-offset-1 outline-black/5 ${className}`}
      style={{
        width: size,
        height: size,
        background: tone,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}