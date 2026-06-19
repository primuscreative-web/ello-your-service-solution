import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft, MapPin } from "lucide-react";
import { createAppointmentFromQuote, getProfessionalById } from "@/lib/ello-repository";

const scheduleSearchSchema = z.object({
  quote: z.string().optional(),
});

export const Route = createFileRoute("/app/professional/$id_/schedule")({
  validateSearch: scheduleSearchSchema,
  component: ScheduleScreen,
});

const TIMES = ["08:00", "10:00", "14:00", "16:00"];

function ScheduleScreen() {
  const { id } = Route.useParams();
  const { quote } = Route.useSearch();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const professionalQuery = useQuery({
    queryKey: ["ello", "professional", id],
    queryFn: () => getProfessionalById(id),
  });

  const startsAt = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + Math.max(1, selectedDay - 14));
    const [hours, minutes] = selectedTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  }, [selectedDay, selectedTime]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!quote) throw new Error("Envie um orçamento antes de confirmar o agendamento.");
      return createAppointmentFromQuote({ quoteRequestId: quote, startsAt, notes });
    },
    onSuccess: async () => {
      await navigate({ to: "/app/agenda" });
    },
  });

  return (
    <div className="min-h-dvh bg-white pb-6">
      <header className="flex items-center border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link
          to="/app/professional/$id"
          params={{ id }}
          aria-label="Voltar"
          className="grid size-10 place-items-center"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Agendar serviço</h1>
        <span className="size-10" />
      </header>

      <main className="space-y-7 px-5 py-6">
        <section>
          <h2 className="text-sm font-black">Serviço</h2>
          <div className="mt-3 rounded-xl border border-border p-4 text-sm font-semibold">
            {professionalQuery.data?.specialties[0] ?? "Serviço profissional"}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black">Data</h2>
          <div className="mt-4 rounded-2xl border border-border p-4">
            <div className="text-center text-sm font-black">Próximos dias</div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {[15, 16, 17, 18, 19, 20, 21].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-full text-sm font-bold ${
                    selectedDay === day ? "bg-primary text-white" : "bg-secondary"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black">Horários disponíveis</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {TIMES.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`h-11 rounded-xl border text-sm font-bold ${
                  selectedTime === time
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black">Endereço</h2>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-border p-4">
            <MapPin className="size-5 text-primary" />
            <span className="text-sm font-semibold">
              {professionalQuery.data?.city ?? "São Paulo - SP"}
            </span>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black">Observações (opcional)</h2>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Alguma informação importante..."
            className="mt-3 min-h-24 w-full resize-none rounded-xl border border-border p-4 text-sm outline-none focus:border-primary"
          />
        </section>

        {!quote ? (
          <p className="rounded-xl bg-primary/5 p-4 text-xs font-semibold leading-relaxed text-primary">
            Primeiro envie uma solicitação de orçamento; depois o horário poderá ser confirmado.
          </p>
        ) : null}
        {mutation.error ? (
          <p className="rounded-xl bg-destructive/10 p-4 text-xs font-semibold text-destructive">
            {mutation.error.message}
          </p>
        ) : null}

        <button
          disabled={!quote || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="h-13 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-45"
        >
          {mutation.isPending ? "Confirmando..." : "Confirmar agendamento"}
        </button>
      </main>
    </div>
  );
}
