import { useState, type ReactNode } from "react";
import { LockKeyhole, Sparkles } from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";

export function PlanFeatureGate({
  minimumPlan = "pro",
  feature,
  children,
}: {
  minimumPlan?: "pro" | "business";
  feature: string;
  children: ReactNode;
}) {
  const { planSubscription } = useLocalHub();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const levels = { free: 0, pro: 1, business: 2 } as const;
  const current = planSubscription.status === "active" ? planSubscription.plan : "free";

  if (levels[current] >= levels[minimumPlan]) return children;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        <div aria-hidden="true" className="pointer-events-none select-none blur-[2px] opacity-45">
          {children}
        </div>
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-[#151712]/80 p-5 text-center text-white transition hover:bg-[#151712]/90"
          aria-label={`${feature} disponível no plano ${minimumPlan === "pro" ? "Pro" : "Business"}. Ver opções de upgrade.`}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4f455]/40 bg-[#d4f455]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#d4f455]">
            <LockKeyhole size={12} /> ELLO {minimumPlan.toUpperCase()}
          </span>
          <span className="text-sm font-semibold">{feature}</span>
          <span className="text-xs text-white/70">Toque para conhecer os planos</span>
        </button>
      </div>
      {showUpgrade && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-gate-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#181a15] p-6 text-center text-white shadow-2xl">
            <Sparkles className="mx-auto text-[#d4f455]" size={26} />
            <h2 id="plan-gate-title" className="mt-3 text-lg font-bold">
              Desbloqueie {feature}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Esse recurso está incluído no plano {minimumPlan === "pro" ? "Pro" : "Business"} da
              ELLO.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold"
              >
                Agora não
              </button>
              <a
                href="/planos"
                className="flex-1 rounded-xl bg-[#d4f455] px-4 py-2.5 text-sm font-bold text-[#171914]"
              >
                Ver planos
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
