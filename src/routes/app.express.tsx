import { createFileRoute } from "@tanstack/react-router";
import { Car, KeyRound, ShowerHead, Siren, Wrench, Zap } from "lucide-react";
import { AppTopBar, CyanButton } from "@/components/ello/mobile-ui";

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
    <div>
      <AppTopBar title="ELLO Express" subtitle="Atendimento urgente" backTo="/app" />

      <main className="space-y-4 px-4 pb-6 pt-4">
        <section className="ello-card rounded-xl p-4">
          <h1 className="text-2xl font-black leading-tight">
            Precisa <span className="text-primary">agora</span>?
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Disparamos sua solicitação para profissionais próximos. O primeiro disponível assume o
            atendimento.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-black">Categorias urgentes</h2>
          <div className="grid grid-cols-3 gap-2">
            {URGENT.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="ello-card flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl p-2"
                >
                  <Icon className="size-6 text-primary" />
                  <span className="text-center text-[10px] font-black">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ello-card rounded-xl p-4">
          <h2 className="text-sm font-black">Descreva sua emergência</h2>
          <textarea
            rows={4}
            placeholder="Ex: O disjuntor caiu e preciso de atendimento hoje..."
            className="mt-3 w-full resize-none rounded-lg border border-border bg-background p-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <CyanButton className="mt-3 w-full">Solicitar atendimento urgente</CyanButton>
        </section>
      </main>
    </div>
  );
}
