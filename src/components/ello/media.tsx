import { useEffect, useState } from "react";
import { ELLO_MEDIA } from "@/lib/ello-media";

export function AvatarPhoto({
  imageUrl,
  initials = "EL",
  size = 56,
}: {
  imageUrl?: string | null;
  initials?: string;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primary"
      style={{ height: size, width: size }}
    >
      {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}

export function PhotoCarousel() {
  const [index, setIndex] = useState(0);
  const items = ELLO_MEDIA.homeCarousel;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [items.length]);

  const item = items[index];

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-white/95 to-slate-50/90 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]">
      <div className="relative min-h-40 overflow-hidden">
        <img src={item.src} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(10,15,31,0.78)_0%,_rgba(10,15,31,0.28)_55%,_rgba(255,255,255,0.05)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(124,92,255,0.35),_transparent_28%)]" />
        <div className="relative flex h-full min-h-40 flex-col justify-between px-5 py-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-[#89d4ff]" />
            Destaques ELLO
          </span>
          <div className="max-w-[14rem]">
            <h2 className="text-lg font-black leading-tight tracking-[-0.035em] text-white">
              {item.title}
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-white/80">{item.body}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 pb-4 pt-3">
        {items.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Ver destaque ${slideIndex + 1}`}
            onClick={() => setIndex(slideIndex)}
            className={`h-1.75 rounded-full transition-all ${
              slideIndex === index ? "w-8 bg-primary shadow-[0_0_18px_rgba(15,111,255,0.24)]" : "w-1.75 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
