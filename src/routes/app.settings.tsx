import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
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
import { PrimaryButton, SecondaryButton } from "@/components/ello/actions";
import { ElloSurface } from "@/components/ello/primitives";
import { ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";
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
    <ScreenPage>
      <ScreenHeader title="Configurações" subtitle="Conta e preferências" backTo="/app/profile" />

      <ScreenMain>
        <ElloSurface className="flex items-center gap-3 p-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black">{profile?.full_name ?? "Conta ELLO"}</h2>
            <p className="text-sm text-muted-foreground">
              {profile?.role === "professional" ? "Modo profissional" : "Modo cliente"}
            </p>
          </div>
        </ElloSurface>

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

        <ElloSurface className="space-y-3 p-4">
          <h2 className="ello-section-title">Alternar modo</h2>
          <PrimaryButton
            disabled={!configured || !user || modeMutation.isPending}
            onClick={() => modeMutation.mutate("client")}
            className="!h-12"
          >
            Modo Cliente
          </PrimaryButton>
          <button
            type="button"
            disabled={!configured || !user || modeMutation.isPending}
            onClick={() => modeMutation.mutate("professional")}
            className="ello-btn-primary btn-tactile !h-12 !bg-gradient-to-r !from-emerald-600 !to-emerald-500 !shadow-[0_16px_40px_-8px_oklch(0.62_0.18_148_/_0.35)]"
          >
            Modo Profissional
          </button>
          {modeMutation.error ? (
            <p className="rounded-[1rem] bg-destructive/10 p-3 text-xs font-bold text-destructive">
              {modeMutation.error.message}
            </p>
          ) : null}
        </ElloSurface>

        <SettingsGroup
          title="Suporte"
          items={[
            { icon: CircleHelp, label: "Central de ajuda" },
            { icon: MessageCircle, label: "Fale conosco" },
          ]}
        />

        <SecondaryButton
          onClick={() => signOutMutation.mutate()}
          disabled={signOutMutation.isPending}
          className="!border-destructive/20 !text-destructive"
        >
          <LogOut className="size-4" />
          Sair da conta
        </SecondaryButton>
      </ScreenMain>
    </ScreenPage>
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
      <h2 className="ello-section-title mb-2 px-1">{title}</h2>
      <ElloSurface className="divide-y divide-border/60 px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon className="size-5 text-foreground/75" />
              <span className="flex-1 text-sm font-semibold">{item.label}</span>
              <ChevronRight className="size-5 text-muted-foreground/60" />
            </>
          );
          return item.to ? (
            <Link key={item.label} to={item.to} className="flex items-center gap-3 py-4">
              {content}
            </Link>
          ) : (
            <div key={item.label} className="flex items-center gap-3 py-4 opacity-70">
              {content}
            </div>
          );
        })}
      </ElloSurface>
    </section>
  );
}
