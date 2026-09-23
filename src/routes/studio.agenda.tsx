import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Clock3, Phone, X } from "lucide-react";
import { PageTitle } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/agenda")({ component: AgendaPage });

function AgendaPage() {
  const { bookings, services, setBookingStatus } = useLocalHub();
  const sorted = [...bookings].sort((a, b) =>
    (a.date + " " + a.time).localeCompare(b.date + " " + b.time),
  );
  return (
    <>
      <PageTitle
        eyebrow="Atendimentos"
        title="Agendamentos"
        description="Confirme os pedidos de horário que chegaram pela sua página."
        action={
          <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            {bookings.filter((item) => item.status === "pending").length} aguardando
          </span>
        }
      />
      {sorted.length ? (
        <div className="space-y-3">
          {sorted.map((booking) => (
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
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-bold " +
                    (booking.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : booking.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500")
                  }
                >
                  {booking.status === "pending"
                    ? "Aguardando confirmação"
                    : booking.status === "confirmed"
                      ? "Confirmado"
                      : "Cancelado"}
                </span>
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
                    onClick={() => setBookingStatus(booking.id, "cancelled")}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <X size={14} />
                    Recusar
                  </button>
                  <button
                    onClick={() => setBookingStatus(booking.id, "confirmed")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Check size={14} />
                    Confirmar
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <CalendarDays className="mx-auto text-[#a5b280]" size={28} />
          <h2 className="mt-4 font-bold">Nenhum agendamento por enquanto</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Quando um cliente pedir um horário pela sua página, você poderá confirmar ou recusar por
            aqui.
          </p>
        </div>
      )}
    </>
  );
}
