import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CATEGORIES, PROFESSIONALS, TRUST_STYLES } from "@/lib/ello-data";
import { ProAvatar } from "@/components/ello/avatar";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/search")({
  validateSearch: searchSchema,
  component: Search,
});

function Search() {
  const { category, q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [activeCat, setActiveCat] = useState<string | undefined>(category);

  const filtered = PROFESSIONALS.filter((p) => {
    if (activeCat && p.category !== activeCat) return false;
    if (query) {
      const s = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) ||
        p.profession.toLowerCase().includes(s) ||
        p.specialties.some((sp) => sp.toLowerCase().includes(s))
      );
    }
    return true;
  });

  return (
    <div className="px-5 pb-8 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/app"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-white"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-display text-xl font-bold">Buscar</h1>
      </div>

      <div className="relative mt-5">
        <svg
          className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: Preciso instalar um chuveiro"
          className="h-14 w-full rounded-2xl border border-border bg-white pl-12 pr-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="-mx-5 mt-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-2">
          <Chip active={!activeCat} onClick={() => setActiveCat(undefined)}>
            Tudo
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.slug}
              active={activeCat === c.slug}
              onClick={() => setActiveCat(c.slug)}
            >
              {c.icon} {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {filtered.length} profissionais encontrados
        </p>
        <button className="font-mono text-xs uppercase tracking-wider text-primary">Mapa</button>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((p) => {
          const trust = TRUST_STYLES[p.trustLevel];
          return (
            <Link
              key={p.id}
              to="/app/professional/$id"
              params={{ id: p.id }}
              className="flex gap-4 rounded-3xl border border-border bg-white p-4"
            >
              <div className="relative">
                <ProAvatar initials={p.initials} tone={p.avatarTone} size={72} />
                <div
                  className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-[9px] font-bold ring-2 ring-white ${trust.bg} ${trust.text}`}
                >
                  {p.trustLevel.toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-bold">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.profession}</p>
                  </div>
                  <span className="font-mono text-xs font-bold">★ {p.rating}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  📍 {p.city} • {p.completedJobs} serviços
                </p>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum profissional encontrado. Tente outra categoria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "border border-border bg-white text-foreground"
      }`}
    >
      {children}
    </button>
  );
}