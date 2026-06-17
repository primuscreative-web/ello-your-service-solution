import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
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

export const Route = createFileRoute("/app/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const categoriesQuery = useQuery({
    queryKey: ["ello", "categories"],
    queryFn: listCategories,
  });
  const professionalsQuery = useQuery({
    queryKey: ["ello", "professionals", "featured"],
    queryFn: () => listProfessionals({ limit: 3 }),
  });
  const localPartnersQuery = useQuery({
    queryKey: ["ello", "local-partners", "home"],
    queryFn: () => listLocalPartnerSpaces("Sao Paulo, SP"),
  });

  const categories = categoriesQuery.data ?? CATEGORIES;
  const professionals = professionalsQuery.data ?? PROFESSIONALS.slice(0, 3);
  const localPartners = localPartnersQuery.data ?? [];

  return (
    <div>
      <AppTopBar title="Home" subtitle="Sao Paulo, SP" logo />

      <main className="-mt-3 space-y-4 px-4 pb-6">
        <div className="ello-card rounded-xl p-3">
          <SmartSearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            onSubmit={() =>
              navigate({
                to: "/app/search",
                search: searchTerm.trim() ? { q: searchTerm.trim() } : {},
              })
            }
            placeholder="O que voce precisa hoje?"
          />
        </div>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Busca Inteligente</h2>
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["Instalar Chuveiro", "Manicure", "Pintor", "Diarista"].map((item) => (
              <Link
                key={item}
                to="/app/search"
                search={{ q: item }}
                className="shrink-0 rounded-lg bg-muted px-3 py-2 text-[10px] font-semibold"
              >
                {item}
              </Link>
            ))}
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
            </Link>
          </div>
          <MiniMap />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Profissionais em destaque</h2>
            <Link to="/app/search" className="text-[10px] font-bold text-primary">
              Ver todos
            </Link>
          </div>

          {professionals.map((pro, index) => (
            <Link
              key={pro.id}
              to="/app/professional/$id"
              params={{ id: pro.id }}
              className="ello-card flex gap-3 rounded-xl p-3"
            >
              <ProPhoto initials={pro.initials} imageUrl={pro.avatarUrl} size={58} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black">{pro.name}</h3>
                    <p className="truncate text-[11px] text-muted-foreground">{pro.profession}</p>
                  </div>
                  <Heart className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {pro.boosted ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">
                      Destaque
                    </span>
                  ) : null}
                  <TrustBadge label={index === 0 ? "Diamante" : pro.trustLevel} />
                  <span className="text-[11px] font-bold text-muted-foreground">{pro.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {localPartners.length ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black">Parceiros locais</h2>
              <Store className="size-4 text-primary" />
            </div>
            {localPartners.slice(0, 2).map((partner) => (
              <a
                key={partner.id}
                href={partner.ctaUrl ?? "#"}
                target={partner.ctaUrl ? "_blank" : undefined}
                rel="noreferrer"
                className="ello-card flex gap-3 rounded-xl p-3"
              >
                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/15 text-primary">
                  {partner.imageUrl ? (
                    <img src={partner.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Store className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black">{partner.name}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    {partner.category} - {partner.city}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                    {partner.description}
                  </p>
                </div>
              </a>
            ))}
          </section>
        ) : null}

        <section className="space-y-2">
          <h2 className="text-sm font-black">Servicos</h2>
          <div className="grid grid-cols-3 gap-2">
            {["Instalacao de Painel", "Reparos Residenciais", "Substituicao LED"].map(
              (label, index) => (
                <Link key={label} to="/app/search" search={{ q: label }} className="block">
                  <ServicePhoto index={index} label={label} className="aspect-square" />
                </Link>
              ),
            )}
          </div>
        </section>

        <Link
          to="/app/express"
          className="ello-header flex items-center justify-between rounded-xl p-4 text-white shadow-lg"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
              Servico imediato
            </p>
            <h2 className="mt-1 text-lg font-black">ELLO Express</h2>
          </div>
          <Search className="size-7" />
        </Link>
      </main>
    </div>
  );
}
