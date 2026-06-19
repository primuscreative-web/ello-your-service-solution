import { useState } from "react";
import type React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, ChevronLeft, MapPin, Plus } from "lucide-react";
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
        <h1 className="flex-1 text-center text-base font-black">Novo orçamento</h1>
        <span className="size-10" />
      </header>

      <main className="space-y-6 px-5 py-6">
        <Field label="Serviço desejado">
          <div className="rounded-xl border border-border p-4 text-sm font-semibold">
            {professional?.specialties[0] ?? "Serviço profissional"}
          </div>
        </Field>

        <Field label="Descrição do serviço">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descreva o serviço que você precisa..."
            className="min-h-32 w-full resize-none rounded-xl border border-border p-4 text-sm outline-none focus:border-primary"
          />
        </Field>

        <Field label="Fotos (opcional)">
          <div className="flex gap-2">
            {[Camera, Camera].map((Icon, index) => (
              <span
                key={index}
                className="grid size-20 place-items-center rounded-xl bg-secondary text-muted-foreground"
              >
                <Icon className="size-6" />
              </span>
            ))}
            <button className="grid size-20 place-items-center rounded-xl bg-secondary">
              <Plus className="size-7" />
            </button>
          </div>
        </Field>

        <Field label="Endereço">
          <label className="flex items-center gap-3 rounded-xl border border-border p-4">
            <MapPin className="size-5 text-primary" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Cidade, bairro ou endereço"
              className="min-w-0 flex-1 text-sm outline-none"
            />
          </label>
        </Field>

        <Field label="Quando você precisa?">
          <select
            value={urgency}
            onChange={(event) => setUrgency(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold"
          >
            <option>O mais rápido possível</option>
            <option>Esta semana</option>
            <option>Sem urgência</option>
          </select>
        </Field>

        {mutation.error ? (
          <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {mutation.error.message}
          </p>
        ) : null}

        <button
          disabled={
            description.trim().length < 10 || location.trim().length < 3 || mutation.isPending
          }
          onClick={() => mutation.mutate()}
          className="h-13 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-45"
        >
          {mutation.isPending ? "Enviando..." : "Enviar solicitação"}
        </button>
      </main>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-black">{label}</h2>
      {children}
    </section>
  );
}
