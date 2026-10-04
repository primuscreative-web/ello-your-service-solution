import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Banknote, CircleDollarSign, Minus, Plus, ShoppingCart } from "lucide-react";
import { Field, inputClass, money, PageTitle, primaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/studio/caixa")({ component: CashRegisterPage });
type CashSession = {
  id: string;
  opening_amount: number;
  opened_at: string;
  closed_at: string | null;
};
type CashMovement = {
  movement_type: "withdrawal" | "addition";
  amount: number;
  description: string;
};

function CashRegisterPage() {
  const { business, services, refresh } = useLocalHub();
  const client = getSupabaseBrowserClient();
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [paymentTotals, setPaymentTotals] = useState<Record<string, number>>({});
  const [sessionOrderCount, setSessionOrderCount] = useState(0);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [closingAmount, setClosingAmount] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");
  const [movementType, setMovementType] = useState<"addition" | "withdrawal">("addition");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [payment, setPayment] = useState<"cash" | "pix" | "card">("cash");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const total = useMemo(
    () => services.reduce((sum, service) => sum + (quantities[service.id] ?? 0) * service.price, 0),
    [quantities, services],
  );
  const activeServices = services.filter((service) => service.active);
  const expectedCash =
    Number(session?.opening_amount ?? 0) +
    (paymentTotals.cash ?? 0) +
    movements.reduce(
      (sum, movement) =>
        sum + (movement.movement_type === "addition" ? 1 : -1) * Number(movement.amount),
      0,
    );

  const loadSession = useCallback(async () => {
    if (!client || !business?.id) return;
    const { data, error: queryError } = await client
      .from("localhub_cash_sessions")
      .select("id,opening_amount,opened_at,closed_at")
      .eq("business_id", business.id)
      .is("closed_at", null)
      .maybeSingle();
    if (queryError) {
      setError(queryError.message);
      return;
    }
    const activeSession = data as CashSession | null;
    setSession(activeSession);
    if (!activeSession) {
      setMovements([]);
      setPaymentTotals({});
      return;
    }
    const [movementResult, orderResult] = await Promise.all([
      client
        .from("localhub_cash_movements")
        .select("movement_type,amount,description")
        .eq("session_id", activeSession.id),
      client
        .from("localhub_orders")
        .select("payment_method,total")
        .eq("cash_session_id", activeSession.id)
        .eq("status", "completed"),
    ]);
    if (movementResult.error || orderResult.error) {
      setError(
        movementResult.error?.message ?? orderResult.error?.message ?? "Falha ao consultar caixa.",
      );
      return;
    }
    setMovements((movementResult.data ?? []) as CashMovement[]);
    setSessionOrderCount(orderResult.data?.length ?? 0);
    const totals: Record<string, number> = {};
    for (const row of orderResult.data ?? [])
      totals[row.payment_method] = (totals[row.payment_method] ?? 0) + Number(row.total);
    setPaymentTotals(totals);
    setError("");
  }, [business?.id, client]);
  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  async function openCash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !business?.id) return;
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setError("Entre novamente para abrir o caixa.");
      return;
    }
    const { data, error: writeError } = await client
      .from("localhub_cash_sessions")
      .insert({
        business_id: business.id,
        opened_by: auth.user.id,
        opening_amount: Number(openingAmount),
      })
      .select("id")
      .single();
    if (writeError) setError(writeError.message);
    else {
      setError("");
      await loadSession();
    }
  }

  async function saveMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !business?.id || !session) return;
    const { data: auth } = await client.auth.getUser();
    const { error: writeError } = await client.from("localhub_cash_movements").insert({
      business_id: business.id,
      session_id: session.id,
      movement_type: movementType,
      amount: Number(movementAmount),
      description: movementDescription.trim(),
      created_by: auth.user?.id,
    });
    if (writeError) setError(writeError.message);
    else {
      setMovementAmount("");
      setMovementDescription("");
      setError("");
      await loadSession();
    }
  }

  async function closeCash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !session) return;
    const { error: writeError } = await client
      .from("localhub_cash_sessions")
      .update({
        closed_at: new Date().toISOString(),
        closing_amount: Number(closingAmount),
        expected_amount: expectedCash,
      })
      .eq("id", session.id);
    if (writeError) setError(writeError.message);
    else {
      setError("");
      setClosingAmount("");
      await loadSession();
    }
  }

  async function createSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !business?.id || !session) return;
    const items = activeServices
      .filter((service) => (quantities[service.id] ?? 0) > 0)
      .map((service) => ({ id: service.id, quantity: quantities[service.id] }));
    setSaving(true);
    const { error: writeError } = await client.rpc("localhub_create_pdv_food_order", {
      p_business_id: business.id,
      p_customer_name: customerName.trim(),
      p_customer_phone: customerPhone,
      p_fulfillment: "pickup",
      p_delivery_address: "",
      p_notes: "Venda registrada no PDV",
      p_payment_method: payment,
      p_items: items,
    });
    setSaving(false);
    if (writeError) {
      setError(writeError.message);
      return;
    }
    setError("");
    setCustomerName("");
    setCustomerPhone("");
    setQuantities({});
    await Promise.all([refresh(), loadSession()]);
  }

  return (
    <>
      <PageTitle
        eyebrow="Frente de caixa"
        title="PDV e caixa"
        description="Registre vendas de balcão, acompanhe entradas e confira o fechamento por forma de pagamento."
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!session ? (
        <form
          onSubmit={(event) => void openCash(event)}
          className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-100 bg-white p-5"
        >
          <Field label="Fundo de caixa (R$)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(event) => setOpeningAmount(event.target.value)}
              className={inputClass}
            />
          </Field>
          <button className={primaryButtonClass}>
            <Banknote size={16} />
            Abrir caixa
          </button>
        </form>
      ) : (
        <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Caixa aberto desde</p>
                <h2 className="font-bold">{new Date(session.opened_at).toLocaleString("pt-BR")}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                Aberto
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Fundo inicial", Number(session.opening_amount)],
                ["Dinheiro", paymentTotals.cash ?? 0],
                ["Pix", paymentTotals.pix ?? 0],
                ["Cartão", paymentTotals.card ?? 0],
              ].map(([label, amount]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <span className="block text-[11px] text-slate-500">{label}</span>
                  <b className="mt-1 block text-sm">{money(Number(amount))}</b>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Saldo esperado em dinheiro: <b>{money(expectedCash)}</b>
            </p>
          </section>
          <div className="space-y-3">
            <form
              onSubmit={(event) => void saveMovement(event)}
              className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-4"
            >
              <select
                aria-label="Tipo de movimentação"
                value={movementType}
                onChange={(event) =>
                  setMovementType(event.target.value as "addition" | "withdrawal")
                }
                className={inputClass}
              >
                <option value="addition">Reforço</option>
                <option value="withdrawal">Sangria</option>
              </select>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Valor"
                value={movementAmount}
                onChange={(event) => setMovementAmount(event.target.value)}
                className={inputClass}
              />
              <input
                required
                minLength={2}
                maxLength={160}
                placeholder="Motivo"
                value={movementDescription}
                onChange={(event) => setMovementDescription(event.target.value)}
                className={inputClass}
              />
              <button className="min-h-11 rounded-xl border text-sm font-semibold">
                Registrar
              </button>
            </form>
            <form
              onSubmit={(event) => void closeCash(event)}
              className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-100 bg-white p-4"
            >
              <Field label="Dinheiro contado no fechamento">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={(event) => setClosingAmount(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold">
                Fechar caixa
              </button>
            </form>
          </div>
        </div>
      )}
      <form
        onSubmit={(event) => void createSale(event)}
        className="grid items-start gap-5 xl:grid-cols-[1.3fr_.7fr]"
      >
        <section className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingCart size={17} className="text-[#778253]" />
            <h2 className="font-bold">Venda de balcão</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {activeServices.map((service) => (
              <div key={service.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{service.name}</b>
                  <span className="text-xs text-slate-500">{money(service.price)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remover ${service.name}`}
                  onClick={() =>
                    setQuantities((current) => ({
                      ...current,
                      [service.id]: Math.max(0, (current[service.id] ?? 0) - 1),
                    }))
                  }
                  className="grid size-9 place-items-center rounded-full border"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-sm font-bold">
                  {quantities[service.id] ?? 0}
                </span>
                <button
                  type="button"
                  aria-label={`Adicionar ${service.name}`}
                  onClick={() =>
                    setQuantities((current) => ({
                      ...current,
                      [service.id]: (current[service.id] ?? 0) + 1,
                    }))
                  }
                  className="grid size-9 place-items-center rounded-full border"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
            {!activeServices.length && (
              <p className="py-8 text-sm text-slate-500">
                Cadastre produtos no cardápio para iniciar.
              </p>
            )}
          </div>
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="font-bold">Pagamento e cliente</h2>
          <Field label="Nome do cliente">
            <input
              required
              minLength={2}
              maxLength={100}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className={inputClass}
              placeholder="Nome"
            />
          </Field>
          <Field label="Telefone / WhatsApp">
            <input
              required
              type="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className={inputClass}
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="Forma de pagamento">
            <select
              value={payment}
              onChange={(event) => setPayment(event.target.value as "cash" | "pix" | "card")}
              className={inputClass}
            >
              <option value="cash">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="card">Cartão / maquininha</option>
            </select>
          </Field>
          <div className="flex justify-between border-t pt-3 text-lg font-extrabold">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          <button
            disabled={!session || total <= 0 || saving}
            className={primaryButtonClass + " w-full"}
          >
            <CircleDollarSign size={16} />
            {saving ? "Registrando…" : "Registrar venda"}
          </button>
          {!session && (
            <p className="text-xs text-amber-700">Abra o caixa antes de registrar a venda.</p>
          )}
        </section>
      </form>
      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5">
        <h2 className="font-bold">Movimentações do caixa</h2>
        <div className="mt-2 divide-y divide-slate-100">
          {movements.map((movement, index) => (
            <div
              key={`${movement.description}-${index}`}
              className="flex justify-between py-2 text-sm"
            >
              <span>
                {movement.movement_type === "addition" ? "Reforço" : "Sangria"} ·{" "}
                {movement.description}
              </span>
              <b>{money(Number(movement.amount))}</b>
            </div>
          ))}
          {!movements.length && (
            <p className="py-3 text-xs text-slate-500">Nenhuma sangria ou reforço neste caixa.</p>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {sessionOrderCount} vendas concluídas registradas neste caixa.
        </p>
      </section>
    </>
  );
}
