import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Eye, MessageCircle, Star, TrendingUp } from "lucide-react";
import { ElloEyebrow, ElloSurface } from "@/components/ello/primitives";
import {
  EmptyStateCard,
  MetricTile,
  ScreenHeader,
  ScreenMain,
  ScreenPage,
} from "@/components/ello/screen-layout";
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
    <ScreenPage>
      <ScreenHeader title="Estatísticas" subtitle="Performance do seu perfil" backTo="/app/business" />

      <ScreenMain>
        {!configured || !user ? (
          <Empty text="Entre no modo profissional para ver suas estatísticas reais." />
        ) : statsQuery.isPending ? (
          <Empty text="Carregando estatísticas..." />
        ) : stats ? (
          <>
            <ElloSurface elevated className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <ElloEyebrow>Visualizações do perfil</ElloEyebrow>
                  <h2 className="mt-3 text-4xl font-black tracking-tight">{stats.views}</h2>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </div>
                <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Eye className="size-6" />
                </span>
              </div>
            </ElloSurface>

            <section className="grid grid-cols-2 gap-3">
              <MetricTile icon={<MessageCircle className="size-4" />} label="Contatos" value={stats.contacts} />
              <MetricTile icon={<BarChart3 className="size-4" />} label="Orçamentos" value={stats.quotes} />
              <MetricTile icon={<TrendingUp className="size-4" />} label="Conversão" value={`${stats.conversionRate}%`} />
              <MetricTile icon={<Star className="size-4" />} label="Avaliações" value={stats.reviewCount} />
            </section>

            <ElloSurface className="p-4">
              <h2 className="ello-section-title">Visualizações</h2>
              {stats.dailyViews.some((item) => item.value > 0) ? (
                <div className="mt-4 flex h-36 items-end gap-2">
                  {stats.dailyViews.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center">
                      <span
                        className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/70"
                        style={{ height: `${Math.max(8, (item.value / maxDaily) * 120)}px` }}
                      />
                      <span className="mt-2 truncate text-[9px] font-medium text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty text="Ainda não há visualizações suficientes para desenhar o gráfico." />
              )}
            </ElloSurface>

            <ElloSurface className="p-4">
              <h2 className="ello-section-title">Fontes de tráfego</h2>
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
            </ElloSurface>
          </>
        ) : null}
      </ScreenMain>
    </ScreenPage>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <EmptyStateCard icon={<BarChart3 className="size-6" />} title="Estatísticas" description={text} />
  );
}
