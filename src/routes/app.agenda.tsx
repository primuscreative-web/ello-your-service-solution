import { useEffect, useMemo } from "react";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, MapPin, MessageCircle, XCircle } from "lucide-react";
import { AppTopBar, ProPhoto } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { canTransitionAppointmentAs } from "@/lib/appointments";
import { listMyAgendaItems, updateAppointmentStatus, type AgendaItem } from "@/lib/ello-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/app/agenda")({
  component: Agenda,
});

function Agenda() {
  const queryClient = useQueryClient();
  const { configured, user } = useAuth();
  const agendaQuery = useQuery({
    queryKey: ["ello", "me", "agenda", user?.id],
    queryFn: () => listMyAgendaItems(user!.id),
    enabled: Boolean(configured && user),
  });
  const statusMutation = useMutation({
    mutationFn: (input: {
      appointmentId: string;
      status: "confirmed" | "completed" | "cancelled";
    }) =>
      updateAppointmentStatus({
        appointmentId: input.appointmentId,
        status: input.status,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "agenda", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "quote-threads", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "request-history", user?.id],
        }),
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
      .channel(`ello-appointments-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["ello", "me", "agenda", user.id],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [configured, queryClient, user]);

  const agendaItems = useMemo(() => agendaQuery.data ?? [], [agendaQuery.data]);
  const upcoming = agendaItems.filter(
    (item) => item.status === "pending" || item.status === "confirmed",
  );
  const history = agendaItems.filter(
    (item) => item.status === "completed" || item.status === "cancelled",
  );

  return (
    <div>
      <AppTopBar title="Agenda" subtitle="Servicos e compromissos" />

      <main className="space-y-5 px-4 pb-6 pt-4">
        <section className="grid grid-cols-3 gap-2">
          <AgendaMetric label="Pendentes" value={countStatus(agendaItems, "pending")} />
          <AgendaMetric label="Confirmados" value={countStatus(agendaItems, "confirmed")} />
          <AgendaMetric label="Concluidos" value={countStatus(agendaItems, "completed")} />
        </section>

        {!configured ? (
          <AgendaEmpty message="Configure o Supabase para ativar a agenda." />
        ) : !user ? (
          <AgendaEmpty message="Entre na sua conta para acessar sua agenda." action />
        ) : agendaQuery.isPending ? (
          <div className="ello-card rounded-xl p-5 text-center text-xs font-bold text-muted-foreground">
            Carregando agenda...
          </div>
        ) : (
          <>
            <AgendaSection title="Proximos servicos" count={upcoming.length}>
              {upcoming.length ? (
                upcoming.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pending={statusMutation.isPending}
                    onStatus={(status) =>
                      statusMutation.mutate({
                        appointmentId: appointment.id,
                        status,
                      })
                    }
                  />
                ))
              ) : (
                <AgendaEmpty message="Nenhum servico agendado no momento." />
              )}
            </AgendaSection>

            {history.length ? (
              <AgendaSection title="Historico" count={history.length}>
                {history.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    pending={statusMutation.isPending}
                    onStatus={(status) =>
                      statusMutation.mutate({
                        appointmentId: appointment.id,
                        status,
                      })
                    }
                  />
                ))}
              </AgendaSection>
            ) : null}
          </>
        )}

        {statusMutation.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {statusMutation.error.message}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function AppointmentCard({
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
    <article className="ello-card rounded-xl p-4">
      <div className="flex gap-3">
        <ProPhoto initials={appointment.professionalInitials} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black">{appointment.professionalName}</h3>
              <p className="truncate text-[11px] font-semibold text-muted-foreground">
                {appointment.service}
              </p>
            </div>
            <StatusPill status={appointment.status} />
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs font-black text-[#083d63]">
            <CalendarClock className="size-4" />
            {appointment.date} as {appointment.time}
          </p>
          {appointment.address ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3.5" />
              {appointment.address}
            </p>
          ) : null}
        </div>
      </div>

      {appointment.notes ? (
        <p className="mt-3 rounded-lg bg-background p-2 text-[11px] leading-relaxed text-muted-foreground">
          {appointment.notes}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        {appointment.quoteRequestId ? (
          <Link
            to="/app/messages"
            search={{ quote: appointment.quoteRequestId }}
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#083d63] text-white"
            aria-label="Abrir conversa"
          >
            <MessageCircle className="size-4" />
          </Link>
        ) : null}
        {canConfirm ? (
          <button
            disabled={pending}
            onClick={() => onStatus("confirmed")}
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-primary text-xs font-black text-white disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            Confirmar
          </button>
        ) : null}
        {canComplete ? (
          <button
            disabled={pending}
            onClick={() => onStatus("completed")}
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-primary text-xs font-black text-white disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            Concluir
          </button>
        ) : null}
        {canCancel ? (
          <button
            disabled={pending}
            onClick={() => onStatus("cancelled")}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-700 disabled:opacity-50"
            aria-label="Cancelar agendamento"
          >
            <XCircle className="size-4" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function AgendaSection({
  children,
  count,
  title,
}: {
  children: React.ReactNode;
  count: number;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black">{title}</h2>
        <span className="text-[10px] font-bold text-muted-foreground">{count} itens</span>
      </div>
      {children}
    </section>
  );
}

function AgendaMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="ello-card rounded-xl p-3 text-center">
      <strong className="block text-xl font-black text-[#083d63]">{value}</strong>
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}

function AgendaEmpty({ action, message }: { action?: boolean; message: string }) {
  return (
    <div className="ello-card rounded-xl p-5 text-center">
      <CalendarClock className="mx-auto size-6 text-primary" />
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{message}</p>
      {action ? (
        <Link
          to="/auth"
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-black text-white"
        >
          Entrar
        </Link>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: AgendaItem["status"] }) {
  const labels: Record<AgendaItem["status"], string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluido",
    cancelled: "Cancelado",
  };

  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black text-primary">
      {labels[status]}
    </span>
  );
}

function countStatus(items: AgendaItem[], status: AgendaItem["status"]) {
  return items.filter((item) => item.status === status).length;
}
