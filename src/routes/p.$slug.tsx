import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  QrCode,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { ProPhoto, ServicePhoto } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createElloLinkBooking,
  getPublicProfessionalLink,
  recordElloLinkEvent,
  type ProfessionalService,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/p/$slug")({
  component: PublicProfessionalPage,
});

const PENDING_LINK_KEY = "ello:link:pending:v1";

function PublicProfessionalPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { configured, user } = useAuth();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ["ello", "public-link", slug],
    queryFn: () => getPublicProfessionalLink(slug),
  });
  const profile = profileQuery.data;
  const slots = useMemo(() => createVisibleSlots(), []);
  const selectedService = profile?.services.find((service) => service.id === selectedServiceId);
  const publicUrl = typeof window === "undefined" ? "" : window.location.href;
  const qrCodeUrl =
    profile?.qrCodeEnabled && publicUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
          publicUrl,
        )}`
      : null;
  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error("Perfil ainda não carregado.");
      if (!user) throw new Error("Crie sua conta rápida para concluir o agendamento.");
      if (!selectedService) throw new Error("Escolha um serviço antes de agendar.");
      if (!selectedSlot) throw new Error("Escolha uma data e horário.");
      void recordElloLinkEvent({ professionalId: profile.id, eventType: "quote_click" });
      return createElloLinkBooking({
        userId: user.id,
        professionalId: profile.id,
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        startsAt: selectedSlot,
        location: profile.city,
      });
    },
    onSuccess: async (result) => {
      clearPendingLink();
      await navigate({ to: "/app/messages", search: { quote: result.quoteRequestId } });
    },
  });

  useEffect(() => {
    if (!profile?.id) return;
    void recordElloLinkEvent({ professionalId: profile.id, eventType: "view" });
  }, [profile]);

  useEffect(() => {
    if (!profile || typeof window === "undefined") return;
    const pending = readPendingLink();
    if (pending?.slug !== slug) return;
    setSelectedServiceId(pending.serviceId);
    setSelectedSlot(pending.startsAt);
  }, [profile, slug]);

  function handleShare() {
    if (!profile) return;
    void recordElloLinkEvent({ professionalId: profile.id, eventType: "share_click" });
    if (typeof navigator !== "undefined" && "share" in navigator) {
      void navigator.share({
        title: `${profile.name} na ELLO`,
        text: profile.headline,
        url: publicUrl,
      });
      return;
    }
    void globalThis.navigator?.clipboard?.writeText(publicUrl);
  }

  function handleBookingClick() {
    if (!selectedService || !selectedSlot) return;
    if (!user) {
      savePendingLink({ slug, serviceId: selectedService.id, startsAt: selectedSlot });
      void navigate({
        to: "/auth",
        search: { redirect: `/p/${slug}` },
      });
      return;
    }
    bookingMutation.mutate();
  }

  if (profileQuery.isPending) {
    return (
      <div className="grid min-h-screen place-items-center ello-mesh-bg p-6 text-center text-sm font-bold text-muted-foreground">
        Carregando ELLO Link...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(0,76,255,0.16),_transparent_32%),linear-gradient(180deg,_#f8faff_0%,_#f2f6ff_100%)] p-6 text-center">
        <div className="max-w-sm rounded-[32px] border border-border/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <h1 className="text-lg font-black">ELLO Link não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O perfil pode estar em rascunho ou o link foi alterado.
          </p>
          <Link
            to="/app/search"
            className="mt-4 inline-flex h-11 items-center rounded-[16px] bg-primary px-4 text-xs font-black text-white shadow-[0_16px_35px_rgba(0,76,255,0.2)]"
          >
            Buscar profissionais
          </Link>
        </div>
      </div>
    );
  }

  const canBook = Boolean(selectedService && selectedSlot);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,76,255,0.16),_transparent_32%),linear-gradient(180deg,_#f8faff_0%,_#f2f6ff_100%)] pb-8">
      <header
        className="relative overflow-hidden bg-[linear-gradient(145deg,_#004cff_0%,_#001f7a_100%)] px-5 pb-20 pt-6 text-white"
        style={
          profile.coverUrl
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(7, 32, 87, 0.72), rgba(7, 32, 87, 0.9)), url(${profile.coverUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        <div className="mx-auto flex max-w-md items-center justify-between">
          <strong className="text-xl tracking-tight">ELLO Link</strong>
          <button
            onClick={handleShare}
            className="grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur"
            aria-label="Compartilhar ELLO Link"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto -mt-14 max-w-md space-y-4 px-4">
        <section className="rounded-[32px] border border-border/70 bg-white/85 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <ProPhoto initials={profile.initials} imageUrl={profile.avatarUrl} size={82} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black leading-tight">{profile.name}</h1>
              <p className="text-sm font-bold text-primary">{profile.headline}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                {profile.city}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniMetric label="Avaliação" value={profile.rating.toFixed(1)} />
            <MiniMetric label="Serviços" value={String(profile.completedJobs)} />
            <MiniMetric label="Atende" value={profile.coverage.split(",")[0] ?? profile.city} />
          </div>
        </section>

        {profile.couponCode ? (
          <section className="rounded-[28px] border border-blue-100 bg-blue-50/90 p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-black text-blue-900">
              <Sparkles className="size-4" />
              Cupom {profile.couponCode}
            </p>
            <p className="mt-1 text-xs font-semibold text-blue-800">
              {profile.couponDescription ?? "Informe esse cupom ao profissional no atendimento."}
            </p>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-border/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <h2 className="text-base font-black">Escolha um serviço</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O agendamento só libera depois que um serviço for selecionado.
          </p>
          <div className="mt-4 space-y-3">
            {profile.services.length ? (
              profile.services.map((service, index) => (
                <ServiceOption
                  key={service.id}
                  service={service}
                  selected={service.id === selectedServiceId}
                  index={index}
                  onSelect={() => setSelectedServiceId(service.id)}
                />
              ))
            ) : (
              <p className="rounded-[20px] bg-secondary/80 p-4 text-sm text-muted-foreground">
                Este profissional ainda está configurando os serviços do ELLO Link.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-border/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <h2 className="text-base font-black">Agenda disponível</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Escolha um horário para solicitar o agendamento rápido.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.value}
                type="button"
                onClick={() => setSelectedSlot(slot.value)}
                className={`rounded-[20px] border p-3 text-left ${
                  selectedSlot === slot.value
                    ? "border-primary bg-primary text-white shadow-[0_12px_30px_rgba(0,76,255,0.2)]"
                    : "border-border bg-white"
                }`}
              >
                <span className="flex items-center gap-1 text-xs font-black">
                  <CalendarDays className="size-3.5" />
                  {slot.date}
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs">
                  <Clock className="size-3.5" />
                  {slot.time}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-border/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <h2 className="text-base font-black">Fale direto com o profissional</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O WhatsApp já abre com a mensagem pronta configurada pelo profissional.
          </p>
          <a
            href={profile.whatsappUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!profile.whatsappUrl}
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-[18px] bg-emerald-600 text-sm font-black text-white shadow-[0_16px_35px_rgba(5,136,63,0.2)] aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <MessageCircle className="size-4" />
            Tirar dúvida no WhatsApp
          </a>
        </section>

        {qrCodeUrl ? (
          <section className="rounded-[28px] border border-border/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl">
            <h2 className="flex items-center gap-2 text-base font-black">
              <QrCode className="size-4 text-primary" />
              QR Code do ELLO Link
            </h2>
            <button
              onClick={() =>
                void recordElloLinkEvent({ professionalId: profile.id, eventType: "qr_view" })
              }
              className="mt-3 grid w-full place-items-center rounded-[22px] bg-secondary/80 p-4"
            >
              <img src={qrCodeUrl} alt={`QR Code de ${profile.name}`} className="size-40" />
            </button>
          </section>
        ) : null}

        {bookingMutation.error ? (
          <p className="rounded-[20px] bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {bookingMutation.error.message}
          </p>
        ) : null}

        <div className="sticky bottom-4 space-y-2 rounded-[28px] border border-border/70 bg-white/90 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
          {!configured ? (
            <p className="text-center text-xs font-semibold text-muted-foreground">
              Configure o Supabase para concluir agendamentos reais.
            </p>
          ) : null}
          <button
            disabled={!canBook || !configured || bookingMutation.isPending}
            onClick={handleBookingClick}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-primary text-sm font-black text-white shadow-[0_16px_35px_rgba(0,76,255,0.2)] disabled:bg-muted disabled:text-muted-foreground"
          >
            <CheckCircle2 className="size-4" />
            {user ? "Agendar agora" : "Criar conta rápida e agendar"}
          </button>
        </div>
      </main>
    </div>
  );
}

function ServiceOption({
  index,
  onSelect,
  selected,
  service,
}: {
  index: number;
  onSelect: () => void;
  selected: boolean;
  service: ProfessionalService;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-[22px] border p-3 text-left ${
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
      }`}
    >
      <ServicePhoto index={index} label={service.title} className="size-16" />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">{service.title}</strong>
        <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
          {service.description ?? "Descrição rápida configurada pelo profissional."}
        </span>
        <span className="mt-1 block text-xs font-black text-primary">
          {service.basePrice ?? "Valor sob consulta"}
        </span>
      </span>
      {selected ? <CheckCircle2 className="size-5 text-primary" /> : null}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-secondary/80 p-2 text-center">
      <p className="flex items-center justify-center gap-1 text-sm font-black">
        {label === "Avaliação" ? <Star className="size-3.5 fill-primary text-primary" /> : null}
        {value}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function createVisibleSlots() {
  const slots: Array<{ date: string; time: string; value: string }> = [];
  const hours = [9, 10, 14, 16];
  for (let index = 1; index <= 3; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() + index);
    for (const hour of hours.slice(0, 2)) {
      const option = new Date(date);
      option.setHours(hour, 0, 0, 0);
      slots.push({
        date: option.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        time: option.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        value: option.toISOString(),
      });
    }
  }
  return slots.slice(0, 6);
}

function savePendingLink(value: { slug: string; serviceId: string; startsAt: string }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_LINK_KEY, JSON.stringify(value));
}

function readPendingLink(): { slug: string; serviceId: string; startsAt: string } | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_LINK_KEY) ?? "null") as {
      slug: string;
      serviceId: string;
      startsAt: string;
    } | null;
  } catch {
    return null;
  }
}

function clearPendingLink() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_LINK_KEY);
}
