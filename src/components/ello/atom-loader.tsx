import React from "react";

interface ElloAtomLoaderProps {
  /** Size in pixels (width and height), default 36 */
  size?: number;
  /** Optional message or status text */
  label?: string;
  /** Layout direction when label is provided */
  layout?: "vertical" | "horizontal";
  /** Custom wrapper class */
  className?: string;
  /** Custom text class */
  labelClassName?: string;
  /** Use video tag when supported or image directly (default: 'hybrid') */
  mode?: "hybrid" | "image" | "video";
}

/**
 * Looping atom / symbol loader for ELLO.
 * Seamless infinite rotation and subtle atomic breathing pulse.
 */
export function ElloAtomLoader({
  size = 36,
  label,
  layout = "vertical",
  className = "",
  labelClassName = "",
  mode = "hybrid",
}: ElloAtomLoaderProps) {
  const isHorizontal = layout === "horizontal";

  const renderVisual = () => {
    if (mode === "video") {
      return (
        <video
          src="/videos/ello-atom-loader.webm"
          autoPlay
          loop
          muted
          playsInline
          width={size}
          height={size}
          className="pointer-events-none select-none object-contain"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }

    if (mode === "hybrid") {
      return (
        <div
          className="relative inline-flex items-center justify-center shrink-0"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {/* Transparent WebM video with animated WebP fallback */}
          <video
            autoPlay
            loop
            muted
            playsInline
            width={size}
            height={size}
            className="pointer-events-none select-none object-contain w-full h-full"
          >
            <source src="/videos/ello-atom-loader.webm" type="video/webm" />
            <img
              src="/images/ello/ello-atom-loader.webp"
              alt="Carregando..."
              width={size}
              height={size}
              className="pointer-events-none select-none object-contain w-full h-full"
            />
          </video>
        </div>
      );
    }

    // Default image mode: pristine animated WebP
    return (
      <img
        src="/images/ello/ello-atom-loader.webp"
        alt="Carregando..."
        width={size}
        height={size}
        className="pointer-events-none select-none object-contain shrink-0"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  };

  if (!label) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        role="status"
        aria-label="Carregando..."
      >
        {renderVisual()}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${
        isHorizontal ? "flex-row gap-2.5" : "flex-col gap-2"
      } ${className}`}
      role="status"
      aria-label={label}
    >
      {renderVisual()}
      <span className={`text-xs font-medium text-slate-400 select-none ${labelClassName}`}>
        {label}
      </span>
    </div>
  );
}

export default ElloAtomLoader;
