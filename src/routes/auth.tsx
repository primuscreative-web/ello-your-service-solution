import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
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
    <main className="grid min-h-screen place-items-center bg-[#faf8ff] px-4 py-10 text-[#131b2e]">
      <section className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-7 shadow-xl sm:p-9">
        <Link
          to="/"
          className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white"
        >
          <Store />
        </Link>
        <h1 className="mt-6 text-center text-2xl font-extrabold">
          {mode === "login" ? "Acesse seu painel" : "Crie sua conta LocalHub"}
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
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
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
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
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
          className="mt-6 w-full text-sm font-semibold text-indigo-700"
        >
          {mode === "login" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </section>
    </main>
  );
}
