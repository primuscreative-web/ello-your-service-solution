import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocalHub } from "@/lib/localhub-context";
import { primaryButtonClass } from "@/components/localhub/ui";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useLocalHub();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) void navigate({ to: "/studio" });
  }, [navigate, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!isSupabaseConfigured() || !supabase)
      return setError("O acesso está indisponível no momento.");
    setBusy(true);
    try {
      const emailRedirectTo = `${window.location.origin}/auth`;
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { emailRedirectTo },
            })
          : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setMessage("Conta criada. Confirme seu e-mail pelo link enviado para entrar.");
        return;
      }
      await navigate({ to: "/studio" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir o acesso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f4ef] text-[#292b25] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#292b25] p-12 text-white lg:flex xl:p-16">
        <Link to="/" className="flex w-fit items-center gap-3" aria-label="Voltar para o início">
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-lg font-bold">
            e
          </span>
          <span className="text-lg font-semibold tracking-tight">ello</span>
        </Link>
        <div className="relative z-10 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
            Seu negócio, mais presente
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Um lugar simples para cuidar da sua presença online.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            Organize seus serviços, compartilhe sua página e acompanhe os pedidos de agendamento.
          </p>
        </div>
        <p className="text-xs text-white/50">ELLO · ferramentas para negócios locais</p>
        <div className="pointer-events-none absolute -bottom-48 -right-32 size-[440px] rounded-full border border-white/10" />
      </section>
      <div className="grid min-h-screen place-items-center px-4 py-10 sm:px-8">
        <section className="w-full max-w-md rounded-2xl border border-[#e6e5dd] bg-[#fbfaf7] p-7 shadow-[0_20px_60px_-38px_rgba(35,37,28,.3)] sm:p-9">
          <Link to="/" className="ello-brand-mark mx-auto">
            e
          </Link>
          <h1 className="mt-6 text-center text-2xl font-extrabold">
            {mode === "login" ? "Acesse seu espaço" : "Crie sua conta ELLO"}
          </h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Seus dados serão salvos com segurança e sincronizados entre dispositivos.
          </p>
          <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
            <label className="block text-sm font-semibold">
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dedfd6] px-4 py-3 outline-none focus:border-[#8a9668] focus:ring-2 focus:ring-[#edf0e5]"
              />
            </label>
            <label className="block text-sm font-semibold">
              Senha
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dedfd6] px-4 py-3 outline-none focus:border-[#8a9668] focus:ring-2 focus:ring-[#edf0e5]"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-emerald-700">
                {message}
              </p>
            )}
            <button disabled={busy} className={`${primaryButtonClass} w-full justify-center`}>
              {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            className="mt-6 w-full text-sm font-semibold text-[#667448]"
          >
            {mode === "login" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </section>
      </div>
    </main>
  );
}
