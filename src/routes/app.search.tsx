import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Check, Heart, Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import {
  AppTopBar,
  CyanButton,
  ProPhoto,
  RatingLine,
  TrustBadge,
} from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES, PROFESSIONALS } from "@/lib/ello-data";
import {
  listCategories,
  listMyFavoriteProfessionalIds,
  listProfessionals,
  setProfessionalFavorite,
} from "@/lib/ello-repository";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/search")({
  validateSearch: searchSchema,
  component: Search,
});

function Search() {
  const { category, q } = Route.useSearch();
  const queryClient = useQueryClient();
  const { configured, user } = useAuth();
  const [query, setQuery] = useState(q ?? "");
  const [activeCat, setActiveCat] = useState<string | undefined>(category);

  const categoriesQuery = useQuery({
    queryKey: ["ello", "categories"],
    queryFn: listCategories,
  });
  const professionalsQuery = useQuery({
    queryKey: ["ello", "professionals", { activeCat, query }],
    queryFn: () => listProfessionals({ category: activeCat, query }),
  });
  const favoritesQuery = useQuery({
    queryKey: ["ello", "me", "favorite-professional-ids", user?.id],
    queryFn: () => listMyFavoriteProfessionalIds(user!.id),
    enabled: Boolean(configured && user),
  });
  const favoriteMutation = useMutation({
    mutationFn: (input: { professionalId: string; favorite: boolean }) => {
      if (!user) throw new Error("Entre na sua conta para favoritar profissionais.");
      return setProfessionalFavorite({
        userId: user.id,
        professionalId: input.professionalId,
        favorite: input.favorite,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ello", "me", "favorite-professional-ids", user?.id],
      });
    },
  });

  const categories = categoriesQuery.data ?? CATEGORIES;
  const filtered = professionalsQuery.data ?? PROFESSIONALS;
  const favoriteIds = new Set(favoritesQuery.data ?? []);

  return (
    <div>
      <AppTopBar
        title={activeCat ? `${labelFor(activeCat, categories)} - Sao Paulo` : "Buscar Servicos"}
        backTo="/app"
      />

      <main className="space-y-4 px-4 pb-6 pt-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar servicos ou profissionais..."
            className="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <section className="ello-card rounded-xl p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black">
            <SlidersHorizontal className="size-4 text-[#083d63]" />
            Filtros para:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FilterChip title="Avaliacao Media" value="4.5+" />
            <FilterChip title="Preco" value="-" plus />
            <FilterChip title="Urgencia (Express)" />
            <FilterChip title="Verificados" checked />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCat(undefined)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold ${
                !activeCat ? "bg-[#083d63] text-white" : "bg-muted"
              }`}
            >
              Tudo
            </button>
            {categories.slice(0, 8).map((item) => (
              <button
                key={item.slug}
                onClick={() => setActiveCat(item.slug)}
                className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold ${
                  activeCat === item.slug ? "bg-[#083d63] text-white" : "bg-muted"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {filtered.map((pro) => {
            const isFavorite = favoriteIds.has(pro.id);
            return (
              <div key={pro.id} className="ello-card rounded-xl p-3">
                <div className="flex gap-3">
                  <ProPhoto initials={pro.initials} imageUrl={pro.avatarUrl} size={58} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <Link to="/app/professional/$id" params={{ id: pro.id }} className="min-w-0">
                        <h3 className="truncate text-sm font-black">{pro.name}</h3>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {pro.profession}
                        </p>
                      </Link>
                      <button
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-muted disabled:opacity-45"
                        disabled={
                          !configured || !user || !isUuid(pro.id) || favoriteMutation.isPending
                        }
                        onClick={() =>
                          favoriteMutation.mutate({
                            professionalId: pro.id,
                            favorite: !isFavorite,
                          })
                        }
                        aria-label={
                          isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
                        }
                      >
                        <Heart
                          className={`size-4 ${
                            isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {pro.boosted ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">
                          Destaque
                        </span>
                      ) : null}
                      <RatingLine
                        rating={String(pro.rating)}
                        reviews={`${pro.completedJobs} servicos`}
                      />
                      <TrustBadge
                        label={pro.trustLevel === "Ouro" ? "Diamante/Elite" : pro.trustLevel}
                      />
                    </div>
                  </div>
                </div>
                <Link to="/app/professional/$id" params={{ id: pro.id }}>
                  <CyanButton className="mt-3 w-full">Solicitar Orcamento</CyanButton>
                </Link>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <div className="ello-card rounded-xl p-6 text-center text-sm text-muted-foreground">
              Nenhum profissional encontrado para esta busca.
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function FilterChip({
  title,
  value,
  plus = false,
  checked = false,
}: {
  title: string;
  value?: string;
  plus?: boolean;
  checked?: boolean;
}) {
  return (
    <button className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-left">
      <span>
        <span className="block text-[10px] font-semibold text-muted-foreground">{title}</span>
        {value ? <strong className="text-xs">{value}</strong> : null}
      </span>
      {checked ? (
        <Check className="size-4 rounded bg-primary p-0.5 text-white" />
      ) : plus ? (
        <span className="text-primary">+</span>
      ) : null}
    </button>
  );
}

function labelFor(slug: string, categories: typeof CATEGORIES) {
  return categories.find((item) => item.slug === slug)?.name ?? "Servicos";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
