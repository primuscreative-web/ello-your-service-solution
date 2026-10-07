import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { UsersRound, Search, Send, Tag, Plus, Link2, Copy, MessageCircle } from "lucide-react";
import { Field, inputClass, PageTitle, primaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/studio/crm")({ component: FoodCrmPage });

type Customer = {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
  marketing_consent: boolean;
  first_order_at: string | null;
  last_order_at: string | null;
  orders_count: number;
  lifetime_value: number;
  loyalty_balance: number;
  segment: "new" | "recurring" | "inactive" | "vip";
};
type Coupon = {
  id: string;
  code: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  minimum_order: number;
  first_order_only: boolean;
  per_customer_limit: number | null;
  usage_limit: number | null;
  is_active: boolean;
};
type AbandonedCart = {
  id: string;
  phone_e164: string | null;
  cart: { id: string; name: string; quantity: number }[];
  abandoned_at: string;
};
type CustomerOrder = {
  id: string;
  order_number: number;
  status: string;
  total: number;
  created_at: string;
  fulfillment: string;
  payment_method: string;
  items: { item_name: string; quantity: number; line_total: number }[];
};
type Campaign = {
  id: string;
  name: string;
  slug: string;
  coupon_id: string | null;
  clicks: number;
  conversions: number;
};
const segmentLabels = { new: "Novo", recurring: "Recorrente", inactive: "Inativo", vip: "VIP" };
const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const toCampaignSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function FoodCrmPage() {
  const { business } = useLocalHub();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("10");
  const [couponType, setCouponType] = useState<"percent" | "fixed">("percent");
  const [minimum, setMinimum] = useState("0");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [perCustomerLimit, setPerCustomerLimit] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [redeemingCustomerId, setRedeemingCustomerId] = useState<string | null>(null);
  const [redemptionUnits, setRedemptionUnits] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [queueingCartId, setQueueingCartId] = useState<string | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Record<string, CustomerOrder[]>>({});
  const [loadingOrdersFor, setLoadingOrdersFor] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignCouponId, setCampaignCouponId] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  const load = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client || !business?.id) return;
    const eligibleSince = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const discardBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [customerResult, couponResult, cartResult, campaignResult, bookingsResult] = await Promise.all([
      client.rpc("localhub_food_customers", { p_business_id: business.id }),
      client
        .from("localhub_coupons")
        .select(
          "id,code,discount_type,discount_value,minimum_order,first_order_only,per_customer_limit,usage_limit,is_active",
        )
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
      client
        .from("localhub_abandoned_carts")
        .select("id,phone_e164,cart,abandoned_at")
        .eq("business_id", business.id)
        .not("recovery_consent_at", "is", null)
        .is("recovered_order_id", null)
        .is("recovery_message_queued_at", null)
        .lte("abandoned_at", eligibleSince)
        .gte("abandoned_at", discardBefore)
        .order("abandoned_at", { ascending: true })
        .limit(50),
      client
        .from("localhub_campaign_links")
        .select("id,name,slug,coupon_id,clicks,conversions")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false }),
      client
        .from("localhub_bookings")
        .select("id,customer_name,phone,created_at,date,status")
        .eq("business_id", business.id)
        .neq("status", "cancelled"),
    ]);
    if (couponResult.error || cartResult.error || campaignResult.error) {
      setError(
        couponResult.error?.message ??
          cartResult.error?.message ??
          campaignResult.error?.message ??
          "Falha ao consultar CRM.",
      );
      return;
    }

    const foodCustomers = (customerResult.data ?? []) as Customer[];
    const knownPhones = new Set(foodCustomers.map((c) => c.phone_e164.replace(/\D/g, "")));

    const bookingCustomersMap = new Map<string, Customer>();
    for (const b of (bookingsResult.data ?? [])) {
      const cleanPhone = (b.phone || "").replace(/\D/g, "");
      if (!cleanPhone || knownPhones.has(cleanPhone)) continue;

      if (!bookingCustomersMap.has(cleanPhone)) {
        bookingCustomersMap.set(cleanPhone, {
          id: `booking-${cleanPhone}`,
          full_name: b.customer_name || "Cliente",
          phone_e164: b.phone,
          email: null,
          marketing_consent: true,
          first_order_at: b.created_at,
          last_order_at: b.created_at,
          orders_count: 1,
          lifetime_value: 0,
          loyalty_balance: 0,
          segment: "new",
        });
      } else {
        const item = bookingCustomersMap.get(cleanPhone)!;
        item.orders_count += 1;
        item.segment = item.orders_count > 1 ? "recurring" : "new";
      }
    }

    const mergedCustomers = [...foodCustomers, ...Array.from(bookingCustomersMap.values())];
    setCustomers(mergedCustomers);
    setCoupons((couponResult.data ?? []) as Coupon[]);
    setAbandonedCarts((cartResult.data ?? []) as AbandonedCart[]);
    setCampaigns((campaignResult.data ?? []) as Campaign[]);
    setError("");
  }, [business?.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const visibleCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          (segment === "all" || customer.segment === segment) &&
          `${customer.full_name} ${customer.phone_e164}`
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [customers, query, segment],
  );

  async function queueReengagement(customer: Customer) {
    const client = getSupabaseBrowserClient();
    if (!client || !business?.id) return;
    if (!customer.marketing_consent) {
      setError("Este cliente não autorizou mensagens promocionais.");
      return;
    }
    const { error: writeError } = await client.from("localhub_message_outbox").insert({
      business_id: business.id,
      customer_id: customer.id,
      channel: "whatsapp",
      trigger_type: "inactive_customer",
      destination: customer.phone_e164,
      payload: { template: "customer_reengagement", customerName: customer.full_name },
    });
    if (writeError) setError(writeError.message);
    else {
      setError("");
      setNotice("Lembrete adicionado à fila. O envio depende da integração de mensagens.");
      window.setTimeout(() => setNotice(""), 5000);
    }
  }

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business?.id) return;
    setSaving(true);
    const client = getSupabaseBrowserClient();
    const { error: writeError } = await client!.from("localhub_coupons").insert({
      business_id: business.id,
      code: code.trim().toUpperCase(),
      discount_type: couponType,
      discount_value: Number(discount),
      minimum_order: Number(minimum),
      first_order_only: firstOrderOnly,
      per_customer_limit: perCustomerLimit ? Number(perCustomerLimit) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
    });
    setSaving(false);
    if (writeError) setError(writeError.message);
    else {
      setCode("");
      setNotice("Cupom criado.");
      await load();
    }
  }

  async function redeemCustomerBalance(event: FormEvent<HTMLFormElement>, customer: Customer) {
    event.preventDefault();
    if (!business?.id || !redemptionUnits) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setRedeeming(true);
    setError("");
    const { data, error: redemptionError } = await client.rpc("localhub_redeem_food_loyalty", {
      p_business_id: business.id,
      p_customer_id: customer.id,
      p_balance_units: Number(redemptionUnits),
    });
    setRedeeming(false);
    if (redemptionError) {
      setError(redemptionError.message);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    setRedeemingCustomerId(null);
    setRedemptionUnits("");
    setNotice(`Resgate registrado: ${formatMoney(Number(result.discount_amount))}.`);
    await load();
  }

  async function queueAbandonedCartRecovery(cart: AbandonedCart) {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setQueueingCartId(cart.id);
    setError("");
    const { error: queueError } = await client.rpc("localhub_queue_abandoned_food_cart_recovery", {
      p_cart_id: cart.id,
    });
    setQueueingCartId(null);
    if (queueError) {
      setError(queueError.message);
      return;
    }
    setNotice("Lembrete preparado na fila. O envio depende de uma integração de mensagens.");
    await load();
  }

  async function createCampaignLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business?.id) return;
    const normalizedSlug = toCampaignSlug(campaignName);
    if (!normalizedSlug) {
      setError("Informe um nome para gerar o endereço da campanha.");
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setSavingCampaign(true);
    setError("");
    const { error: createError } = await client.from("localhub_campaign_links").insert({
      business_id: business.id,
      name: campaignName.trim(),
      slug: normalizedSlug,
      coupon_id: campaignCouponId || null,
    });
    setSavingCampaign(false);
    if (createError) {
      setError(
        createError.code === "23505"
          ? "Já existe um link com este nome de campanha. Altere o nome e tente novamente."
          : createError.message,
      );
      return;
    }
    setCampaignName("");
    setCampaignCouponId("");
    setNotice("Link de campanha criado. Os acessos serão contabilizados ao abrir o link.");
    await load();
  }

  async function copyCampaignLink(campaign: Campaign) {
    if (!business?.slug) return;
    const link = `${window.location.origin}/c/${business.slug}/${campaign.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Link copiado.");
    } catch {
      setError("Não foi possível copiar o link neste navegador.");
    }
  }

  async function toggleCustomerHistory(customer: Customer) {
    if (expandedCustomerId === customer.id) {
      setExpandedCustomerId(null);
      return;
    }
    setExpandedCustomerId(customer.id);
    if (customer.id in customerOrders || !business?.id) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setLoadingOrdersFor(customer.id);
    const { data: orders, error: orderError } = await client
      .from("localhub_orders")
      .select("id,order_number,status,total,created_at,fulfillment,payment_method")
      .eq("business_id", business.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (orderError) {
      setError(orderError.message);
      setLoadingOrdersFor(null);
      return;
    }
    const orderIds = (orders ?? []).map((order) => order.id);
    const { data: items, error: itemsError } = orderIds.length
      ? await client
          .from("localhub_order_items")
          .select("order_id,item_name,quantity,line_total")
          .in("order_id", orderIds)
      : { data: [], error: null };
    if (itemsError) {
      setError(itemsError.message);
      setLoadingOrdersFor(null);
      return;
    }
    const itemsByOrder = new Map<string, CustomerOrder["items"]>();
    for (const item of items ?? []) {
      const orderItems = itemsByOrder.get(item.order_id) ?? [];
      orderItems.push({
        item_name: item.item_name,
        quantity: Number(item.quantity),
        line_total: Number(item.line_total),
      });
      itemsByOrder.set(item.order_id, orderItems);
    }
    setCustomerOrders((current) => ({
      ...current,
      [customer.id]: (orders ?? []).map((order) => ({
        ...order,
        order_number: Number(order.order_number),
        total: Number(order.total),
        fulfillment: order.fulfillment ?? "",
        payment_method: order.payment_method ?? "",
        items: itemsByOrder.get(order.id) ?? [],
      })),
    }));
    setLoadingOrdersFor(null);
  }

  const getCustomerWhatsAppMessage = (customer: Customer) => {
    const bizName = business?.name ?? "nosso negócio";
    const slug = business?.slug ? `https://ello.app.br/loja/${business.slug}` : "";
    const cat = business?.category;

    if (customer.segment === "inactive") {
      if (cat === "beleza" || cat === "barbearia") {
        return `Olá, ${customer.full_name}! Passando para saber como você está e se já está na hora de renovar seu corte/visual no *${bizName}*! ✂️ Dá uma olhada nos nossos horários disponíveis: ${slug}`;
      }
      if (cat === "pet") {
        return `Olá, ${customer.full_name}! Como está o seu pet? 🐾 Sentimos falta de vocês no *${bizName}*! Que tal agendar um banho e tosa para deixá-lo cheiroso? Veja aqui: ${slug}`;
      }
      if (cat === "saude") {
        return `Olá, ${customer.full_name}! Passando para acompanhar seu bem-estar com a equipe do *${bizName}*. Caso queira agendar um retorno ou nova consulta: ${slug}`;
      }
      if (cat === "alimentacao") {
        return `Olá, ${customer.full_name}! Sentimos sua falta aqui no *${bizName}*! ❤️ Preparamos um presente especial para matar a vontade. Acesse nosso cardápio online com novidades: ${slug}`;
      }
      return `Olá, ${customer.full_name}! Sentimos sua falta aqui no *${bizName}*! Estamos à disposição com condições especiais. Confira nossa página: ${slug}`;
    }

    // Para clientes ativos, VIP ou recorrentes
    return `Olá, ${customer.full_name}! Tudo bem? Passando para agradecer pela sua preferência com a equipe do *${bizName}*. Estamos à disposição! ${slug}`;
  };

  return (
    <>
      <PageTitle
        eyebrow="Relacionamento e recorrência"
        title="Clientes e promoções"
        description="Histórico de compra, segmentos e cupons para aproximar clientes e acompanhar a recorrência."
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {(["new", "recurring", "inactive", "vip"] as const).map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => setSegment(segment === key ? "all" : key)}
            className={`rounded-2xl border bg-white p-4 text-left ${segment === key ? "border-[#778253] ring-1 ring-[#778253]" : "border-slate-100"}`}
          >
            <span className="text-xs text-slate-500">{segmentLabels[key]}</span>
            <strong className="mt-1 block text-2xl">
              {customers.filter((customer) => customer.segment === key).length}
            </strong>
          </button>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <UsersRound size={18} className="text-[#778253]" />
            <h2 className="font-bold">Base de clientes</h2>
            <span className="ml-auto text-xs text-slate-500">
              {visibleCustomers.length} clientes
            </span>
          </div>
          <label className="mb-3 flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={15} className="text-slate-400" />
            <span className="sr-only">Buscar cliente</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full text-sm outline-none"
              placeholder="Buscar nome ou telefone"
            />
          </label>
          <div className="divide-y divide-slate-100">
            {visibleCustomers.map((customer) => (
              <article key={customer.id} className="flex flex-wrap items-center gap-3 py-4">
                <span className="grid size-10 place-items-center rounded-full bg-[#edf0e5] font-bold text-[#586341]">
                  {customer.full_name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{customer.full_name}</strong>
                  <span className="text-xs text-slate-500">
                    {customer.phone_e164} · {customer.orders_count} pedidos ·{" "}
                    {formatMoney(Number(customer.lifetime_value))}
                    {business?.loyaltyEnabled && (
                      <>
                        {" · Saldo: "}
                        {business.loyaltyMode === "points"
                          ? `${Number(customer.loyalty_balance)} pontos`
                          : formatMoney(Number(customer.loyalty_balance))}
                      </>
                    )}
                  </span>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold">
                  {segmentLabels[customer.segment]}
                </span>
                <button
                  type="button"
                  aria-expanded={expandedCustomerId === customer.id}
                  onClick={() => void toggleCustomerHistory(customer)}
                  className="min-h-9 rounded-lg border px-2.5 text-xs font-semibold"
                >
                  {loadingOrdersFor === customer.id
                    ? "Carregando…"
                    : expandedCustomerId === customer.id
                      ? "Ocultar histórico"
                      : "Ver compras"}
                </button>
                {customer.phone_e164 && (
                  <a
                    href={`https://wa.me/${customer.phone_e164.replace(/\D/g, "").length === 10 || customer.phone_e164.replace(/\D/g, "").length === 11 ? `55${customer.phone_e164.replace(/\D/g, "")}` : customer.phone_e164.replace(/\D/g, "")}?text=${encodeURIComponent(getCustomerWhatsAppMessage(customer))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition active:scale-95"
                    title="Enviar mensagem amigável no WhatsApp"
                  >
                    <MessageCircle size={13} />
                    <span>{customer.segment === "inactive" ? "Reconquistar" : "WhatsApp"}</span>
                  </a>
                )}
                {customer.marketing_consent && customer.segment === "inactive" && (
                  <button
                    type="button"
                    onClick={() => void queueReengagement(customer)}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold"
                  >
                    <Send size={13} /> Preparar contato
                  </button>
                )}
                {business?.loyaltyEnabled && Number(customer.loyalty_balance) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRedeemingCustomerId(
                        redeemingCustomerId === customer.id ? null : customer.id,
                      );
                      setRedemptionUnits("");
                    }}
                    className="min-h-9 rounded-lg border px-2.5 text-xs font-semibold"
                  >
                    Registrar resgate
                  </button>
                )}
                {redeemingCustomerId === customer.id && (
                  <form
                    onSubmit={(event) => void redeemCustomerBalance(event, customer)}
                    className="grid basis-full gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_auto]"
                  >
                    <Field
                      label={
                        business?.loyaltyMode === "points"
                          ? "Pontos a resgatar"
                          : "Cashback a resgatar (R$)"
                      }
                      hint={
                        business?.loyaltyMode === "points"
                          ? "100 pontos equivalem a R$ 1,00."
                          : undefined
                      }
                    >
                      <input
                        required
                        type="number"
                        min={business?.loyaltyMode === "points" ? "1" : "0.01"}
                        max={Number(customer.loyalty_balance)}
                        step={business?.loyaltyMode === "points" ? "1" : "0.01"}
                        value={redemptionUnits}
                        onChange={(event) => setRedemptionUnits(event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <button disabled={redeeming} className={`${primaryButtonClass} self-end`}>
                      {redeeming ? "Registrando…" : "Confirmar resgate"}
                    </button>
                  </form>
                )}
                {expandedCustomerId === customer.id && (
                  <div className="basis-full rounded-xl bg-slate-50 p-3">
                    <h3 className="text-xs font-bold text-slate-700">Últimos pedidos</h3>
                    {(customerOrders[customer.id] ?? []).map((order) => (
                      <div key={order.id} className="mt-3 border-t border-slate-200 pt-3">
                        <div className="flex flex-wrap justify-between gap-2 text-xs">
                          <strong>Pedido #{order.order_number}</strong>
                          <span>{formatMoney(order.total)}</span>
                          <span className="text-slate-500">
                            {new Date(order.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {order.status.replaceAll("_", " ")}
                          {" · "}
                          {order.fulfillment.replaceAll("_", " ")}
                          {" · "}
                          {order.payment_method.replaceAll("_", " ")}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                          {order.items.map((item, index) => (
                            <li key={`${order.id}-${index}`} className="flex justify-between gap-3">
                              <span>
                                {item.quantity}× {item.item_name}
                              </span>
                              <span>{formatMoney(item.line_total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {customerOrders[customer.id]?.length === 0 && (
                      <p className="mt-2 text-xs text-slate-500">Nenhum pedido encontrado.</p>
                    )}
                  </div>
                )}
              </article>
            ))}
            {!visibleCustomers.length && (
              <p className="py-12 text-center text-sm text-slate-500">
                Os clientes aparecem aqui após a primeira compra.
              </p>
            )}
          </div>
        </section>
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Link2 size={17} className="text-[#778253]" />
              <h2 className="font-bold">Links de campanha</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Crie links rastreáveis para divulgar o cardápio e, opcionalmente, aplicar um cupom.
            </p>
            <form onSubmit={(event) => void createCampaignLink(event)} className="mt-4 space-y-3">
              <Field label="Nome da campanha">
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Almoço de sexta"
                />
              </Field>
              <Field label="Cupom (opcional)">
                <select
                  value={campaignCouponId}
                  onChange={(event) => setCampaignCouponId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Sem cupom</option>
                  {coupons
                    .filter((coupon) => coupon.is_active)
                    .map((coupon) => (
                      <option key={coupon.id} value={coupon.id}>
                        {coupon.code}
                      </option>
                    ))}
                </select>
              </Field>
              <button disabled={savingCampaign} className={primaryButtonClass}>
                <Plus size={15} />
                {savingCampaign ? "Criando…" : "Criar link rastreável"}
              </button>
            </form>
            <div className="mt-4 divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{campaign.name}</strong>
                    <span className="text-xs text-slate-500">
                      {campaign.clicks} acessos · {campaign.conversions} pedidos
                      {campaign.coupon_id ? " · cupom vinculado" : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyCampaignLink(campaign)}
                    aria-label={`Copiar link da campanha ${campaign.name}`}
                    className="grid size-9 shrink-0 place-items-center rounded-lg border"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              ))}
              {!campaigns.length && (
                <p className="py-3 text-xs text-slate-500">Seus links e cliques aparecerão aqui.</p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">Carrinhos para recuperar</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Só aparecem carrinhos com autorização explícita, parados há pelo menos 30 minutos.
                </p>
              </div>
              <span className="rounded-full bg-[#edf0e5] px-2.5 py-1 text-xs font-bold text-[#586341]">
                {abandonedCarts.length}
              </span>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {abandonedCarts.map((cart) => (
                <article key={cart.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm">{cart.phone_e164}</strong>
                    <span className="text-xs text-slate-500">
                      {new Date(cart.abandoned_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {cart.cart.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void queueAbandonedCartRecovery(cart)}
                    disabled={queueingCartId === cart.id}
                    className="mt-2 min-h-9 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50"
                  >
                    {queueingCartId === cart.id ? "Preparando…" : "Preparar lembrete"}
                  </button>
                </article>
              ))}
              {!abandonedCarts.length && (
                <p className="py-4 text-xs text-slate-500">
                  Nenhum carrinho elegível. A recuperação exige consentimento e não dispara
                  mensagens automaticamente.
                </p>
              )}
            </div>
          </section>
          <form
            onSubmit={(event) => void createCoupon(event)}
            className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Tag size={17} className="text-[#778253]" />
              <h2 className="font-bold">Criar cupom</h2>
            </div>
            <Field label="Código">
              <input
                required
                minLength={3}
                maxLength={40}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                }
                className={inputClass}
                placeholder="BEMVINDO"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desconto">
                <select
                  value={couponType}
                  onChange={(event) => setCouponType(event.target.value as "percent" | "fixed")}
                  className={inputClass}
                >
                  <option value="percent">Percentual</option>
                  <option value="fixed">Valor fixo</option>
                </select>
              </Field>
              <Field label={couponType === "percent" ? "Percentual (%)" : "Valor (R$)"}>
                <input
                  required
                  type="number"
                  min="0.01"
                  max={couponType === "percent" ? 100 : undefined}
                  step="0.01"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Pedido mínimo (R$)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
                className={inputClass}
              />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={firstOrderOnly}
                onChange={(event) => setFirstOrderOnly(event.target.checked)}
                className="size-4 accent-[#778253]"
              />
              Somente na primeira compra
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Usos por cliente">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={perCustomerLimit}
                  onChange={(event) => setPerCustomerLimit(event.target.value)}
                  placeholder="Sem limite"
                  className={inputClass}
                />
              </Field>
              <Field label="Usos totais">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={usageLimit}
                  onChange={(event) => setUsageLimit(event.target.value)}
                  placeholder="Sem limite"
                  className={inputClass}
                />
              </Field>
            </div>
            <button disabled={saving} className={primaryButtonClass}>
              <Plus size={15} />
              {saving ? "Salvando…" : "Criar promoção"}
            </button>
          </form>
          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="font-bold">Cupons ativos</h2>
            <div className="mt-3 divide-y divide-slate-100">
              {coupons
                .filter((coupon) => coupon.is_active)
                .map((coupon) => {
                  const couponDirectLink = `https://ello.app.br/loja/${business?.slug ?? ""}?cupom=${coupon.code}`;
                  return (
                    <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong>{coupon.code}</strong>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            {coupon.discount_type === "percent"
                              ? `${coupon.discount_value}% OFF`
                              : `${formatMoney(coupon.discount_value)} OFF`}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Mínimo {formatMoney(coupon.minimum_order)}
                          {coupon.first_order_only ? " · primeira compra" : ""}
                          {coupon.per_customer_limit
                            ? ` · ${coupon.per_customer_limit} por cliente`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(couponDirectLink);
                            setNotice(`Link do cupom ${coupon.code} copiado com sucesso!`);
                          }}
                          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Copiar link com o cupom aplicado"
                        >
                          <Copy size={12} /> Copiar Link
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Aproveite o cupom *${coupon.code}* com desconto exclusivo no ${business?.name ?? "nosso restaurante"}! Peça agora pelo cardápio: ${couponDirectLink}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              {!coupons.some((coupon) => coupon.is_active) && (
                <p className="py-4 text-xs text-slate-500">As promoções criadas aparecem aqui.</p>
              )}
            </div>
          </section>

          {/* Programa de Embaixadores */}
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-amber-200 text-amber-900 font-bold text-sm">
                  ★
                </span>
                <h2 className="font-bold text-amber-950">Programa de Embaixadores</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                Indicação Premiada
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-900">
              Transforme seus melhores clientes em divulgadores da sua marca. A cada amigo que pedir pelo link deles, o amigo ganha desconto e o embaixador ganha créditos!
            </p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-xs">
              <span className="text-slate-400 block text-[11px] font-semibold">Link de Indicação da Loja:</span>
              <p className="font-mono font-bold text-slate-800 truncate mt-0.5">
                https://ello.app.br/loja/{business?.slug ?? ""}?ref=embaixador
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(`https://ello.app.br/loja/${business?.slug ?? ""}?ref=embaixador`);
                    setNotice("Link de embaixador copiado!");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <Copy size={12} /> Copiar Link de Embaixador
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Seja um Embaixador do ${business?.name ?? "nosso restaurante"}! Indique seus amigos e ganhe créditos a cada pedido deles. Cadastre-se ou acesse pelo link: https://ello.app.br/loja/${business?.slug ?? ""}?ref=embaixador`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  Convidar VIPs no WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* Agendador de Postagens Instagram & Facebook */}
          <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-violet-200 text-violet-900 font-bold text-sm">
                  📱
                </span>
                <h2 className="font-bold text-violet-950">Agendador de Postagens</h2>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-900">
                Instagram & Facebook
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-violet-900">
              Textos persuasivos prontos com gatilhos gastronômicos para bombar as vendas no feed e stories.
            </p>

            <div className="mt-4 space-y-3">
              {[
                {
                  day: "Quarta-feira",
                  title: "🔥 Promoção do Meio de Semana",
                  copy: `Bateu aquela preguiça de cozinhar no meio da semana? 😋 Peça o seu combo favorito no ${business?.name ?? "nosso cardápio"} com entrega quentinha na sua porta! Peça pelo link da bio ou acesse: https://ello.app.br/loja/${business?.slug ?? ""} #delivery #delicia #gastronomia`,
                },
                {
                  day: "Sexta-feira",
                  title: "🎉 Sextou com o Melhor Sabor!",
                  copy: `O sextou perfeito já tem endereço certo! 🍕🍔 Reúna a galera e faça seu pedido direto pelo nosso cardápio online sem taxas extras: https://ello.app.br/loja/${business?.slug ?? ""} #sextou #comidaboa #fome`,
                },
                {
                  day: "Domingo",
                  title: "❤️ Almoço em Família",
                  copy: `Domingo é dia de descanso e prato especial na mesa! Peça no conforto de casa sem pegar filas: https://ello.app.br/loja/${business?.slug ?? ""} #domingo #almocoemfamilia`,
                },
              ].map((post, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{post.day} · {post.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(post.copy);
                        setNotice(`Legenda de ${post.day} copiada!`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Copy size={11} /> Copiar Legenda
                    </button>
                  </div>
                  <p className="mt-1.5 text-slate-600 leading-relaxed font-sans text-[11px] italic">
                    "{post.copy}"
                  </p>
                </div>
              ))}
            </div>
          </section>
          <p className="rounded-xl bg-[#f0f1e9] p-4 text-xs leading-5 text-slate-600">
            Os descontos são recalculados no servidor ao confirmar o pedido. Usos cancelados são
            liberados automaticamente. Contatos promocionais continuam dependendo de consentimento e
            de um provedor de mensagens configurado.
          </p>
        </div>
      </div>
    </>
  );
}
