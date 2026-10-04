import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Bike, Phone, Plus, Trash2 } from "lucide-react";
import { Field, inputClass, PageTitle, primaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/entregas")({ component: DeliveryPage });

function DeliveryPage() {
  const { business, drivers, saveDriver, removeDriver, orders } = useLocalHub();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const activeDeliveries = orders.filter(
    (order) =>
      order.fulfillment === "delivery" && !["completed", "cancelled"].includes(order.status),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveDriver({ name, phone, active: true });
      setName("");
      setPhone("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível cadastrar o motoboy.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="Entrega própria"
        title="Motoboys"
        description="Cadastre sua equipe e atribua cada entrega na tela de pedidos. A integração com entregadores terceirizados fica para uma próxima etapa."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
              <Bike size={20} />
            </span>
            <div>
              <h2 className="font-bold">Equipe de entrega</h2>
              <p className="text-xs text-slate-500">
                {drivers.filter((driver) => driver.active).length} motoboys ativos
              </p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {drivers.length ? (
              drivers.map((driver) => (
                <div key={driver.id} className="flex items-center gap-3 py-4">
                  <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600">
                    {driver.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{driver.name}</div>
                    <a
                      href={`tel:${driver.phone}`}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"
                    >
                      <Phone size={12} />
                      {driver.phone}
                    </a>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${driver.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {driver.active ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    aria-label={`Remover ${driver.name}`}
                    onClick={() => {
                      if (window.confirm(`Remover ${driver.name} da equipe?`))
                        void removeDriver(driver.id).catch((caught: unknown) =>
                          setError(caught instanceof Error ? caught.message : "Falha ao remover."),
                        );
                    }}
                    className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Cadastre seu primeiro motoboy para organizar as entregas.
              </p>
            )}
          </div>
        </section>
        <div className="space-y-5">
          <form
            onSubmit={(event) => void submit(event)}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="font-bold">Adicionar motoboy</h2>
            <p className="mt-1 text-xs text-slate-500">
              Os dados ficam restritos ao painel deste estabelecimento.
            </p>
            <div className="mt-4 space-y-4">
              <Field label="Nome">
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Nome do entregador"
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
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button disabled={saving} className={primaryButtonClass + " mt-5 w-full"}>
              <Plus size={15} />
              {saving ? "Salvando…" : "Adicionar à equipe"}
            </button>
          </form>
          <section className="rounded-2xl border border-[#e1e3d8] bg-[#edf0e5] p-5">
            <h2 className="text-sm font-bold">Como funciona</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Ao receber um pedido para entrega, escolha o motoboy responsável em{" "}
              <a href="/studio/pedidos" className="font-semibold underline">
                Pedidos
              </a>
              . A ELLO registra a atribuição e mantém o contato para a equipe organizar a saída.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Entregadores terceirizados e rastreamento em tempo real não estão incluídos nesta
              versão.
            </p>
            <p className="mt-3 text-[11px] text-slate-500">{business?.name}</p>
          </section>
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="font-bold">Entregas em andamento</h2>
            <p className="mt-1 text-xs text-slate-500">
              {activeDeliveries.length} pedido(s) pendente(s) de entrega
            </p>
            <a
              href="/studio/pedidos"
              className="mt-3 inline-block text-xs font-semibold text-[#667448]"
            >
              Abrir pedidos →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
