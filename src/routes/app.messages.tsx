import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CalendarDays, FileText, Image as ImageIcon, MoreVertical } from "lucide-react";
import { ChatComposer, ProPhoto, ServicePhoto } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createAppointmentFromQuote,
  listMyQuoteThreads,
  listQuoteMessages,
  sendQuoteMessage,
  type QuoteThread,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/messages")({
  validateSearch: z.object({
    quote: z.string().optional(),
  }),
  component: Messages,
});

function Messages() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { quote } = Route.useSearch();
  const { configured, user } = useAuth();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(defaultAppointmentDate());
  const quoteThreadsQuery = useQuery({
    queryKey: ["ello", "me", "quote-threads", user?.id],
    queryFn: () => listMyQuoteThreads(user!.id),
    enabled: Boolean(configured && user),
  });
  const quoteThreads = useMemo(() => quoteThreadsQuery.data ?? [], [quoteThreadsQuery.data]);
  const activeThread = quoteThreads.find((thread) => thread.id === activeThreadId) ?? null;
  const messagesQuery = useQuery({
    queryKey: ["ello", "quote-messages", activeThreadId, user?.id],
    queryFn: () =>
      listQuoteMessages({
        quoteRequestId: activeThreadId!,
        currentUserId: user!.id,
      }),
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
      await queryClient.invalidateQueries({
        queryKey: ["ello", "quote-messages", activeThreadId, user?.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["ello", "me", "quote-threads", user?.id],
      });
    },
  });
  const appointmentMutation = useMutation({
    mutationFn: () =>
      createAppointmentFromQuote({
        quoteRequestId: activeThreadId!,
        startsAt: new Date(appointmentDate).toISOString(),
        notes: activeThread ? `Agendamento criado pela conversa: ${activeThread.title}` : null,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "agenda", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "quote-threads", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
      ]);
    },
  });

  useEffect(() => {
    const queryThread = quoteThreads.find((thread) => thread.id === quote);
    if (queryThread && activeThreadId !== queryThread.id) {
      setActiveThreadId(queryThread.id);
      return;
    }

    if (!activeThreadId && quoteThreads[0]) {
      setActiveThreadId(quoteThreads[0].id);
    }
  }, [activeThreadId, quote, quoteThreads]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!configured || !user || !activeThreadId || !supabase) return;

    const channel = supabase
      .channel(`ello-quote-messages-${activeThreadId}`)
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
          void queryClient.invalidateQueries({
            queryKey: ["ello", "me", "quote-threads", user.id],
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeThreadId, configured, queryClient, user]);

  const canSend = Boolean(configured && user && activeThreadId && message.trim());

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <header className="ello-header flex items-center gap-3 px-4 py-4 text-white">
        <Link to="/app" className="grid size-8 place-items-center rounded-full bg-white/10">
          &larr;
        </Link>
        <ProPhoto initials={activeThread ? initialsFor(activeThread.title) : "MC"} size={34} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black">{activeThread?.title ?? "Mensagens ELLO"}</h1>
          <p className="truncate text-[10px] text-white/75">
            {activeThread?.subtitle ?? "Orcamentos e atendimentos"}
          </p>
        </div>
        <MoreVertical className="size-5" />
      </header>

      <main className="flex-1 space-y-3 px-4 py-4">
        {configured && user ? (
          <section className="ello-card rounded-xl p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black">Orcamentos reais</h2>
              <span className="text-[10px] font-bold text-muted-foreground">
                {quoteThreadsQuery.isPending ? "Carregando" : `${quoteThreads.length} ativos`}
              </span>
            </div>
            {quoteThreads.length ? (
              <div className="space-y-2">
                {quoteThreads.map((thread) => (
                  <ThreadButton
                    key={thread.id}
                    thread={thread}
                    active={thread.id === activeThreadId}
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
            ) : (
              <p className="rounded-lg bg-background p-3 text-xs font-semibold text-muted-foreground">
                Nenhum orcamento real ainda. Solicite um orcamento em um profissional vindo do
                Supabase para ele aparecer aqui.
              </p>
            )}
          </section>
        ) : (
          <section className="ello-card rounded-xl p-3 text-xs font-semibold text-muted-foreground">
            Entre na sua conta para ver conversas reais salvas no Supabase.
          </section>
        )}

        {activeThread ? (
          <section className="space-y-2">
            {messagesQuery.isPending ? (
              <p className="rounded-xl bg-white p-3 text-xs font-semibold text-muted-foreground">
                Carregando conversa...
              </p>
            ) : messagesQuery.data?.length ? (
              messagesQuery.data.map((item) => (
                <Bubble key={item.id} align={item.mine ? "right" : "left"}>
                  <p>{item.body}</p>
                  <span className="mt-1 block text-right text-[9px] opacity-70">
                    {item.timestamp}
                  </span>
                </Bubble>
              ))
            ) : (
              <Bubble>
                Este orcamento ainda nao tem mensagens. Envie a primeira resposta para iniciar o
                atendimento.
              </Bubble>
            )}
            {sendMutation.error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {sendMutation.error.message}
              </p>
            ) : null}
            {!activeThread.professionalView ? (
              <section className="ello-card rounded-xl p-3">
                <p className="mb-3 rounded-lg border border-sky-100 bg-sky-50 p-2 text-[10px] font-semibold leading-relaxed text-sky-900">
                  {PAYMENT_POLICY.quotePaymentNotice}
                </p>
                <div className="flex items-center gap-2 text-sm font-black">
                  <CalendarDays className="size-4 text-[#083d63]" />
                  Agendar servico
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                  />
                  <button
                    disabled={appointmentMutation.isPending || !appointmentDate}
                    onClick={() => appointmentMutation.mutate()}
                    className="rounded-lg bg-[#083d63] px-3 text-[10px] font-black text-white disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Confirmar
                  </button>
                </div>
                {appointmentMutation.error ? (
                  <p className="mt-2 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                    {appointmentMutation.error.message}
                  </p>
                ) : appointmentMutation.isSuccess ? (
                  <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-[10px] font-semibold text-emerald-800">
                    Agendamento salvo no Supabase e enviado para a Agenda.
                  </p>
                ) : null}
              </section>
            ) : null}
          </section>
        ) : (
          <DemoConversation />
        )}
      </main>

      <ChatComposer
        value={message}
        onChange={setMessage}
        onSend={() => canSend && sendMutation.mutate()}
        disabled={!activeThreadId || sendMutation.isPending}
        placeholder={activeThreadId ? "Enviar mensagem" : "Selecione um orcamento"}
      />
    </div>
  );
}

