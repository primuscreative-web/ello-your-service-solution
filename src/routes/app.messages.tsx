import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, MoreVertical, Paperclip, SendHorizontal } from "lucide-react";
import { z } from "zod";
import { AvatarPhoto } from "@/components/ello/media";
import { useAuth } from "@/lib/auth/auth-context";
import {
  listMyQuoteThreads,
  listQuoteMessages,
  sendQuoteMessage,
  type QuoteThread,
} from "@/lib/ello-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/app/messages")({
  validateSearch: z.object({ quote: z.string().optional() }),
  component: MessagesScreen,
});

function MessagesScreen() {
  const { quote } = Route.useSearch();
  const { configured, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const threadsQuery = useQuery({
    queryKey: ["ello", "me", "quote-threads", user?.id],
    queryFn: () => listMyQuoteThreads(user!.id),
    enabled: Boolean(configured && user),
  });
  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;
  const messagesQuery = useQuery({
    queryKey: ["ello", "quote-messages", activeThreadId, user?.id],
    queryFn: () => listQuoteMessages({ quoteRequestId: activeThreadId!, currentUserId: user!.id }),
    enabled: Boolean(configured && user && activeThreadId),
  });
  const sendMutation = useMutation({
    mutationFn: () =>
      sendQuoteMessage({
        quoteRequestId: activeThreadId!,
        senderUserId: user!.id,
        body: message,
      }),
    onSuccess: async () => {
      setMessage("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "quote-messages", activeThreadId, user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "quote-threads", user?.id],
        }),
      ]);
    },
  });

  useEffect(() => {
    const requested = threads.find((thread) => thread.id === quote);
    if (requested) setActiveThreadId(requested.id);
    else if (!activeThreadId && threads[0]) setActiveThreadId(threads[0].id);
  }, [activeThreadId, quote, threads]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!configured || !user || !activeThreadId || !supabase) return;
    const channel = supabase
      .channel(`ello-messages-${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quote_messages",
          filter: `quote_request_id=eq.${activeThreadId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["ello", "quote-messages", activeThreadId, user.id],
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeThreadId, configured, queryClient, user]);

  if (!configured || !user) {
    return <EmptyMessages text="Entre na sua conta para ver suas conversas." />;
  }
  if (threadsQuery.isPending) return <EmptyMessages text="Carregando conversas..." />;
  if (!threads.length) {
    return <EmptyMessages text="Quando você solicitar um orçamento, a conversa aparecerá aqui." />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex items-center border-b border-border px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <Link to="/app" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <AvatarPhoto
          src={null}
          alt={activeThread?.title ?? "Conversa"}
          initials={initialsFor(activeThread?.title ?? "ELLO")}
          size="sm"
        />
        <div className="ml-3 min-w-0 flex-1">
          <h1 className="truncate text-sm font-black">{activeThread?.title ?? "Mensagens"}</h1>
          <p className="text-[11px] text-emerald-600">
            {activeThread ? activeThread.subtitle : "Atendimento ELLO"}
          </p>
        </div>
        <MoreVertical className="size-5" />
      </header>

      {threads.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
          {threads.map((thread) => (
            <ThreadChip
              key={thread.id}
              active={thread.id === activeThreadId}
              thread={thread}
              onClick={() => {
                setActiveThreadId(thread.id);
                void navigate({
                  to: "/app/messages",
                  search: { quote: thread.id },
                  replace: true,
                });
              }}
            />
          ))}
        </div>
      ) : null}

      <main className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5">
        {messagesQuery.isPending ? (
          <p className="text-center text-xs text-muted-foreground">Carregando conversa...</p>
        ) : messagesQuery.data?.length ? (
          messagesQuery.data.map((item) => (
            <div
              key={item.id}
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                item.mine
                  ? "ml-auto rounded-br-md bg-primary text-white"
                  : "rounded-bl-md bg-white shadow-sm"
              }`}
            >
              <p>{item.body}</p>
              <span className="mt-1 block text-right text-[10px] opacity-65">{item.timestamp}</span>
            </div>
          ))
        ) : (
          <p className="mx-auto max-w-64 rounded-2xl bg-white p-4 text-center text-xs leading-relaxed text-muted-foreground shadow-sm">
            Esta conversa ainda não tem mensagens. Escreva a primeira resposta.
          </p>
        )}
        {activeThread && !activeThread.professionalView && activeThread.status === "quoted" ? (
          <Link
            to="/app/quote/$id"
            params={{ id: activeThread.id }}
            className="ml-auto flex h-11 w-fit items-center rounded-xl bg-primary px-4 text-xs font-bold text-white"
          >
            Ver orçamento recebido
          </Link>
        ) : null}
        {sendMutation.error ? (
          <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {sendMutation.error.message}
          </p>
        ) : null}
      </main>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (message.trim() && activeThreadId) sendMutation.mutate();
        }}
        className="flex items-center gap-2 border-t border-border bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3"
      >
        <button
          type="button"
          aria-label="Anexar arquivo"
          className="grid size-10 place-items-center"
        >
          <Paperclip className="size-5" />
        </button>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Digite sua mensagem..."
          className="h-11 min-w-0 flex-1 rounded-full border border-border px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!message.trim() || sendMutation.isPending}
          className="grid size-10 place-items-center rounded-full text-primary disabled:text-muted-foreground"
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}

function ThreadChip({
  active,
  onClick,
  thread,
}: {
  active: boolean;
  onClick: () => void;
  thread: QuoteThread;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
        active ? "bg-primary text-white" : "bg-secondary text-foreground"
      }`}
    >
      {thread.title}
    </button>
  );
}

function EmptyMessages({ text }: { text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-white px-8 text-center">
      <div>
        <h1 className="text-xl font-black">Mensagens</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        <Link
          to="/app/search"
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
        >
          Buscar profissionais
        </Link>
      </div>
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
