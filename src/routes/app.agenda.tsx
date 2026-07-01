import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react";
import { ElloSurface } from "@/components/ello/primitives";
import { ScreenHeader, ScreenMain, ScreenPage, StatusPill } from "@/components/ello/screen-layout";
import { canTransitionAppointmentAs } from "@/lib/appointments";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyAgendaItems, updateAppointmentStatus, type AgendaItem } from "@/lib/ello-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/app/agenda")({
  component: AgendaScreen,
});

function AgendaScreen() {
  const { configured, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const agendaQuery = useQuery({
    queryKey: ["ello", "me", "agenda", user?.id],
    queryFn: () => listMyAgendaItems(user!.id),
    enabled: Boolean(configured && user),
  });
  const statusMutation = useMutation({
    mutationFn: (input: {
      appointmentId: string;
      status: "confirmed" | "completed" | "cancelled";
    }) => updateAppointmentStatus(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ello", "me", "agenda", user?.id] }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
      ]);
    },
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!configured || !user || !supabase) return;
    const channel = supabase
      .channel(`ello-agenda-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => void queryClient.invalidateQueries({ queryKey: ["ello", "me", "agenda", user.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [configured, queryClient, user]);

  const items = useMemo(() => agendaQuery.data ?? [], [agendaQuery.data]);
  const now = new Date();
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const calendarDays = buildCalendarDays(now);

  return (
    <ScreenPage>
      <ScreenHeader title="Agenda" subtitle="Compromissos e atendimentos" backTo="/app/business" />

      <ScreenMain>
        <ElloSurface className="p-4">
          <div className="flex items-center justify-center gap-5">
            <ChevronLeft className="size-5 text-muted-foreground" />
            <h2 className="min-w-36 text-center text-base font-black capitalize">{monthLabel}</h2>
            <ChevronRight className="size-5 text-muted-foreground" />
          </div>
          <div className="mt-5 grid grid-cols-7 text-center text-xs font-bold text-muted-foreground">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
              <span key={`${day}-${index}`} className="py-2">
                {day}
              </span>
            ))}
            {calendarDays.map((day, index) =>
              day ? (
                <button
                  key={`${day}-${index}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`mx-auto grid size-9 place-items-center rounded-full text-sm transition ${
                    selectedDay === day
                      ? "bg-primary font-bold text-white shadow-[var(--ello-shadow-glow)]"
                      : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  {day}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </ElloSurface>

        <ElloSurface className="p-4">
          <h2 className="border-b border-border/60 pb-4 text-sm font-black">
            Hoje • {now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </h2>

          {!configured || !user ? (
            <AgendaEmpty text="Entre na sua conta para acessar a agenda." />
          ) : agendaQuery.isPending ? (
            <AgendaEmpty text="Carregando compromissos..." />
          ) : items.length ? (
            <div className="mt-2">
              {items.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  pending={statusMutation.isPending}
                  onStatus={(status) =>
                    statusMutation.mutate({ appointmentId: appointment.id, status })
                  }
                />
              ))}
            </div>
          ) : (
            <AgendaEmpty text="Nenhum compromisso agendado." />
          )}
        </ElloSurface>

        {statusMutation.error ? (
          <p className="rounded-[1rem] bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {statusMutation.error.message}
          </p>
        ) : null}
      </ScreenMain>
    </ScreenPage>
  );
}

function AppointmentRow({
  appointment,
  onStatus,
  pending,
}: {
  appointment: AgendaItem;
  onStatus: (status: "confirmed" | "completed" | "cancelled") => void;
  pending: boolean;
}) {
  const actor = appointment.professionalView ? "professional" : "client";
  const canConfirm = canTransitionAppointmentAs(actor, appointment.status, "confirmed");
  const canComplete = canTransitionAppointmentAs(actor, appointment.status, "completed");
  const canCancel = canTransitionAppointmentAs(actor, appointment.status, "cancelled");

  return (
    <article className="mt-4 flex gap-4 rounded-[1.25rem] border border-border/50 bg-white/60 p-4">
      <strong className="w-12 shrink-0 text-sm font-black tabular-nums">{appointment.time}</strong>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black">{appointment.service}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{appointment.professionalName}</p>
        <div className="mt-2 flex items-center gap-2">
          <StatusPill>{statusLabel(appointment.status)}</StatusPill>
          {appointment.quoteRequestId ? (
            <Link
              to="/app/messages"
              search={{ quote: appointment.quoteRequestId }}
              aria-label="Abrir conversa"
              className="ello-icon-btn !size-8"
            >
              <MessageCircle className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canConfirm || canComplete ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus(canConfirm ? "confirmed" : "completed")}
            aria-label={canConfirm ? "Confirmar" : "Concluir"}
            className="grid size-8 place-items-center rounded-full bg-success/10 text-success"
          >
            <Check className="size-4" />
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus("cancelled")}
            aria-label="Cancelar"
            className="grid size-8 place-items-center rounded-full bg-destructive/10 text-destructive"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function AgendaEmpty({ text }: { text: string }) {
  return <p className="py-14 text-center text-sm text-muted-foreground">{text}</p>;
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
  ];
}

function statusLabel(status: AgendaItem["status"]) {
  const labels: Record<AgendaItem["status"], string> = {
    cancelled: "Cancelado",
    completed: "Concluído",
    confirmed: "Confirmado",
    pending: "Pendente",
  };
  return labels[status];
}
