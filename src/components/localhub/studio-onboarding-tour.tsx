import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Package,
  CalendarDays,
  WalletCards,
  HeartHandshake,
  Settings2,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

export type TourStep = {
  id: string;
  targetId: string;
  mobileTargetId?: string;
  title: string;
  badge: string;
  description: string;
  tip?: string;
  icon: typeof Sparkles;
  preferredPlacement?: "bottom" | "top" | "right" | "left";
};

const TOUR_STORAGE_KEY = "ello_studio_tour_completed_v1";

const DEFAULT_STEPS: TourStep[] = [
  {
    id: "catalog",
    targetId: "tour-nav-catalog",
    mobileTargetId: "tour-nav-catalog-mobile",
    title: "1. Catálogo e Ofertas",
    badge: "O coração do seu negócio",
    description:
      "Cadastre seus produtos, pratos ou serviços com fotos, preços, opções e tempos de preparo ou duração.",
    tip: "Mantenha sempre os valores atualizados para seus clientes verem ao vivo.",
    icon: Package,
    preferredPlacement: "right",
  },
  {
    id: "operations",
    targetId: "tour-nav-operations",
    mobileTargetId: "tour-nav-operations-mobile",
    title: "2. Pedidos & Agendamentos",
    badge: "Gestão operacional ao vivo",
    description:
      "Acompanhe novos pedidos de delivery ou horários marcados em tempo real, com avisos sonoros e status de atendimento.",
    tip: "Você pode atualizar o status com um clique para avisar o cliente.",
    icon: CalendarDays,
    preferredPlacement: "right",
  },
  {
    id: "caixa",
    targetId: "tour-nav-caixa",
    mobileTargetId: "tour-nav-caixa-mobile",
    title: "3. Frente de Caixa & PDV",
    badge: "Cobranças no balcão",
    description:
      "Registre vendas rápidas de balcão ou atendimentos presenciais, receba em Pix, cartão ou dinheiro e controle o fluxo do dia.",
    tip: "Ideal para cobrar sem burocracia e fechar o caixa no final do expediente.",
    icon: WalletCards,
    preferredPlacement: "right",
  },
  {
    id: "crm",
    targetId: "tour-nav-crm",
    mobileTargetId: "tour-nav-crm-mobile",
    title: "4. Clientes & Histórico",
    badge: "Fidelização e preferências",
    description:
      "Consulte a lista de clientes, histórico de compras, preferências (corte, pet, ficha clínica) e crie cupons de desconto.",
    tip: "Clientes fiéis compram até 3x mais quando recebem atenção personalizada.",
    icon: HeartHandshake,
    preferredPlacement: "right",
  },
  {
    id: "settings",
    targetId: "tour-nav-settings",
    mobileTargetId: "tour-nav-settings-mobile",
    title: "5. Conexão WhatsApp & Loja",
    badge: "Automação e presença",
    description:
      "Conecte o WhatsApp do seu negócio via QR Code para avisos automáticos e configure os horários de funcionamento.",
    tip: "O QR Code conecta seu WhatsApp oficial em menos de 10 segundos.",
    icon: Settings2,
    preferredPlacement: "right",
  },
  {
    id: "preview",
    targetId: "tour-preview-card",
    mobileTargetId: "tour-header-share",
    title: "6. Sua Página no Ar",
    badge: "Link público compartilhável",
    description:
      "Este é o link oficial da sua página. Seus clientes podem acessar de qualquer celular para comprar ou agendar.",
    tip: "Coloque esse link na bio do seu Instagram e no recado do WhatsApp!",
    icon: ExternalLink,
    preferredPlacement: "top",
  },
];

interface StudioOnboardingTourProps {
  steps?: TourStep[];
  autoStart?: boolean;
}

