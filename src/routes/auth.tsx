import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLocalHub } from "@/lib/localhub-context";
import { primaryButtonClass } from "@/components/localhub/ui";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function getAuthErrorMessage(message: string, code?: string) {
  const errorCode = (code || message).toLowerCase();

  if (errorCode.includes("redirect_to_not_allowed"))
    return "O endereço de confirmação não está liberado no Supabase Auth. Confira Authentication → URL Configuration.";
  if (errorCode.includes("user_already_exists") || errorCode.includes("already registered"))
    return "Este e-mail já possui uma conta. Entre ou use “Esqueci minha senha”.";
  if (errorCode.includes("weak_password") || errorCode.includes("password should"))
    return "A senha não atende aos requisitos. Use pelo menos 6 caracteres e tente outra combinação.";
  if (errorCode.includes("email_address_invalid") || errorCode.includes("invalid email"))
    return "Digite um endereço de e-mail válido.";
  if (errorCode.includes("signup_disabled"))
    return "O cadastro está desabilitado no momento. Tente novamente mais tarde.";
  if (errorCode.includes("rate_limit") || errorCode.includes("too many requests"))
    return "Muitas tentativas em sequência. Aguarde um pouco antes de tentar novamente.";
  if (errorCode.includes("invalid_credentials"))
    return "E-mail ou senha incorretos. Confira seus dados ou recupere sua senha.";

  return "Não foi possível concluir a solicitação. Confira os dados e tente novamente em instantes.";
}

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useLocalHub();
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "recovery">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      const redirectTo = `${isLocalhost ? "https://ello.app.br" : window.location.origin}/auth`;

      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });
        if (resetError) {
          setError(getAuthErrorMessage(resetError.message, resetError.code));
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
              : getAuthErrorMessage(updateError.message, updateError.code),
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
        setError(getAuthErrorMessage(result.error.message, result.error.code));
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setMessage("Conta criada. Confirme seu e-mail pelo link enviado para entrar.");
        return;
      }
      await navigate({ to: "/studio" });
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message.toLowerCase().includes("fetch")
          ? "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente."
          : "Não foi possível concluir o acesso agora. Tente novamente em instantes.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page min-h-screen bg-[#f5f4ef] text-[#292b25] lg:grid lg:grid-cols-2">
      <section className="auth-story relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#292b25] p-12 text-white lg:flex xl:p-16">
        <video
          className="auth-story-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/videos/auth-background.mp4" type="video/mp4" />
        </video>
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
        <p className="relative z-10 text-xs text-white/50">ELLO · ferramentas para negócios locais</p>
      </section>
      <div className="auth-panel relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-white sm:px-8">
        <AuthParticles />
        <section className="auth-card relative z-10 w-full max-w-md rounded-2xl border border-[#e6e5dd] bg-[#fbfaf7] p-7 text-[#292b25] sm:p-9">
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
                <div className="block text-sm font-semibold">
                  <label htmlFor="auth-password">
                    {mode === "recovery" ? "Nova senha" : "Senha"}
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-[#dedfd6] px-4 py-3 pr-12 outline-none focus:border-[#8a9668] focus:ring-2 focus:ring-[#edf0e5]"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-[#292b25]"
                      aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
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
                  <div className="block text-sm font-semibold">
                    <label htmlFor="auth-confirm-password">Confirme a nova senha</label>
                    <div className="relative mt-2">
                      <input
                        id="auth-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="w-full rounded-xl border border-[#dedfd6] px-4 py-3 pr-12 outline-none focus:border-[#8a9668] focus:ring-2 focus:ring-[#edf0e5]"
                      />
                      <button
                        type="button"
                        className="auth-password-toggle absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-[#292b25]"
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                        aria-pressed={showConfirmPassword}
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
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

function AuthParticles() {
  return (
    <div className="auth-particles" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
