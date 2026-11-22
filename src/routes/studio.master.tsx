import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldAlert,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Crown,
  Building2,
  Phone,
  Mail,
  Zap,
  ShoppingBag,
  Eye,
  AlertCircle,
  ChevronRight,
  Layers,
  ArrowRight,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ElloLogo } from "@/components/ello/logo";
import { ElloAtomLoader } from "@/components/ello/atom-loader";

export const Route = createFileRoute("/studio/master")({
  component: MasterDashboardPage,
});

type BusinessMasterItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  phone: string;
  is_published: boolean;
  created_at: string;
  owner_id: string;
  owner_email: string;
  owner_name: string;
  owner_last_sign_in: string | null;
  plan: "free" | "pro" | "business";
  billing_cycle: "monthly" | "yearly";
  subscription_status: string;
  services_count: number;
  orders_count: number;
  orders_total_value: number;
  bookings_count: number;
  pix_configured: boolean;
  whatsapp_connected: boolean;
};

type MasterApiResponse = {
  metrics: {
    totalUsers: number;
    totalBusinesses: number;
    publishedBusinesses: number;
    draftBusinesses: number;
    totalOrders: number;
    totalOrdersGmv: number;
    totalBookings: number;
    mrr: number;
    planCounts: { free: number; pro: number; business: number };
  };
  funnel: {
    step1_signups: number;
    step2_created_biz: number;
    step3_added_services: number;
    step4_published: number;
    step5_active_transactions: number;
  };
  businesses: BusinessMasterItem[];
  recentOrders: Array<{
    id: string;
    order_number: number;
    customer_name: string;
    total: number;
    status: string;
    fulfillment: string;
    created_at: string;
    business_name: string;
    business_slug: string;
  }>;
  recentBookings: Array<{
    id: string;
    customer_name: string;
    booking_date: string;
    booking_time: string;
    status: string;
    service_name: string;
    price: number;
    business_name: string;
    business_slug: string;
  }>;
  masterUser: {
    email: string;
    id: string;
  };
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Nunca";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function MasterDashboardPage() {
  const navigate = useNavigate();
  const { user, ready } = useLocalHub();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MasterApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "profiles" | "plans" | "flows">("overview");

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase não disponível.");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Você precisa estar logado com uma conta mestre autorizada.");
      }

      const res = await fetch("/api/admin/master", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro ao carregar dados mestre (${res.status})`);
      }

      const resJson: MasterApiResponse = await res.json();
      setData(resJson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      void fetchMasterData();
    }
  }, [ready]);

  const handleUpdatePlan = async (businessId: string, newPlan: "free" | "pro" | "business") => {
    try {
      setActionLoading(businessId);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_business_plan",
          businessId,
          plan: newPlan,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Falha ao atualizar plano.");

      toast.success(resJson.message || `Plano atualizado para ${newPlan.toUpperCase()}`);
      void fetchMasterData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar plano.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublish = async (businessId: string, currentStatus: boolean) => {
    try {
      setActionLoading(businessId);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "toggle_publish",
          businessId,
          isPublished: !currentStatus,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Falha ao alterar status.");

      toast.success(resJson.message);
      void fetchMasterData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar status.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBusinesses = useMemo(() => {
    if (!data?.businesses) return [];
    return data.businesses.filter((b) => {
      const matchesSearch =
        searchTerm === "" ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone.includes(searchTerm);

      const matchesCategory = categoryFilter === "all" || b.category === categoryFilter;
      const matchesPlan = planFilter === "all" || b.plan === planFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && b.is_published) ||
        (statusFilter === "draft" && !b.is_published);

      return matchesSearch && matchesCategory && matchesPlan && matchesStatus;
    });
  }, [data?.businesses, searchTerm, categoryFilter, planFilter, statusFilter]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8">
        <ElloAtomLoader size={52} label="Carregando Painel Mestre ELLO..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800 shadow-sm">
          <ShieldAlert className="mx-auto size-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold">Acesso ao Painel Mestre Restrito</h2>
          <p className="mt-2 text-sm leading-relaxed text-red-600">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => void fetchMasterData()}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            >
              <RefreshCw className="size-4" /> Tentar Novamente
            </button>
            <Link
              to="/studio"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar ao Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, funnel, recentOrders, recentBookings } = data!;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Master Header */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Crown className="size-3.5" />
              <span>CONTA MESTRE • SUPER ADMIN</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Painel Mestre ELLO
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Gestão executiva de todos os perfis cadastrados, controle de planos ativos e fluxos operacionais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void fetchMasterData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar Dados
            </button>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300">
              ● Banco de Produção Conectado
            </div>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "overview"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            Visão Geral & Fluxos
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "profiles"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>Perfis Criados</span>
            <span className="rounded-full bg-slate-950/40 px-2 py-0.5 text-[10px] text-white">
              {metrics.totalBusinesses}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "plans"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>Planos & Assinaturas</span>
            <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-200">
              {formatCurrency(metrics.mrr)} MRR
            </span>
          </button>
          <button
            onClick={() => setActiveTab("flows")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "flows"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            Atividade em Tempo Real
          </button>
        </div>
      </div>

      {/* TAB 1: VISÃO GERAL & FLUXOS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Contas Criadas</span>
                <Users className="size-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{metrics.totalUsers}</p>
              <span className="text-[11px] font-semibold text-slate-400">Usuários em auth</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Negócios</span>
                <Store className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{metrics.totalBusinesses}</p>
              <span className="text-[11px] font-semibold text-emerald-600">
                {metrics.publishedBusinesses} publicados ({Math.round((metrics.publishedBusinesses / (metrics.totalBusinesses || 1)) * 100)}%)
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">GMV Total</span>
                <DollarSign className="size-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(metrics.totalOrdersGmv)}</p>
              <span className="text-[11px] font-semibold text-slate-400">Volume transacionado</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Pedidos</span>
                <ShoppingBag className="size-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{metrics.totalOrders}</p>
              <span className="text-[11px] font-semibold text-slate-400">Cardápio & Totem</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium">Agendamentos</span>
                <Calendar className="size-4 text-purple-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{metrics.totalBookings}</p>
              <span className="text-[11px] font-semibold text-slate-400">Serviços agendados</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-bold">MRR Estimado</span>
                <Crown className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-950">{formatCurrency(metrics.mrr)}</p>
              <span className="text-[11px] font-semibold text-emerald-700">
                {metrics.planCounts.pro + metrics.planCounts.business} planos pagos
              </span>
            </div>
          </div>

          {/* Funil de Conversão & Fluxos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Fluxo & Funil de Conversão da Plataforma</h2>
                <p className="text-xs text-slate-500">
                  Etapas do usuário desde o cadastro até a realização da primeira venda.
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Funil Operacional
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[11px] font-bold text-slate-400">1. CADASTROS</span>
                <p className="mt-1 text-xl font-black text-slate-900">{funnel.step1_signups}</p>
                <p className="mt-1 text-[11px] text-slate-500">Usuários registrados</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-blue-500" />
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[11px] font-bold text-slate-400">2. ESTABELECIMENTO</span>
                <p className="mt-1 text-xl font-black text-slate-900">{funnel.step2_created_biz}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {Math.round((funnel.step2_created_biz / (funnel.step1_signups || 1)) * 100)}% de conversão
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-indigo-500" />
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[11px] font-bold text-slate-400">3. ITENS NO CATÁLOGO</span>
                <p className="mt-1 text-xl font-black text-slate-900">{funnel.step3_added_services}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {Math.round((funnel.step3_added_services / (funnel.step2_created_biz || 1)) * 100)}% cadastraram itens
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-purple-500" />
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[11px] font-bold text-slate-400">4. LOJA PUBLICADA</span>
                <p className="mt-1 text-xl font-black text-slate-900">{funnel.step4_published}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {Math.round((funnel.step4_published / (funnel.step2_created_biz || 1)) * 100)}% no ar
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-500" />
              </div>

              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-[11px] font-bold text-slate-400">5. TRANSAÇÕES</span>
                <p className="mt-1 text-xl font-black text-slate-900">{funnel.step5_active_transactions}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {Math.round((funnel.step5_active_transactions / (funnel.step4_published || 1)) * 100)}% transacionaram
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

          {/* Recent Orders & Bookings Preview */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Orders */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="size-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Últimos Pedidos Registrados</h3>
                </div>
                <button
                  onClick={() => setActiveTab("flows")}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Ver todos
                </button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Nenhum pedido recente registrado.</p>
                ) : (
                  recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">Pedido #{o.order_number}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {o.customer_name} • <span className="font-medium text-slate-700">{o.business_name}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600">{formatCurrency(o.total)}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(o.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">Últimos Agendamentos</h3>
                </div>
                <button
                  onClick={() => setActiveTab("flows")}
                  className="text-xs font-semibold text-purple-600 hover:underline"
                >
                  Ver todos
                </button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {recentBookings.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Nenhum agendamento recente registrado.</p>
                ) : (
                  recentBookings.slice(0, 4).map((bk) => (
                    <div key={bk.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{bk.customer_name}</span>
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                            {bk.service_name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {bk.business_name} • Data: {bk.booking_date} às {bk.booking_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{formatCurrency(bk.price)}</span>
                        <span className="block text-[10px] font-semibold text-slate-400 capitalize">{bk.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERFIS CRIADOS (CONTAS & NEGÓCIOS) */}
      {activeTab === "profiles" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome do negócio, slug, e-mail do titular, cidade ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Categorias</option>
                <option value="alimentacao">Alimentação</option>
                <option value="beleza">Beleza</option>
                <option value="pet">Pet</option>
                <option value="barbearia">Barbearia</option>
                <option value="saude">Saúde</option>
                <option value="casa">Casa</option>
                <option value="automotivo">Automotivo</option>
                <option value="outros-servicos">Outros Serviços</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Planos</option>
                <option value="free">Plano Free</option>
                <option value="pro">Plano Pro</option>
                <option value="business">Plano Business</option>
              </select>
            </div>
          </div>

          {/* Profiles Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Negócio / Loja</th>
                    <th className="px-4 py-3.5">Titular / E-mail</th>
                    <th className="px-4 py-3.5">Local / Telefone</th>
                    <th className="px-4 py-3.5">Catálogo</th>
                    <th className="px-4 py-3.5">Vendas / Agendamentos</th>
                    <th className="px-4 py-3.5">Plano Atual</th>
                    <th className="px-4 py-3.5 text-right">Ações Mestre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredBusinesses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Nenhum perfil encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredBusinesses.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{b.name}</span>
                            {b.is_published ? (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                No Ar
                              </span>
                            ) : (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                Rascunho
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="capitalize">{b.category}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">/{b.slug}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{b.owner_name}</p>
                          <p className="text-[11px] text-slate-500">{b.owner_email}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Criado em: {formatDate(b.created_at)}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-slate-800">{b.city}</p>
                          {b.phone ? (
                            <a
                              href={`https://wa.me/55${b.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                            >
                              <Phone className="size-3" />
                              {b.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400">Sem telefone</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700">
                            <Package className="size-3" />
                            {b.services_count} itens
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">
                            {b.orders_count} pedidos {b.orders_total_value > 0 && `(${formatCurrency(b.orders_total_value)})`}
                          </p>
                          <p className="text-[11px] text-slate-500">{b.bookings_count} agendamentos</p>
                        </td>

                        <td className="px-4 py-3.5">
                          {b.plan === "business" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
                              <Crown className="size-3" /> Business
                            </span>
                          ) : b.plan === "pro" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                              <Zap className="size-3" /> Pro
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              Grátis
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/loja/${b.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir página pública da loja"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>

                            <button
                              onClick={() => void handleTogglePublish(b.id, b.is_published)}
                              disabled={actionLoading === b.id}
                              title={b.is_published ? "Mover para rascunho" : "Publicar loja"}
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                                b.is_published
                                  ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {b.is_published ? "Ocultar" : "Publicar"}
                            </button>

                            <select
                              value={b.plan}
                              disabled={actionLoading === b.id}
                              onChange={(e) =>
                                void handleUpdatePlan(
                                  b.id,
                                  e.target.value as "free" | "pro" | "business",
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 hover:border-slate-400 focus:outline-none"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="business">Business</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLANOS & MONETIZAÇÃO */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {/* Plan Cards Comparison */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 uppercase">
                  Plano Base
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {metrics.planCounts.free} contas ativas
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900">Grátis (Free)</h3>
              <p className="mt-1 text-xs text-slate-500">Entrada sem barreiras para novos negócios locais.</p>
              <p className="mt-4 text-3xl font-black text-slate-900">R$ 0,00</p>
              <ul className="mt-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" /> Até 10 itens no catálogo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" /> Agendamentos & Pedidos WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" /> 0% de taxa de comissão
                </li>
              </ul>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 uppercase">
                  Profissional
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {metrics.planCounts.pro} contas ativas
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900">ELLO Pro</h3>
              <p className="mt-1 text-xs text-slate-500">Gestão avançada, equipe e portfólio em vídeo.</p>
              <p className="mt-4 text-3xl font-black text-slate-900">
                R$ 39,90<span className="text-xs font-semibold text-slate-400">/mês</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-blue-600" /> Catálogo 100% Ilimitado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-blue-600" /> Gestão de Equipe & Profissionais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-blue-600" /> CRM completo de clientes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-blue-600" /> White Label (sem marca ELLO)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-blue-600" /> Até 20 vídeos estilo Reels
                </li>
              </ul>
            </div>

            {/* Business */}
            <div className="relative rounded-2xl border-2 border-amber-500 bg-slate-950 p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300 uppercase">
                  Escala Total
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {metrics.planCounts.business} contas ativas
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black text-white">ELLO Business</h3>
              <p className="mt-1 text-xs text-slate-400">Totem de autoatendimento, WhatsApp Bot e filiais.</p>
              <p className="mt-4 text-3xl font-black text-amber-400">
                R$ 79,90<span className="text-xs font-semibold text-slate-400">/mês</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-xs text-slate-300 border-t border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400" /> Todos os recursos do Pro
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400" /> Totem de Autoatendimento
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400" /> Automações WhatsApp com Evolution API
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400" /> Gestão de Entregas & Motoboys
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400" /> Multiunidade & Filiais
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Plan Granting Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Atribuição Imediata de Planos</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Como administrador mestre, você pode conceder ou revogar o plano Pro ou Business de qualquer lojista sem necessidade de passar pelo checkout do Asaas.
            </p>

            <div className="mt-4 divide-y divide-slate-100">
              {data.businesses.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{b.name}</span>
                    <span className="text-xs text-slate-500 ml-2">({b.owner_email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Plano:</span>
                    <select
                      value={b.plan}
                      disabled={actionLoading === b.id}
                      onChange={(e) =>
                        void handleUpdatePlan(
                          b.id,
                          e.target.value as "free" | "pro" | "business",
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-slate-400 focus:outline-none"
                    >
                      <option value="free">Grátis (Free)</option>
                      <option value="pro">Pro (R$ 39,90)</option>
                      <option value="business">Business (R$ 79,90)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ATIVIDADES EM TEMPO REAL & FLUXOS */}
      {activeTab === "flows" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Detailed Orders Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Histórico Completo de Pedidos</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{recentOrders.length} registros</span>
            </div>

            <div className="mt-4 space-y-3">
              {recentOrders.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Nenhum pedido registrado.</p>
              ) : (
                recentOrders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Pedido #{o.order_number}</span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {formatCurrency(o.total)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      <p>Cliente: <span className="font-semibold text-slate-800">{o.customer_name}</span></p>
                      <p>Loja: <span className="font-semibold text-slate-800">{o.business_name}</span></p>
                      <p>Modo: <span className="capitalize">{o.fulfillment}</span> • Status: <span className="font-semibold uppercase">{o.status}</span></p>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400">{formatDate(o.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detailed Bookings Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Histórico Completo de Agendamentos</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{recentBookings.length} registros</span>
            </div>

            <div className="mt-4 space-y-3">
              {recentBookings.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">Nenhum agendamento registrado.</p>
              ) : (
                recentBookings.map((bk) => (
                  <div key={bk.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{bk.customer_name}</span>
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        {formatCurrency(bk.price)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      <p>Serviço: <span className="font-semibold text-slate-800">{bk.service_name}</span></p>
                      <p>Estabelecimento: <span className="font-semibold text-slate-800">{bk.business_name}</span></p>
                      <p>Data: <span className="font-semibold">{bk.booking_date}</span> às {bk.booking_time}</p>
                    </div>
                    <span className="mt-2 inline-block rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                      {bk.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
