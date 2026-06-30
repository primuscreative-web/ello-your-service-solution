import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Search as SearchIcon, Sparkles, Wrench } from "lucide-react";
import { ProfessionalListRow } from "@/components/ello/cards";
import { SearchField } from "@/components/ello/fields";
import { ElloSectionHeader, ElloSurface } from "@/components/ello/primitives";
import {
  EmptyStateCard,
  ScreenHeader,
  ScreenMain,
  ScreenPage,
  SegmentedControl,
} from "@/components/ello/screen-layout";
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
    <ScreenPage noPadding>
      <div className="px-4 pb-2 pt-[calc(0.25rem+env(safe-area-inset-top))]">
        <ElloSurface className="p-3">
          <div className="flex items-center gap-3">
            <Link to="/app" aria-label="Voltar" className="ello-icon-btn btn-tactile shrink-0">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="flex-1">
              <SearchField
                value={query}
                onChange={setQuery}
                onSubmit={submitSearch}
                placeholder="preciso instalar um chuveiro"
              />
            </div>
          </div>
          <div className="mt-3">
            <SegmentedControl
              options={[
                { value: "all", label: "Todos" },
                { value: "professionals", label: "Profissionais" },
                { value: "services", label: "Serviços" },
              ]}
              value={activeTab}
              onChange={(value) => setActiveTab(value as SearchTab)}
            />
          </div>
        </ElloSurface>
        <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          Busca por intenção — a IA entende o que você precisa
        </p>
      </div>

      <ScreenMain className="space-y-7">
        {activeTab !== "services" ? (
          <section className="animate-reveal">
            <ElloSectionHeader title="Melhores profissionais" />

            {professionalsQuery.isError ? (
              <StateMessage message="Não foi possível carregar os profissionais agora." />
            ) : professionalsQuery.isLoading ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="ello-skeleton h-20" />
                ))}
              </div>
            ) : professionals.length ? (
              <div className="mt-3 space-y-1">
                {professionals.slice(0, 8).map((professional) => {
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

            {professionals.length > 5 ? (
              <button
                type="button"
                onClick={submitSearch}
                className="ello-btn-primary btn-tactile mt-4 !h-12 text-sm"
              >
                Ver mais profissionais
              </button>
            ) : null}
          </section>
        ) : null}

        {activeTab !== "professionals" ? (
          <section className="animate-reveal" style={{ animationDelay: "80ms" }}>
            <ElloSectionHeader title="Outros serviços encontrados" />
            <div className="mt-3 space-y-2">
              {services.slice(0, 8).map((service) => (
                <Link
                  key={service.slug}
                  to="/app/search"
                  search={{ category: service.slug }}
                  className="premium-card flex items-center gap-3 rounded-[1.25rem] p-4 transition-all hover:-translate-y-0.5"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-lg">
                    {service.icon}
                  </span>
                  <span className="flex-1 text-sm font-bold text-foreground">{service.name}</span>
                  <ChevronRight className="size-5 text-muted-foreground/60" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </ScreenMain>
    </ScreenPage>
  );
}

function StateMessage({ message }: { message: string }) {
  return (
    <ElloSurface className="mt-4 p-5 text-center text-sm text-muted-foreground">{message}</ElloSurface>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
