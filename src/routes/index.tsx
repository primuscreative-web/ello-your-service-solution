import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Apple,
  CalendarDays,
  Check,
  Clock3,
  Hand,
  MessageCircle,
  PawPrint,
  Store,
  Utensils,
  Coffee,
  Pizza,
  Scissors,
  HeartPulse,
  Printer,
  QrCode,
  Bike,
  Receipt,
  TrendingUp,
  Bot,
  ShieldCheck,
  Layers,
  Smartphone,
  Share2,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/")({ component: LandingPage });

const SCROLL_VIDEO_URL = "/videos/ello-scroll-background.mp4";

const SHOWCASE_BUSINESSES: {
  id: string;
  label: string;
  category: string;
  name: string;
  tagline: string;
  description: string;
  highlights: [string, string];
  action: string;
  image: string;
  imageAlt: string;
  headline: string;
  accent: string;
  heroDescription: string;
  heroAction: string;
  heroProof: string;
  icon: LucideIcon;
}[] = [
  {
    id: "hamburgueria",
    label: "Hamburgueria",
    category: "Cardápio digital",
    name: "Brasa da Vila",
    tagline: "Feito na brasa, do seu jeito.",
    description: "Hambúrgueres artesanais, acompanhamentos e pedidos em um só lugar.",
    highlights: ["Smash da casa", "Combos e acompanhamentos"],
    action: "Ver cardápio",
    image: "/images/showcase/hamburgueria.jpg",
    imageAlt: "Hambúrguer artesanal com queijo e batatas em uma mesa de restaurante",
    headline: "Seu cardápio online,",
    accent: "venda sem comissão.",
    heroDescription:
      "Publique seu cardápio, receba pedidos num só painel, organize a entrega com sua própria equipe e pague só a assinatura ELLO.",
    heroAction: "Crie seu cardápio",
    heroProof: "Sem comissão sobre vendas",
    icon: Utensils,
  },
  {
    id: "manicure",
    label: "Manicure",
    category: "Beleza e cuidados",
    name: "Studio Bela",
    tagline: "Um tempo só para você.",
    description: "Apresente seu trabalho, serviços e horários de atendimento.",
    highlights: ["Esmaltação em gel", "Nail art"],
    action: "Agendar horário",
    image: "/images/showcase/manicure.jpg",
    imageAlt: "Atendimento de manicure com cuidado profissional em salão de beleza",
    headline: "Sua agenda online,",
    accent: "mais tempo pra cuidar.",
    heroDescription:
      "Apresente seus serviços, mostre seu trabalho e deixe seus clientes encontrarem horários para agendar.",
    heroAction: "Crie seu perfil",
    heroProof: "Seu espaço online para compartilhar",
    icon: Hand,
  },
  {
    id: "nutricionista",
    label: "Nutricionista",
    category: "Saúde e bem-estar",
    name: "Nutri por Inteiro",
    tagline: "Cuidado que cabe na sua rotina.",
    description: "Informações sobre consultas, acompanhamento e atendimento.",
    highlights: ["Consulta nutricional", "Acompanhamento"],
    action: "Conhecer atendimento",
    image: "/images/showcase/nutricionista.jpg",
    imageAlt:
      "Nutricionista conversando com cliente em consultório claro diante de uma refeição equilibrada",
    headline: "Seu atendimento online,",
    accent: "mais perto de quem precisa.",
    heroDescription:
      "Apresente sua atuação, organize seus atendimentos e facilite o contato de novos pacientes com você.",
    heroAction: "Crie seu perfil",
    heroProof: "Mais facilidade para novos pacientes",
    icon: Apple,
  },
  {
    id: "petsitter",
    label: "Pet sitter",
    category: "Cuidado pet",
    name: "Perto de Você Pet",
    tagline: "Carinho e cuidado, mesmo quando você sai.",
    description: "Mostre como funciona o cuidado e combine uma visita.",
    highlights: ["Visita em casa", "Passeio individual"],
    action: "Consultar disponibilidade",
    image: "/images/showcase/pet-sitter.jpg",
    imageAlt: "Cuidadora passeando com um cachorro em uma área verde",
    headline: "Seu cuidado pet online,",
    accent: "mais perto de cada tutor.",
    heroDescription:
      "Mostre seus serviços, explique como funciona seu atendimento e facilite o contato com tutores da sua região.",
    heroAction: "Crie seu perfil",
    heroProof: "Seu perfil pronto para compartilhar",
    icon: PawPrint,
  },
];

