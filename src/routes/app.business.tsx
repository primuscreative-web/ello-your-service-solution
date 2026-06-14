import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/business")({
  component: Business,
});

const TOOLS = [
  { icon: "📅", label: "Agenda", desc: "Gerencie horários" },
  { icon: "💼", label: "Portfólio", desc: "Mostre seus trabalhos" },
  { icon: "💰", label: "Orçamentos", desc: "Responda solicitações" },
  { icon: "👥", label: "CRM", desc: "Seus clientes" },
  { icon: "🔗", label: "ELLO Link", desc: "ello.app/seu-nome" },
  { icon: "✨", label: "IA Manager", desc: "Sua consultora" },
];

function Business() {
  return (
    <div className="px-5 pb-8 pt-8">
      <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
        Modo Profissional
      </span>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight">
        Meu Negócio
      </h1>

      <div className="mt-6 overflow-hidden rounded-3xl bg-foreground p-6 text-background">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            ELLO IA Manager
          </span>
        </div>
        <h2 className="font-display mt-2 text-xl font-bold">
          Vamos criar seu negócio na ELLO.
        </h2>
        <p className="mt-2 text-sm opacity-80">
          A IA monta seu perfil, portfólio, ELLO Link e estratégia em poucos minutos.
        </p>
        <button className="mt-5 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground">
          Começar configuração
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold">Perfil 30% completo</h3>
          <span className="font-mono text-xs text-primary">3/10</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[30%] rounded-full bg-primary" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Complete seu perfil para receber mais visualizações.
        </p>
      </div>

      <h3 className="font-display mt-8 text-base font-bold">Ferramentas</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-white p-4 text-left active:scale-[0.98]"
          >
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p className="font-display text-sm font-bold">{t.label}</p>
              <p className="text-[11px] text-muted-foreground">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <h3 className="font-display mt-8 text-base font-bold">Dashboard</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Visitas" value="412" />
        <Stat label="Mensagens" value="18" />
        <Stat label="Receita" value="R$ 2.4k" />
      </div>

      <Link
        to="/app"
        className="mt-8 block rounded-2xl border border-border bg-white py-4 text-center text-sm font-bold"
      >
        🔄 Alternar para modo Cliente
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <span className="font-mono text-[9px] uppercase text-muted-foreground">{label}</span>
      <p className="font-display mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}