import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, MessageCircle } from "lucide-react";
import { PrimaryButton } from "@/components/ello/actions";
import { ElloSurface } from "@/components/ello/primitives";
import {
  EmptyStateCard,
  ScreenHeader,
  ScreenMain,
  ScreenPage,
  ScreenTabs,
  StatusPill,
} from "@/components/ello/screen-layout";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listMyProfessionalQuotes,
  respondToProfessionalQuote,
  type ProfessionalQuoteItem,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/business/quotes")({
  component: ProfessionalQuotesScreen,
});

function ProfessionalQuotesScreen() {
  const { configured, user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("received");
  const quotesQuery = useQuery({
    queryKey: ["ello", "me", "professional-quotes", user?.id],
    queryFn: () => listMyProfessionalQuotes(user!.id),
    enabled: Boolean(configured && user),
  });
  const responseMutation = useMutation({
    mutationFn: (input: {
      quoteRequestId: string;
      responseEta: string;
      responseMessage: string;
      responsePrice: string;
    }) => respondToProfessionalQuote({ userId: user!.id, ...input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "professional-quotes", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
      ]);
    },
  });
  const quotes = (quotesQuery.data ?? []).filter((quote) =>
    tab === "received" ? quote.status === "new" : quote.status !== "new",
  );

  return (
    <ScreenPage>
      <ScreenHeader title="Orçamentos" subtitle="Solicitações recebidas" backTo="/app/business" />

      <ScreenTabs
        tabs={[
          { value: "received", label: "Recebidos" },
          { value: "sent", label: "Enviados" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScreenMain>
        {!configured || !user ? (
          <Empty text="Entre na sua conta profissional para acessar os orçamentos." />
        ) : quotesQuery.isPending ? (
          <Empty text="Carregando orçamentos..." />
        ) : quotes.length ? (
          quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              responding={responseMutation.isPending}
              onRespond={(response) =>
                responseMutation.mutate({ quoteRequestId: quote.id, ...response })
              }
            />
          ))
        ) : (
          <Empty
            text={tab === "received" ? "Nenhum novo orçamento." : "Nenhum orçamento enviado."}
          />
        )}
      </ScreenMain>
    </ScreenPage>
  );
}

function QuoteCard({
  onRespond,
  quote,
  responding,
}: {
  onRespond: (input: {
    responseEta: string;
    responseMessage: string;
    responsePrice: string;
  }) => void;
  quote: ProfessionalQuoteItem;
  responding: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [eta, setEta] = useState("");
  const [message, setMessage] = useState("");

  return (
    <ElloSurface className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black">{quote.serviceTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{quote.clientCity}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {quote.description}
          </p>
        </div>
        <StatusPill tone={quote.status === "new" ? "primary" : "muted"}>
          {quote.status === "new" ? "Novo" : quote.status}
        </StatusPill>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to="/app/messages"
          search={{ quote: quote.id }}
          className="ello-icon-btn"
          aria-label="Abrir conversa"
        >
          <MessageCircle className="size-4" />
        </Link>
        {quote.status === "new" ? (
          <PrimaryButton
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="!h-10 flex-1 !text-xs"
          >
            Responder orçamento
          </PrimaryButton>
        ) : (
          <div className="flex flex-1 flex-col items-end text-xs">
            <strong className="font-black">{quote.responsePrice ?? "A combinar"}</strong>
            <p className="text-muted-foreground">{quote.responseEta}</p>
          </div>
        )}
      </div>
      {open ? (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Valor, ex: R$ 150,00"
            className="ello-input"
          />
          <input
            value={eta}
            onChange={(event) => setEta(event.target.value)}
            placeholder="Prazo, ex: 1 dia"
            className="ello-input"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Descreva o que está incluído..."
            className="ello-textarea"
          />
          <PrimaryButton
            type="button"
            disabled={!price.trim() || !eta.trim() || !message.trim() || responding}
            onClick={() =>
              onRespond({ responsePrice: price, responseEta: eta, responseMessage: message })
            }
            className="!h-11"
          >
            Enviar orçamento
          </PrimaryButton>
        </div>
      ) : null}
    </ElloSurface>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <EmptyStateCard icon={<FileText className="size-6" />} title="Orçamentos" description={text} />
  );
}
