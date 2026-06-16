import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search } from "lucide-react";
import { AppTopBar, CyanButton, ProPhoto, RatingLine, TrustBadge } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyFavoriteProfessionals, setProfessionalFavorite } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/favorites")({
  component: Favorites,
});

function Favorites() {
  const queryClient = useQueryClient();
  const { configured, user } = useAuth();
  const favoritesQuery = useQuery({
    queryKey: ["ello", "me", "favorite-professionals", user?.id],
    queryFn: () => listMyFavoriteProfessionals(user!.id),
    enabled: Boolean(configured && user),
  });
  const removeMutation = useMutation({
    mutationFn: (professionalId: string) => {
      if (!user) throw new Error("Entre na sua conta para alterar favoritos.");
      return setProfessionalFavorite({
        userId: user.id,
        professionalId,
        favorite: false,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "favorite-professionals", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "favorite-professional-ids", user?.id],
        }),
      ]);
    },
  });

  const favorites = favoritesQuery.data ?? [];

  return (
    <div>
      <AppTopBar title="Favoritos" subtitle="Profissionais salvos" backTo="/app" />

      <main className="space-y-4 px-4 pb-6 pt-4">
        {!configured ? (
          <EmptyState
            title="Supabase nao configurado"
            message="Configure as variaveis de ambiente para salvar favoritos reais."
          />
        ) : !user ? (
          <EmptyState
            title="Entre para ver favoritos"
            message="Sua lista de profissionais salvos fica vinculada a sua conta ELLO."
          />
        ) : favoritesQuery.isPending ? (
          <div className="ello-card rounded-xl p-6 text-center text-sm font-bold text-muted-foreground">
            Carregando favoritos...
          </div>
        ) : favorites.length ? (
          favorites.map((pro) => (
            <article key={pro.id} className="ello-card rounded-xl p-3">
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
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary disabled:opacity-45"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(pro.id)}
                      aria-label="Remover dos favoritos"
                    >
                      <Heart className="size-4 fill-primary" />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <RatingLine rating={String(pro.rating)} reviews={`${pro.completedJobs} servicos`} />
                    <TrustBadge label={pro.trustLevel} />
                  </div>
                </div>
              </div>
              <Link to="/app/professional/$id" params={{ id: pro.id }}>
                <CyanButton className="mt-3 w-full">Ver perfil</CyanButton>
              </Link>
            </article>
          ))
        ) : (
          <EmptyState
            title="Nenhum favorito ainda"
            message="Salve profissionais para comparar, conversar e contratar mais rapido depois."
          />
        )}

        {removeMutation.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {removeMutation.error.message}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section className="ello-card rounded-xl p-6 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Search className="size-5" />
      </div>
      <h2 className="mt-3 text-base font-black">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{message}</p>
      <Link
        to="/app/search"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-black text-white"
      >
        Buscar profissionais
      </Link>
    </section>
  );
}
