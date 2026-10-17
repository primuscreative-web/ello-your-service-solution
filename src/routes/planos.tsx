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

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos & Preços | ELLO — Gestão e Vendas Sem Taxa de Comissão" },
      {
        name: "description",
        content:
          "Conheça os planos da ELLO para seu negócio local. Catálogo digital, cardápio QR Code, agendamento online e painel Studio com taxa ZERO sobre suas vendas.",
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

export function PricingPlansPage() {
  const { business, user, saveBusiness } = useLocalHub();
  const navigate = useNavigate();

  // Período de faturamento da landing: Mensal ou Anual (25% off)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Simulador de Economia vs Outras Plataformas
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(12000);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Estado do Modal de Checkout Real Asaas
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<"pro" | "business" | null>(null);
  const [modalCycle, setModalCycle] = useState<"monthly" | "yearly">("monthly");
  const [modalStep, setModalStep] = useState<"form" | "payment" | "success">("form");

  // Dados do formulário para emissão no Asaas
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerCpfCnpj, setPayerCpfCnpj] = useState("");
  const [formError, setFormError] = useState("");

  // Estado da Cobrança Asaas
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
  const traditionalFee = monthlyRevenue * 0.15; // 15% média iFood/Trinks/AppBarber
  const elloProCost = billingCycle === "yearly" ? 29.9 : 39.9;
  const monthlySavings = Math.max(0, traditionalFee - elloProCost);
  const yearlySavings = monthlySavings * 12;

  // Abertura do Modal de Assinatura
  const handleOpenCheckout = (plan: "pro" | "business") => {
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
  const planPriceMonthly = checkoutModalPlan === "pro" ? 39.9 : 79.9;
  const planPriceYearlyMonthly = checkoutModalPlan === "pro" ? 29.9 : 59.9;
  const planPriceYearlyTotal = checkoutModalPlan === "pro" ? 358.8 : 718.8;

  const currentPrice = modalCycle === "yearly" ? planPriceYearlyTotal : planPriceMonthly;
  const currentPriceStr = currentPrice.toFixed(2).replace(".", ",");

  // Iniciar geração da cobrança real no Asaas
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
      setFormError("O CPF ou CNPJ informado é inválido. Digite um documento válido para geração do PIX pelo Banco Central.");
      return;
    }

    setIsGeneratingPayment(true);

    try {
      const res = await fetch("/api/asaas/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: checkoutModalPlan,
          billingCycle: modalCycle,
          customerName: payerName.trim(),
          customerEmail: payerEmail.trim(),
          customerPhone: cleanPhone,
          customerCpfCnpj: cleanCpfCnpj,
          businessName: business?.name || payerName.trim(),
          businessId: business?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao conectar com a API do Asaas.");
      }

      setPaymentData(data);
      setModalStep("payment");
      toast.success("Cobrança PIX gerada com sucesso diretamente no Asaas!");

      // Inicia polling a cada 3 segundos para detectar quando o cliente pagar no banco
      startPaymentPolling(data.paymentId);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Erro ao gerar cobrança no Asaas.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  // Polling automático no Asaas
  const startPaymentPolling = (paymentId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const queryParams = new URLSearchParams({
          paymentId,
          businessId: business?.id || "",
          planId: checkoutModalPlan || "",
          billingCycle: modalCycle,
        });

        const res = await fetch(`/api/asaas/subscription-status?${queryParams.toString()}`);
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
        planId: checkoutModalPlan || "",
        billingCycle: modalCycle,
      });

      const res = await fetch(`/api/asaas/subscription-status?${queryParams.toString()}`);
      const result = await res.json();

      if (result.isPaid) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        handlePaymentConfirmedSuccess();
      } else {
        toast.info("O Asaas ainda está aguardando a compensação do seu banco. Aguarde alguns instantes.");
      }
    } catch {
      toast.error("Não foi possível consultar o Asaas no momento.");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Confirmação com sucesso
  const handlePaymentConfirmedSuccess = async () => {
    setModalStep("success");
    toast.success(`🎉 Pagamento confirmado no Asaas! ${planName} ativado com sucesso!`);

    if (business && checkoutModalPlan) {
      try {
        await saveBusiness({
          ...business,
          onboardingDetails: {
            ...(business.onboardingDetails || { specialties: [], serviceModes: [] }),
            plan: checkoutModalPlan,
            planBillingCycle: modalCycle,
            planActivatedAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error("Erro ao atualizar contexto local:", err);
      }
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
    const cycleLabel = modalCycle === "yearly" ? "Anual com 25% OFF" : "Mensal";
    const bizLabel = business?.name || payerName || "meu negócio";
    const msg = `Olá equipe ELLO! 👋\n\nEstou assinando o *${planName}* (${cycleLabel} - R$ ${currentPriceStr}) para o estabelecimento *${bizLabel}*.\n\nCódigo da cobrança Asaas: ${paymentData?.paymentId || "gerando..."}.\n\nPoderiam me auxiliar a confirmar a ativação?`;
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
              <span>Taxa ZERO de Comissão sobre suas Vendas</span>
            </div>

            <h1 className="mt-6 font-display text-[38px] font-medium leading-[1.05] tracking-[-.05em] sm:text-[56px] lg:text-[64px] text-[#20221f]">
              Planos transparentes para você <span className="ello-heading-accent">lucrar mais</span> a cada pedido.
            </h1>

            <p className="mt-5 text-[16px] leading-[1.7] text-[#6a6c65] sm:text-[19px] max-w-[620px] mx-auto">
              Ao contrário de outros apps que cobram 15% a 27% do seu faturamento, na ELLO você paga uma mensalidade fixa e todo o dinheiro das suas vendas fica 100% com você.
            </p>

            {/* TOGGLE MENSAL / ANUAL */}
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#e3e3dc] bg-white p-1.5 shadow-sm">
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
                  25% OFF
                </span>
              </button>
            </div>
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
                  Ideal para quem atende sozinho, freelancers e quem quer colocar seu cardápio ou serviços no ar hoje mesmo.
                </p>

                <div className="mt-6 flex items-baseline gap-1.5 border-t border-[#f0f0ea] pt-6">
                  <span className="font-display text-[42px] font-black tracking-tight text-[#20221f]">
                    R$ 0
                  </span>
                  <span className="text-[13px] font-medium text-[#888b81]">
                    / para sempre
                  </span>
                </div>

                {/* Vantagens */}
                <div className="mt-6 space-y-3 border-t border-[#f0f0ea] pt-6 text-[13px] text-[#4f514a]">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span><strong>1 usuário</strong> (o próprio gestor/dono)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Cardápio & Catálogo digital ilimitado</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Pedidos e Agendamentos sem limite</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Link próprio exclusivo (ello.app.br/seunome)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Compartilhamento rápido no WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-400">
                    <span className="mt-0.5 size-4 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">✕</span>
                    <span className="line-through">Subcontas para profissionais da equipe</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-400">
                    <span className="mt-0.5 size-4 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">✕</span>
                    <span className="line-through">Remoção do selo ELLO</span>
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
                ⚡ Mais Escolhido por Empresas
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#d0f25a]">
                    Equipes & Negócios
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/90">
                    0% de Taxa
                  </span>
                </div>

                <h3 className="mt-3 font-display text-[26px] font-semibold text-white">
                  Plano Pro
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                  Para salões, barbearias, clínicas, restaurantes e estúdios que têm equipe e querem gestão profissional sem comissão.
                </p>

                <div className="mt-6 flex items-baseline gap-1.5 border-t border-white/10 pt-6">
                  <span className="font-display text-[46px] font-black tracking-tight text-white">
                    {billingCycle === "yearly" ? "R$ 29,90" : "R$ 39,90"}
                  </span>
                  <span className="text-[13px] font-medium text-white/60">
                    /mês
                  </span>
                </div>
                {billingCycle === "yearly" ? (
                  <span className="text-[11px] text-[#d0f25a] font-semibold">
                    Cobrado anualmente (R$ 358,80/ano · Economia de R$ 120)
                  </span>
                ) : (
                  <span className="text-[11px] text-white/50 font-medium">
                    Faturamento mensal sem fidelidade · Cancele quando quiser
                  </span>
                )}

                {/* Vantagens do Pro */}
                <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-[13px] text-white/90">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>
                      <strong>Subcontas Ilimitadas para Equipe</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>
                      <strong>Link Exclusivo de Auto-Cadastro</strong> por WhatsApp para cada profissional
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>Agenda individual por profissional com seleção pelo cliente</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#d0f25a]" />
                    <span>
                      <strong>100% White-Label</strong> (Remoção total do selo da ELLO)
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
                    <span>Cobrança online com PIX Instantâneo Asaas</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout("pro")}
                  className="ello-cta ello-cta-lime w-full justify-center text-center font-bold text-[14px] shadow-lg hover:scale-[1.02] transition cursor-pointer"
                >
                  <span>Assinar Plano Pro</span>
                  <ArrowRight size={16} />
                </button>
                <p className="mt-2 text-center text-[11px] text-white/50">
                  Liberação automática instantânea via Asaas PIX
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
                    Multiunidade
                  </span>
                </div>

                <h3 className="mt-3 font-display text-[26px] font-semibold text-[#20221f]">
                  Business
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-[#72756d]">
                  Para marcas com múltiplas filiais, totens de atendimento e automações integradas de WhatsApp.
                </p>

                <div className="mt-6 flex items-baseline gap-1.5 border-t border-[#f0f0ea] pt-6">
                  <span className="font-display text-[46px] font-black tracking-tight text-[#20221f]">
                    {billingCycle === "yearly" ? "R$ 59,90" : "R$ 79,90"}
                  </span>
                  <span className="text-[13px] font-medium text-[#888b81]">
                    /mês
                  </span>
                </div>
                {billingCycle === "yearly" ? (
                  <span className="text-[11px] text-[#687348] font-semibold">
                    Cobrado anualmente (R$ 718,80/ano · Economia de R$ 240)
                  </span>
                ) : (
                  <span className="text-[11px] text-[#888b81] font-medium">
                    Faturamento mensal sem fidelidade
                  </span>
                )}

                {/* Vantagens Business */}
                <div className="mt-6 space-y-3 border-t border-[#f0f0ea] pt-6 text-[13px] text-[#4f514a]">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span><strong>Tudo do Plano Pro incluído</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span><strong>Múltiplas Filiais / Unidades</strong> no mesmo painel</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Totem de Autoatendimento para balcão ou recepção</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Automação de mensagens e lembretes por WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Controle avançado de taxas de entrega e motoboys</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#687348]" />
                    <span>Suporte VIP prioritário direto no WhatsApp</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#f0f0ea] pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenCheckout("business")}
                  className="ello-cta ello-cta-dark w-full justify-center text-center font-semibold text-[14px] cursor-pointer"
                >
                  Contratar Business
                </button>
                <p className="mt-2 text-center text-[11px] text-[#9a9c92]">
                  Perfeito para operações em expansão
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            4. CALCULADORA DE ECONOMIA vs OUTRAS PLATAFORMAS (iFood/Trinks/etc)
           ============================================================== */}
        <section className="border-y border-[#e6e5dd] bg-[#f5f5f0] px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-[1080px]">
            <div className="text-center">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#687348]">
                Simulador de Lucro Real
              </span>
              <h2 className="mt-2 font-display text-[32px] font-medium tracking-tight text-[#20221f] sm:text-[44px]">
                Veja quanto dinheiro você está perdendo em comissões
              </h2>
              <p className="mt-3 text-[15px] text-[#72756d] max-w-xl mx-auto">
                Arraste a barra abaixo com a média do faturamento mensal do seu negócio e veja o impacto no seu bolso.
              </p>
            </div>

            <div className="mt-12 rounded-3xl border border-[#e5e5dc] bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#50524b]">
                    Faturamento mensal estimado:
                  </span>
                  <span className="font-display text-2xl font-black text-[#20221f]">
                    R$ {monthlyRevenue.toLocaleString("pt-BR")}
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
                  <span>R$ 2.000/mês</span>
                  <span>R$ 30.000/mês</span>
                  <span>R$ 60.000/mês</span>
                </div>
              </div>

              {/* Grid Comparativo de Perda vs Ganho */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                  <div className="flex items-center gap-2 text-red-600 text-[12px] font-bold uppercase tracking-wider">
                    <span>Taxas de Outros Aplicativos (15%)</span>
                  </div>
                  <div className="mt-2 font-display text-[28px] sm:text-[34px] font-black text-red-700">
                    - R$ {traditionalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="mt-1 text-[12px] text-red-600/80">
                    Valor médio que você entrega mensalmente em comissões de marketplace.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#d6e5b8] bg-[#f2f7e8] p-5">
                  <div className="flex items-center gap-2 text-[#5e703f] text-[12px] font-bold uppercase tracking-wider">
                    <span>Economia com ELLO Pro</span>
                  </div>
                  <div className="mt-2 font-display text-[28px] sm:text-[34px] font-black text-[#20221f]">
                    + R$ {monthlySavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="mt-1 text-[12px] text-[#637248]">
                    Lucro líquido a mais por mês no seu bolso. (<strong>R$ {yearlySavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/ano</strong>)
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
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] w-1/6">Começar Grátis</th>
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] bg-[#f4f7eb] w-1/6">Plano Pro</th>
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] w-1/6">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efefe9] text-[#4f514a]">
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Taxa sobre faturamento e pedidos</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-700">0%</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-700 bg-[#fbfdf7]">0%</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-emerald-700">0%</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Subcontas ilimitadas para equipe</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Ilimitadas</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Ilimitadas</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Link de auto-cadastro por WhatsApp para colaboradores</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Sim</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Sim</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Cardápio & Catálogo Digital com fotos</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Ilimitado</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Ilimitado</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Ilimitado</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Remoção de marca ELLO (100% sua marca)</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Sim</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Sim</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Painel KDS de Cozinha & Preparo em tempo real</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Impressão Térmica Automática 80mm</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold bg-[#fbfdf7]">✓ Incluso</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Múltiplas Filiais / Unidades no mesmo painel</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300 bg-[#fbfdf7]">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Sim</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Totem de Autoatendimento para iPad/Tablet</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300">—</td>
                  <td className="p-4 sm:p-5 text-center text-slate-300 bg-[#fbfdf7]">—</td>
                  <td className="p-4 sm:p-5 text-center text-[#556934] font-bold">✓ Incluso</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium">Suporte ao cliente</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Padrão</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-[#556934] bg-[#fbfdf7]">Prioritário</td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-700">VIP no WhatsApp</td>
                </tr>
              </tbody>
            </table>
          </div>
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
                  a: "Exatamente! Cobramos ZERO porcentagem sobre o valor que você vende. Você paga apenas o valor fixo da sua assinatura e todo o dinheiro das suas vendas cai direto na sua conta bancária sem intermediários mordendo sua margem.",
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
                  a: "Aceitamos PIX Instantâneo oficial com compensação automática via Asaas em poucos segundos, além de cartão de crédito. Se optar pelo plano anual, você garante 25% de desconto.",
                },
                {
                  q: "Posso começar no plano grátis e mudar para o Pro depois?",
                  a: "Com certeza! Você pode começar no plano gratuito para conhecer a plataforma e, quando quiser adicionar colaboradores na equipe ou remover a marca da ELLO, basta fazer o upgrade com ativação imediata.",
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
                Leva menos de 3 minutos para criar seu cardápio, agenda e perfil profissional.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenCheckout("pro")}
                className="ello-cta ello-cta-lime cursor-pointer"
              >
                Assinar Plano Pro
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ==============================================================
          8. FOOTER OFICIAL ELLO
         ============================================================== */}
      <footer className="ello-footer mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-5 py-7 text-[11px] text-[#85877e] sm:flex-row sm:px-10 lg:px-16 border-t border-[#e6e5dd]">
        <Link to="/" className="flex items-center font-semibold text-[#242620]">
          <ElloLogo tone="dark" height={22} />
        </Link>
        <span>Plataforma completa para estabelecimentos e negócios locais. Taxa Zero sobre vendas.</span>
        <span>© {new Date().getFullYear()} ELLO</span>
      </footer>

      {/* ==============================================================
          9. MODAL DE CHECKOUT REAL VIA ASAAS (PIX AUTOMÁTICO)
         ============================================================== */}
      {checkoutModalPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-[#181a15] text-[#f7f6ef] border border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden my-8">
            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => {
                setCheckoutModalPlan(null);
                if (pollingRef.current) clearInterval(pollingRef.current);
              }}
              className="absolute top-5 right-5 grid size-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition cursor-pointer"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {/* ETAPA 1: SUCESSO DE PAGAMENTO */}
            {modalStep === "success" && (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#d0f25a] text-[#181a15] shadow-lg shadow-[#d0f25a]/20 animate-bounce">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-[#d0f25a]/20 text-[#d0f25a] px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2">
                    ⚡ Pagamento Confirmado no Asaas
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Parabéns! O {planName} está 100% ativo!
                  </h3>
                  <p className="mt-2 text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                    A sua assinatura foi confirmada pelo Banco Central e compensada no Asaas. Todos os recursos, subcontas e relatórios já foram liberados para{" "}
                    <strong className="text-white">{business?.name || payerName || "seu negócio"}</strong>.
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

            {/* ETAPA 2: TELA DO PIX REAL GERADO PELO ASAAS */}
            {modalStep === "payment" && paymentData && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#d0f25a]/15 text-[#d0f25a] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider">
                    <Zap size={13} />
                    <span>{planName}</span>
                    <span>·</span>
                    <span>{modalCycle === "yearly" ? "Anual (25% OFF)" : "Mensal"}</span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold text-white">
                    Pague com PIX para Ativar
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Cobrança real emitida no Asaas. A aprovação é imediata após a leitura do QR Code.
                  </p>
                </div>

                {/* Card com o QR Code Real do Asaas */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-4">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-white/10">
                    <span className="text-white/60">Valor da Assinatura:</span>
                    <span className="font-display font-black text-base text-[#d0f25a]">
                      R$ {paymentData.value.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {/* QR Code Oficial em Base64 */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl inline-block border-4 border-white">
                      <img
                        src={`data:image/png;base64,${paymentData.pix.encodedImage}`}
                        alt="QR Code Pix Oficial Asaas"
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
                      Abra o app do seu banco, escolha <strong>Pix Copia e Cola</strong> e cole o código.
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
                    <span>{isCheckingPayment ? "Verificando com o Asaas..." : "Já paguei, verificar agora"}</span>
                  </button>

                  {paymentData.invoiceUrl && (
                    <a
                      href={paymentData.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white py-1 transition"
                    >
                      <span>Abrir fatura completa no Asaas</span>
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
                  <h3 className="mt-2 font-display text-2xl font-bold text-white">
                    Assinar {planName}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Preencha os dados do pagador para emissão do PIX oficial registrado pelo Asaas.
                  </p>
                </div>

                {/* SELETOR DE CICLO NO MODAL */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/70 pb-2">
                    <span>Ciclo de Faturamento</span>
                    {modalCycle === "yearly" && (
                      <span className="text-[#d0f25a] font-bold">Economize 25%</span>
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
                        R$ {planPriceMonthly.toFixed(2).replace(".", ",")}/mês
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
                      <span>Anual (25% OFF)</span>
                      <span className="text-[11px] opacity-80 font-normal">
                        R$ {planPriceYearlyMonthly.toFixed(2).replace(".", ",")}/mês
                      </span>
                    </button>
                  </div>
                </div>

                {/* RESUMO DO VALOR */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 flex items-center justify-between">
                  <span className="text-xs text-white/70">Total a pagar agora via PIX:</span>
                  <div className="text-right">
                    <div className="font-display font-black text-xl text-[#d0f25a]">
                      R$ {currentPriceStr}
                    </div>
                    {modalCycle === "yearly" && (
                      <div className="text-[10px] text-white/40">Pagamento único anual com 25% de desconto</div>
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
                        CPF ou CNPJ (Obrigatório Asaas) *
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
                        <span>Gerando PIX Oficial no Asaas...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Gerar PIX Oficial Asaas</span>
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
                    <span>Ambiente seguro protegido por criptografia e regulado pelo Banco Central</span>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
