import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Globe2,
  LayoutDashboard,
  MessageCircle,
  Package,
  Play,
  Sparkles,
  Store,
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";
import { primaryButtonClass, secondaryButtonClass } from "@/components/localhub/ui";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const { business } = useLocalHub();
  const startTo = business ? "/studio" : "/onboarding";

  return (
    <div className="min-h-screen overflow-hidden bg-[#faf8ff] text-[#131b2e]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#4f46e5] text-white">
            <Store size={20} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Local<span className="text-[#4f46e5]">Hub</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a href="#como-funciona" className="hover:text-indigo-700">
            Como funciona
          </a>
          <a href="#recursos" className="hover:text-indigo-700">
            Recursos
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to={startTo}
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white sm:inline-flex"
          >
            {business ? "Abrir painel" : "Começar"}
          </Link>
          <Link to={startTo} className={primaryButtonClass}>
            {business ? "Meu painel" : "Criar minha página"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-8 lg:pb-28">
          <div className="absolute -left-48 top-0 -z-0 size-[520px] rounded-full bg-indigo-200/30 blur-[130px]" />
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm">
              <Sparkles size={14} /> SUA PRESENÇA DIGITAL, SEM COMPLICAÇÃO
            </div>
            <h1 className="max-w-2xl font-display text-[44px] font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[68px]">
              Seu negócio inteiro em <span className="text-[#4f46e5]">um único link.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Mostre seus serviços, receba agendamentos e mantenha tudo organizado em uma página
              criada para o seu negócio local.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className={primaryButtonClass}>
                {business ? "Continuar no painel" : "Criar página grátis"}
                <ArrowRight size={17} />
              </Link>
              <a href="#como-funciona" className={secondaryButtonClass}>
                <Play size={15} /> Conhecer a plataforma
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-emerald-600" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-emerald-600" /> Comece em poucos minutos
              </span>
            </div>
          </div>
          <div className="relative z-10 mx-auto w-full max-w-[610px]">
            <div className="absolute -right-8 -top-8 size-36 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="overflow-hidden rounded-[28px] border border-white bg-white p-2 shadow-[0_28px_80px_-24px_rgba(61,65,130,.28)] sm:rotate-[1deg]">
              <img
                src="/localhub/omnilink_dashboard_do_lojista/screen.png"
                alt="Prévia do painel de gestão LocalHub"
                className="aspect-[1.22] w-full rounded-[21px] object-cover object-top"
              />
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <div className="text-sm font-bold">Um painel para o dia a dia</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Agenda, página e serviços no mesmo lugar.
                  </div>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                  <LayoutDashboard size={19} />
                </span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:-left-8">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarDays size={19} />
              </span>
              <div>
                <div className="text-xs font-bold">Novo agendamento</div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Seu próximo cliente está chegando
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="border-y border-indigo-100/70 bg-white/70 px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
                Tudo conectado
              </div>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Uma presença digital que trabalha por você
              </h2>
              <p className="mt-4 leading-7 text-slate-500">
                Compartilhe seu link. Seus clientes encontram o que precisam e você acompanha tudo
                no painel.
              </p>
            </div>
            <div id="recursos" className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Globe2,
                  title: "Sua página pública",
                  text: "Apresente seu negócio com seus serviços, localização e formas de contato.",
                },
                {
                  icon: Package,
                  title: "Catálogo organizado",
                  text: "Cadastre serviços, preços e duração. Atualize sua oferta quando quiser.",
                },
                {
                  icon: CalendarDays,
                  title: "Agendamentos simples",
                  text: "Receba pedidos de horário e confirme cada atendimento pelo painel.",
                },
                {
                  icon: MessageCircle,
                  title: "Contato direto",
                  text: "Deixe o WhatsApp acessível para dúvidas e conversas com clientes.",
                },
                {
                  icon: LayoutDashboard,
                  title: "Painel prático",
                  text: "Acompanhe a agenda e mantenha as informações do negócio atualizadas.",
                },
                {
                  icon: Sparkles,
                  title: "Feito para negócios locais",
                  text: "Barbearias, salões, restaurantes e profissionais independentes.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_18px_-12px_rgba(15,23,42,.2)]"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="px-5 py-16 sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center rounded-[28px] bg-[#24205f] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-emerald-300">
              <Store size={22} />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Seu próximo cliente pode chegar pelo link.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80">
              Configure sua página e comece a receber pedidos de agendamento.
            </p>
            <Link
              to={startTo}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 transition hover:bg-indigo-50"
            >
              {business ? "Ir para o painel" : "Começar agora"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-400">
        LocalHub · A presença digital do seu negócio local
      </footer>
    </div>
  );
}
