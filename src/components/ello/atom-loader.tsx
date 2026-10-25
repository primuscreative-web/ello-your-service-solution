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
  mode?: "hybrid" | "image" | "video" | "interlace";
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
  mode = "interlace",
}: ElloAtomLoaderProps) {
  const isHorizontal = layout === "horizontal";

  const renderVisual = () => {
    if (mode === "interlace") {
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 128 80"
          width={size}
          height={size}
          className="ello-interlace-loader shrink-0 overflow-visible"
          focusable="false"
        >
          <defs>
            <linearGradient id="ello-thread-lime" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#70ff28" />
              <stop offset="1" stopColor="#19d944" />
            </linearGradient>
            <linearGradient id="ello-thread-green" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#21f13b" />
              <stop offset="1" stopColor="#00a94f" />
            </linearGradient>
          </defs>
          <path d="M14 40C14 20 34 12 49 25L78 51C93 64 114 55 114 36" fill="none" stroke="#15391a" strokeWidth="13" strokeLinecap="round" />
          <path d="M114 40C114 60 94 68 79 55L50 29C35 16 14 25 14 44" fill="none" stroke="#15391a" strokeWidth="13" strokeLinecap="round" />
          <path className="ello-thread ello-thread-under" d="M114 40C114 60 94 68 79 55L50 29C35 16 14 25 14 44" fill="none" stroke="url(#ello-thread-green)" strokeWidth="8" strokeLinecap="round" />
          <path className="ello-thread ello-thread-over" d="M14 40C14 20 34 12 49 25L78 51C93 64 114 55 114 36" fill="none" stroke="url(#ello-thread-lime)" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    }

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
