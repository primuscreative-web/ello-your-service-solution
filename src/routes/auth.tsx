import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { Apple, Mail, Phone } from "lucide-react";
import { ElloLogo } from "@/components/ello/logo";
import { useAuth } from "@/lib/auth/auth-context";
import { createConfirmedPasswordAccount } from "@/lib/auth/auth.functions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { configured } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setError("Configure o Supabase para ativar o backend.");
      return;
    }

    if (password.length < 6) {
      setError("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    setSubmitting(true);

    let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
    try {
      if (mode === "sign-up") {
        await createConfirmedPasswordAccount({
          data: {
            email,
            password,
            fullName: fullName.trim() || email.split("@")[0],
          },
        });
      }

      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (caughtError) {
      setSubmitting(false);
      setError(
        caughtError instanceof Error ? caughtError.message : "Não foi possível criar a conta.",
      );
      return;
    }

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    await navigate({ to: "/role" });
  }

  function toggleMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setShowEmailForm(true);
    setError(null);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white px-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(5.2rem+env(safe-area-inset-top))]">
      <section className="flex flex-col items-center text-center">
        <ElloLogo className="text-[2rem]" />
        <h1 className="mt-10 text-[1.55rem] font-black tracking-[-0.035em] text-foreground">
          Bem-vindo(a)! 👋
        </h1>
        <p className="mt-4 max-w-[17rem] text-base leading-relaxed text-muted-foreground">
          Faça login ou crie sua conta para continuar
        </p>
      </section>

      {!configured ? (
        <div className="mt-8 rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs font-semibold text-warning-foreground">
          Configure o Supabase para ativar o login real neste ambiente.
        </div>
      ) : null}

      <section className="mt-10 space-y-3">
        <ProviderButton disabled icon={<GoogleMark />} label="Continuar com Google" />
        <ProviderButton
          disabled
          icon={<Apple className="size-5 fill-black text-black" />}
          label="Continuar com Apple"
        />
        <ProviderButton
          disabled
          icon={<Phone className="size-5" />}
          label="Continuar com telefone"
        />
        <ProviderButton
          icon={<Mail className="size-5" />}
          label="Continuar com e-mail"
          onClick={() => setShowEmailForm((visible) => !visible)}
        />
      </section>

      {showEmailForm ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "sign-up" ? (
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Seu nome"
              className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          ) : null}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="seu@email.com"
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            placeholder="Senha"
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />

          {mode === "sign-up" ? (
            <p className="rounded-xl bg-primary/5 p-3 text-xs font-semibold leading-relaxed text-primary">
              A confirmação de e-mail será adicionada quando o e-mail oficial da ELLO estiver
              pronto.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold leading-relaxed text-destructive">
              {error}
            </p>
          ) : null}

          <button
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Aguarde..." : mode === "sign-in" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      ) : null}

      <div className="my-9 flex items-center gap-4 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <button type="button" onClick={toggleMode} className="text-sm font-semibold text-foreground">
        {mode === "sign-in" ? (
          <>
            Ainda não tem conta? <span className="text-primary">Criar conta</span>
          </>
        ) : (
          <>
            Já tem uma conta? <span className="text-primary">Entrar</span>
          </>
        )}
      </button>

      <p className="mt-auto pt-10 text-center text-xs leading-relaxed text-muted-foreground">
        Ao continuar, você concorda com os{" "}
        <span className="font-semibold text-primary">Termos de uso</span> e{" "}
        <span className="font-semibold text-primary">Política de privacidade</span>
      </p>
    </main>
  );
}

function ProviderButton({
  disabled = false,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className="flex h-14 w-full items-center gap-4 rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition active:scale-[0.99] aria-disabled:cursor-not-allowed aria-disabled:opacity-55"
    >
      <span className="grid size-6 place-items-center">{icon}</span>
      <span className="flex-1 text-center">{label}</span>
      <span className="size-6" />
    </button>
  );
}

function GoogleMark() {
  return <span className="text-[1.35rem] font-black text-[#4285f4]">G</span>;
}
