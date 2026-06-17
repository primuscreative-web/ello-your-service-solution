import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { Mail, ShieldCheck, Smartphone } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setError("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o backend.");
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
        caughtError instanceof Error ? caughtError.message : "Nao foi possivel criar a conta.",
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

  return (
    <div className="ello-shell flex min-h-screen flex-col px-6 pb-10 pt-12">
      <div className="flex flex-col items-center text-center">
        <ElloLogo className="text-4xl" />
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">
          {mode === "sign-in" ? "Entre na sua conta" : "Crie sua conta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Toda conta ELLO pode contratar e oferecer serviços.
        </p>
      </div>

      {!configured ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
          Backend ainda não configurado neste ambiente. Preencha o `.env` com as chaves públicas do
          Supabase.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        {mode === "sign-up" ? (
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Seu nome"
            className="h-13 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        ) : null}
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="seu@email.com"
          className="h-13 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
          placeholder="Senha"
          className="h-13 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {error ? (
          <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            {message}
          </p>
        ) : null}

        <button
          disabled={submitting}
          className="ello-action flex h-13 w-full items-center justify-center rounded-xl font-bold disabled:opacity-60"
        >
          {submitting ? "Aguarde..." : mode === "sign-in" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
          setMessage(null);
        }}
        className="mt-4 text-sm font-bold text-[#083d63]"
      >
        {mode === "sign-in" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>

      <div className="my-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        ou
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <SocialButton icon={<Smartphone className="size-4" />} label="Continuar com Telefone" />
        <SocialButton icon={<Mail className="size-4" />} label="Continuar com Google" />
        <SocialButton icon={<ShieldCheck className="size-4" />} label="Continuar com Apple" />
      </div>

      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com os Termos e Política de Privacidade da ELLO.
      </p>

      <Link to="/app" className="mt-4 text-center text-xs font-semibold text-muted-foreground">
        Ver protótipo sem entrar
      </Link>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-semibold text-foreground transition-colors active:bg-muted">
      {icon}
      {label}
    </button>
  );
}
