import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Package,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageTitle, money, primaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getBusinessCopy, supportsAppointments } from "@/lib/localhub-business";

export const Route = createFileRoute("/studio/")({ component: DashboardPage });

function DashboardPage() {
  const { business, services, bookings, orders } = useLocalHub();
  const copy = getBusinessCopy(business?.category);
  const hasAppointments = supportsAppointments(business?.category);
  const isFoodBusiness = business?.category === "alimentacao";
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter(
    (booking) => booking.date === today && booking.status !== "cancelled",
  );
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.price])), [services]);
  const todayRevenue = isFoodBusiness
    ? orders
        .filter(
          (order) =>
            new Date(order.createdAt).toDateString() === new Date().toDateString() &&
            order.status !== "cancelled",
        )
        .reduce((sum, order) => sum + order.total, 0)
    : todayBookings.reduce((sum, b) => sum + (serviceMap.get(b.serviceId) || 0), 0);
  const upcoming = [...bookings]
    .filter((booking) => booking.status !== "cancelled")
    .sort((a, b) => (a.date + " " + a.time).localeCompare(b.date + " " + b.time))
    .slice(0, 4);
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin + "/loja/" + business!.slug);
  };

  return (
    <>
      <PageTitle
        eyebrow="Seu negócio em movimento"
        title={"Olá, " + business?.name + "!"}
        description="Aqui está um resumo do que acontece com sua página."
        action={
          <Link to="/studio/catalog" className={primaryButtonClass}>
            <Plus size={16} />
            {copy.addOffer}
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e1e3d8] bg-gradient-to-r from-[#edf0e5] to-[#fbfaf7] p-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#667448] shadow-sm">
            <Sparkles size={18} />
          </span>
          <div>
            <div className="text-sm font-bold">Prévia da sua página neste navegador</div>
            <div className="mt-1 text-xs text-slate-500">/loja/{business?.slug}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
          >
            <Copy size={14} />
            Copiar endereço
          </button>
          <Link
            to="/loja/$slug"
            params={{ slug: business!.slug }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#292b25] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#414338]"
          >
            <ExternalLink size={14} />
            Abrir página
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: isFoodBusiness
              ? "Pedidos recebidos"
              : hasAppointments
                ? `${capitalize(copy.bookings)} hoje`
                : "Agendamentos hoje",
            value: isFoodBusiness
              ? orders.filter(
                  (order) => new Date(order.createdAt).toDateString() === new Date().toDateString(),
                ).length
              : todayBookings.length,
            icon: CalendarDays,
            note: "Pedidos recebidos",
          },
          {
            label: `${capitalize(copy.offers)} ativos`,
            value: services.filter((item) => item.active).length,
            icon: Package,
            note: "Visíveis na página",
          },
          {
            label: isFoodBusiness ? "Pedidos em andamento" : "Pedidos aguardando",
            value: isFoodBusiness
              ? orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length
              : bookings.filter((item) => item.status === "pending").length,
            icon: Clock3,
            note: "Precisam da sua atenção",
          },
          {
            label: "Faturamento hoje",
            value: money(todayRevenue),
            icon: TrendingUp,
            note: "Total de vendas e atendimentos",
          },
        ].map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">{label}</span>
              <Icon size={18} className="text-[#778253]" />
            </div>
            <div className="mt-4 text-3xl font-extrabold tracking-tight">{value}</div>
            <div className="mt-1 text-xs text-slate-400">{note}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">
                {isFoodBusiness
                  ? "Pedidos recentes"
                  : hasAppointments
                    ? `${["consulta", "aula"].includes(copy.booking) ? "Próximas" : "Próximos"} ${copy.bookings}`
                    : "Próximos agendamentos"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {isFoodBusiness
                  ? "Acompanhe preparo, retirada e entregas."
                  : "Pedidos feitos pelos clientes na sua página"}
              </p>
            </div>
            <Link
              to={isFoodBusiness ? "/studio/pedidos" : "/studio/agenda"}
              className="text-xs font-bold text-[#667448]"
            >
              {isFoodBusiness ? "Ver pedidos" : "Ver agenda"}{" "}
              <ArrowUpRight size={14} className="inline" />
            </Link>
          </div>
          {isFoodBusiness ? (
            orders.slice(0, 4).length ? (
              <div className="mt-5 divide-y divide-slate-100">
                {orders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 py-4 first:pt-0"
                  >
                    <div>
                      <div className="text-sm font-bold">
                        #{order.number} · {order.customerName}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {order.items.length} itens ·{" "}
                        {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#667448]">{order.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 px-5 py-8 text-center">
                <Package className="mx-auto text-slate-300" size={26} />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Aguardando seu primeiro pedido
                </p>
              </div>
            )
          ) : upcoming.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {upcoming.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-[#edf0e5] text-sm font-bold text-[#586341]">
                      {booking.customerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{booking.customerName}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {services.find((item) => item.id === booking.serviceId)?.name ??
                          "Serviço removido"}{" "}
                        ·{" "}
                        {new Date(booking.date + "T12:00:00").toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        às {booking.time}
                      </div>
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-bold " +
                      (booking.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : booking.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500")
                    }
                  >
                    {booking.status === "pending"
                      ? "Aguardando"
                      : booking.status === "confirmed"
                        ? "Confirmado"
                        : "Cancelado"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 px-5 py-8 text-center">
              <CalendarDays className="mx-auto text-slate-300" size={26} />
              <p className="mt-3 text-sm font-semibold text-slate-600">Sua agenda está livre</p>
              <p className="mt-1 text-xs text-slate-400">
                Os novos pedidos de horário vão aparecer aqui.
              </p>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Próximos passos</h2>
          <p className="mt-1 text-xs text-slate-400">
            Deixe sua página pronta para receber clientes.
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                label: `Adicione ${copy.offers}`,
                to: "/studio/catalog",
                icon: Package,
                done: services.length > 0,
              },
              { label: "Confira sua página", to: "/studio/settings", icon: Eye, done: false },
              {
                label: hasAppointments
                  ? "Receba seu primeiro horário"
                  : "Receba seu primeiro pedido",
                to: isFoodBusiness ? "/studio/pedidos" : "/studio/agenda",
                icon: TrendingUp,
                done: isFoodBusiness ? orders.length > 0 : bookings.length > 0,
              },
            ].map(({ label, to, icon: Icon, done }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#d2d7c3] hover:bg-[#f4f5ef]"
              >
                <span
                  className={
                    "grid size-9 place-items-center rounded-xl " +
                    (done ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")
                  }
                >
                  {done ? <span className="text-sm font-bold">✓</span> : <Icon size={17} />}
                </span>
                <span className="flex-1 text-xs font-bold text-slate-700">{label}</span>
                <ArrowUpRight size={14} className="text-slate-300" />
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-[#292b25] p-4 text-white">
            <div className="text-sm font-bold">Acompanhe seu negócio</div>
            <p className="mt-1 text-xs leading-5 text-white/70">
              Confira sua página e mantenha seus serviços atualizados.
            </p>
            <Link
              to="/studio/settings"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#d5ec9a]"
            >
              Ver minha página <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
