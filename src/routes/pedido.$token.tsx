import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  Copy,
  CreditCard,
  Lock,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { money } from "@/components/localhub/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/pedido/$token")({ component: PublicOrderTrackingPage });

type Tracking = {
  order_number: number;
  business_name: string;
  status: string;
  fulfillment: string;
  created_at: string;
};

type PaymentInfo = {
  order_id: string;
  order_number: number;
  customer_name?: string;
  customer_phone?: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  billing_type: string | null;
  pix_payload: string | null;
  pix_image: string | null;
  pix_expiration: string | null;
  invoice_url: string | null;
  credit_card_brand: string | null;
  credit_card_last4: string | null;
};

const steps = ["received", "accepted", "preparing", "ready", "out_for_delivery", "completed"];
const labels: Record<string, string> = {
  received: "Pedido recebido",
  accepted: "Pedido confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function playPaymentSuccessChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.42);
    osc.onended = () => void ctx.close();
  } catch {
    // blocked or unsupported
  }
}

function PublicOrderTrackingPage() {
  const { token } = Route.useParams();
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentTab, setPaymentTab] = useState<"pix" | "card">("pix");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const prevPaymentStatus = useRef<string | null>(null);

  // Formulário do Cartão de Crédito 100% nativo na ELLO
  const [cardForm, setCardForm] = useState({
    number: "",
    holderName: "",
    expiry: "",
    ccv: "",
    cpf: "",
    postalCode: "",
    addressNumber: "",
    installments: "1",
  });
  const [payingCard, setPayingCard] = useState(false);
  const [cardError, setCardError] = useState("");

  const loadData = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Acompanhar pedidos está temporariamente indisponível.");
      setLoading(false);
      return;
    }

    const [trackingRes, paymentRes] = await Promise.all([
      client.rpc("localhub_public_order_tracking", { p_tracking_token: token }),
      client.rpc("localhub_get_order_payment_info", { p_tracking_token: token }),
    ]);

    const trackingRow = Array.isArray(trackingRes.data) ? trackingRes.data[0] : null;
    if (trackingRes.error || !trackingRow) {
      setError("Não encontramos esse pedido. Confira o link recebido.");
    } else {
      setTracking(trackingRow as Tracking);
      setError("");
    }

    let pInfo = Array.isArray(paymentRes.data) ? (paymentRes.data[0] as PaymentInfo) : null;

    // Fallback para a RPC anterior caso a nova ainda não tenha sido aplicada
    if (!pInfo) {
      const fallbackRes = await client.rpc("localhub_get_order_pix_payment", { p_tracking_token: token });
      const fallbackRow = Array.isArray(fallbackRes.data) ? fallbackRes.data[0] : null;
      if (fallbackRow) {
        pInfo = {
          order_id: fallbackRow.order_id,
          order_number: fallbackRow.order_number,
          total: fallbackRow.total,
          status: trackingRow?.status || "received",
          payment_method: "online_pix",
          payment_status: fallbackRow.payment_status,
          billing_type: "PIX",
          pix_payload: fallbackRow.pix_payload,
          pix_image: fallbackRow.pix_image,
          pix_expiration: fallbackRow.pix_expiration,
          invoice_url: fallbackRow.invoice_url,
          credit_card_brand: null,
          credit_card_last4: null,
        };
      }
    }

    if (pInfo) {
      if (
        prevPaymentStatus.current &&
        prevPaymentStatus.current !== "paid" &&
        pInfo.payment_status === "paid"
      ) {
        playPaymentSuccessChime();
      }
      prevPaymentStatus.current = pInfo.payment_status;
      setPaymentInfo(pInfo);
      if (pInfo.payment_method === "online_card" && !pInfo.pix_payload) {
        setPaymentTab("card");
      }
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    let active = true;
    void loadData();

    // Polling adaptativo: 4 segundos enquanto aguarda pagamento, 12 segundos após confirmação
    const isUnpaid = paymentInfo && paymentInfo.payment_status !== "paid";
    const intervalMs = isUnpaid ? 4_000 : 12_000;

    const interval = window.setInterval(() => {
      if (active) void loadData();
    }, intervalMs);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [loadData, paymentInfo?.payment_status]);

  async function handleManualCheck() {
    setChecking(true);
    await loadData();
    setTimeout(() => setChecking(false), 600);
  }

  // Gera o Pix caso o cliente queira alternar para Pix
  async function handleRequestPix() {
    if (!paymentInfo) return;
    setChecking(true);
    try {
      const res = await fetch("/api/asaas/charge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: paymentInfo.order_id,
          trackingToken: token,
          billingType: "PIX",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível gerar a chave Pix.");
      }
      await loadData();
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "Erro ao gerar Pix.");
    } finally {
      setChecking(false);
    }
  }

  // Submete o pagamento de Cartão de Crédito 100% nativo na ELLO
  async function handlePayWithCreditCard(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentInfo) return;

    setPayingCard(true);
    setCardError("");

    const [expMonth, expYear] = cardForm.expiry.replace(/\s/g, "").split("/");
    const fullYear = expYear ? (expYear.length === 2 ? `20${expYear}` : expYear) : "";

    if (!expMonth || !fullYear || expMonth.length !== 2 || fullYear.length !== 4) {
      setCardError("Validade do cartão inválida. Use o formato MM/AA.");
      setPayingCard(false);
      return;
    }

    try {
      const cleanCard = cardForm.number.replace(/\D/g, "");
      const cleanCpf = cardForm.cpf.replace(/\D/g, "");
      const cleanPostalCode = cardForm.postalCode.replace(/\D/g, "");

      const res = await fetch("/api/asaas/charge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: paymentInfo.order_id,
          trackingToken: token,
          billingType: "CREDIT_CARD",
          installmentCount: parseInt(cardForm.installments, 10) || 1,
          creditCard: {
            holderName: cardForm.holderName.trim().toUpperCase(),
            number: cleanCard,
            expiryMonth: expMonth,
            expiryYear: fullYear,
            ccv: cardForm.ccv.trim(),
          },
          creditCardHolderInfo: {
            name: cardForm.holderName.trim(),
            email: "cliente@ello.app.br",
            cpfCnpj: cleanCpf,
            postalCode: cleanPostalCode || "01001000",
            addressNumber: cardForm.addressNumber || "1",
            phone: paymentInfo.customer_phone || "11999999999",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cartão não autorizado. Verifique os dados informados.");
      }

      playPaymentSuccessChime();
      await loadData();
    } catch (err) {
      setCardError(
        err instanceof Error ? err.message : "Não foi possível processar o pagamento no cartão.",
      );
    } finally {
      setPayingCard(false);
    }
  }

  const currentStep = tracking ? steps.indexOf(tracking.status) : -1;
  const isPaid = paymentInfo?.payment_status === "paid";

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-[#292b25] sm:py-16">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-extrabold">
          <span className="ello-brand-mark ello-brand-mark-small">e</span>ello
        </Link>
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">Carregando seu pedido…</p>
        ) : error ? (
          <div role="alert" className="py-14 text-center">
            <XCircle className="mx-auto text-red-500" />
            <p className="mt-3 text-sm text-slate-600">{error}</p>
          </div>
        ) : (
          tracking && (
            <>
              <p className="mt-8 text-xs font-bold uppercase tracking-widest text-[#778253]">
                Pedido #{tracking.order_number}
              </p>
              <h1 className="mt-2 text-2xl font-bold">
                {labels[tracking.status] ?? "Atualização do pedido"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Store size={15} />
                  {tracking.business_name}
                </span>
                <span className="inline-flex items-center gap-1">
                  {tracking.fulfillment === "delivery" ? (
                    <MapPin size={15} />
                  ) : (
                    <Package size={15} />
                  )}
                  {tracking.fulfillment === "delivery"
                    ? "Entrega"
                    : tracking.fulfillment === "pickup"
                      ? "Retirada"
                      : "Consumo no local"}
                </span>
              </div>

              {/* Seção de Pagamento 100% Nativa na ELLO */}
              {paymentInfo && (
                isPaid ? (
                  <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Pagamento confirmado!</p>
                      <p className="text-xs text-emerald-700">
                        {paymentInfo.billing_type === "CREDIT_CARD"
                          ? "Cartão de Crédito aprovado pelo Asaas."
                          : "Recebido com sucesso via Pix."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="relative flex size-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Aguardando pagamento
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">
                        {money(Number(paymentInfo.total))}
                      </span>
                    </div>

                    {/* Abas Pix e Cartão */}
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-200/60 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentTab("pix");
                          if (!paymentInfo.pix_payload) void handleRequestPix();
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                          paymentTab === "pix"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <QrCode size={14} />
                        Pagar com Pix
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentTab("card")}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
                          paymentTab === "card"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <CreditCard size={14} />
                        Cartão de Crédito
                      </button>
                    </div>

                    {/* Conteúdo Aba PIX */}
                    {paymentTab === "pix" && (
                      <div className="mt-4">
                        {paymentInfo.pix_image ? (
                          <div className="flex flex-col items-center">
                            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                              <img
                                src={
                                  paymentInfo.pix_image.startsWith("data:")
                                    ? paymentInfo.pix_image
                                    : `data:image/png;base64,${paymentInfo.pix_image}`
                                }
                                alt="QR Code Pix"
                                className="size-44 object-contain"
                              />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400">Escaneie o QR Code no app do seu banco</p>
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <button
                              type="button"
                              onClick={() => void handleRequestPix()}
                              className="rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white"
                            >
                              Gerar QR Code Pix
                            </button>
                          </div>
                        )}

                        {paymentInfo.pix_payload && (
                          <div className="mt-4">
                            <label className="mb-1 block text-xs font-semibold text-slate-600">
                              Pix Copia e Cola
                            </label>
                            <div className="flex gap-2">
                              <input
                                readOnly
                                value={paymentInfo.pix_payload}
                                className="w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(paymentInfo.pix_payload!);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2500);
                                }}
                                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#34352f]"
                              >
                                {copied ? (
                                  <>
                                    <Check size={13} /> Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} /> Copiar Pix
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="mt-3 text-center text-xs text-slate-500 leading-relaxed">
                          Abra o app do seu banco, escolha <b>Pagar com Pix</b> e use o QR Code ou cole o código acima. A confirmação é imediata!
                        </p>
                      </div>
                    )}

                    {/* Conteúdo Aba Cartão de Crédito 100% Nativo na ELLO */}
                    {paymentTab === "card" && (
                      <form onSubmit={handlePayWithCreditCard} className="mt-4 space-y-3 text-xs">
                        {cardError && (
                          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
                            <AlertCircle size={16} className="shrink-0 text-red-600" />
                            <span>{cardError}</span>
                          </div>
                        )}

                        <div>
                          <label className="font-semibold text-slate-700">Número do cartão</label>
                          <div className="relative mt-1">
                            <input
                              required
                              type="text"
                              maxLength={19}
                              value={cardForm.number}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                                const formatted = v.replace(/(\d{4})(?=\d)/g, "$1 ");
                                setCardForm({ ...cardForm, number: formatted });
                              }}
                              placeholder="0000 0000 0000 0000"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-slate-800"
                            />
                            <CreditCard className="absolute right-3 top-3 text-slate-400" size={17} />
                          </div>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700">Nome impresso no cartão</label>
                          <input
                            required
                            type="text"
                            value={cardForm.holderName}
                            onChange={(e) =>
                              setCardForm({ ...cardForm, holderName: e.target.value.toUpperCase() })
                            }
                            placeholder="NOME COMO NO CARTAO"
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-slate-700">Validade</label>
                            <input
                              required
                              type="text"
                              maxLength={5}
                              value={cardForm.expiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                                setCardForm({ ...cardForm, expiry: v });
                              }}
                              placeholder="MM/AA"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">CVV</label>
                            <input
                              required
                              type="password"
                              maxLength={4}
                              value={cardForm.ccv}
                              onChange={(e) =>
                                setCardForm({
                                  ...cardForm,
                                  ccv: e.target.value.replace(/\D/g, "").slice(0, 4),
                                })
                              }
                              placeholder="123"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-semibold text-slate-700">CPF do titular</label>
                            <input
                              required
                              type="text"
                              maxLength={14}
                              value={cardForm.cpf}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                                setCardForm({ ...cardForm, cpf: v });
                              }}
                              placeholder="000.000.000-00"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">Parcelas</label>
                            <select
                              value={cardForm.installments}
                              onChange={(e) => setCardForm({ ...cardForm, installments: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold"
                            >
                              <option value="1">1x de {money(Number(paymentInfo.total))} sem juros</option>
                              {Number(paymentInfo.total) >= 30 && (
                                <option value="2">2x de {money(Number(paymentInfo.total) / 2)}</option>
                              )}
                              {Number(paymentInfo.total) >= 60 && (
                                <option value="3">3x de {money(Number(paymentInfo.total) / 3)}</option>
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="font-semibold text-slate-700">CEP do titular</label>
                            <input
                              required
                              type="text"
                              maxLength={9}
                              value={cardForm.postalCode}
                              onChange={(e) =>
                                setCardForm({
                                  ...cardForm,
                                  postalCode: e.target.value.replace(/\D/g, "").slice(0, 8),
                                })
                              }
                              placeholder="00000-000"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-800"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700">Nº</label>
                            <input
                              required
                              type="text"
                              value={cardForm.addressNumber}
                              onChange={(e) =>
                                setCardForm({ ...cardForm, addressNumber: e.target.value })
                              }
                              placeholder="123"
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-800"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={payingCard}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#292b25] py-3 text-xs font-bold text-white transition hover:bg-[#3d3f37] disabled:opacity-50"
                        >
                          <Lock size={13} />
                          {payingCard
                            ? "Autorizando pagamento…"
                            : `Pagar ${money(Number(paymentInfo.total))} com Cartão`}
                        </button>

                        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>Pagamento seguro processado com criptografia via Asaas</span>
                        </div>
                      </form>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Verificação automática a cada 4s</span>
                      <button
                        type="button"
                        onClick={() => void handleManualCheck()}
                        disabled={checking}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={checking ? "animate-spin text-slate-500" : "text-slate-400"} />
                        {checking ? "Verificando…" : "Já paguei"}
                      </button>
                    </div>
                  </div>
                )
              )}

              {tracking.status === "cancelled" ? (
                <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
                  Este pedido foi cancelado. Fale diretamente com o estabelecimento se precisar de
                  ajuda.
                </div>
              ) : (
                <ol className="mt-8 space-y-0">
                  {steps
                    .filter(
                      (step) => tracking.fulfillment === "delivery" || step !== "out_for_delivery",
                    )
                    .map((step) => {
                      const index = steps.indexOf(step);
                      const complete = index <= currentStep;
                      return (
                        <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
                          <span
                            className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${complete ? "bg-[#292b25] text-white" : "bg-slate-100 text-slate-400"}`}
                          >
                            {complete ? <Check size={15} /> : <Clock3 size={15} />}
                          </span>
                          <span
                            className={`pt-1.5 text-sm font-semibold ${complete ? "text-[#292b25]" : "text-slate-400"}`}
                          >
                            {labels[step]}
                          </span>
                          {index < steps.length - 1 && (
                            <span
                              aria-hidden="true"
                              className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-px ${index < currentStep ? "bg-[#778253]" : "bg-slate-200"}`}
                            />
                          )}
                        </li>
                      );
                    })}
                </ol>
              )}
              <p className="mt-8 text-center text-xs text-slate-400">
                Esta página é atualizada automaticamente
              </p>
            </>
          )
        )}
      </section>
    </main>
  );
}
