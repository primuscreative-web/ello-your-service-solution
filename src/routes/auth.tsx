import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Apple, Mail, Phone } from "lucide-react";
import { ElloLogo } from "@/components/ello/logo";
import { useAuth } from "@/lib/auth/auth-context";
import { createConfirmedPasswordAccount } from "@/lib/auth/auth.functions";
import { getSupabaseBrowserClient, getSupabasePublicConfig } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: Auth,
});

type AuthMethod = "email" | "phone" | null;
type OAuthProvider = "google" | "apple";
type AuthProviderAvailability = {
  apple: boolean;
  google: boolean;
  phone: boolean;
};

function Auth() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { configured, loading, user } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [method, setMethod] = useState<AuthMethod>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingProvider, setSubmittingProvider] = useState<OAuthProvider | "phone" | null>(
    null,
  );
  const [providerAvailability, setProviderAvailability] = useState<AuthProviderAvailability | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const destination = useMemo(() => {
    return redirect?.startsWith("/p/") ? redirect : "/role";
  }, [redirect]);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: destination });
    }
  }, [destination, loading, navigate, user]);

  useEffect(() => {
    if (!configured) {
      setProviderAvailability(null);
      return;
    }

    const publicConfig = getSupabasePublicConfig();
    if (!publicConfig) return;

    const controller = new AbortController();

    async function loadProviderAvailability() {
      try {
        const response = await fetch(`${publicConfig.url}/auth/v1/settings`, {
          headers: {
            apikey: publicConfig.anonKey,
            Authorization: `Bearer ${publicConfig.anonKey}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Não foi possível consultar os provedores.");

        const settings = (await response.json()) as {
          external?: Partial<Record<"apple" | "google" | "phone", boolean>>;
        };

        setProviderAvailability({
          apple: Boolean(settings.external?.apple),
          google: Boolean(settings.external?.google),
          phone: Boolean(settings.external?.phone),
        });
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          console.warn(caughtError);
          setProviderAvailability({ apple: false, google: false, phone: false });
        }
      }
    }

    void loadProviderAvailability();

    return () => controller.abort();
  }, [configured]);

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setError("O login ainda não está configurado neste ambiente.");
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

    await navigate({ to: destination });
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setError("O login ainda não está configurado neste ambiente.");
      return;
    }

    setSubmittingProvider(provider);
    const redirectTo = new URL("/auth", window.location.origin);
    if (redirect?.startsWith("/p/")) redirectTo.searchParams.set("redirect", redirect);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    setSubmittingProvider(null);
    if (oauthError) setError(oauthError.message);
  }

  async function handlePhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!configured || !supabase) {
      setError("O login por celular ainda não está configurado neste ambiente.");
      return;
    }

    const normalizedPhone = normalizeBrazilianPhone(phone);
    if (!normalizedPhone) {
      setError("Informe um celular válido com DDD.");
      return;
    }

    setSubmittingProvider("phone");

    if (!otpSent) {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          data: {
            full_name: fullName.trim() || normalizedPhone,
          },
        },
      });
      setSubmittingProvider(null);
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setOtpSent(true);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: phoneCode.trim(),
      type: "sms",
    });
    setSubmittingProvider(null);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    await navigate({ to: destination });
  }

  function openMethod(nextMethod: AuthMethod) {
    setMethod((current) => (current === nextMethod ? null : nextMethod));
    setError(null);
    if (nextMethod !== "phone") {
      setOtpSent(false);
      setPhoneCode("");
    }
  }

  function toggleMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setMethod("email");
    setError(null);
  }

  const providerStatusLoaded = providerAvailability !== null;
  const googleAvailable = Boolean(providerAvailability?.google);
  const appleAvailable = Boolean(providerAvailability?.apple);
  const phoneAvailable = Boolean(providerAvailability?.phone);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-white px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(4.6rem+env(safe-area-inset-top))]">
      <section className="flex flex-col items-center text-center">
        <ElloLogo className="text-[1.9rem]" />
        <h1 className="mt-9 text-[1.52rem] font-black tracking-[-0.035em] text-foreground">
          Bem-vindo(a)!
        </h1>
        <p className="mt-3 max-w-[17rem] text-[0.98rem] leading-relaxed text-muted-foreground">
          Entre ou crie sua conta para continuar na ELLO.
        </p>
      </section>

      {!configured ? (
        <div className="mt-7 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs font-semibold leading-relaxed text-warning-foreground">
          O backend de autenticação ainda não está configurado neste ambiente.
        </div>
      ) : null}

      <section className="mt-9 space-y-3">
        <ProviderButton
          disabled={
            !configured || !providerStatusLoaded || !googleAvailable || submittingProvider !== null
          }
          icon={<GoogleMark />}
          label={
            submittingProvider === "google"
              ? "Abrindo Google..."
              : providerStatusLoaded && !googleAvailable
                ? "Google em configuração"
                : "Continuar com Google"
          }
          onClick={() => void handleOAuth("google")}
        />
        <ProviderButton
          disabled={
            !configured || !providerStatusLoaded || !appleAvailable || submittingProvider !== null
          }
          icon={<Apple className="size-5 fill-black text-black" />}
          label={
            submittingProvider === "apple"
              ? "Abrindo Apple..."
              : providerStatusLoaded && !appleAvailable
                ? "iPhone em configuração"
                : "Continuar com iPhone"
          }
          onClick={() => void handleOAuth("apple")}
        />
        <ProviderButton
          disabled={
            !configured || !providerStatusLoaded || !phoneAvailable || submittingProvider !== null
          }
          icon={<Phone className="size-5" />}
          label={
            providerStatusLoaded && !phoneAvailable
              ? "Celular em configuração"
              : "Continuar com celular"
          }
          onClick={() => openMethod("phone")}
        />
        <ProviderButton
          icon={<Mail className="size-5" />}
          label="Continuar com e-mail"
          onClick={() => openMethod("email")}
        />
      </section>

      {providerStatusLoaded && (!googleAvailable || !appleAvailable || !phoneAvailable) ? (
        <p className="mt-4 rounded-2xl bg-muted px-4 py-3 text-center text-xs font-semibold leading-relaxed text-muted-foreground">
          Google, iPhone e celular serão ativados assim que os provedores forem conectados no
          Supabase.
        </p>
      ) : null}

      {method === "email" ? (
        <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
          {mode === "sign-up" ? (
            <AuthInput
              value={fullName}
              onChange={setFullName}
              placeholder="Seu nome"
              autoComplete="name"
            />
          ) : null}
          <AuthInput
            value={email}
            onChange={setEmail}
            type="email"
            required
            placeholder="seu@email.com"
            autoComplete="email"
          />
          <AuthInput
            value={password}
            onChange={setPassword}
            type="password"
            required
            placeholder="Senha"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />

          <PrimaryButton disabled={submitting}>
            {submitting ? "Aguarde..." : mode === "sign-in" ? "Entrar" : "Criar conta"}
          </PrimaryButton>
        </form>
      ) : null}

      {method === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="mt-5 space-y-3">
          {mode === "sign-up" ? (
            <AuthInput
              value={fullName}
              onChange={setFullName}
              placeholder="Seu nome"
              autoComplete="name"
            />
          ) : null}
          <AuthInput
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setOtpSent(false);
              setPhoneCode("");
            }}
            type="tel"
            required
            placeholder="(11) 99999-8888"
            autoComplete="tel"
          />
          {otpSent ? (
            <AuthInput
              value={phoneCode}
              onChange={setPhoneCode}
              inputMode="numeric"
              required
              placeholder="Código recebido por SMS"
              autoComplete="one-time-code"
            />
          ) : null}

          <PrimaryButton disabled={submittingProvider === "phone"}>
            {submittingProvider === "phone"
              ? "Aguarde..."
              : otpSent
                ? "Confirmar código"
                : "Enviar código por SMS"}
          </PrimaryButton>
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-xs font-semibold leading-relaxed text-destructive">
          {error}
        </p>
      ) : null}

      <div className="my-8 flex items-center gap-4 text-xs font-medium text-muted-foreground">
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

      <p className="mt-auto pt-9 text-center text-xs leading-relaxed text-muted-foreground">
        Ao continuar, você concorda com os{" "}
        <span className="font-semibold text-primary">Termos de uso</span> e{" "}
        <span className="font-semibold text-primary">Política de privacidade</span>.
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
      className="flex h-13 w-full items-center gap-4 rounded-2xl border border-border bg-white px-5 text-sm font-bold text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.055)] transition active:scale-[0.99] aria-disabled:cursor-not-allowed aria-disabled:opacity-55"
    >
      <span className="grid size-6 place-items-center">{icon}</span>
      <span className="flex-1 text-center">{label}</span>
      <span className="size-6" />
    </button>
  );
}

function AuthInput({
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange: (value: string) => void;
}) {
  return (
    <input
      {...props}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-4 focus:ring-primary/10"
    />
  );
}

function PrimaryButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      className="h-12 w-full rounded-2xl bg-primary text-sm font-bold text-white shadow-[0_16px_32px_rgba(0,58,255,0.18)] transition active:scale-[0.99] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function GoogleMark() {
  return <span className="text-[1.35rem] font-black text-[#4285f4]">G</span>;
}

function normalizeBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  if (value.trim().startsWith("+") && digits.length >= 11) return `+${digits}`;
  return "";
}
