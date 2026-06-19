import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Star } from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
import { useAuth } from "@/lib/auth/auth-context";
import { getAuthorizedQuoteDetail, updateClientQuoteStatus } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/quote/$id")({
  component: QuoteDetailScreen,
});

function QuoteDetailScreen() {
  const { id } = Route.useParams();
  const { configured, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quoteQuery = useQuery({
    queryKey: ["ello", "quote", id, user?.id],
    queryFn: () => getAuthorizedQuoteDetail({ quoteRequestId: id, userId: user!.id }),
    enabled: Boolean(configured && user),
  });
  const quote = quoteQuery.data;
  const statusMutation = useMutation({
    mutationFn: (status: "accepted" | "declined") =>
      updateClientQuoteStatus({ quoteRequestId: id, status, userId: user!.id }),
    onSuccess: async (_, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ello", "quote", id, user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["ello", "me", "quote-threads", user?.id] }),
      ]);
      if (status === "accepted" && quote) {
        await navigate({
          to: "/app/professional/$id/schedule",
          params: { id: quote.professionalId },
          search: { quote: id },
        });
      }
    },
  });

  if (!configured || !user) {
    return <CenteredMessage>Entre na sua conta para visualizar este orçamento.</CenteredMessage>;
  }
  if (quoteQuery.isPending) return <CenteredMessage>Carregando orçamento...</CenteredMessage>;
  if (quoteQuery.error) return <CenteredMessage>{quoteQuery.error.message}</CenteredMessage>;
  if (!quote)
    return <CenteredMessage>Orçamento não encontrado ou sem permissão de acesso.</CenteredMessage>;

  return (
    <div className="min-h-dvh bg-white">
      <header className="flex items-center border-b border-border px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link
          to="/app/messages"
          search={{ quote: id }}
          aria-label="Voltar"
          className="grid size-10 place-items-center"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Orçamento recebido</h1>
        <span className="size-10" />
      </header>

      <main className="px-5 py-6">
        <section className="flex items-center gap-3 border-b border-border pb-5">
          <AvatarPhoto
            imageUrl={quote.professionalAvatarUrl}
            initials={initialsFor(quote.professionalName)}
            size={56}
          />
          <div>
            <h2 className="text-base font-black">{quote.professionalName}</h2>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <strong>4,9</strong>
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-muted-foreground">profissional ELLO</span>
            </div>
          </div>
        </section>

        <dl className="divide-y divide-border">
          <QuoteRow label="Serviço" value={quote.serviceTitle} />
          <QuoteRow label="Valor" value={quote.responsePrice ?? "A combinar"} large />
          <QuoteRow label="Prazo" value={quote.responseEta ?? "A combinar"} large />
          <QuoteRow label="Descrição" value={quote.responseMessage ?? quote.description} />
          <QuoteRow label="Local" value={quote.location} />
        </dl>

        {statusMutation.error ? (
          <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {statusMutation.error.message}
          </p>
        ) : null}
      </main>

      {!quote.professionalView && quote.status === "quoted" ? (
        <div className="fixed bottom-0 left-1/2 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-2 gap-3 border-t border-border bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <button
            onClick={() => statusMutation.mutate("declined")}
            disabled={statusMutation.isPending}
            className="h-12 rounded-xl border border-border text-sm font-bold"
          >
            Recusar
          </button>
          <button
            onClick={() => statusMutation.mutate("accepted")}
            disabled={statusMutation.isPending}
            className="h-12 rounded-xl bg-emerald-600 text-sm font-bold text-white"
          >
            Aceitar orçamento
          </button>
        </div>
      ) : null}
    </div>
  );
}

function QuoteRow({
  label,
  large = false,
  value,
}: {
  label: string;
  large?: boolean;
  value: string;
}) {
  return (
    <div className="py-5">
      <dt className="text-sm font-black">{label}</dt>
      <dd className={`mt-2 leading-relaxed ${large ? "text-xl font-black" : "text-sm"}`}>
        {value}
      </dd>
    </div>
  );
}

function CenteredMessage({ children }: { children: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-white px-8 text-center text-sm font-semibold text-muted-foreground">
      {children}
    </div>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
