import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Store,
  Calendar,
  Percent,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  Building2,
  QrCode,
  DollarSign,
  TrendingUp,
  X,
  Copy,
  CheckCircle2,
  MessageCircle,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { ElloLogo } from "@/components/ello/logo";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  BR_PLAN_PRICES,
  formatMarketAmount,
  MARKETS,
  type MarketCountry,
} from "@/lib/market-pricing";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos & Preços | ELLO — Gestão e Vendas Sem Taxa de Comissão" },
      {
        name: "description",
        content:
          "Conheça os planos da ELLO para negócios de todos os segmentos. Catálogo digital, pedidos, agendamentos e painel Studio com taxa ZERO sobre suas vendas.",
      },
    ],
  }),
  component: PricingPlansPage,
});

// Funções utilitárias de validação e formatação de CPF/CNPJ e Telefone
function formatCpfCnpj(val: string): string {
  const clean = val.replace(/\D/g, "");
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }
  return clean
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    .slice(0, 18);
}

function formatPhone(val: string): string {
  const clean = val.replace(/\D/g, "");
  if (clean.length <= 10) {
    return clean
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2")
      .slice(0, 14);
  }
  return clean
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
    .slice(0, 15);
}

function isValidCpfCnpj(val: string): boolean {
  const clean = val.replace(/\D/g, "");
  if (clean.length === 11) {
    if (/^(\d)\1{10}$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9), 10)) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === parseInt(clean.charAt(10), 10);
  } else if (clean.length === 14) {
    if (/^(\d)\1{13}$/.test(clean)) return false;
    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) return false;
    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1), 10);
  }
  return false;
}

type AsaasPixResponseData = {
  paymentId: string;
  status: string;
  value: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pix: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
};

function PlanPriceDisplay({
  plan,
  billingCycle,
  market,
  dark = false,
}: {
  plan: "pro" | "business";
  billingCycle: "monthly" | "yearly";
  market: (typeof MARKETS)[number];
  dark?: boolean;
}) {
  const pricing = BR_PLAN_PRICES[plan];
  const current = billingCycle === "yearly" ? pricing.yearly : pricing.monthly;
  const regular = billingCycle === "yearly" ? pricing.regularYearly : pricing.regularMonthly;
  const text = dark ? "text-white" : "text-[#20221f]";
  const muted = dark ? "text-white/55" : "text-[#888b81]";
  const accent = dark ? "text-[#d0f25a]" : "text-[#687348]";
  const period = billingCycle === "yearly" ? "ano" : "mês";

  return (
    <div className={`mt-6 border-t ${dark ? "border-white/10" : "border-[#f0f0ea]"} pt-5`}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${accent}`}>
            Oferta de lançamento
          </p>
          <p className={`mt-2 flex items-baseline gap-1 whitespace-nowrap text-[11px] font-medium ${muted}`}>
            <span>De</span>
            <span className="font-semibold line-through">{formatMarketAmount(regular, market.currency, market.locale)}</span>
            <span>/{period}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-[38px] font-black leading-none tracking-tight sm:text-[42px] ${text}`}>
            {formatMarketAmount(current, market.currency, market.locale)}
          </p>
          <p className={`mt-1 text-xs font-medium ${muted}`}>/{period}</p>
        </div>
      </div>
      <p className={`mt-3 text-[11px] leading-relaxed ${muted}`}>
        {billingCycle === "yearly"
          ? `Economize ${formatMarketAmount(regular - current, market.currency, market.locale)} no ciclo anual.`
          : "Cancele quando quiser."}
      </p>
    </div>
  );
}

