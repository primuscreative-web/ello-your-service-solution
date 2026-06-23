import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, Home, MoreHorizontal, Scissors, Store, Wrench } from "lucide-react";
import { ProfessionalMiniCard, ServiceCategoryCard } from "@/components/ello/cards";
import { SearchField } from "@/components/ello/fields";
import { PhotoCarousel } from "@/components/ello/media";
import { ClientHomeHeader } from "@/components/ello/screen-header";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES } from "@/lib/ello-data";
import { listCategories, listProfessionals } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/")({
  component: HomeScreen,
});

const CATEGORY_ICONS = [Home, Scissors, Gift, Store, MoreHorizontal] as const;

function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const categoriesQuery = useQuery({
    queryKey: ["ello", "categories"],
    queryFn: listCategories,
  });
  const professionalsQuery = useQuery({
    queryKey: ["ello", "professionals", "featured"],
    queryFn: () => listProfessionals({ limit: 6 }),
  });

  const categories = categoriesQuery.data?.length ? categoriesQuery.data : CATEGORIES;
  const professionals = professionalsQuery.data ?? [];
  const firstName = profile?.full_name?.split(" ")[0] || "Ana";

  const currentHour = new Date().getHours();
  let greeting = "Olá";
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Bom dia";
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = "Boa tarde";
  } else {
    greeting = "Boa noite";
  }

  function submitSearch() {
    void navigate({
      to: "/app/search",
      search: searchTerm.trim() ? { q: searchTerm.trim() } : {},
    });
  }

  return (
    <div className="min-h-dvh bg-white">
      <ClientHomeHeader />

      <main className="space-y-7 px-5 pb-8 pt-4">
        <section className="animate-reveal">
          <h1 className="text-2xl font-black leading-tight tracking-[-0.04em] text-foreground/90">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-tight text-muted-foreground">
            O que você precisa resolver hoje?
          </p>
          <div className="mt-5">
            <SearchField value={searchTerm} onChange={setSearchTerm} onSubmit={submitSearch} />
          </div>
        </section>

        <section className="animate-reveal" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground">Categorias populares</h2>
            <Link to="/app/search" className="text-xs font-bold text-primary">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-3">
            {categories.slice(0, 5).map((category, index) => {
              const Icon = CATEGORY_ICONS[index] ?? Wrench;
              return (
                <ServiceCategoryCard
                  key={category.slug}
                  icon={<Icon className="size-5" />}
                  label={shortCategoryName(category.name, index)}
                  to={`/app/search?category=${encodeURIComponent(category.slug)}`}
                />
              );
            })}
          </div>
        </section>

        <div className="animate-reveal" style={{ animationDelay: "175ms" }}>
          <PhotoCarousel />
        </div>

        <section className="animate-reveal" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground">Profissionais em destaque</h2>
            <Link to="/app/search" className="text-xs font-bold text-primary">
              Ver todos
            </Link>
          </div>

          {professionalsQuery.isLoading ? (
            <div className="mt-4 flex gap-3 overflow-hidden">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-48 w-[7.4rem] shrink-0 animate-pulse rounded-2xl bg-secondary"
                />
              ))}
            </div>
          ) : professionals.length ? (
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-3">
              {professionals.map((professional) => (
                <ProfessionalMiniCard key={professional.id} professional={professional} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-border bg-secondary/60 p-5 text-center">
              <p className="text-sm font-bold text-foreground">Nenhum profissional disponível</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Novos profissionais aparecerão aqui quando concluírem seus perfis.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function shortCategoryName(name: string, index: number) {
  const referenceNames = ["Casa", "Beleza", "Reformas", "Tecnologia", "Mais"];
  return referenceNames[index] ?? name;
}
