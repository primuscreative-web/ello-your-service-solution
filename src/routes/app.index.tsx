import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, Home, MoreHorizontal, Scissors, Sparkles, Store, Wrench } from "lucide-react";
import { ProfessionalMiniCard, ServiceCategoryCard } from "@/components/ello/cards";
import { SearchField } from "@/components/ello/fields";
import { PhotoCarousel } from "@/components/ello/media";
import { ElloEyebrow, ElloSectionHeader, ElloSurface } from "@/components/ello/primitives";
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
    <div className="min-h-dvh ello-mesh-bg">
      <ClientHomeHeader />

      <main className="space-y-7 px-5 pb-8 pt-4">
        <section className="animate-reveal">
          <ElloSurface className="p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">
              Busca por intenção
            </p>
            <h1 className="ello-display mt-1 text-[1.4rem]">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              O que você precisa resolver hoje?
            </p>
            <div className="mt-4">
              <SearchField
                value={searchTerm}
                onChange={setSearchTerm}
                onSubmit={submitSearch}
                placeholder="Ex: meu chuveiro parou de funcionar..."
              />
            </div>
          </ElloSurface>
        </section>

        <section className="animate-reveal" style={{ animationDelay: "100ms" }}>
          <ElloSurface elevated className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <ElloEyebrow>Operação completa</ElloEyebrow>
                <h2 className="ello-section-title mt-2">Seu centro de gestão</h2>
              </div>
              <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                {
                  title: "ELLO Link",
                  body: "Portfólio, catálogo e agenda em um link profissional.",
                  accent: "from-[oklch(0.56_0.24_264)] to-[oklch(0.58_0.22_285)]",
                },
                {
                  title: "Agenda",
                  body: "Agendamento, urgência e confirmação no mesmo fluxo.",
                  accent: "from-[oklch(0.62_0.18_148)] to-[oklch(0.54_0.16_155)]",
                },
                {
                  title: "ELLO IA",
                  body: "Sugestões de melhoria e oportunidades para crescer.",
                  accent: "from-[oklch(0.58_0.22_285)] to-[oklch(0.54_0.26_260)]",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-[1.125rem] border border-white/70 bg-white/80 p-3"
                >
                  <div
                    className={`mt-0.5 size-1 shrink-0 self-stretch rounded-full bg-gradient-to-b ${item.accent}`}
                  />
                  <div>
                    <p className="text-[11px] font-black text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </ElloSurface>
        </section>

        <section className="animate-reveal" style={{ animationDelay: "120ms" }}>
          <ElloSectionHeader title="Categorias populares" action="Ver todas" actionTo="/app/search" />
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
