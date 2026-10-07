import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  DollarSign,
  FileText,
  Landmark,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";
import { money } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type LocalBill = {
  id: string;
  bill_type: "payable" | "receivable";
  title: string;
  category: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: "pending" | "paid" | "cancelled";
  notes?: string | null;
};

type AsaasAccountData = {
  salesEnabled: boolean;
  onboardingStatus: string;
  providerAccountId?: string | null;
  walletId?: string | null;
  accountNumber?: string | null;
  agency?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
  legalName?: string | null;
  cpfCnpj?: string | null;
  email?: string | null;
  phone?: string | null;
};

type BalanceData = {
  balance: number;
  totalPending: number;
  transferableBalance: number;
};

type WalletTransaction = {
  id: string;
  transaction_type: string;
  status: string;
  amount_cents: number;
  description: string;
  created_at: string;
};

type AsaasPaymentItem = {
  order_id: string;
  billing_type: string;
  status: string;
  amount_cents: number;
  invoice_url?: string | null;
  created_at: string;
};

export const Route = createFileRoute("/studio/financeiro")({
  component: BusinessFinancePage,
});

function BusinessFinancePage() {
  const { business, saveBusiness, orders } = useLocalHub();
  const [activeTab, setActiveTab] = useState<"wallet" | "bills" | "reports">("wallet");
  const [bills, setBills] = useState<LocalBill[]>([]);
  const [newBillTitle, setNewBillTitle] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillType, setNewBillType] = useState<"payable" | "receivable">("payable");
  const [newBillCategory, setNewBillCategory] = useState("Ingredientes / Insumos");
  const [newBillDueDate, setNewBillDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newBillNotes, setNewBillNotes] = useState("");
  const [reportPeriod, setReportPeriod] = useState<"weekly" | "monthly">("monthly");

  const [account, setAccount] = useState<AsaasAccountData | null>(null);
  const [balance, setBalance] = useState<BalanceData>({
    balance: 0,
    totalPending: 0,
    transferableBalance: 0,
  });
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [recentPayments, setRecentPayments] = useState<AsaasPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [togglingSales, setTogglingSales] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState("");

  // Dados do formulário de subconta
  const [formData, setFormData] = useState({
    name: business?.name || "",
    email: "",
    cpfCnpj: "",
    phone: business?.phone || "",
    postalCode: "",
    address: "",
    addressNumber: "",
    complement: "",
    province: "",
    city: "",
    state: "",
    pixKey: "",
    pixKeyType: "CPF" as "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP",
  });

  const loadFinancialData = useCallback(async () => {
    if (!business?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("A conexão segura com o banco de dados está indisponível.");
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // 1. Busca dados da subconta e saldo real do Asaas via API
      let apiAccount: AsaasAccountData | null = null;
      let apiBalance: BalanceData = { balance: 0, totalPending: 0, transferableBalance: 0 };

      if (token) {
        try {
          const res = await fetch(`/api/asaas/subaccount?businessId=${business.id}`, {
            headers: { authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              apiAccount = data.account;
              apiBalance = data.balance;
            }
          }
        } catch (fetchErr) {
          console.warn("Não foi possível sincronizar saldo da API Asaas:", fetchErr);
        }
      }

      // 2. Busca pagamentos e transações locais no Supabase
      const [paymentsRes, transactionsRes] = await Promise.all([
        supabase
          .from("localhub_asaas_order_payments")
          .select("order_id, billing_type, status, amount_cents, invoice_url, created_at")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("localhub_wallet_transactions")
          .select("id, transaction_type, status, amount_cents, description, created_at")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setAccount(apiAccount);
      setBalance(apiBalance);
      setRecentPayments((paymentsRes.data as AsaasPaymentItem[]) || []);
      setWalletTransactions((transactionsRes.data as WalletTransaction[]) || []);

      // Busca contas a pagar e receber locais
      const { data: billsData } = await supabase
        .from("localhub_bills")
        .select("*")
        .eq("business_id", business.id)
        .order("due_date", { ascending: true });
      if (billsData) {
        setBills(billsData as LocalBill[]);
      }

      if (apiAccount) {
        setFormData((prev) => ({
          ...prev,
          name: apiAccount.legalName || prev.name,
          email: apiAccount.email || prev.email,
          cpfCnpj: apiAccount.cpfCnpj || prev.cpfCnpj,
          phone: apiAccount.phone || prev.phone,
          pixKey: apiAccount.pixKey || prev.pixKey,
          pixKeyType: (apiAccount.pixKeyType as any) || prev.pixKeyType,
        }));
      }
    } catch (caught) {
      console.error("Erro ao carregar financeiro:", caught);
      setError("Não foi possível carregar as informações financeiras.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [business?.id, business?.name, business?.phone]);

  useEffect(() => {
    void loadFinancialData();
  }, [loadFinancialData]);

  async function handleCreateBill(e: React.FormEvent) {
    e.preventDefault();
    if (!business?.id || !newBillTitle.trim() || !newBillAmount) return;
    const supabase = getSupabaseBrowserClient();
    const createdBill: LocalBill = {
      id: crypto.randomUUID(),
      bill_type: newBillType,
      title: newBillTitle.trim(),
      category: newBillCategory,
      amount: Number(newBillAmount),
      due_date: newBillDueDate,
      paid_at: null,
      status: "pending",
      notes: newBillNotes.trim() || null,
    };
    setBills((prev) => [createdBill, ...prev]);
    if (supabase) {
      await supabase
        .from("localhub_bills")
        .insert({
          business_id: business.id,
          bill_type: createdBill.bill_type,
          title: createdBill.title,
          category: createdBill.category,
          amount: createdBill.amount,
          due_date: createdBill.due_date,
          status: createdBill.status,
          notes: createdBill.notes,
        })
        .catch(() => {});
    }
    setNewBillTitle("");
    setNewBillAmount("");
    setNewBillNotes("");
    setFeedbackMessage({ type: "success", text: "Lançamento adicionado com sucesso!" });
  }

  async function handleToggleBillPaid(billId: string) {
    const supabase = getSupabaseBrowserClient();
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== billId) return b;
        const nextStatus = b.status === "paid" ? "pending" : "paid";
        const paidAt = nextStatus === "paid" ? new Date().toISOString() : null;
        if (supabase) {
          void supabase
            .from("localhub_bills")
            .update({ status: nextStatus, paid_at: paidAt })
            .eq("id", billId);
        }
        return { ...b, status: nextStatus, paid_at: paidAt };
      }),
    );
  }

  async function handleDeleteBill(billId: string) {
    const supabase = getSupabaseBrowserClient();
    setBills((prev) => prev.filter((b) => b.id !== billId));
    if (supabase) {
      await supabase.from("localhub_bills").delete().eq("id", billId).catch(() => {});
    }
  }

  const reportsData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (reportPeriod === "weekly") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredOrders = orders.filter((o) => {
      if (o.status !== "completed") return false;
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate;
    });

    const ordersRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

    const filteredBills = bills.filter((b) => {
      const billDate = new Date(b.due_date);
      return billDate >= startDate;
    });

    const extraRevenuePaid = filteredBills
      .filter((b) => b.bill_type === "receivable" && b.status === "paid")
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const totalGrossRevenue = ordersRevenue + extraRevenuePaid;

    const operatingExpensesPaid = filteredBills
      .filter((b) => b.bill_type === "payable" && b.status === "paid")
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const pendingExpenses = filteredBills
      .filter((b) => b.bill_type === "payable" && b.status === "pending")
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const netOperatingProfit = totalGrossRevenue - operatingExpensesPaid;
    const profitMargin =
      totalGrossRevenue > 0 ? (netOperatingProfit / totalGrossRevenue) * 100 : 0;

    const categoryExpenses: Record<string, number> = {};
    for (const b of filteredBills) {
      if (b.bill_type === "payable" && b.status === "paid") {
        categoryExpenses[b.category] =
          (categoryExpenses[b.category] ?? 0) + Number(b.amount);
      }
    }

    return {
      ordersCount: filteredOrders.length,
      ordersRevenue,
      extraRevenuePaid,
      totalGrossRevenue,
      operatingExpensesPaid,
      pendingExpenses,
      netOperatingProfit,
      profitMargin,
      categoryExpenses,
    };
  }, [bills, orders, reportPeriod]);

  async function handleToggleSales() {
    if (!business?.id) return;
    setTogglingSales(true);
    setFeedbackMessage(null);
    try {
      const nextState = !business.onlinePaymentEnabled;
      await saveBusiness({
        ...business,
        onlinePaymentEnabled: nextState,
      });

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase
          .from("localhub_payment_accounts")
          .update({ sales_enabled: nextState })
          .eq("business_id", business.id);
      }

      setAccount((prev) => (prev ? { ...prev, salesEnabled: nextState } : null));
      setFeedbackMessage({
        type: "success",
        text: nextState
          ? "Vendas online (Pix e Cartão Asaas) ativadas com sucesso!"
          : "Vendas online pausadas temporariamente.",
      });
    } catch (caught) {
      setFeedbackMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Erro ao atualizar vendas online.",
      });
    } finally {
      setTogglingSales(false);
    }
  }

  async function handleSaveSubaccount(e: React.FormEvent) {
    e.preventDefault();
    if (!business?.id) return;
    setSavingAccount(true);
    setFeedbackMessage(null);

    const supabase = getSupabaseBrowserClient();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) {
      setFeedbackMessage({ type: "error", text: "Sessão expirada. Faça login novamente." });
      setSavingAccount(false);
      return;
    }

    try {
      const response = await fetch("/api/asaas/subaccount", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          ...formData,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Não foi possível criar a subconta Asaas.");
      }

      setFeedbackMessage({
        type: "success",
        text: "Subconta Asaas configurada e ativada com sucesso!",
      });
      setShowSetupModal(false);
      await loadFinancialData();
    } catch (caught) {
      setFeedbackMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Erro ao salvar dados da subconta.",
      });
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleRequestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!business?.id) return;
    const valueNum = parseFloat(withdrawAmount.replace(",", "."));
    if (isNaN(valueNum) || valueNum <= 0) {
      setFeedbackMessage({ type: "error", text: "Digite um valor de saque válido." });
      return;
    }

    setWithdrawing(true);
    setFeedbackMessage(null);

    const supabase = getSupabaseBrowserClient();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) {
      setFeedbackMessage({ type: "error", text: "Sessão expirada." });
      setWithdrawing(false);
      return;
    }

    try {
      const amountCents = Math.round(valueNum * 100);
      const res = await fetch("/api/asaas/withdraw", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          amountCents,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao processar saque.");
      }

      setFeedbackMessage({
        type: "success",
        text: `Saque Pix de ${money(valueNum)} solicitado com sucesso!`,
      });
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await loadFinancialData();
    } catch (caught) {
      setFeedbackMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Falha ao solicitar saque.",
      });
    } finally {
      setWithdrawing(false);
    }
  }

  const isSubaccountActive = account?.onboardingStatus === "active";
  const displayedAvailable = balance.transferableBalance || balance.balance;
  const displayedPending = balance.totalPending;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#778253]">
            Operação e Recebimentos
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Financeiro & Asaas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Receba com Pix e Cartão de Crédito na sua subconta Asaas com repasse automático e taxa zero ELLO.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void loadFinancialData();
          }}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Atualizar saldos
        </button>
      </header>

      {feedbackMessage && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            feedbackMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-red-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Navegação entre Abas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("wallet")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "wallet"
              ? "bg-[#292b25] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <WalletCards size={15} /> Carteira & Asaas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bills")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "bills"
              ? "bg-[#292b25] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText size={15} /> Contas a Pagar e Receber
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "reports"
              ? "bg-[#292b25] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BarChart3 size={15} /> Relatórios Financeiros (DRE)
        </button>
      </div>

      {activeTab === "wallet" && (
        <div className="space-y-6">
          {/* Cartões de Saldo da Subconta */}
          <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Saldo Disponível
            </span>
            <span className="rounded-full bg-emerald-100 p-1.5 text-emerald-700">
              <Landmark size={15} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-950">
            {money(displayedAvailable)}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-emerald-700">Liberado para saque Pix</span>
            <button
              type="button"
              disabled={!isSubaccountActive || displayedAvailable <= 0}
              onClick={() => setShowWithdrawModal(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDownToLine size={13} />
              Sacar
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              A Receber / Pendente
            </span>
            <span className="rounded-full bg-amber-100 p-1.5 text-amber-700">
              <Clock3 size={15} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-950">
            {money(displayedPending)}
          </p>
          <p className="mt-4 text-[11px] text-amber-700">
            Compensações de cartão / aguardando liquidação
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vendas Online
            </span>
            <span className="rounded-full bg-slate-100 p-1.5 text-slate-700">
              <QrCode size={15} />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {business?.onlinePaymentEnabled ? "Ativadas" : "Desativadas"}
              </p>
              <p className="text-[11px] text-slate-400">Pix e Cartão na loja</p>
            </div>
            <button
              type="button"
              disabled={togglingSales || !isSubaccountActive}
              onClick={() => void handleToggleSales()}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                business?.onlinePaymentEnabled
                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-[#292b25] text-white hover:bg-[#3d3f37]"
              }`}
            >
              {togglingSales ? "…" : business?.onlinePaymentEnabled ? "Pausar" : "Ativar"}
            </button>
          </div>
          {!isSubaccountActive && (
            <p className="mt-2 text-[10px] text-amber-600">
              Crie a subconta abaixo para liberar vendas online.
            </p>
          )}
        </div>
      </section>

      {/* Status da Subconta Asaas */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#edf0e5] text-[#667448]">
              <WalletCards size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Subconta Asaas do Estabelecimento</h2>
                {isSubaccountActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={12} /> Ativa e verificada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    Não configurada
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                {isSubaccountActive
                  ? "Seus recebíveis por Pix e Cartão de Crédito são creditados diretamente nesta subconta sem intermediação manual."
                  : "Cadastre os dados do seu negócio para criar sua subconta Asaas oficial e receber suas vendas com Pix imediato e cartão."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50"
          >
            {isSubaccountActive ? "Editar dados da subconta" : "Criar subconta Asaas"}
          </button>
        </div>

        {isSubaccountActive && account && (
          <div className="mt-6 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs sm:grid-cols-3">
            <div>
              <span className="text-slate-400">Titular</span>
              <p className="mt-0.5 font-bold text-slate-800">{account.legalName || "—"}</p>
            </div>
            <div>
              <span className="text-slate-400">CPF / CNPJ</span>
              <p className="mt-0.5 font-bold text-slate-800">{account.cpfCnpj || "—"}</p>
            </div>
            <div>
              <span className="text-slate-400">Chave Pix de Saque</span>
              <p className="mt-0.5 font-mono font-bold text-slate-800">
                {account.pixKey} ({account.pixKeyType})
              </p>
            </div>
            {account.accountNumber && (
              <div>
                <span className="text-slate-400">Conta Asaas</span>
                <p className="mt-0.5 font-mono font-bold text-slate-800">
                  Ag. {account.agency} / Cc. {account.accountNumber}
                </p>
              </div>
            )}
            {account.providerAccountId && (
              <div>
                <span className="text-slate-400">ID Asaas</span>
                <p className="mt-0.5 font-mono text-slate-600 truncate">{account.providerAccountId}</p>
              </div>
            )}
            {account.walletId && (
              <div>
                <span className="text-slate-400">Wallet ID</span>
                <p className="mt-0.5 font-mono text-slate-600 truncate">{account.walletId}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Histórico Recente de Pagamentos Asaas e Transações */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Pagamentos de Pedidos */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Vendas Online Asaas</h3>
            <span className="text-xs text-slate-400">{recentPayments.length} recentes</span>
          </div>
          {recentPayments.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Nenhuma venda online registrada ainda.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <div key={p.order_id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Pedido #{p.order_id.slice(0, 8)} · {p.billing_type === "PIX" ? "Pix" : "Cartão"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(p.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{money(p.amount_cents / 100)}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.status === "confirmed" || p.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status === "confirmed" || p.status === "paid"
                        ? "Aprovado"
                        : p.status === "pending"
                          ? "Aguardando"
                          : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extrato da Carteira / Saques */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Movimentações & Saques</h3>
            <span className="text-xs text-slate-400">{walletTransactions.length} lançamentos</span>
          </div>
          {walletTransactions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Nenhuma movimentação no extrato.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {walletTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{tx.description || "Lançamento financeiro"}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(tx.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        tx.amount_cents < 0 ? "text-red-600" : "text-emerald-700"
                      }`}
                    >
                      {tx.amount_cents < 0 ? "−" : "+"}
                      {money(Math.abs(tx.amount_cents) / 100)}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tx.status === "available" || tx.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {tx.status === "available"
                        ? "Disponível"
                        : tx.status === "completed"
                          ? "Concluído"
                          : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
        </div>
      )}

      {/* ABA 2: Contas a Pagar e Receber */}
      {activeTab === "bills" && (
        <div className="space-y-6">
          {/* Resumo de Contas */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                A Pagar (Pendente)
              </span>
              <p className="mt-2 text-2xl font-extrabold text-rose-950">
                {money(
                  bills
                    .filter((b) => b.bill_type === "payable" && b.status === "pending")
                    .reduce((sum, b) => sum + Number(b.amount), 0),
                )}
              </p>
              <span className="text-[11px] text-rose-700">Contas e fornecedores a quitar</span>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                A Receber (Pendente)
              </span>
              <p className="mt-2 text-2xl font-extrabold text-sky-950">
                {money(
                  bills
                    .filter((b) => b.bill_type === "receivable" && b.status === "pending")
                    .reduce((sum, b) => sum + Number(b.amount), 0),
                )}
              </p>
              <span className="text-[11px] text-sky-700">Valores a faturar / receber</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Despesas Pagas (Total)
              </span>
              <p className="mt-2 text-2xl font-extrabold text-emerald-950">
                {money(
                  bills
                    .filter((b) => b.bill_type === "payable" && b.status === "paid")
                    .reduce((sum, b) => sum + Number(b.amount), 0),
                )}
              </p>
              <span className="text-[11px] text-emerald-700">Já quitadas no sistema</span>
            </div>
          </section>

          {/* Formulário de Novo Lançamento */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Novo Lançamento Financeiro</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Cadastre contas de fornecedores, compras de ingredientes, salários, aluguel ou receitas extras.
            </p>

            <form onSubmit={handleCreateBill} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Tipo de Conta</label>
                <select
                  value={newBillType}
                  onChange={(e) => setNewBillType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="payable">Conta a Pagar (Despesa)</option>
                  <option value="receivable">Conta a Receber (Receita)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Descrição / Fornecedor *</label>
                <input
                  required
                  value={newBillTitle}
                  onChange={(e) => setNewBillTitle(e.target.value)}
                  placeholder="Ex: Distribuidora de Carnes Silva"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Categoria</label>
                <select
                  value={newBillCategory}
                  onChange={(e) => setNewBillCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                >
                  <option value="Ingredientes / Insumos">Ingredientes / Insumos</option>
                  <option value="Embalagens & Sacolas">Embalagens & Sacolas</option>
                  <option value="Aluguel & Condomínio">Aluguel & Condomínio</option>
                  <option value="Energia, Água & Gás">Energia, Água & Gás</option>
                  <option value="Equipe & Diárias Motoboy">Equipe & Diárias Motoboy</option>
                  <option value="Marketing & Anúncios">Marketing & Anúncios</option>
                  <option value="Sistemas & Softwares">Sistemas & Softwares</option>
                  <option value="Impostos & Taxas">Impostos & Taxas</option>
                  <option value="Outras Despesas">Outras Despesas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Valor (R$) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Vencimento *</label>
                <input
                  required
                  type="date"
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#3f4137]"
                >
                  <Plus size={15} /> Adicionar Lançamento
                </button>
              </div>
            </form>
          </section>

          {/* Tabela de Contas Cadastradas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Lista de Contas</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {bills.length > 0 ? (
                bills.map((bill) => (
                  <div key={bill.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleBillPaid(bill.id)}
                        className={`grid size-7 place-items-center rounded-lg border transition ${
                          bill.status === "paid"
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                        }`}
                        title={bill.status === "paid" ? "Marcar como pendente" : "Marcar como pago"}
                      >
                        <Check size={14} />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{bill.title}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              bill.bill_type === "payable"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {bill.bill_type === "payable" ? "Pagar" : "Receber"}
                          </span>
                        </div>
                        <span className="text-slate-500">
                          {bill.category} · Vence em {new Date(bill.due_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-sm font-bold ${
                          bill.bill_type === "payable" ? "text-rose-700" : "text-sky-700"
                        }`}
                      >
                        {bill.bill_type === "payable" ? "−" : "+"}
                        {money(bill.amount)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          bill.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bill.status === "paid" ? "Pago" : "Pendente"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBill(bill.id)}
                        className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Excluir lançamento"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhuma conta cadastrada. Use o formulário acima para registrar fornecedores ou receitas.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ABA 3: Relatórios Financeiros (DRE) */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Seletor de Período */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Demonstrativo de Resultado (DRE)</h2>
              <p className="text-xs text-slate-500">
                Acompanhe o faturamento bruto dos pedidos, despesas operacionais e o lucro líquido real.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReportPeriod("weekly")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  reportPeriod === "weekly"
                    ? "bg-[#292b25] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                type="button"
                onClick={() => setReportPeriod("monthly")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  reportPeriod === "monthly"
                    ? "bg-[#292b25] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Este mês
              </button>
            </div>
          </div>

          {/* Cards Principais do DRE */}
          <section className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Receita Bruta Total</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {money(reportsData.totalGrossRevenue)}
              </p>
              <span className="text-[11px] text-emerald-700">
                {reportsData.ordersCount} pedidos concluídos
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Despesas Pagas</span>
              <p className="mt-2 text-2xl font-extrabold text-rose-700">
                {money(reportsData.operatingExpensesPaid)}
              </p>
              <span className="text-[11px] text-slate-400">
                Pendente: {money(reportsData.pendingExpenses)}
              </span>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-xs ${
                reportsData.netOperatingProfit >= 0
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-rose-200 bg-rose-50/70"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lucro Operacional
              </span>
              <p
                className={`mt-2 text-2xl font-extrabold ${
                  reportsData.netOperatingProfit >= 0 ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {money(reportsData.netOperatingProfit)}
              </p>
              <span className="text-[11px] font-semibold text-slate-600">
                {reportsData.netOperatingProfit >= 0 ? "Superávit no período" : "Déficit no período"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Margem Operacional</span>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {reportsData.profitMargin.toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-500">Lucro sobre receita</span>
            </div>
          </section>

          {/* DRE Estruturado em Tabela e Despesas por Categoria */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Estrutura do DRE</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">(+) Vendas do Cardápio</span>
                  <b className="text-slate-900">{money(reportsData.ordersRevenue)}</b>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">(+) Outras Receitas Pagas</span>
                  <b className="text-slate-900">{money(reportsData.extraRevenuePaid)}</b>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 font-bold bg-slate-50 px-2 rounded-lg">
                  <span className="text-slate-800">(=) Faturamento Bruto</span>
                  <span className="text-slate-900">{money(reportsData.totalGrossRevenue)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 text-rose-700">
                  <span>(−) Despesas Operacionais Pagas</span>
                  <b>−{money(reportsData.operatingExpensesPaid)}</b>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-extrabold">
                  <span>(=) Resultado Operacional Líquido</span>
                  <span
                    className={
                      reportsData.netOperatingProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                    }
                  >
                    {money(reportsData.netOperatingProfit)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Despesas por Categoria</h3>
              <div className="mt-3 space-y-3">
                {Object.keys(reportsData.categoryExpenses).length > 0 ? (
                  Object.entries(reportsData.categoryExpenses).map(([category, val]) => {
                    const pct =
                      reportsData.operatingExpensesPaid > 0
                        ? (val / reportsData.operatingExpensesPaid) * 100
                        : 0;
                    return (
                      <div key={category} className="text-xs">
                        <div className="flex justify-between text-slate-700 font-medium">
                          <span>{category}</span>
                          <span>
                            {money(val)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#778253]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Nenhuma despesa paga registrada neste período.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Modal / Diálogo de Configuração de Subconta */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold">Dados da Subconta Asaas</h2>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubaccount} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Razão Social ou Nome do Titular *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                  placeholder="Nome completo ou Razão Social"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">CPF ou CNPJ *</label>
                  <input
                    required
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Telefone / WhatsApp *</label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">E-mail para notificações Asaas *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                  placeholder="contato@seunegocio.com.br"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">CEP *</label>
                  <input
                    required
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="00000-000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700">Endereço (Rua/Av) *</label>
                  <input
                    required
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="Logradouro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Número *</label>
                  <input
                    required
                    type="text"
                    value={formData.addressNumber}
                    onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Bairro *</label>
                  <input
                    required
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="Centro"
                  />
                </div>
              </div>

              {/* Chave Pix para Saques */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 mt-2">
                <label className="block font-bold text-emerald-950">Chave Pix para Saque *</label>
                <p className="text-[11px] text-emerald-700 mb-2">Para onde você deseja transferir o seu saldo disponível.</p>
                <div className="flex gap-2">
                  <select
                    value={formData.pixKeyType}
                    onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value as any })}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="EVP">Chave Aleatória</option>
                  </select>
                  <input
                    required
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-800"
                    placeholder="Informe sua chave Pix"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="rounded-xl bg-[#292b25] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#3f4137] disabled:opacity-50"
                >
                  {savingAccount ? "Salvando na Asaas…" : "Conectar Subconta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Saque Pix */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold">Solicitar Saque via Pix</h2>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestWithdraw} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400">Saldo disponível:</span>
                <p className="text-lg font-extrabold text-slate-900">{money(displayedAvailable)}</p>
                <span className="text-slate-400 mt-2 block">Chave Pix cadastrada:</span>
                <p className="font-mono font-bold text-emerald-800">{account?.pixKey}</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Valor do saque (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  max={displayedAvailable}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-bold text-slate-900 outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {withdrawing ? "Processando…" : "Confirmar Saque Pix"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
