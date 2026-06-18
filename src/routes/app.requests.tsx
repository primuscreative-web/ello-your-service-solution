import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle, Star } from "lucide-react";
import { AppTopBar, CyanButton, ProPhoto } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";
import {
  createOrUpdateReview,
  listMyRequestHistory,
  markQuoteRequestCompleted,
  type RequestHistoryItem,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/requests")({
  component: Requests,
});

function Requests() {
  const { configured, user } = useAuth();
  const queryClient = useQueryClient();
  const requestsQuery = useQuery({
    queryKey: ["ello", "me", "request-history", user?.id],
    queryFn: () => listMyRequestHistory(user!.id),
    enabled: Boolean(configured && user),
  });
  const completeMutation = useMutation({
    mutationFn: (quoteRequestId: string) => {
      if (!user) throw new Error("Entre na sua conta para concluir o servico.");
      return markQuoteRequestCompleted({ quoteRequestId, userId: user.id });
    },
    onSuccess: invalidateRequestData,
  });
  const reviewMutation = useMutation({
    mutationFn: (input: { quoteRequestId: string; rating: number; comment: string }) => {
      if (!user) throw new Error("Entre na sua conta para avaliar.");
      return createOrUpdateReview({
        quoteRequestId: input.quoteRequestId,
        userId: user.id,
        rating: input.rating,
        comment: input.comment,
      });
    },
    onSuccess: invalidateRequestData,
  });

  async function invalidateRequestData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["ello", "me", "request-history", user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ello", "me", "quote-threads", user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ello", "professionals"],
      }),
    ]);
  }

  const requests = requestsQuery.data ?? [];

  return (
    <div>
      <AppTopBar title="Historico" subtitle="Solicitacoes e avaliacoes" backTo="/app/profile" />

      <main className="space-y-4 px-4 pb-6 pt-4">
        {!configured ? (
          <EmptyState message="Configure o Supabase para salvar historico real." />
        ) : !user ? (
          <EmptyState message="Entre na sua conta para ver suas solicitacoes." />
        ) : requestsQuery.isPending ? (
          <div className="ello-card rounded-xl p-6 text-center text-sm font-bold text-muted-foreground">
            Carregando historico...
          </div>
        ) : requests.length ? (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              completing={completeMutation.isPending}
              reviewing={reviewMutation.isPending}
              onComplete={() => completeMutation.mutate(request.id)}
              onReview={(rating, comment) =>
                reviewMutation.mutate({
                  quoteRequestId: request.id,
                  rating,
                  comment,
                })
              }
            />
          ))
        ) : (
          <EmptyState message="Voce ainda nao solicitou nenhum orcamento real." />
        )}

        {completeMutation.error ? (
          <ErrorText>{completeMutation.error.message}</ErrorText>
        ) : null}
        {reviewMutation.error ? <ErrorText>{reviewMutation.error.message}</ErrorText> : null}
      </main>
    </div>
  );
}

function RequestCard({
  completing,
  onComplete,
  onReview,
  request,
  reviewing,
}: {
  completing: boolean;
  onComplete: () => void;
  onReview: (rating: number, comment: string) => void;
  request: RequestHistoryItem;
  reviewing: boolean;
}) {
  const [rating, setRating] = useState(request.review?.rating ?? 5);
  const [comment, setComment] = useState(request.review?.comment ?? "");
  const canComplete = request.status === "accepted" || request.status === "in_progress";
  const canReview = request.status === "completed";

  return (
    <article className="ello-card rounded-xl p-4">
      <div className="flex gap-3">
        <ProPhoto
          initials={request.professionalInitials}
          imageUrl={request.professionalAvatarUrl}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black">{request.professionalName}</h2>
              <p className="truncate text-[11px] text-muted-foreground">
                {request.serviceTitle} - {request.createdAt}
              </p>
            </div>
            <StatusPill status={request.status} />
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {request.description}
          </p>
        </div>
      </div>

      {(request.responsePrice || request.responseEta) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniInfo label="Combinado" value={request.responsePrice ?? "A combinar"} />
          <MiniInfo label="Prazo" value={request.responseEta ?? "A combinar"} />
        </div>
      )}

      <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-2 text-[10px] font-semibold leading-relaxed text-sky-900">
        {PAYMENT_POLICY.quotePaymentNotice}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to="/app/messages"
          search={{ quote: request.id }}
          className="grid h-10 place-items-center rounded-lg bg-[#083d63] text-xs font-black text-white"
        >
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-4" />
            Chat
          </span>
        </Link>
        <CyanButton
          disabled={!canComplete || completing}
          className="disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
          onClick={onComplete}
        >
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-4" />
            Concluir
          </span>
        </CyanButton>
      </div>

      {canReview ? (
        <section className="mt-4 rounded-xl bg-background p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black">Avaliacao</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  className="grid size-7 place-items-center rounded-full bg-white"
                  onClick={() => setRating(value)}
                  aria-label={`${value} estrelas`}
                >
                  <Star
                    className={`size-4 ${
                      value <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Conte como foi o atendimento..."
            className="mt-3 min-h-20 w-full resize-none rounded-lg border border-border bg-white p-3 text-xs outline-none focus:border-primary"
          />
          <CyanButton
            className="mt-2 w-full disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            disabled={reviewing}
            onClick={() => onReview(rating, comment)}
          >
            {request.review ? "Atualizar avaliacao" : "Enviar avaliacao"}
          </CyanButton>
        </section>
      ) : null}
    </article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-2">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="truncate text-xs font-black">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: RequestHistoryItem["status"] }) {
  const labelByStatus: Record<RequestHistoryItem["status"], string> = {
    accepted: "Aceito",
    cancelled: "Cancelado",
    completed: "Concluido",
    declined: "Recusado",
    in_progress: "Em andamento",
    new: "Novo",
    quoted: "Respondido",
  };

  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
      {labelByStatus[status]}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="ello-card rounded-xl p-6 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <MessageCircle className="size-5" />
      </div>
      <h2 className="mt-3 text-base font-black">Historico ELLO</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message}</p>
      <Link
        to="/app/search"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-black text-white"
      >
        Buscar profissionais
      </Link>
    </section>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{children}</p>;
}