export function PricingPlansPage() {
  const { business, user, planSubscription, refresh } = useLocalHub();
  const navigate = useNavigate();

  // Período de faturamento da landing: Mensal ou Anual com preço de lançamento
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [marketCountry, setMarketCountry] = useState<MarketCountry>("BR");
  const [marketInitialized, setMarketInitialized] = useState(false);
  const marketTouchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setMarketInitialized(true);
    const savedCountry = window.localStorage.getItem("ello-market-country");
    if (savedCountry && MARKETS.some((market) => market.country === savedCountry)) {
      setMarketCountry(savedCountry as MarketCountry);
      setMarketInitialized(true);
      return;
    }
    void fetch("/api/market-suggestion", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((suggestion: { country?: string } | null) => {
        if (cancelled || marketTouchedRef.current) return;
        const suggested = MARKETS.find((market) => market.country === suggestion?.country);
        if (suggested) setMarketCountry(suggested.country);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setMarketInitialized(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMarket = MARKETS.find((market) => market.country === marketCountry) ?? MARKETS[0];
  const isBrazilMarket = selectedMarket.country === "BR";
  const changeMarket = (country: MarketCountry) => {
    marketTouchedRef.current = true;
    setMarketCountry(country);
    window.localStorage.setItem("ello-market-country", country);
    if (country !== "BR") setBillingCycle("monthly");
    if (country !== "BR" && checkoutModalPlan) setCheckoutModalPlan(null);
  };

  // Simulador de Economia vs Outras Plataformas
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(12000);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Estado do modal de assinatura
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<"pro" | "business" | null>(null);
  const [modalCycle, setModalCycle] = useState<"monthly" | "yearly">("monthly");
  const [modalStep, setModalStep] = useState<"form" | "payment" | "success">("form");

  // Dados do formulário de assinatura
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerCpfCnpj, setPayerCpfCnpj] = useState("");
  const [payerPostalCode, setPayerPostalCode] = useState("");
  const [payerAddressNumber, setPayerAddressNumber] = useState("");
  const [cancelingPlan, setCancelingPlan] = useState(false);
  const [formError, setFormError] = useState("");

  // Estado da cobrança
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<AsaasPixResponseData | null>(null);
  const [copiedPixPayload, setCopiedPixPayload] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Polling de pagamento com timer
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Preenche dados padrão se o usuário já tiver dados no LocalHub
  useEffect(() => {
    if (business) {
      if (!payerName) setPayerName(business.name || "");
      if (!payerPhone) setPayerPhone(formatPhone(business.phone || ""));
      if (!payerEmail && user?.email) setPayerEmail(user.email);
    }
  }, [business, user]);

  // Limpa o polling ao desmontar ou trocar de modal
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Cálculo da economia
  const traditionalFee = monthlyRevenue * 0.15;
  const elloProCost = isBrazilMarket ? BR_PLAN_PRICES.pro.monthly / 100 : 39.9;
  const monthlySavings = Math.max(0, traditionalFee - elloProCost);
  const yearlySavings = monthlySavings * 12;

  // Abertura do Modal de Assinatura
  const handleOpenCheckout = (plan: "pro" | "business") => {
    if (!isBrazilMarket || !selectedMarket.enabled) {
      toast.info("A assinatura ainda não está disponível neste mercado.");
      return;
    }
    if (!user) {
      toast.info("Entre ou crie sua conta para assinar um plano.");
      void navigate({ to: "/auth" });
      return;
    }
    setCheckoutModalPlan(plan);
    setModalCycle(billingCycle);
    setModalStep("form");
    setPaymentData(null);
    setFormError("");
    setCopiedPixPayload(false);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  // Preços calculados do plano
  const planName = checkoutModalPlan === "pro" ? "Plano Pro" : "Plano Business";
  const selectedPlanPricing = BR_PLAN_PRICES[checkoutModalPlan ?? "pro"];
  const planPriceMonthly = selectedPlanPricing.monthly / 100;
  const planPriceYearlyTotal = selectedPlanPricing.yearly / 100;
  const currentPrice = modalCycle === "yearly" ? planPriceYearlyTotal : planPriceMonthly;

  // Iniciar geração da cobrança da assinatura
  const handleGenerateAsaasPix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!payerName.trim() || payerName.trim().length < 3) {
      setFormError("Informe o nome completo do titular ou responsável.");
      return;
    }

    if (!payerEmail.trim() || !payerEmail.includes("@")) {
      setFormError("Informe um e-mail válido para envio da confirmação e nota fiscal.");
      return;
    }

    const cleanPhone = payerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFormError("Informe um WhatsApp com DDD válido (10 ou 11 dígitos).");
      return;
    }

    const cleanCpfCnpj = payerCpfCnpj.replace(/\D/g, "");
    if (!isValidCpfCnpj(cleanCpfCnpj)) {
      setFormError(
        "O CPF ou CNPJ informado é inválido. Digite um documento válido para geração do PIX pelo Banco Central.",
      );
      return;
    }

    setIsGeneratingPayment(true);

    try {
      const client = getSupabaseBrowserClient();
      const { data: sessionData } = (await client?.auth.getSession()) ?? {
        data: { session: null },
      };
      if (!sessionData.session?.access_token)
        throw new Error("Entre na sua conta para contratar um plano.");
      const res = await fetch("/api/asaas/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          planId: checkoutModalPlan,
          billingCycle: modalCycle,
          countryCode: marketCountry,
          customerName: payerName.trim(),
          customerEmail: payerEmail.trim(),
          customerPhone: cleanPhone,
          customerCpfCnpj: cleanCpfCnpj,
          customerPostalCode: payerPostalCode,
          customerAddressNumber: payerAddressNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível gerar a cobrança.");
      }

      setPaymentData(data);
      setModalStep("payment");
      toast.success("Cobrança por Pix gerada com sucesso!");

      // Inicia polling a cada 3 segundos para detectar quando o cliente pagar no banco
      startPaymentPolling(data.paymentId);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Não foi possível gerar a cobrança.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  // Polling de confirmação do pagamento
  const startPaymentPolling = (paymentId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams({
          paymentId,
          businessId: business?.id || "",
        });

        const client = getSupabaseBrowserClient();
        const { data: sessionData } = (await client?.auth.getSession()) ?? {
          data: { session: null },
        };
        if (!sessionData.session?.access_token) return;
        const res = await fetch(`/api/asaas/subscription-status?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        const result = await res.json();

        if (result.isPaid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          handlePaymentConfirmedSuccess();
        }
      } catch {
        // continua tentando silenciosamente
      }
    }, 3000);
  };

  // Checagem manual clicando no botão "Já paguei"
  const handleManualCheckPayment = async () => {
    if (!paymentData?.paymentId) return;
    setIsCheckingPayment(true);

    try {
      const queryParams = new URLSearchParams({
        paymentId: paymentData.paymentId,
        businessId: business?.id || "",
      });

      const client = getSupabaseBrowserClient();
      const { data: sessionData } = (await client?.auth.getSession()) ?? {
        data: { session: null },
      };
      if (!sessionData.session?.access_token)
        throw new Error("Sua sessão expirou. Entre novamente.");
      const res = await fetch(`/api/asaas/subscription-status?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      const result = await res.json();

      if (result.isPaid) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        handlePaymentConfirmedSuccess();
      } else {
        toast.info("O pagamento ainda está sendo confirmado. Aguarde alguns instantes.");
      }
    } catch {
      toast.error("Não foi possível consultar o pagamento no momento.");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Confirmação com sucesso
  const handlePaymentConfirmedSuccess = async () => {
    setModalStep("success");
    toast.success(`🎉 Pagamento confirmado! ${planName} ativado com sucesso!`);
    await refresh();
  };

  const handleCancelPlan = async () => {
    if (
      !window.confirm(
        "Deseja cancelar seu plano? A ELLO encerra a recorrência e remove cobranças pendentes. Seu negócio voltará ao plano grátis e só terá novas cobranças se você contratar novamente.",
      )
    )
      return;
    const client = getSupabaseBrowserClient();
    const { data: sessionData } = (await client?.auth.getSession()) ?? { data: { session: null } };
    if (!sessionData.session?.access_token) {
      toast.error("Entre novamente para cancelar o plano.");
      return;
    }
    setCancelingPlan(true);
    try {
      const response = await fetch("/api/asaas/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ confirmation: "CANCELAR" }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Não foi possível confirmar o cancelamento.");
      await refresh();
      toast.success("Plano cancelado. Nenhuma nova recorrência será iniciada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível confirmar o cancelamento.",
      );
    } finally {
      setCancelingPlan(false);
    }
  };

  // Copiar código Pix Copia e Cola
  const handleCopyPix = async () => {
    if (!paymentData?.pix?.payload) return;
    try {
      await navigator.clipboard.writeText(paymentData.pix.payload);
      setCopiedPixPayload(true);
      toast.success("Código PIX Copia e Cola copiado com sucesso!");
      setTimeout(() => setCopiedPixPayload(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  // Link do WhatsApp de suporte
  const getWhatsAppSubscriptionUrl = () => {
    const cycleLabel =
      modalCycle === "yearly" ? "Anual — oferta de lançamento" : "Mensal — oferta de lançamento";
    const bizLabel = business?.name || payerName || "meu negócio";
    const msg = `Olá equipe ELLO! 👋\n\nEstou assinando o *${planName}* (${cycleLabel} - ${formatMarketAmount(Math.round(currentPrice * 100), "BRL", "pt-BR")}) para o estabelecimento *${bizLabel}*.\n\nCódigo da cobrança: ${paymentData?.paymentId || "gerando..."}.\n\nPoderiam me auxiliar a confirmar a ativação?`;
    return `https://wa.me/5511987654321?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="ello-site min-h-screen bg-[#fcfcf9] text-[#20221f] selection:bg-[#d0f25a] selection:text-[#20221f]">
      {/* ==============================================================
          1. HEADER COM IDENTIDADE VISUAL OFICIAL ELLO
         ============================================================== */}
      <header className="ello-nav sticky top-0 z-40 w-full px-5 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between py-3">
          <Link to="/" aria-label="ELLO, início" className="ello-wordmark flex items-center">
            <ElloLogo tone="white" height={26} />
          </Link>

          <nav className="hidden items-center gap-9 text-[13px] font-medium text-white/75 md:flex">
            <Link to="/" className="ello-nav-link hover:text-white transition">
              Início
            </Link>
            <a href="/#segmentos" className="ello-nav-link hover:text-white transition">
              Tipos de Negócio
            </a>
            <a href="/#solucao" className="ello-nav-link hover:text-white transition">
              A Plataforma
            </a>
            <Link to="/planos" className="text-white font-semibold flex items-center gap-1.5">
              <span>Planos & Preços</span>
              <span className="size-1.5 rounded-full bg-[#d0f25a]" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={business ? "/studio" : "/auth"}
              className="hidden px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white sm:inline-flex"
            >
              {business ? "Acessar painel" : "Já tenho conta"}
            </Link>
            <button
              type="button"
              onClick={() => handleOpenCheckout("pro")}
              className="ello-cta ello-cta-lime min-h-10 cursor-pointer"
            >
              <span>{business ? "Fazer Upgrade Pro" : "Assinar Plano Pro"}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ==============================================================
            2. HERO SECTION DOS PLANOS
           ============================================================== */}
        <section className="relative mx-auto max-w-[1440px] px-5 pt-16 pb-12 sm:px-10 sm:pt-24 sm:pb-16 lg:px-16 text-center">
          <div className="mx-auto max-w-[780px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dce4ca] bg-[#f1f4e9] px-4 py-1.5 text-[12px] font-semibold tracking-wide text-[#66794a] shadow-xs">
              <Sparkles size={14} className="text-[#849a58]" />
              <span>
                {isBrazilMarket
                  ? "Condição especial de lançamento · 0% de comissão"
                  : "Disponibilidade por país · 0% de comissão"}
              </span>
            </div>

            <h1 className="mt-6 font-display text-[38px] font-medium leading-[1.05] tracking-[-.05em] sm:text-[56px] lg:text-[64px] text-[#20221f]">
              Planos para o momento certo de crescer seu negócio.
            </h1>

            <p className="mt-5 text-[16px] leading-[1.7] text-[#6a6c65] sm:text-[19px] max-w-[620px] mx-auto">
              {isBrazilMarket
                ? "Aproveite os preços especiais de lançamento. "
                : "Confira a disponibilidade da ELLO no seu mercado. "}
              A ELLO atende negócios de todos os segmentos, com ferramentas para apresentar produtos
              e serviços, receber pedidos e organizar agendamentos.
            </p>

            <div className="mx-auto mt-7 flex max-w-sm flex-col items-start gap-2 text-left">
              <label htmlFor="ello-market-country" className="text-xs font-semibold text-[#6a6c65]">
                País ou região
              </label>
              <select
                id="ello-market-country"
                value={marketCountry}
                onChange={(event) => changeMarket(event.target.value as MarketCountry)}
                className="w-full rounded-xl border border-[#e3e3dc] bg-white px-4 py-3 text-sm text-[#20221f] shadow-sm"
              >
                {MARKETS.map((market) => (
                  <option key={market.country} value={market.country}>
                    {market.name}
                    {market.enabled ? "" : " — em preparação"}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed text-[#77796f]">
                {isBrazilMarket
                  ? "Preços em reais e cobrança por Pix disponíveis no Brasil."
                  : `Preços em ${selectedMarket.currency} serão definidos para ${selectedMarket.name}. Não fazemos conversão automática de preços.`}
              </p>
            </div>

            {/* TOGGLE MENSAL / ANUAL */}
            <fieldset
              disabled={!isBrazilMarket || !marketInitialized}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#e3e3dc] bg-white p-1.5 shadow-sm disabled:opacity-50"
            >
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-2 text-[13px] font-semibold transition cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-[#20221f] text-white shadow-sm"
                    : "text-[#6d7067] hover:text-[#20221f]"
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-[#20221f] text-white shadow-sm"
                    : "text-[#6d7067] hover:text-[#20221f]"
                }`}
              >
                <span>Anual</span>
                <span className="rounded-full bg-[#d0f25a] px-2 py-0.5 text-[10px] font-black tracking-wide text-[#20221f]">
                  LANÇAMENTO
                </span>
              </button>
            </fieldset>
            {isBrazilMarket &&
              (planSubscription.status === "active" || planSubscription.status === "pending") && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
                  <span className="font-semibold text-[#687348]">
                    {planSubscription.status === "pending"
                      ? `Ativação pendente: ${planSubscription.pending_plan === "business" ? "Business" : "Pro"}`
                      : `Plano ativo: ${planSubscription.plan === "business" ? "Business" : "Pro"} · ${planSubscription.billing_cycle === "yearly" ? "Anual" : "Mensal"}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCancelPlan()}
                    disabled={cancelingPlan}
                    className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelingPlan ? "Cancelando…" : "Cancelar plano e cobranças"}
                  </button>
                </div>
              )}
            {isBrazilMarket && planSubscription.status === "pending" && (
              <p className="mt-4 text-sm font-medium text-amber-700">
                Confirmação de pagamento pendente. O novo plano só será liberado após a confirmação.
              </p>
            )}
          </div>
        </section>

        {/* ==============================================================
            3. CARDS DOS 3 PLANOS
           ============================================================== */}
        <section className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-10 lg:px-16">
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {/* PLANO 1: COMEÇAR (GRÁTIS) */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#e5e5dc] bg-white p-7 shadow-xs transition hover:border-[#cfcfc4] sm:p-9">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#797c72]">
                    Individual
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                    Sem cartão
                  </span>
                </div>

                <h3 className="mt-3 font-display text-[26px] font-semibold text-[#20221f]">
                  Começar Grátis
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-[#72756d]">
                  Para profissionais autônomos e pequenos negócios que querem apresentar produtos ou
                  serviços e começar a vender ou receber agendamentos online.
                </p>

                <div className="mt-6 flex items-baseline gap-1.5 border-t border-[#f0f0ea] pt-6">
                  <span className="font-display text-[42px] font-black tracking-tight text-[#20221f]">
                    Grátis
                  </span>
                  <span className="text-[13px] font-medium text-[#888b81]">/ para sempre</span>
                </div>

                {/* Vantagens */}
                <div className="mt-6 space-y-3 border-t border-[#f0f0ea] pt-6 text-[13px] text-[#4f514a]">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>
                      <strong>1 usuário</strong> (o próprio gestor/dono)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Até 10 produtos ou serviços no catálogo</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Agenda e consulta de horários grátis em todos os nichos</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Até 50 novos clientes por mês; clientes existentes continuam atendidos</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Link próprio exclusivo: ello.app.br/loja/seunome</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Compartilhamento rápido no WhatsApp</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#f0f0ea] pt-6">
                <Link
                  to={business ? "/studio" : "/onboarding"}
                  className="ello-cta ello-cta-quiet w-full justify-center text-center font-semibold text-[14px]"
                >
                  {business ? "Meu espaço atual (Grátis)" : "Criar conta grátis"}
                </Link>
                <p className="mt-2 text-center text-[11px] text-[#9a9c92]">
                  Sem necessidade de cartão de crédito
                </p>
              </div>
            </div>

            {/* PLANO 2: PRO (O MAIS POPULAR / DESTAQUE) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#20221f] bg-[#20221f] p-7 text-white shadow-xl sm:p-9">
              {/* Badge Flutuante no Topo */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#d0f25a] px-4 py-1 text-[11px] font-black uppercase tracking-wider text-[#20221f] shadow-md">
                Oferta especial de lançamento
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#d0f25a]">
                    Equipes & Negócios
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/90">
                    0% de comissão ELLO
                  </span>
                </div>

                <h3 className="mt-3 font-display text-[26px] font-semibold text-white">
                  Plano Pro
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                  Para equipes e negócios de qualquer segmento que precisam organizar a operação e
                  crescer sem pagar comissão sobre as vendas.
                </p>

                {isBrazilMarket && marketInitialized ? (
                  <PlanPriceDisplay
                    plan="pro"
                    billingCycle={billingCycle}
                    market={selectedMarket}
                    dark
                  />
                ) : (
                  <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                    {isBrazilMarket ? "Carregando preços locais…" : `Preços locais em preparação para ${selectedMarket.name}.`}
                  </div>
                )}

                {/* Vantagens do Pro */}
                <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-[13px] text-white/90">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span><strong>Tudo do Plano Grátis incluído</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>Produtos e serviços ilimitados no catálogo</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>Até 500 novos clientes por mês, com agenda e horários disponíveis</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>
                      <strong>Gestão de equipe com subcontas</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>
                      <strong>Link Exclusivo de Auto-Cadastro</strong> por WhatsApp para cada
                      profissional
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>Agenda individual por profissional com seleção pelo cliente</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>
                      Remoção do selo da ELLO na loja pública
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>CRM de Clientes com histórico de visitas e ticket médio</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>Relatórios completos de faturamento e comissões da equipe</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>Até 20 vídeos no portfólio</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout("pro")}
                  disabled={!isBrazilMarket || !marketInitialized}
                  className="ello-cta ello-cta-lime w-full justify-center text-center font-bold text-[14px] shadow-lg hover:scale-[1.02] transition cursor-pointer"
                >
                  <span>{isBrazilMarket ? "Assinar Plano Pro" : "Disponível em breve"}</span>
                  {isBrazilMarket && <ArrowRight size={16} />}
                </button>
                <p className="mt-2 text-center text-[11px] text-white/50">
                  Ativação após a confirmação do pagamento
                </p>
              </div>
            </div>

            {/* PLANO 3: BUSINESS (MULTIUNIDADE & ALTA ESCALA) */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#e5e5dc] bg-white p-7 shadow-xs transition hover:border-[#cfcfc4] sm:p-9">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#797c72]">
                    Escala & Franquias
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-700">
                    Business
                  </span>
                </div>

                <h3 className="mt-3 font-display text-[26px] font-semibold text-[#20221f]">
                  Business
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-[#72756d]">
                  Para operações que precisam de totens de atendimento e automações integradas
                  de WhatsApp.
                </p>

                {isBrazilMarket && marketInitialized ? (
                  <PlanPriceDisplay
                    plan="business"
                    billingCycle={billingCycle}
                    market={selectedMarket}
                  />
                ) : (
                  <div className="mt-6 rounded-xl border border-[#e7e8df] bg-[#f8f9f5] px-4 py-5 text-sm text-[#72756d]">
                    {isBrazilMarket ? "Carregando preços locais…" : `Preços locais em preparação para ${selectedMarket.name}.`}
                  </div>
                )}

                {/* Vantagens Business */}
                <div className="mt-6 space-y-3 border-t border-[#f0f0ea] pt-6 text-[13px] text-[#4f514a]">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Clientes novos ilimitados, além da agenda e horários grátis</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>
                      <strong>Tudo do Plano Grátis e do Plano Pro incluído</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Catálogo ilimitado de produtos e serviços para a operação</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Vídeos ilimitados no portfólio</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>
                      <strong>Gestão de múltiplas filiais</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Totem de autoatendimento para restaurantes e negócios de alimentação</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Automação WhatsApp após provisionar uma instância exclusiva do negócio</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Gestão de motoboys, custo por entrega e simulador de taxa por quilômetro (alimentação)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Canal de atendimento pelo WhatsApp da ELLO</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#f0f0ea] pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout("business")}
                  disabled={!isBrazilMarket || !marketInitialized}
                  className="ello-cta ello-cta-dark w-full justify-center text-center font-semibold text-[14px] cursor-pointer"
                >
                  {isBrazilMarket ? "Contratar Business" : "Disponível em breve"}
                </button>
                <p className="mt-2 text-center text-[11px] text-[#9a9c92]">
                  Perfeito para operações em expansão
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            4. SIMULADOR DE ECONOMIA ESTIMADA
           ============================================================== */}
        {isBrazilMarket && marketInitialized && (
          <section className="border-y border-[#e6e5dd] bg-[#f5f5f0] px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
            <div className="mx-auto max-w-[1080px]">
              <div className="text-center">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#687348]">
                  Simulador de economia estimada
                </span>
                <h2 className="mt-2 font-display text-[32px] font-medium tracking-tight text-[#20221f] sm:text-[44px]">
                  Compare seus custos com a ELLO
                </h2>
                <p className="mt-3 text-[15px] text-[#72756d] max-w-xl mx-auto">
                  Arraste a barra abaixo com a média do faturamento mensal do seu negócio e veja o
                  impacto no seu bolso.
                </p>
              </div>

              <div className="mt-12 rounded-3xl border border-[#e5e5dc] bg-white p-6 sm:p-10 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#50524b]">
                      Faturamento mensal estimado:
                    </span>
                    <span className="font-display text-2xl font-black text-[#20221f]">
                      {formatMarketAmount(
                        monthlyRevenue * 100,
                        selectedMarket.currency,
                        selectedMarket.locale,
                      )}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="2000"
                    max="60000"
                    step="1000"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#20221f]"
                  />
                  <div className="flex justify-between text-[11px] text-[#999c92] font-medium">
                    <span>
                      {formatMarketAmount(200000, selectedMarket.currency, selectedMarket.locale)}
                      /mês
                    </span>
                    <span>
                      {formatMarketAmount(3000000, selectedMarket.currency, selectedMarket.locale)}
                      /mês
                    </span>
                    <span>
                      {formatMarketAmount(6000000, selectedMarket.currency, selectedMarket.locale)}
                      /mês
                    </span>
                  </div>
                </div>

                {/* Grid Comparativo de Perda vs Ganho */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                    <div className="flex items-center gap-2 text-red-600 text-[12px] font-bold uppercase tracking-wider">
                      <span>Exemplo de comissão de 15%</span>
                    </div>
                    <div className="mt-2 font-display text-[28px] sm:text-[34px] font-black text-red-700">
                      -{" "}
                      {formatMarketAmount(
                        Math.round(traditionalFee * 100),
                        selectedMarket.currency,
                        selectedMarket.locale,
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-red-600/80">
                      Simulação ilustrativa sobre o faturamento informado; as taxas variam por
                      plataforma e segmento.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#d6e5b8] bg-[#f2f7e8] p-5">
                    <div className="flex items-center gap-2 text-[#5e703f] text-[12px] font-bold uppercase tracking-wider">
                      <span>Economia com ELLO Pro</span>
                    </div>
                    <div className="mt-2 font-display text-[28px] sm:text-[34px] font-black text-[#20221f]">
                      +{" "}
                      {formatMarketAmount(
                        Math.round(monthlySavings * 100),
                        selectedMarket.currency,
                        selectedMarket.locale,
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-[#637248]">
                      Diferença estimada entre a comissão ilustrativa e a assinatura Pro mensal. (
                      <strong>
                        {formatMarketAmount(
                          Math.round(yearlySavings * 100),
                          selectedMarket.currency,
                          selectedMarket.locale,
                        )}
                        /ano
                      </strong>
                      )
                    </p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout("pro")}
                    className="ello-cta ello-cta-lime inline-flex cursor-pointer"
                  >
                    Garantir minha economia com Plano Pro
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==============================================================
            5. TABELA COMPARATIVA DETALHADA
           ============================================================== */}
        <section className="mx-auto max-w-[1280px] px-5 py-20 sm:px-10 lg:px-16">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#687348]">
              Comparativo de Recursos
            </span>
            <h2 className="mt-2 font-display text-[30px] font-medium tracking-tight sm:text-[40px] text-[#20221f]">
              Tudo o que está incluído em cada plano
            </h2>
          </div>

          <div className="mt-12 overflow-x-auto rounded-3xl border border-[#e4e4db] bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-[13px] sm:text-[14px]">
              <thead>
                <tr className="border-b border-[#e4e4db] bg-[#fafaf7]">
                  <th className="p-4 sm:p-5 font-bold text-[#6d7067] w-1/2">Funcionalidade</th>
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] w-1/6">
                    Começar Grátis
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] bg-[#f4f7eb] w-1/6">
                    Plano Pro
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] w-1/6">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efefe9] text-[#4f514a]">
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Novos clientes por mês</td>
                  <td className="p-4 sm:p-5 text-center font-bold">Até 50</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-[#fbfdf7]">Até 500</td>
                  <td className="p-4 sm:p-5 text-center font-bold">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Agenda e consulta de horários</td>
                  <td className="p-4 sm:p-5 text-center font-bold">✓ Grátis</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-[#fbfdf7]">✓ Grátis</td>
                  <td className="p-4 sm:p-5 text-center font-bold">✓ Grátis</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Comissão da ELLO sobre vendas</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-700">0%</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-700 bg-[#fbfdf7]">
                    0%
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-700">0%</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Subcontas ilimitadas para equipe</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">
                    ✓ Incluídas
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluídas</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">
                    Link de auto-cadastro por WhatsApp para colaboradores
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">
                    ✓ Sim
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Sim</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">
                    Catálogo de produtos e serviços com fotos
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">Até 10 itens</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">
                    ✓ Ilimitado
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Remoção do selo ELLO na loja pública</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">
                    ✓ Sim
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Sim</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Vídeos e Reels no portfólio</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">Até 20</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">Ilimitado</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">CRM e histórico de clientes</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Painel operacional do negócio</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">
                    ✓ Incluso
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Comandas de pedidos (alimentação) em formato compatível com impressora térmica 80 mm</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">
                    ✓ Incluso
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">
                    Gestão de múltiplas filiais
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300 bg-[#fbfdf7]">—</td>
                  <td className="p-4 sm:p-5 text-center text-amber-700 font-bold">Em preparação</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">
                    Totem para restaurantes e negócios de alimentação
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300 bg-[#fbfdf7]">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Automação WhatsApp</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300 bg-[#fbfdf7]">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">Após provisionamento</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Gestão de motoboys e custo por entrega (alimentação)</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300 bg-[#fbfdf7]">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Canal de atendimento</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Padrão</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-[#556934] bg-[#fbfdf7]">
                    WhatsApp da ELLO
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-700">
                    WhatsApp da ELLO
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-5xl text-xs leading-relaxed text-[#72756d]">
            A ELLO não cobra comissão sobre as vendas. Pagamentos online por Pix ou cartão nas lojas
            estão desativados nesta fase; tarifas de provedores financeiros podem existir quando esse
            recurso for liberado.
          </p>
        </section>

        {/* ==============================================================
            6. PERGUNTAS FREQUENTES (FAQ)
           ============================================================== */}
        <section className="bg-[#f5f5f0] border-t border-[#e6e5dd] px-5 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[840px]">
            <div className="text-center">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#687348]">
                Dúvidas Comuns
              </span>
              <h2 className="mt-2 font-display text-[30px] font-medium tracking-tight sm:text-[40px] text-[#20221f]">
                Perguntas Frequentes sobre os Planos
              </h2>
            </div>

            <div className="mt-12 space-y-3">
              {[
                {
                  q: "A ELLO realmente não cobra comissão sobre meus pedidos ou agendamentos?",
                  a: "A ELLO não cobra comissão sobre as vendas. Quando pagamentos online estiverem habilitados, o provedor financeiro poderá cobrar as tarifas dele; elas são informadas antes da ativação.",
                },
                {
                  q: "Como funciona a assinatura e o cancelamento?",
                  a: "Nenhuma fidelidade. Você pode assinar, usar e cancelar a qualquer momento direto pelo painel de controle, sem precisar falar com atendente nem pagar nenhuma taxa extra.",
                },
                {
                  q: "Como funciona o envio de links para os profissionais da minha equipe?",
                  a: "No Plano Pro, você acessa a aba de Equipe, clica em 'Gerar Link' e digita o nome do colaborador. O sistema gera um link exclusivo que você envia no WhatsApp dele. Ao clicar no celular, ele mesmo envia a foto de perfil, WhatsApp e marca quais serviços realiza.",
                },
                {
                  q: "Quais são as formas de pagamento disponíveis para assinar?",
                  a: "A assinatura é paga por Pix. Os planos mensal e anual estão com preços especiais de lançamento; o valor total do ciclo anual aparece antes da confirmação.",
                },
                {
                  q: "Posso começar no plano grátis e mudar para o Pro depois?",
                a: "Com certeza! Você pode começar no plano gratuito para conhecer a plataforma e, quando quiser adicionar colaboradores, usar CRM ou remover a marca da ELLO, basta fazer o upgrade para o Pro.",
                },
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#e5e5dc] bg-white transition overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between p-5 text-left font-semibold text-[#20221f] text-sm sm:text-base cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${
                          isOpen ? "rotate-180 text-[#20221f]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#72756d] leading-relaxed border-t border-[#f2f2ec]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================
            7. CTA FINAL DE ALTO IMPACTO
           ============================================================== */}
        {isBrazilMarket && (
          <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 lg:px-16">
            <div className="rounded-3xl border border-[#e4e7db] bg-gradient-to-r from-[#20221f] to-[#2d3027] px-6 py-12 sm:px-12 sm:py-16 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d0f25a]">
                  Comece agora mesmo
                </span>
                <h3 className="mt-2 font-display text-[28px] font-medium tracking-tight sm:text-[38px] leading-tight">
                  Pronto para transformar a gestão do seu negócio?
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Leva menos de 3 minutos para criar sua vitrine de produtos ou serviços, agenda e
                  perfil profissional.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout("pro")}
                  disabled={!isBrazilMarket || !marketInitialized}
                  className="ello-cta ello-cta-lime cursor-pointer"
                >
                  {isBrazilMarket ? "Assinar Plano Pro" : "Disponível em breve"}
                  {isBrazilMarket && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ==============================================================
          8. FOOTER OFICIAL ELLO
         ============================================================== */}
      <footer className="ello-footer mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-5 py-7 text-[11px] text-[#85877e] sm:flex-row sm:px-10 lg:px-16 border-t border-[#e6e5dd]">
        <Link to="/" className="flex items-center font-semibold text-[#242620]">
          <ElloLogo tone="dark" height={22} />
        </Link>
        <span>
          Plataforma completa para estabelecimentos e negócios locais. Taxa Zero sobre vendas.
        </span>
        <span>© {new Date().getFullYear()} ELLO</span>
      </footer>

      {/* ==============================================================
          9. MODAL DE CHECKOUT (PIX)
         ============================================================== */}
      {checkoutModalPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscription-checkout-title"
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-contain bg-black/80 p-2 backdrop-blur-md sm:p-4"
        >
          <div className="relative flex max-h-[calc(100vh-1rem)] supports-[height:100dvh]:max-h-[calc(100dvh-1rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#181a15] text-[#f7f6ef] shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
            {/* Botão de Fechar */}
            <div className="flex shrink-0 justify-end border-b border-white/10 bg-[#181a15] px-3 py-2 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setCheckoutModalPlan(null);
                  if (pollingRef.current) clearInterval(pollingRef.current);
                }}
                className="grid size-10 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d0f25a] cursor-pointer"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
            {/* ETAPA 1: SUCESSO DE PAGAMENTO */}
            {modalStep === "success" && (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#d0f25a] text-[#181a15] shadow-lg shadow-[#d0f25a]/20 animate-bounce">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-[#d0f25a]/20 text-[#d0f25a] px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                    Pagamento confirmado
                  </span>
                  <h3 id="subscription-checkout-title" className="font-display text-2xl font-bold text-white">
                    Parabéns! O {planName} está 100% ativo!
                  </h3>
                  <p className="mt-2 text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                    A sua assinatura foi confirmada. Os recursos do plano já foram liberados para{" "}
                    <strong className="text-white">
                      {business?.name || payerName || "seu negócio"}
                    </strong>
                    .
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutModalPlan(null);
                      void navigate({ to: "/studio" });
                    }}
                    className="ello-cta ello-cta-lime w-full justify-center text-center font-bold text-sm cursor-pointer shadow-lg"
                  >
                    <span>Abrir Painel Studio Agora 🚀</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalPlan(null)}
                    className="text-xs text-white/50 hover:text-white transition py-2"
                  >
                    Fechar e continuar no site
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: TELA DA COBRANÇA PIX */}
            {modalStep === "payment" && paymentData && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#d0f25a]/15 text-[#d0f25a] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider">
                    <Zap size={13} />
                    <span>{planName}</span>
                    <span>·</span>
                    <span>
                      {modalCycle === "yearly" ? "Anual — lançamento" : "Mensal — lançamento"}
                    </span>
                  </div>
                  <h3 id="subscription-checkout-title" className="mt-2 font-display text-2xl font-bold text-white">
                    Pague com PIX para Ativar
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Cobrança segura. A confirmação acontece após o pagamento pelo Pix.
                  </p>
                </div>

                {/* Card com o QR Code Pix */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-4">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-white/10">
                    <span className="text-white/60">Valor da Assinatura:</span>
                    <span className="font-display font-black text-base text-[#d0f25a]">
                      {formatMarketAmount(Math.round(paymentData.value * 100), "BRL", "pt-BR")}
                    </span>
                  </div>

                  {/* QR Code Oficial em Base64 */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl inline-block border-4 border-white">
                      <img
                        src={`data:image/png;base64,${paymentData.pix.encodedImage}`}
                        alt="QR Code para pagamento por Pix"
                        className="size-48 sm:size-52 rounded-lg object-contain"
                      />
                    </div>
                  </div>

                  {/* Status Pulsante em Tempo Real */}
                  <div className="flex items-center justify-center gap-2 text-xs text-[#d0f25a] font-semibold bg-[#d0f25a]/10 py-2 px-3 rounded-xl border border-[#d0f25a]/20">
                    <span className="size-2 rounded-full bg-[#d0f25a] animate-ping" />
                    <span>Aguardando pagamento no app do seu banco...</span>
                  </div>

                  {/* Botão Copiar Chave Pix */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void handleCopyPix()}
                      className="ello-cta ello-cta-lime w-full justify-center text-center font-bold text-sm cursor-pointer shadow-lg py-3"
                    >
                      {copiedPixPayload ? (
                        <>
                          <Check size={16} />
                          <span>Código PIX Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copiar Código PIX (Copia e Cola)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-white/40">
                      Abra o app do seu banco, escolha <strong>Pix Copia e Cola</strong> e cole o
                      código.
                    </p>
                  </div>
                </div>

                {/* Ações Auxiliares: Verificar Status / Fatura Externa */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isCheckingPayment}
                    onClick={() => void handleManualCheckPayment()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 px-3 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={isCheckingPayment ? "animate-spin" : ""} />
                    <span>
                      {isCheckingPayment
                        ? "Verificando pagamento..."
                        : "Já paguei, verificar agora"}
                    </span>
                  </button>

                  {paymentData.invoiceUrl && (
                    <a
                      href={paymentData.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white py-1 transition"
                    >
                      <span>Abrir detalhes da cobrança</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ETAPA 0: FORMULÁRIO DE DADOS PARA EMISSÃO DO PIX */}
            {modalStep === "form" && (
              <form onSubmit={(e) => void handleGenerateAsaasPix(e)} className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#d0f25a]/15 text-[#d0f25a] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider">
                    <Zap size={13} />
                    <span>{planName}</span>
                  </div>
                  <h3 id="subscription-checkout-title" className="mt-2 font-display text-2xl font-bold text-white">
                    Assinar {planName}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Preencha os dados do pagador para gerar a cobrança por Pix.
                  </p>
                </div>

                {/* SELETOR DE CICLO NO MODAL */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/70 pb-2">
                    <span>Ciclo de Faturamento</span>
                    {modalCycle === "yearly" && (
                      <span className="text-[#d0f25a] font-bold">
                        Preço anual especial de lançamento
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalCycle("monthly")}
                      className={`rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex flex-col items-center ${
                        modalCycle === "monthly"
                          ? "bg-white text-[#181a15] shadow-sm"
                          : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span>Mensal</span>
                      <span className="text-[11px] opacity-80 font-normal">
                        {formatMarketAmount(selectedPlanPricing.monthly, "BRL", "pt-BR")}/mês
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCycle("yearly")}
                      className={`rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex flex-col items-center ${
                        modalCycle === "yearly"
                          ? "bg-[#d0f25a] text-[#181a15] shadow-sm"
                          : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span>Anual — lançamento</span>
                      <span className="text-[11px] opacity-80 font-normal">
                        <span className="line-through">
                          {formatMarketAmount(selectedPlanPricing.regularYearly, "BRL", "pt-BR")}
                        </span>{" "}
                        {formatMarketAmount(selectedPlanPricing.yearly, "BRL", "pt-BR")}/ano
                      </span>
                    </button>
                  </div>
                </div>

                {/* RESUMO DO VALOR */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 flex items-center justify-between">
                  <span className="text-xs text-white/70">Total a pagar agora via PIX:</span>
                  <div className="text-right">
                    <div className="font-display font-black text-xl text-[#d0f25a]">
                      {formatMarketAmount(Math.round(currentPrice * 100), "BRL", "pt-BR")}
                    </div>
                    {modalCycle === "yearly" && (
                      <div className="text-[10px] text-white/40">
                        <span className="line-through">
                          De {formatMarketAmount(selectedPlanPricing.regularYearly, "BRL", "pt-BR")}
                        </span>
                        {" · "}Economize{" "}
                        {formatMarketAmount(
                          selectedPlanPricing.regularYearly - selectedPlanPricing.yearly,
                          "BRL",
                          "pt-BR",
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* FORMULÁRIO DE DADOS */}
                <div className="space-y-3.5">
                  {formError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Nome Completo do Titular / Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva Santos"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d0f25a] focus:outline-hidden transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-white/80 block mb-1">
                        CPF ou CNPJ *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={payerCpfCnpj}
                        onChange={(e) => setPayerCpfCnpj(formatCpfCnpj(e.target.value))}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d0f25a] focus:outline-hidden transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-white/80 block mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="(11) 98765-4321"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(formatPhone(e.target.value))}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d0f25a] focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      E-mail para Recibo e Acesso *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d0f25a] focus:outline-hidden transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-white/80">
                        CEP do titular *
                      </label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="00000-000"
                        value={payerPostalCode}
                        onChange={(event) =>
                          setPayerPostalCode(event.target.value.replace(/\D/g, "").slice(0, 8))
                        }
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d0f25a] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-white/80">
                        Número do endereço *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        placeholder="123"
                        value={payerAddressNumber}
                        onChange={(event) => setPayerAddressNumber(event.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d0f25a] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* BOTÃO PRINCIPAL DE GERAR PIX REAL NO ASAAS */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isGeneratingPayment}
                    className="ello-cta ello-cta-lime w-full justify-center text-center font-bold text-sm shadow-xl hover:scale-[1.01] transition cursor-pointer disabled:opacity-50 py-3"
                  >
                    {isGeneratingPayment ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Gerando cobrança por Pix...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Gerar cobrança por Pix</span>
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </button>

                  <a
                    href={getWhatsAppSubscriptionUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 px-4 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <MessageCircle size={15} />
                    <span>Dúvidas? Falar com consultor no WhatsApp</span>
                  </a>

                  <p className="text-center text-[10px] text-white/40 pt-1 flex items-center justify-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    <span>
                      Ambiente seguro protegido por criptografia e regulado pelo Banco Central
                    </span>
                  </p>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
