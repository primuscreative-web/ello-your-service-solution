import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocalHub } from "@/lib/localhub-context";
import { primaryButtonClass } from "@/components/localhub/ui";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useLocalHub();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "recovery">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const recoveryRef = useRef(false);

  useEffect(() => {
    const recoveryFromUrl =
      typeof window !== "undefined" &&
      (new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" ||
        new URLSearchParams(window.location.search).get("type") === "recovery");
    if (user && mode !== "recovery" && !recoveryRef.current && !recoveryFromUrl)
      void navigate({ to: "/studio" });
  }, [mode, navigate, user]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryRef.current = true;
        setMode("recovery");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setMessage("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!isSupabaseConfigured() || !supabase)
      return setError("O acesso está indisponível no momento.");
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth`;

      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setMessage(
          "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.",
        );
        return;
      }

      if (mode === "recovery") {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem.");
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          const message = updateError.message.toLowerCase();
          setError(
            message.includes("session") || message.includes("token")
              ? "Este link expirou ou já foi utilizado. Solicite um novo link de recuperação."
              : updateError.message,
          );
          return;
        }

        recoveryRef.current = false;
        await navigate({ to: "/studio" });
        return;
      }

      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { emailRedirectTo: redirectTo },
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
    <main className="auth-page min-h-screen bg-[#f5f4ef] text-[#292b25] lg:grid lg:grid-cols-2">
      <section className="auth-story relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#292b25] p-12 text-white lg:flex xl:p-16">
        <Link
          to="/"
          className="auth-wordmark relative z-10"
          aria-label="ELLO — voltar para o início"
        >
          <AuthMark tone="light" />
          <span>ello</span>
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
        <AuthArtwork />
      </section>
      <div className="auth-panel relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-8">
        <AuthParticles />
        <section className="auth-card relative z-10 w-full max-w-md rounded-2xl border border-[#e6e5dd] bg-[#fbfaf7] p-7 sm:p-9">
          <Link to="/" className="auth-card-mark mx-auto" aria-label="Voltar para o início">
            <AuthMark tone="dark" />
          </Link>
          <h1 className="mt-6 text-center text-2xl font-extrabold">
            {mode === "login" && "Acesse seu espaço"}
            {mode === "signup" && "Crie sua conta ELLO"}
            {mode === "forgot" && "Recupere sua senha"}
            {mode === "recovery" && "Crie uma nova senha"}
          </h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            {mode === "login" &&
              "Seus dados serão salvos com segurança e sincronizados entre dispositivos."}
            {mode === "signup" && "Crie sua conta para começar a organizar seu negócio na ELLO."}
            {mode === "forgot" &&
              "Informe seu e-mail e enviaremos um link seguro para redefinir sua senha."}
            {mode === "recovery" && "Escolha uma nova senha para voltar ao seu espaço ELLO."}
          </p>
          <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-4">
            {mode !== "recovery" && (
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
            )}
            {mode !== "forgot" && (
              <>
                <label className="block text-sm font-semibold">
                  {mode === "recovery" ? "Nova senha" : "Senha"}
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
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setMessage("");
                    }}
                    className="auth-forgot-link -mt-2 text-sm font-semibold text-[#667448]"
                  >
                    Esqueci minha senha
                  </button>
                )}
                {mode === "recovery" && (
                  <label className="block text-sm font-semibold">
                    Confirme a nova senha
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dedfd6] px-4 py-3 outline-none focus:border-[#8a9668] focus:ring-2 focus:ring-[#edf0e5]"
                    />
                  </label>
                )}
              </>
            )}
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
              {busy
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : mode === "signup"
                    ? "Criar conta"
                    : mode === "forgot"
                      ? "Enviar link de recuperação"
                      : "Salvar nova senha"}
            </button>
          </form>
          {mode === "recovery" ? (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setMessage("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="mt-6 w-full text-sm font-semibold text-[#667448]"
            >
              Solicitar outro link de recuperação
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login");
                setError("");
                setMessage("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="mt-6 w-full text-sm font-semibold text-[#667448]"
            >
              {mode === "login"
                ? "Ainda não tem conta? Criar conta"
                : mode === "signup"
                  ? "Já tem conta? Entrar"
                  : "Voltar para entrar"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

function AuthMark({ tone }: { tone: "dark" | "light" }) {
  return (
    <span className={`auth-mark auth-mark-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M27.2 18.7a7.2 7.2 0 1 0-.5 6.7M13.1 20.3h14.1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <circle cx="27.2" cy="20.3" r="1.6" className="auth-mark-accent" />
      </svg>
    </span>
  );
}

function AuthArtwork() {
  return (
    <div className="auth-artwork" aria-hidden="true">
      <svg viewBox="0 0 620 560" fill="none">
        <g className="auth-artwork-orbit">
          <ellipse cx="312" cy="283" rx="230" ry="126" transform="rotate(-31 312 283)" />
          <ellipse cx="312" cy="283" rx="184" ry="95" transform="rotate(34 312 283)" />
          <ellipse cx="312" cy="283" rx="130" ry="210" transform="rotate(72 312 283)" />
          <path d="M60 345c84-20 124-114 206-146 87-34 151 40 234 11 31-11 55-33 77-58" />
        </g>
        <circle className="auth-artwork-point" cx="153" cy="184" r="4" />
        <circle
          className="auth-artwork-point auth-artwork-point-secondary"
          cx="490"
          cy="333"
          r="2.5"
        />
      </svg>
    </div>
  );
}

function AuthParticles() {
  return (
    <div className="auth-particles" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
