import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Package,
  Plus,
  Sparkles,
  TrendingUp,
  WalletCards,
  ShoppingBag,
  MessageCircle,
  Store,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { PageTitle, money, primaryButtonClass, accentButtonClass, secondaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getBusinessCopy, supportsAppointments } from "@/lib/localhub-business";
import { StudioBusinessTools } from "@/components/localhub/studio-business-tools";
import { HeroCommandCard } from "@/components/localhub/hero-command-card";

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
    : todayBookings.reduce((sum, b) => sum + (serviceMap.get(b.serviceId) || 0), 0) +
      orders
        .filter(
          (order) =>
            new Date(order.createdAt).toDateString() === new Date().toDateString() &&
            order.status !== "cancelled",
        )
        .reduce((sum, order) => sum + order.total, 0);

  const upcoming = [...bookings]
    .filter((booking) => booking.status !== "cancelled")
    .sort((a, b) => (a.date + " " + a.time).localeCompare(b.date + " " + b.time))
    .slice(0, 5);

  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    if (!business?.slug) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/loja/${business.slug}`);
      setCopied(true);
      toast.success("Link público copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const activeServicesCount = services.filter((item) => item.active).length;
  const pendingOrdersCount = isFoodBusiness
    ? orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length
    : bookings.filter((item) => item.status === "pending").length;

  return (
    <div className="space-y-7">
      {/* CABEÇALHO DO DASHBOARD COM IDENTIDADE EDITORIAL */}
      <PageTitle
        eyebrow="Painel Operacional"
        title={`Olá, ${business?.name || "Parceiro"}!`}
        description="Acompanhe suas operações, pedidos ao vivo e faturamento em tempo real."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/studio/caixa" className={secondaryButtonClass}>
              <WalletCards size={15} />
              <span>Frente de Caixa</span>
            </Link>
            <Link to="/studio/catalog" className={primaryButtonClass}>
              <Plus size={15} />
              <span>{copy.addOffer}</span>
            </Link>
          </div>
        }
      />

      {/* HERO COMMAND CARD: COMANDO DA LOJA AO VIVO */}
      <HeroCommandCard
        storeName={business?.name || "Meu Negócio"}
        storeSlug={business?.slug || ""}
        cityName={business?.city || "Negócio Local"}
        isLive={true}
      />

      {/* MÉTRICAS PRINCIPAIS (KPIS) COM DESIGN EDITORIAL TÁTIL */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: isFoodBusiness
              ? "Pedidos hoje"
              : hasAppointments
                ? `${capitalize(copy.bookings)} hoje`
                : "Agendamentos hoje",
            value: isFoodBusiness
              ? orders.filter(
                  (order) => new Date(order.createdAt).toDateString() === new Date().toDateString(),
                ).length
              : todayBookings.length,
            icon: CalendarDays,
            note: "Recebidos no dia",
            accent: "text-[#5e6940] bg-[#edf0e5]",
            badge: "Hoje",
          },
          {
            label: isFoodBusiness
              ? "Pedidos pendentes"
              : hasAppointments
                ? `${capitalize(copy.bookings)} pendentes`
                : "Aguardando confirmação",
            value: pendingOrdersCount,
            icon: Clock3,
            note: pendingOrdersCount > 0 ? "Precisam de atenção rápida" : "Tudo em dia",
            accent: pendingOrdersCount > 0 ? "text-amber-800 bg-amber-100" : "text-emerald-800 bg-emerald-100",
            badge: pendingOrdersCount > 0 ? "Atenção" : "Em dia",
          },
          {
            label: `${capitalize(copy.offers)} no catálogo`,
            value: activeServicesCount,
            icon: Package,
            note: "Itens ativos para venda",
            accent: "text-blue-800 bg-blue-100",
            badge: "Catálogo",
          },
          {
            label: "Faturamento hoje",
            value: money(todayRevenue),
            icon: TrendingUp,
            note: "Total de vendas e serviços",
            accent: "text-emerald-900 bg-[#d4f455]/40",
            badge: "Em tempo real",
          },
        ].map(({ label, value, icon: Icon, note, accent, badge }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-[#dedfd6]/80 bg-white p-5 shadow-[0_1px_2px_rgba(20,24,15,0.02),0_4px_16px_-2px_rgba(20,24,15,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:shadow-[0_4px_14px_rgba(20,24,15,0.06)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#63665a]">
                {label}
              </span>
              <span className={`grid size-8 place-items-center rounded-lg ${accent} transition-transform group-hover:scale-105`}>
                <Icon size={16} />
              </span>
            </div>

            <div className="mt-3.5 font-display text-2xl sm:text-3xl font-black tracking-[-0.03em] text-[#171914] tabular-nums">
              {value}
            </div>

            <div className="mt-1.5 flex items-center justify-between text-xs text-[#7e8275]">
              <span>{note}</span>
              <span className="rounded-md bg-[#f2f1ea] px-1.5 py-0.5 text-[10px] font-bold text-[#55584d]">
                {badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* HUB DE FERRAMENTAS DO NEGÓCIO */}
      <div className="rounded-3xl border border-[#dedfd6] bg-white p-5 sm:p-6 shadow-sm">
        <StudioBusinessTools />
      </div>

      {/* FEED DE PEDIDOS / AGENDAMENTOS E CHECKLIST */}
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* PAINEL OPERACIONAL ESQUERDO: PEDIDOS / AGENDAMENTOS RECENTES */}
        <section className="rounded-3xl border border-[#dedfd6] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e8e6df] pb-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-black tracking-tight text-[#171914]">
                {isFoodBusiness
                  ? "Pedidos recentes ao vivo"
                  : hasAppointments
                    ? `Próximos atendimentos de ${copy.bookings}`
                    : "Próximos agendamentos"}
              </h2>
              <p className="mt-0.5 text-xs text-[#76796d]">
                {isFoodBusiness
                  ? "Fluxo de preparo, retirada e despacho em tempo real."
                  : "Clientes agendados pela sua página pública ELLO."}
              </p>
            </div>
            <Link
              to={isFoodBusiness ? "/studio/pedidos" : "/studio/agenda"}
              className="inline-flex items-center gap-1 rounded-xl bg-[#edf0e5] px-3 py-1.5 text-xs font-bold text-[#4e5834] transition hover:bg-[#e0e5d5]"
            >
              <span>{isFoodBusiness ? "Ver todos" : "Ver agenda"}</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {isFoodBusiness ? (
            orders.slice(0, 5).length ? (
              <div className="mt-4 divide-y divide-[#f0efe9]">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf0e5] text-xs font-black text-[#586341]">
                        #{order.number}
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#171914]">
                          {order.customerName || "Cliente"}
                        </div>
                        <div className="text-[11px] text-[#76796d]">
                          {order.items.length} itens · {money(order.total)} ·{" "}
                          {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#f2f1ea] px-2.5 py-1 text-[11px] font-bold text-[#4c5042] uppercase tracking-wider">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#d8d6cc] bg-[#fbfbf8] px-5 py-9 text-center">
                <ShoppingBag className="mx-auto text-[#9fa295]" size={30} />
                <h3 className="mt-2 text-sm font-bold text-[#2d3027]">Aguardando novos pedidos</h3>
                <p className="mt-1 text-xs text-[#7d8173]">
                  Compartilhe seu link público nas redes para começar a receber pedidos!
                </p>
              </div>
            )
          ) : upcoming.length ? (
            <div className="mt-4 divide-y divide-[#f0efe9]">
              {upcoming.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf0e5] text-xs font-black text-[#586341]">
                      {booking.customerName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#171914]">{booking.customerName}</div>
                      <div className="text-[11px] text-[#76796d]">
                        {services.find((item) => item.id === booking.serviceId)?.name ?? "Serviço"} ·{" "}
                        {booking.date} às {booking.time}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      booking.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {booking.status === "confirmed" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8d6cc] bg-[#fbfbf8] px-5 py-9 text-center">
              <CalendarDays className="mx-auto text-[#9fa295]" size={30} />
              <h3 className="mt-2 text-sm font-bold text-[#2d3027]">Sua agenda está livre</h3>
              <p className="mt-1 text-xs text-[#7d8173]">
                Os novos agendamentos feitos pelos seus clientes aparecerão aqui.
              </p>
            </div>
          )}
        </section>

        {/* PAINEL DIREITO: ATALHOS RÁPIDOS & CANAIS DE EXPANSÃO */}
        <section className="space-y-4">
          <div className="rounded-3xl border border-[#dedfd6] bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="font-display text-base font-black tracking-tight text-[#171914]">
              Próximos Passos
            </h2>
            <p className="mt-0.5 text-xs text-[#76796d]">
              Complete para potencializar suas vendas locais.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  label: `Cadastrar ${copy.offers}`,
                  to: "/studio/catalog",
                  icon: Package,
                  done: services.length > 0,
                },
                {
                  label: "Personalizar página e WhatsApp",
                  to: "/studio/settings",
                  icon: MessageCircle,
                  done: Boolean(business?.phone),
                },
                {
                  label: "Configurar frente de caixa (PDV)",
                  to: "/studio/caixa",
                  icon: WalletCards,
                  done: true,
                },
              ].map(({ label, to, icon: Icon, done }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 rounded-xl border border-[#e8e6df] p-3 transition hover:border-[#c7c9bc] hover:bg-[#fafaf6]"
                >
                  <span
                    className={`grid size-8 place-items-center rounded-lg text-xs font-black ${
                      done ? "bg-emerald-100 text-emerald-800" : "bg-[#f2f1ea] text-[#6d7164]"
                    }`}
                  >
                    {done ? "✓" : <Icon size={15} />}
                  </span>
                  <span className="flex-1 text-xs font-bold text-[#2b2e25]">{label}</span>
                  <ChevronRight size={14} className="text-[#a5a999]" />
                </Link>
              ))}
            </div>
          </div>

          {/* CARD DE INCENTIVO WHATSAPP */}
          <div className="rounded-3xl border border-[#2e3128] bg-[#1a1c16] p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-[#d4f455]">
              <Sparkles size={14} />
              <span>Dica de Crescimento</span>
            </div>
            <h3 className="mt-2 text-sm font-black">Divulgue no seu status do WhatsApp</h3>
            <p className="mt-1 text-xs text-[#b8bcaf] leading-relaxed">
              Negócios que compartilham o link da ELLO nos stories e no status têm até 3.4x mais pedidos diretos sem pagar comissão.
            </p>
            <button
              onClick={() => void copyLink()}
              type="button"
              className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4f455] py-2.5 text-xs font-black text-[#151712] transition hover:bg-[#dff96b]"
            >
              <Copy size={13} />
              <span>Copiar link para o WhatsApp</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
