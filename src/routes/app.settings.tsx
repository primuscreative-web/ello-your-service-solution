import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  Shield,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { chooseMyAccountMode } from "@/lib/ello-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/app/settings")({
  component: SettingsScreen,
});

function SettingsScreen() {
  const navigate = useNavigate();
  const { configured, profile, refreshProfile, user } = useAuth();
  const modeMutation = useMutation({
    mutationFn: async (mode: "client" | "professional") => {
      if (!user) throw new Error("Entre para alternar o modo.");
      await chooseMyAccountMode({
        userId: user.id,
        mode,
        displayName: profile?.full_name ?? user.email?.split("@")[0] ?? "Usuário ELLO",
        city: "São Paulo, SP",
      });
    },
    onSuccess: async (_data, mode) => {
      await refreshProfile();
      await navigate({ to: mode === "professional" ? "/app/business" : "/app" });
    },
  });
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await supabase.auth.signOut();
    },
    onSuccess: async () => {
      await navigate({ to: "/auth" });
    },
  });

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app/profile" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Configurações</h1>
        <span className="size-10" />
      </header>

      <main className="space-y-6 px-5 py-5">
        <section className="flex items-center gap-3 rounded-3xl border border-border p-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black">{profile?.full_name ?? "Conta ELLO"}</h2>
            <p className="text-sm text-muted-foreground">
              {profile?.role === "professional" ? "Modo profissional" : "Modo cliente"}
            </p>
          </div>
        </section>

        <SettingsGroup
          title="Conta"
          items={[
            { icon: UserRound, label: "Dados pessoais", to: "/app/profile" },
            { icon: Shield, label: "Segurança" },
            { icon: Bell, label: "Notificações", to: "/app/notifications" },
            { icon: LockKeyhole, label: "Privacidade" },
          ]}
        />

        <SettingsGroup
          title="Profissional"
          items={[
            { icon: MessageCircle, label: "Configuração do ELLO Link", to: "/app/ello-link" },
            { icon: FileText, label: "Serviços e orçamentos", to: "/app/business/quotes" },
            { icon: MapPin, label: "Área de atendimento", to: "/app/ello-link" },
            { icon: WalletCards, label: "Carteira ELLO", to: "/app/wallet" },
          ]}
        />

        <section className="space-y-3 rounded-3xl border border-border p-4">
          <h2 className="text-base font-black">Alternar modo</h2>
          <div className="grid gap-3">
            <button
              disabled={!configured || !user || modeMutation.isPending}
              onClick={() => modeMutation.mutate("client")}
              className="h-13 rounded-2xl bg-primary text-sm font-black text-white disabled:opacity-50"
            >
              Modo Cliente
            </button>
            <button
              disabled={!configured || !user || modeMutation.isPending}
              onClick={() => modeMutation.mutate("professional")}
              className="h-13 rounded-2xl bg-emerald-600 text-sm font-black text-white disabled:opacity-50"
            >
              Modo Profissional
            </button>
          </div>
          {modeMutation.error ? (
            <p className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {modeMutation.error.message}
            </p>
          ) : null}
        </section>

        <SettingsGroup
          title="Suporte"
          items={[
            { icon: CircleHelp, label: "Central de ajuda" },
            { icon: MessageCircle, label: "Fale conosco" },
          ]}
        />

        <button
          onClick={() => signOutMutation.mutate()}
          disabled={signOutMutation.isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-100 text-sm font-black text-red-600 disabled:opacity-50"
        >
          <LogOut className="size-4" />
          Sair da conta
        </button>
      </main>
    </div>
  );
}

function SettingsGroup({
  items,
  title,
}: {
  items: Array<{ icon: typeof Bell; label: string; to?: string }>;
  title: string;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-black">{title}</h2>
      <div className="divide-y divide-border rounded-3xl border border-border px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="size-5 text-foreground/75" />
              <span className="flex-1 text-sm font-semibold">{item.label}</span>
              <ChevronRight className="size-5 text-muted-foreground" />
            </>
          );
          return item.to ? (
            <Link key={item.label} to={item.to} className="flex items-center gap-3 py-4">
              {content}
            </Link>
          ) : (
            <div key={item.label} className="flex items-center gap-3 py-4">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
