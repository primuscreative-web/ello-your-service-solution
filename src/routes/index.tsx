import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  Scissors,
  Star,
  Store,
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/")({ component: LandingPage });

const SCROLL_VIDEO_URL = "/videos/ello-scroll-background.mp4";

function LandingPage() {
  const { business } = useLocalHub();
  const startTo = business ? "/studio" : "/onboarding";

  useEffect(() => {
    const site = document.querySelector<HTMLElement>(".ello-site");
    if (!site || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timeout: number | undefined;
    const handleScroll = () => {
      site.dataset.scrolling = "true";
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        delete site.dataset.scrolling;
      }, 220);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(timeout);
      delete site.dataset.scrolling;
    };
  }, []);

  return (
    <div className="ello-site min-h-screen overflow-hidden text-[#20221f]">
      <ScrollVideoBackground />
      <header className="ello-nav mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-10 lg:px-16">
        <Link to="/" aria-label="ELLO, início" className="ello-wordmark flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[21px] font-semibold tracking-[-.06em]">ello</span>
        </Link>
        <nav className="hidden items-center gap-9 text-[13px] font-medium text-[#64665f] md:flex">
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
            className="hidden px-3 py-2 text-[13px] font-medium text-[#454740] transition-colors hover:text-black sm:inline-flex"
          >
            {business ? "Acessar painel" : "Já tenho conta"}
          </Link>
          <Link to={startTo} className="ello-cta ello-cta-dark">
            {business ? "Meu espaço" : "Criar meu espaço"}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="ello-hero relative isolate mx-auto grid max-w-[1440px] items-center gap-12 overflow-hidden px-5 pb-20 pt-12 sm:px-10 sm:pb-28 sm:pt-16 min-[1180px]:grid-cols-[.92fr_1.08fr] min-[1180px]:gap-12 lg:gap-16 lg:px-16 lg:pb-32 lg:pt-20">
          <AmbientArtwork />
          <div className="relative z-10 max-w-[590px]">
            <div className="ello-kicker">
              <span className="size-1.5 rounded-full bg-[#b6d26b]" />
              Página, contato e agenda em um link
            </div>
            <h1 className="mt-7 font-display text-[50px] font-medium leading-[.99] tracking-[-.065em] sm:text-[68px] lg:text-[76px]">
              Mostre o que você faz.
              <br />
              <span className="ello-heading-accent">Facilite o contato.</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[15px] leading-[1.65] text-[#696b64] sm:text-[18px] sm:leading-[1.75]">
              Reúna serviços, preços e contato em uma página fácil de compartilhar. Receba pedidos
              de horário e acompanhe tudo no painel da ELLO.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={startTo} className="ello-cta ello-cta-lime">
                {business ? "Abrir meu espaço" : "Monte sua página grátis"}
                <ArrowRight size={16} />
              </Link>
              <a href="#passos" className="ello-cta ello-cta-quiet">
                Ver como funciona
                <ArrowDownRight size={15} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-2 text-[12px] text-[#777970]">
              <Check size={14} className="text-[#69833b]" />
              Sem cartão de crédito <span className="mx-1 text-[#c7c8c0]">·</span>
              <Check size={14} className="text-[#69833b]" />
              Pronta em poucos minutos
            </div>
          </div>

          <div className="ello-showcase relative mx-auto w-full max-w-[680px]">
            <div className="ello-showcase-backdrop" aria-hidden="true" />
            <div className="ello-store-card">
              <div className="ello-store-cover">
                <div className="ello-cover-orb" />
                <span className="ello-cover-label">FEITO COM CUIDADO</span>
                <div className="ello-cover-caption">
                  Seu próximo
                  <br />
                  bom encontro.
                </div>
              </div>
              <div className="ello-store-content">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="ello-avatar">
                      <Scissors size={18} />
                    </span>
                    <div>
                      <div className="text-[15px] font-semibold tracking-[-.03em]">
                        Ateliê Aurora
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-[#85877e]">
                        <MapPin size={11} /> Pinheiros, São Paulo
                      </div>
                    </div>
                  </div>
                  <span className="ello-rating">
                    <Star size={12} fill="currentColor" /> 4,9
                  </span>
                </div>
                <p className="mt-4 max-w-[400px] text-[12px] leading-5 text-[#777970]">
                  Cuidado e beleza em cada detalhe. Encontre seu próximo horário.
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[#eeeee8] pt-4">
                  <span className="text-[11px] font-medium text-[#686a62]">
                    Serviços em destaque
                  </span>
                  <span className="text-[10px] text-[#92948b]">
                    Ver todos <ArrowRight className="ml-1 inline" size={11} />
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="ello-service">
                    <span>Corte & finalização</span>
                    <b>R$ 95</b>
                  </div>
                  <div className="ello-service">
                    <span>Coloração</span>
                    <b>R$ 180</b>
                  </div>
                </div>
                <button className="ello-booking">
                  <CalendarDays size={14} /> Escolher um horário
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="ello-floating-note">
              <span className="ello-note-icon">
                <CalendarDays size={16} />
              </span>
              <span>
                <b>Novo pedido recebido</b>
                <small>Hoje, às 14:30</small>
              </span>
              <span className="ello-note-dot" />
            </div>
            <div className="ello-share-note">
              <span className="ello-share-icon">
                <MessageCircle size={17} />
              </span>
              <span>Seu link, em todo lugar</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        </section>

        <section className="ello-proof border-y border-[#e6e5dd] px-5 py-7 sm:px-10 lg:px-16">
          <div className="ello-proof-card mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 sm:flex-row">
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#92948b]">
              Tudo que seu negócio precisa, em um só lugar
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[12px] font-medium text-[#64665f]">
              <span className="flex items-center gap-2">
                <Store size={15} className="text-[#89975f]" />
                Página profissional
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays size={15} className="text-[#89975f]" />
                Agenda organizada
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle size={15} className="text-[#89975f]" />
                Contato fácil
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
                Mais tempo para fazer o que você faz melhor.
              </h2>
            </div>
            <p className="max-w-[460px] pb-1 text-[15px] leading-7 text-[#777970] md:justify-self-end">
              A ELLO simplifica a rotina do seu negócio local. Seus clientes conhecem seu trabalho e
              pedem um horário; você acompanha tudo em um só painel.
            </p>
          </div>
          <div className="ello-feature-grid mt-12 grid gap-3 md:grid-cols-3">
            <FeatureCard
              number="01"
              icon={<Store size={18} />}
              title="Uma página com a sua cara"
              text="Mostre seus serviços, preços, localização e contato em um endereço fácil de compartilhar."
            />
            <FeatureCard
              number="02"
              icon={<CalendarDays size={18} />}
              title="Agenda sem desencontro"
              text="Receba pedidos de horário e acompanhe as confirmações sem perder mensagens."
            />
            <FeatureCard
              number="03"
              icon={<Clock3 size={18} />}
              title="Tudo organizado, sempre"
              text="Atualize suas informações quando quiser e tenha o controle do seu espaço na mão."
            />
          </div>
        </section>

        <section
          id="passos"
          className="ello-steps-wrap relative isolate overflow-hidden px-5 py-20 sm:px-10 sm:py-28 lg:px-16"
        >
          <AmbientArtwork />
          <div className="relative z-10 mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-20">
            <div>
              <div className="ello-section-index">02 / Sem complicação</div>
              <h2 className="mt-5 max-w-[400px] font-display text-[38px] font-medium leading-[1.04] tracking-[-.055em] sm:text-[50px]">
                Do seu jeito. No seu tempo.
              </h2>
              <p className="mt-5 max-w-[390px] text-[15px] leading-7 text-[#777970]">
                Sem configuração complicada ou ferramentas demais. Você cria seu espaço e já pode
                começar a compartilhar.
              </p>
              <Link to={startTo} className="ello-cta ello-cta-dark mt-7">
                Começar agora
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="ello-steps-list">
              <Step
                number="01"
                title="Conte sobre seu negócio"
                text="Adicione o nome, uma descrição e as formas de contato."
              />
              <Step
                number="02"
                title="Apresente seus serviços"
                text="Organize o que você oferece e informe os preços."
              />
              <Step
                number="03"
                title="Compartilhe seu link"
                text="Envie sua página para clientes e receba pedidos de horário."
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
        <span>Uma presença digital simples para negócios locais.</span>
        <span>© {new Date().getFullYear()} ELLO</span>
      </footer>
    </div>
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
    let animationFrame = 0;
    let lastScrollTime = 0;

    const startLoop = () => {
      if (reducedMotion.matches) return;
      video.playbackRate = basePlaybackRate;
      void video.play().catch(() => {});
    };

    const handleScroll = () => {
      const now = performance.now();
      const elapsed = Math.max((now - previousScrollTime) / 1000, 0.016);
      const distance = Math.abs(window.scrollY - previousScrollY);
      const scrollVelocity = distance / elapsed;
      targetPlaybackRate = Math.min(maxPlaybackRate, basePlaybackRate + scrollVelocity / 900);
      previousScrollY = window.scrollY;
      previousScrollTime = now;
      lastScrollTime = now;
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updatePlaybackRate);
    };

    const updatePlaybackRate = (timestamp: number) => {
      animationFrame = 0;
      if (reducedMotion.matches || video.paused) return;
      if (timestamp - lastScrollTime > 180) targetPlaybackRate = basePlaybackRate;
      const difference = targetPlaybackRate - video.playbackRate;
      video.playbackRate += difference * 0.14;
      if (Math.abs(difference) > 0.015 || targetPlaybackRate !== basePlaybackRate) {
        animationFrame = window.requestAnimationFrame(updatePlaybackRate);
      }
    };

    const markVideoReady = () => {
      document
        .querySelector<HTMLElement>(".ello-site")
        ?.setAttribute("data-scroll-video-ready", "true");
      startLoop();
    };

    const markVideoUnavailable = () => {
      document.querySelector<HTMLElement>(".ello-site")?.removeAttribute("data-scroll-video-ready");
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) markVideoReady();
    video.addEventListener("loadedmetadata", markVideoReady);
    video.addEventListener("error", markVideoUnavailable);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", markVideoReady);
      video.removeEventListener("error", markVideoUnavailable);
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(animationFrame);
      document.querySelector<HTMLElement>(".ello-site")?.removeAttribute("data-scroll-video-ready");
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
        {/* Troque este caminho pela URL do seu vídeo ou adicione o MP4 em public/videos/. */}
        <source src={SCROLL_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="ello-scroll-video-overlay" aria-hidden="true" />
    </>,
    portalTarget,
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

function AmbientArtwork() {
  return (
    <div className="ello-ambient-art" aria-hidden="true">
      <svg viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice">
        <g className="ello-ambient-motion">
          <path d="M-100 510C115 235 321 720 531 420S912 98 1300 330" />
          <path d="M-120 558C88 286 330 752 558 462S935 146 1306 375" />
          <path d="M-115 605C96 342 347 786 583 504S961 197 1300 420" />
          <circle cx="930" cy="170" r="172" />
          <circle cx="930" cy="170" r="207" />
        </g>
        <g className="ello-ambient-motion ello-ambient-motion-slow">
          <path d="M-40 120C208 335 370-35 620 180s388 240 652 28" />
          <path d="M-35 162C218 375 390 10 642 222s382 237 645 41" />
        </g>
      </svg>
    </div>
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
