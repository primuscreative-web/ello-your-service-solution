import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Bot,
  ChevronRight,
  ClipboardList,
  Link as LinkIcon,
  MessageCircle,
  Pencil,
  PlayCircle,
  Send,
  XCircle,
  UserRound,
} from "lucide-react";
import { AppTopBar, CyanButton, Metric, ProPhoto, ServicePhoto } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createMyPortfolioItem,
  createMyService,
  ensureMyProfessionalProfile,
  getMyBusinessDashboard,
  getMyProfessionalProfile,
  listMyProfessionalQuotes,
  listMyPortfolioItems,
  listMyServices,
  respondToProfessionalQuote,
  setMyProfessionalProfilePublished,
  updateMyProfessionalProfile,
  updateProfessionalQuoteStatus,
  type ProfessionalQuoteItem,
} from "@/lib/ello-repository";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";

export const Route = createFileRoute("/app/business")({
  component: Business,
});

function Business() {
  const queryClient = useQueryClient();
  const { configured, user, profile } = useAuth();
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [portfolioMediaUrl, setPortfolioMediaUrl] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [profilePublicName, setProfilePublicName] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [profileHeadline, setProfileHeadline] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileCoverage, setProfileCoverage] = useState("");
  const [profileAvailability, setProfileAvailability] = useState("");
  const [profileBasePrice, setProfileBasePrice] = useState("");
  const [profileChargeType, setProfileChargeType] = useState("");
  const [profileExperienceYears, setProfileExperienceYears] = useState("0");
  const [profileSlug, setProfileSlug] = useState("");
  const professionalQuery = useQuery({
    queryKey: ["ello", "me", "professional-profile", user?.id],
    queryFn: () => getMyProfessionalProfile(user!.id),
    enabled: Boolean(user),
  });
  const dashboardQuery = useQuery({
    queryKey: ["ello", "me", "business-dashboard", user?.id],
    queryFn: () => getMyBusinessDashboard(user!.id),
    enabled: Boolean(configured && user),
  });
  const servicesQuery = useQuery({
    queryKey: ["ello", "me", "services", user?.id],
    queryFn: () => listMyServices(user!.id),
    enabled: Boolean(configured && user),
  });
  const portfolioQuery = useQuery({
    queryKey: ["ello", "me", "portfolio", user?.id],
    queryFn: () => listMyPortfolioItems(user!.id),
    enabled: Boolean(configured && user),
  });
  const professionalQuotesQuery = useQuery({
    queryKey: ["ello", "me", "professional-quotes", user?.id],
    queryFn: () => listMyProfessionalQuotes(user!.id),
    enabled: Boolean(configured && user),
  });
  const activateMutation = useMutation({
    mutationFn: () =>
      ensureMyProfessionalProfile({
        userId: user!.id,
        displayName: profile?.full_name ?? user?.email?.split("@")[0] ?? "Profissional ELLO",
        city: "Sao Paulo, SP",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "professional-profile", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
      ]);
    },
  });
  const serviceMutation = useMutation({
    mutationFn: () =>
      createMyService({
        userId: user!.id,
        title: serviceTitle,
        category: serviceCategory || serviceTitle,
        basePrice: servicePrice,
      }),
    onSuccess: async () => {
      setServiceTitle("");
      setServiceCategory("");
      setServicePrice("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "services", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "categories"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "professionals"],
        }),
      ]);
    },
  });
  const portfolioMutation = useMutation({
    mutationFn: () =>
      createMyPortfolioItem({
        userId: user!.id,
        title: portfolioTitle,
        description: portfolioDescription,
        mediaUrl: portfolioMediaUrl,
        file: portfolioFile,
        featured: portfolioQuery.data?.length === 0,
      }),
    onSuccess: async () => {
      setPortfolioTitle("");
      setPortfolioDescription("");
      setPortfolioMediaUrl("");
      setPortfolioFile(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "portfolio", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "professionals"],
        }),
      ]);
    },
  });
  const publishMutation = useMutation({
    mutationFn: () =>
      setMyProfessionalProfilePublished({
        userId: user!.id,
        published: realProfessionalProfile?.profile_status !== "published",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "professional-profile", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "professionals"],
        }),
      ]);
    },
  });
  const profileUpdateMutation = useMutation({
    mutationFn: () =>
      updateMyProfessionalProfile({
        userId: user!.id,
        publicName: profilePublicName,
        specialty: profileSpecialty,
        headline: profileHeadline,
        bio: profileBio,
        city: profileCity,
        coverage: profileCoverage,
        availability: profileAvailability,
        basePrice: profileBasePrice,
        chargeType: profileChargeType,
        experienceYears: Number(profileExperienceYears) || 0,
        elloLinkSlug: profileSlug,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "professional-profile", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "business-dashboard", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ello", "professionals"],
        }),
      ]);
    },
  });
  const quoteResponseMutation = useMutation({
    mutationFn: (input: {
      quoteRequestId: string;
      responsePrice: string;
      responseEta: string;
      responseMessage: string;
    }) =>
      respondToProfessionalQuote({
        userId: user!.id,
        ...input,
      }),
    onSuccess: async () => {
      await invalidateProfessionalWork();
    },
  });
  const quoteStatusMutation = useMutation({
    mutationFn: (input: {
      quoteRequestId: string;
      status: "accepted" | "in_progress" | "declined" | "cancelled";
    }) =>
      updateProfessionalQuoteStatus({
        userId: user!.id,
        ...input,
      }),
    onSuccess: async () => {
      await invalidateProfessionalWork();
    },
  });

  async function invalidateProfessionalWork() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["ello", "me", "professional-quotes", user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ello", "me", "business-dashboard", user?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ello", "me", "quote-threads", user?.id],
      }),
    ]);
  }

  const realProfessionalProfile = professionalQuery.data ?? dashboardQuery.data?.profile;
  const dashboard = dashboardQuery.data;
  const displayName =
    realProfessionalProfile?.public_name ??
    realProfessionalProfile?.specialty ??
    profile?.full_name ??
    "Carlos Silva";
  const displaySpecialty = realProfessionalProfile?.specialty ?? "Eletricista";
  const services = servicesQuery.data ?? [];
  const portfolioItems = portfolioQuery.data ?? [];
  const professionalQuotes = professionalQuotesQuery.data ?? [];

  useEffect(() => {
    if (!realProfessionalProfile) return;
    setProfilePublicName(realProfessionalProfile.public_name ?? "");
    setProfileSpecialty(realProfessionalProfile.specialty ?? "");
    setProfileHeadline(realProfessionalProfile.headline ?? "");
    setProfileBio(realProfessionalProfile.bio ?? realProfessionalProfile.description ?? "");
    setProfileCity(realProfessionalProfile.city ?? "");
    setProfileCoverage(realProfessionalProfile.coverage ?? "");
    setProfileAvailability(realProfessionalProfile.availability ?? "");
    setProfileBasePrice(realProfessionalProfile.base_price ?? "");
    setProfileChargeType(realProfessionalProfile.charge_type ?? "");
    setProfileExperienceYears(String(realProfessionalProfile.experience_years ?? 0));
    setProfileSlug(realProfessionalProfile.ello_link_slug ?? "");
  }, [realProfessionalProfile?.id]);

  return (
    <div>
      <AppTopBar title="Meu Negocio" subtitle={`${displayName} (${displaySpecialty})`} logo />

      <main className="-mt-2 space-y-4 px-4 pb-6">
        <section className="ello-card rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black">Perfil profissional real</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {!configured
                  ? "Configure o Supabase para criar seu perfil no banco."
                  : !user
                    ? "Entre na sua conta para salvar seu negocio na ELLO."
                    : realProfessionalProfile
                      ? `Perfil criado: ${displayName}`
                      : "Crie o registro profissional no Supabase para comecar a persistir dados."}
              </p>
              {activateMutation.error ? (
                <p className="mt-2 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                  {activateMutation.error.message}
                </p>
              ) : null}
              <button
                disabled={
                  !configured ||
                  !user ||
                  Boolean(realProfessionalProfile) ||
                  activateMutation.isPending
                }
                onClick={() => activateMutation.mutate()}
                className="ello-action mt-3 h-9 rounded-lg px-3 text-[10px] font-black disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              >
                {realProfessionalProfile
                  ? "Perfil conectado"
                  : activateMutation.isPending
                    ? "Criando..."
                    : "Criar perfil no banco"}
              </button>
              {realProfessionalProfile ? (
                <button
                  disabled={publishMutation.isPending}
                  onClick={() => publishMutation.mutate()}
                  className="mt-2 h-9 rounded-lg border border-border bg-white px-3 text-[10px] font-black text-[#083d63] disabled:bg-muted disabled:text-muted-foreground"
                >
                  {publishMutation.isPending
                    ? "Atualizando..."
                    : realProfessionalProfile.profile_status === "published"
                      ? "Despublicar perfil"
                      : "Publicar perfil"}
                </button>
              ) : null}
              {publishMutation.error ? (
                <p className="mt-2 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                  {publishMutation.error.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Editar perfil e ELLO Link</h2>
            {profileSlug ? (
              <Link
                to="/p/$slug"
                params={{ slug: profileSlug }}
                className="text-[10px] font-bold text-primary"
              >
                Ver pagina
              </Link>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={profilePublicName}
                onChange={(event) => setProfilePublicName(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Nome publico"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={profileSpecialty}
                onChange={(event) => setProfileSpecialty(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Especialidade"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <input
              value={profileHeadline}
              onChange={(event) => setProfileHeadline(event.target.value)}
              disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
              placeholder="Titulo profissional"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
            />
            <textarea
              value={profileBio}
              onChange={(event) => setProfileBio(event.target.value)}
              disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
              placeholder="Bio profissional"
              className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={profileCity}
                onChange={(event) => setProfileCity(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Cidade"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={profileCoverage}
                onChange={(event) => setProfileCoverage(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Area de atendimento"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={profileBasePrice}
                onChange={(event) => setProfileBasePrice(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Preco"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={profileChargeType}
                onChange={(event) => setProfileChargeType(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Cobranca"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={profileExperienceYears}
                onChange={(event) => setProfileExperienceYears(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="Anos"
                inputMode="numeric"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <input
              value={profileAvailability}
              onChange={(event) => setProfileAvailability(event.target.value)}
              disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
              placeholder="Disponibilidade"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
            />
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
              <span className="shrink-0 text-[10px] font-black text-muted-foreground">/p/</span>
              <input
                value={profileSlug}
                onChange={(event) => setProfileSlug(event.target.value)}
                disabled={!configured || !user || !realProfessionalProfile || profileUpdateMutation.isPending}
                placeholder="seu-nome"
                className="h-10 min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
              />
            </div>
            {profileUpdateMutation.error ? (
              <p className="rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                {profileUpdateMutation.error.message}
              </p>
            ) : profileUpdateMutation.isSuccess ? (
              <p className="rounded-lg bg-emerald-50 p-2 text-[10px] font-semibold text-emerald-800">
                Perfil atualizado com sucesso.
              </p>
            ) : null}
            <button
              disabled={
                !configured ||
                !user ||
                !realProfessionalProfile ||
                !profilePublicName.trim() ||
                !profileSpecialty.trim() ||
                profileUpdateMutation.isPending
              }
              onClick={() => profileUpdateMutation.mutate()}
              className="ello-action h-10 rounded-lg px-3 text-[10px] font-black disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              {profileUpdateMutation.isPending ? "Salvando..." : "Salvar perfil profissional"}
            </button>
          </div>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Servicos reais</h2>
            <span className="text-[10px] font-bold text-muted-foreground">
              {servicesQuery.isPending ? "Carregando" : `${services.length} ativos`}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {services.length ? (
              services.map((service) => (
                <div key={service.id} className="rounded-lg bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black">{service.title}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {service.category}
                        {service.basePrice ? ` · ${service.basePrice}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/15 px-2 py-1 text-[9px] font-black text-[#0c6670]">
                      {service.active ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-background p-3 text-xs font-semibold text-muted-foreground">
                Cadastre ao menos um servico para aparecer melhor na busca inteligente.
              </p>
            )}
          </div>

          <div className="mt-3 grid gap-2">
            <input
              value={serviceTitle}
              onChange={(event) => setServiceTitle(event.target.value)}
              disabled={!configured || !user || !realProfessionalProfile || serviceMutation.isPending}
              placeholder="Nome do servico"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={serviceCategory}
                onChange={(event) => setServiceCategory(event.target.value)}
                disabled={
                  !configured || !user || !realProfessionalProfile || serviceMutation.isPending
                }
                placeholder="Categoria"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={servicePrice}
                onChange={(event) => setServicePrice(event.target.value)}
                disabled={
                  !configured || !user || !realProfessionalProfile || serviceMutation.isPending
                }
                placeholder="Preco base"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            {serviceMutation.error ? (
              <p className="rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                {serviceMutation.error.message}
              </p>
            ) : null}
            <button
              disabled={
                !configured ||
                !user ||
                !realProfessionalProfile ||
                !serviceTitle.trim() ||
                serviceMutation.isPending
              }
              onClick={() => serviceMutation.mutate()}
              className="ello-action h-10 rounded-lg px-3 text-[10px] font-black disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              {serviceMutation.isPending ? "Salvando..." : "Adicionar servico"}
            </button>
          </div>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Portfolio real</h2>
            <span className="text-[10px] font-bold text-muted-foreground">
              {portfolioQuery.isPending ? "Carregando" : `${portfolioItems.length} itens`}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {portfolioItems.length
              ? portfolioItems.slice(0, 6).map((item, index) => (
                  <ServicePhoto
                    key={item.id}
                    index={index}
                    label={item.title}
                    imageUrl={item.mediaUrl}
                    className="aspect-square"
                  />
                ))
              : ["Antes", "Durante", "Depois"].map((item, index) => (
                  <ServicePhoto key={item} index={index} label={item} className="aspect-square" />
                ))}
          </div>

          <div className="mt-3 grid gap-2">
            <input
              value={portfolioTitle}
              onChange={(event) => setPortfolioTitle(event.target.value)}
              disabled={
                !configured || !user || !realProfessionalProfile || portfolioMutation.isPending
              }
              placeholder="Titulo do trabalho"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPortfolioFile(event.target.files?.[0] ?? null)}
              disabled={
                !configured || !user || !realProfessionalProfile || portfolioMutation.isPending
              }
              className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold outline-none file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-[10px] file:font-black file:text-[#0c6670] focus:border-primary"
            />
            <input
              value={portfolioMediaUrl}
              onChange={(event) => setPortfolioMediaUrl(event.target.value)}
              disabled={
                !configured ||
                !user ||
                !realProfessionalProfile ||
                Boolean(portfolioFile) ||
                portfolioMutation.isPending
              }
              placeholder="Ou cole uma URL da imagem"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
            />
            <textarea
              value={portfolioDescription}
              onChange={(event) => setPortfolioDescription(event.target.value)}
              disabled={
                !configured || !user || !realProfessionalProfile || portfolioMutation.isPending
              }
              placeholder="Descricao curta"
              className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            />
            {portfolioMutation.error ? (
              <p className="rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                {portfolioMutation.error.message}
              </p>
            ) : null}
            <button
              disabled={
                !configured ||
                !user ||
                !realProfessionalProfile ||
                !portfolioTitle.trim() ||
                (!portfolioFile && !portfolioMediaUrl.trim()) ||
                portfolioMutation.isPending
              }
              onClick={() => portfolioMutation.mutate()}
              className="ello-action h-10 rounded-lg px-3 text-[10px] font-black disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              {portfolioMutation.isPending ? "Salvando..." : "Adicionar ao portfolio"}
            </button>
          </div>
        </section>

        <section className="ello-card rounded-xl p-3">
          <h2 className="text-sm font-black">Performance Mensal</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="Orcamentos" value={String(dashboard?.quoteCount ?? 0)} accent />
            <Metric label="Servicos" value={String(dashboard?.serviceCount ?? 0)} accent />
            <Metric
              label="Avaliacao"
              value={dashboard?.rating ? dashboard.rating.toFixed(1) : "0.0"}
              accent
            />
            <Metric label="Agenda" value={String(dashboard?.appointmentCount ?? 0)} accent />
          </div>
          {configured && user && dashboardQuery.isPending ? (
            <p className="mt-3 text-[10px] font-semibold text-muted-foreground">
              Carregando indicadores reais...
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#083d63]">
            Recebimento externo
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-sky-900">
            {PAYMENT_POLICY.professionalPaymentNotice} A taxa planejada da ELLO e de{" "}
            {PAYMENT_POLICY.platformFeePercent}% apenas quando o gateway for ativado.
          </p>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Orcamentos recebidos</h2>
            <span className="text-[10px] font-bold text-muted-foreground">
              {professionalQuotesQuery.isPending
                ? "Carregando"
                : `${professionalQuotes.length} pedidos`}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {professionalQuotes.length ? (
              professionalQuotes.map((quote) => (
                <ProfessionalQuoteCard
                  key={quote.id}
                  quote={quote}
                  responding={quoteResponseMutation.isPending}
                  changingStatus={quoteStatusMutation.isPending}
                  onRespond={(payload) =>
                    quoteResponseMutation.mutate({
                      quoteRequestId: quote.id,
                      ...payload,
                    })
                  }
                  onStatus={(status) =>
                    quoteStatusMutation.mutate({
                      quoteRequestId: quote.id,
                      status,
                    })
                  }
                />
              ))
            ) : (
              <p className="rounded-lg bg-background p-3 text-xs font-semibold text-muted-foreground">
                Nenhum pedido real recebido ainda. Quando um cliente solicitar orcamento, ele
                aparece aqui.
              </p>
            )}
          </div>

          {quoteResponseMutation.error ? (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
              {quoteResponseMutation.error.message}
            </p>
          ) : null}
          {quoteStatusMutation.error ? (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
              {quoteStatusMutation.error.message}
            </p>
          ) : null}
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Atividades Recentes</h2>
            <Link to="/app/messages" className="text-[10px] font-bold text-primary">
              Ver mais
            </Link>
          </div>
          {dashboard?.recentQuotes.length ? (
            <div className="mt-3 space-y-2">
              {dashboard.recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center gap-3 rounded-lg bg-background p-3">
                  <ProPhoto initials="EL" size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black">{quote.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {quote.subtitle} · {quote.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-background p-3">
              <ProPhoto initials="AP" size={42} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black">Orcamento Urgente - Ana P.</p>
                <p className="text-[10px] text-muted-foreground">(Ar Condicionado)</p>
              </div>
            </div>
          )}
          <Link to="/app/messages" className="block">
            <CyanButton className="mt-3 w-full">Responder</CyanButton>
          </Link>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black">ELLO IA Manager</h2>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {realProfessionalProfile
                  ? `Seu perfil tem ${dashboard?.serviceCount ?? 0} servicos cadastrados e ${
                      dashboard?.quoteCount ?? 0
                    } orcamentos no funil.`
                  : "Crie seu perfil profissional para a IA acompanhar oportunidades reais."}
              </p>
              <button className="mt-3 rounded-lg bg-primary/15 px-3 py-2 text-[10px] font-black text-[#0c6670]">
                Bom perfil
              </button>
            </div>
          </div>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center gap-3">
            <ProPhoto initials={initialsFor(displayName)} size={62} />
            <div>
              <h2 className="text-base font-black">{displayName}</h2>
              <p className="text-xs text-muted-foreground">{displaySpecialty}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {realProfessionalProfile?.bio ??
              realProfessionalProfile?.description ??
              "Profissional com experiencia em servicos residenciais e atendimento local."}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(portfolioItems.length
              ? portfolioItems.slice(0, 3)
              : [
                  { id: "instalacao", title: "Instalacao", mediaUrl: null },
                  { id: "manutencao", title: "Manutencao", mediaUrl: null },
                  { id: "reparos", title: "Reparos", mediaUrl: null },
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

        <section>
          <h2 className="mb-2 text-sm font-black">Ferramentas</h2>
          <div className="grid grid-cols-2 gap-2">
            <Tool
              icon={<ClipboardList className="size-5" />}
              title="Orcamentos"
              desc="Responder pedidos"
            />
            <Tool icon={<Pencil className="size-5" />} title="Portfolio" desc="Editar perfil" />
            <Tool
              icon={<LinkIcon className="size-5" />}
              title="ELLO Link"
              desc="Compartilhar pagina"
            />
            <Tool icon={<UserRound className="size-5" />} title="Clientes" desc="Historico e CRM" />
          </div>
        </section>

        <Link
          to="/app"
          className="block rounded-xl bg-[#083d63] py-3 text-center text-xs font-black text-white"
        >
          Ver como Cliente
        </Link>
      </main>
    </div>
  );
}

function Tool({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button className="ello-card flex items-center gap-3 rounded-xl p-3 text-left">
      <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <span>
        <span className="block text-xs font-black">{title}</span>
        <span className="text-[10px] text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

function ProfessionalQuoteCard({
  changingStatus,
  onRespond,
  onStatus,
  quote,
  responding,
}: {
  changingStatus: boolean;
  onRespond: (input: {
    responsePrice: string;
    responseEta: string;
    responseMessage: string;
  }) => void;
  onStatus: (status: "accepted" | "in_progress" | "declined" | "cancelled") => void;
  quote: ProfessionalQuoteItem;
  responding: boolean;
}) {
  const [responsePrice, setResponsePrice] = useState(quote.responsePrice ?? "");
  const [responseEta, setResponseEta] = useState(quote.responseEta ?? "");
  const [responseMessage, setResponseMessage] = useState(quote.responseMessage ?? "");
  const canRespond = quote.status === "new" || quote.status === "quoted";
  const canAccept = quote.status === "quoted" || quote.status === "new";
  const canStart = quote.status === "accepted";
  const canDecline = quote.status === "new" || quote.status === "quoted";

  return (
    <article className="rounded-xl bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black">{quote.serviceTitle}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
            {quote.clientCity} - {quote.createdAt}
          </p>
        </div>
        <QuoteStatusPill status={quote.status} />
      </div>

      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{quote.description}</p>
      <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{quote.location}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <input
          value={responsePrice}
          onChange={(event) => setResponsePrice(event.target.value)}
          disabled={!canRespond || responding}
          placeholder="Valor combinado"
          className="h-10 min-w-0 rounded-lg border border-border bg-white px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
        />
        <input
          value={responseEta}
          onChange={(event) => setResponseEta(event.target.value)}
          disabled={!canRespond || responding}
          placeholder="Prazo"
          className="h-10 min-w-0 rounded-lg border border-border bg-white px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
        />
      </div>
      <textarea
        value={responseMessage}
        onChange={(event) => setResponseMessage(event.target.value)}
        disabled={!canRespond || responding}
        placeholder="Mensagem para o cliente"
        className="mt-2 min-h-20 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <CyanButton
          disabled={!canRespond || responding}
          className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
          onClick={() =>
            onRespond({
              responsePrice,
              responseEta,
              responseMessage,
            })
          }
        >
          <span className="inline-flex items-center gap-1">
            <Send className="size-4" />
            Responder
          </span>
        </CyanButton>
        <Link
          to="/app/messages"
          className="grid h-10 place-items-center rounded-lg bg-[#083d63] text-xs font-black text-white"
        >
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-4" />
            Chat
          </span>
        </Link>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          disabled={!canAccept || changingStatus}
          onClick={() => onStatus("accepted")}
          className="h-9 rounded-lg border border-border bg-white text-[10px] font-black text-[#083d63] disabled:bg-muted disabled:text-muted-foreground"
        >
          Aceitar
        </button>
        <button
          disabled={!canStart || changingStatus}
          onClick={() => onStatus("in_progress")}
          className="h-9 rounded-lg border border-border bg-white text-[10px] font-black text-[#083d63] disabled:bg-muted disabled:text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="size-3.5" />
            Iniciar
          </span>
        </button>
        <button
          disabled={!canDecline || changingStatus}
          onClick={() => onStatus("declined")}
          className="h-9 rounded-lg border border-red-100 bg-red-50 text-[10px] font-black text-red-700 disabled:bg-muted disabled:text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1">
            <XCircle className="size-3.5" />
            Recusar
          </span>
        </button>
      </div>
    </article>
  );
}

function QuoteStatusPill({ status }: { status: ProfessionalQuoteItem["status"] }) {
  const labels: Record<ProfessionalQuoteItem["status"], string> = {
    accepted: "Aceito",
    cancelled: "Cancelado",
    completed: "Concluido",
    declined: "Recusado",
    in_progress: "Em andamento",
    new: "Novo",
    quoted: "Respondido",
  };

  return (
    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-1 text-[9px] font-black text-[#0c6670]">
      {labels[status]}
    </span>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
