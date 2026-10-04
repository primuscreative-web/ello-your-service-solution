import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bike,
  CalendarDays,
  MapPin,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { PageTitle, money } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/metricas")({ component: MetricsPage });

const dayLabel = (date: Date) =>
  date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }).replace(".", "");

function MetricsPage() {
  const { orders, drivers, bookings, services, staff, business } = useLocalHub();
  const [range, setRange] = useState(30);
  const since = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - range + 1);
    return date;
  }, [range]);
  const filteredOrders = useMemo(
    () => orders.filter((order) => new Date(order.createdAt) >= since),
    [orders, since],
  );
  const completedOrders = filteredOrders.filter((order) => order.status === "completed");
  const validOrders = filteredOrders.filter((order) => order.status !== "cancelled");
  const grossSales = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const averageTicket = completedOrders.length ? grossSales / completedOrders.length : 0;
  const cancelledCount = filteredOrders.filter((order) => order.status === "cancelled").length;
  const cancellationRate = filteredOrders.length
    ? (cancelledCount / filteredOrders.length) * 100
    : 0;
  const deliveryCount = validOrders.filter((order) => order.fulfillment === "delivery").length;
  const pickupCount = validOrders.filter((order) => order.fulfillment === "pickup").length;

  const salesByDay = useMemo(
    () =>
      Array.from({ length: range }, (_, index) => {
        const date = new Date(since);
        date.setDate(since.getDate() + index);
        const key = date.toDateString();
        const sales = completedOrders
          .filter((order) => new Date(order.createdAt).toDateString() === key)
          .reduce((sum, order) => sum + order.total, 0);
        return { date, sales };
      }),
    [completedOrders, range, since],
  );
  const maxSales = Math.max(...salesByDay.map((item) => item.sales), 1);
  const chartPoints = salesByDay
    .map(
      (item, index) =>
        `${salesByDay.length === 1 ? 50 : (index / (salesByDay.length - 1)) * 640},${168 - (item.sales / maxSales) * 148}`,
    )
    .join(" ");

  const topProducts = useMemo(() => {
    const totals = new Map<string, { quantity: number; sales: number }>();
    for (const order of completedOrders)
      for (const item of order.items) {
        const current = totals.get(item.name) ?? { quantity: 0, sales: 0 };
        totals.set(item.name, {
          quantity: current.quantity + item.quantity,
          sales: current.sales + item.price * item.quantity,
        });
      }
    return [...totals.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [completedOrders]);

  const topAreas = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of validOrders)
      if (order.fulfillment === "delivery") {
        const area = order.deliveryAreaName || "Bairro não informado";
        totals.set(area, (totals.get(area) ?? 0) + 1);
      }
    return [...totals.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [validOrders]);

  const topDrivers = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of completedOrders)
      if (order.fulfillment === "delivery" && order.driverId)
        totals.set(order.driverId, (totals.get(order.driverId) ?? 0) + 1);
    return [...totals.entries()]
      .map(([id, count]) => ({
        name: drivers.find((driver) => driver.id === id)?.name ?? "Entregador removido",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [completedOrders, drivers]);

  const peakHour = useMemo(() => {
    const hours = new Map<number, number>();
    for (const order of validOrders) {
      const hour = new Date(order.createdAt).getHours();
      hours.set(hour, (hours.get(hour) ?? 0) + 1);
    }
    return [...hours.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [validOrders]);

  const summary = [
    {
      label: "Vendas concluídas",
      value: money(grossSales),
      hint: `${completedOrders.length} pedidos finalizados`,
      icon: TrendingUp,
    },
    {
      label: "Ticket médio",
      value: money(averageTicket),
      hint: "Por pedido concluído",
      icon: ShoppingBag,
    },
    {
      label: "Pedidos recebidos",
      value: String(filteredOrders.length),
      hint: `${deliveryCount} entregas · ${pickupCount} retiradas`,
      icon: Package,
    },
    {
      label: "Cancelamentos",
      value: `${cancellationRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
      hint: `${cancelledCount} de ${filteredOrders.length} pedidos`,
      icon: BarChart3,
    },
  ];
  const maxProductQuantity = Math.max(...topProducts.map((product) => product.quantity), 1);
  const maxAreaCount = Math.max(...topAreas.map((area) => area.count), 1);
  const maxDriverCount = Math.max(...topDrivers.map((driver) => driver.count), 1);

  const appointmentMetrics = useMemo(() => {
    const startDate = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
    const today = new Date();
    const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const current = bookings.filter(
      (booking) => booking.date >= startDate && booking.date <= endDate,
    );
    const active = current.filter((booking) => booking.status !== "cancelled");
    const countByService = new Map<string, number>();
    const countByStaff = new Map<string, number>();
    for (const booking of active) {
      countByService.set(booking.serviceId, (countByService.get(booking.serviceId) ?? 0) + 1);
      if (booking.staffId)
        countByStaff.set(booking.staffId, (countByStaff.get(booking.staffId) ?? 0) + 1);
    }
    return {
      current,
      active,
      completed: current.filter((booking) => booking.status === "completed").length,
      noShows: current.filter((booking) => booking.status === "no_show").length,
      cancelled: current.filter((booking) => booking.status === "cancelled").length,
      pending: current.filter((booking) => booking.status === "pending").length,
      services: [...countByService.entries()]
        .map(([id, count]) => ({
          name: services.find((service) => service.id === id)?.name ?? "Atendimento removido",
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      staff: [...countByStaff.entries()]
        .map(([id, count]) => ({
          name: staff.find((member) => member.id === id)?.name ?? "Profissional removido",
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [bookings, services, since, staff]);

  if (business?.category === "saude") {
    const trackedAppointments = appointmentMetrics.current.length;
    const maxServiceCount = Math.max(...appointmentMetrics.services.map((item) => item.count), 1);
    const maxStaffCount = Math.max(...appointmentMetrics.staff.map((item) => item.count), 1);
    const cards = [
      {
        label: "Agendamentos",
        value: trackedAppointments,
        note: `${appointmentMetrics.pending} aguardando confirmação`,
      },
      {
        label: "Atendimentos concluídos",
        value: appointmentMetrics.completed,
        note: `Nos últimos ${range} dias`,
      },
      {
        label: "Faltas",
        value: appointmentMetrics.noShows,
        note: "Marcadas manualmente na agenda",
      },
      {
        label: "Cancelamentos",
        value: appointmentMetrics.cancelled,
        note: "No período selecionado",
      },
    ];
    return (
      <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageTitle
            eyebrow="Desempenho"
            title="Métricas de atendimentos"
            description="Acompanhe a operação da agenda. Os indicadores não representam resultados clínicos."
          />
          <label className="mb-6 flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
            <CalendarDays size={15} />
            <span className="sr-only">Período das métricas</span>
            <select
              value={range}
              onChange={(event) => setRange(Number(event.target.value))}
              className="bg-transparent outline-none"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </label>
        </div>
        <section
          aria-label="Indicadores de atendimentos"
          className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-extrabold">{card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.note}</p>
            </article>
          ))}
        </section>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold">Atendimentos mais solicitados</h2>
            <p className="mt-1 text-xs text-slate-500">Agendamentos não cancelados no período.</p>
            {appointmentMetrics.services.length ? (
              <ul className="mt-5 space-y-4">
                {appointmentMetrics.services.map((item) => (
                  <li key={item.name}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-slate-500">{item.count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#778253]"
                        style={{ width: `${(item.count / maxServiceCount) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Ainda não há dados neste período.
              </p>
            )}
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold">Atendimentos por profissional</h2>
            <p className="mt-1 text-xs text-slate-500">
              Volume de agenda — não é uma avaliação de desempenho clínico.
            </p>
            {appointmentMetrics.staff.length ? (
              <ul className="mt-5 space-y-4">
                {appointmentMetrics.staff.map((item) => (
                  <li key={item.name}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-slate-500">{item.count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#778253]"
                        style={{ width: `${(item.count / maxStaffCount) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Atribua atendimentos a profissionais para acompanhar a distribuição.
              </p>
            )}
          </article>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle
          eyebrow="Desempenho"
          title="Métricas"
          description="Entenda os pedidos, as vendas e a operação da sua loja."
        />
        <label className="mb-6 flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
          <CalendarDays size={15} />
          <span className="sr-only">Período das métricas</span>
          <select
            value={range}
            onChange={(event) => setRange(Number(event.target.value))}
            className="bg-transparent outline-none"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </label>
      </div>

      <section
        aria-label="Indicadores principais"
        className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summary.map(({ label, value, hint, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <span className="grid size-9 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-bold">Vendas ao longo do tempo</h2>
            <p className="mt-1 text-xs text-slate-500">Somente pedidos concluídos · {range} dias</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold">{money(grossSales)}</div>
            <span className="text-[11px] text-slate-400">no período</span>
          </div>
        </div>
        {completedOrders.length ? (
          <div className="mt-5 overflow-x-auto">
            <svg
              viewBox="0 0 640 190"
              role="img"
              aria-label={`Gráfico de vendas dos últimos ${range} dias`}
              className="h-48 min-w-[600px] w-full"
            >
              <line x1="0" y1="168" x2="640" y2="168" stroke="#e8e9e2" />
              <line x1="0" y1="94" x2="640" y2="94" stroke="#f0f1ec" />
              <line x1="0" y1="20" x2="640" y2="20" stroke="#f0f1ec" />
              <polyline
                points={chartPoints}
                fill="none"
                stroke="#778253"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {salesByDay.map(
                (item, index) =>
                  item.sales > 0 && (
                    <circle
                      key={item.date.toISOString()}
                      cx={salesByDay.length === 1 ? 50 : (index / (salesByDay.length - 1)) * 640}
                      cy={168 - (item.sales / maxSales) * 148}
                      r="4"
                      fill="#778253"
                    />
                  ),
              )}
              <text x="0" y="186" fontSize="10" fill="#9b9d95">
                {dayLabel(salesByDay[0].date)}
              </text>
              <text x="600" y="186" fontSize="10" fill="#9b9d95">
                {dayLabel(salesByDay.at(-1)!.date)}
              </text>
            </svg>
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-9 text-center text-sm text-slate-500">
            As vendas concluídas aparecerão aqui quando houver pedidos no período.
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <RankCard
          title="Produtos mais vendidos"
          subtitle="Unidades em pedidos concluídos"
          icon={Package}
          items={topProducts.map((item) => ({
            label: item.name,
            value: `${item.quantity} un.`,
            ratio: item.quantity / maxProductQuantity,
            detail: money(item.sales),
          }))}
          empty="Os itens mais vendidos aparecerão após os primeiros pedidos concluídos."
        />
        <RankCard
          title="Bairros com mais pedidos"
          subtitle="Entregas por região"
          icon={MapPin}
          items={topAreas.map((item) => ({
            label: item.name,
            value: `${item.count} pedidos`,
            ratio: item.count / maxAreaCount,
          }))}
          empty="Os bairros aparecem quando clientes selecionarem uma área de entrega no checkout."
        />
        <RankCard
          title="Entregas por motoboy"
          subtitle="Pedidos concluídos atribuídos"
          icon={Bike}
          items={topDrivers.map((item) => ({
            label: item.name,
            value: `${item.count} entregas`,
            ratio: item.count / maxDriverCount,
          }))}
          empty="Atribua motoboys aos pedidos para acompanhar as entregas por pessoa."
        />
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Ritmo da operação</h2>
          <p className="mt-1 text-xs text-slate-500">Sinais para planejar melhor sua rotina.</p>
          <div className="mt-4 divide-y divide-slate-100">
            {[
              [
                "Horário de pico",
                peakHour === undefined
                  ? "Sem dados"
                  : `${String(peakHour).padStart(2, "0")}:00–${String(peakHour + 1).padStart(2, "0")}:00`,
              ],
              [
                "Entregas",
                `${deliveryCount} (${filteredOrders.length ? Math.round((deliveryCount / filteredOrders.length) * 100) : 0}%)`,
              ],
              [
                "Retiradas",
                `${pickupCount} (${filteredOrders.length ? Math.round((pickupCount / filteredOrders.length) * 100) : 0}%)`,
              ],
              [
                "Pedidos em andamento",
                String(
                  filteredOrders.filter(
                    (order) => !["completed", "cancelled"].includes(order.status),
                  ).length,
                ),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-3 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <p className="mt-5 text-[11px] leading-5 text-slate-400">
        Os indicadores são calculados apenas com os pedidos deste estabelecimento. Vendas consideram
        pedidos concluídos e não representam lucro líquido, pois custos dos produtos não foram
        cadastrados.
      </p>
    </>
  );
}

function RankCard({
  title,
  subtitle,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  icon: typeof Package;
  items: { label: string; value: string; ratio: number; detail?: string }[];
  empty: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
          <Icon size={17} />
        </span>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {items.length ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="shrink-0 text-xs font-semibold text-slate-600">
                  {item.value}
                  {item.detail ? ` · ${item.detail}` : ""}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#9ba879]"
                  style={{ width: `${Math.max(5, item.ratio * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center text-xs leading-5 text-slate-500">
          {empty}
        </p>
      )}
    </section>
  );
}
