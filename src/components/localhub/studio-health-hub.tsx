import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  HeartPulse,
  Stethoscope,
  CalendarDays,
  FileText,
  User,
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
  AlertCircle,
  Pill,
  Activity,
  Printer,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";

export type PatientSessionStage = "waiting" | "in_consultation" | "completed";

export type PatientRecord = {
  id: string;
  name: string;
  phone: string;
  birthDate?: string;
  chiefComplaint: string;
  alerts: string[];
  currentSession: number;
  totalSessions: number;
  stage: PatientSessionStage;
  scheduledTime: string;
  consultationFee: number;
  lastEvolutionNotes?: string;
};

const INITIAL_HEALTH_PATIENTS: PatientRecord[] = [
  {
    id: "pat-1",
    name: "Helena Moreira",
    phone: "11988887777",
    birthDate: "1988-04-12",
    chiefComplaint: "Lombalgia crônica com irradiação para membro inferior esquerdo",
    alerts: ["Hipertensa", "Alérgica a Dipirona"],
    currentSession: 4,
    totalSessions: 10,
    stage: "in_consultation",
    scheduledTime: "14:00",
    consultationFee: 180,
    lastEvolutionNotes: "Paciente relata redução da dor de 8/10 para 4/10 após exercícios de estabilização lombo-pélvica.",
  },
  {
    id: "pat-2",
    name: "Rodrigo Sanches",
    phone: "11977776666",
    birthDate: "1994-09-21",
    chiefComplaint: "Acompanhamento nutricional para hipertrofia e exames de rotina",
    alerts: ["Intolerante a lactose"],
    currentSession: 2,
    totalSessions: 4,
    stage: "waiting",
    scheduledTime: "15:00",
    consultationFee: 220,
    lastEvolutionNotes: "Ajuste na ingestão calórica diária (+300 kcal) e distribuição de proteínas.",
  },
  {
    id: "pat-3",
    name: "Beatriz Oliveira",
    phone: "11966665555",
    chiefComplaint: "Sessão de psicoterapia - ansiedade e transição de carreira",
    alerts: ["Primeira consulta com retorno"],
    currentSession: 1,
    totalSessions: 1,
    stage: "waiting",
    scheduledTime: "16:15",
    consultationFee: 190,
  },
];

const CLINICAL_ALERT_TAGS = [
  "⚠️ Hipertenso(a)",
  "⚠️ Diabético(a)",
  "🌸 Alérgico(a) a medicamentos",
  "💊 Uso contínuo de anticoagulante",
  "🤰 Gestante / Lactante",
  "🫀 Cardiopata",
  "🩸 Exames pendentes",
  "🔍 Primeira consulta",
];

