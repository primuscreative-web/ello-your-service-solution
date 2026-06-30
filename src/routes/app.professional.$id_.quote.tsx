import { useState } from "react";
import type React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, MapPin, Plus } from "lucide-react";
import { PrimaryButton } from "@/components/ello/actions";
import { ElloSurface } from "@/components/ello/primitives";
import { ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { getProfessionalById, createDetailedQuoteRequest } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/professional/$id_/quote")({
  component: QuoteRequestScreen,
});

function QuoteRequestScreen() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [urgency, setUrgency] = useState("O mais rápido possível");
  const professionalQuery = useQuery({
    queryKey: ["ello", "professional", id],
    queryFn: () => getProfessionalById(id),
  });
  const professional = professionalQuery.data;

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Entre na sua conta para solicitar um orçamento.");
      if (!professional) throw new Error("Profissional ainda não carregado.");
      return createDetailedQuoteRequest({
        userId: user.id,
        professionalId: professional.id,
        description,
        location,
      });
    },
    onSuccess: async (request) => {
      await navigate({ to: "/app/messages", search: { quote: request.id } });
    },
  });

  return (
    <ScreenPage>
      <ScreenHeader title="Novo orçamento" subtitle="Descreva o que você precisa" backTo={`/app/professional/${id}`} />

      <ScreenMain className="space-y-6">
        <Field label="Serviço desejado">
          <ElloSurface className="p-4 text-sm font-semibold">
            {professional?.specialties[0] ?? "Serviço profissional"}
          </ElloSurface>
        </Field>

        <Field label="Descrição do serviço">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descreva o serviço que você precisa..."
            className="ello-textarea"
          />
        </Field>

        <Field label="Fotos (opcional)">
          <div className="flex gap-2">
            {[Camera, Camera].map((Icon, index) => (
              <span
                key={index}
                className="grid size-20 place-items-center rounded-xl border border-border/60 bg-secondary/60 text-muted-foreground"
              >
                <Icon className="size-6" />
              </span>
            ))}
            <button type="button" className="grid size-20 place-items-center rounded-xl border border-dashed border-border bg-secondary/40">
              <Plus className="size-7 text-muted-foreground" />
            </button>
          </div>
        </Field>

        <Field label="Endereço">
          <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-white/90 p-4 shadow-[var(--ello-shadow-sm)]">
            <MapPin className="size-5 text-primary" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Cidade, bairro ou endereço"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            />
          </label>
        </Field>

        <Field label="Quando você precisa?">
          <select
            value={urgency}
            onChange={(event) => setUrgency(event.target.value)}
            className="ello-input"
          >
            <option>O mais rápido possível</option>
            <option>Esta semana</option>
            <option>Sem urgência</option>
          </select>
        </Field>

        {mutation.error ? (
          <p className="rounded-[1rem] bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {mutation.error.message}
          </p>
        ) : null}

        <PrimaryButton
          type="button"
          disabled={description.trim().length < 10 || location.trim().length < 3 || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="!h-12"
        >
          {mutation.isPending ? "Enviando..." : "Enviar solicitação"}
        </PrimaryButton>
      </ScreenMain>
    </ScreenPage>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section>
      <span className="ello-field-label">{label}</span>
      {children}
    </section>
  );
}
