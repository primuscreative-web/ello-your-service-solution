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
    }, 2000);

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
