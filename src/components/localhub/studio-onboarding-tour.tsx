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
  ChevronRight,
  ChevronLeft,
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
      "Registre vendas rápidas de balcão ou atendimentos presenciais, receba em Pix, cartão ou dinheiro e envie comprovante no WhatsApp.",
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
      "Consulte a lista de clientes, histórico de compras, preferências (corte, pet, ficha clínica) e envie mensagens no WhatsApp.",
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
}

export function StudioOnboardingTour({ steps = DEFAULT_STEPS }: StudioOnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom" | "left" | "right";
    arrowOffsetTop?: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // O tutorial SÓ deve abrir automaticamente se o usuário tiver acabado de finalizar o cadastro!
  useEffect(() => {
    try {
      const shouldTrigger = sessionStorage.getItem("ello_show_onboarding_tour") === "true";
      if (shouldTrigger) {
        sessionStorage.removeItem("ello_show_onboarding_tour");
        localStorage.setItem(TOUR_STORAGE_KEY, "completed");
        const timer = setTimeout(() => {
          setCurrentStepIndex(0);
          setIsActive(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listener para evento customizado disparado em Configurações > Tutorial
  useEffect(() => {
    const handleOpenTour = () => {
      setCurrentStepIndex(0);
      setIsActive(true);
    };
    window.addEventListener("ello:open-studio-tour", handleOpenTour);
    return () => window.removeEventListener("ello:open-studio-tour", handleOpenTour);
  }, []);

  const currentStep = steps[currentStepIndex];

  // Localiza elemento alvo atual
  const getTargetElement = useCallback((): HTMLElement | null => {
    if (!currentStep) return null;
    const isMobile = window.innerWidth < 1024;
    if (isMobile && currentStep.mobileTargetId) {
      const mobileEl = document.getElementById(currentStep.mobileTargetId);
      if (mobileEl && mobileEl.offsetParent !== null) return mobileEl;
    }
    const desktopEl = document.getElementById(currentStep.targetId);
    if (desktopEl && desktopEl.offsetParent !== null) return desktopEl;

    if (currentStep.mobileTargetId) {
      const altEl = document.getElementById(currentStep.mobileTargetId);
      if (altEl && altEl.offsetParent !== null) return altEl;
    }
    return desktopEl;
  }, [currentStep]);

  // Atualiza posição do elemento e do balão com cálculo anti-corte estrito
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

    // Rola suavemente até o elemento se estiver fora da viewport
    const isInViewport =
      rect.top >= 20 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight - 20 &&
      rect.right <= window.innerWidth;

    if (!isInViewport) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    const isMobile = window.innerWidth < 768;
    const pad = 16;
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 32, 340) : 380;
    // Mede a altura real do balão ou usa estimativa segura de 380px
    const tooltipHeight = tooltipRef.current?.offsetHeight || 370;

    let placement: "top" | "bottom" | "left" | "right" = currentStep?.preferredPlacement || "bottom";

    // MOBILE: sempre centralizado horizontalmente, empurrado para dentro da viewport
    if (isMobile) {
      const bottomSpace = window.innerHeight - rect.bottom;
      placement = bottomSpace >= tooltipHeight + 20 ? "bottom" : "top";

      let top = placement === "bottom" ? rect.bottom + pad : rect.top - tooltipHeight - pad;
      // Garante que o balão e os botões NUNCA fiquem cortados
      top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));
      const left = Math.max(16, (window.innerWidth - tooltipWidth) / 2);

      setTooltipPos({ top, left, placement });
      return;
    }

    // DESKTOP: posicionamento lateral (à direita dos menus)
    if (placement === "right") {
      if (rect.right + tooltipWidth + pad <= window.innerWidth) {
        // Cálculo anti-corte vertical:
        // Se o elemento estiver perto da base da janela, sobe o balão para que seu rodapé fique 100% visível!
        let top: number;
        if (rect.top > window.innerHeight - tooltipHeight - 40) {
          // Alinha pela base ou sobe garantindo respiro de 24px no fundo da tela
          top = Math.max(20, window.innerHeight - tooltipHeight - 24);
        } else {
          top = Math.max(20, rect.top - 10);
        }

        // Calcula offset da seta para apontar exatamente para o centro do item
        const arrowOffsetTop = Math.max(20, Math.min(tooltipHeight - 35, rect.top + rect.height / 2 - top));

        setTooltipPos({
          top,
          left: rect.right + pad,
          placement: "right",
          arrowOffsetTop,
        });
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

    // Fallback bottom (garantindo que nunca ultrapasse a janela)
    const top = Math.max(20, Math.min(window.innerHeight - tooltipHeight - 20, rect.bottom + pad));
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

  // Teclas de atalho (Escape, Enter, Setas)
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
  };

  const finishTour = () => {
    setIsActive(false);
  };

  if (!isActive || !currentStep) return null;

  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Dimensões do foco luminoso
  const padOffset = 6;
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
      {/* BOTÃO FIXO "PULAR TUTORIAL" NO CANTO SUPERIOR DIREITO */}
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
          onClick={nextStep}
          title="Clique para ir para o próximo passo"
          className="cursor-pointer fixed transition-all duration-300 ease-out"
          style={{
            top: `${spotTop}px`,
            left: `${spotLeft}px`,
            width: `${spotWidth}px`,
            height: `${spotHeight}px`,
            borderRadius: "16px",
            boxShadow: "0 0 0 9999px rgba(15, 17, 23, 0.78), 0 0 28px rgba(208, 242, 90, 0.45)",
            border: "2.5px solid #d0f25a",
          }}
        >
          <div className="absolute -inset-1.5 rounded-[20px] border border-[#d0f25a]/40 animate-ping pointer-events-none" />
        </div>
      )}

      {/* BACKDROP DE FALLBACK */}
      {!targetRect && (
        <div
          className="fixed inset-0 bg-[#0f1117]/80 backdrop-blur-xs transition-opacity duration-300"
          onClick={skipTour}
        />
      )}

      {/* BALÃO EXPLICATIVO COM DESIGN FLEXÍVEL E CONTROLES DUPLOS (TOPO E BASE) */}
      {tooltipPos && (
        <div
          ref={tooltipRef}
          style={{
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`,
          }}
          className="fixed z-[99995] w-[360px] max-w-[calc(100vw-32px)] transition-all duration-200 ease-out"
        >
          {/* SETA DINÂMICA APONTANDO PARA O ELEMENTO */}
          {tooltipPos.placement === "right" && (
            <div
              style={{ top: `${tooltipPos.arrowOffsetTop ?? 32}px` }}
              className="absolute -left-3 size-0 border-y-[9px] border-y-transparent border-r-[12px] border-r-[#22241d] drop-shadow-md animate-bounce"
              aria-hidden="true"
            />
          )}
          {tooltipPos.placement === "left" && (
            <div
              style={{ top: `${tooltipPos.arrowOffsetTop ?? 32}px` }}
              className="absolute -right-3 size-0 border-y-[9px] border-y-transparent border-l-[12px] border-l-[#22241d] drop-shadow-md animate-bounce"
              aria-hidden="true"
            />
          )}
          {tooltipPos.placement === "bottom" && (
            <div
              className="absolute -top-3 left-8 size-0 border-x-[9px] border-x-transparent border-b-[12px] border-b-[#22241d] drop-shadow-md animate-bounce"
              aria-hidden="true"
            />
          )}
          {tooltipPos.placement === "top" && (
            <div
              className="absolute -bottom-3 left-8 size-0 border-x-[9px] border-x-transparent border-t-[12px] border-t-[#22241d] drop-shadow-md animate-bounce"
              aria-hidden="true"
            />
          )}

          {/* CARD CONTAINER COM SCROLL INTERNO ANTI-CORTE */}
          <div className="flex flex-col max-h-[calc(100vh-48px)] overflow-hidden rounded-2xl border border-[#3e4235] bg-[#22241d] text-white shadow-2xl backdrop-blur-md">
            {/* CABEÇALHO COM CONTROLES COMPACTOS (GARANTIA DE PASSAGEM MESMO EM TELAS PEQUENAS) */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#292b23] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-[#d0f25a] text-[#22241d]">
                  <StepIcon size={14} strokeWidth={2.4} />
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d0f25a]">
                  {currentStepIndex + 1} de {steps.length}
                </span>
              </div>

              {/* CONTROLES DE AVANÇO COMPACTOS NO TOPO */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className={`grid size-7 place-items-center rounded-lg transition ${
                    currentStepIndex === 0
                      ? "opacity-20 cursor-not-allowed"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                  title="Passo anterior"
                  aria-label="Passo anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="grid size-7 place-items-center rounded-lg bg-[#d0f25a] text-[#22241d] hover:bg-[#bde343] transition font-bold"
                  title="Próximo passo"
                  aria-label="Próximo passo"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={skipTour}
                  className="ml-1 grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                  title="Fechar tutorial"
                  aria-label="Fechar tutorial"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* CORPO DO TEXTO COM SCROLL CASO A JANELA SEJA BAIXA */}
            <div className="overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8baad]">
                {currentStep.badge}
              </div>
              <h3 className="mt-0.5 text-base font-bold text-white tracking-tight">
                {currentStep.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#d9dbcf]">
                {currentStep.description}
              </p>

              {currentStep.tip && (
                <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-[#3a3d31] bg-[#1a1b15]/70 p-2.5 text-[11px] text-[#c7c9be]">
                  <Sparkles size={13} className="shrink-0 text-[#d0f25a] mt-0.5" />
                  <span>{currentStep.tip}</span>
                </div>
              )}

              {/* PONTINHOS DE PROGRESSO */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
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
            </div>

            {/* RODAPÉ SEMPRE VISÍVEL COM BOTÕES LARGOS */}
            <div className="shrink-0 flex items-center justify-between gap-2 border-t border-white/10 bg-[#292b23] px-4 py-2.5">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  currentStepIndex === 0
                    ? "opacity-25 cursor-not-allowed text-slate-400"
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
      )}
    </div>
  );
}
