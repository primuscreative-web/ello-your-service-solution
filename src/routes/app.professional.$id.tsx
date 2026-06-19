import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, ChevronLeft, Heart, MessageCircle, Share2, Star } from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
import { Availability, Rating } from "@/components/ello/status";
import { useAuth } from "@/lib/auth/auth-context";
import { AVAILABILITY_LABEL, getProfessional, type Professional } from "@/lib/ello-data";
import {
  createDetailedQuoteRequest,
  getProfessionalById,
  listMyFavoriteProfessionalIds,
  listProfessionalPortfolio,
  setProfessionalFavorite,
} from "@/lib/ello-repository";

type ProfileTab = "profile" | "services" | "reviews" | "gallery";

export const Route = createFileRoute("/app/professional/$id")({
  component: ProfessionalDetail,
  loader: ({ params }): { id: string; initialPro: Professional | null } => {
    const initialPro = getProfessional(params.id) ?? null;
    if (!initialPro && !isUuid(params.id)) throw notFound();
    return { id: params.id, initialPro };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Profissional não encontrado.
    </div>
  ),
});

function ProfessionalDetail() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id, initialPro } = Route.useLoaderData() as {
    id: string;
    initialPro: Professional | null;
  };
  const { configured, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [showQuote, setShowQuote] = useState(false);
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteLocation, setQuoteLocation] = useState("");

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

  const favoriteMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Entre na sua conta para favoritar profissionais.");
      if (!pro) throw new Error("Profissional ainda não foi carregado.");
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

  const quoteMutation = useMutation({
    mutationFn: () => {
      if (!pro || !user) throw new Error("Entre na conta para solicitar um serviço.");
      return createDetailedQuoteRequest({
        userId: user.id,
        professionalId: pro.id,
        description: quoteDescription,
        location: quoteLocation || pro.city,
      });
    },
    onSuccess: async (quoteRequest) => {
      await navigate({ to: "/app/messages", search: { quote: quoteRequest.id } });
    },
  });

  if (!pro && professionalQuery.isPending) {
    return <div className="min-h-dvh animate-pulse bg-secondary" />;
  }

  if (!pro) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Profissional não encontrado.
      </div>
    );
  }

  const canPersist = Boolean(configured && user && isUuid(pro.id));

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="relative h-52 overflow-hidden bg-slate-900 text-white">
        <img
          src="/images/ello/home-services-1.webp"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/20" />
        <div className="relative flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Link
            to="/app/search"
            aria-label="Voltar"
            className="grid size-10 place-items-center rounded-full bg-black/20 backdrop-blur"
          >
            <ChevronLeft className="size-6" />
          </Link>
          <div className="flex gap-2">
            <button className="grid size-10 place-items-center rounded-full bg-black/20 backdrop-blur">
              <Share2 className="size-5" />
            </button>
            <button
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              disabled={!canPersist || favoriteMutation.isPending}
              onClick={() => favoriteMutation.mutate()}
              className="grid size-10 place-items-center rounded-full bg-black/20 backdrop-blur disabled:opacity-50"
            >
              <Heart className={`size-5 ${isFavorite ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="-mt-5 rounded-t-[1.7rem] bg-white">
        <section className="relative px-5 pb-5 pt-12">
          <div className="absolute -top-11 left-5 rounded-full border-4 border-white">
            <AvatarPhoto imageUrl={pro.avatarUrl} initials={pro.initials} size={88} />
          </div>
          <h1 className="flex items-center gap-2 text-[1.55rem] font-black tracking-[-0.04em]">
            {pro.name}
            <BadgeCheck className="size-5 fill-primary text-white" />
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={pro.rating} />
            <span className="text-xs text-muted-foreground">({pro.completedJobs} avaliações)</span>
          </div>
          <div className="mt-3">
            <Availability label={AVAILABILITY_LABEL[pro.available]} />
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-border">
            <Metric value={String(pro.completedJobs)} label="Serviços" />
            <Metric value="98%" label="Concluídos" />
            <Metric value={pro.responseTime} label="Tempo de resposta" />
          </div>
        </section>

        <nav className="grid grid-cols-4 border-y border-border px-3">
          {[
            ["profile", "Perfil"],
            ["services", "Serviços"],
            ["reviews", "Avaliações"],
            ["gallery", "Galeria"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as ProfileTab)}
              className={`border-b-2 py-4 text-xs font-bold ${
                activeTab === value
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/70"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-6">
          {activeTab === "profile" ? <ProfileOverview professional={pro} /> : null}
          {activeTab === "services" ? <ServicesTab professional={pro} /> : null}
          {activeTab === "reviews" ? <ReviewsTab professional={pro} /> : null}
          {activeTab === "gallery" ? <GalleryTab items={portfolioItems} /> : null}

          {showQuote ? (
            <section className="mt-6 rounded-2xl border border-border p-4">
              <h2 className="text-base font-black">Novo orçamento</h2>
              <textarea
                value={quoteDescription}
                onChange={(event) => setQuoteDescription(event.target.value)}
                placeholder="Descreva o serviço que você precisa..."
                className="mt-4 min-h-28 w-full resize-none rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={quoteLocation}
                onChange={(event) => setQuoteLocation(event.target.value)}
                placeholder="Cidade ou bairro"
                className="mt-3 h-12 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-primary"
              />
              {quoteMutation.error ? (
                <p className="mt-3 text-xs font-semibold text-destructive">
                  {quoteMutation.error.message}
                </p>
              ) : null}
              <button
                disabled={
                  !canPersist || quoteDescription.trim().length < 10 || quoteMutation.isPending
                }
                onClick={() => quoteMutation.mutate()}
                className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-45"
              >
                {quoteMutation.isPending ? "Enviando..." : "Enviar solicitação"}
              </button>
            </section>
          ) : null}
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-2 gap-3 border-t border-border bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Link
          to="/app/messages"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-bold text-primary"
        >
          <MessageCircle className="size-5" />
          Chamar no chat
        </Link>
        <button
          type="button"
          onClick={() => setShowQuote((visible) => !visible)}
          className="h-12 rounded-xl bg-primary text-sm font-bold text-white"
        >
          Solicitar serviço
        </button>
      </div>
    </div>
  );
}

