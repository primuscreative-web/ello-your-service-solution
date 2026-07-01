import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { MapPin } from "lucide-react";
import { PrimaryButton } from "@/components/ello/actions";
import { ElloSurface } from "@/components/ello/primitives";
import { ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";
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
    <ScreenPage>
      <ScreenHeader
        title="Agendar serviço"
        subtitle="Escolha data e horário"
        backTo={`/app/professional/${id}`}
      />

      <ScreenMain className="space-y-6">
        <section>
          <span className="ello-field-label">Serviço</span>
          <ElloSurface className="p-4 text-sm font-semibold">
            {professionalQuery.data?.specialties[0] ?? "Serviço profissional"}
          </ElloSurface>
        </section>

        <section>
          <span className="ello-field-label">Data</span>
          <ElloSurface className="p-4">
            <div className="text-center text-sm font-black">Próximos dias</div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {[15, 16, 17, 18, 19, 20, 21].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-full text-sm font-bold transition ${
                    selectedDay === day
                      ? "bg-primary text-white shadow-[var(--ello-shadow-glow)]"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </ElloSurface>
        </section>

        <section>
          <span className="ello-field-label">Horários disponíveis</span>
          <div className="grid grid-cols-4 gap-2">
            {TIMES.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`h-11 rounded-xl border text-sm font-bold transition ${
                  selectedTime === time
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white hover:border-primary/30"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </section>

        <section>
          <span className="ello-field-label">Endereço</span>
          <ElloSurface className="flex items-center gap-3 p-4">
            <MapPin className="size-5 text-primary" />
            <span className="text-sm font-semibold">
              {professionalQuery.data?.city ?? "São Paulo - SP"}
            </span>
          </ElloSurface>
        </section>

        <section>
          <span className="ello-field-label">Observações (opcional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Alguma informação importante..."
            className="ello-textarea"
          />
        </section>

        {!quote ? (
          <p className="rounded-[1rem] bg-primary/5 p-4 text-xs font-semibold leading-relaxed text-primary">
            Primeiro envie uma solicitação de orçamento; depois o horário poderá ser confirmado.
          </p>
        ) : null}
        {mutation.error ? (
          <p className="rounded-[1rem] bg-destructive/10 p-4 text-xs font-semibold text-destructive">
            {mutation.error.message}
          </p>
        ) : null}

        <PrimaryButton
          type="button"
          disabled={!quote || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="!h-12"
        >
          {mutation.isPending ? "Confirmando..." : "Confirmar agendamento"}
        </PrimaryButton>
      </ScreenMain>
    </ScreenPage>
  );
}
