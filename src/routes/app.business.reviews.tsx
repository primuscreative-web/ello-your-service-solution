import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
import { ElloSurface } from "@/components/ello/primitives";
import { EmptyStateCard, ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyProfessionalReviews } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/business/reviews")({
  component: ProfessionalReviewsScreen,
});

function ProfessionalReviewsScreen() {
  const { configured, user } = useAuth();
  const reviewsQuery = useQuery({
    queryKey: ["ello", "me", "business-reviews", user?.id],
    queryFn: () => listMyProfessionalReviews(user!.id),
    enabled: Boolean(configured && user),
  });
  const reviews = reviewsQuery.data ?? [];
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((item) => item.count));

  return (
    <ScreenPage>
      <ScreenHeader title="Avaliações" subtitle="Reputação e feedback" backTo="/app/business" />

      <ScreenMain>
        {!configured || !user ? (
          <Empty text="Entre no modo profissional para ver avaliações reais." />
        ) : reviewsQuery.isPending ? (
          <Empty text="Carregando avaliações..." />
        ) : (
          <>
            <ElloSurface elevated className="p-5">
              <div className="flex items-center gap-4">
                <strong className="text-5xl font-black tracking-tight">{average.toFixed(1)}</strong>
                <div>
                  <div className="flex text-[oklch(0.78_0.14_75)]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-5 ${star <= Math.round(average) ? "fill-current" : "opacity-30"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Baseado em {reviews.length} avaliações
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {distribution.map((item) => (
                  <div key={item.rating} className="flex items-center gap-2 text-xs">
                    <span className="w-5 font-bold">{item.rating}</span>
                    <div className="h-2 flex-1 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </ElloSurface>

            {reviews.length ? (
              <section className="space-y-3">
                {reviews.map((review) => (
                  <ElloSurface key={review.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <AvatarPhoto initials={initialsFor(review.clientName)} size={44} />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-black">{review.clientName}</h2>
                        <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-black">
                        <Star className="size-4 fill-[oklch(0.78_0.14_75)] text-[oklch(0.78_0.14_75)]" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.comment ?? "Cliente não deixou comentário."}
                    </p>
                  </ElloSurface>
                ))}
              </section>
            ) : (
              <Empty text="As avaliações aparecem aqui após serviços concluídos." />
            )}
          </>
        )}
      </ScreenMain>
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

function Empty({ text }: { text: string }) {
  return (
    <EmptyStateCard icon={<Star className="size-6" />} title="Avaliações" description={text} />
  );
}
