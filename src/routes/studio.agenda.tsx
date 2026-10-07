import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageCircle,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageTitle } from "@/components/localhub/ui";
import { useLocalHub, type Booking } from "@/lib/localhub-context";
import { getBusinessCopy } from "@/lib/localhub-business";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/studio/agenda")({ component: AgendaPage });

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mondayIndex = (date: Date) => (date.getDay() + 6) % 7;

function getWeek(date: Date, offset: number) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - mondayIndex(monday) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function AgendaPage() {
  const {
    bookings,
    waitlist,
    services,
    business,
    staff,
    isStaffAccount,
    ready,
    error,
    getAvailableBookingSlots,
    rescheduleBooking: updateBookingTime,
    setBookingStatus,
    setWaitlistStatus,
    refresh,
  } = useLocalHub();

  if (business && business.category === "alimentacao") {
    return <Navigate to="/studio/pedidos" replace />;
  }

  useEffect(() => {
    if (!business?.id) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;

    // Inscrição em tempo real para novos agendamentos e lista de espera
    const channel = client
      .channel(`studio-agenda-realtime-${business.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "localhub_bookings",
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "localhub_waitlist",
          filter: `business_id=eq.${business.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    // Polling a cada 20 segundos
    const interval = window.setInterval(() => {
      void refresh();
    }, 20_000);

    return () => {
      void client.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [business?.id, refresh]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => mondayIndex(new Date()));
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [waitlistActionError, setWaitlistActionError] = useState("");
  const sorted = useMemo(
    () => [...bookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings],
  );
  const isRestaurant = business?.category === "alimentacao";
  const copy = getBusinessCopy(business?.category);
  const agendaTitle = copy.booking === "atendimento" ? "Agenda" : capitalize(copy.bookings);
  const customerListTitle = capitalize(copy.customers);

  useEffect(() => {
    if (!business?.id || !reschedulingBooking || !rescheduleDate) {
      setRescheduleSlots([]);
      setRescheduleLoading(false);
      return;
    }
    let active = true;
    setRescheduleLoading(true);
    setRescheduleError("");
    void getAvailableBookingSlots(
      business.id,
      reschedulingBooking.serviceId,
      rescheduleDate,
      reschedulingBooking.staffId,
      reschedulingBooking.addonIds,
    )
      .then((slots) => {
        if (active) setRescheduleSlots(slots);
      })
      .catch(() => {
        if (active) {
          setRescheduleSlots([]);
          setRescheduleError("Não foi possível consultar os horários disponíveis.");
        }
      })
      .finally(() => {
        if (active) setRescheduleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [business?.id, getAvailableBookingSlots, rescheduleDate, reschedulingBooking]);

  if (isRestaurant) return <Navigate to="/studio/pedidos" />;

  async function submitReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reschedulingBooking || !rescheduleSlots.includes(rescheduleTime)) {
      setRescheduleError("Escolha uma data e um horário ainda disponíveis.");
      return;
    }
    setRescheduleSaving(true);
    setRescheduleError("");
    try {
      await updateBookingTime(reschedulingBooking.id, rescheduleDate, rescheduleTime);
      setReschedulingBooking(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleSlots([]);
    } catch (caught) {
      setRescheduleError(
        caught instanceof Error ? caught.message : "Não foi possível reagendar este atendimento.",
      );
    } finally {
      setRescheduleSaving(false);
    }
  }
  const week = getWeek(new Date(), weekOffset);
  const activeDate = week[selectedDay];
  const activeDateKey = dateKey(activeDate);
  const selectedBookings = sorted.filter(
    (booking) =>
      booking.date === activeDateKey &&
      booking.status !== "cancelled" &&
      (!selectedPhone || normalizePhone(booking.phone) === selectedPhone),
  );
  const clients = Array.from(
    sorted.reduce((groups, booking) => {
      const key = normalizePhone(booking.phone);
      const existing = groups.get(key);
      if (
        !existing ||
        (booking.date + booking.time).localeCompare(existing.date + existing.time) > 0
      ) {
        groups.set(key, { ...booking, count: (existing?.count ?? 0) + 1 });
      } else {
        existing.count += 1;
      }
      return groups;
    }, new Map<string, Booking & { count: number }>()),
  )
    .map(([key, booking]) => ({ key, booking }))
    .sort((a, b) =>
      (b.booking.date + b.booking.time).localeCompare(a.booking.date + a.booking.time),
    );

  return (
    <>
      <PageTitle
        eyebrow={
          isRestaurant ? "Solicitações" : isStaffAccount ? "Agenda profissional" : "Atendimentos"
        }
        title={
          isRestaurant ? "Solicitações de horário" : isStaffAccount ? "Minha agenda" : agendaTitle
        }
        description={
          isRestaurant
            ? "Consulte as solicitações de horário enviadas pela sua página."
            : isStaffAccount
              ? "Consulte os atendimentos atribuídos a você e atualize seus horários."
              : "Veja seus horários da semana e acompanhe cada cliente em um só lugar."
        }
        action={
          <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            {bookings.filter((item) => item.status === "pending").length} aguardando
          </span>
        }
      />

      {isRestaurant ? (
        <BookingList bookings={sorted} services={services} setBookingStatus={setBookingStatus} />
      ) : !ready ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Carregando sua agenda...
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Sua semana</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {week[0].toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                  {" — "}
                  {week[6].toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((value) => value - 1)}
                  aria-label="Semana anterior"
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeekOffset(0);
                    setSelectedDay(mondayIndex(new Date()));
                    setSelectedPhone(null);
                  }}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((value) => value + 1)}
                  aria-label="Próxima semana"
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
              {week.map((day, index) => {
                const dayCount = sorted.filter(
                  (booking) => booking.date === dateKey(day) && booking.status !== "cancelled",
                ).length;
                const active = selectedDay === index;
                return (
                  <button
                    key={dateKey(day)}
                    type="button"
                    onClick={() => {
                      setSelectedDay(index);
                      setSelectedPhone(null);
                    }}
                    aria-pressed={active}
                    className={`min-w-0 rounded-xl border px-1 py-2.5 text-center transition-colors sm:px-2 ${
                      active
                        ? "border-[#252927] bg-[#252927] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-[10px] font-semibold uppercase sm:text-xs">
                      {day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                    </span>
                    <span className="mt-1 block text-base font-bold sm:text-lg">
                      {day.getDate()}
                    </span>
                    <span
                      className={`mt-1 block text-[9px] sm:text-[10px] ${active ? "text-white/70" : "text-slate-400"}`}
                    >
                      {dayCount} {dayCount === 1 ? "horário" : "horários"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900">
                {activeDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              {selectedPhone && (
                <button
                  type="button"
                  onClick={() => setSelectedPhone(null)}
                  className="text-xs font-semibold text-[#667448] hover:underline"
                >
                  Limpar filtro de cliente
                </button>
              )}
            </div>

            {selectedBookings.length ? (
              <ol className="divide-y divide-slate-100">
                {selectedBookings.map((booking) => (
                  <li key={booking.id} className="flex gap-3 py-4">
                    <div className="flex w-14 shrink-0 items-start gap-1.5 pt-0.5 text-xs font-bold text-slate-700">
                      <Clock3 size={14} className="mt-0.5 text-[#758653]" />
                      {booking.time}–{addMinutesToTime(booking.time, booking.duration)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf0e5] text-xs font-bold text-[#586341]">
                            {booking.customerName.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {booking.customerName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {services.find((service) => service.id === booking.serviceId)?.name ??
                                "Serviço removido"}
                            </p>
                            {business?.category === "saude" && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                {booking.visitType === "follow_up"
                                  ? "Retorno"
                                  : "Primeira consulta"}{" "}
                                ·{" "}
                                {booking.serviceMode === "online"
                                  ? "Teleconsulta"
                                  : booking.serviceMode === "home_visit"
                                    ? "Domiciliar"
                                    : "No consultório"}
                              </p>
                            )}
                            {booking.staffId && (
                              <p className="truncate text-[11px] text-slate-400">
                                {staff.find((member) => member.id === booking.staffId)?.name ??
                                  "Profissional"}
                              </p>
                            )}
                            {booking.addonIds.length > 0 && (
                              <p className="truncate text-[11px] text-slate-400">
                                {booking.addonIds
                                  .map(
                                    (id) =>
                                      services
                                        .find((service) => service.id === booking.serviceId)
                                        ?.addons?.find((addon) => addon.id === id)?.name,
                                  )
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <BookingStatus status={booking.status} />
                      </div>
                      {booking.status !== "cancelled" && (
                        <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                          {/* Ações de status de atendimento */}
                          {booking.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => void setBookingStatus(booking.id, "in_progress")}
                              title="Iniciar atendimento do cliente agora"
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100"
                            >
                              Iniciar atendimento
                            </button>
                          )}
                          {booking.status === "in_progress" && (
                            <button
                              type="button"
                              onClick={() => void setBookingStatus(booking.id, "completed")}
                              title="Finalizar atendimento com sucesso"
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100"
                            >
                              <Check size={12} strokeWidth={2.5} /> Finalizar
                            </button>
                          )}

                          {/* Mensagens rápidas no WhatsApp */}
                          {normalizePhone(booking.phone).length >= 10 && (
                            <>
                              {booking.status === "confirmed" && (
                                <a
                                  href={appointmentReminderUrl(booking, business?.name ?? "")}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Enviar lembrete amigável do horário marcado"
                                  className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
                                >
                                  <MessageCircle size={12} /> Lembrete
                                </a>
                              )}

                              {(booking.status === "in_progress" || booking.status === "confirmed") && (
                                <a
                                  href={appointmentReadyUrl(booking, business?.name ?? "", business?.category)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={business?.category === "pet" ? "Avisar que o pet já está pronto" : "Avisar cliente que o serviço está pronto"}
                                  className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/60 px-2 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                                >
                                  <MessageCircle size={12} /> {business?.category === "pet" ? "Pet pronto 🐾" : "Pronto"}
                                </a>
                              )}

                              {booking.status === "completed" && (
                                <a
                                  href={appointmentThankYouUrl(booking, business?.name ?? "", business?.slug)}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Enviar agradecimento e link de avaliação"
                                  className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  <MessageCircle size={12} /> Agradecer ⭐
                                </a>
                              )}
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingBooking(booking);
                              setRescheduleDate(booking.date);
                              setRescheduleTime("");
                              setRescheduleError("");
                            }}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Reagendar
                          </button>
                        </div>
                      )}
                      {reschedulingBooking?.id === booking.id && (
                        <form
                          onSubmit={(event) => void submitReschedule(event)}
                          className="mt-3 rounded-xl bg-slate-50 p-3"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-[11px] font-semibold text-slate-500">
                              Nova data
                              <input
                                required
                                type="date"
                                min={dateKey(new Date())}
                                value={rescheduleDate}
                                onChange={(event) => {
                                  setRescheduleDate(event.target.value);
                                  setRescheduleTime("");
                                }}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800"
                              />
                            </label>
                            <label className="text-[11px] font-semibold text-slate-500">
                              Novo horário
                              <select
                                required
                                value={rescheduleTime}
                                onChange={(event) => setRescheduleTime(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800"
                              >
                                <option value="">
                                  {rescheduleLoading
                                    ? "Buscando..."
                                    : rescheduleSlots.length
                                      ? "Selecione"
                                      : "Sem horários"}
                                </option>
                                {rescheduleSlots.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          {rescheduleError && (
                            <p role="alert" className="mt-2 text-xs text-red-700">
                              {rescheduleError}
                            </p>
                          )}
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setReschedulingBooking(null)}
                              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                            >
                              Voltar
                            </button>
                            <button
                              type="submit"
                              disabled={
                                rescheduleSaving || rescheduleLoading || !rescheduleSlots.length
                              }
                              className="rounded-lg bg-[#252927] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {rescheduleSaving ? "Salvando..." : "Salvar horário"}
                            </button>
                          </div>
                        </form>
                      )}
                      {booking.status === "pending" && (
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setBookingStatus(booking.id, "cancelled")}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <X size={13} /> Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingStatus(booking.id, "confirmed")}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                          >
                            <Check size={13} /> Confirmar
                          </button>
                        </div>
                      )}
                      {!["pending", "cancelled", "completed", "no_show"].includes(
                        booking.status,
                      ) && (
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          {booking.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => void setBookingStatus(booking.id, "in_progress")}
                              className="rounded-lg border border-sky-200 px-2.5 py-1.5 text-[11px] font-semibold text-sky-800 hover:bg-sky-50"
                            >
                              Iniciar atendimento
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void setBookingStatus(booking.id, "completed")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                          >
                            Concluir
                          </button>
                          <button
                            type="button"
                            onClick={() => void setBookingStatus(booking.id, "no_show")}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Marcar falta
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto text-[#a5b280]" size={26} />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Nenhum horário marcado neste dia
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Os pedidos dos seus clientes aparecem aqui por horário.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">{customerListTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Acompanhe quem marcou{" "}
                  {copy.booking === "consulta" ? "uma consulta" : "um horário"}.
                </p>
              </div>
              <span className="rounded-lg bg-[#edf0e5] px-2.5 py-1.5 text-xs font-bold text-[#586341]">
                {clients.length}
              </span>
            </div>
            {business?.category === "saude" && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Lista de espera</h3>
                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                    {waitlist.filter((entry) => entry.status === "waiting").length}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Contate pacientes quando surgir um horário compatível. A preferência registrada é
                  apenas administrativa.
                </p>
                {waitlistActionError && (
                  <p role="alert" className="mt-2 text-xs text-red-700">
                    {waitlistActionError}
                  </p>
                )}
                {waitlist.length ? (
                  <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {waitlist.map((entry) => {
                      const serviceName =
                        services.find((service) => service.id === entry.serviceId)?.name ??
                        "Atendimento";
                      const phone = normalizePhone(entry.phone);
                      const datePreference = entry.preferredDate
                        ? new Date(`${entry.preferredDate}T12:00:00`).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Sem data fixa";
                      const dayPeriod = {
                        morning: "manhã",
                        afternoon: "tarde",
                        evening: "noite",
                        any: "qualquer período",
                      }[entry.dayPeriod];
                      const message = `Olá, ${entry.customerName}! Surgiu uma possibilidade para ${serviceName} em ${business?.name}. Se ainda tiver interesse, responda por aqui para combinarmos o horário.`;
                      const waNumber =
                        phone.length === 10 || phone.length === 11 ? `55${phone}` : phone;
                      return (
                        <li key={entry.id} className="py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {entry.customerName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {serviceName} · {datePreference} · {dayPeriod}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">{entry.phone}</p>
                            </div>
                            <select
                              aria-label={`Status da lista de espera de ${entry.customerName}`}
                              value={entry.status}
                              onChange={(event) => {
                                setWaitlistActionError("");
                                void setWaitlistStatus(
                                  entry.id,
                                  event.target.value as typeof entry.status,
                                ).catch(() =>
                                  setWaitlistActionError(
                                    "Não foi possível atualizar a lista. Tente novamente.",
                                  ),
                                );
                              }}
                              className="max-w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600"
                            >
                              <option value="waiting">Aguardando</option>
                              <option value="contacted">Contatado</option>
                              <option value="scheduled">Agendado</option>
                              <option value="closed">Encerrado</option>
                            </select>
                          </div>
                          {waNumber.length >= 12 &&
                            entry.status !== "closed" &&
                            entry.status !== "scheduled" && (
                              <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                              >
                                <MessageCircle size={13} /> Contatar paciente
                              </a>
                            )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                    Quando alguém entrar na lista pelo seu link, aparecerá aqui.
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedPhone(null)}
              aria-pressed={!selectedPhone}
              className={`mt-4 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                !selectedPhone ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Todos os clientes
            </button>
            {clients.length ? (
              <ul className="mt-2 max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
                {clients.map(({ key, booking }) => (
                  <li key={key} className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhone((current) => (current === key ? null : key));
                        const clientDate = new Date(`${booking.date}T12:00:00`);
                        const currentMonday = getWeek(new Date(), 0)[0];
                        const clientMonday = getWeek(clientDate, 0)[0];
                        setWeekOffset(
                          Math.round(
                            (clientMonday.getTime() - currentMonday.getTime()) / 604800000,
                          ),
                        );
                        setSelectedDay(mondayIndex(clientDate));
                      }}
                      aria-pressed={selectedPhone === key}
                      className={`flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-3 text-left hover:bg-slate-50 ${
                        selectedPhone === key ? "bg-[#f3f5ed]" : ""
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                        <UserRound size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {booking.customerName}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {booking.phone}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-slate-400">
                          {booking.count} {booking.count === 1 ? "agendamento" : "agendamentos"} ·
                          Último:{" "}
                          {new Date(`${booking.date}T12:00:00`).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </span>
                    </button>
                    {business?.slug &&
                      services.some(
                        (service) => service.id === booking.serviceId && service.active,
                      ) && (
                        <a
                          href={`/loja/${business.slug}?servico=${encodeURIComponent(booking.serviceId)}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Agendar novamente com ${booking.customerName}`}
                          title="Agendar novamente"
                          className="mt-2 grid size-9 shrink-0 place-items-center rounded-lg text-[#667448] hover:bg-[#edf0e5]"
                        >
                          <CalendarDays size={15} />
                        </a>
                      )}
                    <a
                      href={`tel:${booking.phone.replace(/[^+\d]/g, "")}`}
                      aria-label={`Ligar para ${booking.customerName}`}
                      className="mt-2 rounded-lg p-2 text-[#667448] hover:bg-[#edf0e5]"
                    >
                      <Phone size={15} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center">
                <UserRound className="mx-auto text-slate-300" size={25} />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Sua lista de {copy.customers} começa aqui
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Quando alguém pedir um horário, os dados aparecem nesta lista.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          Não foi possível atualizar a agenda: {error}
        </p>
      )}
    </>
  );
}

function appointmentReminderUrl(booking: Booking, businessName: string) {
  const digits = normalizePhone(booking.phone);
  const whatsappNumber = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const formattedDate = new Date(`${booking.date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const message = `Olá, ${booking.customerName}! Passando para lembrar do seu atendimento com ${businessName}, em ${formattedDate} às ${booking.time}. Até lá!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function appointmentReadyUrl(booking: Booking, businessName: string, category?: string) {
  const digits = normalizePhone(booking.phone);
  const whatsappNumber = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const isPet = category === "pet";
  const message = isPet
    ? `Olá, ${booking.customerName}! 🐾 Boas notícias: seu pet já está prontinho, cheiroso e esperando você no ${businessName}! Pode vir buscar.`
    : `Olá, ${booking.customerName}! Seu atendimento/serviço no ${businessName} foi finalizado com sucesso e já está pronto para retirada. Muito obrigado!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function appointmentThankYouUrl(booking: Booking, businessName: string, slug?: string) {
  const digits = normalizePhone(booking.phone);
  const whatsappNumber = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const link = slug ? `https://ello.app.br/loja/${slug}` : "";
  const message = `Olá, ${booking.customerName}! Passando para agradecer pela sua preferência hoje no ${businessName}. Foi um prazer atender você! ${link ? `Deixe sua avaliação ou agende seu próximo horário: ${link}` : ""}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function BookingStatus({ status }: { status: Booking["status"] }) {
  const labels: Record<Booking["status"], string> = {
    pending: "Aguardando",
    confirmed: "Confirmado",
    in_progress: "Em atendimento",
    completed: "Concluído",
    no_show: "Falta",
    cancelled: "Cancelado",
  };
  const styles: Record<Booking["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    in_progress: "bg-sky-50 text-sky-700",
    completed: "bg-[#edf0e5] text-[#586341]",
    no_show: "bg-rose-50 text-rose-700",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function BookingList({
  bookings,
  services,
  setBookingStatus,
}: {
  bookings: Booking[];
  services: ReturnType<typeof useLocalHub>["services"];
  setBookingStatus: ReturnType<typeof useLocalHub>["setBookingStatus"];
}) {
  if (!bookings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <CalendarDays className="mx-auto text-[#a5b280]" size={28} />
        <h2 className="mt-4 font-bold">Nenhuma solicitação por enquanto</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          As solicitações de horário recebidas pela sua página aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <article
          key={booking.id}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-[#edf0e5] font-bold text-[#586341]">
                {booking.customerName.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2 className="text-sm font-bold">{booking.customerName}</h2>
                <div className="mt-1 text-xs text-slate-500">
                  {services.find((item) => item.id === booking.serviceId)?.name ??
                    "Serviço removido"}
                </div>
              </div>
            </div>
            <BookingStatus status={booking.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {new Date(booking.date + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 size={14} />
              {booking.time}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={13} />
              {booking.phone}
            </span>
          </div>
          {booking.status === "pending" && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingStatus(booking.id, "cancelled")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <X size={14} /> Recusar
              </button>
              <button
                type="button"
                onClick={() => setBookingStatus(booking.id, "confirmed")}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Check size={14} /> Confirmar
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
