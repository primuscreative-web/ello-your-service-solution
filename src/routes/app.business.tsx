import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  Link2,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { ElloSectionHeader } from "@/components/ello/primitives";
import {
  DarkHeroCard,
  EmptyStateCard,
  ListRowLink,
  ScreenMain,
  ScreenPage,
  StatusPill,
} from "@/components/ello/screen-layout";
import { PrimaryButton } from "@/components/ello/actions";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ensureMyProfessionalProfile,
  getMyBusinessDashboard,
  listMyAgendaItems,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/business")({
  component: ProfessionalHome,
});

function ProfessionalHome() {
  const { configured, profile, user } = useAuth();
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ["ello", "me", "business-dashboard", user?.id],
    queryFn: () => getMyBusinessDashboard(user!.id),
    enabled: Boolean(configured && user),
  });
  const agendaQuery = useQuery({
    queryKey: ["ello", "me", "agenda", user?.id],
    queryFn: () => listMyAgendaItems(user!.id),
    enabled: Boolean(configured && user),
  });
  const activateMutation = useMutation({
    mutationFn: () =>
      ensureMyProfessionalProfile({
        userId: user!.id,
        displayName: profile?.full_name ?? user?.email?.split("@")[0] ?? "Profissional ELLO",
        city: "São Paulo, SP",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ello", "me", "business-dashboard", user?.id],
      });
    },
  });

  const dashboard = dashboardQuery.data;
  const upcoming = (agendaQuery.data ?? [])
    .filter((item) => item.status === "pending" || item.status === "confirmed")
    .slice(0, 3);
  const displayName =
    dashboard?.profile?.public_name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "Profissional";

  if (!configured || !user) {
    return <ProfessionalEmpty text="Entre na sua conta para acessar o modo profissional." />;
  }
  if (dashboardQuery.isPending) {
    return <ProfessionalEmpty text="Carregando seu resumo profissional..." />;
  }
  if (!dashboard?.profile) {
    return (
      <ProfessionalEmpty
        text="Crie seu perfil profissional para publicar serviços, receber orçamentos e organizar sua agenda."
        action={
          <PrimaryButton
            onClick={() => activateMutation.mutate()}
            disabled={activateMutation.isPending}
            className="mt-5 !w-auto px-8"
          >
            {activateMutation.isPending ? "Criando perfil..." : "Criar perfil profissional"}
          </PrimaryButton>
        }
      />
    );
  }

  return (
    <ScreenPage>
      <header className="flex items-center justify-between px-5 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">
            Modo profissional
          </p>
          <h1 className="text-xl font-black tracking-[-0.03em]">Olá, {displayName}! 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aqui está seu resumo de hoje</p>
        </div>
        <Link to="/app/notifications" aria-label="Notificações" className="ello-icon-btn btn-tactile">
          <Bell className="size-4" />
          {dashboard.quoteCount ? (
            <span className="ello-icon-btn-badge">{Math.min(dashboard.quoteCount, 9)}</span>
          ) : null}
        </Link>
      </header>

      <ScreenMain className="space-y-6">
        <DarkHeroCard
          eyebrow="Centro de operação"
          title="Seu negócio em um lugar"
          description="Receba orçamentos, organize a agenda e mantenha seu perfil sempre ativo."
          icon={<Link2 className="size-5 text-white/90" />}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Novos orçamentos", value: dashboard.quoteCount },
              { label: "Agendamentos", value: dashboard.appointmentCount },
              { label: "Contatos recebidos", value: dashboard.elloLinkLeadCount },
              { label: "Serviços concluídos", value: dashboard.completedJobs },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.125rem] border border-white/12 bg-white/8 p-3 backdrop-blur-sm"
              >
                <p className="text-2xl font-black">{metric.value}</p>
                <p className="mt-1 text-[11px] text-white/75">{metric.label}</p>
              </div>
            ))}
          </div>
        </DarkHeroCard>

        <section className="animate-reveal" style={{ animationDelay: "100ms" }}>
          <ElloSectionHeader title="Próximos agendamentos" action="Ver agenda" actionTo="/app/agenda" />
          <div className="mt-3 space-y-2">
            {upcoming.length ? (
              upcoming.map((appointment) => (
                <article key={appointment.id} className="ello-surface flex items-center gap-3 p-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black">{appointment.service}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {appointment.professionalName} • {appointment.date} às {appointment.time}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="ello-surface p-5 text-center text-sm text-muted-foreground">
                Nenhum atendimento próximo.
              </p>
            )}
          </div>
        </section>

        <section className="animate-reveal" style={{ animationDelay: "140ms" }}>
          <h2 className="ello-section-title">Atalhos rápidos</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <QuickAction icon={Link2} label="ELLO Link" to="/app/ello-link" />
            <QuickAction icon={CalendarDays} label="Agenda" to="/app/agenda" />
            <QuickAction icon={Users} label="Clientes" to="/app/business/clients" />
            <QuickAction icon={UserRound} label="Configurações" to="/app/settings" />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <InsightLink
            icon={BarChart3}
            title="Estatísticas"
            body="Visitas, contatos e conversão"
            to="/app/business/statistics"
          />
          <InsightLink
            icon={Star}
            title="Avaliações"
            body="Notas e comentários recebidos"
            to="/app/business/reviews"
          />
        </section>

        {dashboard.recentQuotes.length ? (
          <section className="animate-reveal" style={{ animationDelay: "180ms" }}>
            <ElloSectionHeader title="Orçamentos recentes" action="Ver todos" actionTo="/app/business/quotes" />
            <div className="mt-3 space-y-2">
              {dashboard.recentQuotes.map((quote) => (
                <ListRowLink
                  key={quote.id}
                  to="/app/messages"
                  search={{ quote: quote.id }}
                  icon={<FileText className="size-5" />}
                  title={quote.title}
                  subtitle={quote.subtitle}
                  trailing={<StatusPill>{quote.status}</StatusPill>}
                />
              ))}
            </div>
          </section>
        ) : null}
      </ScreenMain>
    </ScreenPage>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
}: {
  icon: typeof CalendarDays;
  label: string;
  to: string;
}) {
  return (
    <Link to={to} className="btn-tactile flex flex-col items-center gap-2 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-white/80 bg-white/95 text-primary shadow-[var(--ello-shadow-sm)] transition hover:shadow-[var(--ello-shadow-md)]">
        <Icon className="size-5" />
      </span>
      <span className="text-[10px] font-extrabold text-foreground/75">{label}</span>
    </Link>
  );
}

function ProfessionalEmpty({ action, text }: { action?: React.ReactNode; text: string }) {
  return (
    <ScreenPage className="grid place-items-center">
      <EmptyStateCard
        icon={<UserRound className="size-6" />}
        title="Modo profissional"
        description={text}
        action={action}
      />
    </ScreenPage>
  );
}

function InsightLink({
  body,
  icon: Icon,
  title,
  to,
}: {
  body: string;
  icon: typeof CalendarDays;
  title: string;
  to: string;
}) {
  return (
    <Link to={to} className="ello-surface p-4 transition-all hover:-translate-y-0.5">
      <Icon className="size-5 text-primary" />
      <strong className="mt-3 block text-sm font-black">{title}</strong>
      <span className="text-xs text-muted-foreground">{body}</span>
    </Link>
  );
}