function LandingPage() {
  const { business } = useLocalHub();
  const startTo = business ? "/studio" : "/onboarding";
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const featuredBusiness = SHOWCASE_BUSINESSES[activeShowcaseIndex];

  return (
    <div className="ello-site min-h-screen overflow-x-clip text-[#20221f]">
      <ScrollVideoBackground />
      <header className="ello-nav sticky top-0 z-50 w-full px-5 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between py-3">
          <Link
            to="/"
            aria-label="ELLO, início"
            className="ello-wordmark flex items-center gap-2.5 text-white"
          >
            <BrandMark />
            <span className="text-[21px] font-semibold tracking-[-.06em]">ello</span>
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-white/75 md:flex">
            <a href="#segmentos" className="ello-nav-link">
              Tipos de Negócio
            </a>
            <a href="#solucao" className="ello-nav-link">
              A plataforma
            </a>
            <a href="#passos" className="ello-nav-link">
              Como funciona
            </a>
            <a href="#sobre" className="ello-nav-link">
              Para quem é
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to={business ? "/studio" : "/auth"}
              className="hidden px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white sm:inline-flex"
            >
              {business ? "Acessar painel" : "Já tenho conta"}
            </Link>
            <Link to={startTo} className="ello-cta ello-cta-lime min-h-10">
              {business ? "Meu espaço" : "Criar meu espaço"}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="ello-hero relative isolate mx-auto grid max-w-[1440px] items-center gap-8 overflow-hidden px-5 pb-16 pt-9 sm:gap-12 sm:px-10 sm:pb-28 sm:pt-16 min-[1180px]:grid-cols-[.92fr_1.08fr] min-[1180px]:gap-12 lg:gap-16 lg:px-16 lg:pb-32 lg:pt-20">
          <div className="relative z-10 max-w-[590px]">
            <h1 className="font-display text-[clamp(2.7rem,12vw,4.25rem)] font-medium leading-[.99] tracking-[-.065em] sm:text-[68px] lg:text-[76px]">
              {featuredBusiness.headline}
              <br className="hidden sm:block" />
              <span className="ello-heading-accent"> {featuredBusiness.accent}</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[15px] leading-[1.65] text-[#696b64] sm:text-[18px] sm:leading-[1.75]">
              {featuredBusiness.heroDescription}
            </p>
            <div className="ello-hero-actions mt-8 flex flex-wrap items-center gap-3">
              <Link to={startTo} className="ello-cta ello-cta-lime">
                {business ? "Abrir meu espaço" : featuredBusiness.heroAction}
                <ArrowRight size={16} />
              </Link>
              <a href="#passos" className="ello-cta ello-cta-quiet">
                Ver como funciona
                <ArrowDownRight size={15} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-2 text-[12px] text-[#777970]">
              <Check size={14} className="text-[#69833b]" />
              {featuredBusiness.heroProof} <span className="mx-1 text-[#c7c8c0]">·</span>
              <Check size={14} className="text-[#69833b]" />
              Pronta em poucos minutos
            </div>
          </div>

          <BusinessShowcase
            activeIndex={activeShowcaseIndex}
            setActiveIndex={setActiveShowcaseIndex}
          />
        </section>

        <section className="ello-proof border-y border-[#e6e5dd] px-5 py-7 sm:px-10 lg:px-16">
          <div className="ello-proof-card mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 sm:flex-row">
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#92948b]">
              Sua operação de venda em um só lugar
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[12px] font-medium text-[#64665f]">
              <span className="flex items-center gap-2">
                <Store size={15} className="text-[#89975f]" />
                Página profissional
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="text-[#89975f]" />
                Pedidos no painel
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle size={15} className="text-[#89975f]" />
                Entrega própria
              </span>
            </div>
          </div>
        </section>

        {/* Seção Interativa de Tipos de Negócio e Ferramentas */}
        <BusinessCategoriesExplorer startTo={startTo} />

        <section
          id="solucao"
          className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
        >
          <div className="ello-section-heading grid gap-6 md:grid-cols-[.78fr_1.22fr] md:items-end">
            <div>
              <div className="ello-section-index">01 / Um espaço só seu</div>
              <h2 className="mt-5 max-w-[390px] font-display text-[38px] font-medium leading-[1.04] tracking-[-.055em] sm:text-[50px]">
                Do primeiro pedido à entrega, sem perder o controle.
              </h2>
            </div>
            <p className="max-w-[460px] pb-1 text-[15px] leading-7 text-[#777970] md:justify-self-end">
              Um canal direto entre seu restaurante e seus clientes: cardápio, pedidos e entregas
              organizados no mesmo lugar, mantendo o relacionamento e a receita no seu negócio.
            </p>
          </div>
          <div className="ello-feature-grid mt-12 grid gap-3 md:grid-cols-3">
            <FeatureCard
              number="01"
              icon={<Store size={18} />}
              title="Seu cardápio digital"
              text="Organize categorias, itens e preços num link simples de compartilhar e pronto para receber pedidos."
            />
            <FeatureCard
              number="02"
              icon={<CalendarDays size={18} />}
              title="Pedidos num só painel"
              text="Veja itens, observações, endereço e pagamento escolhido; avance do aceite ao preparo e à conclusão."
            />
            <FeatureCard
              number="03"
              icon={<Clock3 size={18} />}
              title="Sua equipe de entrega"
              text="Cadastre seus motoboys, atribua entregas e compartilhe os dados do pedido direto pelo WhatsApp."
            />
          </div>
          <div className="mt-10 grid gap-3 rounded-2xl border border-[#e6e5dd] bg-white/55 p-6 backdrop-blur-sm sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6 sm:p-8">
            <span className="inline-flex w-fit items-center rounded-full border border-[#dce4ca] bg-[#f1f4e9] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.12em] text-[#66794a]">
              Só assinatura
            </span>
            <div>
              <h3 className="font-display text-[22px] font-medium tracking-[-.04em] sm:text-[25px]">
                Sem taxas sobre suas vendas.
              </h3>
              <p className="mt-2 max-w-[680px] text-[14px] leading-6 text-[#777970]">
                Você paga apenas o plano ou a assinatura ELLO, sem comissão nem porcentagem sobre o
                que seu negócio vende ou atende.
              </p>
            </div>
          </div>
        </section>

        <section
          id="passos"
          className="ello-steps-wrap relative isolate overflow-hidden px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
        >
          <div className="relative z-10 mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-20">
            <div>
              <div className="ello-section-index">02 / Sem complicação</div>
              <h2 className="mt-5 max-w-[400px] font-display text-[38px] font-medium leading-[1.04] tracking-[-.055em] sm:text-[50px]">
                Do seu jeito, no seu tempo.
              </h2>
              <p className="mt-5 max-w-[390px] text-[15px] leading-7 text-[#777970]">
                Configure o restaurante uma vez e depois compartilhe o link e acompanhe os pedidos
                com a equipe.
              </p>
              <Link to={startTo} className="ello-cta ello-cta-dark mt-7">
                Começar agora
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="ello-steps-list">
              <Step
                number="01"
                title="Configure sua loja"
                text="Defina horários, entrega própria, retirada e taxa de entrega."
              />
              <Step
                number="02"
                title="Monte seu cardápio"
                text="Adicione categorias, produtos, descrições e preços."
              />
              <Step
                number="03"
                title="Compartilhe seu link"
                text="Receba o pedido no painel, organize o preparo e despache com seu motoboy."
              />
            </div>
          </div>
        </section>

        <section
          id="sobre"
          className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
        >
          <div className="ello-closing flex flex-col items-start justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-end lg:p-16">
            <div>
              <div className="ello-section-index">Seu trabalho merece ser visto</div>
              <h2 className="mt-5 max-w-[650px] font-display text-[40px] font-medium leading-[1.02] tracking-[-.06em] sm:text-[58px]">
                Seu próximo cliente pode estar a um link de distância.
              </h2>
            </div>
            <Link to={startTo} className="ello-cta ello-cta-lime shrink-0">
              {business ? "Acessar meu espaço" : "Criar meu espaço grátis"}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="ello-footer mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-5 py-7 text-[11px] text-[#85877e] sm:flex-row sm:px-10 lg:px-16">
        <Link to="/" className="flex items-center gap-2 font-semibold text-[#242620]">
          <BrandMark small /> ello
        </Link>
        <span>Cardápio digital e operação de pedidos para restaurantes locais.</span>
        <span>© {new Date().getFullYear()} ELLO</span>
      </footer>
    </div>
  );
}

function BusinessShowcase({
  activeIndex,
  setActiveIndex,
}: {
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
}) {
  const { business: activeBusiness } = useLocalHub();
  const [isPaused, setIsPaused] = useState(false);
  const business = SHOWCASE_BUSINESSES[activeIndex];
  const BusinessIcon = business.icon;

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SHOWCASE_BUSINESSES.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [isPaused, setActiveIndex]);

  return (
    <div
      className="ello-showcase relative mx-auto w-full max-w-[680px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div className="ello-showcase-backdrop" aria-hidden="true" />
      <div className="ello-showcase-tabs" role="group" aria-label="Exemplos por tipo de negócio">
        {SHOWCASE_BUSINESSES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          >
            {item.label}
          </button>
        ))}
        <Link
          className="ello-showcase-create hidden sm:inline-flex"
          to={activeBusiness ? "/studio" : "/onboarding"}
        >
          Crie o seu perfil ELLO <ArrowRight size={13} />
        </Link>
      </div>

      <div className="ello-store-card" key={business.id}>
        <div className="ello-store-cover">
          <img className="ello-store-cover-image" src={business.image} alt={business.imageAlt} />
          <div className="ello-cover-content">
            <span className="ello-cover-label">{business.category}</span>
            <div className="ello-cover-caption">{business.tagline}</div>
          </div>
          <span className="ello-preview-label">Prévia de exemplo</span>
        </div>
        <div className="ello-store-content">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="ello-avatar">
                <BusinessIcon size={18} />
              </span>
              <div>
                <div className="text-[15px] font-semibold tracking-[-.03em]">{business.name}</div>
                <div className="mt-1 text-[11px] text-[#85877e]">{business.category}</div>
              </div>
            </div>
            <span className="ello-profile-badge">Perfil ELLO</span>
          </div>
          <p className="mt-4 max-w-[400px] text-[12px] leading-5 text-[#777970]">
            {business.description}
          </p>
          <div className="mt-5 border-t border-[#eeeee8] pt-4">
            <span className="text-[11px] font-medium text-[#686a62]">Destaques</span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {business.highlights.map((highlight) => (
                <div className="ello-service" key={highlight}>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="ello-booking" type="button">
            <CalendarDays size={14} /> {business.action}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`ello-brand-mark${small ? " ello-brand-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" className="ello-brand-symbol">
        <path d="M23.5 15.8H10.1a6.1 6.1 0 0 1 11.8-1.9" />
        <path d="M10.1 16.1a6.1 6.1 0 0 0 11.8 1.9" />
      </svg>
    </span>
  );
}

function ScrollVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const basePlaybackRate = 0.8;
    const maxPlaybackRate = 2.4;
    let targetPlaybackRate = basePlaybackRate;
    let previousScrollY = window.scrollY;
    let previousScrollTime = performance.now();
    let previousFrameTime = previousScrollTime;
    let animationFrame = 0;
    let lastScrollTime = 0;

    const resumePlayback = () => {
      if (reducedMotion.matches || document.visibilityState !== "visible" || !video.paused) return;
      void video.play().catch(() => {});
    };

    const handleScroll = () => {
      const now = performance.now();
      const elapsed = Math.max((now - previousScrollTime) / 1000, 0.016);
      const distance = Math.abs(window.scrollY - previousScrollY);
      const scrollVelocity = distance / elapsed;
      const scrollBoost = Math.max(0.8, scrollVelocity / 850);
      targetPlaybackRate = Math.min(maxPlaybackRate, basePlaybackRate + scrollBoost);
      previousScrollY = window.scrollY;
      previousScrollTime = now;
      lastScrollTime = now;
      resumePlayback();
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updatePlaybackRate);
    };

    const updatePlaybackRate = (timestamp: number) => {
      animationFrame = 0;
      if (reducedMotion.matches || document.visibilityState !== "visible") return;
      if (video.paused) {
        resumePlayback();
        return;
      }
      if (timestamp - lastScrollTime > 550) targetPlaybackRate = basePlaybackRate;
      const difference = targetPlaybackRate - video.playbackRate;
      const frameDelta = Math.min((timestamp - previousFrameTime) / 1000, 0.05);
      previousFrameTime = timestamp;
      video.playbackRate += difference * (1 - Math.exp(-12 * frameDelta));
      if (Math.abs(difference) > 0.015 || targetPlaybackRate !== basePlaybackRate) {
        animationFrame = window.requestAnimationFrame(updatePlaybackRate);
      }
    };

    const startLoop = () => {
      if (reducedMotion.matches) return;
      video.defaultPlaybackRate = basePlaybackRate;
      if (video.paused) resumePlayback();
    };

    const handlePause = () => resumePlayback();

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) startLoop();
    video.addEventListener("loadedmetadata", startLoop);
    video.addEventListener("pause", handlePause);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", startLoop);

    return () => {
      video.removeEventListener("loadedmetadata", startLoop);
      video.removeEventListener("pause", handlePause);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", startLoop);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [portalTarget]);

  if (!portalTarget) return null;

  return createPortal(
    <>
      <video
        ref={videoRef}
        className="ello-scroll-video"
        muted
        playsInline
        loop
        preload="auto"
        tabIndex={-1}
        aria-hidden="true"
      >
        <source src={SCROLL_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="ello-scroll-video-overlay" aria-hidden="true" />
    </>,
    portalTarget,
  );
}

function FeatureCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="ello-feature-card">
      <div className="flex items-center justify-between">
        <span className="ello-feature-icon">{icon}</span>
        <span className="text-[10px] font-medium tracking-[.12em] text-[#a4a69d]">{number}</span>
      </div>
      <h3 className="mt-8 text-[17px] font-semibold tracking-[-.03em]">{title}</h3>
      <p className="mt-2 max-w-[310px] text-[13px] leading-6 text-[#777970]">{text}</p>
    </article>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="ello-step">
      <span className="ello-step-number">{number}</span>
      <div>
        <h3 className="text-[16px] font-semibold tracking-[-.02em]">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-6 text-[#777970]">{text}</p>
      </div>
      <ArrowUpRight size={15} className="ml-auto text-[#8d966e]" />
    </article>
  );
}

const BUSINESS_CATEGORIES: {
  id: string;
  shortLabel: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: LucideIcon;
  headline: string;
  tagline: string;
  description: string;
  onboardingParam: string;
  highlightMetrics: { value: string; label: string }[];
  tools: {
    name: string;
    tag: string;
    tagColor: string;
    description: string;
    icon: LucideIcon;
  }[];
  flowSteps: { step: string; title: string; desc: string }[];
}[] = [
  {
    id: "restaurantes",
    shortLabel: "Restaurantes & Hamburguerias",
    name: "Restaurantes, Hamburguerias & Delivery",
    badge: "Ecossistema Completo",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Utensils,
    headline: "A operação completa da cozinha às entregas sem pagar 27% de comissão",
    tagline: "Do cardápio digital à rota do motoboy no Waze, tudo integrado em um só ecossistema.",
    description:
      "Elimine intermediários e aumente sua margem líquida com ferramentas profissionais feitas especificamente para o ritmo acelerado de cozinhas, hamburguerias e lanchonetes.",
    onboardingParam: "alimentacao",
    highlightMetrics: [
      { value: "0%", label: "Comissão sobre suas vendas" },
      { value: "3x", label: "Mais velocidade no preparo com KDS" },
      { value: "80mm", label: "Impressão térmica automática" },
      { value: "Waze/Maps", label: "Rotas automáticas para motoboys" },
    ],
    tools: [
      {
        name: "Impressão Térmica Automática",
        tag: "Automático",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Vias separadas de 80mm para cozinha, bar e embalagem assim que o pedido entra via WebSocket.",
        icon: Printer,
      },
      {
        name: "KDS & Gestão de Cozinha em Tempo Real",
        tag: "KDS",
        tagColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Painel kanban de preparo com alerta sonoro contínuo Web Audio para novos pedidos.",
        icon: Layers,
      },
      {
        name: "Gestão de Motoboys & Taxa por KM",
        tag: "Logística",
        tagColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Cadastro de entregadores, taxas calculadas por distância e rotas automáticas no GPS.",
        icon: Bike,
      },
      {
        name: "Mesas, Comandas & QR Code",
        tag: "Salão",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Mapa interativo de salão, placas com QR Code para mesa e conferência de consumo em 80mm.",
        icon: QrCode,
      },
      {
        name: "Totem de Autoatendimento Tablet",
        tag: "Inovação",
        tagColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        description: "Modo Kiosk para iPad/tablet no salão com escolha de mesa, Pix na tela e senha de chamada.",
        icon: Smartphone,
      },
      {
        name: "Integração Oficial com iFood",
        tag: "Omnichannel",
        tagColor: "bg-red-100 text-red-800 border-red-200",
        description: "Centralize pedidos do marketplace no mesmo painel KDS sem precisar de múltiplos aparelhos.",
        icon: Store,
      },
      {
        name: "Disparos WhatsApp & CRM de Retenção",
        tag: "Marketing",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Reative clientes inativos com mensagens prontas e links diretos de desconto no WhatsApp.",
        icon: Share2,
      },
      {
        name: "DRE Semanal & Contas a Pagar/Receber",
        tag: "Financeiro",
        tagColor: "bg-sky-100 text-sky-800 border-sky-200",
        description: "Acompanhe faturamento bruto, custos de insumos e margem de lucro líquido em tempo real.",
        icon: Receipt,
      },
      {
        name: "Cardápio com IA & Fotos Gastronômicas",
        tag: "Inteligência Artificial",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Gerador de descrições persuasivas com 1 clique e banco gratuito com fotos de pratos.",
        icon: Bot,
      },
      {
        name: "Programa de Fidelidade & Cashback",
        tag: "Fidelização",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "Devolva créditos na carteira do cliente para incentivar recompras semanais recorrentes.",
        icon: CreditCard,
      },
    ],
    flowSteps: [
      { step: "1", title: "Cliente pede online ou na mesa", desc: "Acessa seu link próprio ou escaneia o QR Code da mesa com visual apetitoso e sem atrito." },
      { step: "2", title: "Cozinha prepara com som de alerta", desc: "O pedido cai no KDS e as impressoras emitem tickets segmentados de cozinha e bar." },
      { step: "3", title: "Motoboy recebe a rota no GPS", desc: "Despacho com endereço e trajeto traçado no Google Maps e Waze para entrega rápida." },
    ],
  },
  {
    id: "pizzarias",
    shortLabel: "Pizzarias & Lanchonetes",
    name: "Pizzarias & Lanchonetes Rápidas",
    badge: "Alta Rotação",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Pizza,
    headline: "Agilidade máxima do forno ao cliente com controle de sabores, combos e despacho veloz",
    tagline: "Divisão de sabores, bordas recheadas, PDV rápido e taxa de entrega precisa por distância.",
    description:
      "Perfeito para operações com pico de pedidos noturnos que necessitam de cadastro flexível de meio-a-meio e fechamento de caixa confiável.",
    onboardingParam: "alimentacao",
    highlightMetrics: [
      { value: "10s", label: "Para lançar qualquer pedido no PDV" },
      { value: "Meio a Meio", label: "Seleção simples de sabores e bordas" },
      { value: "R$ 0", label: "Taxas ou percentuais sobre suas vendas" },
      { value: "PDF A4", label: "Cardápio gráfico pronto para gráfica" },
    ],
    tools: [
      {
        name: "Montador de Sabores & Bordas",
        tag: "Cardápio",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Configuração de 2 ou mais sabores por pizza, cálculo pelo maior valor e adicionais de borda.",
        icon: Pizza,
      },
      {
        name: "PDV Balcão & Lançamento Express",
        tag: "Agilidade",
        tagColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Lançamento ultra-rápido de pedidos recebidos por telefone ou balcão físico em poucos toques.",
        icon: Receipt,
      },
      {
        name: "Taxa de Entrega por Raio & KM",
        tag: "Logística",
        tagColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Cálculo transparente de taxa fixa base + adicional por quilômetro rodado até o cliente.",
        icon: Bike,
      },
      {
        name: "Links de Desconto & Combos Promocionais",
        tag: "Marketing",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "Divulgue promoções de terça a quinta com cupom pré-aplicado e link direto para WhatsApp.",
        icon: Share2,
      },
      {
        name: "Controle de Caixa & Sangrias",
        tag: "Caixa",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Abertura, conferência de sangrias e fechamento de caixa diário por operador.",
        icon: TrendingUp,
      },
      {
        name: "Gerador de Cardápio Gráfico em PDF",
        tag: "Design",
        tagColor: "bg-sky-100 text-sky-800 border-sky-200",
        description: "Exportação em alta definição pronta para gráfica imprimir cardápios físicos ou ímãs.",
        icon: Layers,
      },
    ],
    flowSteps: [
      { step: "1", title: "Montagem intuitiva da pizza", desc: "O cliente combina sabores, seleciona a borda e adiciona refrigerante sem confusão." },
      { step: "2", title: "Impressão direta para o forno", desc: "A via do forno sai com observações destacadas (sem cebola, borda recheada, ponto da massa)." },
      { step: "3", title: "Despacho organizado na bag", desc: "Entregador leva a pizza com endereço impresso e cálculo automático de troco ou PIX pago." },
    ],
  },
  {
    id: "cafes",
    shortLabel: "Cafeterias, Bares & Confeitarias",
    name: "Cafeterias, Bares & Confeitarias",
    badge: "Salão & Balcão",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Coffee,
    headline: "Atendimento fluido no balcão e nas mesas com comandas em tempo real e fechamento instantâneo",
    tagline: "Comandas abertas, QR Code em cada mesa, vitrine visual de doces e pagamentos instantâneos.",
    description:
      "Transforme o ambiente da sua cafeteria ou bar com pedidos ágeis, vitrine elegante e clientes satisfeitos com a praticidade de pedir sem fila.",
    onboardingParam: "alimentacao",
    highlightMetrics: [
      { value: "0 Filas", label: "Com pedido por QR Code na mesa" },
      { value: "5 Estrelas", label: "Captura de avaliações no Google" },
      { value: "Instantâneo", label: "PIX com QR Code dinâmico na tela" },
      { value: "1 Clique", label: "Fechamento de comanda e recibo" },
    ],
    tools: [
      {
        name: "Cardápio por QR Code na Mesa",
        tag: "Sem Fila",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "O cliente senta, lê a placa da mesa e escolhe cafés especiais e sobremesas no smartphone.",
        icon: QrCode,
      },
      {
        name: "Comanda Aberta & Mapa do Salão",
        tag: "Salão",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Lance cafés, drinks e doces ao longo da permanência do cliente e feche com extrato impresso.",
        icon: Coffee,
      },
      {
        name: "PIX Automatizado no Balcão",
        tag: "Pagamento",
        tagColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Geração de QR Code Pix dinâmico no balcão com validação automática do recebimento.",
        icon: CreditCard,
      },
      {
        name: "Controle de Fornecedores & Insumos",
        tag: "Gestão",
        tagColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Registre despesas com grãos, laticínios e embalagens com alertas de vencimento.",
        icon: Receipt,
      },
      {
        name: "Avaliações no Google Meu Negócio",
        tag: "Reputação",
        tagColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
        description: "Incentive clientes a avaliarem sua cafeteria no Google e impulsione sua posição nas buscas.",
        icon: ShieldCheck,
      },
      {
        name: "Programa de Embaixadores",
        tag: "Comunidade",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "Recompense clientes influentes e crie uma legião de defensores apaixonados pelo seu café.",
        icon: Share2,
      },
    ],
    flowSteps: [
      { step: "1", title: "Cliente senta e escaneia a mesa", desc: "Acessa fotos apetitosas dos pratos e bebidas com descrições detalhadas." },
      { step: "2", title: "Barista recebe o ticket do bar", desc: "A impressora do bar recebe apenas as bebidas enquanto a cozinha recebe os lanches." },
      { step: "3", title: "Fechamento rápido sem burocracia", desc: "Pagamento via Pix ou cartão com extrato de conferência emitido em 80mm." },
    ],
  },
  {
    id: "beleza",
    shortLabel: "Salões, Manicures & Barbearias",
    name: "Salões de Beleza, Manicures & Barbearias",
    badge: "Agendamento 24h",
    badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
    icon: Scissors,
    headline: "Sua agenda cheia automaticamente sem perder horas respondendo WhatsApp",
    tagline: "Clientes marcam o próprio horário 24 horas por dia, com lembretes que reduzem o no-show.",
    description:
      "Diga adeus ao estresse de ficar conferindo mensagens no WhatsApp entre um atendimento e outro. Sua agenda trabalha por você mesmo quando o salão está fechado.",
    onboardingParam: "beleza",
    highlightMetrics: [
      { value: "-80%", label: "Redução de faltas com lembretes WhatsApp" },
      { value: "24h/dia", label: "Disponibilidade de agendamento automático" },
      { value: "Individual", label: "Divisão de comissões por profissional" },
      { value: "Sinal R$", label: "Garantia antecipada contra cancelamentos" },
    ],
    tools: [
      {
        name: "Agendamento Online 24/7",
        tag: "Agenda",
        tagColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Seu cliente escolhe o profissional, o serviço e o melhor horário disponível em tempo real.",
        icon: CalendarDays,
      },
      {
        name: "Múltiplos Profissionais & Comissões",
        tag: "Equipe",
        tagColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Controle individual de agendas para cada barbeiro, manicure ou cabeleireiro com cálculo de comissão.",
        icon: Scissors,
      },
      {
        name: "Lembretes Automáticos no WhatsApp",
        tag: "Zero Faltas",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Envio de mensagens automáticas de confirmação horas antes para evitar cadeiras vazias.",
        icon: Share2,
      },
      {
        name: "Cobrança de Sinal & Pagamento Online",
        tag: "Garantia",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Opção de cobrar entrada via Pix no momento do agendamento para eliminar no-shows.",
        icon: CreditCard,
      },
      {
        name: "Catálogo Visual de Procedimentos",
        tag: "Portfolio",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "Exiba nail arts, cortes masculinos, colorações e tratamentos com fotos de alta qualidade.",
        icon: Sparkles,
      },
      {
        name: "Fidelização & Retorno Programado",
        tag: "Recorrência",
        tagColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
        description: "Dispare lembretes quando passar o tempo ideal para retoque de raiz ou manutenção.",
        icon: TrendingUp,
      },
    ],
    flowSteps: [
      { step: "1", title: "Cliente escolhe o serviço no link", desc: "Acessa seu link da bio no Instagram, escolhe o profissional e o horário ideal." },
      { step: "2", title: "Confirmação e lembrete automático", desc: "Horário reservado na agenda e lembrete enviado para o WhatsApp do cliente." },
      { step: "3", title: "Atendimento focado e comissão calculada", desc: "Sem tempo perdido no celular e comissões calculadas automaticamente no painel." },
    ],
  },
  {
    id: "saude",
    shortLabel: "Clínicas, Nutrição & Saúde",
    name: "Clínicas, Nutricionistas & Consultórios",
    badge: "Cuidado & Autoridade",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    icon: HeartPulse,
    headline: "Apresentação médica e terapêutica com gestão de consultas, horários e acompanhamento",
    tagline: "Transmita credibilidade com agendamento direto, ficha de atendimento e cobrança transparente.",
    description:
      "Para profissionais da saúde que valorizam a relação com o paciente e buscam organização clínica sem pagar fatias percentuais por consulta a plataformas terceiras.",
    onboardingParam: "saude",
    highlightMetrics: [
      { value: "100% Seu", label: "Sem intermediários tirando fatia da consulta" },
      { value: "Seguro", label: "Privacidade e dados de contato organizados" },
      { value: "Pacotes", label: "Venda de acompanhamentos e retornos" },
      { value: "Profissional", label: "Página moderna com seu currículo e local" },
    ],
    tools: [
      {
        name: "Página de Apresentação Profissional",
        tag: "Autoridade",
        tagColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Apresente sua formação, especialidades, registro profissional e fotos do consultório.",
        icon: HeartPulse,
      },
      {
        name: "Gestão Inteligente de Intervalos",
        tag: "Agenda",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Defina tempos de consulta e intervalos necessários para desinfecção ou anotações clínicas.",
        icon: CalendarDays,
      },
      {
        name: "Cobrança de Consultas & Planos",
        tag: "Pagamento",
        tagColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Receba consultas avulsas ou planos mensais de acompanhamento via Pix e Cartão.",
        icon: CreditCard,
      },
      {
        name: "Orientações Pré-Consulta por WhatsApp",
        tag: "Comunicação",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Envie instruções de jejum, exames necessários e localização com 1 clique.",
        icon: Share2,
      },
      {
        name: "Histórico & Ficha de Atendimento",
        tag: "Organização",
        tagColor: "bg-sky-100 text-sky-800 border-sky-200",
        description: "Centralize observações e histórico de cada paciente em um ambiente limpo e seguro.",
        icon: Layers,
      },
      {
        name: "Avaliações & Prova Social Confiável",
        tag: "Reputação",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "Depoimentos reais de pacientes satisfeitos para consolidar sua autoridade na região.",
        icon: ShieldCheck,
      },
    ],
    flowSteps: [
      { step: "1", title: "Paciente encontra sua especialidade", desc: "Lê sobre sua abordagem e encontra os horários de consulta disponíveis." },
      { step: "2", title: "Reserva com instruções de preparo", desc: "Recebe o endereço do consultório e recomendações de exames antecipados." },
      { step: "3", title: "Acompanhamento e fidelização", desc: "Organização dos retornos periódicos e controle financeiro das consultas realizadas." },
    ],
  },
  {
    id: "servicos",
    shortLabel: "Pet Care & Serviços Especializados",
    name: "Pet Care, Passeadores & Serviços Locais",
    badge: "Proximidade & Confiança",
    badgeColor: "bg-lime-100 text-lime-800 border-lime-200",
    icon: PawPrint,
    headline: "Seu serviço local organizado com fotos, agendamento de visitas e cobrança fácil",
    tagline: "Apresente seus cuidados, atenda na sua região e mantenha contato próximo com os clientes.",
    description:
      "Para cuidadores de pets, dog walkers, adestradores e prestadores de serviços locais que buscam profissionalismo e praticidade para crescer no bairro.",
    onboardingParam: "servicos",
    highlightMetrics: [
      { value: "Bairros", label: "Defina seu raio de atendimento geográfico" },
      { value: "Link Único", label: "Compartilhe tudo em um só link na bio" },
      { value: "Pix Direto", label: "Receba sem taxas abusivas de aplicativos" },
      { value: "Fotos & Feed", label: "Demonstre a qualidade do seu cuidado" },
    ],
    tools: [
      {
        name: "Perfil de Especialidades & Cuidados",
        tag: "Perfil",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Apresente seus serviços de passeio, hotelzinho, adestramento ou atendimento domiciliar.",
        icon: PawPrint,
      },
      {
        name: "Área de Atendimento por Região",
        tag: "Bairros",
        tagColor: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Deixe claro os bairros e condomínios onde você atende para filtrar clientes certos.",
        icon: Bike,
      },
      {
        name: "Solicitação de Visitas & Diárias",
        tag: "Agenda",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        description: "Tutores consultam sua disponibilidade e solicitam visitas ou diárias de forma prática.",
        icon: CalendarDays,
      },
      {
        name: "Cobrança Simplificada por Pix",
        tag: "Financeiro",
        tagColor: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Envie cobranças de diárias ou pacotes semanais com link de pagamento instantâneo.",
        icon: CreditCard,
      },
      {
        name: "Canal Direto de Notícias no WhatsApp",
        tag: "Relacionamento",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        description: "Envie fotos, vídeos e relatórios do bem-estar dos pets diretamente aos tutores.",
        icon: Share2,
      },
      {
        name: "Recomendações de Tutores Locais",
        tag: "Confiança",
        tagColor: "bg-sky-100 text-sky-800 border-sky-200",
        description: "Depoimentos de clientes satisfeitos para você conquistar a confiança no seu bairro.",
        icon: ShieldCheck,
      },
    ],
    flowSteps: [
      { step: "1", title: "Tutor consulta seus serviços", desc: "Vê fotos, avaliações de outros tutores e a área onde você atende." },
      { step: "2", title: "Combina o dia e horário da visita", desc: "Solicitação direta com todos os dados do pet para atendimento seguro." },
      { step: "3", title: "Cuidado realizado e pagamento Pix", desc: "Atualizações enviadas pelo WhatsApp e recebimento confirmado na hora." },
    ],
  },
];

function BusinessCategoriesExplorer({ startTo }: { startTo: string }) {
  const [activeCategoryId, setActiveCategoryId] = useState("restaurantes");
  const category =
    BUSINESS_CATEGORIES.find((item) => item.id === activeCategoryId) ?? BUSINESS_CATEGORIES[0];
  const CategoryIcon = category.icon;

  return (
    <section id="segmentos" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce4ca] bg-[#f1f4e9] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[#66794a]">
          <Sparkles size={12} className="text-[#69833b]" />
          Feito para o seu tipo de negócio
        </span>
        <h2 className="mt-4 max-w-[820px] font-display text-[32px] font-medium leading-[1.08] tracking-[-.05em] sm:text-[46px] lg:text-[52px]">
          Escolha seu segmento e descubra as ferramentas sob medida.
        </h2>
        <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[#777970] sm:text-[17px]">
          Cada nicho tem necessidades únicas. Clique abaixo para ver o conjunto completo de
          funcionalidades projetado para a sua rotina:
        </p>
      </div>

      {/* Botões de Seleção dos Tipos de Negócio */}
      <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3" role="tablist">
        {BUSINESS_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`group flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#20221f] text-white shadow-lg shadow-black/10 ring-2 ring-[#20221f]"
                  : "border border-[#e4e4dc] bg-white/70 text-[#686a62] backdrop-blur-sm hover:border-[#cfd2c4] hover:bg-white hover:text-[#20221f]"
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-white/20 text-white" : "bg-[#f1f2eb] text-[#6c725c] group-hover:bg-[#e7e9dd]"
                }`}
              >
                <Icon size={14} />
              </span>
              <span>{cat.shortLabel}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                  isActive ? "bg-white/25 text-white" : "bg-[#eff1ea] text-[#7a816a]"
                }`}
              >
                {cat.tools.length} recursos
              </span>
            </button>
          );
        })}
      </div>

      {/* Painel do Segmento Selecionado */}
      <div className="mt-10 overflow-hidden rounded-[28px] border border-[#e5e5dc] bg-white/75 p-6 shadow-xl shadow-black/[0.03] backdrop-blur-md sm:p-10 lg:p-12">
        {/* Topo do Nicho */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[.1em] ${category.badgeColor}`}
              >
                <CategoryIcon size={13} />
                {category.badge}
              </span>
              <span className="text-[12px] font-medium text-[#8f9188]">
                {category.tools.length} ferramentas exclusivas
              </span>
            </div>

            <h3 className="mt-4 font-display text-[26px] font-medium leading-[1.15] tracking-[-.04em] text-[#20221f] sm:text-[34px] lg:text-[38px]">
              {category.headline}
            </h3>

            <p className="mt-3 text-[15px] font-medium text-[#68803c] sm:text-[16px]">
              {category.tagline}
            </p>

            <p className="mt-3 max-w-[580px] text-[14px] leading-relaxed text-[#777970] sm:text-[15px]">
              {category.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to={startTo}
                className="ello-cta ello-cta-lime min-h-11"
              >
                Começar para {category.shortLabel}
                <ArrowRight size={15} />
              </Link>
              <a
                href="#solucao"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold text-[#666860] hover:text-[#20221f]"
              >
                Ver detalhes da plataforma
                <ChevronRight size={15} />
              </a>
            </div>
          </div>

          {/* Cards de Métricas do Segmento */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {category.highlightMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#e8e8e0] bg-[#fafaf7]/90 p-4 transition-all hover:border-[#d4dbbe] hover:bg-white sm:p-5"
              >
                <div className="font-display text-[24px] font-bold tracking-tight text-[#252820] sm:text-[30px]">
                  {metric.value}
                </div>
                <div className="mt-1 text-[12px] leading-snug font-medium text-[#73756d]">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade de Ferramentas e Funcionalidades */}
        <div className="mt-12 border-t border-[#ebebe3] pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#8e9086]">
                Painel & Ferramentas
              </span>
              <h4 className="mt-1 font-display text-[22px] font-medium tracking-[-.03em] text-[#20221f] sm:text-[26px]">
                O que você recebe no Studio para {category.shortLabel}:
              </h4>
            </div>
            <span className="text-[12px] font-semibold text-[#657945]">
              Tudo incluso na mesma assinatura
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.tools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#ebebe4] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ccd6b4] hover:shadow-md hover:shadow-black/[0.04]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-[#f2f4ec] text-[#556934] transition-colors group-hover:bg-[#e4ebce]">
                        <ToolIcon size={17} />
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tool.tagColor}`}
                      >
                        {tool.tag}
                      </span>
                    </div>
                    <h5 className="mt-3.5 text-[15px] font-semibold tracking-[-.02em] text-[#22241f]">
                      {tool.name}
                    </h5>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#70726a]">
                      {tool.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Como Funciona no Dia a Dia */}
        <div className="mt-12 rounded-2xl border border-[#e8ebe0] bg-[#f7f8f3] p-6 sm:p-8">
          <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#78885a]">
            Fluxo Operacional
          </div>
          <h4 className="mt-1 font-display text-[20px] font-medium tracking-[-.02em] text-[#20221f] sm:text-[23px]">
            Como funciona a rotina no seu negócio:
          </h4>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {category.flowSteps.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-3 rounded-xl bg-white/80 p-4 shadow-sm"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#20221f] text-[12px] font-bold text-white">
                  {step.step}
                </span>
                <div>
                  <h6 className="text-[14px] font-semibold tracking-tight text-[#20221f]">
                    {step.title}
                  </h6>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#73756d]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé do Bloco de Segmento com CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e4e7db] bg-gradient-to-r from-[#20221f] to-[#2c2f28] px-6 py-6 text-white sm:flex-row sm:px-8">
          <div>
            <h5 className="text-[17px] font-semibold tracking-tight">
              Pronto para colocar seu {category.shortLabel.toLowerCase()} no ar?
            </h5>
            <p className="mt-0.5 text-[12px] text-white/70">
              Sem fidelidade · Sem taxa sobre vendas · Cancele quando quiser
            </p>
          </div>
          <Link
            to={startTo}
            className="ello-cta ello-cta-lime shrink-0"
          >
            Criar meu espaço agora
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

