import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Crown,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";
import { getPlanName } from "@/lib/plan-access";

const planHighlights = {
  pro: [
    "Equipe e acessos individuais",
    "CRM e relacionamento com clientes",
    "Portfólio com vídeos",
  ],
  business: [
    "Tudo do Pro, incluído",
    "Filiais e operação em escala",
    "Automação WhatsApp e recursos de alimentação",
  ],
} as const;

export function PlanFeatureGate({
  minimumPlan = "pro",
  feature,
  children,
}: {
  minimumPlan?: "pro" | "business";
  feature: string;
  children: ReactNode;
}) {
  const { planSubscription, ready, planStatusError, refresh } = useLocalHub();

  if (!ready) {
    return (
      <div
        className="grid min-h-[min(68vh,620px)] place-items-center rounded-[2rem] border border-[#e4e3da] bg-[#f8f7f2] p-6"
        aria-label="Verificando o acesso ao plano"
        aria-busy="true"
      >
        <div className="w-full max-w-lg space-y-5 rounded-3xl border border-[#e7e6de] bg-white p-7 shadow-sm">
          <div className="size-12 animate-pulse rounded-2xl bg-[#ecefe3]" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-[#efeee8]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#f3f2ed]" />
          <div className="h-12 w-40 animate-pulse rounded-xl bg-[#efeee8]" />
        </div>
      </div>
    );
  }

  if (planStatusError) {
    return (
      <section
        className="mx-auto grid min-h-[min(68vh,620px)] w-full max-w-5xl place-items-center rounded-[2rem] border border-[#e4e3da] bg-[#f8f7f2] p-5 sm:p-10"
        aria-labelledby="plan-check-title"
      >
        <div className="w-full max-w-xl rounded-[1.75rem] border border-amber-200 bg-white p-7 shadow-[0_24px_80px_-48px_rgba(54,48,22,.35)] sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <CircleAlert size={22} />
          </span>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[.2em] text-amber-700">
            Verificação temporariamente indisponível
          </p>
          <h1
            id="plan-check-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-[#20221f] sm:text-3xl"
          >
            Não conseguimos confirmar seu plano
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#696b63]">
            Seu acesso não foi alterado. Verifique a conexão e tente novamente para continuar usando{" "}
            {feature.toLocaleLowerCase("pt-BR")}.
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#20221f] px-5 text-sm font-semibold text-white transition hover:bg-[#34372f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#687348]"
          >
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const planLabel = getPlanName(minimumPlan);
  const highlights = planHighlights[minimumPlan];

  return (
    <section
      className="relative isolate mx-auto grid min-h-[min(72vh,680px)] w-full max-w-6xl place-items-center overflow-hidden rounded-[2rem] border border-[#dfe1d3] bg-[#f2f2eb] p-4 sm:p-8 lg:p-12"
      aria-labelledby="plan-gate-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-32 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(208,242,90,.36),rgba(208,242,90,0)_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-44 -left-32 size-[32rem] rounded-full bg-[radial-gradient(circle,rgba(104,115,72,.16),rgba(104,115,72,0)_68%)]"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-[#35382e] bg-[#191b16] text-white shadow-[0_34px_90px_-42px_rgba(20,22,16,.65)] lg:grid-cols-[1.1fr_.9fr]">
        <div className="relative flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[.055] [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(135deg,#000,transparent_78%)]"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4f455]/25 bg-[#d4f455]/[.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-[#d4f455]">
                <LockKeyhole size={12} /> Recurso exclusivo
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-white/55">
                Plano atual ·{" "}
                {getPlanName(planSubscription.status === "active" ? planSubscription.plan : "free")}
              </span>
            </div>

            <div className="mt-9 flex size-[4.25rem] items-center justify-center rounded-[1.35rem] border border-[#d4f455]/25 bg-gradient-to-br from-[#d4f455]/20 to-[#d4f455]/[.04] text-[#d4f455] shadow-[inset_0_1px_rgba(255,255,255,.12)]">
              <Crown size={29} strokeWidth={1.6} />
            </div>
            <p className="mt-7 text-[11px] font-bold uppercase tracking-[.2em] text-[#d4f455]">
              ELLO {planLabel}
            </p>
            <h1
              id="plan-gate-title"
              className="mt-2 max-w-xl text-[2rem] font-semibold leading-[1.08] tracking-[-.04em] sm:text-[2.75rem]"
            >
              Seu próximo nível de gestão começa aqui.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-[15px]">
              {feature} faz parte do plano {planLabel}. Desbloqueie uma operação mais completa e
              continue evoluindo com a ELLO.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/planos"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#d4f455] px-5 text-sm font-bold text-[#1d2117] shadow-[0_8px_24px_-12px_rgba(212,244,85,.7)] transition hover:-translate-y-0.5 hover:bg-[#e0fb72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4f455]"
              >
                Conhecer o {planLabel}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                to="/studio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/75 transition hover:border-white/30 hover:bg-white/[.05] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Voltar ao painel
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-white/40">
              <Sparkles size={13} className="text-[#d4f455]/80" /> O acesso é liberado após a
              confirmação da assinatura.
            </p>
          </div>
        </div>

        <aside
          className="relative flex flex-col justify-center border-t border-white/[.08] bg-white/[.025] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12"
          aria-label={`Recursos do plano ${planLabel}`}
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/40">
                Incluído no plano
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                {planLabel}
                <span className="ml-2 text-sm font-medium text-white/40">ELLO</span>
              </h2>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.05] text-[#d4f455]">
              <Sparkles size={19} />
            </span>
          </div>

          <ul className="space-y-3">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/[.07] bg-black/10 px-3.5 py-3 text-[13px] leading-5 text-white/80"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#d4f455]/10 text-[#d4f455]">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-[#d4f455]/15 bg-[#d4f455]/[.045] p-4">
            <p className="text-xs font-semibold text-[#d4f455]">Feito para crescer com você</p>
            <p className="mt-1.5 text-xs leading-5 text-white/50">
              Compare os recursos e escolha o momento certo para evoluir seu negócio.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