export function StudioHealthHub() {
  const { business } = useLocalHub();
  const [activeTab, setActiveTab] = useState<"patients" | "receipt" | "guidelines">("patients");

  const storageKey = `ello_health_hub_records_${business?.id || "default"}`;

  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_HEALTH_PATIENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(patients));
    } catch {
      // ignore
    }
  }, [patients, storageKey]);

  // Modal Novo Paciente
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newComplaint, setNewComplaint] = useState("");
  const [newSelectedAlerts, setNewSelectedAlerts] = useState<string[]>([]);
  const [newTotalSessions, setNewTotalSessions] = useState("1");
  const [newScheduledTime, setNewScheduledTime] = useState("14:00");
  const [newFee, setNewFee] = useState("180");

  // Modal Evolução Clínica
  const [evolutionPatient, setEvolutionPatient] = useState<PatientRecord | null>(null);
  const [evolutionText, setEvolutionText] = useState("");

  // Gerador de Recibo / Declaração
  const [recPatientName, setRecPatientName] = useState("");
  const [recCpf, setRecCpf] = useState("");
  const [recDate, setRecDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recTime, setRecTime] = useState("14:00 às 15:00");
  const [recService, setRecService] = useState("Consulta & Atendimento Terapêutico");
  const [recAmount, setRecAmount] = useState("180,00");
  const [recDocType, setRecDocType] = useState<"declaration" | "receipt">("receipt");
  const [recProfessionalRegister, setRecProfessionalRegister] = useState("");

  // Disparo WhatsApp
  const [messagePatient, setMessagePatient] = useState<PatientRecord | null>(null);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Informe nome e WhatsApp do paciente.");
      return;
    }

    const newRecord: PatientRecord = {
      id: `pat-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.replace(/\D/g, ""),
      chiefComplaint: newComplaint.trim() || "Consulta geral de rotina",
      alerts: newSelectedAlerts,
      currentSession: 1,
      totalSessions: Number(newTotalSessions) || 1,
      stage: "waiting",
      scheduledTime: newScheduledTime || "14:00",
      consultationFee: Number(newFee) || 180,
    };

    setPatients((prev) => [newRecord, ...prev]);
    toast.success(`🩺 ${newName} adicionado aos atendimentos!`);

    setNewName("");
    setNewPhone("");
    setNewComplaint("");
    setNewSelectedAlerts([]);
    setShowAddModal(false);
  };

  const advanceSession = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const nextCurrent = p.currentSession < p.totalSessions ? p.currentSession + 1 : p.currentSession;
        const isFinished = p.currentSession >= p.totalSessions;
        return {
          ...p,
          currentSession: nextCurrent,
          stage: isFinished ? "completed" : "in_consultation",
        };
      }),
    );
    toast.success("Sessão computada com sucesso!");
  };

  const saveEvolution = (patientId: string) => {
    if (!evolutionText.trim()) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return { ...p, lastEvolutionNotes: evolutionText.trim() };
      }),
    );
    toast.success("Evolução clínica registrada no histórico!");
    setEvolutionPatient(null);
    setEvolutionText("");
  };

  const getWhatsAppUrl = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.length === 10 || clean.length === 11 ? `55${clean}` : clean;
    return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
  };

  const generateReceiptText = () => {
    const bizName = business?.name || "Consultório / Clínica";
    const dateFormatted = recDate.split("-").reverse().join("/");

    if (recDocType === "declaration") {
      return (
        `📋 *DECLARAÇÃO DE COMPARECIMENTO*\n\n` +
        `Declaramos para os devidos fins que o(a) paciente *${recPatientName || "Nome do Paciente"}*${recCpf ? `, inscrito(a) no CPF ${recCpf},` : ""} compareceu a este estabelecimento no dia *${dateFormatted}*, no horário de *${recTime}*, para realização de *${recService}*.\n\n` +
        `🏛️ *Local:* ${bizName}\n` +
        `${recProfessionalRegister ? `🩺 *Registro Profissional:* ${recProfessionalRegister}\n` : ""}` +
        `Data de emissão: ${dateFormatted}`
      );
    }

    return (
      `🧾 *RECIBO DE PAGAMENTO DE SERVIÇOS DE SAÚDE*\n\n` +
      `Recebi de *${recPatientName || "Nome do Paciente"}*${recCpf ? ` (CPF: ${recCpf})` : ""} a quantia de *R$ ${recAmount}* referente à realização de *${recService}* em *${dateFormatted}*.\n\n` +
      `🩺 *Prestador:* ${bizName}\n` +
      `${recProfessionalRegister ? `📜 *Registro Profissional:* ${recProfessionalRegister}\n` : ""}` +
      `🔑 *Status:* Pagamento Confirmado via Pix / Transferência.`
    );
  };

  const copyReceipt = async () => {
    await navigator.clipboard.writeText(generateReceiptText());
    toast.success("Documento copiado para a área de transferência!");
  };

  return (
    <div className="rounded-2xl border border-[#d9ddcf] bg-white p-5 shadow-xs sm:p-7">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-teal-100 text-teal-800 shadow-xs">
              <HeartPulse size={20} strokeWidth={2.4} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#292b25]">
                Central Clínica & Gestão de Consultas
              </h2>
              <p className="text-xs text-slate-500">
                Atendimento pontual, controle de pacotes de sessões, declarações de comparecimento e recibos médicos/terapêuticos.
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex rounded-xl bg-[#edf0e5] p-1 text-xs font-bold text-[#586341]">
          <button
            type="button"
            onClick={() => setActiveTab("patients")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "patients"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope size={14} />
            <span>Pacientes do Dia ({patients.filter((p) => p.stage !== "completed").length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "receipt"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt size={14} />
            <span>Recibos & Declaração</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guidelines")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              activeTab === "guidelines"
                ? "bg-white text-[#292b25] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Share2 size={14} />
            <span>Orientações Pré-Consulta</span>
          </button>
        </div>
      </div>

      {/* ABA 1: PACIENTES DO DIA & PRONTUÁRIO ÁGIL */}
      {activeTab === "patients" && (
        <div className="mt-6 space-y-5">
          {/* BARRA SUPERIOR DE RESUMO */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                {patients.filter((p) => p.stage === "in_consultation").length} em atendimento agora
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="size-2 rounded-full bg-amber-500" />
                {patients.filter((p) => p.stage === "waiting").length} aguardando horário
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" />
                {patients.filter((p) => p.stage === "completed").length} finalizados hoje
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/studio/agenda"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <CalendarDays size={13} />
                <span>Ver Agenda Geral</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#292b25] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#414339] active:scale-95"
              >
                <Plus size={14} />
                <span>Adicionar Paciente do Dia</span>
              </button>
            </div>
          </div>

          {/* LISTAGEM DE CARDS CLÍNICOS DOS PACIENTES */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((pat) => {
              const isFinished = pat.stage === "completed";
              const isInSession = pat.stage === "in_consultation";

              return (
                <div
                  key={pat.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 shadow-xs transition hover:shadow-sm ${
                    isInSession
                      ? "border-blue-300 bg-blue-50/30 ring-1 ring-blue-300"
                      : isFinished
                        ? "border-slate-200 bg-slate-50/50 opacity-80"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <div>
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">
                          {pat.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {pat.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock size={11} /> {pat.scheduledTime}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isInSession
                            ? "bg-blue-100 text-blue-800"
                            : isFinished
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isInSession ? "Em Consulta" : isFinished ? "Concluído" : "Aguardando"}
                      </span>
                    </div>

                    {/* Queixa Principal */}
                    <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-700 leading-relaxed border border-slate-100">
                      <span className="font-bold text-slate-900">Queixa: </span>
                      {pat.chiefComplaint}
                    </div>

                    {/* Alertas Médicos / Alergias */}
                    {pat.alerts.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {pat.alerts.map((alert, i) => (
                          <span
                            key={i}
                            className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200"
                          >
                            {alert}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Controle de Sessões / Pacote */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium">Pacote: </span>
                        <span className="font-bold text-teal-800">
                          Sessão {pat.currentSession} de {pat.totalSessions}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800">
                        R$ {pat.consultationFee.toFixed(2).replace(".", ",")}
                      </div>
                    </div>

                    {/* Última anotação de evolução */}
                    {pat.lastEvolutionNotes && (
                      <div className="mt-2 text-[10px] text-slate-500 italic bg-white/80 p-2 rounded border border-slate-100 line-clamp-2">
                        "{pat.lastEvolutionNotes}"
                      </div>
                    )}
                  </div>

                  {/* Ações do Card Clínico */}
                  <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setMessagePatient(pat)}
                      title="Chamar no WhatsApp com lembretes/orientações"
                      className="flex size-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                    >
                      <MessageCircle size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEvolutionPatient(pat);
                        setEvolutionText(pat.lastEvolutionNotes || "");
                      }}
                      title="Registrar evolução clínica da sessão"
                      className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95"
                    >
                      <FileText size={13} />
                    </button>

                    {!isFinished ? (
                      <button
                        type="button"
                        onClick={() => advanceSession(pat.id)}
                        className="flex-1 rounded-lg bg-[#292b25] py-1 text-[11px] font-bold text-white transition hover:bg-[#414339] active:scale-95 text-center truncate px-2"
                      >
                        {pat.currentSession < pat.totalSessions
                          ? `Concluir Sessão ${pat.currentSession} ➔`
                          : "Finalizar Pacote ✅"}
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-[11px] font-semibold text-emerald-700">
                        Atendimento Finalizado
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setPatients((prev) => prev.filter((p) => p.id !== pat.id));
                        toast.info("Paciente removido da lista do dia.");
                      }}
                      className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: EMISSOR DE RECIBO & DECLARAÇÃO DE COMPARECIMENTO */}
      {activeTab === "receipt" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Emissão Rápida de Documentos Clínicos</h3>
              <p className="text-xs text-slate-500">
                Gere recibos para reembolso de convênios médicos ou declarações de comparecimento para pacientes.
              </p>
            </div>

            {/* Tipo de Documento */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecDocType("receipt")}
                className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                  recDocType === "receipt"
                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                🧾 Recibo de Pagamento (Reembolso)
              </button>
              <button
                type="button"
                onClick={() => setRecDocType("declaration")}
                className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                  recDocType === "declaration"
                    ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                📋 Declaração de Comparecimento
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nome do Paciente *</label>
                <input
                  type="text"
                  placeholder="Ex: Mariana Silveira"
                  value={recPatientName}
                  onChange={(e) => setRecPatientName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">CPF do Paciente</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={recCpf}
                  onChange={(e) => setRecCpf(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Data do Atendimento</label>
                <input
                  type="date"
                  value={recDate}
                  onChange={(e) => setRecDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Horário / Período</label>
                <input
                  type="text"
                  placeholder="Ex: 14:00 às 15:00"
                  value={recTime}
                  onChange={(e) => setRecTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Procedimento / Consulta</label>
                <input
                  type="text"
                  value={recService}
                  onChange={(e) => setRecService(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">
                  {recDocType === "receipt" ? "Valor Cobrado (R$)" : "Registro Profissional"}
                </label>
                {recDocType === "receipt" ? (
                  <input
                    type="text"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Ex: CRM/CRN/CRP 12345/SP"
                    value={recProfessionalRegister}
                    onChange={(e) => setRecProfessionalRegister(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                  />
                )}
              </div>
            </div>

            {recDocType === "receipt" && (
              <div>
                <label className="text-xs font-bold text-slate-700">Registro Profissional (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: CRM 123456 / CRN-3 45678"
                  value={recProfessionalRegister}
                  onChange={(e) => setRecProfessionalRegister(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                />
              </div>
            )}
          </div>

          {/* PRÉVIA DO DOCUMENTO */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d9ddcf] bg-[#fbfdf7] p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
                <Receipt size={15} />
                <span>Prévia do Documento Oficial</span>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap shadow-2xs">
                {generateReceiptText()}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#e1e5d8]">
              <button
                type="button"
                onClick={() => void copyReceipt()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#292b25] py-2.5 text-xs font-bold text-white transition hover:bg-[#414339] active:scale-98 shadow-xs"
              >
                <Copy size={14} />
                <span>Copiar Documento Formatado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: ORIENTAÇÕES PRÉ-CONSULTA & MODELOS */}
      {activeTab === "guidelines" && (
        <div className="mt-6 max-w-3xl mx-auto space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-sm font-bold text-slate-900">
              Templates de Mensagens Pré-Consulta para WhatsApp
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reduza o no-show e garanta que o paciente chegue com o preparo necessário para a consulta.
            </p>
          </div>

          {[
            {
              title: "1. Confirmação de Horário & Localização (Google Maps)",
              desc: "Enviado 24 horas antes com endereço, orientações de estacionamento e link do mapa.",
              text: (name: string) =>
                `Olá, ${name}! 👋 Passando para confirmar sua consulta amanhã às [Horário] no *${business?.name || "nosso consultório"}*.\n\n📍 *Endereço:* ${business?.address || "Consulte nosso endereço"}\n🚗 *Dica de chegada:* Recomendamos chegar com 10 minutos de antecedência para preenchimento de ficha.\n\nPor favor, responda com *SIM* para confirmar sua presença!`,
            },
            {
              title: "2. Preparo & Jejum para Exames / Avaliação Física",
              desc: "Orientações nutricionais ou médicas que exigem roupas confortáveis ou exames anteriores.",
              text: (name: string) =>
                `Olá, ${name}! 📋 Seguem as instruções para sua avaliação:\n\n1. Roupas confortáveis para avaliação física;\n2. Traga exames laboratoriais ou de imagem recentes;\n3. Evite cafeína ou refeições muito pesadas 2h antes do atendimento.\n\nQualquer dúvida antes da consulta, estamos à total disposição!`,
            },
            {
              title: "3. Retorno Clínico Programado (Aviso de 30/60 dias)",
              desc: "Reativação de pacientes que precisam de acompanhamento periódico.",
              text: (name: string) =>
                `Olá, ${name}! Como você está? ❤️\nPassando para lembrar que já completamos o período recomendado para o seu retorno de acompanhamento no *${business?.name || "nosso consultório"}*.\n\nPodemos verificar os melhores horários disponíveis para a sua próxima sessão esta semana?`,
            },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(item.text("Mariana"));
                    toast.success("Modelo copiado para a área de transferência!");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
                >
                  <Copy size={12} /> Copiar
                </button>
              </div>
              <div className="mt-2.5 rounded-lg bg-slate-50 p-3 text-[11px] font-mono text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                {item.text("Nome do Paciente")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NOVO PACIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[26px] border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-teal-100 text-teal-800">
                  <Stethoscope size={16} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Novo Paciente do Dia</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome do Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clara Ribeiro"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="DDD + Número"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Queixa Principal / Motivo da Consulta</label>
                <input
                  type="text"
                  placeholder="Ex: Acompanhamento nutricional, cefaleia frequente, reabilitação"
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Alertas Clínicos */}
              <div>
                <label className="text-xs font-bold text-slate-700">Alertas Clínicos & Condições</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CLINICAL_ALERT_TAGS.map((tag) => {
                    const isSelected = newSelectedAlerts.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setNewSelectedAlerts((prev) =>
                            isSelected ? prev.filter((t) => t !== tag) : [...prev, tag],
                          )
                        }
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition ${
                          isSelected
                            ? "bg-rose-50 border-rose-300 text-rose-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Horário</label>
                  <input
                    type="time"
                    value={newScheduledTime}
                    onChange={(e) => setNewScheduledTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Total de Sessões</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTotalSessions}
                    onChange={(e) => setNewTotalSessions(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Valor (R$)</label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
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
                  Confirmar Paciente 🩺
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EVOLUÇÃO CLÍNICA */}
      {evolutionPatient && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[26px] border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Evolução Clínica: {evolutionPatient.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sessão {evolutionPatient.currentSession} de {evolutionPatient.totalSessions}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvolutionPatient(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <label className="text-xs font-bold text-slate-700">Anotações da Sessão Atual:</label>
              <textarea
                rows={4}
                value={evolutionText}
                onChange={(e) => setEvolutionText(e.target.value)}
                placeholder="Descreva a evolução do quadro, conduta terapêutica, respostas a testes ou alterações no plano..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEvolutionPatient(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveEvolution(evolutionPatient.id)}
                className="rounded-xl bg-teal-700 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-teal-800"
              >
                Salvar Evolução 💾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DISPARO WHATSAPP */}
      {messagePatient && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[26px] border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Enviar Mensagem para {messagePatient.name}
                </h3>
                <p className="text-[11px] text-slate-500">WhatsApp: {messagePatient.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setMessagePatient(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const msg = `Olá ${messagePatient.name}! 👋 Confirmamos sua consulta no dia de hoje às *${messagePatient.scheduledTime}* no *${business?.name || "nosso consultório"}*.\n\nRecomendamos chegar com 10 minutos de antecedência. Estamos aguardando você! ❤️`;
                  window.open(getWhatsAppUrl(messagePatient.phone, msg), "_blank");
                  setMessagePatient(null);
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-left transition hover:bg-teal-100/60"
              >
                <span className="text-base">⏰</span>
                <div>
                  <div className="text-xs font-bold text-teal-900">Lembrete de Horário Hoje</div>
                  <div className="mt-0.5 text-[11px] text-teal-700 leading-tight">
                    "Confirmamos sua consulta às {messagePatient.scheduledTime}. Recomendamos chegar com 10 min de antecedência..."
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = `Olá ${messagePatient.name}! Passando para agradecer pela sua sessão hoje no *${business?.name || "nosso consultório"}*.\n\nQualquer dúvida sobre as orientações da consulta estamos à disposição. Bom descanso! ❤️`;
                  window.open(getWhatsAppUrl(messagePatient.phone, msg), "_blank");
                  setMessagePatient(null);
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-left transition hover:bg-blue-100/60"
              >
                <span className="text-base">❤️</span>
                <div>
                  <div className="text-xs font-bold text-blue-900">Pós-Consulta & Cuidados</div>
                  <div className="mt-0.5 text-[11px] text-blue-700 leading-tight">
                    "Passando para agradecer pela sua sessão hoje. Qualquer dúvida estamos à disposição..."
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
