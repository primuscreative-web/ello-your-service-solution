import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Play,
  Calendar,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Layers,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import type { PortfolioItem, Service } from "@/lib/localhub-context";
import { money } from "@/components/localhub/ui";

/**
 * Slider interativo Antes & Depois com suporte a arrastar com mouse e toque
 */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  className = "",
  aspectRatio = "aspect-4/3",
}: {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
  aspectRatio?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={() => (isDragging.current = true)}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className={`relative select-none overflow-hidden rounded-2xl bg-slate-900 ${aspectRatio} ${className}`}
    >
      {/* Imagem do "Depois" (Fundo completo) */}
      <img
        src={afterUrl}
        alt="Resultado Depois"
        className="absolute inset-0 size-full object-cover pointer-events-none"
        loading="lazy"
      />
      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 backdrop-blur-md">
        Depois
      </span>

      {/* Imagem do "Antes" (Recortada pela posição do slider) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeUrl}
          alt="Estado Antes"
          className="absolute inset-0 size-full object-cover max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%" }}
          loading="lazy"
        />
        <span className="absolute top-3 left-3 z-10 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 backdrop-blur-md">
          Antes
        </span>
      </div>

      {/* Linha Divisória e Alça Arrastável */}
      <div
        className="absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-8 cursor-ew-resize items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
          <div className="flex gap-0.5 text-[9px] font-bold">
            <span>‹</span>
            <span>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Card de Portfólio adaptado com tags, mídia (foto, vídeo ou antes/depois) e CTA de agendamento
 */
export function PortfolioCard({
  item,
  linkedService,
  onOpenLightbox,
  onSelectService,
}: {
  item: PortfolioItem;
  linkedService?: Service;
  onOpenLightbox: (item: PortfolioItem) => void;
  onSelectService?: (service: Service) => void;
}) {
  const isVideo = item.mediaType === "video";
  const isBeforeAfter = item.mediaType === "before_after" && Boolean(item.beforeUrl && item.afterUrl);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#dedfd6]/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:shadow-md">
      {/* MÍDIA VISUAL */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-950">
        {isBeforeAfter ? (
          <BeforeAfterSlider
            beforeUrl={item.beforeUrl!}
            afterUrl={item.afterUrl!}
            aspectRatio="aspect-4/3"
          />
        ) : isVideo ? (
          <div
            onClick={() => onOpenLightbox(item)}
            className="relative size-full cursor-pointer overflow-hidden"
          >
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="size-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : item.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={item.mediaUrl}
                className="size-full object-cover pointer-events-none"
                preload="metadata"
                muted
              />
            ) : (
              <div className="grid size-full place-items-center bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-300">
                <Film size={36} />
              </div>
            )}
            <div className="absolute inset-0 grid place-items-center bg-black/35 transition-colors group-hover:bg-black/20">
              <span className="grid size-12 place-items-center rounded-full bg-[#d4f455] text-[#151712] shadow-lg transition-transform group-hover:scale-110">
                <Play size={20} className="fill-[#151712] ml-0.5" />
              </span>
            </div>
            <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
              <Film size={11} /> Vídeo
            </span>
          </div>
        ) : (
          <div
            onClick={() => onOpenLightbox(item)}
            className="relative size-full cursor-pointer overflow-hidden"
          >
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="size-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Tag do Trabalho */}
        {item.tag && (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-full border border-black/10 bg-white/95 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#171914] shadow-xs backdrop-blur-xs">
            {item.tag}
          </span>
        )}

        {item.featured && (
          <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full border border-amber-300 bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#171914] shadow-xs">
            <Sparkles size={10} /> Destaque
          </span>
        )}
      </div>

      {/* INFORMAÇÕES E DESCRIÇÃO */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h4
            onClick={() => onOpenLightbox(item)}
            className="cursor-pointer text-sm font-black text-[#171914] transition hover:text-[#5d683f]"
          >
            {item.title}
          </h4>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#686b60]">
              {item.description}
            </p>
          )}
        </div>

        {/* CONEXÃO COM O SERVIÇO: BOTÃO DIRETO DE AGENDAR */}
        {linkedService && (
          <div className="mt-3.5 flex items-center justify-between border-t border-[#f0efe9] pt-3">
            <div className="min-w-0 flex-1 pr-2">
              <span className="block truncate text-[11px] font-bold text-[#768452]">
                {linkedService.name}
              </span>
              <span className="block font-mono text-xs font-black text-[#171914]">
                {money(linkedService.price)}
              </span>
            </div>

            {onSelectService && (
              <button
                type="button"
                onClick={() => onSelectService(linkedService)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[#171914] px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-[#2b2e25] active:scale-95"
              >
                <span>Agendar</span>
                <ArrowUpRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Modal Lightbox em Tela Cheia para visualização detalhada do Portfólio
 */
export function PortfolioLightbox({
  item,
  linkedService,
  onClose,
  onSelectService,
}: {
  item: PortfolioItem | null;
  linkedService?: Service;
  onClose: () => void;
  onSelectService?: (service: Service) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const isVideo = item.mediaType === "video";
  const isBeforeAfter = item.mediaType === "before_after" && Boolean(item.beforeUrl && item.afterUrl);

  // Extrai ID do YouTube caso seja um link do youtube
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  };
  const ytEmbed = isVideo ? getYouTubeEmbedUrl(item.mediaUrl) : null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#151712] text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar prévia"
          className="absolute right-4 top-4 z-30 grid size-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white hover:text-black"
        >
          <X size={18} />
        </button>

        {/* MÍDIA PRINCIPAL */}
        <div className="relative max-h-[65vh] w-full bg-black">
          {isBeforeAfter ? (
            <div className="p-4">
              <BeforeAfterSlider
                beforeUrl={item.beforeUrl!}
                afterUrl={item.afterUrl!}
                aspectRatio="aspect-16/10"
              />
            </div>
          ) : ytEmbed ? (
            <div className="aspect-16/9 w-full">
              <iframe
                src={ytEmbed}
                title={item.title}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isVideo && item.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
            <video
              src={item.mediaUrl}
              controls
              autoPlay
              className="max-h-[60vh] w-full object-contain mx-auto"
            />
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="max-h-[65vh] w-full object-contain mx-auto"
            />
          )}
        </div>

        {/* DETALHES DO TRABALHO */}
        <div className="p-6 space-y-3 bg-[#181a14] border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {item.tag && (
                <span className="inline-block rounded-md bg-[#d4f455]/20 border border-[#d4f455]/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#d4f455] mb-1">
                  {item.tag}
                </span>
              )}
              <h3 className="font-display text-lg sm:text-xl font-black text-white">
                {item.title}
              </h3>
            </div>

            {linkedService && onSelectService && (
              <button
                type="button"
                onClick={() => {
                  onSelectService(linkedService);
                  onClose();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#d4f455] px-4 py-2.5 text-xs font-black text-[#151712] shadow-md transition hover:bg-[#dff96b] active:scale-95"
              >
                <Calendar size={15} />
                <span>Agendar este serviço ({money(linkedService.price)})</span>
              </button>
            )}
          </div>

          {item.description && (
            <p className="text-xs sm:text-sm leading-relaxed text-[#c3c6ba]">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
