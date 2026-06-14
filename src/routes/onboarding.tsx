import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const SLIDES = [
  {
    eyebrow: "Clientes",
    title: "Contrate profissionais de confiança.",
    body: "Encontre milhares de profissionais avaliados pela comunidade ELLO.",
    accent: "⚡",
  },
  {
    eyebrow: "Profissionais",
    title: "Organize e divulgue seus serviços.",
    body: "Crie seu perfil profissional em poucos minutos com a ajuda da IA.",
    accent: "📈",
  },
  {
    eyebrow: "Tudo em um só lugar",
    title: "Agenda, portfólio e clientes integrados.",
    body: "Tudo que você precisa para trabalhar melhor e crescer mais rápido.",
    accent: "🗂️",
  },
  {
    eyebrow: "ELLO IA",
    title: "A IA trabalha junto com você.",
    body: "Automatize tarefas, encontre oportunidades e cresça com inteligência.",
    accent: "✨",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-8 bg-foreground" : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
        <Link to="/auth" className="text-sm font-medium text-muted-foreground">
          Pular
        </Link>
      </div>

      <div key={step} className="animate-reveal flex flex-1 flex-col justify-center">
        <div className="mb-8 flex h-48 w-48 items-center justify-center self-center rounded-[3rem] bg-primary/10 text-7xl">
          {slide.accent}
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-primary">
          {slide.eyebrow}
        </span>
        <h2 className="font-display mt-2 text-3xl font-extrabold leading-tight tracking-tight">
          {slide.title}
        </h2>
        <p className="mt-3 text-base text-muted-foreground">{slide.body}</p>
      </div>

      <button
        onClick={() => (last ? navigate({ to: "/auth" }) : setStep(step + 1))}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-foreground font-semibold text-background transition-transform active:scale-[0.98]"
      >
        {last ? "Criar minha conta" : "Próximo"}
      </button>
    </div>
  );
}