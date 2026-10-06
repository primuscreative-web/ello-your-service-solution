import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import {
  Users,
  UserPlus,
  CalendarDays,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Edit3,
  Trash2,
  Copy,
  Search,
  X,
  AlertCircle,
  Briefcase,
  Check,
} from "lucide-react";
import {
  PageTitle,
  Field,
  SurfaceCard,
  StatusBadge,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
  ghostButtonClass,
} from "@/components/localhub/ui";
import {
  useLocalHub,
  type StaffMember,
  type BusinessOpeningHours,
} from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/profissionais")({
  component: StudioProfissionaisPage,
});

const weekDays = [
  ["1", "Segunda-feira", "Seg"],
  ["2", "Terça-feira", "Ter"],
  ["3", "Quarta-feira", "Qua"],
  ["4", "Quinta-feira", "Qui"],
  ["5", "Sexta-feira", "Sex"],
  ["6", "Sábado", "Sáb"],
  ["7", "Domingo", "Dom"],
] as const;

const defaultStaffHours: BusinessOpeningHours = {
  "1": { open: "09:00", close: "18:00", closed: false },
  "2": { open: "09:00", close: "18:00", closed: false },
  "3": { open: "09:00", close: "18:00", closed: false },
  "4": { open: "09:00", close: "18:00", closed: false },
  "5": { open: "09:00", close: "18:00", closed: false },
  "6": { open: "09:00", close: "14:00", closed: false },
  "7": { open: "09:00", close: "18:00", closed: true },
};

