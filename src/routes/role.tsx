import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lightbulb, Phone, UserRound } from "lucide-react";
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
          displayName: user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Usuário ELLO",
          city: "São Paulo, SP",
        });
      } catch (caughtError) {
        setSaving(null);
        setError(caughtError instanceof Error ? caughtError.message : "Não foi possível salvar.");
        return;
      }
      await refreshProfile();
    }

    setSaving(null);
    await navigate({ to: mode === "professional" ? "/app/business" : "/app" });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white px-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(5.7rem+env(safe-area-inset-top))]">
      <section>
        <h1 className="max-w-[17rem] text-[1.8rem] font-black leading-[1.15] tracking-[-0.045em] text-foreground">
          Como você deseja começar?
        </h1>
        <p className="mt-5 max-w-[18rem] text-base leading-relaxed text-foreground/75">
          Você poderá usar os dois modos quando quiser.
        </p>
      </section>

      {!user ? (
        <div className="mt-7 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs font-semibold leading-relaxed text-primary">
          Você está no modo protótipo. Ao entrar com Supabase, esta escolha será salva no banco.
        </div>
      ) : null}

      {error ? (
        <div className="mt-7 rounded-2xl bg-destructive/10 p-4 text-xs font-semibold leading-relaxed text-destructive">
          {error}
        </div>
      ) : null}

      <section className="mt-9 space-y-5">
        <RoleCard
          disabled={saving !== null}
          variant="client"
          icon={<UserRound className="size-10 fill-white/20" />}
          title={saving === "client" ? "Salvando..." : "Cliente"}
          body="Quero contratar profissionais e serviços."
          onClick={() => void chooseMode("client")}
        />
        <RoleCard
          disabled={saving !== null}
          variant="professional"
          icon={<UserRound className="size-10 fill-white/20" />}
          title={saving === "professional" ? "Salvando..." : "Profissional"}
          body="Quero divulgar meus serviços e encontrar clientes."
          onClick={() => void chooseMode("professional")}
        />
      </section>

      <div className="mt-auto rounded-2xl bg-secondary p-5 text-sm leading-relaxed text-foreground/75">
        <div className="flex gap-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>Você poderá alternar entre os modos a qualquer momento nas configurações.</p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="size-4" />
          <span>Toda conta da ELLO pode contratar e oferecer serviços.</span>
        </div>
      </div>
    </main>
  );
}

function RoleCard({
  body,
  disabled,
  icon,
  onClick,
  title,
  variant,
}: {
  body: string;
  disabled: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  variant: "client" | "professional";
}) {
  const gradient =
    variant === "client"
      ? "bg-[linear-gradient(145deg,#004cff,#002bd9)]"
      : "bg-[linear-gradient(145deg,#08b85d,#04883f)]";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${gradient} flex min-h-36 w-full items-center justify-between rounded-2xl p-6 text-left text-white shadow-[0_18px_40px_rgba(0,58,255,0.12)] transition active:scale-[0.99] disabled:opacity-65`}
    >
      <span>
        <span className="block text-[1.35rem] font-black tracking-[-0.035em]">{title}</span>
        <span className="mt-4 block max-w-[13rem] text-sm font-medium leading-relaxed text-white/90">
          {body}
        </span>
      </span>
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10">
        {icon}
      </span>
    </button>
  );
}
