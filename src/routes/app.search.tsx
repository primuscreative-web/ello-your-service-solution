import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Search as SearchIcon, Wrench } from "lucide-react";
import { ProfessionalListRow } from "@/components/ello/cards";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES } from "@/lib/ello-data";
import {
  listCategories,
  listMyFavoriteProfessionalIds,
  listProfessionals,
  setProfessionalFavorite,
} from "@/lib/ello-repository";

type SearchTab = "all" | "professionals" | "services";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/search")({
  validateSearch: searchSchema,
  component: SearchScreen,
});

function SearchScreen() {
  const { category, q } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { configured, user } = useAuth();
  const [query, setQuery] = useState(q ?? "");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");

  const categoriesQuery = useQuery({
    queryKey: ["ello", "categories"],
    queryFn: listCategories,
  });
  const professionalsQuery = useQuery({
    queryKey: ["ello", "professionals", { category, query }],
    queryFn: () => listProfessionals({ category, query }),
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
  const professionals = professionalsQuery.data ?? [];
  const favoriteIds = new Set(favoritesQuery.data ?? []);
  const services = categories.filter((item) =>
    `${item.name} ${item.slug}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function submitSearch() {
    void navigate({
      to: "/app/search",
      search: {
        ...(category ? { category } : {}),
        ...(query.trim() ? { q: query.trim() } : {}),
      },
      replace: true,
    });
  }

  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-border px-5 pb-4 pt-[calc(1.1rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link
            to="/app"
            aria-label="Voltar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-foreground"
          >
            <ChevronLeft className="size-6" />
          </Link>
          <form
            className="relative flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <SearchIcon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="preciso instalar um chuveiro"
              className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </form>
        </div>

        <div className="mt-4 grid grid-cols-3">
          {[
            ["all", "Todos"],
            ["professionals", "Profissionais"],
            ["services", "Serviços"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as SearchTab)}
              className={`border-b-2 py-3 text-sm font-bold ${
                activeTab === value
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-7 px-5 py-6">
        {activeTab !== "services" ? (
          <section>
            <h2 className="text-base font-black text-foreground">Melhores profissionais</h2>

            {professionalsQuery.isError ? (
              <StateMessage message="Não foi possível carregar os profissionais agora." />
            ) : professionalsQuery.isLoading ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-secondary" />
                ))}
              </div>
            ) : professionals.length ? (
              <div className="mt-3">
                {professionals.slice(0, 5).map((professional) => {
                  const isFavorite = favoriteIds.has(professional.id);
                  return (
                    <ProfessionalListRow
                      key={professional.id}
                      professional={professional}
                      favorite={isFavorite}
                      favoriteDisabled={
                        !configured ||
                        !user ||
                        !isUuid(professional.id) ||
                        favoriteMutation.isPending
                      }
                      onFavorite={() =>
                        favoriteMutation.mutate({
                          professionalId: professional.id,
                          favorite: !isFavorite,
                        })
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <StateMessage message="Nenhum profissional encontrado para esta busca." />
            )}

            {professionals.length > 3 ? (
              <button className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-bold text-white">
                Ver mais profissionais
              </button>
            ) : null}
          </section>
        ) : null}

        {activeTab !== "professionals" ? (
          <section>
            <h2 className="text-base font-black text-foreground">Outros serviços encontrados</h2>
            <div className="mt-3 space-y-2">
              {services.slice(0, 5).map((service) => (
                <Link
                  key={service.slug}
                  to="/app/search"
                  search={{ category: service.slug }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-secondary text-foreground">
                    <Wrench className="size-5" />
                  </span>
                  <span className="flex-1 text-sm font-bold text-foreground">{service.name}</span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StateMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-2xl bg-secondary p-5 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