function ProfileOverview({ professional }: { professional: Professional }) {
  return (
    <section>
      <h2 className="text-base font-black">Sobre mim</h2>
      <p className="mt-3 text-sm leading-7 text-foreground/75">{professional.description}</p>
      <h2 className="mt-7 text-base font-black">Serviços principais</h2>
      <div className="mt-3 divide-y divide-border rounded-2xl border border-border px-4">
        {professional.specialties.slice(0, 4).map((specialty) => (
          <div key={specialty} className="py-4 text-sm font-semibold">
            {specialty}
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesTab({ professional }: { professional: Professional }) {
  return (
    <section>
      <h2 className="text-base font-black">Meus serviços</h2>
      <div className="mt-4 space-y-3">
        {professional.specialties.map((specialty, index) => (
          <div
            key={specialty}
            className="flex items-center gap-3 rounded-2xl border border-border p-3"
          >
            <img
              src={`/images/ello/home-services-${(index % 3) + 1}.webp`}
              alt=""
              className="size-16 rounded-xl object-cover"
            />
            <div>
              <h3 className="text-sm font-black">{specialty}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Valor sob consulta</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsTab({ professional }: { professional: Professional }) {
  return (
    <section>
      <div className="flex items-end gap-3">
        <strong className="text-4xl font-black">{professional.rating}</strong>
        <span className="mb-1 flex">
          {[0, 1, 2, 3, 4].map((star) => (
            <Star key={star} className="size-5 fill-warning text-warning" />
          ))}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Baseado em {professional.completedJobs} avaliações
      </p>
      <div className="mt-7 space-y-3">
        {[5, 4, 3, 2, 1].map((score, index) => (
          <div key={score} className="flex items-center gap-3 text-xs font-bold">
            <span className="w-5">{score}★</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${index === 0 ? 86 : Math.max(2, 12 - index * 3)}%` }}
              />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-8 rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
        As avaliações reais aparecerão aqui após serviços concluídos.
      </p>
    </section>
  );
}

function GalleryTab({
  items,
}: {
  items: Array<{ id: string; title: string; mediaUrl: string | null }>;
}) {
  const gallery = items.length
    ? items
    : [
        { id: "one", title: "Serviço realizado", mediaUrl: "/images/ello/home-services-1.webp" },
        { id: "two", title: "Atendimento", mediaUrl: "/images/ello/home-services-2.webp" },
        { id: "three", title: "Resultado", mediaUrl: "/images/ello/home-services-3.webp" },
      ];

  return (
    <section className="grid grid-cols-2 gap-2">
      {gallery.map((item, index) => (
        <img
          key={item.id}
          src={item.mediaUrl ?? `/images/ello/home-services-${(index % 3) + 1}.webp`}
          alt={item.title}
          className="aspect-square w-full rounded-2xl object-cover"
        />
      ))}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="mt-1 block text-[0.68rem] text-muted-foreground">{label}</span>
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
