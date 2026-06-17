import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, CalendarDays, MapPin, MessageCircle, Star } from "lucide-react";
import { CyanButton, ProPhoto, ServicePhoto, TrustBadge } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import { createQuoteRequest, getPublicProfessionalLink } from "@/lib/ello-repository";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";

export const Route = createFileRoute("/p/$slug")({
  component: PublicProfessionalPage,
});

function PublicProfessionalPage() {
  const { slug } = Route.useParams();
  const { configured, user } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["ello", "public-link", slug],
    queryFn: () => getPublicProfessionalLink(slug),
  });
  const profile = profileQuery.data;
  const quoteMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error("Perfil ainda nao carregado.");
      if (!user) throw new Error("Entre na ELLO para solicitar orcamento.");
      return createQuoteRequest({
        userId: user.id,
        professionalId: profile.id,
        description: `Solicitacao iniciada pelo ELLO Link de ${profile.name}.`,
        location: profile.city,
      });
    },
  });

  if (profileQuery.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#eef8fb] p-6 text-center text-sm font-bold text-muted-foreground">
        Carregando ELLO Link...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#eef8fb] p-6 text-center">
        <div className="max-w-sm rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-lg font-black">ELLO Link nao encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O perfil pode estar em rascunho ou o link foi alterado.
          </p>
          <Link
            to="/app/search"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-xs font-black text-white"
          >
            Buscar profissionais
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef8fb] pb-8">
      <header className="ello-header px-5 pb-16 pt-6 text-white">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link to="/app" className="text-xl font-black tracking-tight">
            ELLO
          </Link>
          <TrustBadge label={profile.trustLevel} />
        </div>
      </header>

      <main className="mx-auto -mt-12 max-w-md space-y-4 px-4">
        <section className="ello-card rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ProPhoto initials={profile.initials} imageUrl={profile.avatarUrl} size={76} />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black leading-tight">{profile.name}</h1>
              <p className="text-sm font-bold text-[#083d63]">{profile.headline}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {profile.city}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniMetric label="Avaliacao" value={profile.rating.toFixed(1)} />
            <MiniMetric label="Servicos" value={String(profile.completedJobs)} />
            <MiniMetric label="Preco" value={profile.basePrice} />
          </div>
        </section>

        <section className="ello-card rounded-xl p-4">
          <h2 className="text-sm font-black">Atendimento</h2>
          <div className="mt-3 space-y-2 text-xs font-semibold text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              {profile.coverage}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              {profile.availability ?? "Disponibilidade sob consulta"}
            </p>
            <p className="flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-primary" />
              {profile.chargeType}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#083d63]">
            Pagamento externo
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-sky-900">
            {PAYMENT_POLICY.quotePaymentNotice}
          </p>
        </section>

        <section className="ello-card rounded-xl p-4">
          <h2 className="text-sm font-black">Servicos</h2>
          <div className="mt-3 space-y-2">
            {profile.services.length ? (
              profile.services.map((service) => (
                <div key={service.id} className="rounded-lg bg-background p-3">
                  <p className="text-xs font-black">{service.title}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {service.description ?? service.category}
                  </p>
                  <p className="mt-2 text-[10px] font-black text-primary">
                    {service.basePrice ?? profile.basePrice}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-background p-3 text-xs font-semibold text-muted-foreground">
                Servicos em configuracao.
              </p>
            )}
          </div>
        </section>

        <section className="ello-card rounded-xl p-4">
          <h2 className="text-sm font-black">Portfolio</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(profile.portfolio.length
              ? profile.portfolio.slice(0, 6)
              : [
                  { id: "placeholder-1", title: "Trabalho", mediaUrl: null },
                  { id: "placeholder-2", title: "Servico", mediaUrl: null },
                  { id: "placeholder-3", title: "Resultado", mediaUrl: null },
                ]
            ).map((item, index) => (
              <ServicePhoto
                key={item.id}
                index={index}
                label={item.title}
                imageUrl={item.mediaUrl}
                className="aspect-square"
              />
            ))}
          </div>
        </section>

        {quoteMutation.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {quoteMutation.error.message}
          </p>
        ) : quoteMutation.isSuccess ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            Orcamento criado. A conversa ja esta em Mensagens.
          </p>
        ) : null}

        <div className="sticky bottom-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-white p-2 shadow-xl">
          <Link
            to="/app/professional/$id"
            params={{ id: profile.id }}
            className="grid h-11 place-items-center rounded-lg bg-[#083d63] text-xs font-black text-white"
          >
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" />
              Ver perfil
            </span>
          </Link>
          <CyanButton
            disabled={!configured || !user || quoteMutation.isPending || quoteMutation.isSuccess}
            className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            onClick={() => quoteMutation.mutate()}
          >
            Solicitar
          </CyanButton>
        </div>
      </main>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background p-2 text-center">
      <p className="flex items-center justify-center gap-1 text-sm font-black">
        {label === "Avaliacao" ? <Star className="size-3.5 fill-primary text-primary" /> : null}
        {value}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
