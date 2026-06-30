import { createFileRoute, Link } from "@tanstack/react-router";
import { ElloLogo } from "@/components/ello/logo";
import { ElloAppShell } from "@/components/ello/app-shell";
import { ELLO_MEDIA } from "@/lib/ello-media";
import { ArrowRight, ShieldCheck, Sparkles, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  return (
    <ElloAppShell statusBarClassName="text-white" dark>
      <main className="relative flex h-full min-h-[720px] flex-col justify-between overflow-hidden text-white">
        <img
          src={ELLO_MEDIA.splash.src}
          alt=""
          className="pointer-events-none absolute inset-0 -z-20 size-full object-cover opacity-30 scale-105"
        />

        <div className="absolute inset-0 -z-15 bg-[radial-gradient(ellipse_70%_50%_at_20%_15%,oklch(0.45_0.18_250_/_0.4),transparent_50%),radial-gradient(ellipse_50%_40%_at_85%_10%,oklch(0.42_0.16_285_/_0.3),transparent_45%),linear-gradient(180deg,oklch(0.14_0.04_264_/_0.15),oklch(0.12_0.045_264_/_0.92))]" />
        <div className="ambient-blob-1 opacity-35" />
        <div className="ambient-blob-2 opacity-25" />

        <div className="relative z-10 flex flex-col items-center pt-10 text-center animate-reveal">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[oklch(0.62_0.22_250)] to-[oklch(0.58_0.22_285)] opacity-25 blur-2xl" />
            <ElloLogo tone="white" className="relative h-auto w-20" />
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[oklch(0.82_0.1_230)] backdrop-blur-md">
            <Sparkles className="size-3" />
            Infraestrutura profissional
          </span>
        </div>

        <div className="relative z-10 mx-5 my-auto flex flex-col items-center justify-center animate-reveal" style={{ animationDelay: "150ms" }}>
          <div className="w-full rounded-[1.875rem] border border-white/12 bg-white/8 p-5 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl apple-gradient text-white shadow-[0_12px_28px_-8px_oklch(0.56_0.24_264_/_0.5)]">
                <ShieldCheck className="size-6" />
              </div>
              <div className="min-w-0 text-left">
                <h3 className="text-xs font-black tracking-tight text-white/95">Experiência refinada</h3>
                <div className="mt-1 flex items-center gap-0.5">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className="size-3 fill-[oklch(0.82_0.12_80)] text-[oklch(0.82_0.12_80)]" />
                  ))}
                  <span className="ml-1 text-[10px] font-bold text-white/55">4.9 · profissionais</span>
                </div>
              </div>
            </div>
            <p className="mt-3.5 text-[11px] leading-relaxed font-medium text-white/75">
              Agenda, portfólio, CRM e IA em um único ecossistema pensado para quem trabalha por conta própria.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Agenda inteligente", "ELLO Link", "CRM integrado"].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto space-y-4 px-6 pb-12 animate-reveal" style={{ animationDelay: "300ms" }}>
          <div className="mb-6 space-y-2 text-center">
            <h1 className="ello-display text-white">
              Tudo o que você precisa,
              <br />
              <span className="apple-text-gradient">em um único link.</span>
            </h1>
            <p className="text-xs font-medium text-white/60">
              A infraestrutura digital para profissionais autônomos.
            </p>
          </div>

          <Link to="/onboarding" className="ello-btn-primary btn-tactile">
            Começar
            <ArrowRight className="size-4" />
          </Link>

          <Link to="/auth" className="btn-tactile block py-2.5 text-center text-xs font-bold text-white/60 transition-colors hover:text-white">
            Já tem uma conta? <span className="font-extrabold text-[oklch(0.82_0.1_230)]">Entrar</span>
          </Link>
        </div>
      </main>
    </ElloAppShell>
  );
}
