import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MessageCircle } from "lucide-react";
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
  const [tab, setTab] = useState<"received" | "sent">("received");
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
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app/business" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Orçamentos</h1>
        <span className="size-10" />
      </header>
      <div className="grid grid-cols-2 border-b border-border">
        <Tab active={tab === "received"} onClick={() => setTab("received")}>
          Recebidos
        </Tab>
        <Tab active={tab === "sent"} onClick={() => setTab("sent")}>
          Enviados
        </Tab>
      </div>
      <main className="space-y-3 px-5 py-5">
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
      </main>
    </div>
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
    <article className="rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black">{quote.serviceTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{quote.clientCity}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed">{quote.description}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
          {quote.status === "new" ? "Novo" : quote.status}
        </span>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          to="/app/messages"
          search={{ quote: quote.id }}
          className="grid size-10 place-items-center rounded-xl border border-border"
          aria-label="Abrir conversa"
        >
          <MessageCircle className="size-4" />
        </Link>
        {quote.status === "new" ? (
          <button
            onClick={() => setOpen((value) => !value)}
            className="h-10 flex-1 rounded-xl bg-primary text-xs font-bold text-white"
          >
            Responder orçamento
          </button>
        ) : (
          <div className="flex-1 text-right text-xs">
            <strong>{quote.responsePrice ?? "A combinar"}</strong>
            <p className="text-muted-foreground">{quote.responseEta}</p>
          </div>
        )}
      </div>
      {open ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Valor, ex: R$ 150,00"
            className="h-11 w-full rounded-xl border border-border px-3 text-sm"
          />
          <input
            value={eta}
            onChange={(event) => setEta(event.target.value)}
            placeholder="Prazo, ex: 1 dia"
            className="h-11 w-full rounded-xl border border-border px-3 text-sm"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Descreva o que está incluído..."
            className="min-h-24 w-full rounded-xl border border-border p-3 text-sm"
          />
          <button
            disabled={!price.trim() || !eta.trim() || !message.trim() || responding}
            onClick={() =>
              onRespond({ responsePrice: price, responseEta: eta, responseMessage: message })
            }
            className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-45"
          >
            Enviar orçamento
          </button>
        </div>
      ) : null}
    </article>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 py-4 text-sm font-bold ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-20 text-center text-sm text-muted-foreground">{text}</p>;
}
