import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dog,
  Cat,
  Sparkles,
  Scissors,
  CalendarDays,
  WalletCards,
  MessageCircle,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Car,
  Clock,
  Copy,
  ChevronRight,
  ShieldCheck,
  Heart,
  Search,
  Filter,
  CheckCircle2,
  User,
  Phone,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";

export type PetStage = "reception" | "bath" | "grooming" | "ready" | "taxi" | "completed";

export type PetRecord = {
  id: string;
  petName: string;
  species: "dog" | "cat";
  breed: string;
  size: "P" | "M" | "G" | "GG";
  tutorName: string;
  tutorPhone: string;
  services: string[];
  alerts: string[];
  hasTaxi: boolean;
  stage: PetStage;
  scheduledTime: string;
  totalPrice?: number;
  entryTime: string;
};

const INITIAL_SAMPLE_PETS: PetRecord[] = [
  {
    id: "sample-1",
    petName: "Thor",
    species: "dog",
    breed: "Shih-tzu",
    size: "P",
    tutorName: "Mariana Costa",
    tutorPhone: "11998877665",
    services: ["Banho Completo", "Tosa Higiênica", "Hidratação"],
    alerts: ["Alérgico a perfume", "Cuidado c/ ouvidos"],
    hasTaxi: false,
    stage: "grooming",
    scheduledTime: "10:00",
    totalPrice: 85,
    entryTime: "09:50",
  },
  {
    id: "sample-2",
    petName: "Mel",
    species: "dog",
    breed: "Golden Retriever",
    size: "G",
    tutorName: "Carlos Eduardo",
    tutorPhone: "11987654321",
    services: ["Banho Profissional", "Desembolo", "Leva e Traz"],
    alerts: ["Dócil", "Pele sensível"],
    hasTaxi: true,
    stage: "ready",
    scheduledTime: "11:30",
    totalPrice: 160,
    entryTime: "11:15",
  },
  {
    id: "sample-3",
    petName: "Mia",
    species: "cat",
    breed: "Persa",
    size: "P",
    tutorName: "Fernanda Lima",
    tutorPhone: "11976543210",
    services: ["Banho a Seco / Felino", "Corte de Unhas"],
    alerts: ["Assustada / Cat Friendly"],
    hasTaxi: false,
    stage: "bath",
    scheduledTime: "13:00",
    totalPrice: 90,
    entryTime: "12:55",
  },
];

const STAGE_CONFIG: Record<
  PetStage,
  { label: string; icon: string; bg: string; border: string; text: string; nextLabel: string; nextStage?: PetStage }
> = {
  reception: {
    label: "Na Recepção",
    icon: "📥",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    nextLabel: "Iniciar Banho 🛁",
    nextStage: "bath",
  },
  bath: {
    label: "No Banho & Secador",
    icon: "🛁",
    bg: "bg-blue-50/70",
    border: "border-blue-200",
    text: "text-blue-800",
    nextLabel: "Enviar p/ Tosa ✂️",
    nextStage: "grooming",
  },
  grooming: {
    label: "Na Tosa / Estética",
    icon: "✂️",
    bg: "bg-purple-50/70",
    border: "border-purple-200",
    text: "text-purple-800",
    nextLabel: "Marcar Pronto 🐾",
    nextStage: "ready",
  },
  ready: {
    label: "Pronto! Aguardando",
    icon: "🐾",
    bg: "bg-emerald-50/70",
    border: "border-emerald-200",
    text: "text-emerald-800",
    nextLabel: "Despachar no Táxi 🚗",
    nextStage: "taxi",
  },
  taxi: {
    label: "Táxi Pet a Caminho",
    icon: "🚗",
    bg: "bg-amber-50/70",
    border: "border-amber-200",
    text: "text-amber-800",
    nextLabel: "Concluir Entrega ✅",
    nextStage: "completed",
  },
  completed: {
    label: "Entregue ao Tutor",
    icon: "✅",
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    text: "text-zinc-600",
    nextLabel: "Finalizado",
    nextStage: undefined,
  },
};

