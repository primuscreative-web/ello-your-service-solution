import { createFileRoute, Link } from "@tanstack/react-router";
import { ProAvatar } from "@/components/ello/avatar";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

const MENU = [
  { icon: "❤️", label: "Favoritos" },
  { icon: "📜", label: "Histórico de solicitações" },
  { icon: "💳", label: "Pagamentos" },
  { icon: "🔔", label: "Notificações" },
  { icon: "🔒", label: "Privacidade" },
  { icon: "⚙️", label: "Configurações" },
  { icon: "❓", label: "Ajuda" },
];

function Profile() {
  return (
    <div className="px-5 pb-8 pt-8">
      <div className="flex items-center gap-4">
        <ProAvatar initials="MA" tone="oklch(0.82 0.07 30)" size={72} />
        <div>
          <h1 className="font-display text-xl font-extrabold">Maria Almeida</h1>
          <p className="text-sm text-muted-foreground">📍 Pinheiros, SP</p>
          <span className="mt-1 inline-block rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
            Cliente
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat value="12" label="Contratações" />
        <Stat value="4" label="Em andamento" />
        <Stat value="8" label="Avaliações" />
      </div>

      <Link
        to="/app/business"
        className="mt-6 flex items-center justify-between rounded-3xl bg-primary p-5 text-primary-foreground"
      >
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">
            Novo
          </span>
          <p className="font-display mt-1 text-base font-bold">
            Ative seu perfil profissional
          </p>
          <p className="text-xs opacity-80">Comece a oferecer serviços hoje</p>
        </div>
        <span className="text-2xl">→</span>
      </Link>

      <div className="mt-6 space-y-1 rounded-3xl border border-border bg-white p-2">
        {MENU.map((m) => (
          <button
            key={m.label}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left active:bg-muted"
          >
            <span className="text-xl">{m.icon}</span>
            <span className="flex-1 text-sm font-medium">{m.label}</span>
            <span className="text-muted-foreground">›</span>
          </button>
        ))}
      </div>

      <Link
        to="/"
        className="mt-6 block text-center text-sm font-medium text-destructive"
      >
        Sair da conta
      </Link>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-center">
      <p className="font-display text-xl font-extrabold">{value}</p>
      <span className="font-mono text-[9px] uppercase text-muted-foreground">{label}</span>
    </div>
  );
}