export function ElloLogo({
  className = "",
  tone = "blue",
}: {
  className?: string;
  tone?: "blue" | "white";
}) {
  const src =
    tone === "white"
      ? "/images/ello/ello-logo-original-white.png"
      : "/images/ello/ello-logo-original-blue.png";

  return (
    <img
      src={src}
      alt="ELLO"
      width={670}
      height={621}
      className={`inline-block h-auto w-[5.25rem] object-contain ${className}`}
    />
  );
}