export function StudioOnboardingTour({
  steps = DEFAULT_STEPS,
  autoStart = true,
}: StudioOnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: "top" | "bottom" | "left" | "right" } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Inicializa verificação de primeira visita
  useEffect(() => {
    try {
      const alreadyCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!alreadyCompleted && autoStart) {
        // Pequeno atraso para a página terminar de renderizar o DOM
        const timer = setTimeout(() => {
          setIsActive(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage indisponível
    }
  }, [autoStart]);

  // Listener para evento customizado de abrir tour pelo botão de ajuda
  useEffect(() => {
    const handleOpenTour = () => {
      setCurrentStepIndex(0);
      setIsActive(true);
    };
    window.addEventListener("ello:open-studio-tour", handleOpenTour);
    return () => window.removeEventListener("ello:open-studio-tour", handleOpenTour);
  }, []);

  const currentStep = steps[currentStepIndex];

  // Função para localizar o elemento alvo atual (com fallback para mobile)
  const getTargetElement = useCallback((): HTMLElement | null => {
    if (!currentStep) return null;
    const isMobile = window.innerWidth < 1024;
    if (isMobile && currentStep.mobileTargetId) {
      const mobileEl = document.getElementById(currentStep.mobileTargetId);
      if (mobileEl && mobileEl.offsetParent !== null) return mobileEl;
    }
    const desktopEl = document.getElementById(currentStep.targetId);
    if (desktopEl && desktopEl.offsetParent !== null) return desktopEl;

    // Tentar o alternativo se o principal não estiver visível
    if (currentStep.mobileTargetId) {
      const altEl = document.getElementById(currentStep.mobileTargetId);
      if (altEl && altEl.offsetParent !== null) return altEl;
    }
    return desktopEl;
  }, [currentStep]);

  // Atualiza posição do elemento e do balão de dica
  const updatePosition = useCallback(() => {
    if (!isActive) return;
    const element = getTargetElement();
    if (!element) {
      setTargetRect(null);
      setTooltipPos(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect(rect);

    // Rolar suavemente para a visão caso esteja fora da tela
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    if (!isInViewport) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    // Calcula melhor posicionamento do tooltip
    const isMobile = window.innerWidth < 768;
    const pad = 16;
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 32, 340) : 380;
    const tooltipHeight = 260; // estimativa confortável

    let placement: "top" | "bottom" | "left" | "right" = currentStep?.preferredPlacement || "bottom";

    // Se estiver no mobile, preferimos posicionar centralizado abaixo ou acima
    if (isMobile) {
      const topSpace = rect.top;
      const bottomSpace = window.innerHeight - rect.bottom;
      placement = bottomSpace >= tooltipHeight + 20 ? "bottom" : topSpace >= tooltipHeight + 20 ? "top" : "bottom";

      let top = placement === "bottom" ? rect.bottom + pad : rect.top - tooltipHeight - pad;
      // Garante que não saia da tela verticalmente
      top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));
      const left = Math.max(16, (window.innerWidth - tooltipWidth) / 2);

      setTooltipPos({ top, left, placement });
      return;
    }

    // Desktop: avaliar posicionamento lateral (à direita da sidebar é o preferido para menus)
    if (placement === "right") {
      if (rect.right + tooltipWidth + pad <= window.innerWidth) {
        const top = Math.max(20, Math.min(window.innerHeight - tooltipHeight - 20, rect.top - 10));
        setTooltipPos({ top, left: rect.right + pad, placement: "right" });
        return;
      }
      placement = "bottom";
    }

    if (placement === "top") {
      if (rect.top - tooltipHeight - pad >= 20) {
        const left = Math.max(20, Math.min(window.innerWidth - tooltipWidth - 20, rect.left + rect.width / 2 - tooltipWidth / 2));
        setTooltipPos({ top: rect.top - tooltipHeight - pad, left, placement: "top" });
        return;
      }
      placement = "bottom";
    }

    // Fallback bottom
    const top = Math.min(window.innerHeight - tooltipHeight - 20, rect.bottom + pad);
    const left = Math.max(20, Math.min(window.innerWidth - tooltipWidth - 20, rect.left + rect.width / 2 - tooltipWidth / 2));
    setTooltipPos({ top, left, placement: "bottom" });
  }, [getTargetElement, isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;
    updatePosition();

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isActive, currentStepIndex, updatePosition]);

  // Atalhos de teclado (Escape, Enter, Setas)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "skipped");
    } catch {
      // ignore
    }
  };

  const finishTour = () => {
    setIsActive(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "completed");
    } catch {
      // ignore
    }
  };

  if (!isActive || !currentStep) return null;

  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Dimensões do foco com margem de respiro
  const padOffset = 8;
  const spotTop = targetRect ? Math.max(0, targetRect.top - padOffset) : 0;
  const spotLeft = targetRect ? Math.max(0, targetRect.left - padOffset) : 0;
  const spotWidth = targetRect ? targetRect.width + padOffset * 2 : 0;
  const spotHeight = targetRect ? targetRect.height + padOffset * 2 : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial do painel ELLO"
      className="fixed inset-0 z-[99990] overflow-hidden select-none"
    >
      {/* BOTÃO FIXO "PULAR TUTORIAL" NO CANTO SUPERIOR DIREITO (EXATO REQUISITO) */}
      <div className="fixed top-4 right-4 z-[99999]">
        <button
          type="button"
          onClick={skipTour}
          className="group flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-[#1e201b]/95 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md transition-all duration-150 hover:border-[#d0f25a] hover:bg-[#292b25] hover:text-[#d0f25a] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#d0f25a]"
          title="Encerrar o tutorial guiado (Esc)"
          aria-label="Pular tutorial"
        >
          <span>Pular tutorial</span>
          <span className="grid size-5 place-items-center rounded-full bg-white/10 group-hover:bg-[#d0f25a]/20">
            <X size={13} strokeWidth={2.5} />
          </span>
        </button>
      </div>

      {/* LUZ DE FOCO (SPOTLIGHT / BACKDROP RECORTADO) */}
      {targetRect && (
        <div
          className="pointer-events-none fixed transition-all duration-300 ease-out"
          style={{
            top: `${spotTop}px`,
            left: `${spotLeft}px`,
            width: `${spotWidth}px`,
            height: `${spotHeight}px`,
            borderRadius: "16px",
            // Cria o corte escuro 360 graus e borda luminosa neon
            boxShadow: "0 0 0 9999px rgba(15, 17, 23, 0.78), 0 0 28px rgba(208, 242, 90, 0.45)",
            border: "2.5px solid #d0f25a",
          }}
        >
          {/* Anel pulsante decorativo ao redor da luz de foco */}
          <div className="absolute -inset-1.5 rounded-[20px] border border-[#d0f25a]/40 animate-ping pointer-events-none" />
        </div>
      )}

      {/* BACKDROP DE FALLBACK SE NÃO HOUVER ELEMENTO EM TELA */}
      {!targetRect && (
        <div
          className="fixed inset-0 bg-[#0f1117]/80 backdrop-blur-xs transition-opacity duration-300"
          onClick={skipTour}
        />
      )}

      {/* BALÃO EXPLICATIVO COM SETAS DIRECIONAIS */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          style={{
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
          }}
          className="fixed z-[99995] w-[350px] max-w-[calc(100vw-32px)] transition-all duration-200 ease-out"
        >
          {/* SETA APONTANDO PARA O ELEMENTO */}
          {tooltipPos.placement === "right" && (
            <div
              className="absolute -left-3 top-6 size-0 border-y-[9px] border-y-transparent border-r-[12px] border-r-[#22241d] drop-shadow-md animate-bounce"
              style={{ animationDuration: "1.8s" }}
              aria-hidden="true"
            />
          )}
          {tooltipPos.placement === "left" && (
            <div
              className="absolute -right-3 top-6 size-0 border-y-[9px] border-y-transparent border-l-[12px] border-l-[#22241d] drop-shadow-md animate-bounce"
              style={{ animationDuration: "1.8s" }}
              aria-hidden="true"
            />
          )}
          {tooltipPos.placement === "bottom" && (
            <div
              className="absolute -top-3 left-8 size-0 border-x-[9px] border-x-transparent border-b-[12px] border-b-[#22241d] drop-shadow-md animate-bounce"
              style={{ animationDuration: "1.8s" }}
              aria-hidden="true"
            />
          )}
          {tooltipPos.placement === "top" && (
            <div
              className="absolute -bottom-3 left-8 size-0 border-x-[9px] border-x-transparent border-t-[12px] border-t-[#22241d] drop-shadow-md animate-bounce"
              style={{ animationDuration: "1.8s" }}
              aria-hidden="true"
            />
          )}

          {/* CARD DO CONTEÚDO DO BALÃO */}
          <div className="overflow-hidden rounded-2xl border border-[#3e4235] bg-[#22241d] text-white shadow-2xl backdrop-blur-md">
            {/* CABEÇALHO DO PASSO */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#292b23] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-[#d0f25a] text-[#22241d]">
                  <StepIcon size={15} strokeWidth={2.4} />
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d0f25a]">
                  Passo {currentStepIndex + 1} de {steps.length}
                </span>
              </div>
              <button
                type="button"
                onClick={skipTour}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                title="Pular tutorial"
              >
                <X size={16} />
              </button>
            </div>

            {/* CORPO COM TÍTULO E EXPLICAÇÃO BREVE */}
            <div className="p-4 sm:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#b8baad]">
                {currentStep.badge}
              </div>
              <h3 className="mt-1 text-base font-bold text-white tracking-tight">
                {currentStep.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#d9dbcf]">
                {currentStep.description}
              </p>

              {currentStep.tip && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#3a3d31] bg-[#1a1b15]/70 p-2.5 text-[11px] text-[#c7c9be]">
                  <Sparkles size={14} className="shrink-0 text-[#d0f25a] mt-0.5" />
                  <span>{currentStep.tip}</span>
                </div>
              )}

              {/* BARRA DE PROGRESSO COM PONTOS */}
              <div className="mt-4 flex items-center justify-center gap-1.5">
                {steps.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentStepIndex
                        ? "w-6 bg-[#d0f25a]"
                        : idx < currentStepIndex
                          ? "w-2 bg-white/50"
                          : "w-2 bg-white/20"
                    }`}
                    title={`Ir para passo ${idx + 1}`}
                  />
                ))}
              </div>

              {/* BOTÕES DE NAVEGAÇÃO */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    currentStepIndex === 0
                      ? "opacity-30 cursor-not-allowed text-slate-400"
                      : "text-slate-300 hover:bg-white/10 hover:text-white active:scale-95"
                  }`}
                >
                  <ArrowLeft size={13} />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#d0f25a] px-4 py-2 text-xs font-bold text-[#22241d] shadow-sm transition hover:bg-[#bde343] hover:scale-105 active:scale-95"
                >
                  {isLastStep ? (
                    <>
                      <span>Entendi, vamos lá!</span>
                      <CheckCircle2 size={14} strokeWidth={2.4} />
                    </>
                  ) : (
                    <>
                      <span>Próximo</span>
                      <ArrowRight size={13} strokeWidth={2.4} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Botão discreto para disparar o tour guiado a qualquer momento
 */
export function StudioTourTriggerButton() {
  const openTour = () => {
    window.dispatchEvent(new CustomEvent("ello:open-studio-tour"));
  };

  return (
    <button
      type="button"
      onClick={openTour}
      aria-label="Iniciar tutorial rápido do painel"
      title="Tutorial rápido: veja como usar o painel da ELLO"
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#dedfd6] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-[#c7c9bc] hover:bg-[#fafaf7] hover:text-[#292b25] active:scale-95"
    >
      <HelpCircle size={14} className="text-[#586341]" />
      <span className="hidden sm:inline">Como usar</span>
    </button>
  );
}
