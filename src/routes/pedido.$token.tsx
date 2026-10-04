import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Copy, MapPin, Package, QrCode, RefreshCw, Store, XCircle } from "lucide-react";
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

type PixPayment = {
  order_id: string;
  order_number: number;
  total: number;
  payment_status: string;
  pix_payload: string | null;
  pix_image: string | null;
  pix_expiration: string | null;
  invoice_url: string | null;
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
    // Web Audio blocked or unsupported
  }
}

function PublicOrderTrackingPage() {
  const { token } = Route.useParams();
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const prevPaymentStatus = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Acompanhar pedidos está temporariamente indisponível.");
      setLoading(false);
      return;
    }

    const [trackingRes, pixRes] = await Promise.all([
      client.rpc("localhub_public_order_tracking", { p_tracking_token: token }),
      client.rpc("localhub_get_order_pix_payment", { p_tracking_token: token }),
    ]);

    const trackingRow = Array.isArray(trackingRes.data) ? trackingRes.data[0] : null;
    if (trackingRes.error || !trackingRow) {
      setError("Não encontramos esse pedido. Confira o link recebido.");
    } else {
      setTracking(trackingRow as Tracking);
      setError("");
    }

    const pixRow = Array.isArray(pixRes.data) ? pixRes.data[0] : null;
    if (pixRow) {
      const paymentData = pixRow as PixPayment;
      if (
        prevPaymentStatus.current &&
        prevPaymentStatus.current !== "paid" &&
        paymentData.payment_status === "paid"
      ) {
        playPaymentSuccessChime();
      }
      prevPaymentStatus.current = paymentData.payment_status;
      setPixPayment(paymentData);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    let active = true;
    void loadData();

    // Polling adaptativo: 4 segundos enquanto aguarda Pix, 12 segundos após confirmação
    const isUnpaid = pixPayment?.pix_payload && pixPayment.payment_status !== "paid";
    const intervalMs = isUnpaid ? 4_000 : 12_000;

    const interval = window.setInterval(() => {
      if (active) void loadData();
    }, intervalMs);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [loadData, pixPayment?.pix_payload, pixPayment?.payment_status]);

  async function handleManualCheck() {
    setChecking(true);
    await loadData();
    setTimeout(() => setChecking(false), 600);
  }

  const currentStep = tracking ? steps.indexOf(tracking.status) : -1;
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

              {pixPayment && pixPayment.pix_payload && (
                pixPayment.payment_status === "paid" ? (
                  <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Pagamento confirmado via Pix!</p>
                      <p className="text-xs text-emerald-700">O estabelecimento já recebeu seu pagamento.</p>
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
                          Aguardando pagamento Pix
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {money(Number(pixPayment.total))}
                      </span>
                    </div>

                    {pixPayment.pix_image && (
                      <div className="mt-4 flex flex-col items-center">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                          <img
                            src={
                              pixPayment.pix_image.startsWith("data:")
                                ? pixPayment.pix_image
                                : `data:image/png;base64,${pixPayment.pix_image}`
                            }
                            alt="QR Code Pix"
                            className="size-44 object-contain"
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">Escaneie o QR Code no seu banco</p>
                      </div>
                    )}

                    {pixPayment.pix_payload && (
                      <div className="mt-4">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Pix Copia e Cola
                        </label>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={pixPayment.pix_payload}
                            className="w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(pixPayment.pix_payload!);
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
