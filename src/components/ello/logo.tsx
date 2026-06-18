export function ElloLogo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="ELLO"
      className={`inline-flex items-center gap-[0.2em] font-display font-extrabold leading-none tracking-[-0.055em] ${className}`}
    >
      <svg
        aria-hidden="true"
        className="h-[0.78em] w-[0.78em] shrink-0 text-primary"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M7.5 9.25h9.25a6.75 6.75 0 0 1 0 13.5H7.5V9.25Z"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 16h10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
      ELLO<span className="text-primary">.</span>
    </span>
  );
}
