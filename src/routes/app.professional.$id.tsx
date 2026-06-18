import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type React from "react";
import { Award, BadgeCheck, ClipboardCheck, Heart, MessageCircle, Share2 } from "lucide-react";
import { getProfessional, type Professional } from "@/lib/ello-data";
import {
  CyanButton,
  ProPhoto,
  RatingLine,
  ServicePhoto,
  TrustBadge,
} from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createDetailedQuoteRequest,
  getProfessionalById,
  listMyFavoriteProfessionalIds,
  listProfessionalPortfolio,
  setProfessionalFavorite,
} from "@/lib/ello-repository";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";

export const Route = createFileRoute("/app/professional/$id")({
  component: ProfessionalDetail,
  loader: ({ params }): { id: string; initialPro: Professional | null } => {
    const initialPro = getProfessional(params.id) ?? null;
    if (!initialPro && !isUuid(params.id)) throw notFound();
    return { id: params.id, initialPro };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Profissional nao encontrado.
    </div>
  ),
});

function ProfessionalDetail() {
  const queryClient = useQueryClient();
  const { id, initialPro } = Route.useLoaderData() as {
    id: string;
    initialPro: Professional | null;
  };
  const { configured, user } = useAuth();
  const [quoteDescription, setQuoteDescription] = React.useState("");
  const [quoteLocation, setQuoteLocation] = React.useState("");
  const [quoteDesiredDate, setQuoteDesiredDate] = React.useState("");
  const professionalQuery = useQuery({
    queryKey: ["ello", "professional", id],
    queryFn: () => getProfessionalById(id),
    enabled: !initialPro && isUuid(id),
  });
  const portfolioQuery = useQuery({
    queryKey: ["ello", "professional", id, "portfolio"],
    queryFn: () => listProfessionalPortfolio(id),
    enabled: isUuid(id),
  });
  const favoritesQuery = useQuery({
    queryKey: ["ello", "me", "favorite-professional-ids", user?.id],
    queryFn: () => listMyFavoriteProfessionalIds(user!.id),
    enabled: Boolean(configured && user),
  });
  const pro = initialPro ?? professionalQuery.data;
  const portfolioItems = portfolioQuery.data ?? [];
  const favoriteIds = new Set(favoritesQuery.data ?? []);
  const isFavorite = pro ? favoriteIds.has(pro.id) : false;
  const canPersistQuote = Boolean(configured && user && pro && isUuid(pro.id));
  const quoteMutation = useMutation({
    mutationFn: (input: { description: string; location: string; desiredDate?: string | null }) => {
      if (!pro) throw new Error("Profissional ainda nao foi carregado.");
      return createDetailedQuoteRequest({
        userId: user!.id,
        professionalId: pro.id,
        description: input.description,
        location: input.location,
        desiredDate: input.desiredDate,
      });
    },
    onSuccess: async () => {
      setQuoteDescription("");
      setQuoteDesiredDate("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "quote-threads", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "request-history", user?.id],
        }),
      ]);
    },
  });
  const favoriteMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Entre na sua conta para favoritar profissionais.");
      if (!pro) throw new Error("Profissional ainda nao foi carregado.");
      return setProfessionalFavorite({
        userId: user.id,
        professionalId: pro.id,
        favorite: !isFavorite,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ello", "me", "favorite-professional-ids", user?.id],
      });
    },
  });

  if (!pro && professionalQuery.isPending) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-8 text-center text-sm font-semibold text-muted-foreground">
        Carregando profissional...
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Profissional nao encontrado.
      </div>
    );
  }

  const canSendQuote =
    canPersistQuote &&
    quoteDescription.trim().length >= 10 &&
    quoteLocation.trim().length >= 3 &&
    !quoteMutation.isPending &&
    !quoteMutation.isSuccess;

  return (
    <div className="pb-5">
      <header className="ello-header relative h-36 px-4 pt-5 text-white">
        <div className="flex items-center justify-between">
          <Link
            to="/app/search"
            className="grid size-8 place-items-center rounded-full bg-white/10"
          >
            &larr;
          </Link>
          <span className="text-xl font-black tracking-tight">ELLO</span>
          <div className="flex items-center gap-2">
            <button
              className="grid size-8 place-items-center rounded-full bg-white/10 disabled:opacity-45"
              disabled={!configured || !user || !pro || !isUuid(pro.id) || favoriteMutation.isPending}
              onClick={() => favoriteMutation.mutate()}
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={`size-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
            </button>
            <Share2 className="size-5" />
          </div>
        </div>
      </header>

      <main className="-mt-14 px-4">
        <section className="ello-card relative rounded-xl p-4 pt-14">
          <ProPhoto
            initials={pro.initials}
            imageUrl={pro.avatarUrl}
            size={92}
            className="absolute -top-12 left-4"
          />
          <div className="absolute right-4 top-4">
            <TrustBadge label={pro.trustLevel} />
          </div>

          <h1 className="text-xl font-black uppercase leading-tight">
            {pro.name} - {shortProfession(pro.profession)}
          </h1>
          <p className="text-xs text-muted-foreground">Profissional · {pro.category}</p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Info
              label="Avaliacao"
              value={
                <RatingLine rating={String(pro.rating)} reviews={`${pro.completedJobs} servicos`} />
              }
            />
            <Info label="Experiencia" value={`${pro.experienceYears} anos`} />
            <Info label="Cidade" value={pro.city.replace(", SP", "")} />
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-black">Portfolio de Servicos</h2>
            <div className="flex gap-3 text-xs font-semibold text-muted-foreground">
              <span>Servicos</span>
              <span>Agenda</span>
              <span>Avaliacoes</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(portfolioItems.length
              ? portfolioItems.slice(0, 6)
              : [
                  { id: "disjuntores", title: "Instalacao de Disjuntores", mediaUrl: null },
                  { id: "reparos", title: "Reparos Residenciais", mediaUrl: null },
                  { id: "lampadas", title: "Substituicao de Lampadas LED", mediaUrl: null },
                ]
            ).map((item, index) => (
              <ServicePhoto
                key={item.id}
                index={index}
                label={item.title}
                imageUrl={item.mediaUrl}
                className="aspect-square"
              />
            ))}
          </div>
        </section>

        <section className="mt-4">
          <h2 className="text-sm font-black">Verificados</h2>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {["NR10", "SENAI", "SAMHQ", "Selo"].map((cert, index) => (
              <div
                key={cert}
                className="grid aspect-square place-items-center rounded-full border-2 border-[#d4a634] bg-[#fff5ce] text-center text-[10px] font-black text-[#805f00]"
              >
                {index === 3 ? <BadgeCheck className="size-6 text-[#083d63]" /> : cert}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 ello-card rounded-xl p-4">
          <h2 className="text-sm font-black">Sobre Mim</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pro.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pro.specialties.map((item) => (
              <span key={item} className="rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#083d63]">
            Pagamento externo
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-sky-900">
            {PAYMENT_POLICY.quotePaymentNotice}
          </p>
        </section>

        <section className="mt-4 ello-card rounded-xl p-4">
          <h2 className="text-sm font-black">Solicitar orcamento</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Explique o problema, informe onde sera o atendimento e, se quiser, sugira uma data.
          </p>
          <textarea
            value={quoteDescription}
            onChange={(event) => setQuoteDescription(event.target.value)}
            placeholder={`Ex: preciso de ${pro.specialties[0] ?? pro.profession.toLowerCase()} esta semana...`}
            disabled={!canPersistQuote || quoteMutation.isPending || quoteMutation.isSuccess}
            className="mt-3 min-h-24 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              value={quoteLocation}
              onChange={(event) => setQuoteLocation(event.target.value)}
              placeholder={pro.city || "Cidade ou bairro"}
              disabled={!canPersistQuote || quoteMutation.isPending || quoteMutation.isSuccess}
              className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
            />
            <input
              type="datetime-local"
              value={quoteDesiredDate}
              onChange={(event) => setQuoteDesiredDate(event.target.value)}
              disabled={!canPersistQuote || quoteMutation.isPending || quoteMutation.isSuccess}
              className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
            />
          </div>
        </section>

        <section className="mt-4 ello-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <h2 className="text-sm font-black">Niveis de Confianca</h2>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-[#b8782a] via-[#d4a634] to-[#083d63]" />
          <div className="mt-1 flex justify-between text-[10px] font-bold text-muted-foreground">
            <span>Bronze</span>
            <span>Elite</span>
          </div>
        </section>

        <div className="sticky bottom-20 mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-white p-2 shadow-xl">
          <Link
            to="/app/messages"
            className="grid h-10 place-items-center rounded-lg bg-[#083d63] text-xs font-bold text-white"
          >
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" />
              Conversar por Chat
            </span>
          </Link>
          <CyanButton
            className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            disabled={!canSendQuote}
            onClick={() =>
              quoteMutation.mutate({
                description: quoteDescription,
                location: quoteLocation || pro.city,
                desiredDate: quoteDesiredDate
                  ? new Date(quoteDesiredDate).toISOString()
                  : null,
              })
            }
          >
            <span className="inline-flex items-center gap-1">
              <ClipboardCheck className="size-4" />
              {quoteMutation.isPending
                ? "Enviando..."
                : quoteMutation.isSuccess
                  ? "Orcamento enviado"
                  : "Solicitar Orcamento"}
            </span>
          </CyanButton>
        </div>

        {!configured ? (
          <QuoteNotice>Configure o Supabase para salvar solicitacoes reais.</QuoteNotice>
        ) : !user ? (
          <QuoteNotice>
            <Link to="/auth" className="font-black text-primary">
              Entre na conta
            </Link>{" "}
            para solicitar orcamento e abrir o atendimento.
          </QuoteNotice>
        ) : !isUuid(pro.id) ? (
          <QuoteNotice>
            Este profissional e demonstrativo. Profissionais vindos do Supabase ja salvam o
            orcamento no banco.
          </QuoteNotice>
        ) : quoteMutation.error ? (
          <QuoteNotice tone="error">{quoteMutation.error.message}</QuoteNotice>
        ) : quoteMutation.isSuccess ? (
          <QuoteNotice tone="success">
            Solicitacao criada no Supabase e conversa iniciada em Mensagens.
          </QuoteNotice>
        ) : null}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 text-xs font-black">{value}</div>
    </div>
  );
}

function QuoteNotice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "success" | "error";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-sky-200 bg-sky-50 text-sky-900";

  return (
    <div className={`mt-3 rounded-xl border p-3 text-xs font-semibold ${toneClass}`}>
      {children}
    </div>
  );
}

function shortProfession(profession: string) {
  return profession.split(" ")[0] ?? profession;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
