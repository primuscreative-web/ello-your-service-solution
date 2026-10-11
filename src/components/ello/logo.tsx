export function ElloLogo({
  className = "",
  tone = "white",
  variant = "full",
}: {
  className?: string;
  tone?: "white" | "dark" | "blue";
  variant?: "full" | "symbol";
}) {
  if (variant === "symbol") {
    return (
      <img
        src="/images/ello/ello-symbol.png"
        alt="ELLO"
        width={290}
        height={290}
        className={`inline-block h-auto w-8 object-contain ${className}`}
      />
    );
  }

  const src =
    tone === "dark" || tone === "blue"
      ? "/images/ello/ello-logo-dark.png"
      : "/images/ello/ello-logo.png";

  return (
    <img
      src={src}
      alt="ELLO"
      width={744}
      height={242}
      className={`inline-block h-auto w-24 object-contain ${className}`}
    />
  );
}

export function ElloSymbol({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src="/images/ello/ello-symbol.png"
      alt="ELLO"
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
