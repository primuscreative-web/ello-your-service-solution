import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { ElloLogo } from "@/components/ello/logo";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/planos")({ component: PricingPlansPage });

export function PricingPlansPage() {
  const { business } = useLocalHub();
  const startTo = business ? "/studio" : "/onboarding";

  // Período de faturamento: Mensal ou Anual (25% off)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Simulador de Economia vs Outras Plataformas
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(12000);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Cálculo da economia
  const traditionalFee = monthlyRevenue * 0.15; // 15% média iFood/Trinks/AppBarber
  const elloProCost = billingCycle === "yearly" ? 29.9 : 39.9;
  const monthlySavings = Math.max(0, traditionalFee - elloProCost);
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="ello-site min-h-screen bg-[#fcfcf9] text-[#20221f] selection:bg-[#d0f25a] selection:text-[#20221f]">
      {/* ==============================================================
          1. HEADER COM IDENTIDADE VISUAL OFICIAL ELLO
         ============================================================== */}
      <header className="ello-nav sticky top-0 z-50 w-full px-5 sm:px-10 lg:px-16">
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
            <Link to={startTo} className="ello-cta ello-cta-lime min-h-10">
              {business ? "Meu espaço" : "Começar grátis"}
              <ArrowRight size={15} />
            </Link>
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

            <h1 className="mt-6 font-display text-[40px] font-medium leading-[1.05] tracking-[-.055em] sm:text-[60px] text-[#20221f]">
              Previsível, justo e feito para o seu negócio{" "}
              <span className="text-[#687348] italic font-serif">lucrar de verdade.</span>
            </h1>

            <p className="mt-5 text-[16px] leading-7 text-[#72756d] sm:text-[18px]">
              Chega de deixar 12% a 25% do seu faturamento em comissões abusivas. Na ELLO você paga
              apenas uma assinatura fixa e <strong>100% do dinheiro das suas vendas e agendamentos é seu</strong>.
            </p>

            {/* SELETOR MENSAL / ANUAL COM DESCONTO */}
            <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#e5e5dc] bg-white p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-5 py-2 text-[13px] font-semibold transition ${
                  billingCycle === "monthly"
                    ? "bg-[#20221f] text-white shadow-sm"
                    : "text-[#72756d] hover:text-[#20221f]"
                }`}
              >
                Cobrança Mensal
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition ${
                  billingCycle === "yearly"
                    ? "bg-[#20221f] text-white shadow-sm"
                    : "text-[#72756d] hover:text-[#20221f]"
                }`}
              >
                <span>Cobrança Anual</span>
                <span className="rounded-full bg-[#d0f25a] px-2 py-0.5 text-[10px] font-bold text-[#20221f] uppercase tracking-wider">
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
                  to={startTo}
                  className="ello-cta ello-cta-quiet w-full justify-center text-center font-semibold text-[14px]"
                >
                  Criar conta grátis
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
                <Link
                  to={startTo}
                  className="ello-cta ello-cta-lime w-full justify-center text-center font-bold text-[14px] shadow-lg hover:scale-[1.02] transition"
                >
                  Assinar Plano Pro
                  <ArrowRight size={16} />
                </Link>
                <p className="mt-2 text-center text-[11px] text-white/50">
                  Liberação instantânea das subcontas no PIX
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
                <Link
                  to={startTo}
                  className="ello-cta ello-cta-dark w-full justify-center text-center font-semibold text-[14px]"
                >
                  Contratar Business
                </Link>
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
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>R$ 2.000/mês</span>
                  <span>R$ 30.000/mês</span>
                  <span>R$ 60.000+/mês</span>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3 pt-6 border-t border-[#f0f0ea]">
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                  <span className="text-xs font-semibold text-red-700">
                    Outras plataformas (15% média):
                  </span>
                  <div className="mt-2 text-2xl font-black text-red-900">
                    - R$ {traditionalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="mt-1 text-[11px] text-red-600">
                    Retidos todos os meses da sua conta
                  </p>
                </div>

                <div className="rounded-2xl border border-[#dce4ca] bg-[#f1f4e9] p-5">
                  <span className="text-xs font-semibold text-[#66794a]">
                    Assinatura Fixa ELLO Pro:
                  </span>
                  <div className="mt-2 text-2xl font-black text-[#20221f]">
                    R$ {elloProCost.toFixed(2).replace(".", ",")}
                  </div>
                  <p className="mt-1 text-[11px] text-[#66794a]">
                    Custo fixo e previsível · 0% de comissão
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Você economiza todo mês:
                  </span>
                  <div className="mt-2 text-3xl font-black text-emerald-900">
                    R$ {monthlySavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                    São <strong>R$ {yearlySavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a mais</strong> no seu caixa por ano!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================
            5. TABELA COMPARATIVA DETALHADA DE RECURSOS
           ============================================================== */}
        <section className="mx-auto max-w-[1180px] px-5 py-20 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#687348]">
              Comparativo de Recursos
            </span>
            <h2 className="mt-2 font-display text-[30px] font-medium tracking-tight text-[#20221f] sm:text-[38px]">
              Tudo o que está incluído em cada plano
            </h2>
          </div>

          <div className="mt-12 overflow-x-auto rounded-3xl border border-[#e5e5dc] bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#e5e5dc] bg-[#fafaf7]">
                  <th className="p-4 sm:p-5 font-bold text-[#20221f] w-1/2">Funcionalidade</th>
                  <th className="p-4 sm:p-5 font-semibold text-center text-[#686a62] w-1/6">Começar Grátis</th>
                  <th className="p-4 sm:p-5 font-bold text-center text-[#20221f] bg-[#f4f7eb] w-1/6">Plano Pro</th>
                  <th className="p-4 sm:p-5 font-semibold text-center text-[#686a62] w-1/6">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ea]">
                {/* GRUPO: OPERAÇÃO & CARDÁPIO */}
                <tr className="bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                  <td colSpan={4} className="px-5 py-2.5">Operação & Atendimento</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Cardápio & Catálogo de Serviços</td>
                  <td className="p-4 text-center">Ilimitado</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-[#20221f]">Ilimitado</td>
                  <td className="p-4 text-center">Ilimitado</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Pedidos & Agendamentos Online</td>
                  <td className="p-4 text-center">Ilimitados</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-[#20221f]">Ilimitados</td>
                  <td className="p-4 text-center">Ilimitados</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Taxa de comissão por venda</td>
                  <td className="p-4 text-center font-bold text-emerald-700">0%</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-black text-emerald-700">0%</td>
                  <td className="p-4 text-center font-bold text-emerald-700">0%</td>
                </tr>

                {/* GRUPO: EQUIPE & SUBCONTAS */}
                <tr className="bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                  <td colSpan={4} className="px-5 py-2.5">Equipe & Subcontas</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Subcontas para profissionais da equipe</td>
                  <td className="p-4 text-center text-slate-400">1 (apenas dono)</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-emerald-700">Ilimitadas</td>
                  <td className="p-4 text-center font-bold text-emerald-700">Ilimitadas</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Link de auto-cadastro para equipe via WhatsApp</td>
                  <td className="p-4 text-center text-slate-400">✕</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-emerald-700">✓ Incluído</td>
                  <td className="p-4 text-center font-bold text-emerald-700">✓ Incluído</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Agenda individual por profissional com escolha do cliente</td>
                  <td className="p-4 text-center text-slate-400">✕</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-emerald-700">✓ Incluído</td>
                  <td className="p-4 text-center font-bold text-emerald-700">✓ Incluído</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Controle de comissões por colaborador</td>
                  <td className="p-4 text-center text-slate-400">✕</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-emerald-700">✓ Incluído</td>
                  <td className="p-4 text-center font-bold text-emerald-700">✓ Avançado</td>
                </tr>

                {/* GRUPO: MARCA & WHITE-LABEL */}
                <tr className="bg-slate-50/70 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                  <td colSpan={4} className="px-5 py-2.5">Marca & Personalização</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Remoção do selo ELLO (100% White-Label)</td>
                  <td className="p-4 text-center text-slate-400">Com selo</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-emerald-700">100% Removido</td>
                  <td className="p-4 text-center font-bold text-emerald-700">100% Removido</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">QR Codes personalizados para balcão e mesas</td>
                  <td className="p-4 text-center">Básico</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 font-bold text-[#20221f]">Personalizado</td>
                  <td className="p-4 text-center">Personalizado</td>
                </tr>
                <tr>
                  <td className="p-4 sm:px-5 font-medium text-[#20221f]">Totens de Autoatendimento</td>
                  <td className="p-4 text-center text-slate-400">✕</td>
                  <td className="p-4 text-center bg-[#f4f7eb]/50 text-slate-400">✕</td>
                  <td className="p-4 text-center font-bold text-emerald-700">✓ Incluído</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ==============================================================
            6. PERGUNTAS FREQUENTES (FAQ)
           ============================================================== */}
        <section className="border-t border-[#e6e5dd] bg-[#fafaf7] px-5 py-20 sm:px-10 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-[820px]">
            <div className="text-center">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#687348]">
                Tira-Dúvidas
              </span>
              <h2 className="mt-2 font-display text-[32px] font-medium tracking-tight text-[#20221f] sm:text-[40px]">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="mt-12 space-y-3">
              {[
                {
                  q: "A ELLO realmente cobra zero taxa sobre o que eu vendo?",
                  a: "Sim, exatamente zero. Você paga apenas o valor fixo da sua assinatura mensal ou anual. 100% do dinheiro das suas vendas e agendamentos vai direto para você, sem nenhuma retenção de porcentagem.",
                },
                {
                  q: "Existe fidelidade ou multa de cancelamento?",
                  a: "Nenhuma fidelidade. Você pode assinar, usar e cancelar a qualquer momento direto pelo painel de controle, sem precisar falar com atendente nem pagar nenhuma taxa extra.",
                },
                {
                  q: "Como funciona o link de auto-cadastro para minha equipe?",
                  a: "No Plano Pro, você acessa a aba de Equipe, clica em 'Gerar Link' e digita o nome do colaborador. O sistema gera um link exclusivo que você envia no WhatsApp dele. Ao clicar no celular, ele mesmo envia a foto de perfil, WhatsApp e marca quais serviços realiza.",
                },
                {
                  q: "Como o cliente final faz o pagamento?",
                  a: "O cliente pode pagar na sua maquininha física no balcão, via chave PIX direta da sua empresa, ou online com confirmação instantânea via Asaas.",
                },
                {
                  q: "Posso começar no plano grátis e mudar para o Pro depois?",
                  a: "Com certeza! Você pode começar no plano gratuito para conhecer a plataforma e, quando quiser adicionar colaboradores na equipe ou remover a marca da ELLO, basta fazer o upgrade com ativação imediata no PIX.",
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
                      className="flex w-full items-center justify-between p-5 text-left font-semibold text-[#20221f] text-sm sm:text-base"
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
              <Link to={startTo} className="ello-cta ello-cta-lime">
                Começar gratuitamente
                <ArrowRight size={16} />
              </Link>
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
    </div>
  );
}
