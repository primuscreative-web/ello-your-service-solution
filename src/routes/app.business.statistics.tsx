import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, ChevronLeft, Eye, MessageCircle, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getMyProfessionalStatistics } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/business/statistics")({
  component: ProfessionalStatisticsScreen,
});

function ProfessionalStatisticsScreen() {
  const { configured, user } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["ello", "me", "business-statistics", user?.id],
    queryFn: () => getMyProfessionalStatistics(user!.id),
    enabled: Boolean(configured && user),
  });
  const stats = statsQuery.data;
  const maxDaily = Math.max(1, ...(stats?.dailyViews.map((item) => item.value) ?? [0]));
  const maxTraffic = Math.max(1, ...(stats?.trafficSources.map((item) => item.value) ?? [0]));

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app/business" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Estatísticas</h1>
        <span className="size-10" />
      </header>

      <main className="space-y-5 px-5 py-5">
        {!configured || !user ? (
          <Empty text="Entre no modo profissional para ver suas estatísticas reais." />
        ) : statsQuery.isPending ? (
          <Empty text="Carregando estatísticas..." />
        ) : stats ? (
          <>
            <section className="rounded-3xl bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-primary">
                    Visualizações do perfil
                  </p>
                  <h2 className="mt-2 text-4xl font-black">{stats.views}</h2>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </div>
                <span className="grid size-14 place-items-center rounded-2xl bg-white text-primary shadow-sm">
                  <Eye className="size-6" />
                </span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Metric icon={MessageCircle} label="Contatos recebidos" value={stats.contacts} />
              <Metric icon={BarChart3} label="Orçamentos" value={stats.quotes} />
              <Metric icon={TrendingUp} label="Conversão" value={`${stats.conversionRate}%`} />
              <Metric icon={Star} label="Avaliações" value={stats.reviewCount} />
            </section>

            <section className="rounded-3xl border border-border p-4">
              <h2 className="text-base font-black">Visualizações</h2>
              {stats.dailyViews.some((item) => item.value > 0) ? (
                <div className="mt-4 flex h-36 items-end gap-2">
                  {stats.dailyViews.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center">
                      <span
                        className="w-full rounded-t-xl bg-primary"
                        style={{ height: `${Math.max(8, (item.value / maxDaily) * 120)}px` }}
                      />
                      <span className="mt-2 truncate text-[9px] text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Ainda não há visualizações suficientes para desenhar o gráfico." />
              )}
            </section>

            <section className="rounded-3xl border border-border p-4">
              <h2 className="text-base font-black">Fontes de tráfego</h2>
              <div className="mt-4 space-y-3">
                {stats.trafficSources.map((source) => (
                  <div key={source.label}>
                    <div className="flex justify-between text-xs font-bold">
                      <span>{source.label}</span>
                      <span>{source.value}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(source.value / maxTraffic) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
}) {
  return (
    <article className="rounded-3xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <strong className="mt-3 block text-2xl font-black">{value}</strong>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-3xl bg-secondary p-5 text-center text-sm text-muted-foreground">{text}</p>
  );
}
