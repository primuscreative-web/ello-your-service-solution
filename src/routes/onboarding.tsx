import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useMemo, useRef, useState } from "react";

import { ELLO_MEDIA } from "@/lib/ello-media";
import { ElloAppShell } from "@/components/ello/app-shell";
import { completeOnboarding } from "@/lib/onboarding-state";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const SLIDES = [
  {
    eyebrow: "Para clientes",
    title: (
      <>
        Contrate profissionais de <span className="text-primary">confiança.</span>
      </>
    ),
    body: "Peça um serviço, acompanhe o atendimento e fale com o profissional pelo celular.",
    image: ELLO_MEDIA.onboardingClient.src,
    alt: "Cliente usando a ELLO pelo celular",
  },
  {
    eyebrow: "Para profissionais",
    title: (
      <>
        Organize e <span className="text-primary">divulgue</span> seus serviços.
      </>
    ),
    body: "Monte seu perfil, mostre seu portfólio e transforme contatos em clientes reais.",
    image: ELLO_MEDIA.onboardingProfessional.src,
    alt: "Profissional usando a ELLO para divulgar seus serviços",
  },
  {
    eyebrow: "Rotina simples",
    title: (
      <>
        Agenda, portfólio e clientes em um <span className="text-primary">só lugar.</span>
      </>
    ),
    body: "Veja horários, pedidos e clientes em uma rotina mais organizada e profissional.",
    image: ELLO_MEDIA.onboardingAgenda.src,
    alt: "Agenda e ferramentas profissionais da ELLO",
  },
  {
    eyebrow: "Assistente ELLO",
    title: (
      <>
        A IA da ELLO trabalha junto com <span className="text-primary">você.</span>
      </>
    ),
    body: "Automatize tarefas, responda mais rápido e encontre novas oportunidades.",
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
      <main className="relative flex h-full min-h-[700px] flex-col justify-between bg-[#f7fbff]">
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
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-primary/10 to-transparent" />

          <div className="relative z-10 flex flex-1 overflow-hidden">
            <div
              className="flex w-full transition-transform duration-300 ease-out"
              style={trackStyle}
            >
              {SLIDES.map((item) => (
                <article key={item.eyebrow} className="flex min-w-full flex-col justify-between py-2">
                  <div className="min-h-[12.5rem]">
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

                  <div className="relative mt-2 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
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
            <div className="mb-6 flex justify-center gap-2.5">
              {SLIDES.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  aria-label={`Ir para onboarding ${index + 1}`}
                  onClick={() => goTo(index)}
                  className={`h-2 rounded-full transition ${
                    index === step ? "w-6 bg-primary" : "w-2 bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="btn-tactile h-14 w-full rounded-2xl bg-primary text-base font-bold text-white shadow-[0_14px_34px_rgba(0,58,255,0.225)]"
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
