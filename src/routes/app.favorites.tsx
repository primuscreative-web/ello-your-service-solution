import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Heart } from "lucide-react";
import { ProfessionalListRow } from "@/components/ello/cards";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyFavoriteProfessionals, setProfessionalFavorite } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/favorites")({
  component: FavoritesScreen,
});

function FavoritesScreen() {
  const { configured, user } = useAuth();
  const queryClient = useQueryClient();
  const favoritesQuery = useQuery({
    queryKey: ["ello", "me", "favorite-professionals", user?.id],
    queryFn: () => listMyFavoriteProfessionals(user!.id),
    enabled: Boolean(configured && user),
  });
  const removeMutation = useMutation({
    mutationFn: (professionalId: string) =>
      setProfessionalFavorite({ userId: user!.id, professionalId, favorite: false }),
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
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Favoritos</h1>
        <span className="size-10" />
      </header>

      <main className="px-5 py-4">
        {!configured || !user ? (
          <EmptyFavorites text="Entre na sua conta para acessar os profissionais salvos." />
        ) : favoritesQuery.isPending ? (
          <EmptyFavorites text="Carregando favoritos..." />
        ) : favorites.length ? (
          favorites.map((professional) => (
            <ProfessionalListRow
              key={professional.id}
              professional={professional}
              favorite
              favoriteDisabled={removeMutation.isPending}
              onFavorite={() => removeMutation.mutate(professional.id)}
            />
          ))
        ) : (
          <EmptyFavorites text="Salve profissionais para encontrá-los rapidamente depois." />
        )}
        {removeMutation.error ? (
          <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {removeMutation.error.message}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function EmptyFavorites({ text }: { text: string }) {
  return (
    <section className="py-20 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Heart className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-black">Seus favoritos</h2>
      <p className="mx-auto mt-2 max-w-64 text-sm leading-relaxed text-muted-foreground">{text}</p>
      <Link
        to="/app/search"
        className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
      >
        Buscar profissionais
      </Link>
    </section>
  );
}
