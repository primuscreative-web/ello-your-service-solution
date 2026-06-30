import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, MoreVertical, Paperclip, SendHorizontal } from "lucide-react";
import { z } from "zod";
import { PrimaryButton } from "@/components/ello/actions";
import { AvatarPhoto } from "@/components/ello/media";
import { EmptyStateCard, ScreenPage } from "@/components/ello/screen-layout";
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
    <ScreenPage className="flex min-h-dvh flex-col !pb-0">
      <header className="ello-header-bar flex items-center gap-3">
        <Link to="/app" aria-label="Voltar" className="ello-icon-btn btn-tactile shrink-0">
          <ChevronLeft className="size-5" />
        </Link>
        <AvatarPhoto
          imageUrl={null}
          initials={initialsFor(activeThread?.title ?? "ELLO")}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black">{activeThread?.title ?? "Mensagens"}</h1>
          <p className="text-[11px] font-medium text-success">
            {activeThread ? activeThread.subtitle : "Atendimento ELLO"}
          </p>
        </div>
        <button type="button" className="ello-icon-btn" aria-label="Mais opções">
          <MoreVertical className="size-4" />
        </button>
      </header>

      {threads.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b border-border/60 bg-white/50 px-4 py-3 backdrop-blur-xl">
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

      <main className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {messagesQuery.isPending ? (
          <p className="text-center text-xs text-muted-foreground">Carregando conversa...</p>
        ) : messagesQuery.data?.length ? (
          messagesQuery.data.map((item) => (
            <div
              key={item.id}
              className={`max-w-[78%] rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed shadow-[var(--ello-shadow-sm)] ${
                item.mine
                  ? "ml-auto rounded-br-md bg-primary text-white"
                  : "rounded-bl-md border border-border/60 bg-white/95"
              }`}
            >
              <p>{item.body}</p>
              <span className="mt-1 block text-right text-[10px] opacity-65">{item.timestamp}</span>
            </div>
          ))
        ) : (
          <p className="ello-surface mx-auto max-w-64 p-4 text-center text-xs leading-relaxed text-muted-foreground">
            Esta conversa ainda não tem mensagens. Escreva a primeira resposta.
          </p>
        )}
        {activeThread && !activeThread.professionalView && activeThread.status === "quoted" ? (
          <Link to="/app/quote/$id" params={{ id: activeThread.id }}>
            <PrimaryButton className="ml-auto !w-fit px-5 !text-xs">Ver orçamento recebido</PrimaryButton>
          </Link>
        ) : null}
        {sendMutation.error ? (
          <p className="rounded-[1rem] bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {sendMutation.error.message}
          </p>
        ) : null}
      </main>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (message.trim() && activeThreadId) sendMutation.mutate();
        }}
        className="flex items-center gap-2 border-t border-border/60 bg-white/80 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"
      >
        <button type="button" aria-label="Anexar arquivo" className="ello-icon-btn !size-10">
          <Paperclip className="size-4" />
        </button>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Digite sua mensagem..."
          className="ello-input !h-11 min-w-0 flex-1 !rounded-full"
        />
        <button
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!message.trim() || sendMutation.isPending}
          className="grid size-10 place-items-center rounded-full bg-primary text-white shadow-[var(--ello-shadow-glow)] disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
        >
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </ScreenPage>
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
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
        active ? "bg-primary text-white shadow-[var(--ello-shadow-glow)]" : "bg-white/90 text-foreground border border-border/60"
      }`}
    >
      {thread.title}
    </button>
  );
}

function EmptyMessages({ text }: { text: string }) {
  return (
    <ScreenPage className="grid place-items-center">
      <EmptyStateCard
        title="Mensagens"
        description={text}
        icon={<SendHorizontal className="size-6" />}
        action={
          <Link to="/app/search">
            <PrimaryButton className="!w-auto px-6">Buscar profissionais</PrimaryButton>
          </Link>
        }
      />
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
