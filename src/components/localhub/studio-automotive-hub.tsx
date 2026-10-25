import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wrench,
  Car,
  CalendarDays,
  Plus,
  Trash2,
  Check,
  Clock,
  Copy,
  Receipt,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Fuel,
  Settings,
  ChevronRight,
  ArrowRight,
  Gauge,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";

export type AutoStage =
  | "queue"
  | "diagnosis"
  | "waiting_parts"
  | "in_progress"
  | "testing"
  | "ready"
  | "completed";

export type VehicleRecord = {
  id: string;
  plate: string;
  model: string;
  year?: string;
  mileageKm: number;
  clientName: string;
  clientPhone: string;
  services: string[];
  fuelLevel: "R" | "1/4" | "1/2" | "3/4" | "Cheio";
  alerts: string[];
  partsCost: number;
  laborCost: number;
  totalCost: number;
  stage: AutoStage;
  entryTime: string;
};

const INITIAL_AUTO_VEHICLES: VehicleRecord[] = [
  {
    id: "auto-1",
    plate: "BRA2E19",
    model: "Toyota Corolla XEi",
    year: "2021",
    mileageKm: 68450,
    clientName: "Fernando Albuquerque",
    clientPhone: "11988889999",
    services: ["Troca de Pastilhas de Freio", "Disco Dianteiro", "Sangria"],
    fuelLevel: "1/2",
    alerts: ["Risco no para-choque traseiro (pré-existente)", "Estepe ok"],
    partsCost: 380,
    laborCost: 220,
    totalCost: 600,
    stage: "in_progress",
    entryTime: "08:45",
  },
  {
    id: "auto-2",
    plate: "ABC4321",
    model: "Jeep Renegade Longitude",
    year: "2020",
    mileageKm: 52100,
    clientName: "Vanessa Guimarães",
    clientPhone: "11977778888",
    services: ["Revisão 50k", "Óleo 5W30 Sintético", "Filtro de Ar & Combustível"],
    fuelLevel: "3/4",
    alerts: ["Estepe ok", "Chave de roda presente"],
    partsCost: 310,
    laborCost: 190,
    totalCost: 500,
    stage: "ready",
    entryTime: "10:15",
  },
  {
    id: "auto-3",
    plate: "XYZ9876",
    model: "VW Polo TSI",
    year: "2022",
    mileageKm: 34000,
    clientName: "Lucas Mendes",
    clientPhone: "11966667777",
    services: ["Diagnóstico Injeção Eletrônica", "Limpeza de Bicos"],
    fuelLevel: "1/4",
    alerts: ["Luz da injeção acesa no painel"],
    partsCost: 120,
    laborCost: 280,
    totalCost: 400,
    stage: "diagnosis",
    entryTime: "11:30",
  },
];

const AUTO_STAGE_CONFIG: Record<
  AutoStage,
  { label: string; icon: string; bg: string; border: string; text: string; nextLabel: string; nextStage?: AutoStage }
> = {
  queue: {
    label: "Na Fila / Entrada",
    icon: "📥",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    nextLabel: "Iniciar Diagnóstico 🔍",
    nextStage: "diagnosis",
  },
  diagnosis: {
    label: "Diagnóstico & OS",
    icon: "🔍",
    bg: "bg-amber-50/70",
    border: "border-amber-200",
    text: "text-amber-800",
    nextLabel: "Aguardando Peças 📦",
    nextStage: "waiting_parts",
  },
  waiting_parts: {
    label: "Aguardando Peças",
    icon: "📦",
    bg: "bg-orange-50/70",
    border: "border-orange-200",
    text: "text-orange-800",
    nextLabel: "Iniciar na Rampa 🔧",
    nextStage: "in_progress",
  },
  in_progress: {
    label: "Na Rampa / Em Execução",
    icon: "🔧",
    bg: "bg-blue-50/70",
    border: "border-blue-200",
    text: "text-blue-800",
    nextLabel: "Teste & Lavagem 🧪",
    nextStage: "testing",
  },
  testing: {
    label: "Teste Final / Lavagem",
    icon: "🧪",
    bg: "bg-purple-50/70",
    border: "border-purple-200",
    text: "text-purple-800",
    nextLabel: "Carro Pronto! 🔑",
    nextStage: "ready",
  },
  ready: {
    label: "Pronto para Retirada",
    icon: "🔑",
    bg: "bg-emerald-50/70",
    border: "border-emerald-200",
    text: "text-emerald-800",
    nextLabel: "Entregar ao Cliente ✅",
    nextStage: "completed",
  },
  completed: {
    label: "Entregue & Faturado",
    icon: "✅",
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    text: "text-zinc-600",
    nextLabel: "Finalizado",
    nextStage: undefined,
  },
};

