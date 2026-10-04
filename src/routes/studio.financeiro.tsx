import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  CircleCheck,
  Clock3,
  ExternalLink,
  ShieldCheck,
  WalletCards,
  AlertCircle,
} from "lucide-react";
import { ElloInfoBanner } from "@/components/ello/primitives";
import { money } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type WalletProfile = {
  sales_enabled: boolean;
  onboarding_status:
    | "not_started"
    | "requested"
    | "under_review"
    | "active"
    | "rejected"
    | "suspended";
  wallet_id: string | null;
};

type StripeConnectProfile = {
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  updated_at: string;
};

type StripePaymentItem = {
  order_id: string;
  status: string;
  amount_cents: number;
  created_at: string;
};

type WalletTransaction = {
  id: string;
  transaction_type: string;
  status: string;
  amount_cents: number;
  description: string;
  created_at: string;
};

export const Route = createFileRoute("/studio/financeiro")({
  validateSearch: (search: Record<string, unknown>) => ({
    stripe: typeof search.stripe === "string" ? search.stripe : undefined,
  }),
  component: BusinessFinancePage,
});

function BusinessFinancePage() {
  const { business, saveBusiness } = useLocalHub();
  const search = Route.useSearch();
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [stripeAccount, setStripeAccount] = useState<StripeConnectProfile | null>(null);
  const [recentPayments, setRecentPayments] = useState<StripePaymentItem[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [error, setError] = useState("");
  const [stripeNotice, setStripeNotice] = useState("");
  const stripeEnabled = import.meta.env.VITE_STRIPE_ONLINE_PAYMENTS_ENABLED === "true";

  const loadProfile = useCallback(async () => {
    if (!business?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão segura está indisponível.");
      setLoading(false);
      return;
    }
    const [asaasResult, stripeResult, paymentsResult, walletResult] = await Promise.all([
      supabase
        .from("localhub_payment_accounts")
        .select("sales_enabled,onboarding_status,wallet_id")
        .eq("business_id", business.id)
        .maybeSingle(),
      supabase
        .from("localhub_stripe_connect_accounts")
        .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted, updated_at")
        .eq("business_id", business.id)
        .maybeSingle(),
      supabase
        .from("localhub_stripe_order_payments")
        .select("order_id, status, amount_cents, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("localhub_wallet_transactions")
        .select("id, transaction_type, status, amount_cents, description, created_at")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (asaasResult.error) setError("Não foi possível carregar a configuração Asaas.");
    setProfile((asaasResult.data as WalletProfile | null) ?? null);
    setStripeAccount((stripeResult.data as StripeConnectProfile | null) ?? null);
    setRecentPayments((paymentsResult.data as StripePaymentItem[] | null) ?? []);
    setWalletTransactions((walletResult.data as WalletTransaction[] | null) ?? []);
    setLoading(false);
  }, [business?.id]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (search.stripe === "return") {
      setStripeNotice("Retorno do cadastro Stripe detectado. Atualizando o status da sua conta…");
      void loadProfile();
    } else if (search.stripe === "refresh") {
      setStripeNotice("Sessão da Stripe atualizada. Caso precise, clique novamente para continuar.");
      void loadProfile();
    }
  }, [search.stripe, loadProfile]);

  async function setSalesEnabled(enabled: boolean) {
    if (!business?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError("");
    const { error: requestError } = await supabase.rpc("localhub_set_wallet_sales_enabled", {
      p_business_id: business.id,
      p_enabled: enabled,
    });
    if (requestError) {
      setError(
        "Não foi possível salvar sua opção. Confirme se a atualização do ELLO já foi instalada.",
      );
    } else {
      await loadProfile();
    }
    setSaving(false);
  }

  async function connectStripeAccount() {
    if (!business?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão segura está indisponível.");
      return;
    }
    setConnectingStripe(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Entre novamente para conectar sua conta.");
      const response = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ businessId: business.id }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? "Não foi possível iniciar o cadastro Stripe.");
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível conectar ao Stripe.");
      setConnectingStripe(false);
    }
  }

  const optedIn = profile?.sales_enabled ?? false;
  const statusLabel = {
    not_started: "Ainda não solicitada",
    requested: "Solicitação registrada",
    under_review: "Em análise pelo Asaas",
    active: "Carteira ativa",
    rejected: "Cadastro precisa de ajustes",
    suspended: "Ativação temporariamente suspensa",
  }[profile?.onboarding_status ?? "not_started"];

  async function toggleOnlinePayment() {
    if (!business) return;
    setTogglingOnline(true);
    setError("");
    try {
      await saveBusiness({
        ...business,
        onlinePaymentEnabled: !business.onlinePaymentEnabled,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Não foi possível atualizar pagamentos online.",
      );
    } finally {
      setTogglingOnline(false);
    }
  }

  const availableBalance =
    walletTransactions
      .filter((t) => t.status === "available" || t.status === "completed")
      .reduce(
        (sum, t) =>
          sum + (t.transaction_type === "refund" ? -Math.abs(t.amount_cents) : t.amount_cents),
        0,
      ) / 100;

  const pendingBalance =
    walletTransactions
      .filter((t) => t.status === "pending")
      .reduce((sum, t) => sum + t.amount_cents, 0) / 100;

  const isStripeActive = Boolean(stripeAccount?.charges_enabled);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-[#778253]">
          Recebimentos do negócio
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Financeiro e carteira</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Gerencie o recebimento direto por Stripe Connect (Pix e Cartão) e a adesão à carteira Asaas
          do seu negócio.
        </p>
      </header>

      {stripeNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 border border-blue-200">
          <AlertCircle size={18} className="shrink-0 text-blue-700" />
          <span>{stripeNotice}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#778253]">
                Pagamentos online · Stripe Connect
              </p>
              {stripeAccount ? (
                isStripeActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={12} /> Conta conectada e ativa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    <Clock3 size={12} /> Cadastro em análise
                  </span>
                )
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Não conectado
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-bold">Recebimento direto na sua conta</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Conecte sua conta Stripe para receber pagamentos de clientes por Pix e Cartão de crédito
              diretamente no seu negócio, com conciliação automática do pedido.
            </p>
          </div>
          <button
            type="button"
            disabled={!stripeEnabled || connectingStripe || !business?.id}
            onClick={() => void connectStripeAccount()}
            className="min-h-11 rounded-xl bg-[#292b25] px-4 text-sm font-bold text-white transition hover:bg-[#34352f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {connectingStripe
              ? "Abrindo cadastro…"
              : stripeAccount
                ? "Revisar dados na Stripe"
                : "Conectar conta Stripe"}
          </button>
        </div>

        {stripeAccount && (
          <div className="mt-5 rounded-xl border border-slate-100 bg-[#fbfbf9] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-mono">
                ID da conta: {stripeAccount.stripe_account_id}
              </span>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                    stripeAccount.charges_enabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Cobranças: {stripeAccount.charges_enabled ? "Habilitadas" : "Bloqueadas"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                    stripeAccount.payouts_enabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Repasses: {stripeAccount.payouts_enabled ? "Habilitados" : "Bloqueados"}
                </span>
              </div>
            </div>

            {isStripeActive && (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-200/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Oferecer pagamento online na vitrine da loja
                  </p>
                  <p className="text-xs text-slate-500">
                    Permite que seus clientes paguem por Pix online e Cartão direto no cardápio ELLO.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={togglingOnline}
                  onClick={() => void toggleOnlinePayment()}
                  className={`min-h-10 rounded-xl px-4 text-xs font-bold transition disabled:opacity-50 ${
                    business?.onlinePaymentEnabled
                      ? "bg-emerald-700 text-white hover:bg-emerald-800"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {togglingOnline
                    ? "Salvando…"
                    : business?.onlinePaymentEnabled
                      ? "✓ Pagamento online ativado"
                      : "Ativar pagamento na loja"}
                </button>
              </div>
            )}
          </div>
        )}

        {recentPayments.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pagamentos online recentes
            </h3>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
              {recentPayments.map((payment) => (
                <div key={payment.order_id} className="flex items-center justify-between p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 font-mono text-xs">
                      Pedido #{payment.order_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(payment.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {money(payment.amount_cents / 100)}
                    </span>
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        payment.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {payment.status === "paid" ? "Pago" : payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          {stripeEnabled
            ? "A Stripe realiza a liquidação e o repasse diretamente para a sua conta bancária."
            : "Pagamentos online desativados nas configurações do servidor (VITE_STRIPE_ONLINE_PAYMENTS_ENABLED)."}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#edf0e5] text-[#667448]">
            <WalletCards size={23} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">Carteira de {business?.name ?? "seu negócio"}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {loading ? "Carregando" : statusLabel}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ao solicitar, você manifesta interesse em ativar vendas online e saques pela ELLO. A
              conta e a carteira só serão criadas após concluirmos a integração e o Asaas validar o
              cadastro do titular.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <FinanceStep
            icon={CircleCheck}
            title="Você escolhe"
            detail="A adesão é opcional por negócio."
          />
          <FinanceStep
            icon={Banknote}
            title="Conta do titular"
            detail="Uma carteira por negócio, não por participação."
          />
          <FinanceStep
            icon={ArrowDownToLine}
            title="Saque controlado"
            detail="Somente após saldo liberado e provedor ativo."
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">Vendas online pela carteira ELLO</p>
            <p className="mt-1 text-xs text-slate-500">
              {optedIn
                ? "Seu negócio pediu para iniciar a ativação."
                : "Seu negócio continua sem carteira e sem mudanças nos recebimentos atuais."}
            </p>
          </div>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void setSalesEnabled(!optedIn)}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${optedIn ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-[#292b25] text-white hover:bg-[#414338]"}`}
          >
            {saving
              ? "Salvando…"
              : optedIn
                ? profile?.onboarding_status === "active"
                  ? "Pausar novas vendas"
                  : "Cancelar solicitação"
                : "Quero ativar vendas e carteira"}
          </button>
        </div>

        {walletTransactions.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                <span className="text-xs font-semibold text-emerald-800">Saldo disponível para saque</span>
                <p className="mt-1 text-2xl font-bold text-emerald-950">{money(availableBalance)}</p>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4">
                <span className="text-xs font-semibold text-amber-800">A compensar / pendente</span>
                <p className="mt-1 text-2xl font-bold text-amber-950">{money(pendingBalance)}</p>
              </div>
            </div>

            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Extrato recente da carteira Asaas
            </h3>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
              {walletTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{tx.description || "Transação Pix"}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold ${tx.amount_cents < 0 ? "text-red-600" : "text-slate-900"}`}
                    >
                      {tx.amount_cents < 0 ? "−" : "+"}
                      {money(Math.abs(tx.amount_cents) / 100)}
                    </span>
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        tx.status === "available" || tx.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : tx.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tx.status === "available"
                        ? "Liberado"
                        : tx.status === "pending"
                          ? "Pendente"
                          : tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <ElloInfoBanner
        icon={<Clock3 size={19} />}
        eyebrow="Integração em preparação"
        title="Ainda não movimentamos dinheiro"
        body="Saldo, pagamentos online e saques só serão exibidos ou habilitados quando a conta Asaas da ELLO estiver aprovada, a carteira deste negócio for criada e webhooks e controles de segurança estiverem ativos. Não há saldo fictício nem cobrança real nesta etapa."
      />
    </div>
  );
}

function FinanceStep({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof CircleCheck;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#fbfbf9] p-4">
      <Icon size={18} className="text-[#778253]" />
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}
