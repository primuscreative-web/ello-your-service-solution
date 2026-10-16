import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Gift,
  Copy,
  Check,
  RotateCw,
  Trophy,
  ExternalLink,
  MessageCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

export type LuckyWheelPrize = {
  id: string;
  label: string;
  description?: string;
  couponCode?: string;
  discountType?: "percent" | "fixed" | "gift" | "none";
  discountValue?: number;
  color?: string;
  probability?: number;
};

export type LuckyWheelSettings = {
  enabled: boolean;
  trigger?: "welcome" | "post_purchase" | "both";
  minOrderValue?: number;
  title?: string;
  subtitle?: string;
  prizes: LuckyWheelPrize[];
};

export const defaultNichePrizes: Record<string, LuckyWheelPrize[]> = {
  alimentacao: [
    { id: "1", label: "10% OFF", description: "Válido no seu pedido", couponCode: "SORTE10", discountType: "percent", discountValue: 10, color: "#10b981", probability: 25 },
    { id: "2", label: "Sobremesa", description: "Cortesia no seu pedido", couponCode: "DOCEFREE", discountType: "gift", discountValue: 0, color: "#f59e0b", probability: 20 },
    { id: "3", label: "R$ 5 OFF", description: "Desconto direto no valor final", couponCode: "CINCOOFF", discountType: "fixed", discountValue: 5, color: "#6366f1", probability: 20 },
    { id: "4", label: "Quase!", description: "Mais sorte na próxima", discountType: "none", discountValue: 0, color: "#64748b", probability: 15 },
    { id: "5", label: "Frete Grátis", description: "Entrega gratuita para você", couponCode: "FRETELIVRE", discountType: "fixed", discountValue: 0, color: "#ec4899", probability: 10 },
    { id: "6", label: "Refri Lata", description: "Bebida cortesia na compra", couponCode: "BEBIDAGRATIS", discountType: "gift", discountValue: 0, color: "#8b5cf6", probability: 10 },
  ],
  pet: [
    { id: "1", label: "15% Banho", description: "Desconto no serviço de banho", couponCode: "PETBANHO15", discountType: "percent", discountValue: 15, color: "#10b981", probability: 25 },
    { id: "2", label: "Petisco Grátis", description: "Sachê ou petisco cortesia", couponCode: "MIMOPET", discountType: "gift", discountValue: 0, color: "#f59e0b", probability: 25 },
    { id: "3", label: "R$ 10 OFF", description: "Em compras acima de R$ 60", couponCode: "PET10", discountType: "fixed", discountValue: 10, color: "#6366f1", probability: 20 },
    { id: "4", label: "Quase lá!", description: "Obrigado pela preferência", discountType: "none", discountValue: 0, color: "#64748b", probability: 15 },
    { id: "5", label: "Brinquedo", description: "Brinde surpresa para seu pet", couponCode: "BRINQUEPET", discountType: "gift", discountValue: 0, color: "#ec4899", probability: 15 },
  ],
  saude: [
    { id: "1", label: "10% Retorno", description: "Válido na próxima sessão", couponCode: "SAUDE10", discountType: "percent", discountValue: 10, color: "#10b981", probability: 30 },
    { id: "2", label: "Kit Amostras", description: "Brinde de dermocosméticos", couponCode: "KITVIP", discountType: "gift", discountValue: 0, color: "#f59e0b", probability: 25 },
    { id: "3", label: "R$ 20 OFF", description: "Em procedimentos selecionados", couponCode: "CUIDAR20", discountType: "fixed", discountValue: 20, color: "#6366f1", probability: 20 },
    { id: "4", label: "Obrigado!", description: "Obrigado pela sua visita", discountType: "none", discountValue: 0, color: "#64748b", probability: 15 },
    { id: "5", label: "Check-in VIP", description: "Agendamento prioritário cortesia", couponCode: "PRIORITARIO", discountType: "gift", discountValue: 0, color: "#8b5cf6", probability: 10 },
  ],
  automotivo: [
    { id: "1", label: "10% Alinhamento", description: "Desconto no serviço", couponCode: "AUTO10", discountType: "percent", discountValue: 10, color: "#10b981", probability: 25 },
    { id: "2", label: "Aromatizante", description: "Cheirinho automotivo premium", couponCode: "AUTOCHEIRO", discountType: "gift", discountValue: 0, color: "#f59e0b", probability: 25 },
    { id: "3", label: "R$ 15 OFF", description: "Na troca de óleo", couponCode: "OLEO15", discountType: "fixed", discountValue: 15, color: "#6366f1", probability: 20 },
    { id: "4", label: "Quase!", description: "Volte sempre!", discountType: "none", discountValue: 0, color: "#64748b", probability: 15 },
    { id: "5", label: "Cristalização", description: "Cortesia no para-brisa", couponCode: "VIDROCRISTAL", discountType: "gift", discountValue: 0, color: "#ec4899", probability: 15 },
  ],
};

function playWheelTickSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.start(now);
    osc.stop(now + 0.04);
    osc.onended = () => void ctx.close();
  } catch {
    // ignore
  }
}

function playWinCelebrationSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = now + idx * 0.09;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.start(start);
      osc.stop(start + 0.35);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // ignore
  }
}

export interface LuckyWheelProps {
  settings?: LuckyWheelSettings | null;
  businessName?: string;
  businessSlug?: string;
  businessCategory?: string;
  orderToken?: string;
  orderTotal?: number;
  mode?: "welcome" | "post_purchase";
  previewMode?: boolean;
  onApplyCoupon?: (couponCode: string) => void;
  onClose?: () => void;
}

export function LuckyWheel({
  settings,
  businessName = "Estabelecimento",
  businessSlug = "",
  businessCategory = "alimentacao",
  orderToken,
  orderTotal = 50,
  mode = "post_purchase",
  previewMode = false,
  onApplyCoupon,
  onClose,
}: LuckyWheelProps) {
  const fallbackPrizes = defaultNichePrizes[businessCategory] || defaultNichePrizes.alimentacao;
  const activePrizes = useMemo(() => {
    if (settings?.prizes && settings.prizes.length >= 2) return settings.prizes;
    return fallbackPrizes;
  }, [settings?.prizes, fallbackPrizes]);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<LuckyWheelPrize | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const storageKey = useMemo(() => {
    if (mode === "welcome") {
      return businessSlug ? `ello_wheel_welcome_${businessSlug}` : null;
    }
    return orderToken ? `ello_wheel_reward_${orderToken}` : null;
  }, [mode, businessSlug, orderToken]);

  useEffect(() => {
    if (previewMode || !storageKey || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as LuckyWheelPrize;
        setWonPrize(parsed);
        setHasSpun(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey, previewMode]);

  // Se o lojista desativou a roleta e não estamos em modo de prévia
  if (!previewMode && settings && settings.enabled === false) {
    return null;
  }

  // Verifica se o trigger configurado bate com o modo atual
  if (!previewMode && settings?.trigger) {
    if (settings.trigger !== "both" && settings.trigger !== mode) {
      return null;
    }
  }

  // Se o pedido não atingiu o valor mínimo configurado (apenas no modo pós-compra)
  if (
    !previewMode &&
    mode === "post_purchase" &&
    settings?.minOrderValue &&
    orderTotal < settings.minOrderValue
  ) {
    return null;
  }

  const segmentAngle = 360 / activePrizes.length;

  const spinTheWheel = () => {
    if (spinning || (hasSpun && !previewMode)) return;

    setSpinning(true);
    setWonPrize(null);

    // Seleção ponderada por probabilidade ou uniforme
    const totalWeight = activePrizes.reduce((sum, p) => sum + (p.probability ?? 10), 0);
    let randomNum = Math.random() * totalWeight;
    let chosenIndex = 0;
    for (let i = 0; i < activePrizes.length; i++) {
      randomNum -= activePrizes[i].probability ?? 10;
      if (randomNum <= 0) {
        chosenIndex = i;
        break;
      }
    }

    const extraRounds = 360 * 5;
    const targetSliceAngle = 360 - (chosenIndex * segmentAngle + segmentAngle / 2);
    const jitter = (Math.random() - 0.5) * (segmentAngle * 0.6);
    const targetRotation = rotation + extraRounds + targetSliceAngle + jitter;

    // Efeitos sonoros de clique durante o giro
    let ticks = 0;
    const tickInterval = setInterval(() => {
      ticks++;
      playWheelTickSound();
      if (ticks > 28) clearInterval(tickInterval);
    }, 140);

    setRotation(targetRotation);

    setTimeout(() => {
      clearInterval(tickInterval);
      const chosen = activePrizes[chosenIndex];
      setWonPrize(chosen);
      setSpinning(false);
      setHasSpun(true);

      if (chosen.discountType !== "none") {
        playWinCelebrationSound();
      }

      if (!previewMode && storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(chosen));
        } catch {
          // ignore
        }
      }
    }, 4500);
  };

  const isWelcome = mode === "welcome";
  const defaultTitle = isWelcome
    ? "Roleta de Boas-Vindas 🎰"
    : "Roleta de Prêmios da Casa 🎰";
  const defaultSubtitle = isWelcome
    ? "Gire e ganhe um desconto especial para aplicar agora no seu pedido!"
    : "Gire e ganhe mimos ou cupons exclusivos para sua próxima compra!";

  const title = settings?.title || defaultTitle;
  const subtitle = settings?.subtitle || defaultSubtitle;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-b from-amber-500/10 via-white to-amber-50/40 p-5 shadow-lg sm:p-7">
      {/* Decoração superior com partículas / brilho */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Gift size={16} />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {previewMode && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900">
            Modo de Teste (Studio)
          </span>
        )}
      </div>

      {/* Conteúdo Central com a Roleta */}
      <div className="mt-6 flex flex-col items-center justify-center">
        {/* Roleta Visual SVG */}
        <div className="relative size-72 sm:size-80">
          {/* Ponteiro no Topo da Roleta */}
          <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 drop-shadow-md">
            <div className="size-0 border-x-8 border-x-transparent border-t-[20px] border-t-amber-600" />
          </div>

          {/* SVG da Roleta com fatias */}
          <svg
            viewBox="0 0 320 320"
            className="size-full select-none drop-shadow-xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4.5s cubic-bezier(0.12, 0.95, 0.15, 1)"
                : "none",
            }}
          >
            {/* Círculo de fundo */}
            <circle cx="160" cy="160" r="150" fill="#292b25" stroke="#f59e0b" strokeWidth="6" />

            {/* Fatias */}
            <g transform="translate(160, 160)">
              {activePrizes.map((prize, idx) => {
                const startAngle = (idx * segmentAngle * Math.PI) / 180;
                const endAngle = (((idx + 1) * segmentAngle) * Math.PI) / 180;
                const radius = 144;
                const x1 = radius * Math.sin(startAngle);
                const y1 = -radius * Math.cos(startAngle);
                const x2 = radius * Math.sin(endAngle);
                const y2 = -radius * Math.cos(endAngle);

                const midAngle = (startAngle + endAngle) / 2;
                const textRadius = radius * 0.65;
                const textX = textRadius * Math.sin(midAngle);
                const textY = -textRadius * Math.cos(midAngle);
                const textRotation = (midAngle * 180) / Math.PI;

                return (
                  <g key={prize.id}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color || (idx % 2 === 0 ? "#10b981" : "#f59e0b")}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Centro da Roleta com botão */}
            <circle cx="160" cy="160" r="28" fill="#ffffff" stroke="#292b25" strokeWidth="4" />
            <circle cx="160" cy="160" r="18" fill="#f59e0b" />
          </svg>

          {/* Botão no Centro */}
          <button
            type="button"
            disabled={spinning || (hasSpun && !previewMode)}
            onClick={spinTheWheel}
            className="absolute left-1/2 top-1/2 z-10 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 font-extrabold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-80"
          >
            {spinning ? (
              <RotateCw size={18} className="animate-spin" />
            ) : hasSpun && !previewMode ? (
              <Check size={20} />
            ) : (
              <span className="text-[11px] font-black tracking-wider uppercase text-slate-950">
                GIRAR
              </span>
            )}
          </button>
        </div>

        {/* Botão Principal de Girar */}
        {!hasSpun && (
          <button
            type="button"
            disabled={spinning}
            onClick={spinTheWheel}
            className="mt-6 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-98 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {spinning ? "Girando a roleta…" : isWelcome ? "Girar e Ganhar Desconto" : "Tentar a Sorte Agora"}
          </button>
        )}

        {/* Resultado do Prêmio */}
        {wonPrize && (
          <div className="mt-5 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            {wonPrize.discountType === "none" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <Trophy size={18} />
                </span>
                <h4 className="mt-2 text-sm font-bold text-slate-800">{wonPrize.label}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  {wonPrize.description || "Obrigado pela sua visita! Aproveite as opções do cardápio."}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white"
                    >
                      Ver Cardápio
                    </button>
                  )}
                  {previewMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasSpun(false);
                        setWonPrize(null);
                      }}
                      className="text-xs font-semibold text-amber-700 underline"
                    >
                      Girar novamente (teste)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50 to-white p-5 text-center shadow-md">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Trophy size={24} />
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  🎉 Parabéns! Você foi premiado!
                </p>
                <h4 className="mt-1 text-xl font-black text-slate-900">{wonPrize.label}</h4>
                <p className="mt-1 text-xs text-slate-600">{wonPrize.description}</p>

                {wonPrize.couponCode && (
                  <div className="mt-4 rounded-xl border border-dashed border-emerald-400 bg-white p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      {isWelcome ? "Seu cupom liberado para este pedido:" : "Seu cupom para o próximo pedido:"}
                    </p>
                    <div className="mt-1.5 flex items-center justify-center gap-2">
                      <span className="rounded-lg bg-emerald-50 px-3 py-1 font-mono text-base font-extrabold tracking-wider text-emerald-800">
                        {wonPrize.couponCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(wonPrize.couponCode!);
                          setCopiedCoupon(true);
                          toast.success("Cupom copiado!");
                          setTimeout(() => setCopiedCoupon(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#292b25] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3d3f37]"
                      >
                        {copiedCoupon ? <Check size={13} /> : <Copy size={13} />}
                        {copiedCoupon ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {/* Botão de Aplicação Direta no Pedido Atual (Modo Welcome) */}
                  {onApplyCoupon && wonPrize.couponCode && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyCoupon(wonPrize.couponCode!);
                        toast.success(`Cupom ${wonPrize.couponCode} aplicado ao seu pedido!`);
                        if (onClose) onClose();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#292b25] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#3d3f37]"
                    >
                      <Sparkles size={14} className="text-[#d0f25a]" />
                      Aplicar no meu pedido agora
                    </button>
                  )}

                  {wonPrize.couponCode && !isWelcome && (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Acabei de ganhar um presente na roleta da ${businessName}: ${wonPrize.label} com o cupom ${wonPrize.couponCode}! 🎰`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                    >
                      <MessageCircle size={14} />
                      Salvar no WhatsApp
                    </a>
                  )}

                  {previewMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setHasSpun(false);
                        setWonPrize(null);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Testar de novo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LuckyWheelModal({
  isOpen,
  onClose,
  ...wheelProps
}: LuckyWheelProps & { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar roleta"
          className="absolute right-3.5 top-3.5 z-30 grid size-8 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"
        >
          <X size={16} />
        </button>
        <LuckyWheel {...wheelProps} onClose={onClose} />
      </div>
    </div>
  );
}
