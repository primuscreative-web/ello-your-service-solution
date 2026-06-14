import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AVAILABILITY_LABEL, getProfessional, TRUST_STYLES } from "@/lib/ello-data";
import { ProAvatar } from "@/components/ello/avatar";

export const Route = createFileRoute("/app/professional/$id")({
  component: ProfessionalDetail,
  loader: ({ params }) => {
    const pro = getProfessional(params.id);
    if (!pro) throw notFound();
    return { pro };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Profissional não encontrado.</p>
    </div>
  ),
});

function ProfessionalDetail() {
  const { pro } = Route.useLoaderData();
  const trust = TRUST_STYLES[pro.trustLevel];

  return (
    <div>
      {/* Header cover */}
      <div
        className="relative h-48 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${pro.avatarTone}, oklch(0.64 0.17 38))`,
        }}
      >
        <Link
          to="/app/search"
          className="absolute left-5 top-6 flex size-10 items-center justify-center rounded-full bg-white/90 backdrop-blur"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <button className="absolute right-5 top-6 flex size-10 items-center justify-center rounded-full bg-white/90 backdrop-blur">
          ❤
        </button>
      </div>

      <div className="-mt-12 px-5">
        <div className="flex items-end justify-between">
          <div className="relative">
            <ProAvatar initials={pro.initials} tone={pro.avatarTone} size={96} className="ring-4 ring-background" />
            <div className={`absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-2 ring-background ${trust.bg} ${trust.text}`}>
              {pro.trustLevel.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{pro.name}</h1>
            <p className="text-sm font-medium text-muted-foreground">{pro.profession}</p>
            <p className="mt-1 text-xs text-muted-foreground">📍 {pro.city}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold">★ {pro.rating}</div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">
              {pro.completedJobs} serviços
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-white p-4">
          <Metric label="Resposta" value={pro.responseTime} />
          <Metric label="Experiência" value={`${pro.experienceYears} anos`} />
          <Metric label="Status" value={AVAILABILITY_LABEL[pro.available]} accent={pro.available === "agora"} />
        </div>

        <section className="mt-6">
          <h3 className="font-display text-base font-bold">Sobre</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pro.description}</p>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-base font-bold">Especialidades</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {pro.specialties.map((s) => (
              <span key={s} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </section>

        {pro.certifications.length > 0 && (
          <section className="mt-6">
            <h3 className="font-display text-base font-bold">Certificações</h3>
            <ul className="mt-3 space-y-2">
              {pro.certifications.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 rounded-3xl bg-foreground p-5 text-background">
          <h3 className="font-display text-base font-bold">ELLO LINK</h3>
          <p className="mt-1 text-xs opacity-70">Compartilhe o cartão digital deste profissional</p>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 font-mono text-sm">
            <span>ello.app/{pro.id}</span>
            <button className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
              Copiar
            </button>
          </div>
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-20 mt-8 px-5">
        <div className="flex gap-3 rounded-3xl border border-border bg-white p-3 shadow-xl">
          <Link
            to="/app/messages"
            className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-border font-semibold"
          >
            Chat
          </Link>
          <button className="flex h-12 flex-[2] items-center justify-center rounded-2xl bg-primary font-semibold text-primary-foreground active:scale-[0.98]">
            Solicitar orçamento
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <span className="font-mono text-[9px] uppercase text-muted-foreground">{label}</span>
      <p className={`text-sm font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}