function StudioProfissionaisPage() {
  const { business, staff, saveStaff, removeStaff, bookings } = useLocalHub();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "access">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<StaffMember | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formRegistrationLabel, setFormRegistrationLabel] = useState("");
  const [formRegistrationNumber, setFormRegistrationNumber] = useState("");
  const [formAccessEmail, setFormAccessEmail] = useState("");
  const [formWeeklyHours, setFormWeeklyHours] = useState<BusinessOpeningHours>(defaultStaffHours);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const businessHours = business?.openingHours ?? defaultStaffHours;

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.specialty.toLowerCase().includes(query) ||
        (member.accessEmail && member.accessEmail.toLowerCase().includes(query)) ||
        (member.registrationNumber && member.registrationNumber.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (statusFilter === "active") return member.active;
      if (statusFilter === "paused") return !member.active;
      if (statusFilter === "access") return Boolean(member.accessEmail);
      return true;
    });
  }, [staff, search, statusFilter]);

  // KPIs
  const totalStaff = staff.length;
  const activeStaffCount = staff.filter((m) => m.active).length;
  const staffWithAccessCount = staff.filter((m) => Boolean(m.accessEmail)).length;
  const staffBookingsCount = bookings.filter((b) => Boolean(b.staffId)).length;

  function openCreateModal() {
    setEditingMember(null);
    setFormName("");
    setFormSpecialty("");
    setFormRegistrationLabel("");
    setFormRegistrationNumber("");
    setFormAccessEmail("");
    setFormWeeklyHours(businessHours);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(member: StaffMember) {
    setEditingMember(member);
    setFormName(member.name);
    setFormSpecialty(member.specialty ?? "");
    setFormRegistrationLabel(member.registrationLabel ?? "");
    setFormRegistrationNumber(member.registrationNumber ?? "");
    setFormAccessEmail(member.accessEmail ?? "");
    setFormWeeklyHours(member.weeklyHours ?? businessHours);
    setFormError("");
    setModalOpen(true);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formName.trim()) {
      setFormError("Informe o nome do profissional.");
      return;
    }

    // Validate hours
    const invalidDay = Object.entries(formWeeklyHours).find(
      ([, hours]) => !hours.closed && (!hours.open || !hours.close || hours.close <= hours.open),
    );
    if (invalidDay) {
      setFormError("Confira os horários: o fim do expediente deve ser posterior ao início.");
      return;
    }

    setFormSaving(true);
    setFormError("");

    try {
      await saveStaff({
        id: editingMember?.id,
        name: formName.trim(),
        specialty: formSpecialty.trim(),
        registrationLabel: formRegistrationLabel.trim() || undefined,
        registrationNumber: formRegistrationNumber.trim() || undefined,
        accessEmail: formAccessEmail.trim() || undefined,
        avatarUrl: editingMember?.avatarUrl ?? null,
        weeklyHours: formWeeklyHours,
        blockedDates: editingMember?.blockedDates ?? [],
        active: editingMember ? editingMember.active : true,
      });

      setModalOpen(false);
      showFeedback(
        editingMember
          ? `Profissional "${formName}" atualizado com sucesso!`
          : `Profissional "${formName}" cadastrado com sucesso!`,
      );
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Não foi possível salvar o profissional.",
      );
    } finally {
      setFormSaving(false);
    }
  }

  async function handleToggleStatus(member: StaffMember) {
    try {
      await saveStaff({
        ...member,
        active: !member.active,
      });
      showFeedback(
        !member.active
          ? `Agenda de ${member.name} reativada.`
          : `Agenda de ${member.name} pausada temporariamente.`,
      );
    } catch (caught) {
      alert(
        caught instanceof Error
          ? caught.message
          : "Não foi possível alterar o status do profissional.",
      );
    }
  }

  async function handleDelete(member: StaffMember) {
    try {
      await removeStaff(member.id);
      setDeleteConfirmMember(null);
      showFeedback(`Profissional "${member.name}" removido.`);
    } catch (caught) {
      alert(
        caught instanceof Error ? caught.message : "Não foi possível remover o profissional.",
      );
    }
  }

  function handleCopyInvite(member: StaffMember) {
    if (!member.accessEmail) return;
    const inviteText = `Olá ${member.name}! Você tem acesso à sua agenda no ELLO para o negócio ${business?.name ?? "nosso espaço"}. Acesse https://ello.com.br/studio/agenda entrando com o seu e-mail cadastrado (${member.accessEmail}).`;
    void navigator.clipboard.writeText(inviteText);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function showFeedback(msg: string) {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  }

  function applyPresetHours(type: "commercial" | "extended" | "copyFirst") {
    if (type === "copyFirst") {
      const firstDay = formWeeklyHours["1"] ?? { open: "09:00", close: "18:00", closed: false };
      const updated: BusinessOpeningHours = {};
      weekDays.forEach(([day]) => {
        updated[day] = { ...firstDay };
      });
      setFormWeeklyHours(updated);
      return;
    }

    if (type === "commercial") {
      setFormWeeklyHours({
        "1": { open: "09:00", close: "18:00", closed: false },
        "2": { open: "09:00", close: "18:00", closed: false },
        "3": { open: "09:00", close: "18:00", closed: false },
        "4": { open: "09:00", close: "18:00", closed: false },
        "5": { open: "09:00", close: "18:00", closed: false },
        "6": { open: "09:00", close: "14:00", closed: false },
        "7": { open: "09:00", close: "18:00", closed: true },
      });
    } else {
      setFormWeeklyHours({
        "1": { open: "08:00", close: "20:00", closed: false },
        "2": { open: "08:00", close: "20:00", closed: false },
        "3": { open: "08:00", close: "20:00", closed: false },
        "4": { open: "08:00", close: "20:00", closed: false },
        "5": { open: "08:00", close: "20:00", closed: false },
        "6": { open: "09:00", close: "18:00", closed: false },
        "7": { open: "09:00", close: "14:00", closed: true },
      });
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Toast feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header */}
      <PageTitle
        eyebrow="Equipe e Especialistas"
        title="Profissionais"
        description="Cadastre membros da equipe, personalize horários de atendimento, defina especialidades e gerencie o acesso individual à agenda."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/studio/agenda"
              className={secondaryButtonClass}
            >
              <CalendarDays size={16} /> Ver agenda geral
            </Link>
            <button
              type="button"
              onClick={openCreateModal}
              className={primaryButtonClass}
            >
              <UserPlus size={16} /> Novo profissional
            </button>
          </div>
        }
      />

      {/* Metrics overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SurfaceCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total na equipe
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-[#edf0e5] text-[#586341]">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-[#292b25]">{totalStaff}</span>
            <span className="text-xs text-slate-500">
              {totalStaff === 1 ? "membro cadastrado" : "membros cadastrados"}
            </span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Agendas ativas
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-emerald-800">
              {activeStaffCount}
            </span>
            <span className="text-xs text-slate-500">recebendo agendamentos</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Acesso individual
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-blue-800">
              {staffWithAccessCount}
            </span>
            <span className="text-xs text-slate-500">com login na agenda</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Atendimentos
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <CalendarDays size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-[#292b25]">
              {staffBookingsCount}
            </span>
            <span className="text-xs text-slate-500">agendamentos atribuídos</span>
          </div>
        </SurfaceCard>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#dedfd6]/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, especialidade ou e-mail..."
            className={`${inputClass} pl-10 !py-2 text-xs sm:text-sm`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-[#292b25] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({totalStaff})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "active"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Ativos ({activeStaffCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paused")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "paused"
                ? "bg-stone-700 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Pausados ({totalStaff - activeStaffCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("access")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "access"
                ? "bg-blue-700 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Com Login ({staffWithAccessCount})
          </button>
        </div>
      </div>

      {/* Professionals list */}
      {filteredStaff.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredStaff.map((member) => {
            const memberBookings = bookings.filter((b) => b.staffId === member.id);
            const activeBookings = memberBookings.filter(
              (b) => !["completed", "cancelled"].includes(b.status),
            ).length;
            const completedBookings = memberBookings.filter((b) => b.status === "completed").length;

            // Compute open days count
            const hours = member.weeklyHours ?? businessHours;
            const openDays = weekDays.filter(([dayKey]) => !hours[dayKey]?.closed);

            return (
              <SurfaceCard
                key={member.id}
                className="flex flex-col justify-between transition-all duration-200 hover:border-[#c2c5b6] hover:shadow-md"
              >
                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="size-13 rounded-2xl object-cover ring-2 ring-slate-100"
                        />
                      ) : (
                        <span className="grid size-13 place-items-center rounded-2xl bg-gradient-to-br from-[#edf0e5] to-[#d6dcce] font-display text-lg font-bold text-[#454e33] shadow-inner">
                          {member.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h3 className="font-semibold text-[#292b25] text-base leading-tight">
                          {member.name}
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {member.specialty || "Atendimento geral"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={member.active ? "active" : "neutral"}
                      label={member.active ? "Ativo" : "Pausado"}
                    />
                  </div>

                  {/* Badges row */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {member.registrationLabel && member.registrationNumber && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        <Briefcase size={11} />
                        {member.registrationLabel} {member.registrationNumber}
                      </span>
                    )}

                    {member.accessEmail ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        <ShieldCheck size={11} />
                        Login próprio
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                        Sem login individual
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <Clock size={11} />
                      {openDays.length} {openDays.length === 1 ? "dia/sem" : "dias/sem"}
                    </span>
                  </div>

                  {/* Info details */}
                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Atendimentos:</span>
                      <span className="font-semibold text-slate-800">
                        {activeBookings} em aberto · {completedBookings} concluídos
                      </span>
                    </div>

                    {member.accessEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">E-mail de acesso:</span>
                        <span className="font-mono text-[11px] font-medium text-slate-700 truncate max-w-[170px]" title={member.accessEmail}>
                          {member.accessEmail}
                        </span>
                      </div>
                    )}

                    <div className="pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500">
                        {openDays.length > 0
                          ? `Atende: ${openDays.map(([, , short]) => short).join(", ")}`
                          : "Nenhum dia aberto na semana"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className={ghostButtonClass + " !px-2.5 !py-1 text-xs"}
                      title="Editar dados e horários"
                    >
                      <Edit3 size={14} /> Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(member)}
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                        member.active
                          ? "text-amber-700 hover:bg-amber-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                      title={member.active ? "Pausar agendamentos" : "Reativar agendamentos"}
                    >
                      {member.active ? (
                        <>
                          <PauseCircle size={14} /> Pausar
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} /> Ativar
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {member.accessEmail && (
                      <button
                        type="button"
                        onClick={() => handleCopyInvite(member)}
                        className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                        title="Copiar convite com instruções de login"
                      >
                        {copiedId === member.id ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmMember(member)}
                      className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Excluir profissional"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      ) : (
        <SurfaceCard className="py-14 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#edf0e5] text-[#586341]">
            <Users size={32} />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold text-[#292b25]">
            {search || statusFilter !== "all"
              ? "Nenhum profissional encontrado para os filtros selecionados"
              : "Nenhum profissional cadastrado na sua equipe"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {search || statusFilter !== "all"
              ? "Tente limpar a busca ou mudar o filtro de status para ver os membros cadastrados."
              : "Cadastre profissionais para que seus clientes possam escolher com quem agendar e cada membro da equipe possa acompanhar sua própria agenda."}
          </p>
          <div className="mt-6">
            {search || statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className={secondaryButtonClass}
              >
                Limpar filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className={primaryButtonClass}
              >
                <UserPlus size={16} /> Cadastrar primeiro profissional
              </button>
            )}
          </div>
        </SurfaceCard>
      )}

      {/* Modal / Dialog for Create & Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#edf0e5] text-[#586341]">
                <Users size={22} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#292b25]">
                  {editingMember ? "Editar profissional" : "Novo profissional"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingMember
                    ? "Atualize os dados, horários de atendimento ou e-mail de acesso."
                    : "Preencha as informações para adicionar um novo membro à sua equipe."}
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
              {/* Personal data */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dados do profissional
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo *">
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex.: Carolina Silva"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Especialidade / Função">
                    <input
                      type="text"
                      maxLength={80}
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      placeholder="Ex.: Manicure, Nail art, Cabeleireira"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Conselho ou registro (opcional)" hint="Ex.: CRM, CRP, CRN, CFT">
                    <input
                      type="text"
                      maxLength={24}
                      value={formRegistrationLabel}
                      onChange={(e) => setFormRegistrationLabel(e.target.value)}
                      placeholder="Ex.: CRP"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Número do registro (opcional)" hint="Exibido na página pública para credibilidade">
                    <input
                      type="text"
                      maxLength={40}
                      value={formRegistrationNumber}
                      onChange={(e) => setFormRegistrationNumber(e.target.value)}
                      placeholder="Ex.: 06/123456"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              {/* Individual access */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-700" />
                  <h3 className="text-sm font-bold text-blue-900">
                    Acesso exclusivo à agenda (Login individual)
                  </h3>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Informe o e-mail que o profissional usará para entrar na ELLO. Ao fazer login, ele terá acesso direto e exclusivo à sua própria lista de clientes e atendimentos.
                </p>
                <Field label="E-mail de login do profissional">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      maxLength={254}
                      value={formAccessEmail}
                      onChange={(e) => setFormAccessEmail(e.target.value)}
                      placeholder="profissional@exemplo.com"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
              </div>

              {/* Weekly schedule */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Horários de atendimento na semana
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina os dias e turnos em que este profissional atende clientes.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetHours("commercial")}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Padrão 09h-18h
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetHours("copyFirst")}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                      title="Copiar horário de segunda para todos os dias"
                    >
                      Copiar Seg para todos
                    </button>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
                  {weekDays.map(([dayKey, dayLabel]) => {
                    const hours = formWeeklyHours[dayKey] ?? {
                      open: "09:00",
                      close: "18:00",
                      closed: false,
                    };

                    return (
                      <div
                        key={dayKey}
                        className={`grid items-center gap-3 rounded-xl border p-2.5 transition sm:grid-cols-[130px_auto_1fr_1fr] ${
                          hours.closed
                            ? "border-slate-200 bg-slate-100/60 text-slate-400"
                            : "border-slate-200 bg-white text-slate-700 shadow-2xs"
                        }`}
                      >
                        <span className="text-xs font-semibold">{dayLabel}</span>

                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!hours.closed}
                            onChange={(e) =>
                              setFormWeeklyHours((curr) => ({
                                ...curr,
                                [dayKey]: { ...hours, closed: !e.target.checked },
                              }))
                            }
                            className="size-4 rounded accent-[#586341]"
                          />
                          <span>{hours.closed ? "Folga" : "Atende"}</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Início:</span>
                          <input
                            type="time"
                            disabled={hours.closed}
                            value={hours.open}
                            onChange={(e) =>
                              setFormWeeklyHours((curr) => ({
                                ...curr,
                                [dayKey]: { ...hours, open: e.target.value },
                              }))
                            }
                            className="w-full min-h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium disabled:opacity-40"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Fim:</span>
                          <input
                            type="time"
                            disabled={hours.closed}
                            value={hours.close}
                            onChange={(e) =>
                              setFormWeeklyHours((curr) => ({
                                ...curr,
                                [dayKey]: { ...hours, close: e.target.value },
                              }))
                            }
                            className="w-full min-h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-medium disabled:opacity-40"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={secondaryButtonClass}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className={primaryButtonClass}
                >
                  {formSaving ? "Salvando..." : editingMember ? "Salvar alterações" : "Adicionar à equipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle size={20} />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Remover profissional</h3>
                <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Deseja realmente remover <strong>{deleteConfirmMember.name}</strong> da equipe? Os
              agendamentos já realizados continuarão no histórico, mas novos agendamentos não
              poderão ser atribuídos.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(deleteConfirmMember)}
                className={dangerButtonClass}
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
