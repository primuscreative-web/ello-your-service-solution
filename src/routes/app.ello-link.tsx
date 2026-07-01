import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  Copy,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createMyService,
  getMyBusinessDashboard,
  listMyAgendaItems,
  listMyProfessionalClients,
  listMyServices,
  updateMyProfessionalProfile,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/ello-link")({
  component: ElloLinkSettings,
});

function ElloLinkSettings() {
  const { configured, user } = useAuth();
  const queryClient = useQueryClient();
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
  const agendaQuery = useQuery({
    queryKey: ["ello", "me", "agenda", user?.id],
    queryFn: () => listMyAgendaItems(user!.id),
    enabled: Boolean(configured && user),
  });
  const clientsQuery = useQuery({
    queryKey: ["ello", "me", "business-clients", user?.id],
    queryFn: () => listMyProfessionalClients(user!.id),
    enabled: Boolean(configured && user),
  });
  const profile = dashboardQuery.data?.profile;
  const [form, setForm] = useState({
    publicName: "",
    specialty: "",
    bio: "",
    city: "",
    coverage: "",
    basePrice: "",
    chargeType: "",
    slug: "",
    phone: "",
    whatsappMessage: "Olá! Vim pelo seu ELLO Link e gostaria de tirar uma dúvida.",
    couponCode: "",
    couponDescription: "",
  });
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    basePrice: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      publicName: profile.public_name ?? profile.specialty,
      specialty: profile.specialty,
      bio: profile.bio ?? profile.description,
      city: profile.city,
      coverage: profile.coverage,
      basePrice: profile.base_price,
      chargeType: profile.charge_type,
      slug: profile.ello_link_slug ?? "",
      phone: profile.phone ?? "",
      whatsappMessage:
        profile.ello_link_whatsapp_message ??
        "Olá! Vim pelo seu ELLO Link e gostaria de tirar uma dúvida.",
      couponCode: profile.ello_link_coupon_code ?? "",
      couponDescription: profile.ello_link_coupon_description ?? "",
    });
  }, [profile]);

  const publicLink = useMemo(() => {
    if (typeof window === "undefined" || !form.slug) return `/p/${form.slug || "seu-link"}`;
    return `${window.location.origin}/p/${form.slug}`;
  }, [form.slug]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Entre para configurar seu ELLO Link.");
      return updateMyProfessionalProfile({
        userId: user.id,
        publicName: form.publicName,
        specialty: form.specialty,
        headline: form.specialty,
        bio: form.bio,
        city: form.city,
        coverage: form.coverage,
        availability: "Agenda disponível pelo ELLO Link",
        basePrice: form.basePrice,
        chargeType: form.chargeType,
        elloLinkSlug: form.slug,
        phone: form.phone,
        elloLinkWhatsappMessage: form.whatsappMessage,
        elloLinkCouponCode: form.couponCode,
        elloLinkCouponDescription: form.couponDescription,
      });
    },
    onSuccess: invalidateElloLink,
  });
  const serviceMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Entre para cadastrar serviços.");
      return createMyService({
        userId: user.id,
        title: serviceForm.title,
        category: serviceForm.title,
        description: serviceForm.description,
        basePrice: serviceForm.basePrice,
        chargeType: "por serviço",
      });
    },
    onSuccess: async () => {
      setServiceForm({ title: "", description: "", basePrice: "" });
      await queryClient.invalidateQueries({ queryKey: ["ello", "me", "services", user?.id] });
    },
  });

  async function invalidateElloLink() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ello", "me", "business-dashboard", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["ello", "public-link", form.slug] }),
    ]);
  }

  if (!configured || !user) {
    return <EmptyState text="Entre na sua conta profissional para configurar o ELLO Link." />;
  }
  if (dashboardQuery.isPending) {
    return <EmptyState text="Carregando configurações do ELLO Link..." />;
  }
  if (!profile) {
    return <EmptyState text="Crie seu perfil profissional antes de configurar o ELLO Link." />;
  }

  const agenda = (agendaQuery.data ?? []).slice(0, 5);
  const frequentClients = (clientsQuery.data ?? []).slice(0, 4);

  return (
    <div className="min-h-dvh ello-mesh-bg pb-24">
      <header className="ello-header-bar flex items-center gap-3 pt-[calc(0.25rem+env(safe-area-inset-top))]">
        <Link to="/app/business" className="ello-icon-btn btn-tactile" aria-label="Voltar">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-base font-black">ELLO Link</h1>
          <p className="text-[11px] text-muted-foreground">Configuração da página pública</p>
        </div>
        <span className="size-10 shrink-0" />
      </header>

      <main className="space-y-6 px-5 py-6">
        <section className="overflow-hidden rounded-[1.875rem] border border-white/10 bg-gradient-to-br from-[oklch(0.42_0.2_264)] via-[oklch(0.38_0.18_264)] to-[oklch(0.28_0.12_270)] p-5 text-white shadow-[0_28px_80px_-24px_oklch(0.32_0.14_264_/_0.5)]">
          <p className="text-xs font-bold uppercase tracking-wide text-white/75">ELLO Link</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">
            Otimizar, melhorar, automatizar e profissionalizar.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Seu link compartilhável de apresentação, WhatsApp e agendamento rápido.
          </p>
          <button
            onClick={() => void navigator.clipboard?.writeText(publicLink)}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-primary"
          >
            <Copy className="size-4" />
            Copiar {publicLink.replace(/^https?:\/\//, "")}
          </button>
        </section>

        <section className="ello-surface space-y-3 p-4">
          <h2 className="ello-section-title">Página pública</h2>
          <Input
            label="Nome exibido"
            value={form.publicName}
            onChange={setFormValue("publicName")}
          />
          <Input
            label="Especialidade"
            value={form.specialty}
            onChange={setFormValue("specialty")}
          />
          <Textarea label="Bio/apresentação" value={form.bio} onChange={setFormValue("bio")} />
          <Input label="Cidade" value={form.city} onChange={setFormValue("city")} />
          <Input
            label="Área de atendimento"
            value={form.coverage}
            onChange={setFormValue("coverage")}
          />
          <Input label="Preço base" value={form.basePrice} onChange={setFormValue("basePrice")} />
          <Input
            label="Tipo de cobrança"
            value={form.chargeType}
            onChange={setFormValue("chargeType")}
          />
          <Input label="Slug do link" value={form.slug} onChange={setFormValue("slug")} />
        </section>

        <section className="space-y-3 rounded-3xl border border-border p-4">
          <h2 className="flex items-center gap-2 text-base font-black">
            <MessageCircle className="size-4 text-emerald-600" />
            WhatsApp automático
          </h2>
          <Input label="Número profissional" value={form.phone} onChange={setFormValue("phone")} />
          <Textarea
            label="Frase pronta para o cliente enviar"
            value={form.whatsappMessage}
            onChange={setFormValue("whatsappMessage")}
          />
        </section>

        <section className="space-y-3 rounded-3xl border border-border p-4">
          <h2 className="flex items-center gap-2 text-base font-black">
            <Sparkles className="size-4 text-primary" />
            Cupom de desconto
          </h2>
          <Input
            label="Código: 4 letras + 2 números"
            value={form.couponCode}
            onChange={(value) => setFormValue("couponCode")(value.toUpperCase().slice(0, 6))}
            placeholder="ELLO25"
          />
          <Input
            label="Descrição do cupom"
            value={form.couponDescription}
            onChange={setFormValue("couponDescription")}
            placeholder="10% na primeira visita"
          />
        </section>

        {saveMutation.error ? <ErrorText>{saveMutation.error.message}</ErrorText> : null}
        {saveMutation.isSuccess ? <SuccessText>ELLO Link atualizado.</SuccessText> : null}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="ello-btn-primary btn-tactile !h-12"
        >
          {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
        </button>

        <section className="space-y-3 rounded-3xl border border-border p-4">
          <h2 className="text-base font-black">Serviços do ELLO Link</h2>
          {(servicesQuery.data ?? []).map((service) => (
            <article key={service.id} className="rounded-2xl bg-secondary p-3">
              <p className="text-sm font-black">{service.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {service.description ?? "Sem descrição rápida."}
              </p>
              <p className="mt-1 text-xs font-black text-primary">
                {service.basePrice ?? "Valor sob consulta"}
              </p>
            </article>
          ))}
          <div className="rounded-2xl border border-dashed border-border p-3">
            <Input
              label="Novo serviço"
              value={serviceForm.title}
              onChange={(title) => setServiceForm((current) => ({ ...current, title }))}
            />
            <Input
              label="Descrição rápida opcional"
              value={serviceForm.description}
              onChange={(description) => setServiceForm((current) => ({ ...current, description }))}
            />
            <Input
              label="Valor de exemplo"
              value={serviceForm.basePrice}
              onChange={(basePrice) => setServiceForm((current) => ({ ...current, basePrice }))}
            />
            <button
              onClick={() => serviceMutation.mutate()}
              disabled={serviceMutation.isPending || serviceForm.title.trim().length < 3}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-white disabled:opacity-50"
            >
              <Plus className="size-4" />
              Adicionar serviço
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-border p-4">
          <h2 className="flex items-center gap-2 text-base font-black">
            <CalendarDays className="size-4 text-primary" />
            Datas e horários
          </h2>
          <div className="mt-3 space-y-2">
            {agenda.length ? (
              agenda.map((item) => (
                <p key={item.id} className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
                  {item.service} - {item.date} as {item.time}
                </p>
              ))
            ) : (
              <p className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
                Os horários públicos aparecem no link; agendamentos reais entram aqui.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border p-4">
          <h2 className="flex items-center gap-2 text-base font-black">
            <Users className="size-4 text-primary" />
            Clientes frequentes
          </h2>
          <div className="mt-3 space-y-2">
            {frequentClients.length ? (
              frequentClients.map((client) => (
                <p
                  key={client.userId}
                  className="rounded-2xl bg-secondary p-3 text-sm font-semibold"
                >
                  {client.name} • {client.totalRequests} solicitações
                </p>
              ))
            ) : (
              <p className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
                Clientes frequentes aparecerão após solicitações reais pelo ELLO Link.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );

  function setFormValue(key: keyof typeof form) {
    return (value: string) => setForm((current) => ({ ...current, [key]: value }));
  }
}

function Input({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="ello-field-label">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="ello-input"
      />
    </label>
  );
}

function Textarea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="ello-field-label">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="ello-textarea"
      />
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-dvh place-items-center ello-mesh-bg px-8 text-center">
      <div>
        <Sparkles className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-xl font-black">ELLO Link</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{children}</p>;
}

function SuccessText({ children }: { children: string }) {
  return (
    <p className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{children}</p>
  );
}
