import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PROFESSIONALS, TRUST_STYLES } from "@/lib/ello-data";
import { ProAvatar } from "@/components/ello/avatar";

export const Route = createFileRoute("/app/")({
  component: Home,
});

function Home() {
  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-5 pb-4 pt-6 backdrop-blur-md">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Localização
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">Pinheiros, São Paulo</span>
            <div className="size-1.5 rounded-full bg-primary" />
          </div>
        </div>
        <button className="relative flex size-10 items-center justify-center rounded-full border border-border bg-white shadow-sm">
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-primary" />
        </button>
      </header>

      <main className="space-y-8 px-5 pt-6">
        {/* Search Hero */}
        <section className="animate-reveal space-y-4">
          <h1 className="font-display text-balance text-4xl font-extrabold leading-[0.95] tracking-tight">
            Tudo o que você <br />
            <span className="text-primary">precisa</span>, em um clique.
          </h1>
          <Link to="/app/search" className="group relative block">
            <div className="w-full rounded-2xl border border-border bg-white py-5 pl-6 pr-14 text-base text-muted-foreground/80 shadow-sm">
              O que você precisa hoje?
            </div>
            <div className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-foreground text-background">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </Link>
        </section>

        {/* Category Chips */}
        <section className="animate-reveal -mx-5" style={{ animationDelay: "100ms" }}>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
            <div className="shrink-0 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background">
              Tudo
            </div>
            {CATEGORIES.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                to="/app/search"
                search={{ category: c.slug }}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium"
              >
                <span>{c.icon}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ELLO Express */}
        <section className="animate-reveal" style={{ animationDelay: "200ms" }}>
          <Link
            to="/app/express"
            className="relative block overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20"
          >
            <div className="relative z-10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-2 animate-pulse rounded-full bg-white" />
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-90">
                    Serviço Imediato
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold leading-tight">ELLO Express</h2>
                <p className="max-w-[200px] text-sm opacity-80">
                  Conectamos você ao profissional mais próximo em segundos.
                </p>
              </div>
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-6 w-full rounded-xl bg-white py-3.5 text-center text-sm font-bold text-primary">
              Solicitar Agora
            </div>
          </Link>
        </section>

        {/* Featured Professionals */}
        <section className="animate-reveal space-y-5" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold tracking-tight">Destaques na região</h3>
            <Link to="/app/search" className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Ver todos
            </Link>
          </div>

          {PROFESSIONALS.slice(0, 4).map((p) => {
            const trust = TRUST_STYLES[p.trustLevel];
            return (
              <Link
                key={p.id}
                to="/app/professional/$id"
                params={{ id: p.id }}
                className="flex gap-4 rounded-3xl border border-border bg-white p-4 transition-all active:scale-[0.99]"
              >
                <div className="relative">
                  <ProAvatar initials={p.initials} tone={p.avatarTone} size={80} />
                  <div
                    className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-[9px] font-bold ring-2 ring-white ${trust.bg} ${trust.text}`}
                  >
                    {p.trustLevel.toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display text-base font-bold">{p.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground">{p.profession}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="size-3 fill-primary text-primary" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold">{p.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Stat label="Resposta" value={p.responseTime} />
                    <div className="h-6 w-px bg-border" />
                    <Stat label="Concluídos" value={`${p.completedJobs} serviços`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] uppercase text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}