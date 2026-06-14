import { createFileRoute, Link } from "@tanstack/react-router";
import { ElloLogo } from "@/components/ello/logo";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-6 pb-10 pt-12">
      <div className="flex flex-col items-center text-center">
        <ElloLogo className="text-4xl" />
        <h1 className="font-display mt-8 text-3xl font-extrabold tracking-tight">
          Entre ou crie sua conta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Toda conta ELLO pode contratar e oferecer serviços.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        <input
          type="email"
          placeholder="seu@email.com"
          className="h-14 w-full rounded-2xl border border-border bg-white px-5 text-base outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <input
          type="password"
          placeholder="Senha"
          className="h-14 w-full rounded-2xl border border-border bg-white px-5 text-base outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <Link
          to="/role"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-foreground font-semibold text-background transition-transform active:scale-[0.98]"
        >
          Continuar
        </Link>
      </div>

      <div className="my-8 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        ou
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <SocialButton icon="📱" label="Continuar com Telefone" />
        <SocialButton icon="🔵" label="Continuar com Google" />
        <SocialButton icon="🍎" label="Continuar com Apple" />
      </div>

      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com os Termos e Política de Privacidade da ELLO.
      </p>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white font-medium text-foreground transition-colors active:bg-muted">
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  );
}