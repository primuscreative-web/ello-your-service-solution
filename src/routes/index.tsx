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
<<<<<<< HEAD
    <ElloAppShell statusBarClassName="text-white">
      <main className="relative flex h-full min-h-[720px] flex-col justify-between overflow-hidden bg-[#050b18] text-white">
        {/* Background Image and Overlays */}
        <img
          src={ELLO_MEDIA.splash.src}
          alt=""
          className="pointer-events-none absolute inset-0 -z-20 size-full object-cover opacity-60 scale-105"
        />
        
        {/* Animated Radial Gradients */}
        <div className="absolute inset-0 -z-15 bg-gradient-to-b from-[#030611]/70 via-[#051c72]/30 to-[#020409]/95" />
        <div className="ambient-blob-1 opacity-40" />
        <div className="ambient-blob-2 opacity-30" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex flex-col items-center pt-10 text-center animate-reveal">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#0052ff] to-[#8a3ffc] opacity-30 blur-lg" />
            <ElloLogo tone="white" className="relative w-20 h-auto" />
=======
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-background px-6 pb-12 pt-16">
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-3 p-4 opacity-20">
        {PROFESSIONS.map((p, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-2xl bg-white text-3xl animate-reveal"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {p.icon}
>>>>>>> 3fc0f0d (Refine ELLO positioning across onboarding and home)
          </div>
          <span className="mt-3.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#00a3ff]">
            <Sparkles className="size-3 text-[#00a3ff]" />
            Infraestrutura de Serviços
          </span>
        </div>

<<<<<<< HEAD
        {/* Floating Premium Card Simulation */}
        <div className="relative z-10 mx-5 my-auto flex flex-col items-center justify-center animate-reveal" style={{ animationDelay: "150ms" }}>
          <div className="w-full rounded-[28px] border border-white/15 bg-black/40 p-5 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#0062ff] to-[#00a3ff] text-white shadow-lg">
                <ShieldCheck className="size-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black tracking-tight text-white/95">Profissionais Verificados</h3>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="size-3 fill-[#ffa900] text-[#ffa900]" />
                  <Star className="size-3 fill-[#ffa900] text-[#ffa900]" />
                  <Star className="size-3 fill-[#ffa900] text-[#ffa900]" />
                  <Star className="size-3 fill-[#ffa900] text-[#ffa900]" />
                  <Star className="size-3 fill-[#ffa900] text-[#ffa900]" />
                  <span className="text-[10px] font-bold text-white/60 ml-1">(4.9/5 estrelas)</span>
                </div>
              </div>
            </div>
            <p className="mt-3.5 text-[11px] leading-relaxed text-white/80 font-medium">
              Clientes encontram soluções, profissionais organizam agenda, portfólio e crescimento com o suporte da ELLO IA.
            </p>
          </div>
        </div>
=======
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <ElloLogo className="text-6xl" />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {['Cliente', 'Profissional', 'ELLO IA'].map((item) => (
            <span key={item} className="rounded-full border border-border bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 max-w-xs text-balance text-base text-muted-foreground">
          A infraestrutura digital que conecta clientes, profissionais e crescimento com IA.
        </p>
        <div className="mt-6 grid w-full gap-2 text-left">
          {[
            { title: 'Agenda', body: 'Agendamento inteligente para horários e urgências.' },
            { title: 'Portfólio', body: 'Seu perfil, catálogo e link profissional em um só lugar.' },
            { title: 'CRM', body: 'Clientes, histórico e oportunidades organizados.' },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-border bg-white/80 p-3 shadow-sm">
              <p className="text-sm font-black text-foreground">{card.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
>>>>>>> 3fc0f0d (Refine ELLO positioning across onboarding and home)

        {/* Footer Actions */}
        <div className="relative z-10 mt-auto space-y-4 px-6 pb-12 animate-reveal" style={{ animationDelay: "300ms" }}>
          <div className="space-y-2 text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight leading-tight">
              Tudo o que você precisa,<br />
              <span className="bg-gradient-to-r from-[#00a3ff] to-[#6d9fff] bg-clip-text text-transparent">em um único link.</span>
            </h1>
            <p className="text-xs text-white/70 font-medium">
              Agenda, portfólio, CRM e IA para fazer seu trabalho crescer.
            </p>
          </div>

          <Link
            to="/onboarding"
            className="btn-tactile flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0052ff] to-[#007aff] text-sm font-black text-white shadow-[0_16px_36px_rgba(0,82,255,0.35)] transition-all"
          >
            Começar
            <ArrowRight className="size-4" />
          </Link>
          
          <Link 
            to="/auth" 
            className="btn-tactile block py-2.5 text-center text-xs font-bold text-white/70 hover:text-white transition-colors"
          >
            Já tem uma conta? <span className="text-[#00a3ff] font-extrabold">Entrar</span>
          </Link>
        </div>
      </main>
    </ElloAppShell>
  );
}
