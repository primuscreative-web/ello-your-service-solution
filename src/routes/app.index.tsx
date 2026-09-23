import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, Home, MoreHorizontal, Scissors, Store, Wrench } from "lucide-react";
import { ProfessionalMiniCard, ServiceCategoryCard } from "@/components/ello/cards";
import { SearchField } from "@/components/ello/fields";
import { PhotoCarousel } from "@/components/ello/media";
import { ElloSectionHeader, ElloSurface } from "@/components/ello/primitives";
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
  const { user, profile } = useAuth();
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
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";

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
    <div className="min-h-dvh ello-mesh-bg">
      <ClientHomeHeader />

      <main className="space-y-7 px-5 pb-8 pt-4">
        <section className="animate-reveal">
          <div className="px-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
              ENCONTRE UM PROFISSIONAL
            </p>
            <h1 className="ello-display mt-2 text-[1.9rem] font-extrabold text-slate-900">
              {firstName ? (
                <>
                  {greeting}, <span className="text-primary">{firstName}</span>
                </>
              ) : (
                <>
                  {greeting}, <span className="text-primary">como podemos ajudar?</span>
                </>
              )}
            </h1>
            <p className="mt-2 text-base font-medium text-slate-600">
              O que você precisa resolver hoje?
            </p>
            <div className="mt-6">
              <SearchField
                value={searchTerm}
                onChange={setSearchTerm}
                onSubmit={submitSearch}
                placeholder="Ex: meu chuveiro parou de funcionar..."
              />
            </div>
          </div>
        </section>

        <section className="animate-reveal" style={{ animationDelay: "100ms" }}>
          <ElloSectionHeader
            title="Categorias populares"
            action="Ver todas"
            actionTo="/app/search"
          />
          <div className="mt-4 grid grid-cols-4 gap-4">
            {categories.slice(0, 4).map((category, index) => {
              const Icon = CATEGORY_ICONS[index] ?? Wrench;
              return (
                <ServiceCategoryCard
                  key={category.slug}
                  icon={<Icon className="size-6" />}
                  label={shortCategoryName(category.name, index)}
                  to={`/app/search?category=${encodeURIComponent(category.slug)}`}
                />
              );
            })}
          </div>
        </section>

        <div className="animate-reveal" style={{ animationDelay: "150ms" }}>
          <PhotoCarousel />
        </div>

        <section className="animate-reveal" style={{ animationDelay: "200ms" }}>
          <ElloSectionHeader
            title="Profissionais em destaque"
            action="Ver todos"
            actionTo="/app/search"
          />

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
            <ElloSurface className="mt-4 p-5 text-center">
              <p className="text-sm font-bold text-foreground">Nenhum profissional disponível</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Novos profissionais aparecerão aqui quando concluírem seus perfis.
              </p>
            </ElloSurface>
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
