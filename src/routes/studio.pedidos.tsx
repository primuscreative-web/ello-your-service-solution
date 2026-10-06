import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  Clock3,
  MapPin,
  MessageSquare,
  Moon,
  Phone,
  Printer,
  Search,
  Sun,
  Tag,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { PageTitle, primaryButtonClass, money } from "@/components/localhub/ui";
import { useLocalHub, type FoodOrder } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { printThermalReceipt } from "@/lib/thermal-receipt";

export const Route = createFileRoute("/studio/pedidos")({ component: OrdersPage });

const nextStatus: Partial<Record<FoodOrder["status"], FoodOrder["status"]>> = {
  received: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
  out_for_delivery: "completed",
};
const statusLabel: Record<FoodOrder["status"], string> = {
  received: "Novo",
  accepted: "Aceito",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};
const orderFilters = [
  { id: "active", label: "Em andamento" },
  { id: "received", label: "Novos" },
  { id: "preparing", label: "Em preparo" },
  { id: "ready", label: "Prontos" },
  { id: "completed", label: "Concluídos" },
  { id: "all", label: "Todos" },
] as const;
type OrderFilter = (typeof orderFilters)[number]["id"];

function OrdersPage() {
  const { business, orders, drivers, setOrderStatus, refresh } = useLocalHub();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderFilter>("active");
  const [query, setQuery] = useState("");
  const [receiptWidth, setReceiptWidth] = useState<"58mm" | "80mm">("80mm");
  const [kdsMode, setKdsMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("ello_order_sound_enabled") !== "false";
  });
  const [notificationsGranted, setNotificationsGranted] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return Notification.permission === "granted";
  });
  const knownOrderIds = useRef<Set<string> | null>(null);

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationsGranted(permission === "granted");
      if (permission === "granted") {
        new Notification("🔔 ELLO Pedidos", {
          body: "Notificações do dispositivo ativadas com sucesso!",
          icon: "/favicon.ico",
        });
      }
    } catch {
      // Navegador bloqueou ou não suporta
    }
  }

  function toggleSound() {
    setSoundEnabled((curr) => {
      const nextVal = !curr;
      if (typeof window !== "undefined") {
        localStorage.setItem("ello_order_sound_enabled", String(nextVal));
      }
      if (nextVal) playOrderChime();
      return nextVal;
    });
  }

  function playOrderChime() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Primeiro tom suave (659Hz - Mi5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Segundo tom harmônico (880Hz - Lá5 estilo campainha ding-dong)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0.18, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.7);

      setTimeout(() => {
        void ctx.close().catch(() => {});
      }, 900);
    } catch {
      // Navegadores podem bloquear áudio antes de interação do usuário
    }
  }

  useEffect(() => {
    if (!business?.id) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    // Inscrição em tempo real para novos pedidos ou atualizações de status
    const channel = client
      .channel(`studio-orders-realtime-${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "localhub_orders",
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    // Polling resiliente de fallback a cada 12 segundos
    const interval = window.setInterval(() => {
      void refresh();
    }, 12_000);

    return () => {
      void client.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [business?.id, refresh]);

  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const receivedOrders = orders.filter((order) => order.status === "received");

  // Dispara notificação nativa do sistema quando um novo pedido com status "received" é detectado
  useEffect(() => {
    if (orders.length === 0) return;
    const currentIds = new Set(orders.map((o) => o.id));

    if (knownOrderIds.current) {
      const newOrders = orders.filter(
        (o) => !knownOrderIds.current!.has(o.id) && o.status === "received",
      );
      if (
        newOrders.length > 0 &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        for (const order of newOrders) {
          try {
            new Notification(`🔔 Novo Pedido #${order.number}!`, {
              body: `${order.customerName} · ${money(order.total)} (${order.fulfillment === "delivery" ? "Entrega" : "Retirada"})`,
              icon: "/favicon.ico",
              tag: `order-${order.id}`,
            });
          } catch {}
        }
      }
    }

    knownOrderIds.current = currentIds;
  }, [orders]);

  // Alarme contínuo quando há pedidos novos aguardando aceite
  useEffect(() => {
    if (!soundEnabled || receivedOrders.length === 0) return;

    // Toca imediatamente
    playOrderChime();

    // Repete a cada 9 segundos enquanto houver pedido novo
    const soundInterval = window.setInterval(() => {
      playOrderChime();
    }, 9_000);

    return () => {
      window.clearInterval(soundInterval);
    };
  }, [receivedOrders.length, soundEnabled]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return orders.filter((order) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !["completed", "cancelled"].includes(order.status)) ||
        (filter === "received" && order.status === "received") ||
        (filter === "preparing" && ["accepted", "preparing"].includes(order.status)) ||
        (filter === "ready" && ["ready", "out_for_delivery"].includes(order.status)) ||
        (filter === "completed" && ["completed", "cancelled"].includes(order.status));
      const searchableText =
        `${order.number} ${order.customerName} ${order.phone} ${order.items.map((item) => item.name).join(" ")}`.toLocaleLowerCase(
          "pt-BR",
        );
      return matchesFilter && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [filter, orders, query]);

  function getCustomerWhatsAppLink(order: FoodOrder) {
    const cleanPhone = order.phone.replace(/\D/g, "");
    const formattedPhone =
      cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const storeName = business?.name ?? "o estabelecimento";
    const trackingUrl = order.publicTrackingToken
      ? `https://ello.app.br/pedido/${order.publicTrackingToken}`
      : `https://ello.app.br/loja/${business?.slug ?? ""}`;

    let message = "";
    if (order.status === "out_for_delivery") {
      message = `Olá, ${order.customerName}! 🛵💨 Seu Pedido #${order.number} no ${storeName} acabou de sair para entrega! Acompanhe em tempo real por aqui: ${trackingUrl}`;
    } else if (order.status === "ready") {
      message = `Olá, ${order.customerName}! 🛍️ Seu Pedido #${order.number} no ${storeName} já está prontinho para retirada no balcão!`;
    } else if (order.status === "accepted" || order.status === "preparing") {
      message = `Olá, ${order.customerName}! 👨‍🍳 Recebemos seu Pedido #${order.number} no ${storeName} e já estamos preparando com todo carinho! Acompanhe por aqui: ${trackingUrl}`;
    } else if (order.status === "completed") {
      message = `Olá, ${order.customerName}! Seu Pedido #${order.number} no ${storeName} foi concluído! Muito obrigado pela preferência! ❤️`;
    } else {
      message = `Olá, ${order.customerName}! Sobre seu Pedido #${order.number} no ${storeName}: veja os detalhes por aqui: ${trackingUrl}`;
    }

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  }

  async function update(order: FoodOrder, status: FoodOrder["status"], driverId?: string | null) {
    setBusy(order.id);
    try {
      await setOrderStatus(order.id, status, driverId);
      setError("");

      // Dispara atualização em tempo real para o WhatsApp do cliente
      void fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "order",
          order: {
            orderNumber: order.number,
            customerName: order.customerName,
            customerPhone: order.phone,
            businessName: business?.name ?? "ELLO",
            businessSlug: business?.slug ?? "",
            trackingToken: order.publicTrackingToken,
            status,
            fulfillment: order.fulfillment,
            itemsSummary: order.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
            total: order.total,
            deliveryAddress: order.address,
          },
          target: "customer",
        }),
      }).catch(() => {});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o pedido.");
    } finally {
      setBusy(null);
    }
  }

  function next(order: FoodOrder) {
    if (order.status === "ready" && order.fulfillment === "delivery")
      return "out_for_delivery" as const;
    return nextStatus[order.status];
  }

  return (
    <div
      className={
        kdsMode
          ? "-m-4 sm:-m-6 rounded-3xl bg-[#121410] p-4 sm:p-6 text-[#f2f4ec] transition-colors duration-300"
          : ""
      }
    >
      <PageTitle
        eyebrow="Operação do restaurante"
        title="Pedidos & KDS"
        description="Receba, prepare e despache cada pedido com impressão de nota para sacola, comanda de cozinha e motoboy."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                soundEnabled
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
              title={soundEnabled ? "Campainha ativada para novos pedidos" : "Campainha silenciada"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={15} className="text-emerald-700 animate-pulse" />
                  <span>Alarme: Ativo</span>
                </>
              ) : (
                <>
                  <VolumeX size={15} />
                  <span>Alarme: Mudo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void requestNotificationPermission()}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                notificationsGranted
                  ? "border-sky-300 bg-sky-50 text-sky-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Receber alertas nativos na barra do Windows/Mac/Android mesmo fora da aba"
            >
              <Bell size={14} className={notificationsGranted ? "text-sky-600" : "text-slate-400"} />
              <span>{notificationsGranted ? "Avisos no Dispositivo: Ativos" : "Ativar Avisos no Dispositivo"}</span>
            </button>

            <button
              type="button"
              onClick={() => setKdsMode((prev) => !prev)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                kdsMode
                  ? "border-[#d5ec9a]/30 bg-[#292b25] text-[#d5ec9a]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {kdsMode ? <Sun size={14} /> : <Moon size={14} />}
              {kdsMode ? "KDS Cozinha Ativo" : "Modo Cozinha (KDS)"}
            </button>

            <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
              <Printer size={14} className="text-slate-500" />
              <span>Bobina:</span>
              <select
                aria-label="Largura de impressão da comanda"
                value={receiptWidth}
                onChange={(event) => setReceiptWidth(event.target.value as "58mm" | "80mm")}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                <option value="80mm">80 mm (Padrão)</option>
                <option value="58mm">58 mm (Mini)</option>
              </select>
            </label>

            <button
              onClick={() => void refresh()}
              className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>
        }
      />
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Novos", orders.filter((order) => order.status === "received").length],
          ["Em andamento", activeOrders.length],
          ["Concluídos", orders.filter((order) => order.status === "completed").length],
        ].map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-bold">{count}</div>
          </div>
        ))}
      </div>
      <section
        aria-label="Filtrar pedidos"
        className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-500 focus-within:border-[#778253]">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Buscar pedidos</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, telefone, item ou número"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por etapa do pedido"
        >
          {orderFilters.map((item) => {
            const count =
              item.id === "active"
                ? activeOrders.length
                : item.id === "received"
                  ? orders.filter((order) => order.status === "received").length
                  : item.id === "preparing"
                    ? orders.filter((order) => ["accepted", "preparing"].includes(order.status))
                        .length
                    : item.id === "ready"
                      ? orders.filter((order) =>
                          ["ready", "out_for_delivery"].includes(order.status),
                        ).length
                      : item.id === "completed"
                        ? orders.filter((order) =>
                            ["completed", "cancelled"].includes(order.status),
                          ).length
                        : orders.length;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors ${filter === item.id ? "bg-[#292b26] text-white" : "bg-slate-50 text-slate-600 hover:bg-[#edf0e5]"}`}
              >
                {item.label}
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${filter === item.id ? "bg-white/15" : "bg-white"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      {visibleOrders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleOrders.map((order) => (
            <article
              key={order.id}
              className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                kdsMode
                  ? "border-[#2d3323] bg-[#1a1d15] text-[#f2f4ec]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#778253]">
                    Pedido #{order.number}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">{order.customerName}</h2>
                  <a
                    href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"
                  >
                    <Phone size={13} /> {order.phone}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {order.paymentStatus === "paid" || order.paymentMethod === "online_pix" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      <Zap size={12} /> Pago Pix Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Cobrar na entrega
                    </span>
                  )}
                  <span className="rounded-full bg-[#edf0e5] px-3 py-1.5 text-xs font-bold text-[#586341]">
                    {statusLabel[order.status]}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-y border-slate-100 py-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.serviceId}-${index}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span>
                      <b>{item.quantity}×</b> {item.name}
                    </span>
                    <span>{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} />
                  {new Date(order.createdAt).toLocaleString("pt-BR")}
                </span>
                <span>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</span>
                <span>
                  Pagamento:{" "}
                  {order.paymentMethod === "pix"
                    ? "Pix na entrega/retirada"
                    : order.paymentMethod === "card"
                      ? "Cartão na entrega/retirada"
                      : "Dinheiro"}
                </span>
              </div>
              {order.fulfillment === "delivery" && (
                <p className="mt-2 inline-flex items-start gap-1 text-xs text-slate-600">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  {order.address}
                  {order.deliveryAreaName && (
                    <span className="font-semibold"> · {order.deliveryAreaName}</span>
                  )}
                </p>
              )}
              {order.notes && (
                <p className="mt-2 text-xs text-slate-500">Observação: {order.notes}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[11px] text-slate-400">Total com entrega</p>
                  <b className="text-lg">{money(order.total)}</b>
                  {order.deliveryFee > 0 && (
                    <span className="ml-2 text-xs text-slate-400">
                      (entrega {money(order.deliveryFee)})
                    </span>
                  )}
                  {order.discountAmount > 0 && (
                    <span className="ml-2 text-xs font-medium text-emerald-700">
                      (cupom {order.couponCode}: −{money(order.discountAmount)})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      printThermalReceipt({
                        order,
                        business,
                        drivers,
                        type: "bag_tag",
                        width: receiptWidth,
                      })
                    }
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition"
                    title="Imprimir nota para grampear na sacola com dados do motoboy, endereço e valores"
                  >
                    <Tag size={13} /> Grampear na Sacola
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      printThermalReceipt({
                        order,
                        business,
                        drivers,
                        type: "kitchen",
                        width: receiptWidth,
                      })
                    }
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    title="Imprimir comanda de preparo para a cozinha"
                  >
                    <UtensilsCrossed size={13} /> Cozinha
                  </button>
                  <a
                    href={getCustomerWhatsAppLink(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <MessageSquare size={14} /> Avisar cliente
                  </a>
                  {order.fulfillment === "delivery" && (
                    <>
                      <select
                        aria-label="Motoboy responsável"
                        value={order.driverId ?? ""}
                        onChange={(event) =>
                          void update(order, order.status, event.target.value || null)
                        }
                        className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs"
                      >
                        <option value="">Atribuir motoboy</option>
                        {drivers
                          .filter((driver) => driver.active)
                          .map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name}
                            </option>
                          ))}
                      </select>
                      {order.driverId &&
                        (() => {
                          const driver = drivers.find((item) => item.id === order.driverId);
                          return driver ? (
                            <a
                              href={`https://wa.me/${driver.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, ${driver.name}! Nova entrega do ${business?.name ?? "estabelecimento"}. Pedido #${order.number} para ${order.customerName}. Endereço: ${order.address}. Total do pedido: ${money(order.total)}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-10 items-center rounded-xl border border-emerald-200 px-3 text-xs font-semibold text-emerald-800"
                            >
                              Enviar ao motoboy
                            </a>
                          ) : null;
                        })()}
                    </>
                  )}
                  {next(order) && (
                    <button
                      disabled={busy === order.id}
                      onClick={() => void update(order, next(order)!)}
                      className={primaryButtonClass + " min-h-10"}
                    >
                      <Check size={14} />
                      {busy === order.id ? "Salvando…" : statusLabel[next(order)!]}
                    </button>
                  )}
                  {order.status !== "cancelled" && (
                    <button
                      disabled={busy === order.id}
                      onClick={() => void update(order, "cancelled")}
                      className="rounded-xl border border-red-100 px-3 text-xs font-semibold text-red-700"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <UtensilsCrossed className="mx-auto text-[#a5b280]" size={28} />
          <h2 className="mt-3 font-bold">
            {query
              ? "Nenhum pedido encontrado"
              : filter === "active"
                ? "Nenhum pedido em andamento"
                : "Nenhum pedido nesta etapa"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {query
              ? "Tente buscar por outro nome, telefone, item ou número."
              : "Os pedidos correspondentes aparecerão aqui automaticamente."}
          </p>
        </div>
      )}
      <section className="mt-8">
        <h2 className="mb-3 font-bold">Histórico recente</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {orders
            .filter((order) => ["completed", "cancelled"].includes(order.status))
            .slice(0, 8)
            .map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-0"
              >
                <span>
                  #{order.number} · {order.customerName}
                </span>
                <span className="text-xs text-slate-500">
                  {statusLabel[order.status]} · {money(order.total)}
                </span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
