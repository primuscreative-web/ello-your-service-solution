import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { completeOnboarding } from "@/lib/onboarding-state";
import { ELLO_MEDIA } from "@/lib/ello-media";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const SLIDES = [
  {
    title: (
      <>
        Contrate profissionais de <span className="text-primary">confiança.</span>
      </>
    ),
    body: "Encontre milhares de profissionais avaliados pela comunidade.",
    image: ELLO_MEDIA.onboardingClient.src,
    alt: "Cliente usando o celular para contratar profissionais",
    imageClassName: "right-[-3.2rem] bottom-24 h-[54%]",
  },
  {
    title: (
      <>
        Organize e <span className="text-primary">divulgue</span> seus serviços.
      </>
    ),
    body: "Crie seu perfil profissional e encontre mais clientes.",
    image: ELLO_MEDIA.onboardingProfessional.src,
    alt: "Profissional organizando serviços pelo celular",
    imageClassName: "right-[-2.7rem] bottom-20 h-[57%]",
  },
  {
    title: (
      <>
        Agenda, portfólio e clientes em um <span className="text-primary">só lugar.</span>
      </>
    ),
    body: "Tudo que você precisa para trabalhar melhor.",
    image: ELLO_MEDIA.onboardingAgenda.src,
    alt: "Interface de agenda da ELLO",
    imageClassName: "right-[-2.1rem] bottom-28 h-[48%]",
  },
  {
    title: (
      <>
        A IA da ELLO trabalha junto com <span className="text-primary">você.</span>
      </>
    ),
    body: "Automatize tarefas e encontre oportunidades.",
    image: ELLO_MEDIA.onboardingAssistant.src,
    alt: "Assistente inteligente da ELLO",
    imageClassName: "right-[-1.7rem] bottom-28 h-[43%]",
  },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  function finish() {
    completeOnboarding();
    void navigate({ to: "/auth" });
  }

  function next() {
    if (last) {
      finish();
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-white">
      <section className="relative flex min-h-dvh flex-col overflow-hidden px-7 pb-[calc(1.6rem+env(safe-area-inset-bottom))] pt-[calc(4.4rem+env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute inset-x-6 bottom-[10.6rem] h-[38%] rounded-[45%] bg-primary/8 blur-sm" />

        <div key={step} className="animate-reveal relative z-10">
          <h1 className="max-w-[18rem] text-[2rem] font-black leading-[1.18] tracking-[-0.04em] text-foreground">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-[15.5rem] text-[1.03rem] leading-relaxed text-muted-foreground">
            {slide.body}
          </p>
        </div>

        <img
          key={slide.image}
          src={slide.image}
          alt={slide.alt}
          className={`animate-reveal pointer-events-none absolute z-0 w-auto max-w-none object-contain ${slide.imageClassName}`}
        />

        <div className="relative z-10 mt-auto">
          <div className="mb-10 flex justify-center gap-3">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir para onboarding ${index + 1}`}
                onClick={() => setStep(index)}
                className={`size-2.5 rounded-full transition ${
                  index === step ? "w-6 bg-primary" : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-white shadow-[0_14px_34px_rgba(0,58,255,0.22)] transition active:scale-[0.99]"
          >
            {last ? "Começar" : "Próximo"}
          </button>

          <button
            type="button"
            onClick={finish}
            className="mt-5 h-10 w-full text-center text-base font-semibold text-muted-foreground"
          >
            Pular
          </button>
        </div>
      </section>
    </main>
  );
}
