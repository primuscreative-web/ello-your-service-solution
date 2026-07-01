import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/ello/actions";
import { AvatarPhoto } from "@/components/ello/media";
import { ElloSurface } from "@/components/ello/primitives";
import { ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";
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
    <ScreenPage className="!pb-28">
      <ScreenHeader
        title="Orçamento recebido"
        subtitle="Revise e responda"
        backTo="/app/messages"
      />

      <ScreenMain>
        <ElloSurface className="flex items-center gap-3 p-4">
          <AvatarPhoto
            imageUrl={quote.professionalAvatarUrl}
            initials={initialsFor(quote.professionalName)}
            size={56}
          />
          <div>
            <h2 className="text-base font-black">{quote.professionalName}</h2>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <strong>4,9</strong>
              <Star className="size-4 fill-[oklch(0.78_0.14_75)] text-[oklch(0.78_0.14_75)]" />
              <span className="text-muted-foreground">profissional ELLO</span>
            </div>
          </div>
        </ElloSurface>

        <ElloSurface className="divide-y divide-border/60 px-4">
          <QuoteRow label="Serviço" value={quote.serviceTitle} />
          <QuoteRow label="Valor" value={quote.responsePrice ?? "A combinar"} large />
          <QuoteRow label="Prazo" value={quote.responseEta ?? "A combinar"} large />
          <QuoteRow label="Descrição" value={quote.responseMessage ?? quote.description} />
          <QuoteRow label="Local" value={quote.location} />
        </ElloSurface>

        {statusMutation.error ? (
          <p className="rounded-[1rem] bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {statusMutation.error.message}
          </p>
        ) : null}
      </ScreenMain>

      {!quote.professionalView && quote.status === "quoted" ? (
        <div className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[393px] -translate-x-1/2 grid-cols-2 gap-3 border-t border-border/60 bg-white/90 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <SecondaryButton
            type="button"
            onClick={() => statusMutation.mutate("declined")}
            disabled={statusMutation.isPending}
            className="!h-12"
          >
            Recusar
          </SecondaryButton>
          <button
            type="button"
            onClick={() => statusMutation.mutate("accepted")}
            disabled={statusMutation.isPending}
            className="ello-btn-primary btn-tactile !h-12 !bg-gradient-to-r !from-emerald-600 !to-emerald-500"
          >
            Aceitar orçamento
          </button>
        </div>
      ) : null}
    </ScreenPage>
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
      <dd
        className={`mt-2 leading-relaxed ${large ? "text-xl font-black" : "text-sm text-muted-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function CenteredMessage({ children }: { children: string }) {
  return (
    <ScreenPage className="grid place-items-center px-8 text-center">
      <p className="text-sm font-semibold text-muted-foreground">{children}</p>
    </ScreenPage>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
