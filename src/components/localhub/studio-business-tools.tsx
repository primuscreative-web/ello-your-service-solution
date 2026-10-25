import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Scissors,
  Dog,
  Stethoscope,
  UtensilsCrossed,
  Wrench,
  ShoppingBag,
  Sparkles,
  Calculator,
  Package,
  Car,
  MessageCircle,
  CalendarDays,
  WalletCards,
  HeartHandshake,
  ArrowRight,
  Check,
  Copy,
  Receipt,
  LayoutDashboard,
  ClipboardList,
  Bike,
  BarChart3,
  Settings2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";
import { StudioPetHub } from "@/components/localhub/studio-pet-hub";
import { StudioHealthHub } from "@/components/localhub/studio-health-hub";
import { StudioAutomotiveHub } from "@/components/localhub/studio-automotive-hub";

type BusinessSegment =
  | "beleza"
  | "pet"
  | "saude"
  | "alimentacao"
  | "automotivo"
  | "servicos"
  | "varejo";

export function StudioBusinessTools() {
  const { business } = useLocalHub();
  const activeSegment: BusinessSegment = mapCategoryToSegment(business?.category);

  // Estados dos utilitários interativos rápidos
  // 1. Calculadora de Comissão (Beleza / Prestadores)
  const [servicePrice, setServicePrice] = useState("100");
  const [commissionRate, setCommissionRate] = useState("50");

  // 2. Orçamento Rápido via WhatsApp (Serviços / Varejo)
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteDesc, setQuoteDesc] = useState("");
  const [quoteValue, setQuoteValue] = useState("");
  const [quoteCopied, setQuoteCopied] = useState(false);

  // 3. Aviso "Pet Pronto" (Pet shop)
  const [petName, setPetName] = useState("");
  const [tutorPhone, setTutorPhone] = useState("");

  const calculatedCommission = (Number(servicePrice || 0) * Number(commissionRate || 0)) / 100;
  const businessShare = Number(servicePrice || 0) - calculatedCommission;

  const generateQuoteText = () => {
    const businessName = business?.name ?? "nosso negócio";
    const pixKey = business?.phone || "Consulte nossa chave Pix";
    return `Olá ${quoteClient ? quoteClient : "cliente"}! 👋\nSegue o orçamento do seu pedido/serviço no *${businessName}*:\n\n📋 *Descrição:* ${quoteDesc || "Serviço solicitado"}\n💰 *Valor Total:* R$ ${quoteValue || "0,00"}\n🔑 *Chave Pix:* ${pixKey}\n\nQualquer dúvida estamos à total disposição!`;
  };

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(generateQuoteText());
      setQuoteCopied(true);
      toast.success("Orçamento copiado para o WhatsApp!");
      setTimeout(() => setQuoteCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const getPetReadyUrl = () => {
    const digits = tutorPhone.replace(/\D/g, "");
    const num = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    const msg = `Olá! 🐾 Boas notícias: o(a) *${petName || "seu pet"}* já terminou o banho e tosa, está cheiroso(a) e pronto(a) para ir pra casa no *${business?.name ?? "Pet Shop"}*! Pode vir buscar. ❤️`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-w-0 rounded-2xl border border-[#e8e6df] bg-white p-4 shadow-xs sm:p-6">
      {/* CABEÇALHO DA SEÇÃO DE FERRAMENTAS */}
      <div className="flex min-w-0 flex-col items-start gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[#d0f25a] text-[#292b25]">
              <Sparkles size={16} strokeWidth={2.4} />
            </span>
            <h2 className="min-w-0 text-sm font-bold leading-snug text-[#292b25] sm:text-base">
              Ferramentas & Utilidades para o seu Negócio
            </h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Recursos inteligentes desenvolvidos para otimizar sua rotina, do atendimento ao fechamento de caixa.
          </p>
        </div>

        {/* INDICADOR EXCLUSIVO DO NICHO DO NEGÓCIO */}
        <div className="flex max-w-full items-center gap-2 rounded-xl border border-[#d9ddcf] bg-[#edf0e5] px-3 py-2 text-[11px] font-bold leading-tight text-[#586341] sm:px-3.5 sm:py-1.5 sm:text-xs">
          {activeSegment === "beleza" && <Scissors size={14} />}
          {activeSegment === "pet" && <Dog size={14} />}
          {activeSegment === "saude" && <Stethoscope size={14} />}
          {activeSegment === "automotivo" && <Car size={14} />}
          {activeSegment === "alimentacao" && <UtensilsCrossed size={14} />}
          {activeSegment === "servicos" && <Wrench size={14} />}
          {activeSegment === "varejo" && <ShoppingBag size={14} />}
          <span>
            {activeSegment === "beleza" && "Beleza, Barbearia & Estética"}
            {activeSegment === "pet" && "Pet Shop & Banho e Tosa"}
            {activeSegment === "saude" && "Saúde, Clínicas & Bem-Estar"}
            {activeSegment === "automotivo" && "Automotivo, Mecânica & Detalhamento"}
            {activeSegment === "alimentacao" && "Gastronomia & Delivery"}
            {activeSegment === "servicos" && "Serviços, Reformas & Atendimentos"}
            {activeSegment === "varejo" && "Lojas & Varejo"}
          </span>
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO CONFORME O SEGMENTO */}
      <div className="mt-5">
        {/* SEGMENTO 1: BELEZA, BARBEARIA & ESTÉTICA */}
        {activeSegment === "beleza" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* CARD DE AÇÕES DO SEGMENTO */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Atalhos essenciais para Barbearia & Salão</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/studio/agenda"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <CalendarDays size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Agenda de Atendimentos</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Confirme horários e dispare lembretes de WhatsApp com 1 clique.
                  </p>
                </Link>

                <Link
                  to="/studio/crm"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <HeartHandshake size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Ficha de Preferências</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Guarde o tipo de corte, tintura ou histórico de cada cliente.
                  </p>
                </Link>

                <Link
                  to="/studio/caixa"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <WalletCards size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Cobrança no Caixa / PDV</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Receba em Pix, cartão ou dinheiro com comprovante instantâneo.
                  </p>
                </Link>

                <Link
                  to="/studio/profissionais"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Scissors size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Equipe & Comissões</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Cadastre profissionais da equipe e acompanhe os atendimentos.
                  </p>
                </Link>

                <Link
                  to="/studio/precificacao"
                  className="group col-span-full flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 transition hover:border-emerald-400 hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2.5 text-slate-800">
                    <span className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
                      <Calculator size={15} />
                    </span>
                    <div>
                      <span className="text-xs font-bold block">Custos de Insumos & Produtos de Bancada</span>
                      <p className="text-[11px] text-slate-500">
                        Custo médio por aplicação/dose e margem real de lucro dos procedimentos.
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-emerald-700 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* UTILITÁRIO PRÁTICO: CALCULADORA DE COMISSÃO */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <Calculator size={15} />
                <span>Calculador de Repasse / Comissão</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Calcule rapidamente o repasse do profissional por corte ou procedimento.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Valor do Serviço (R$)
                  <input
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    placeholder="100"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Comissão (%)
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    placeholder="50"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-3 border border-emerald-200">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Profissional recebe</div>
                  <div className="text-sm font-black text-emerald-700">
                    R$ {calculatedCommission.toFixed(2).replace(".", ",")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Salão / Espaço fica com</div>
                  <div className="text-sm font-black text-slate-800">
                    R$ {businessShare.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEGMENTO 2: PET CARE, BANHO & TOSA E PET SHOP */}
        {activeSegment === "pet" && <StudioPetHub />}

        {/* SEGMENTO 3: SAÚDE, CLÍNICAS & BEM-ESTAR */}
        {activeSegment === "saude" && <StudioHealthHub />}

        {/* SEGMENTO AUTOMOTIVO: OFICINAS, MECÂNICAS & ESTÉTICA AUTOMOTIVA */}
        {activeSegment === "automotivo" && <StudioAutomotiveHub />}

        {/* SEGMENTO 4: ALIMENTAÇÃO & GASTRONOMIA */}
        {activeSegment === "alimentacao" && (
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ferramentas de alimentação</h3>
            <p className="mt-1 text-xs text-slate-500">Acesso direto às áreas da operação do restaurante.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Visão geral", description: "Resumo da operação", to: "/studio", icon: LayoutDashboard },
                { label: "Pedidos", description: "Acompanhe e atualize pedidos", to: "/studio/pedidos", icon: ClipboardList },
                { label: "Frente de caixa / PDV", description: "Registre vendas e movimentos", to: "/studio/caixa", icon: WalletCards },
                { label: "Mesas", description: "Comandas, mesas e QR Codes", to: "/studio/mesas", icon: UtensilsCrossed },
                { label: "Motoboys e entregas", description: "Equipe e pedidos em rota", to: "/studio/entregas", icon: Bike },
                { label: "Cardápio", description: "Produtos, preços e disponibilidade", to: "/studio/catalog", icon: Package },
                { label: "Cupons", description: "Descontos e promoções", to: "/studio/crm", icon: Tag, coupons: true },
                { label: "Métricas de vendas", description: "Desempenho dos pedidos", to: "/studio/metricas", icon: BarChart3 },
                { label: "Custos e precificação", description: "Custos, margens e preços", to: "/studio/precificacao", icon: Calculator },
                { label: "Financeiro", description: "Movimentos e relatórios", to: "/studio/financeiro", icon: WalletCards },
                { label: "Configuração da página", description: "Dados da loja e página pública", to: "/studio/settings", icon: Settings2 },
              ].map(({ label, description, to, icon: Icon, coupons }) => {
                const className = "group flex min-h-[76px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs";
                const content = (
                  <>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf0e5] text-[#586341]"><Icon size={17} /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800">{label}</span>
                      <span className="mt-1 block text-[11px] text-slate-500">{description}</span>
                    </span>
                    <ArrowRight size={14} className="ml-auto shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                  </>
                );
                return coupons ? (
                  <Link key={label} to="/studio/crm" className={className}>{content}</Link>
                ) : (
                  <Link key={label} to={to as "/studio"} className={className}>{content}</Link>
                );
              })}
            </div>
          </div>
        )}

        {/* SEGMENTO 5 & 6: SERVIÇOS GERAIS, OFICINAS & VAREJO */}
        {(activeSegment === "servicos" || activeSegment === "varejo") && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Orçamentos e Fechamento Ágil</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/studio/caixa"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <WalletCards size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Frente de Caixa</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Registre serviços prestados ou vendas avulsas de balcão.
                  </p>
                </Link>

                <Link
                  to="/studio/precificacao"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calculator size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Custos & Precificação</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Calcule sua margem de lucro e custo de hora trabalhada.
                  </p>
                </Link>
              </div>
            </div>

            {/* GERADOR RÁPIDO DE ORÇAMENTO PIX PARA WHATSAPP */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Receipt size={15} />
                <span>Gerador Rápido de Orçamento Pix para WhatsApp</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Monte um texto profissional de orçamento com valor e chave Pix para enviar ao cliente.
              </p>

              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={quoteClient}
                    onChange={(e) => setQuoteClient(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Valor (ex: 150,00)"
                    value={quoteValue}
                    onChange={(e) => setQuoteValue(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Descrição do serviço / peça / produto"
                  value={quoteDesc}
                  onChange={(e) => setQuoteDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => void copyQuote()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#292b25] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#414339] active:scale-95"
                >
                  {quoteCopied ? <Check size={13} className="text-[#d0f25a]" /> : <Copy size={13} />}
                  <span>{quoteCopied ? "Orçamento Copiado!" : "Copiar para o WhatsApp"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function mapCategoryToSegment(category?: string | null): BusinessSegment {
  if (!category) return "servicos";
  if (category === "alimentacao") return "alimentacao";
  if (category === "beleza" || category === "barbearia") return "beleza";
  if (category === "pet") return "pet";
  if (category === "saude") return "saude";
  if (category === "automotivo") return "automotivo";
  return "servicos";
}
