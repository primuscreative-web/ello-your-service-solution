import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import {
  Bike,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Plus,
  QrCode,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { Field, inputClass, money, PageTitle, primaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub, type DeliveryDriver, type FoodOrder } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/entregas")({ component: DeliveryPage });

type ExtendedDriver = DeliveryDriver & {
  plate?: string;
  pixKey?: string;
  feePerDelivery?: number;
};

export function DeliveryPage() {
  const { business, drivers, saveDriver, removeDriver, orders, setOrderStatus, saveBusiness } =
    useLocalHub();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [feePerDelivery, setFeePerDelivery] = useState("7.00");
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Configuração de taxa por km
  const [kmRate, setKmRate] = useState(() => String((business as any)?.deliveryFeePerKm ?? "2.50"));
  const [savingKmRate, setSavingKmRate] = useState(false);
  const [kmSimDistance, setKmSimDistance] = useState("4.2");

  // Filtro de entregas
  const activeDeliveries = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.fulfillment === "delivery" &&
          ["ready", "out_for_delivery"].includes(order.status),
      ),
    [orders],
  );

  const completedTodayDeliveries = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return orders.filter(
      (order) =>
        order.fulfillment === "delivery" &&
        order.status === "completed" &&
        order.createdAt.slice(0, 10) === todayStr,
    );
  }, [orders]);

  async function submitDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveDriver({
        name: name.trim(),
        phone: phone.trim(),
        active: true,
      });
      setName("");
      setPhone("");
      setPlate("");
      setPixKey("");
      setFeePerDelivery("7.00");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível cadastrar o motoboy.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveKmRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) return;
    setSavingKmRate(true);
    try {
      await saveBusiness({
        ...business,
        deliveryFee: Number(kmRate),
      });
      alert("Taxa por KM atualizada com sucesso!");
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : "Erro ao salvar taxa por KM.");
    } finally {
      setSavingKmRate(false);
    }
  }

  function copyTrackingUrl(token: string) {
    const url = `https://ello.app.br/pedido/${token}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2500);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Logística & Entregas"
        title="Motoboys & Rastreamento em Tempo Real"
        description="Gerencie sua frota de entregadores próprios, acompanhe rotas no GPS, calcule taxa por KM e envie rastreamento ao vivo para os clientes."
      />

      {/* Indicadores rápidos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Motoboys na equipe</span>
            <Bike size={16} className="text-[#667448]" />
          </div>
          <div className="mt-2 text-2xl font-bold">{drivers.filter((d) => d.active).length}</div>
          <span className="text-xs text-emerald-700">Prontos para despachar</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Entregas em trânsito agora</span>
            <Navigation size={16} className="text-sky-600 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold">{activeDeliveries.length}</div>
          <span className="text-xs text-slate-500">Aguardando entrega</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Entregas concluídas hoje</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{completedTodayDeliveries.length}</div>
          <span className="text-xs text-slate-500">
            Total entregue: {money(completedTodayDeliveries.reduce((acc, o) => acc + o.total, 0))}
          </span>
        </div>
      </div>

      {/* Rastreamento em Tempo Real de Pedidos na Rua */}
      <section className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-sky-950">
              <Navigation size={18} className="text-sky-600" />
              Rastreamento de Entregas em Tempo Real
            </h2>
            <p className="text-xs text-slate-600">
              Acompanhe pedidos em rota, envie rotas GPS com 1 clique e compartilhe o link de rastreamento com o cliente.
            </p>
          </div>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
            {activeDeliveries.length} na rua
          </span>
        </div>

        {activeDeliveries.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeDeliveries.map((order) => {
              const assignedDriver = drivers.find((d) => d.id === order.driverId);
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-sky-700">Pedido #{order.number}</span>
                      <h3 className="text-sm font-bold text-slate-800">{order.customerName}</h3>
                      <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={12} className="text-rose-500 shrink-0" />
                        {order.address} {order.deliveryAreaName ? `(${order.deliveryAreaName})` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        order.status === "out_for_delivery"
                          ? "bg-amber-100 text-amber-900 animate-pulse"
                          : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      {order.status === "out_for_delivery" ? "Em rota 🛵" : "Pronto p/ sair"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="text-slate-600">
                      <b>Motoboy:</b>{" "}
                      {assignedDriver ? (
                        <span className="font-semibold text-slate-800">
                          {assignedDriver.name} ({assignedDriver.phone})
                        </span>
                      ) : (
                        <span className="text-amber-700">Não atribuído</span>
                      )}
                    </div>
                    <span className="font-bold text-slate-800">{money(order.total)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 pt-1">
                    {/* Botão Google Maps */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <MapPin size={12} className="text-rose-600" /> Rota Maps
                    </a>

                    {/* Botão Waze */}
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(order.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Navigation size={12} className="text-sky-600" /> Waze
                    </a>

                    {/* Copiar Link de Rastreio Público */}
                    {order.publicTrackingToken && (
                      <button
                        type="button"
                        onClick={() => copyTrackingUrl(order.publicTrackingToken!)}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                      >
                        <Copy size={12} />
                        {copiedLink === order.publicTrackingToken ? "Copiado!" : "Copiar Rastreio"}
                      </button>
                    )}

                    {/* Concluir entrega */}
                    <button
                      type="button"
                      onClick={() => void setOrderStatus(order.id, "completed")}
                      className="ml-auto inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={12} /> Entregue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-sky-200 bg-white/60 p-6 text-center text-xs text-slate-500">
            Nenhuma entrega em rota no momento. Ao despachar pedidos para entrega na aba Pedidos, eles aparecerão aqui com GPS e Waze.
          </div>
        )}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Lista de Motoboys Cadastrados */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
              <Bike size={20} />
            </span>
            <div>
              <h2 className="font-bold">Equipe de Motoboys</h2>
              <p className="text-xs text-slate-500">
                {drivers.filter((driver) => driver.active).length} motoboy(s) cadastrado(s)
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {drivers.length ? (
              drivers.map((driver) => (
                <div key={driver.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">
                      {driver.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{driver.name}</div>
                      <a
                        href={`https://wa.me/${driver.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                      >
                        <Phone size={11} />
                        {driver.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${driver.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${driver.name}! Como estão as entregas de hoje?`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      WhatsApp
                    </a>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        driver.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {driver.active ? "Ativo" : "Inativo"}
                    </span>
                    <button
                      aria-label={`Remover ${driver.name}`}
                      onClick={() => {
                        if (window.confirm(`Remover ${driver.name} da equipe?`)) {
                          void removeDriver(driver.id).catch((caught: unknown) =>
                            setError(caught instanceof Error ? caught.message : "Falha ao remover."),
                          );
                        }
                      }}
                      className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Cadastre seus motoboys para poder atribuir cada pedido e disparar endereço no WhatsApp.
              </p>
            )}
          </div>
        </section>

        {/* Formulário de Cadastro e Taxa por KM */}
        <div className="space-y-5">
          {/* Cadastro de novo motoboy */}
          <form
            onSubmit={(event) => void submitDriver(event)}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="font-bold">Cadastrar motoboy</h2>
            <p className="mt-1 text-xs text-slate-500">
              Nome e WhatsApp para envio de rota automática.
            </p>

            <div className="mt-4 space-y-3">
              <Field label="Nome do entregador">
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Ex: Carlos Oliveira"
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  placeholder="(11) 99999-9999"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Placa da moto (opcional)">
                  <input
                    value={plate}
                    onChange={(event) => setPlate(event.target.value.toUpperCase())}
                    className={inputClass}
                    placeholder="ABC-1D23"
                  />
                </Field>
                <Field label="Taxa por entrega (R$)">
                  <input
                    type="number"
                    step="0.50"
                    value={feePerDelivery}
                    onChange={(event) => setFeePerDelivery(event.target.value)}
                    className={inputClass}
                    placeholder="7.00"
                  />
                </Field>
              </div>
              <Field label="Chave PIX (para acerto do dia)">
                <input
                  value={pixKey}
                  onChange={(event) => setPixKey(event.target.value)}
                  className={inputClass}
                  placeholder="CPF, Telefone ou Chave aleatória"
                />
              </Field>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button disabled={saving} className={primaryButtonClass + " mt-4 w-full"}>
              <Plus size={15} />
              {saving ? "Salvando…" : "Cadastrar na Equipe"}
            </button>
          </form>

          {/* Taxa de Entrega por KM e Calculadora */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <h2 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <Zap size={15} className="text-amber-700" />
              Taxa de Entrega por KM Rodado
            </h2>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Defina o valor base por quilômetro para entregas em raios maiores.
            </p>

            <form onSubmit={(e) => void handleSaveKmRate(e)} className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Taxa (R$/km):</label>
                <input
                  type="number"
                  step="0.25"
                  value={kmRate}
                  onChange={(e) => setKmRate(e.target.value)}
                  className="w-24 rounded-lg border border-amber-300 bg-white px-2 py-1 text-sm font-bold text-slate-800 outline-none"
                />
                <button
                  type="submit"
                  disabled={savingKmRate}
                  className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-900"
                >
                  Salvar
                </button>
              </div>
            </form>

            {/* Simulador rápido de KM */}
            <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Simulador de raio
              </span>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span>Distância do cliente:</span>
                <input
                  type="number"
                  step="0.5"
                  value={kmSimDistance}
                  onChange={(e) => setKmSimDistance(e.target.value)}
                  className="w-16 rounded border px-1 py-0.5 text-right font-bold"
                />
                <span>km</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <span className="font-semibold text-slate-700">Taxa sugerida:</span>
                <b className="text-sm text-emerald-700">
                  {money(Number(kmSimDistance || 0) * Number(kmRate || 0))}
                </b>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DeliveryPage;
