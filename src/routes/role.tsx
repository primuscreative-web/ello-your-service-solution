import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/role")({
  component: Role,
});

function Role() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 pb-10 pt-12">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Bem-vindo à ELLO
      </span>
      <h1 className="font-display mt-2 text-3xl font-extrabold leading-tight tracking-tight">
        Como você deseja <span className="text-primary">começar</span>?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Você poderá alternar entre os modos a qualquer momento.
      </p>

      <div className="mt-10 space-y-4">
        <RoleCard
          to="/app"
          eyebrow="Cliente"
          icon="👤"
          title="Quero contratar serviços"
          body="Encontre profissionais, peça orçamentos, agende e avalie."
        />
        <RoleCard
          to="/app/business"
          eyebrow="Profissional"
          icon="👨‍🔧"
          title="Quero divulgar meus serviços"
          body="Crie seu perfil com IA, organize agenda e encontre clientes."
        />
      </div>

      <div className="mt-auto rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
        💡 <span className="font-medium text-foreground">Dica:</span> Toda conta ELLO pode contratar e oferecer serviços.
      </div>
    </div>
  );
}

function RoleCard({
  to,
  eyebrow,
  icon,
  title,
  body,
}: {
  to: string;
  eyebrow: string;
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-3xl border border-border bg-white p-6 transition-all active:scale-[0.99] hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
          {icon}
        </div>
        <div className="flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {eyebrow}
          </span>
          <h3 className="font-display mt-1 text-lg font-bold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </Link>
  );
}