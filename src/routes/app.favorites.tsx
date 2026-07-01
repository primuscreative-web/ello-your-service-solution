import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProfessionalListRow } from "@/components/ello/cards";
import { ElloInfoBanner } from "@/components/ello/primitives";
import {
  EmptyStateCard,
  ScreenHeader,
  ScreenMain,
  ScreenPage,
} from "@/components/ello/screen-layout";
import { PrimaryButton } from "@/components/ello/actions";
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
    <ScreenPage>
      <ScreenHeader title="Favoritos" subtitle="Profissionais salvos" backTo="/app" />

      <ScreenMain>
        <ElloInfoBanner
          icon={<Heart className="size-5" />}
          eyebrow="Sua lista"
          title="Profissionais que você salvou"
          body="Acesse rapidamente os perfis que você marcou como favoritos."
        />

        {!configured || !user ? (
          <EmptyFavorites text="Entre na sua conta para acessar os profissionais salvos." />
        ) : favoritesQuery.isPending ? (
          <EmptyFavorites text="Carregando favoritos..." />
        ) : favorites.length ? (
          <div className="space-y-1">
            {favorites.map((professional) => (
              <ProfessionalListRow
                key={professional.id}
                professional={professional}
                favorite
                favoriteDisabled={removeMutation.isPending}
                onFavorite={() => removeMutation.mutate(professional.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyFavorites text="Salve profissionais para encontrá-los rapidamente depois." />
        )}

        {removeMutation.error ? (
          <p className="rounded-[1.25rem] bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {removeMutation.error.message}
          </p>
        ) : null}
      </ScreenMain>
    </ScreenPage>
  );
}

function EmptyFavorites({ text }: { text: string }) {
  return (
    <EmptyStateCard
      icon={<Heart className="size-6" />}
      title="Seus favoritos"
      description={text}
      action={
        <Link to="/app/search">
          <PrimaryButton className="!w-auto px-6">Buscar profissionais</PrimaryButton>
        </Link>
      }
    />
  );
}
