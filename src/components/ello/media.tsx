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
    <section className="overflow-hidden rounded-2xl bg-primary/5">
      <div className="relative min-h-32">
        <img src={item.src} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/0" />
        <div className="relative max-w-[13.5rem] px-5 py-5">
          <h2 className="text-lg font-black leading-tight tracking-[-0.035em] text-primary">
            {item.title}
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/75">{item.body}</p>
        </div>
      </div>
      <div className="flex justify-center gap-2 pb-3">
        {items.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Ver destaque ${slideIndex + 1}`}
            onClick={() => setIndex(slideIndex)}
            className={`h-1.5 rounded-full transition ${
              slideIndex === index ? "w-6 bg-primary" : "w-1.5 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
