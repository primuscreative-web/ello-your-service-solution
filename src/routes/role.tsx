import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, Lightbulb, UserRound } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { chooseMyAccountMode } from "@/lib/ello-repository";

export const Route = createFileRoute("/role")({
  component: Role,
});

function Role() {
  const navigate = useNavigate();
  const { configured, user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState<"client" | "professional" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function chooseMode(mode: "client" | "professional") {
    setError(null);
    setSaving(mode);

    if (configured && user) {
      try {
        await chooseMyAccountMode({
          userId: user.id,
          mode,
          displayName: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Usuario ELLO",
          city: "Sao Paulo, SP",
        });
      } catch (caughtError) {
        setSaving(null);
        setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar.");
        return;
      }
      await refreshProfile();
    }

    setSaving(null);
    await navigate({ to: mode === "professional" ? "/app/business" : "/app" });
  }

  return (
    <div className="ello-shell flex min-h-screen flex-col px-6 pb-10 pt-12">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Bem-vindo à ELLO
      </span>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">
        Como você deseja <span className="text-primary">começar</span>?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Você poderá alternar entre os modos a qualquer momento.
      </p>

      {!user ? (
        <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs font-semibold text-sky-900">
          Você está no modo protótipo. Ao entrar com Supabase, esta escolha será salva no banco.
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        <RoleCard
          disabled={saving !== null}
          eyebrow="Cliente"
          icon={<UserRound className="size-7" />}
          title={saving === "client" ? "Salvando..." : "Quero contratar serviços"}
          body="Encontre profissionais, peça orçamentos, agende e avalie."
          onClick={() => void chooseMode("client")}
        />
        <RoleCard
          disabled={saving !== null}
          eyebrow="Profissional"
          icon={<BriefcaseBusiness className="size-7" />}
          title={saving === "professional" ? "Salvando..." : "Quero divulgar meus serviços"}
          body="Crie seu perfil com IA, organize agenda e encontre clientes."
          onClick={() => void chooseMode("professional")}
        />
      </div>

      <div className="mt-auto flex gap-3 rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        <Lightbulb className="size-5 shrink-0 text-primary" />
        <p>
          <span className="font-bold text-foreground">Dica:</span> Toda conta ELLO pode contratar e
          oferecer serviços.
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  eyebrow,
  icon,
  title,
  body,
  disabled,
  onClick,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="ello-card block w-full rounded-xl p-5 text-left transition-all active:scale-[0.99] disabled:opacity-60"
    >
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            {eyebrow}
          </span>
          <h3 className="mt-1 text-lg font-black leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
    </button>
  );
}
