import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Star } from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
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
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app/business" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Avaliações</h1>
        <span className="size-10" />
      </header>

      <main className="space-y-5 px-5 py-5">
        {!configured || !user ? (
          <Empty text="Entre no modo profissional para ver avaliações reais." />
        ) : reviewsQuery.isPending ? (
          <Empty text="Carregando avaliações..." />
        ) : (
          <>
            <section className="rounded-3xl border border-border p-5">
              <div className="flex items-center gap-3">
                <strong className="text-5xl font-black">{average.toFixed(1)}</strong>
                <div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-5 ${star <= Math.round(average) ? "fill-current" : ""}`}
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
            </section>

            {reviews.length ? (
              <section className="space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-3xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <AvatarPhoto initials={initialsFor(review.clientName)} size={44} />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-black">{review.clientName}</h2>
                        <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-black">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.comment ?? "Cliente não deixou comentário."}
                    </p>
                  </article>
                ))}
              </section>
            ) : (
              <Empty text="As avaliações aparecem aqui após serviços concluídos." />
            )}
          </>
        )}
      </main>
    </div>
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
    <p className="rounded-3xl bg-secondary p-5 text-center text-sm text-muted-foreground">{text}</p>
  );
}
