import { createFileRoute } from "@tanstack/react-router";
import { Car, KeyRound, ShowerHead, Siren, Wrench, Zap } from "lucide-react";
import { PrimaryButton } from "@/components/ello/actions";
import { ElloEyebrow, ElloSurface } from "@/components/ello/primitives";
import { DarkHeroCard, ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";

export const Route = createFileRoute("/app/express")({
  component: Express,
});

const URGENT = [
  { icon: KeyRound, label: "Chaveiro" },
  { icon: Wrench, label: "Encanador" },
  { icon: Zap, label: "Eletricista" },
  { icon: Car, label: "Guincho" },
  { icon: ShowerHead, label: "Desentupimento" },
  { icon: Siren, label: "Urgente" },
];

function Express() {
  return (
    <ScreenPage>
      <ScreenHeader title="ELLO Express" subtitle="Atendimento urgente" backTo="/app" />

      <ScreenMain>
        <DarkHeroCard
          eyebrow="Atendimento rápido"
          title="Precisa agora?"
          description="Disparamos sua solicitação para profissionais próximos. O primeiro disponível assume o atendimento."
          icon={<Siren className="size-5 text-cyan-300" />}
        />

        <ElloSurface className="p-4">
          <ElloEyebrow className="mb-3">Categorias urgentes</ElloEyebrow>
          <div className="grid grid-cols-3 gap-2">
            {URGENT.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className="btn-tactile flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-[1.125rem] border border-border/70 bg-white/80 p-2 text-center transition hover:border-primary/35 hover:shadow-[var(--ello-shadow-sm)]"
                >
                  <Icon className="size-6 text-primary" />
                  <span className="text-center text-[10px] font-black">{item.label}</span>
                </button>
              );
            })}
          </div>
        </ElloSurface>

        <ElloSurface className="p-4">
          <h2 className="ello-section-title">Descreva sua emergência</h2>
          <textarea
            rows={4}
            placeholder="Ex: O disjuntor caiu e preciso de atendimento hoje..."
            className="ello-textarea mt-3"
          />
          <PrimaryButton type="button" className="mt-4 !h-12">
            Solicitar atendimento urgente
          </PrimaryButton>
          <p className="mt-3 text-center text-[10px] font-medium text-muted-foreground">
            Funcionalidade em desenvolvimento — em breve com geolocalização
          </p>
        </ElloSurface>
      </ScreenMain>
    </ScreenPage>
  );
}