const COMMON_ALERTS = [
  "⚠️ Bravo / Morde",
  "🌸 Alérgico a perfume",
  "👂 Cuidado c/ ouvidos",
  "🧓 Idoso / Cardíaco",
  "✂️ Não passar máquina",
  "🩹 Pele sensível / Nós",
  "⚡ Medo de soprador",
  "🐱 Cat Friendly / Calmo",
];

export function StudioPetHub() {
  const { business } = useLocalHub();
  const [activeTab, setActiveTab] = useState<"board" | "calc" | "admission">("board");

  // Storage key scoped to business
  const storageKey = `ello_pet_hub_records_${business?.id || "default"}`;

  const [pets, setPets] = useState<PetRecord[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_SAMPLE_PETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pets));
    } catch {
      // ignore
    }
  }, [pets, storageKey]);

  // Form de novo pet
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [newSpecies, setNewSpecies] = useState<"dog" | "cat">("dog");
  const [newBreed, setNewBreed] = useState("");
  const [newSize, setNewSize] = useState<"P" | "M" | "G" | "GG">("P");
  const [newTutorName, setNewTutorName] = useState("");
  const [newTutorPhone, setNewTutorPhone] = useState("");
  const [newHasTaxi, setNewHasTaxi] = useState(false);
  const [newScheduledTime, setNewScheduledTime] = useState("10:00");
  const [newSelectedAlerts, setNewSelectedAlerts] = useState<string[]>([]);
  const [newSelectedServices, setNewSelectedServices] = useState<string[]>([
    "Banho Completo",
    "Tosa Higiênica",
  ]);
  const [newPrice, setNewPrice] = useState("75");

  // Calculadora de Porte e Pelagem
  const [calcSize, setCalcSize] = useState<"P" | "M" | "G" | "GG">("P");
  const [calcCoat, setCalcCoat] = useState<"short" | "medium" | "long">("short");
  const [calcBehavior, setCalcBehavior] = useState<"calm" | "hard">("calm");
  const [calcAddons, setCalcAddons] = useState<{
    hygienic: boolean;
    machineCut: boolean;
    scissorCut: boolean;
    hydration: boolean;
    detangling: boolean;
    medicinalBath: boolean;
    taxi: boolean;
  }>({
    hygienic: true,
    machineCut: false,
    scissorCut: false,
    hydration: false,
    detangling: false,
    medicinalBath: false,
    taxi: false,
  });

  // Admission checklist form
  const [admPetName, setAdmPetName] = useState("");
  const [admBreed, setAdmBreed] = useState("");
  const [admTutorName, setAdmTutorName] = useState("");
  const [admTutorPhone, setAdmTutorPhone] = useState("");
  const [admObservations, setAdmObservations] = useState("");
  const [admChecks, setAdmChecks] = useState({
    noFleas: true,
    healthySkin: true,
    vaccinesOk: true,
    allowHygienic: true,
    allowDryer: true,
  });

  // Disparo WhatsApp
  const [messageModalPet, setMessageModalPet] = useState<PetRecord | null>(null);

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim() || !newTutorPhone.trim()) {
      toast.error("Informe pelo menos o nome do pet e o telefone do tutor.");
      return;
    }

    const now = new Date();
    const entryTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newRecord: PetRecord = {
      id: `pet-${Date.now()}`,
      petName: newPetName.trim(),
      species: newSpecies,
      breed: newBreed.trim() || (newSpecies === "dog" ? "SRD (Vira-lata)" : "SRD Felino"),
      size: newSize,
      tutorName: newTutorName.trim() || "Tutor",
      tutorPhone: newTutorPhone.replace(/\D/g, ""),
      services: newSelectedServices,
      alerts: newSelectedAlerts,
      hasTaxi: newHasTaxi,
      stage: "reception",
      scheduledTime: newScheduledTime || entryTime,
      totalPrice: Number(newPrice) || 70,
      entryTime,
    };

    setPets((prev) => [newRecord, ...prev]);
    toast.success(`🐾 ${newPetName} adicionado à esteira do dia!`);

    // Reset
    setNewPetName("");
    setNewBreed("");
    setNewTutorName("");
    setNewTutorPhone("");
    setNewSelectedAlerts([]);
    setShowAddModal(false);
  };

  const advanceStage = (petId: string) => {
    setPets((prev) =>
      prev.map((pet) => {
        if (pet.id !== petId) return pet;
        const currentConfig = STAGE_CONFIG[pet.stage];
        if (!currentConfig.nextStage) return pet;
        return { ...pet, stage: currentConfig.nextStage };
      }),
    );
  };

  const removePet = (petId: string) => {
    setPets((prev) => prev.filter((p) => p.id !== petId));
    toast.info("Pet removido da esteira.");
  };

  // Cálculo da Calculadora Inteligente
  const calculateTotal = () => {
    let base = 55;
    let minutes = 45;

    if (calcSize === "M") {
      base = 75;
      minutes = 60;
    } else if (calcSize === "G") {
      base = 110;
      minutes = 90;
    } else if (calcSize === "GG") {
      base = 150;
      minutes = 120;
    }

    if (calcCoat === "medium") {
      base += 15;
      minutes += 15;
    } else if (calcCoat === "long") {
      base += 35;
      minutes += 30;
    }

    if (calcAddons.hygienic) {
      base += 25;
      minutes += 15;
    }
    if (calcAddons.machineCut) {
      base += 40;
      minutes += 30;
    }
    if (calcAddons.scissorCut) {
      base += 65;
      minutes += 45;
    }
    if (calcAddons.hydration) {
      base += 35;
      minutes += 20;
    }
    if (calcAddons.detangling) {
      base += 40;
      minutes += 30;
    }
    if (calcAddons.medicinalBath) {
      base += 30;
      minutes += 15;
    }
    if (calcAddons.taxi) {
      base += 25;
    }

    if (calcBehavior === "hard") {
      base = Math.round(base * 1.25);
      minutes += 30;
    }

    return { total: base, minutes };
  };

  const calcResult = calculateTotal();

  const generateCalcBudgetCopy = () => {
    const bizName = business?.name || "nosso Pet Care";
    const sizeLabel = { P: "Pequeno (até 10kg)", M: "Médio (10-20kg)", G: "Grande (20-35kg)", GG: "Gigante (+35kg)" }[calcSize];
    const coatLabel = { short: "Pelo Curto", medium: "Pelo Médio", long: "Pelo Longo/Duplo" }[calcCoat];

    const addonsText: string[] = [];
    if (calcAddons.hygienic) addonsText.push("• Tosa Higiênica");
    if (calcAddons.machineCut) addonsText.push("• Tosa Geral (Máquina)");
    if (calcAddons.scissorCut) addonsText.push("• Tosa na Tesoura");
    if (calcAddons.hydration) addonsText.push("• Hidratação Profissional");
    if (calcAddons.detangling) addonsText.push("• Desembolo de Pelagem");
    if (calcAddons.medicinalBath) addonsText.push("• Banho Medicamentoso / Antipulgas");
    if (calcAddons.taxi) addonsText.push("• Serviço Leva e Traz (Táxi Pet)");

    return `Olá! 👋 Segue o orçamento personalizado para os cuidados do seu pet no *${bizName}* 🐾:\n\n` +
      `🐕 *Porte:* ${sizeLabel}\n` +
      `✂️ *Pelagem:* ${coatLabel}\n` +
      `${addonsText.length > 0 ? `✨ *Serviços Inclusos:*\n${addonsText.join("\n")}\n\n` : ""}` +
      `⏱️ *Tempo Estimado de Bancada:* aprox. ${calcResult.minutes} minutos\n` +
      `💰 *Valor Total:* R$ ${calcResult.total.toFixed(2).replace(".", ",")}\n\n` +
      `Podemos reservar o melhor horário para o seu pet? Será um prazer cuidar dele com muito carinho! ❤️`;
  };

  const copyBudget = async () => {
    await navigator.clipboard.writeText(generateCalcBudgetCopy());
    toast.success("Orçamento copiado para a área de transferência!");
  };

  // WhatsApp helper
  const getWhatsAppUrl = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.length === 10 || clean.length === 11 ? `55${clean}` : clean;
    return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
  };

  const sendWhatsAppTemplate = (type: "ready" | "taxi" | "alert" | "thankyou") => {
    if (!messageModalPet) return;
    const pet = messageModalPet;
    const bizName = business?.name || "nosso Pet Care";

    let msg = "";
    if (type === "ready") {
      msg = `Olá ${pet.tutorName}! 🐾 Boas notícias: o(a) *${pet.petName}* já terminou os cuidados, está sequinho(a), cheiroso(a) e esperando você no *${bizName}*! Já pode vir buscar. 🥰`;
    } else if (type === "taxi") {
      msg = `Olá ${pet.tutorName}! 🚗 Nosso motorista do Táxi Pet acabou de sair para levar o(a) *${pet.petName}* de volta para casa com muito carinho e segurança! Previsão de chegada nos próximos minutos. 🐾`;
    } else if (type === "alert") {
      msg = `Olá ${pet.tutorName}! 👋 Durante a avaliação inicial do(a) *${pet.petName}* no *${bizName}*, notamos alguns nós na pelagem / sensibilidade na pele. Gostaria de autorizar realizarmos um desembolo especial / tosa higiênica para o conforto dele(a)? ✂️`;
    } else if (type === "thankyou") {
      msg = `Olá ${pet.tutorName}! Passando para agradecer pelo carinho de trazer o(a) *${pet.petName}* hoje no *${bizName}*. Ele(a) se comportou muito bem! Qualquer dúvida estamos à disposição. Até o próximo banho! ❤️🐾`;
    }

    const url = getWhatsAppUrl(pet.tutorPhone, msg);
    window.open(url, "_blank");
    setMessageModalPet(null);
  };

  return (
    <div className="rounded-2xl border border-[#d9ddcf] bg-white p-5 shadow-xs sm:p-7">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#d0f25a] text-[#292b25] shadow-xs">
              <Dog size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#292b25]">
                Central Operacional Pet Care & Banho e Tosa
              </h2>
              <p className="text-xs text-slate-500">
                Esteira de atendimento em tempo real, controle de porte, alertas comportamentais e contato veloz com tutores.
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex rounded-xl bg-[#edf0e5] p-1 text-xs font-bold text-[#586341]">
          <button
            type="button"
            onClick={() => setActiveTab("board")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "board"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Dog size={14} />
            <span>Esteira do Dia ({pets.filter((p) => p.stage !== "completed").length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calc")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "calc"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scissors size={14} />
            <span>Calculadora de Banho/Tosa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admission")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "admission"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Checklist & Admissão</span>
          </button>
        </div>
      </div>

      {/* ABA 1: ESTEIRA DO DIA (KANBAN EM TEMPO REAL) */}
      {activeTab === "board" && (
        <div className="mt-6 space-y-5">
          {/* BARRA SUPERIOR DE AÇÕES & RESUMO */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                {pets.filter((p) => p.stage === "bath" || p.stage === "grooming").length} em bancada
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                {pets.filter((p) => p.stage === "ready").length} prontos esperando busca
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="size-2 rounded-full bg-amber-500" />
                {pets.filter((p) => p.stage === "taxi").length} no Táxi Pet
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/studio/agenda"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <CalendarDays size={13} />
                <span>Ver Agenda Completa</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#292b25] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#414339] active:scale-95"
              >
                <Plus size={14} />
                <span>Dar Entrada em Novo Pet</span>
              </button>
            </div>
          </div>

          {/* GRID DA ESTEIRA (COLUNAS) */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(["reception", "bath", "grooming", "ready", "taxi"] as PetStage[]).map((stageKey) => {
              const config = STAGE_CONFIG[stageKey];
              const stagePets = pets.filter((p) => p.stage === stageKey);

              return (
                <div
                  key={stageKey}
                  className={`flex flex-col rounded-xl border ${config.border} ${config.bg} p-3 min-h-[380px]`}
                >
                  {/* Título da Coluna */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-black/5">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span>{config.icon}</span>
                      <span className={config.text}>{config.label}</span>
                    </div>
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
                      {stagePets.length}
                    </span>
                  </div>

                  {/* Lista de Pets nessa Etapa */}
                  <div className="mt-2.5 flex-1 space-y-2.5 overflow-y-auto">
                    {stagePets.length === 0 ? (
                      <div className="grid h-28 place-items-center text-center text-[11px] text-slate-400">
                        Nenhum pet nesta etapa
                      </div>
                    ) : (
                      stagePets.map((pet) => (
                        <div
                          key={pet.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition hover:shadow-sm"
                        >
                          {/* Topo do Card do Pet */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="grid size-6 place-items-center rounded-md bg-[#edf0e5] text-xs">
                                {pet.species === "dog" ? "🐶" : "🐱"}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                  {pet.petName}
                                </h4>
                                <span className="text-[10px] text-slate-500">
                                  {pet.breed} • Porte {pet.size}
                                </span>
                              </div>
                            </div>

                            {pet.hasTaxi && (
                              <span
                                title="Táxi Pet Contratado"
                                className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-800"
                              >
                                <Car size={10} /> Táxi
                              </span>
                            )}
                          </div>

                          {/* Alertas comportamentais ou médicos */}
                          {pet.alerts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pet.alerts.map((alert, i) => (
                                <span
                                  key={i}
                                  className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-200"
                                >
                                  {alert}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Serviços Inclusos */}
                          <div className="mt-2 text-[10px] text-slate-600 line-clamp-2">
                            {pet.services.join(", ")}
                          </div>

                          {/* Tutor & Contato */}
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                            <span className="truncate max-w-[90px]" title={pet.tutorName}>
                              👤 {pet.tutorName}
                            </span>
                            <span className="font-semibold text-slate-700">
                              R$ {pet.totalPrice ? pet.totalPrice.toFixed(0) : "0"}
                            </span>
                          </div>

                          {/* Ações Rápidas no Card */}
                          <div className="mt-2.5 flex items-center gap-1.5">
                            {/* Botão de WhatsApp inteligente */}
                            <button
                              type="button"
                              onClick={() => setMessageModalPet(pet)}
                              title="Mensagens prontas no WhatsApp"
                              className="flex size-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                            >
                              <MessageCircle size={13} />
                            </button>

                            {/* Avançar Etapa */}
                            {config.nextStage && (
                              <button
                                type="button"
                                onClick={() => advanceStage(pet.id)}
                                className="flex-1 rounded-lg bg-[#292b25] py-1 text-[11px] font-bold text-white transition hover:bg-[#414339] active:scale-95 text-center truncate px-1.5"
                              >
                                {config.nextLabel}
                              </button>
                            )}

                            {/* Remover se já concluído ou cancelado */}
                            <button
                              type="button"
                              onClick={() => removePet(pet.id)}
                              title="Remover da esteira"
                              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
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

          {/* HISTÓRICO DE PETS CONCLUÍDOS HOJE */}
          {pets.some((p) => p.stage === "completed") && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Pets Finalizados e Entregues Hoje ({pets.filter((p) => p.stage === "completed").length})</span>
                <button
                  type="button"
                  onClick={() => setPets((prev) => prev.filter((p) => p.stage !== "completed"))}
                  className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                >
                  Limpar concluídos
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {pets
                  .filter((p) => p.stage === "completed")
                  .map((pet) => (
                    <span
                      key={pet.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                    >
                      <span>🐾 {pet.petName} ({pet.tutorName})</span>
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: CALCULADORA INTELIGENTE DE BANHO & TOSA */}
      {activeTab === "calc" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configuração do Procedimento Pet</h3>
              <p className="text-xs text-slate-500">
                Selecione o porte, tipo de pelagem e serviços extras para calcular o valor sugerido e tempo de bancada.
              </p>
            </div>

            {/* 1. SELETOR DE PORTE */}
            <div>
              <label className="text-xs font-bold text-slate-700">1. Porte do Pet</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: "P", label: "P (até 10kg)", sub: "Shih-tzu, Pug, Maltês" },
                  { id: "M", label: "M (10-20kg)", sub: "Cocker, Beagle, Buldogue" },
                  { id: "G", label: "G (20-35kg)", sub: "Golden, Labrador, Pastor" },
                  { id: "GG", label: "GG (+35kg)", sub: "Bernese, Rottweiler" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCalcSize(item.id as any)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      calcSize === item.id
                        ? "border-[#586341] bg-[#edf0e5] ring-2 ring-[#586341]/20 font-bold"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500 leading-tight">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. TIPO DE PELAGEM */}
            <div>
              <label className="text-xs font-bold text-slate-700">2. Tipo de Pelagem</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: "short", label: "Pelo Curto", sub: "Pinscher, Boxer" },
                  { id: "medium", label: "Pelo Médio / Liso", sub: "Yorkshire, Maltês" },
                  { id: "long", label: "Longo / Duplo", sub: "Spitz, Chow Chow, Golden" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCalcCoat(item.id as any)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      calcCoat === item.id
                        ? "border-[#586341] bg-[#edf0e5] ring-2 ring-[#586341]/20 font-bold"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. SERVIÇOS ADICIONAIS */}
            <div>
              <label className="text-xs font-bold text-slate-700">3. Serviços Adicionais & Estética</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { key: "hygienic", label: "Tosa Higiênica (+R$ 25)", desc: "Patas, partes íntimas e barriga" },
                  { key: "machineCut", label: "Tosa Geral na Máquina (+R$ 40)", desc: "Corpo todo na altura desejada" },
                  { key: "scissorCut", label: "Tosa na Tesoura (+R$ 65)", desc: "Acabamento premium manual" },
                  { key: "hydration", label: "Hidratação Profissional (+R$ 35)", desc: "Máscara nutritiva e brilho" },
                  { key: "detangling", label: "Desembolo por hora (+R$ 40)", desc: "Remoção de nós sem tosar curto" },
                  { key: "medicinalBath", label: "Banho Medicamentoso (+R$ 30)", desc: "Shampoo prescrito ou antipulgas" },
                  { key: "taxi", label: "Táxi Pet Leva e Traz (+R$ 25)", desc: "Transporte seguro ida e volta" },
                ].map((addon) => {
                  const isChecked = calcAddons[addon.key as keyof typeof calcAddons];
                  return (
                    <button
                      key={addon.key}
                      type="button"
                      onClick={() =>
                        setCalcAddons((prev) => ({
                          ...prev,
                          [addon.key]: !prev[addon.key as keyof typeof calcAddons],
                        }))
                      }
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                        isChecked
                          ? "border-[#586341] bg-[#edf0e5] text-[#292b25]"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${
                          isChecked ? "bg-[#586341] border-[#586341] text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <div>
                        <div className="text-xs font-bold leading-tight">{addon.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight">{addon.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. COMPORTAMENTO */}
            <div>
              <label className="text-xs font-bold text-slate-700">4. Temperamento do Pet</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCalcBehavior("calm")}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    calcBehavior === "calm"
                      ? "border-[#586341] bg-[#edf0e5] font-bold"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Dócil / Habituado</div>
                  <div className="text-[10px] text-slate-500">Tempo padrão de bancada</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCalcBehavior("hard")}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    calcBehavior === "hard"
                      ? "border-rose-400 bg-rose-50 text-rose-900 font-bold"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Agitado / Reativo (+25%)</div>
                  <div className="text-[10px] text-slate-500">Exige maior contenção e tempo</div>
                </button>
              </div>
            </div>
          </div>

          {/* PAINEL DE RESULTADO E ORÇAMENTO PRONTO */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d9ddcf] bg-[#fbfdf7] p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#586341]">
                <Sparkles size={15} />
                <span>Resultado Sugerido</span>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-b border-[#e1e5d8] pb-4">
                <div>
                  <span className="text-3xl font-extrabold text-[#292b25]">
                    R$ {calcResult.total.toFixed(2).replace(".", ",")}
                  </span>
                  <p className="text-[11px] text-slate-500">Preço justo calculado com base nos custos e tempo</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#edf0e5] px-2.5 py-1 text-xs font-bold text-[#586341]">
                    <Clock size={12} /> ~{calcResult.minutes} min
                  </span>
                  <p className="mt-1 text-[10px] text-slate-400">Tempo de bancada</p>
                </div>
              </div>

              {/* Prévia da Mensagem de WhatsApp */}
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700">Prévia do Orçamento p/ WhatsApp:</label>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap font-mono shadow-2xs">
                  {generateCalcBudgetCopy()}
                </div>
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

      {/* ABA 3: CHECKLIST DE ENTRADA & TERMO DE ADMISSÃO */}
      {activeTab === "admission" && (
        <div className="mt-6 max-w-2xl mx-auto rounded-xl border border-slate-200 bg-slate-50/40 p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#586341]">
              <ShieldCheck size={16} />
              <span>Ficha Rápida de Entrada do Animal (Triagem)</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Faça a inspeção rápida na recepção antes de iniciar o procedimento para resguardar o negócio e o bem-estar do pet.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome do Pet (ex: Bob)"
              value={admPetName}
              onChange={(e) => setAdmPetName(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="text"
              placeholder="Raça / Espécie"
              value={admBreed}
              onChange={(e) => setAdmBreed(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="text"
              placeholder="Nome do Tutor"
              value={admTutorName}
              onChange={(e) => setAdmTutorName(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
            <input
              type="tel"
              placeholder="WhatsApp do Tutor"
              value={admTutorPhone}
              onChange={(e) => setAdmTutorPhone(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
            />
          </div>

          {/* CHECKLIST DE CONDIÇÕES */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="text-xs font-bold text-slate-800 mb-1">Checklist de Verificação Inicial:</div>
            {[
              { key: "noFleas", label: "Ausência visível de pulgas / carrapatos graves" },
              { key: "healthySkin", label: "Pele e ouvidos sem feridas ou infecções aparentes" },
              { key: "vaccinesOk", label: "Tutor confirmou carteira de vacinação em dia" },
              { key: "allowHygienic", label: "Autorizada tosa higiênica e corte de unhas" },
              { key: "allowDryer", label: "Tolerância normal ao soprador e secador" },
            ].map((check) => {
              const val = admChecks[check.key as keyof typeof admChecks];
              return (
                <label
                  key={check.key}
                  className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setAdmChecks((prev) => ({ ...prev, [check.key]: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-[#586341] focus:ring-[#586341]"
                  />
                  <span>{check.label}</span>
                </label>
              );
            })}
          </div>

          <textarea
            placeholder="Observações especiais (ex: verruga no flanco esquerdo, sensibilidade na pata traseira, tosa bebê autorizada)..."
            value={admObservations}
            onChange={(e) => setAdmObservations(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (!admPetName || !admTutorPhone) {
                  toast.error("Preencha o nome do pet e telefone do tutor.");
                  return;
                }
                const bizName = business?.name || "nosso Pet Care";
                const msg = `Olá ${admTutorName || "tutor"}! 🐾 Confirmamos a entrada do(a) *${admPetName}* no *${bizName}* para atendimento hoje.\n\n📋 *Status da Triagem:* Realizada com sucesso.\n${admObservations ? `📝 *Observações:* ${admObservations}\n` : ""}Avisaremos você assim que o procedimento for concluído! ❤️`;
                const url = getWhatsAppUrl(admTutorPhone, msg);
                window.open(url, "_blank");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              <MessageCircle size={14} />
              <span>Enviar Confirmação de Entrada no WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: NOVO PET NA ESTEIRA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#d0f25a] text-[#292b25]">
                  <Dog size={16} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Entrada de Pet na Esteira</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleAddPet} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome do Pet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Luke"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Espécie</label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewSpecies("dog")}
                      className={`rounded-lg py-1.5 text-xs font-bold border transition ${
                        newSpecies === "dog"
                          ? "bg-[#edf0e5] border-[#586341] text-[#586341]"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      🐶 Cão
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSpecies("cat")}
                      className={`rounded-lg py-1.5 text-xs font-bold border transition ${
                        newSpecies === "cat"
                          ? "bg-[#edf0e5] border-[#586341] text-[#586341]"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      🐱 Gato
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Raça</label>
                  <input
                    type="text"
                    placeholder="Ex: Shih-tzu, Pug, SRD"
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Porte</label>
                  <div className="mt-1 grid grid-cols-4 gap-1">
                    {(["P", "M", "G", "GG"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewSize(s)}
                        className={`rounded-lg py-1.5 text-xs font-bold border transition ${
                          newSize === s
                            ? "bg-[#292b25] border-[#292b25] text-white"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome do Tutor</label>
                  <input
                    type="text"
                    placeholder="Ex: Juliana"
                    value={newTutorName}
                    onChange={(e) => setNewTutorName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">WhatsApp do Tutor *</label>
                  <input
                    type="tel"
                    required
                    placeholder="DDD + Número"
                    value={newTutorPhone}
                    onChange={(e) => setNewTutorPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Alertas Rápido */}
              <div>
                <label className="text-xs font-bold text-slate-700">Alertas / Cuidados Especiais</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {COMMON_ALERTS.map((alert) => {
                    const selected = newSelectedAlerts.includes(alert);
                    return (
                      <button
                        key={alert}
                        type="button"
                        onClick={() =>
                          setNewSelectedAlerts((prev) =>
                            selected ? prev.filter((a) => a !== alert) : [...prev, alert],
                          )
                        }
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition ${
                          selected
                            ? "bg-rose-50 border-rose-300 text-rose-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {alert}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Valor Total (R$)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHasTaxi}
                      onChange={(e) => setNewHasTaxi(e.target.checked)}
                      className="rounded border-slate-300 text-[#586341]"
                    />
                    <span>🚗 Táxi Pet (Leva e Traz)</span>
                  </label>
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
                  Confirmar Entrada 🐾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DISPARO RÁPIDO DE WHATSAPP PARA O PET */}
      {messageModalPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
                  <MessageCircle size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Chamar Tutor: {messageModalPet.tutorName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pet: {messageModalPet.petName} ({messageModalPet.breed})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMessageModalPet(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => sendWhatsAppTemplate("ready")}
                className="w-full flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-left transition hover:bg-emerald-100/60"
              >
                <span className="text-base">🐾</span>
                <div>
                  <div className="text-xs font-bold text-emerald-900">1. Pet Pronto para Retirada</div>
                  <div className="mt-0.5 text-[11px] text-emerald-700 leading-tight">
                    "O {messageModalPet.petName} já terminou os cuidados, está cheiroso e esperando você..."
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => sendWhatsAppTemplate("taxi")}
                className="w-full flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-left transition hover:bg-amber-100/60"
              >
                <span className="text-base">🚗</span>
                <div>
                  <div className="text-xs font-bold text-amber-900">2. Táxi Pet a Caminho de Casa</div>
                  <div className="mt-0.5 text-[11px] text-amber-700 leading-tight">
                    "Nosso motorista do Táxi Pet acabou de sair para levar o {messageModalPet.petName}..."
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => sendWhatsAppTemplate("alert")}
                className="w-full flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-left transition hover:bg-rose-100/60"
              >
                <span className="text-base">⚠️</span>
                <div>
                  <div className="text-xs font-bold text-rose-900">3. Alerta / Autorização de Tosa/Nós</div>
                  <div className="mt-0.5 text-[11px] text-rose-700 leading-tight">
                    "Notamos alguns nós na pelagem. Gostaria de autorizar realizarmos um desembolo especial..."
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => sendWhatsAppTemplate("thankyou")}
                className="w-full flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-left transition hover:bg-blue-100/60"
              >
                <span className="text-base">❤️</span>
                <div>
                  <div className="text-xs font-bold text-blue-900">4. Agradecimento e Fidelização</div>
                  <div className="mt-0.5 text-[11px] text-blue-700 leading-tight">
                    "Agradecemos pela confiança de trazer o {messageModalPet.petName} hoje..."
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
