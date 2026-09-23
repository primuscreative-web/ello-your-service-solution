import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
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
          <div className="relative z-10">
            <h1 className="max-w-2xl font-display text-[44px] font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[68px]">
              Um link para mostrar <span className="text-[#4f46e5]">o que você faz.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Reúna seus serviços, formas de contato e agendamentos numa página simples de
              compartilhar com seus clientes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className={primaryButtonClass}>
                {business ? "Continuar no painel" : "Criar minha página"}
                <ArrowRight size={17} />
              </Link>
              <a href="#como-funciona" className={secondaryButtonClass}>
                <Play size={15} /> Ver como funciona
              </a>
            </div>
          </div>
          <div className="relative z-10 mx-auto w-full max-w-[610px]">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_22px_70px_-42px_rgba(30,41,59,.38)]">
              <DashboardPreview />
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <div className="text-sm font-bold">Seu negócio, num só lugar</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Serviços, página pública e pedidos de horário.
                  </div>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                  <LayoutDashboard size={19} />
                </span>
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

function DashboardPreview() {
  return (
    <div
      role="img"
      aria-label="Prévia nítida do painel LocalHub com resumo de serviços e agendamentos"
      className="aspect-[1.22] bg-[#f6f7fb] p-3 sm:p-5"
    >
      <div className="flex h-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <aside className="hidden w-[150px] shrink-0 border-r border-slate-100 bg-white p-3 sm:block">
          <div className="mb-7 flex items-center gap-2 px-1">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">
              <Store size={14} />
            </span>
            <span className="text-xs font-extrabold tracking-tight text-slate-800">
              Local<span className="text-indigo-600">Hub</span>
            </span>
          </div>
          <div className="space-y-1 text-[10px] font-semibold">
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-2 py-2 text-indigo-700">
              <LayoutDashboard size={13} /> Visão geral
            </div>
            <div className="flex items-center gap-2 px-2 py-2 text-slate-500">
              <Package size={13} /> Catálogo
            </div>
            <div className="flex items-center gap-2 px-2 py-2 text-slate-500">
              <CalendarDays size={13} /> Agendamentos
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1 p-3 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-medium text-slate-400">Painel do negócio</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
              Página publicada
            </span>
          </div>
          <div className="pt-4">
            <h2 className="text-sm font-bold text-slate-800 sm:text-base">Visão geral</h2>
            <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
              Um resumo do que acontece no seu negócio.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            <PreviewStat icon={<CalendarDays size={13} />} label="Agendamentos hoje" value="—" />
            <PreviewStat icon={<Package size={13} />} label="Serviços ativos" value="—" />
          </div>
          <div className="mt-3 rounded-lg border border-slate-100 p-3 sm:mt-4 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-800 sm:text-xs">
                  Próximos agendamentos
                </h3>
                <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
                  Os pedidos dos clientes aparecem aqui.
                </p>
              </div>
              <Clock3 size={14} className="text-indigo-500" />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                Agenda pronta para receber pedidos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-2.5 sm:p-3">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[9px] sm:text-[10px]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-base font-bold text-slate-800 sm:text-lg">{value}</div>
    </div>
  );
}
