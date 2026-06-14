import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/express")({
  component: Express,
});

const URGENT = [
  { icon: "🔑", label: "Chaveiro" },
  { icon: "🔧", label: "Encanador" },
  { icon: "⚡", label: "Eletricista" },
  { icon: "🚗", label: "Guincho" },
  { icon: "👶", label: "Babá" },
  { icon: "🚿", label: "Desentupimento" },
];

function Express() {
  return (
    <div className="px-5 pb-8 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-white"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex size-2 animate-pulse rounded-full bg-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            ELLO Express
          </span>
        </div>
      </div>

      <h1 className="font-display mt-5 text-3xl font-extrabold leading-tight tracking-tight">
        Precisa <span className="text-primary">agora</span>?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Disparamos sua solicitação para os profissionais mais próximos. O primeiro a aceitar atende você.
      </p>

      <h3 className="font-display mt-8 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Categorias urgentes
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {URGENT.map((u) => (
          <button
            key={u.label}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-4 active:scale-95"
          >
            <span className="text-3xl">{u.icon}</span>
            <span className="text-xs font-semibold">{u.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-white p-5">
        <h3 className="font-display font-bold">Descreva sua emergência</h3>
        <textarea
          rows={3}
          placeholder="Ex: Geladeira parou de funcionar e estraga toda a comida..."
          className="mt-3 w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]">
          🚨 Solicitar atendimento urgente
        </button>
      </div>
    </div>
  );
}