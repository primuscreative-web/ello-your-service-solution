import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { APPOINTMENTS, getProfessional } from "@/lib/ello-data";
import { AppTopBar, CyanButton, ProPhoto } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyAgendaItems } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/agenda")({
  component: Agenda,
});

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

function Agenda() {
  const { configured, user } = useAuth();
  const agendaQuery = useQuery({
    queryKey: ["ello", "me", "agenda", user?.id],
    queryFn: listMyAgendaItems,
    enabled: Boolean(configured && user),
  });
  const realAgendaItems = agendaQuery.data ?? [];

  return (
    <div>
      <AppTopBar title="Agenda" subtitle="Serviços confirmados" />

      <main className="space-y-4 px-4 pb-6 pt-4">
        <section className="ello-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black">Agendar Serviço</h2>
            <div className="flex gap-1">
              <ChevronLeft className="size-4" />
              <ChevronRight className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-center text-xs font-bold">Data ibro 2023</p>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
            {["Du", "Dia", "Ma", "Qm", "Jn", "Sa", "D"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {DAYS.map((day) => (
              <button
                key={day}
                className={`grid aspect-square place-items-center rounded-full text-xs font-bold ${
                  day === 13 ? "bg-[#083d63] text-white" : "text-foreground"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <CyanButton className="mt-4 w-full">Confirm serviço</CyanButton>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Hoje</h2>
            <Link to="/app/messages" className="text-[10px] font-bold text-primary">
              Ver mais
            </Link>
          </div>
          {configured && user && realAgendaItems.length ? (
            realAgendaItems.map((appointment) => (
              <Link
                key={appointment.id}
                to="/app/professional/$id"
                params={{ id: appointment.professionalId }}
                className="ello-card flex items-center gap-3 rounded-xl p-3"
              >
                <ProPhoto initials={appointment.professionalInitials} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black">{appointment.professionalName}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {appointment.date} · {appointment.service}
                  </p>
                </div>
                <span className="text-xs font-black">{appointment.time}</span>
              </Link>
            ))
          ) : configured && user && agendaQuery.isPending ? (
            <div className="ello-card rounded-xl p-4 text-xs font-semibold text-muted-foreground">
              Carregando agenda real...
            </div>
          ) : configured && user ? (
            <div className="ello-card rounded-xl p-4 text-xs font-semibold text-muted-foreground">
              Nenhum agendamento real ainda. Os exemplos abaixo continuam como demonstracao.
            </div>
          ) : null}
          {APPOINTMENTS.map((appointment) => {
            const pro = getProfessional(appointment.professionalId);
            if (!pro) return null;
            return (
              <Link
                key={appointment.id}
                to="/app/professional/$id"
                params={{ id: pro.id }}
                className="ello-card flex items-center gap-3 rounded-xl p-3"
              >
                <ProPhoto initials={pro.initials} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black">{pro.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {appointment.service}
                  </p>
                </div>
                <span className="text-xs font-black">{appointment.time}</span>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