export function StudioAutomotiveHub() {
  const { business } = useLocalHub();
  const [activeTab, setActiveTab] = useState<"kanban" | "inspection" | "budget">("kanban");

  const storageKey = `ello_auto_hub_records_${business?.id || "default"}`;

  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_AUTO_VEHICLES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(vehicles));
    } catch {
      // ignore
    }
  }, [vehicles, storageKey]);

  // Modal Novo Veículo
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newMileage, setNewMileage] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newFuel, setNewFuel] = useState<"R" | "1/4" | "1/2" | "3/4" | "Cheio">("1/2");
  const [newServicesText, setNewServicesText] = useState("");
  const [newPartsCost, setNewPartsCost] = useState("0");
  const [newLaborCost, setNewLaborCost] = useState("150");
  const [newAlertsText, setNewAlertsText] = useState("");

  // Calculadora de Orçamento
  const [calcPlate, setCalcPlate] = useState("");
  const [calcModel, setCalcModel] = useState("");
  const [calcClient, setCalcClient] = useState("");
  const [calcParts, setCalcParts] = useState("350");
  const [calcLabor, setCalcLabor] = useState("200");
  const [calcDesc, setCalcDesc] = useState("Troca de pastilhas de freio e óleo 5W30 com filtros");

  // Disparo WhatsApp
  const [messageVehicle, setMessageVehicle] = useState<VehicleRecord | null>(null);

  const formatPlate = (val: string) => {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim() || !newClientPhone.trim()) {
      toast.error("Informe a placa do veículo e o WhatsApp do cliente.");
      return;
    }

    const now = new Date();
    const entryTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const parts = Number(newPartsCost) || 0;
    const labor = Number(newLaborCost) || 0;

    const newRecord: VehicleRecord = {
      id: `auto-${Date.now()}`,
      plate: formatPlate(newPlate),
      model: newModel.trim() || "Veículo não especificado",
      year: newYear.trim() || undefined,
      mileageKm: Number(newMileage) || 0,
      clientName: newClientName.trim() || "Cliente",
      clientPhone: newClientPhone.replace(/\D/g, ""),
      services: newServicesText
        ? newServicesText.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Revisão e Diagnóstico Geral"],
      fuelLevel: newFuel,
      alerts: newAlertsText
        ? newAlertsText.split(",").map((a) => a.trim()).filter(Boolean)
        : ["Estepe verificado"],
      partsCost: parts,
      laborCost: labor,
      totalCost: parts + labor,
      stage: "queue",
      entryTime,
    };

    setVehicles((prev) => [newRecord, ...prev]);
    toast.success(`🚗 Veículo ${newRecord.plate} cadastrado na esteira da oficina!`);

    setNewPlate("");
    setNewModel("");
    setNewMileage("");
    setNewClientName("");
    setNewClientPhone("");
    setNewServicesText("");
    setNewAlertsText("");
    setShowAddModal(false);
  };

  const advanceStage = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const currentCfg = AUTO_STAGE_CONFIG[v.stage];
        if (!currentCfg.nextStage) return v;
        return { ...v, stage: currentCfg.nextStage };
      }),
    );
  };

  const removeVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    toast.info("Veículo removido da esteira.");
  };

  const getWhatsAppUrl = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.length === 10 || clean.length === 11 ? `55${clean}` : clean;
    return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
  };

  const generateBudgetCopy = () => {
    const bizName = business?.name || "nossa Oficina Mecânica";
    const pixKey = business?.phone || "Consulte nossa chave Pix";
    const partsVal = Number(calcParts) || 0;
    const laborVal = Number(calcLabor) || 0;
    const total = partsVal + laborVal;

    return (
      `Olá ${calcClient || "cliente"}! 🚗\n` +
      `Segue a prévia da Ordem de Serviço / Orçamento no *${bizName}*:\n\n` +
      `🚘 *Veículo:* ${calcModel || "Veículo"} ${calcPlate ? `(Placa: ${calcPlate})` : ""}\n` +
      `📋 *Serviços Solicitados:* ${calcDesc || "Revisão geral"}\n\n` +
      `🔩 *Peças / Insumos:* R$ ${partsVal.toFixed(2).replace(".", ",")}\n` +
      `🔧 *Mão de Obra Especializada:* R$ ${laborVal.toFixed(2).replace(".", ",")}\n` +
      `💰 *Valor Total do Orçamento:* R$ ${total.toFixed(2).replace(".", ",")}\n` +
      `🔑 *Chave Pix:* ${pixKey}\n\n` +
      `Podemos autorizar o início dos serviços? Qualquer dúvida técnica estamos à disposição!`
    );
  };

  const copyBudget = async () => {
    await navigator.clipboard.writeText(generateBudgetCopy());
    toast.success("Orçamento copiado para a área de transferência!");
  };

  return (
    <div className="rounded-2xl border border-[#d9ddcf] bg-white p-5 shadow-xs sm:p-7">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-900 shadow-xs">
              <Car size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#292b25]">
                Central Operacional Automotiva & Oficinas
              </h2>
              <p className="text-xs text-slate-500">
                Esteira de Ordens de Serviço (OS), vistoria rápida de entrada, controle de peças e aviso "Carro Pronto" no WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex rounded-xl bg-[#edf0e5] p-1 text-xs font-bold text-[#586341]">
          <button
            type="button"
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "kanban"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench size={14} />
            <span>Esteira da Oficina ({vehicles.filter((v) => v.stage !== "completed").length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inspection")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "inspection"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Check-in & Vistoria</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "budget"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt size={14} />
            <span>Orçamento (Peças + Mão de Obra)</span>
          </button>
        </div>
      </div>

      {/* ABA 1: KANBAN DE OS DA OFICINA */}
      {activeTab === "kanban" && (
        <div className="mt-6 space-y-5">
          {/* BARRA SUPERIOR DE AÇÕES & RESUMO */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                {vehicles.filter((v) => v.stage === "in_progress").length} na rampa / em execução
              </span>
              <span className="flex items-center gap-1.5 text-orange-700">
                <span className="size-2 rounded-full bg-orange-500" />
                {vehicles.filter((v) => v.stage === "waiting_parts").length} aguardando peças
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                {vehicles.filter((v) => v.stage === "ready").length} prontos para entrega
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/studio/caixa"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Receipt size={13} />
                <span>Caixa da Oficina</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#292b25] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#414339] active:scale-95"
              >
                <Plus size={14} />
                <span>Dar Entrada em Veículo</span>
              </button>
            </div>
          </div>

          {/* GRID DA ESTEIRA (COLUNAS) */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {(
              [
                "queue",
                "diagnosis",
                "waiting_parts",
                "in_progress",
                "testing",
                "ready",
              ] as AutoStage[]
            ).map((stageKey) => {
              const cfg = AUTO_STAGE_CONFIG[stageKey];
              const stageVehicles = vehicles.filter((v) => v.stage === stageKey);

              return (
                <div
                  key={stageKey}
                  className={`flex flex-col rounded-xl border ${cfg.border} ${cfg.bg} p-3 min-h-[380px]`}
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="flex items-center justify-between pb-2 border-b border-black/5">
                    <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                      <span>{cfg.icon}</span>
                      <span className={`${cfg.text} truncate text-[11px]`}>{cfg.label}</span>
                    </div>
                    <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
                      {stageVehicles.length}
                    </span>
                  </div>

                  {/* Cards dos Veículos */}
                  <div className="mt-2.5 flex-1 space-y-2.5 overflow-y-auto">
                    {stageVehicles.length === 0 ? (
                      <div className="grid h-24 place-items-center text-center text-[10px] text-slate-400">
                        Nenhum veículo
                      </div>
                    ) : (
                      stageVehicles.map((veh) => (
                        <div
                          key={veh.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition hover:shadow-sm"
                        >
                          {/* Selo da Placa Estilo Mercosul */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="inline-flex flex-col overflow-hidden rounded border border-blue-800 bg-white shadow-2xs">
                              <span className="bg-blue-700 px-2 py-0.2 text-[8px] font-extrabold tracking-widest text-white text-center">
                                BRASIL
                              </span>
                              <span className="px-2 py-0.5 text-xs font-black tracking-widest text-slate-900 text-center font-mono">
                                {veh.plate}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 font-medium">
                                {veh.mileageKm ? `${veh.mileageKm.toLocaleString()} km` : "KM s/ inf."}
                              </span>
                              <div className="text-[9px] text-slate-400 flex items-center justify-end gap-0.5">
                                <Fuel size={10} /> {veh.fuelLevel}
                              </div>
                            </div>
                          </div>

                          {/* Modelo e Cliente */}
                          <div className="mt-2">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {veh.model} {veh.year ? `(${veh.year})` : ""}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">
                              👤 {veh.clientName}
                            </p>
                          </div>

                          {/* Serviços Solicitados */}
                          <div className="mt-2 text-[10px] text-slate-600 line-clamp-2">
                            {veh.services.join(", ")}
                          </div>

                          {/* Alertas da Vistoria */}
                          {veh.alerts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {veh.alerts.slice(0, 2).map((alert, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-800 border border-amber-200 truncate max-w-full"
                                >
                                  {alert}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Valores Totais */}
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                            <span className="text-slate-500">
                              Peças R$ {veh.partsCost} + MDO R$ {veh.laborCost}
                            </span>
                            <span className="font-bold text-slate-900">
                              R$ {veh.totalCost}
                            </span>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="mt-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setMessageVehicle(veh)}
                              title="Mensagens automáticas no WhatsApp"
                              className="flex size-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                            >
                              <MessageCircle size={13} />
                            </button>

                            {cfg.nextStage && (
                              <button
                                type="button"
                                onClick={() => advanceStage(veh.id)}
                                className="flex-1 rounded-lg bg-[#292b25] py-1 text-[10px] font-bold text-white transition hover:bg-[#414339] active:scale-95 text-center truncate px-1"
                              >
                                {cfg.nextLabel}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeVehicle(veh.id)}
                              title="Remover veículo"
                              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: CHECK-IN RÁPIDO & VISTORIA DE ENTRADA */}
      {activeTab === "inspection" && (
        <div className="mt-6 max-w-2xl mx-auto rounded-xl border border-slate-200 bg-slate-50/40 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <ShieldCheck size={16} />
              <span>Vistoria de Entrada (Prevenção de Avarias)</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Registre o estado do veículo antes de colocá-lo na rampa para evitar reclamações de riscos ou danos pré-existentes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
            <input
              type="text"
              placeholder="Placa (Ex: BRA2E19)"
              value={newPlate}
              onChange={(e) => setNewPlate(formatPlate(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-mono font-bold"
            />
            <input
              type="text"
              placeholder="Modelo / Veículo"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="text"
              placeholder="KM no Painel"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome do Cliente"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="tel"
              placeholder="WhatsApp do Cliente"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
          </div>

          {/* CHECKLIST DE VISTORIA */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="text-xs font-bold text-slate-800 mb-1">Checklist Obrigatório de Entrada:</div>
            {[
              "Nível de óleo e arrefecimento conferidos na entrada",
              "Estepe, macaco e chave de roda presentes no porta-malas",
              "Pertences de valor retirados pelo cliente",
              "Sem trincas pré-existentes no para-brisa ou vidros",
              "Luzes do painel verificadas com a chave ligada",
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-amber-700" />
                <span>{item}</span>
              </label>
            ))}
          </div>

          <textarea
            placeholder="Avarias físicas pré-existentes observadas (ex: risco profundo na porta direita, amassado leve no para-lama traseiro esquerdo)..."
            value={newAlertsText}
            onChange={(e) => setNewAlertsText(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!newPlate || !newClientPhone) {
                  toast.error("Preencha a placa e o telefone do cliente.");
                  return;
                }
                const bizName = business?.name || "nossa Oficina Mecânica";
                const msg = `Olá ${newClientName || "cliente"}! 🚗\nConfirmamos a entrada do seu veículo *${newModel || "Veículo"} (Placa: ${newPlate})* no *${bizName}* para serviços.\n\n📋 *KM de Entrada:* ${newMileage ? `${newMileage} km` : "Registrado"}\n🛡️ *Vistoria Inicial:* Realizada com sucesso.\n${newAlertsText ? `⚠️ *Avarias registradas:* ${newAlertsText}\n` : ""}Avisaremos você assim que o diagnóstico e orçamento estiverem prontos! 👍`;
                window.open(getWhatsAppUrl(newClientPhone, msg), "_blank");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              <MessageCircle size={14} />
              <span>Enviar Termo de Entrada ao Cliente no WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* ABA 3: ORÇAMENTO DETALHADO (PEÇAS + MÃO DE OBRA) */}
      {activeTab === "budget" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Simulador de Orçamento Mecânico</h3>
              <p className="text-xs text-slate-500">
                Discrimine peças e mão de obra separadamente para máxima transparência com o cliente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Placa do Veículo</label>
                <input
                  type="text"
                  placeholder="Ex: BRA2E19"
                  value={calcPlate}
                  onChange={(e) => setCalcPlate(formatPlate(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Modelo do Veículo</label>
                <input
                  type="text"
                  placeholder="Ex: Honda Civic 2.0"
                  value={calcModel}
                  onChange={(e) => setCalcModel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Nome do Cliente</label>
              <input
                type="text"
                placeholder="Ex: Roberto Lima"
                value={calcClient}
                onChange={(e) => setCalcClient(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Descrição dos Serviços e Peças</label>
              <textarea
                rows={3}
                value={calcDesc}
                onChange={(e) => setCalcDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Custo Total de Peças (R$)</label>
                <input
                  type="number"
                  value={calcParts}
                  onChange={(e) => setCalcParts(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Mão de Obra Oficina (R$)</label>
                <input
                  type="number"
                  value={calcLabor}
                  onChange={(e) => setCalcLabor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

          {/* PRÉVIA DO ORÇAMENTO PRONTO PARA WHATSAPP */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d9ddcf] bg-[#fbfdf7] p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Receipt size={15} />
                <span>Orçamento Formatado para Envio</span>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap shadow-2xs">
                {generateBudgetCopy()}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#e1e5d8]">
              <button
                type="button"
                onClick={() => void copyBudget()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#292b25] py-2.5 text-xs font-bold text-white transition hover:bg-[#414339] active:scale-98 shadow-xs"
              >
                <Copy size={14} />
                <span>Copiar Orçamento p/ WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO VEÍCULO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[26px] border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-900">
                  <Car size={16} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Entrada de Veículo na Oficina</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Placa do Carro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC1234 ou BRA2E19"
                    value={newPlate}
                    onChange={(e) => setNewPlate(formatPlate(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Modelo e Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: Onix 1.0 Turbo"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome do Cliente</label>
                  <input
                    type="text"
                    placeholder="Ex: Marcos Rocha"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">WhatsApp do Cliente *</label>
                  <input
                    type="tel"
                    required
                    placeholder="DDD + Número"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Quilometragem (KM)</label>
                  <input
                    type="number"
                    placeholder="Ex: 54000"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nível do Tanque</label>
                  <div className="mt-1 grid grid-cols-5 gap-1">
                    {(["R", "1/4", "1/2", "3/4", "Cheio"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNewFuel(lvl)}
                        className={`rounded-lg py-1.5 text-[10px] font-bold border transition ${
                          newFuel === lvl
                            ? "bg-[#292b25] border-[#292b25] text-white"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Serviços Solicitados (separar por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: Troca de pastilhas, Alinhamento, Troca de óleo"
                  value={newServicesText}
                  onChange={(e) => setNewServicesText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Peças Estimadas (R$)</label>
                  <input
                    type="number"
                    value={newPartsCost}
                    onChange={(e) => setNewPartsCost(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Mão de Obra (R$)</label>
                  <input
                    type="number"
                    value={newLaborCost}
                    onChange={(e) => setNewLaborCost(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#292b25] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#414339]"
                >
                  Confirmar Entrada 🚗
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DISPARO WHATSAPP PARA O VEÍCULO */}
      {messageVehicle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[26px] border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Notificar Cliente: {messageVehicle.clientName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {messageVehicle.model} • Placa {messageVehicle.plate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMessageVehicle(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const bizName = business?.name || "nossa oficina";
                  const pixKey = business?.phone || "Consulte nossa chave Pix";
                  const msg = `Olá ${messageVehicle.clientName}! 🔑 Boas notícias: seu veículo *${messageVehicle.model} (Placa ${messageVehicle.plate})* já está 100% pronto e testado no *${bizName}*!\n\n💰 *Valor Total:* R$ ${messageVehicle.totalCost.toFixed(2).replace(".", ",")}\n🔑 *Chave Pix:* ${pixKey}\n\nJá pode vir retirar o veículo! Ficamos à disposição. 👍`;
                  window.open(getWhatsAppUrl(messageVehicle.clientPhone, msg), "_blank");
                  setMessageVehicle(null);
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-left transition hover:bg-emerald-100/60"
              >
                <span className="text-base">🔑</span>
                <div>
                  <div className="text-xs font-bold text-emerald-900">1. Carro Pronto para Retirada</div>
                  <div className="mt-0.5 text-[11px] text-emerald-700 leading-tight">
                    "Seu veículo já está 100% pronto e testado. Valor R$ {messageVehicle.totalCost}. Pode vir retirar..."
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const bizName = business?.name || "nossa oficina";
                  const msg = `Olá ${messageVehicle.clientName}! ⚙️ Concluímos a avaliação do seu *${messageVehicle.model} (Placa ${messageVehicle.plate})* no *${bizName}*.\n\n🔩 *Peças necessárias:* R$ ${messageVehicle.partsCost.toFixed(2).replace(".", ",")}\n🔧 *Mão de obra:* R$ ${messageVehicle.laborCost.toFixed(2).replace(".", ",")}\n💰 *Total:* R$ ${messageVehicle.totalCost.toFixed(2).replace(".", ",")}\n\nPodemos autorizar a compra das peças e início dos serviços?`;
                  window.open(getWhatsAppUrl(messageVehicle.clientPhone, msg), "_blank");
                  setMessageVehicle(null);
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-left transition hover:bg-amber-100/60"
              >
                <span className="text-base">⚙️</span>
                <div>
                  <div className="text-xs font-bold text-amber-900">2. Aprovação de Orçamento</div>
                  <div className="mt-0.5 text-[11px] text-amber-700 leading-tight">
                    "Concluímos a avaliação do veículo. Peças + mão de obra: R$ {messageVehicle.totalCost}. Podemos autorizar?"
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const bizName = business?.name || "nossa oficina";
                  const msg = `Olá ${messageVehicle.clientName}! 📦 As peças do seu *${messageVehicle.model}* acabaram de chegar na oficina e o veículo já subiu para a rampa de execução! Previsão de conclusão em breve. 👍`;
                  window.open(getWhatsAppUrl(messageVehicle.clientPhone, msg), "_blank");
                  setMessageVehicle(null);
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-left transition hover:bg-blue-100/60"
              >
                <span className="text-base">📦</span>
                <div>
                  <div className="text-xs font-bold text-blue-900">3. Peças Chegaram / Na Rampa</div>
                  <div className="mt-0.5 text-[11px] text-blue-700 leading-tight">
                    "As peças chegaram e o veículo já subiu para a rampa de execução..."
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
