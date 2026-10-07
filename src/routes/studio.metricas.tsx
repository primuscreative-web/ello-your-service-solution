import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bike,
  CalendarDays,
  Coins,
  MapPin,
  Package,
  Scissors,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { PageTitle, money } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

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
  const chartData = useMemo(
    () =>
      salesByDay.map((item) => ({
        label: dayLabel(item.date),
        fullDate: item.date.toLocaleDateString("pt-BR"),
        vendas: item.sales,
      })),
    [salesByDay],
  );

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

  const isFoodBusiness = business?.category === "alimentacao";

  const appointmentMetrics = useMemo(() => {
    const startDate = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
    const today = new Date();
    const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const current = bookings.filter(
      (booking) => booking.date >= startDate && booking.date <= endDate,
    );
    const active = current.filter((booking) => booking.status !== "cancelled");
    const completed = current.filter((booking) => booking.status === "completed");

    let totalRevenue = 0;
    let totalSuppliesCost = 0;
    const countByService = new Map<string, { count: number; revenue: number }>();
    const countByStaff = new Map<string, number>();

    for (const booking of active) {
      const s = services.find((service) => service.id === booking.serviceId);
      const price = s?.price ?? 0;
      const cost = s?.costPrice ?? 0;

      if (booking.status === "completed") {
        totalRevenue += price;
        totalSuppliesCost += cost;
      }

      const prev = countByService.get(booking.serviceId) ?? { count: 0, revenue: 0 };
      countByService.set(booking.serviceId, {
        count: prev.count + 1,
        revenue: prev.revenue + price,
      });

      if (booking.staffId) {
        countByStaff.set(booking.staffId, (countByStaff.get(booking.staffId) ?? 0) + 1);
      }
    }

    const grossProfit = totalRevenue - totalSuppliesCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

    const dailyTrend = Array.from({ length: range }, (_, index) => {
      const date = new Date(since);
      date.setDate(since.getDate() + index);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dayBookings = current.filter(
        (b) => b.date === dateStr && b.status === "completed",
      );
      const daySales = dayBookings.reduce((sum, b) => {
        const s = services.find((srv) => srv.id === b.serviceId);
        return sum + (s?.price ?? 0);
      }, 0);
      return {
        date,
        label: dayLabel(date),
        fullDate: date.toLocaleDateString("pt-BR"),
        vendas: daySales,
        atendimentos: dayBookings.length,
      };
    });

    return {
      current,
      active,
      completed: completed.length,
      noShows: current.filter((booking) => booking.status === "no_show").length,
      cancelled: current.filter((booking) => booking.status === "cancelled").length,
      pending: current.filter((booking) => booking.status === "pending").length,
      totalRevenue,
      totalSuppliesCost,
      grossProfit,
      profitMargin,
      averageTicket,
      dailyTrend,
      services: [...countByService.entries()]
        .map(([id, data]) => ({
          name: services.find((service) => service.id === id)?.name ?? "Atendimento",
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      staff: [...countByStaff.entries()]
        .map(([id, count]) => ({
          name: staff.find((member) => member.id === id)?.name ?? "Profissional",
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [bookings, services, since, staff, range]);

  if (!isFoodBusiness) {
    const trackedAppointments = appointmentMetrics.current.length;
    const maxServiceCount = Math.max(...appointmentMetrics.services.map((item) => item.count), 1);
    const maxStaffCount = Math.max(...appointmentMetrics.staff.map((item) => item.count), 1);

    const isBeauty = business?.category === "beleza" || business?.category === "barbearia";
    const eyebrow = isBeauty
      ? "Beleza, Barbearia & Estética"
      : business?.category === "saude"
      ? "Saúde & Bem-Estar"
      : business?.category === "pet"
      ? "Pet Shop & Estética Animal"
      : "Serviços & Atendimentos";

    const title = isBeauty
      ? "Métricas de Atendimentos, Faturamento & Custos"
      : "Métricas de Atendimentos & Faturamento";

    const cards = [
      {
        label: "Faturamento com Serviços",
        value: money(appointmentMetrics.totalRevenue),
        note: `${appointmentMetrics.completed} atendimentos concluídos`,
        icon: TrendingUp,
      },
      {
        label: "Custo Estimado de Insumos",
        value: money(appointmentMetrics.totalSuppliesCost),
        note: "Produtos e descartáveis consumidos",
        icon: Coins,
      },
      {
        label: "Lucro Bruto Real",
        value: money(appointmentMetrics.grossProfit),
        note: `Margem bruta: ${appointmentMetrics.profitMargin.toFixed(1).replace(".", ",")}%`,
        icon: DollarSign,
      },
      {
        label: "Ticket Médio",
        value: money(appointmentMetrics.averageTicket),
        note: `${trackedAppointments} agendamentos no período`,
        icon: Sparkles,
      },
    ];

    return (
      <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageTitle
            eyebrow={eyebrow}
            title={title}
            description="Acompanhe o faturamento, custos de produtos de bancada, margem de lucro real e fluxo de atendimentos da equipe."
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
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
                    <Icon size={16} />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black text-[#292b25]">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.note}</p>
              </article>
            );
          })}
        </section>

        {/* GRÁFICO DE FATURAMENTO AO LONGO DO TEMPO */}
        <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-bold">Faturamento de Atendimentos ao Longo do Tempo</h2>
              <p className="mt-1 text-xs text-slate-500">
                Atendimentos concluídos · últimos {range} dias
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold text-emerald-900">
                {money(appointmentMetrics.totalRevenue)}
              </div>
              <span className="text-[11px] text-slate-400">faturado no período</span>
            </div>
          </div>

          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appointmentMetrics.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="serviceSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#778253" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#778253" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip
                  formatter={((val: any) => [
                    money(typeof val === "number" ? val : Number(val ?? 0)),
                    "Faturamento",
                  ]) as any}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullDate?: string; atendimentos?: number } | undefined)?.fullDate
                      ? `${(payload[0].payload as any).fullDate} (${(payload[0].payload as any).atendimentos} atendimentos)`
                      : ""
                  }
                  contentStyle={{
                    backgroundColor: "#292b25",
                    borderColor: "#3f4236",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#d5ec9a", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="#778253"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#serviceSalesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RANKINGS E RITMO DA AGENDA */}
        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          {/* PROCEDIMENTOS MAIS SOLICITADOS */}
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Scissors size={17} className="text-[#687348]" />
              <h2 className="font-bold">Procedimentos Mais Solicitados</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Volume e faturamento gerado.</p>
            {appointmentMetrics.services.length ? (
              <ul className="mt-5 space-y-4">
                {appointmentMetrics.services.map((item) => (
                  <li key={item.name}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-500 font-bold">
                        {item.count} un · {money(item.revenue)}
                      </span>
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
                Ainda não há atendimentos neste período.
              </p>
            )}
          </article>

          {/* ATENDIMENTOS POR PROFISSIONAL */}
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-[#687348]" />
              <h2 className="font-bold">Atendimentos por Profissional</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Distribuição dos atendimentos da equipe.
            </p>
            {appointmentMetrics.staff.length ? (
              <ul className="mt-5 space-y-4">
                {appointmentMetrics.staff.map((item) => (
                  <li key={item.name}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-500 font-bold">{item.count} atendimentos</span>
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
                Atribua profissionais aos agendamentos para acompanhar a distribuição.
              </p>
            )}
          </article>

          {/* RITMO DA OPERAÇÃO / AGENDA */}
          <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="text-[#687348]" />
              <h2 className="font-bold">Status da Operação</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Resumo da rotina da agenda.</p>
            <div className="mt-5 divide-y divide-slate-100">
              <div className="flex justify-between py-2.5 text-xs">
                <span className="text-slate-600 font-medium">Concluídos com sucesso</span>
                <strong className="text-emerald-700 font-bold">{appointmentMetrics.completed}</strong>
              </div>
              <div className="flex justify-between py-2.5 text-xs">
                <span className="text-slate-600 font-medium">Aguardando confirmação</span>
                <strong className="text-amber-700 font-bold">{appointmentMetrics.pending}</strong>
              </div>
              <div className="flex justify-between py-2.5 text-xs">
                <span className="text-slate-600 font-medium">Faltas registradas (no-show)</span>
                <strong className="text-slate-700 font-bold">{appointmentMetrics.noShows}</strong>
              </div>
              <div className="flex justify-between py-2.5 text-xs">
                <span className="text-slate-600 font-medium">Cancelamentos</span>
                <strong className="text-red-600 font-bold">{appointmentMetrics.cancelled}</strong>
              </div>
            </div>
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
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#778253" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#778253" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip
                  formatter={((val: any) => [
                    money(typeof val === "number" ? val : Number(val ?? 0)),
                    "Vendas",
                  ]) as any}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullDate?: string } | undefined)?.fullDate ?? ""}
                  contentStyle={{
                    backgroundColor: "#292b25",
                    borderColor: "#3f4236",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  }}
                  itemStyle={{ color: "#d5ec9a", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="#778253"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
