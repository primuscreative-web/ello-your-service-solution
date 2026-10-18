import React, { useState } from "react";
import { Copy, Check, ExternalLink, MapPin } from "lucide-react";

export interface HeroCommandCardProps {
  storeName: string;
  storeSlug: string;
  cityName: string;
  isLive?: boolean;
}

export function HeroCommandCard({
  storeName: _storeName,
  storeSlug,
  cityName,
  isLive = true,
}: HeroCommandCardProps) {
  const [copied, setCopied] = useState(false);
  const storeUrl = `ello.app.br/loja/${storeSlug}`;

  const handleCopy = async () => {
    if (!storeSlug) return;
    try {
      await navigator.clipboard.writeText(`https://${storeUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#181a14] via-[#1f221a] to-[#141611] p-6 md:p-8 border border-white/[0.08] shadow-2xl">
      {/* Luz ambiente difusa no fundo (Glow) */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d0f25a]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Bloco esquerdo: Status e Chamada */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#d0f25a]/10 px-3 py-1 border border-[#d0f25a]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d0f25a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d0f25a]" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-[#d0f25a] uppercase">
              {isLive ? "Loja Ao Vivo" : "Loja Fechada"}
            </span>
            <span className="text-white/30">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-white/70 font-medium">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
              {cityName}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-display">
            Seu canal de vendas direto está pronto para atender.
          </h2>

          {/* URL com Monospace e Ação de Cópia */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 rounded-xl bg-black/40 px-3.5 py-2 border border-white/10 font-mono text-sm text-white/80">
              <span className="text-[#d0f25a]/60">https://</span>
              <span>{storeUrl}</span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 px-4 py-2 text-xs font-semibold text-white transition-all duration-150 border border-white/10"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#d0f25a]" />
                  <span className="text-[#d0f25a]">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white/70" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bloco direito: Botão de Ação Principal */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 lg:pt-0 border-t border-white/10 lg:border-t-0">
          <a
            href={`/loja/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d0f25a] hover:bg-[#d9f863] active:scale-[0.98] px-6 py-3.5 text-sm font-bold text-[#141611] transition-all duration-150 shadow-lg shadow-[#d0f25a]/20 cursor-pointer"
          >
            <span>Abrir Loja Pública</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