function ThreadButton({
  thread,
  active,
  onClick,
}: {
  thread: QuoteThread;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg p-3 text-left ${
        active ? "bg-primary/15 ring-1 ring-primary/30" : "bg-background"
      }`}
    >
      <div className="flex items-start gap-3">
        <ProPhoto initials={initialsFor(thread.title)} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-black">{thread.title}</p>
            <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
              {thread.timestamp}
            </span>
          </div>
          <p className="truncate text-[10px] text-muted-foreground">
            {thread.subtitle} · {thread.status}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px]">{thread.lastMessage}</p>
        </div>
      </div>
    </button>
  );
}

function DemoConversation() {
  return (
    <>
      <Bubble align="right">Consegue um horario ainda hoje?</Bubble>
      <div className="flex items-start gap-2">
        <ProPhoto initials="MC" size={28} />
        <div className="max-w-[78%] rounded-xl rounded-tl-sm bg-white p-3 text-xs shadow-sm">
          Minha panela eletrica parou e preciso avaliar o painel.
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ServicePhoto index={2} className="h-20" />
            <ServicePhoto index={5} className="h-20" />
          </div>
        </div>
      </div>

      <Bubble align="right">
        Ola! Sim, estou disponivel. Voce consegue me mandar uma foto do disjuntor?
      </Bubble>

      <div className="ml-auto max-w-[78%] rounded-lg bg-primary px-3 py-2 text-center text-xs font-black text-white">
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3.5" />
          Enviar Proposta
        </span>
      </div>

      <section className="ello-card rounded-xl p-3">
        <div className="flex items-center gap-2 text-sm font-black">
          <CalendarDays className="size-4 text-[#083d63]" />
          Agendamento Confirmado
        </div>
        <p className="mt-2 text-xs">
          Marcos
          <br />
          Qui, 14 de Marco, 10:00 - Instalacao de Chuveiro
        </p>
        <div className="mt-3 h-24 rounded-lg bg-[#dce9ed] p-3">
          <div className="grid h-full place-items-center rounded bg-white/45 text-[#083d63]">
            <ImageIcon className="size-7" />
          </div>
        </div>
      </section>
    </>
  );
}

function Bubble({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`max-w-[78%] rounded-xl px-3 py-2 text-xs shadow-sm ${
        align === "right" ? "ml-auto bg-primary text-white" : "bg-white"
      }`}
    >
      {children}
    </div>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function defaultAppointmentDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
