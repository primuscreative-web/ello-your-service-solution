import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { money } from "@/components/localhub/ui";
import { useLocalHub, type Business, type Service } from "@/lib/localhub-context";

export const Route = createFileRoute("/totem/$slug")({
  component: TotemPage,
});

type CartItem = {
  service: Service;
  quantity: number;
  notes?: string;
};

export function TotemPage() {
  const { slug } = Route.useParams();
  const { getPublicStore, createFoodOrder } = useLocalHub();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [diningOption, setDiningOption] = useState<"dine_in" | "pickup">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    number: number;
    total: number;
    trackingToken: string;
  } | null>(null);

  // Carrega catálogo
  useEffect(() => {
    let active = true;
    void getPublicStore(slug).then((data) => {
      if (!active) return;
      if (data) {
        setBusiness(data.business);
        setServices(data.services.filter((s) => s.active));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [getPublicStore, slug]);

  // Categorias únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const service of services) {
      if (service.menuCategory) set.add(service.menuCategory);
    }
    return Array.from(set);
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter((s) => s.menuCategory === selectedCategory);
  }, [selectedCategory, services]);

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.service.price * item.quantity, 0),
    [cart],
  );

  const cartItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  function addToCart(service: Service) {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.service.id === service.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { service, quantity: 1 }];
    });
  }

  function updateQuantity(serviceId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.service.id === serviceId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  }

  async function handleFinalizeOrder() {
    if (!business || cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderNotes = [
        diningOption === "dine_in"
          ? tableNumber
            ? `Consumo no local - Mesa ${tableNumber}`
            : "Consumo no local"
          : "Para viagem",
        "Pedido realizado no Totem de Autoatendimento",
      ]
        .filter(Boolean)
        .join(" | ");

      const result = await createFoodOrder({
        slug: business.slug,
        customerName: customerName.trim() || "Cliente Totem",
        phone: customerPhone.trim() || "11999999999",
        fulfillment: diningOption,
        address: diningOption === "dine_in" ? `Mesa ${tableNumber || "Balcão"}` : "Retirada Balcão",
        deliveryAreaId: null,
        notes: orderNotes,
        paymentMethod: paymentMethod === "pix" ? "pix" : "card",
        items: cart.map((item) => ({
          id: item.service.id,
          quantity: item.quantity,
        })),
      });

      setCompletedOrder({
        number: result.number,
        total: result.total,
        trackingToken: result.trackingToken,
      });
      setCart([]);
      setShowCheckout(false);

      // Reseta automaticamente a tela após 12 segundos
      setTimeout(() => {
        setCompletedOrder(null);
        setCustomerName("");
        setTableNumber("");
      }, 12000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao lançar pedido no totem.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1c16] text-[#f2f4ec]">
        <div className="flex flex-col items-center gap-3">
          <UtensilsCrossed size={36} className="animate-spin text-[#d0f25a]" />
          <p className="text-sm font-semibold tracking-wider">Iniciando Autoatendimento…</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1c16] p-6 text-center text-white">
        <div>
          <Store size={48} className="mx-auto text-slate-500" />
          <h1 className="mt-4 text-xl font-bold">Estabelecimento não encontrado</h1>
          <p className="mt-1 text-sm text-slate-400">Verifique o endereço ou QR Code do totem.</p>
        </div>
      </div>
    );
  }

  // Tela de Sucesso após o Pedido
  if (completedOrder) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#121410] p-6 text-center text-white select-none">
        <div className="w-full max-w-md rounded-3xl border border-[#d0f25a]/30 bg-[#1c1f17] p-8 shadow-2xl">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-[#d0f25a]/20 text-[#d0f25a]">
            <CheckCircle2 size={44} />
          </div>

          <span className="mt-6 block text-xs font-bold uppercase tracking-widest text-[#d0f25a]">
            Pedido Confirmado!
          </span>
          <h1 className="mt-2 text-2xl font-black">Já estamos preparando!</h1>

          <div className="my-6 rounded-2xl border border-[#2d3323] bg-[#24281c] p-6">
            <span className="text-xs uppercase tracking-wider text-slate-400">Sua Senha / Comanda</span>
            <div className="mt-1 text-5xl font-black text-white">#{completedOrder.number}</div>
            <div className="mt-3 flex justify-between border-t border-[#2d3323] pt-3 text-xs text-slate-300">
              <span>Total:</span>
              <b className="text-sm font-bold text-[#d0f25a]">{money(completedOrder.total)}</b>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Acompanhe o número no painel ou retire no balcão quando for chamado.
          </p>

          <button
            type="button"
            onClick={() => {
              setCompletedOrder(null);
              setCustomerName("");
              setTableNumber("");
            }}
            className="mt-6 w-full rounded-2xl bg-[#d0f25a] py-4 text-sm font-black text-[#121410] shadow-lg transition active:scale-95"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121410] text-[#f2f4ec] select-none">
      {/* Coluna Principal: Catálogo e Categorias */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Cabeçalho do Totem */}
        <header className="flex items-center justify-between border-b border-[#24281c] bg-[#171a13] px-6 py-4">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="size-12 rounded-xl object-cover border border-[#2d3323]"
              />
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-[#292e20] text-lg font-black text-[#d0f25a]">
                {business.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-black leading-tight text-white">{business.name}</h1>
              <p className="text-xs text-[#d0f25a] font-medium flex items-center gap-1">
                <Sparkles size={12} /> Autoatendimento Interativo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#2d3323] bg-[#24281c] px-3 py-1 text-xs font-semibold text-slate-300">
              Toque nos itens para adicionar
            </span>
          </div>
        </header>

        {/* Barra de Categorias */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#24281c] bg-[#1a1d15] px-6 py-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold transition-all ${
              selectedCategory === "all"
                ? "bg-[#d0f25a] text-[#121410] shadow-md scale-105"
                : "bg-[#24281c] text-slate-300 hover:bg-[#2e3324]"
            }`}
          >
            Todos os Itens
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-[#d0f25a] text-[#121410] shadow-md scale-105"
                  : "bg-[#24281c] text-slate-300 hover:bg-[#2e3324]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grade de Produtos */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => addToCart(service)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#24281c] bg-[#1c1f17] p-3 transition-all hover:border-[#d0f25a]/50 hover:bg-[#24281c] active:scale-98 cursor-pointer shadow-sm"
              >
                <div>
                  {service.imageUrl ? (
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-[#292e20]">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-4/3 w-full rounded-xl bg-[#292e20] grid place-items-center text-slate-600">
                      <UtensilsCrossed size={32} />
                    </div>
                  )}

                  <h3 className="mt-3 text-sm font-black text-white line-clamp-1">{service.name}</h3>
                  {service.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#2d3323] pt-3">
                  <span className="text-sm font-black text-[#d0f25a]">{money(service.price)}</span>
                  <button
                    type="button"
                    className="grid size-9 place-items-center rounded-xl bg-[#d0f25a] text-[#121410] font-black shadow-xs transition hover:scale-105"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coluna Lateral: Carrinho e Finalização */}
      <aside className="flex w-96 flex-col border-l border-[#24281c] bg-[#171a13]">
        <div className="flex items-center justify-between border-b border-[#24281c] p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#d0f25a]" />
            <h2 className="text-base font-bold text-white">Seu Pedido</h2>
          </div>
          <span className="rounded-full bg-[#24281c] px-3 py-0.5 text-xs font-bold text-[#d0f25a]">
            {cartItemsCount} item(s)
          </span>
        </div>

        {/* Itens do Carrinho */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.service.id}
                className="flex items-center justify-between rounded-xl border border-[#24281c] bg-[#1c1f17] p-3 text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="block font-bold text-white truncate">{item.service.name}</span>
                  <span className="text-[#d0f25a] font-semibold">
                    {money(item.service.price * item.quantity)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.service.id, -1)}
                    className="grid size-7 place-items-center rounded-lg bg-[#24281c] text-white hover:bg-[#2d3323]"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="font-bold text-white w-4 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.service.id, 1)}
                    className="grid size-7 place-items-center rounded-lg bg-[#24281c] text-white hover:bg-[#2d3323]"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-500">
              <ShoppingBag size={36} className="mb-2 text-[#24281c]" />
              <p className="text-xs">Seu pedido está vazio.</p>
              <p className="text-[11px] text-slate-600 mt-1">Toque nos itens do cardápio para adicionar.</p>
            </div>
          )}
        </div>

        {/* Rodapé do Carrinho */}
        <div className="border-t border-[#24281c] bg-[#121410] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total a Pagar</span>
            <span className="text-2xl font-black text-[#d0f25a]">{money(cartTotal)}</span>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#d0f25a] text-base font-black text-[#121410] shadow-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Avançar e Finalizar →
          </button>
        </div>
      </aside>

      {/* Modal de Finalização do Totem */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-[#2d3323] bg-[#171a13] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#24281c] pb-4">
              <h2 className="text-lg font-bold">Finalizar no Totem</h2>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Onde consumir */}
              <div>
                <label className="font-bold text-slate-300 block mb-2">Como deseja consumir?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiningOption("dine_in")}
                    className={`rounded-2xl border p-4 text-center font-bold transition ${
                      diningOption === "dine_in"
                        ? "border-[#d0f25a] bg-[#d0f25a]/10 text-[#d0f25a]"
                        : "border-[#24281c] bg-[#1c1f17] text-slate-400"
                    }`}
                  >
                    🍽️ Comer no Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiningOption("pickup")}
                    className={`rounded-2xl border p-4 text-center font-bold transition ${
                      diningOption === "pickup"
                        ? "border-[#d0f25a] bg-[#d0f25a]/10 text-[#d0f25a]"
                        : "border-[#24281c] bg-[#1c1f17] text-slate-400"
                    }`}
                  >
                    🛍️ Levar p/ Viagem
                  </button>
                </div>
              </div>

              {diningOption === "dine_in" && (
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Número da Mesa (opcional)
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full rounded-xl border border-[#2d3323] bg-[#24281c] px-3 py-3 text-base font-bold text-white outline-none focus:border-[#d0f25a]"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-300 block mb-1">Seu Nome para a Senha</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Gabriel"
                  className="w-full rounded-xl border border-[#2d3323] bg-[#24281c] px-3 py-3 text-sm text-white outline-none focus:border-[#d0f25a]"
                />
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="font-bold text-slate-300 block mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`rounded-xl border p-3 text-center font-bold transition flex items-center justify-center gap-2 ${
                      paymentMethod === "pix"
                        ? "border-[#d0f25a] bg-[#d0f25a]/10 text-[#d0f25a]"
                        : "border-[#24281c] bg-[#1c1f17] text-slate-400"
                    }`}
                  >
                    <Zap size={15} /> Pix na Tela
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`rounded-xl border p-3 text-center font-bold transition flex items-center justify-center gap-2 ${
                      paymentMethod === "card"
                        ? "border-[#d0f25a] bg-[#d0f25a]/10 text-[#d0f25a]"
                        : "border-[#24281c] bg-[#1c1f17] text-slate-400"
                    }`}
                  >
                    💳 Cartão no Balcão
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-between border-t border-[#24281c] pt-4">
                <span className="text-sm font-semibold text-slate-400">Total do Pedido:</span>
                <b className="text-xl font-black text-[#d0f25a]">{money(cartTotal)}</b>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="w-1/3 rounded-xl border border-[#24281c] py-3 font-bold text-slate-400 hover:bg-[#24281c]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalizeOrder}
                  className="w-2/3 rounded-xl bg-[#d0f25a] py-3.5 text-sm font-black text-[#121410] shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Confirmando…" : "Confirmar Pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TotemPage;
