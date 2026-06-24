import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { Gift, Home, MoreHorizontal, Scissors, Store, Wrench } from "lucide-react";
import { ProfessionalMiniCard, ServiceCategoryCard } from "@/components/ello/cards";
import { SearchField } from "@/components/ello/fields";
import { PhotoCarousel } from "@/components/ello/media";
import { ClientHomeHeader } from "@/components/ello/screen-header";
import { useAuth } from "@/lib/auth/auth-context";
import { CATEGORIES } from "@/lib/ello-data";
import { listCategories, listProfessionals } from "@/lib/ello-repository";
=======
import {
  BriefcaseBusiness,
  CalendarDays,
  Droplets,
  Heart,
  Search,
  Sparkles,
  Store,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  AppTopBar,
  MiniMap,
  ProPhoto,
  ServicePhoto,
  SmartSearchBox,
  TrustBadge,
} from "@/components/ello/mobile-ui";
import { CATEGORIES, PROFESSIONALS } from "@/lib/ello-data";
import { listCategories, listLocalPartnerSpaces, listProfessionals } from "@/lib/ello-repository";
>>>>>>> 3fc0f0d (Refine ELLO positioning across onboarding and home)

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
<<<<<<< HEAD
            <h2 className="text-base font-black text-foreground">Categorias populares</h2>
            <Link to="/app/search" className="text-xs font-bold text-primary">
              Ver todas
=======
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                Operação completa
              </p>
              <h2 className="text-sm font-black">Tudo em um só lugar</h2>
            </div>
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              {
                title: "ELLO Link",
                body: "Portfólio, catálogo e agenda em um link profissional.",
                icon: Search,
              },
              {
                title: "Agenda",
                body: "Agendamento, urgência e confirmação no mesmo fluxo.",
                icon: CalendarDays,
              },
              {
                title: "ELLO IA",
                body: "Sugestões de melhoria e oportunidades para crescer.",
                icon: Sparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-primary shadow-sm">
                    <Icon className="size-4" />
                  </div>
                  <p className="text-[11px] font-black">{item.title}</p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          {categories.slice(0, 4).map((category, index) => {
            const icons = [Wrench, UserRound, Droplets, BriefcaseBusiness];
            const Icon = icons[index];
            return (
              <Link
                key={category.slug}
                to="/app/search"
                search={{ category: category.slug }}
                className="ello-card flex min-h-[74px] flex-col items-center justify-center gap-1 rounded-xl p-2 text-center"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-[10px] font-bold leading-tight">{category.name}</span>
              </Link>
            );
          })}
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-black">Mapa Inteligente</h2>
            <Link to="/app/search" className="text-[10px] font-bold text-primary">
              Ver mapa
>>>>>>> 3fc0f0d (Refine ELLO positioning across onboarding and home)
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
