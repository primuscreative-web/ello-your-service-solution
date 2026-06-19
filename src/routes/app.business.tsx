import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { Bell, CalendarDays, CirclePlus, FileText, UserRound, Users } from "lucide-react";
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
          <button
            onClick={() => activateMutation.mutate()}
            disabled={activateMutation.isPending}
            className="mt-5 h-12 rounded-xl bg-primary px-6 text-sm font-bold text-white"
          >
            {activateMutation.isPending ? "Criando perfil..." : "Criar perfil profissional"}
          </button>
        }
      />
    );
  }

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center justify-between px-5 pb-5 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div>
          <h1 className="text-xl font-black">Olá, {displayName}! 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Aqui está seu resumo de hoje</p>
        </div>
        <Link
          to="/app/notifications"
          aria-label="Notificações"
          className="relative grid size-10 place-items-center"
        >
          <Bell className="size-5" />
          {dashboard.quoteCount ? (
            <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {Math.min(dashboard.quoteCount, 9)}
            </span>
          ) : null}
        </Link>
      </header>

      <main className="space-y-7 px-5">
        <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
          <h2 className="text-sm font-bold text-white/85">Resumo do dia</h2>
          <div className="mt-5 grid grid-cols-2 gap-y-5">
            <Metric value={dashboard.quoteCount} label="Novos orçamentos" />
            <Metric value={dashboard.appointmentCount} label="Agendamentos" />
            <Metric value={dashboard.elloLinkLeadCount} label="Contatos recebidos" />
            <Metric value={dashboard.completedJobs} label="Serviços concluídos" />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black">Próximos agendamentos</h2>
            <Link to="/app/agenda" className="text-xs font-bold text-primary">
              Ver agenda
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {upcoming.length ? (
              upcoming.map((appointment) => (
                <article
                  key={appointment.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-4"
                >
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
              <p className="rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
                Nenhum atendimento próximo.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-base font-black">Atalhos rápidos</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <QuickAction icon={CirclePlus} label="Novo serviço" to="/app/settings" />
            <QuickAction icon={CalendarDays} label="Agenda" to="/app/agenda" />
            <QuickAction icon={Users} label="Clientes" to="/app/business/clients" />
            <QuickAction icon={UserRound} label="Meu perfil" to="/app/settings" />
          </div>
        </section>

        {dashboard.recentQuotes.length ? (
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">Orçamentos recentes</h2>
              <Link to="/app/business/quotes" className="text-xs font-bold text-primary">
                Ver todos
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {dashboard.recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  to="/app/messages"
                  search={{ quote: quote.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border p-4"
                >
                  <FileText className="size-5 text-primary" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{quote.title}</strong>
                    <span className="text-xs text-muted-foreground">{quote.subtitle}</span>
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                    {quote.status}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong className="block text-2xl font-black">{value}</strong>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
}: {
  icon: typeof CirclePlus;
  label: string;
  to: string;
}) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-border text-primary">
        <Icon className="size-5" />
      </span>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

function ProfessionalEmpty({ action, text }: { action?: React.ReactNode; text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-white px-8 text-center">
      <div>
        <UserRound className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-xl font-black">Modo profissional</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        {action}
      </div>
    </div>
  );
}
