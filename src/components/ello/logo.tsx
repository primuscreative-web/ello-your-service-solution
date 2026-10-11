import type { CSSProperties } from "react";

export function ElloLogo({
  className = "",
  tone = "white",
  variant = "full",
  height = 28,
  style,
}: {
  className?: string;
  tone?: "white" | "dark" | "blue";
  variant?: "full" | "symbol";
  height?: number | string;
  style?: CSSProperties;
}) {
  const pixelHeight = typeof height === "number" ? `${height}px` : height;

  if (variant === "symbol") {
    const symSize = typeof height === "number" ? height : 28;
    return (
      <img
        src="/images/ello/ello-symbol.png"
        alt="ELLO"
        width={symSize}
        height={symSize}
        className={`inline-block shrink-0 object-contain select-none ${className}`}
        style={{
          height: pixelHeight,
          width: pixelHeight,
          maxHeight: pixelHeight,
          ...style,
        }}
      />
    );
  }

  const src =
    tone === "dark" || tone === "blue"
      ? "/images/ello/ello-logo-dark.png"
      : "/images/ello/ello-logo.png";

  const numHeight = typeof height === "number" ? height : 28;
  const numWidth = Math.round(numHeight * (744 / 242));

  return (
    <img
      src={src}
      alt="ELLO"
      width={numWidth}
      height={numHeight}
      className={`inline-block shrink-0 object-contain select-none ${className}`}
      style={{
        height: pixelHeight,
        width: "auto",
        maxHeight: pixelHeight,
        maxWidth: "100%",
        ...style,
      }}
    />
  );
}

export function ElloSymbol({
  className = "",
  size = 28,
  style,
}: {
  className?: string;
  size?: number | string;
  style?: CSSProperties;
}) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;
  const numSize = typeof size === "number" ? size : 28;

  return (
    <img
      src="/images/ello/ello-symbol.png"
      alt="ELLO"
      width={numSize}
      height={numSize}
      className={`inline-block shrink-0 object-contain select-none ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        maxWidth: pixelSize,
        maxHeight: pixelSize,
        ...style,
      }}
    />
  );
}
