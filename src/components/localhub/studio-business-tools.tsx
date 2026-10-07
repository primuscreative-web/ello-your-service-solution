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
  MessageCircle,
  CalendarDays,
  WalletCards,
  HeartHandshake,
  ArrowRight,
  Check,
  Copy,
  Receipt,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";

type BusinessSegment = "beleza" | "pet" | "saude" | "alimentacao" | "servicos" | "varejo";

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
    <div className="rounded-2xl border border-[#e8e6df] bg-white p-5 shadow-xs sm:p-6">
      {/* CABEÇALHO DA SEÇÃO DE FERRAMENTAS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[#d0f25a] text-[#292b25]">
              <Sparkles size={16} strokeWidth={2.4} />
            </span>
            <h2 className="text-base font-bold text-[#292b25]">
              Ferramentas & Utilidades para o seu Negócio
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Recursos inteligentes desenvolvidos para otimizar sua rotina, do atendimento ao fechamento de caixa.
          </p>
        </div>

        {/* INDICADOR EXCLUSIVO DO NICHO DO NEGÓCIO */}
        <div className="flex items-center gap-2 rounded-xl bg-[#edf0e5] px-3.5 py-1.5 text-xs font-bold text-[#586341] border border-[#d9ddcf]">
          {activeSegment === "beleza" && <Scissors size={14} />}
          {activeSegment === "pet" && <Dog size={14} />}
          {activeSegment === "saude" && <Stethoscope size={14} />}
          {activeSegment === "alimentacao" && <UtensilsCrossed size={14} />}
          {activeSegment === "servicos" && <Wrench size={14} />}
          {activeSegment === "varejo" && <ShoppingBag size={14} />}
          <span>
            {activeSegment === "beleza" && "Beleza, Barbearia & Estética"}
            {activeSegment === "pet" && "Pet Shop & Banho e Tosa"}
            {activeSegment === "saude" && "Saúde, Clínicas & Bem-Estar"}
            {activeSegment === "alimentacao" && "Gastronomia & Delivery"}
            {activeSegment === "servicos" && "Serviços, Oficinas & Atendimentos"}
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

        {/* SEGMENTO 2: PET SHOP & VETERINÁRIA */}
        {activeSegment === "pet" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Atalhos rápidos para Banho & Tosa e Pet Care</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/studio/agenda"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <CalendarDays size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Banho & Tosa do Dia</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Controle entradas, cães aguardando e animais prontos para entrega.
                  </p>
                </Link>

                <Link
                  to="/studio/caixa"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <WalletCards size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Venda de Rações & Serviços</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    PDV rápido de balcão para produtos pet e serviços executados.
                  </p>
                </Link>
              </div>
            </div>

            {/* UTILITÁRIO PRÁTICO: AVISO PET PRONTO NO WHATSAPP */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Dog size={15} />
                <span>Disparo Rápido: "Pet Pronto para Retirada 🐾"</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Avise o tutor no WhatsApp que o animalzinho finalizou o procedimento e já pode ser buscado.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome do pet (ex: Thor)"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp do tutor (DDD + número)"
                  value={tutorPhone}
                  onChange={(e) => setTutorPhone(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div className="mt-3 flex justify-end">
                <a
                  href={getPetReadyUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  <MessageCircle size={14} />
                  <span>Chamar Tutor no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* SEGMENTO 3: SAÚDE, CLÍNICAS & BEM-ESTAR */}
        {activeSegment === "saude" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Gestão de Consultas e Atendimentos</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/studio/agenda"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <CalendarDays size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Consultas Marcadas</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Confirmações com antecedência e controle de faltas e presenças.
                  </p>
                </Link>

                <Link
                  to="/studio/crm"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <HeartHandshake size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Ficha de Pacientes</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Histórico de sessões, retornos e contatos dos pacientes.
                  </p>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-xs uppercase tracking-wider">
                <Receipt size={15} />
                <span>Comprovante de Atendimento / Consulta</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Seus pacientes podem pagar via Pix direto no balcão e receber o recibo no WhatsApp com o valor declarado.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white p-3 border border-sky-100">
                <span className="text-xs text-slate-600 font-medium">Use a Frente de Caixa para emitir recibos rápidos</span>
                <Link
                  to="/studio/caixa"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-700"
                >
                  Abrir Caixa <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SEGMENTO 4: ALIMENTAÇÃO & GASTRONOMIA */}
        {activeSegment === "alimentacao" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Operação Gastronômica Completa</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  to="/studio/pedidos"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Receipt size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Painel de Pedidos (KDS)</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Acompanhe preparo na cozinha, retiradas no balcão e delivery.
                  </p>
                </Link>

                <Link
                  to="/studio/mesas"
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#b8d648] hover:bg-white hover:shadow-xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <UtensilsCrossed size={16} className="text-[#586341]" />
                    <span className="text-xs font-bold">Mesas & Salão com QR Code</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Clientes pedem direto da mesa pelo celular sem garçom demorado.
                  </p>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe3d3] bg-[#f5f7ee] p-4">
              <div className="flex items-center gap-2 text-[#465130] font-bold text-xs uppercase tracking-wider">
                <Share2 size={15} />
                <span>Cardápio Digital no WhatsApp</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Seus clientes visualizam fotos nítidas dos pratos e fecham a conta no Pix com cálculo automático de taxa de entrega.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/studio/catalog"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#292b25] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3f4239]"
                >
                  Gerenciar Cardápio <ArrowRight size={12} />
                </Link>
              </div>
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
  return "servicos";
}
