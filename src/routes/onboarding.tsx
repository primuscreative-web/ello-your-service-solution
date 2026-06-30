import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useRef, useState } from "react";

import { ELLO_MEDIA } from "@/lib/ello-media";
import { ElloAppShell } from "@/components/ello/app-shell";
import { ElloEyebrow } from "@/components/ello/primitives";
import { completeOnboarding } from "@/lib/onboarding-state";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const SLIDES = [
  {
    eyebrow: "Para clientes",
    title: (
      <>
        Encontre soluções com <span className="text-primary">rapidez e confiança.</span>
      </>
    ),
    body: "Busque por intenção, veja profissionais qualificados e contrate sem perder tempo.",
    image: ELLO_MEDIA.onboardingClient.src,
    alt: "Cliente usando a ELLO pelo celular",
  },
  {
    eyebrow: "Para profissionais",
    title: (
      <>
        Transforme seu perfil em uma <span className="text-primary">operação completa.</span>
      </>
    ),
    body: "Organize agenda, portfólio, clientes e orçamentos em um ambiente pensado para crescer.",
    image: ELLO_MEDIA.onboardingProfessional.src,
    alt: "Profissional usando a ELLO para divulgar seus serviços",
  },
  {
    eyebrow: "ELLO Link",
    title: (
      <>
        Seu próprio <span className="text-primary">espaço digital.</span>
      </>
    ),
    body: "Cada profissional ganha um link com catálogo, avaliações, agenda e presença online.",
    image: ELLO_MEDIA.onboardingAgenda.src,
    alt: "Agenda e ferramentas profissionais da ELLO",
  },
  {
    eyebrow: "ELLO IA",
    title: (
      <>
        A IA acompanha o seu <span className="text-primary">crescimento.</span>
      </>
    ),
    body: "Sugestões de melhoria, oportunidades e comunicação mais inteligente em cada etapa.",
    image: ELLO_MEDIA.onboardingAssistant.src,
    alt: "Assistente inteligente da ELLO",
  },
] as const;

const SWIPE_THRESHOLD = 42;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  const trackStyle = useMemo(
    () => ({
      transform: `translateX(calc(${-step * 100}% + ${dragOffset}px))`,
    }),
    [dragOffset, step],
  );

  function finish() {
    completeOnboarding();
    void navigate({ to: "/auth" });
  }

  function goTo(nextStep: number) {
    setStep(Math.min(Math.max(nextStep, 0), SLIDES.length - 1));
  }

  function next() {
    if (last) {
      finish();
      return;
    }
    goTo(step + 1);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    dragStartX.current = event.clientX;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (dragStartX.current === null) return;
    const nextOffset = event.clientX - dragStartX.current;
    setDragOffset(Math.max(Math.min(nextOffset, 86), -86));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    dragStartX.current = null;
    setDragOffset(0);

    if (distance < -SWIPE_THRESHOLD && step < SLIDES.length - 1) {
      goTo(step + 1);
      return;
    }
    if (distance > SWIPE_THRESHOLD && step > 0) {
      goTo(step - 1);
    }
  }

  return (
    <ElloAppShell statusBarClassName="text-slate-800">
      <main className="relative flex h-full min-h-[700px] flex-col justify-between ello-mesh-bg">
        <section
          className="relative flex flex-1 touch-pan-y flex-col justify-between overflow-hidden px-7 pb-8 pt-4"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerCancel={() => {
            dragStartX.current = null;
            setDragOffset(0);
          }}
          onPointerUp={handlePointerUp}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-primary/12 to-transparent" />

          <div className="relative z-10 flex flex-1 overflow-hidden">
            <div
              className="flex w-full transition-transform duration-300 ease-out"
              style={trackStyle}
            >
              {SLIDES.map((item) => (
                <article key={item.eyebrow} className="flex min-w-full flex-col justify-between py-2">
                  <div className="min-h-[12.5rem]">
                    <ElloEyebrow className="mb-3">Guia em 4 passos</ElloEyebrow>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary/75">
                      {item.eyebrow}
                    </p>
                    <h1 className="mt-3.5 max-w-[17.8rem] text-[1.75rem] font-black leading-[1.12] tracking-[-0.04em] text-foreground">
                      {item.title}
                    </h1>
                    <p className="mt-3.5 max-w-[18.5rem] text-sm font-medium leading-relaxed text-slate-500">
                      {item.body}
                    </p>
                  </div>

                  <div className="soft-card relative mt-2 overflow-hidden rounded-[2rem] border border-white/80 bg-white/90">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/12" />
                    <img
                      src={item.image}
                      alt={item.alt}
                      draggable={false}
                      className="h-[15.5rem] w-full select-none object-cover"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative z-20 mt-6">
            <div className="mb-5 flex justify-center gap-2.5">
              {SLIDES.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  aria-label={`Ir para onboarding ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition ${
                    index === step ? "w-6 bg-primary shadow-[0_0_18px_rgba(15,111,255,0.28)]" : "w-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Deslize ou toque para avançar
            </div>
            <div className="mb-3 rounded-[20px] border border-white/70 bg-white/70 px-4 py-3 text-center text-[11px] font-semibold text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              Cada etapa foi pensada para deixar sua primeira experiência mais fluida.
            </div>
            <button
              type="button"
              onClick={next}
              className="ello-btn-primary btn-tactile"
            >
              {last ? "Começar" : "Próximo"}
            </button>

            <button
              type="button"
              onClick={finish}
              className="btn-tactile mt-3 h-10 w-full text-center text-sm font-bold text-slate-400 hover:text-slate-500"
            >
              Pular
            </button>
          </div>
        </section>
      </main>
    </ElloAppShell>
  );
}
