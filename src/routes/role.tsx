import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lightbulb, Phone, Sparkles, UserRound } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { ElloAppShell } from "@/components/ello/app-shell";
import { ElloInfoBanner } from "@/components/ello/primitives";
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
    <ElloAppShell statusBarClassName="text-slate-800">
      <main className="relative flex h-full min-h-[700px] flex-col overflow-hidden ello-mesh-bg px-5 pb-8 pt-4 sm:px-7">
        <div className="absolute inset-x-8 top-0 h-36 rounded-full bg-white/70 blur-3xl" />
        <section className="relative animate-reveal">
          <h1 className="max-w-[17rem] text-2xl font-black leading-tight tracking-[-0.04em] text-foreground">
            Como você deseja começar?
          </h1>
          <p className="mt-2.5 max-w-[18rem] text-sm font-semibold tracking-tight text-muted-foreground">
            Você poderá usar os dois modos quando quiser.
          </p>
        </section>

        <section className="relative mt-5 animate-reveal" style={{ animationDelay: "60ms" }}>
          <ElloInfoBanner
            icon={<Sparkles className="size-5" />}
            eyebrow="O modo ideal para você"
            body="Use o cliente para contratar e o profissional para gerenciar serviços e oportunidades."
          />
        </section>

        {!user ? (
          <div className="relative mt-5 rounded-[24px] border border-primary/10 bg-white/80 p-4 text-xs font-semibold leading-relaxed text-primary shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            Entre ou crie sua conta para manter sua escolha sincronizada em todos os dispositivos.
          </div>
        ) : null}

        {error ? (
          <div className="relative mt-5 rounded-[24px] bg-destructive/10 p-4 text-xs font-semibold leading-relaxed text-destructive shadow-sm">
            {error}
          </div>
        ) : null}

        <section className="relative mt-6 space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
          <RoleCard
            disabled={saving !== null}
            variant="client"
            icon={<UserRound className="size-8 fill-white/20" />}
            title={saving === "client" ? "Salvando..." : "Cliente"}
            body="Quero contratar profissionais e serviços."
            onClick={() => void chooseMode("client")}
          />
          <RoleCard
            disabled={saving !== null}
            variant="professional"
            icon={<UserRound className="size-8 fill-white/20" />}
            title={saving === "professional" ? "Salvando..." : "Profissional"}
            body="Quero divulgar meus serviços e encontrar clientes."
            onClick={() => void chooseMode("professional")}
          />
        </section>

        <div className="relative mt-auto rounded-[28px] border border-white/80 bg-white/80 p-5 text-xs leading-relaxed text-slate-500 shadow-[0_20px_50px_rgba(13,20,56,0.08)] backdrop-blur-xl animate-reveal" style={{ animationDelay: "200ms" }}>
          <div className="flex gap-3">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
            <p className="font-semibold text-foreground/80">Você poderá alternar entre os modos a qualquer momento nas configurações.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
            <Phone className="size-4" />
            <span>Toda conta da ELLO pode contratar e oferecer serviços.</span>
          </div>
        </div>
      </main>
    </ElloAppShell>
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
      className={`${gradient} relative flex min-h-36 w-full items-center justify-between overflow-hidden rounded-[24px] border border-white/15 p-6 text-left text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)] transition duration-200 active:scale-[0.99] disabled:opacity-65 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_45%)]`}
    >
      <span>
        <span className="block text-[1.35rem] font-black tracking-[-0.035em]">{title}</span>
        <span className="mt-4 block max-w-[13rem] text-sm font-medium leading-relaxed text-white/90">
          {body}
        </span>
      </span>
      <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-white/12 ring-1 ring-white/20">
        {icon}
      </span>
    </button>
  );
}
