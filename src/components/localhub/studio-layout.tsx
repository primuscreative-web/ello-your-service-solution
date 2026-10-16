import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Bike,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings2,
  LogOut,
  ClipboardList,
  BarChart3,
  Calculator,
  UsersRound,
  HeartHandshake,
  WalletCards,
  Utensils,
  Copy,
  Check,
  Store,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBusinessCopy } from "@/lib/localhub-business";
import { StudioOnboardingTour } from "@/components/localhub/studio-onboarding-tour";
import { ElloLogo } from "@/components/ello/logo";

export function StudioLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { business, user, isStaffAccount } = useLocalHub();
  const businessCopy = getBusinessCopy(business?.category);
  const isFoodBusiness = business?.category === "alimentacao";
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);

  const navigationGroups = [
    {
      title: "OPERAÇÃO",
      items: [
        { to: "/studio", label: "Visão geral", icon: LayoutDashboard, exact: true, id: "tour-nav-overview" },
        {
          to: isFoodBusiness ? "/studio/pedidos" : "/studio/agenda",
          label: isFoodBusiness ? "Pedidos" : "Agendamentos",
          icon: isFoodBusiness ? ClipboardList : CalendarDays,
          id: "tour-nav-operations",
        },
        {
          to: "/studio/caixa" as const,
          label: "Frente de caixa / PDV",
          icon: WalletCards,
          id: "tour-nav-caixa",
        },
        ...(isFoodBusiness ? [{ to: "/studio/mesas" as const, label: "Mesas & Salão", icon: Utensils }] : []),
        ...(isFoodBusiness ? [{ to: "/studio/entregas" as const, label: "Motoboys & Entregas", icon: Bike }] : []),
      ],
    },
    {
      title: "GESTÃO",
      items: [
        { to: "/studio/catalog", label: businessCopy.offerTitle, icon: Package, id: "tour-nav-catalog" },
        {
          to: "/studio/portfolio" as const,
          label: "Portfólio & Trabalhos",
          icon: ImagePlus,
          id: "tour-nav-portfolio",
        },
        {
          to: "/studio/crm" as const,
          label: isFoodBusiness ? "Clientes & Promoções" : "Clientes & Fichas",
          icon: HeartHandshake,
          id: "tour-nav-crm",
        },
        ...(!isFoodBusiness
          ? [
              {
                to: "/studio/profissionais" as const,
                label: "Profissionais",
                icon: UsersRound,
              },
            ]
          : []),
      ],
    },
    {
      title: "FINANÇAS & RESULTADOS",
      items: [
        { to: "/studio/metricas" as const, label: "Métricas & Vendas", icon: BarChart3 },
        { to: "/studio/precificacao" as const, label: "Custos & Precificação", icon: Calculator },
        { to: "/studio/financeiro" as const, label: "Financeiro & Carteira", icon: WalletCards, id: "tour-nav-financeiro" },
      ],
    },
    {
      title: "CONFIGURAÇÕES",
      items: [
        { to: "/studio/settings", label: "Minha Página & WhatsApp", icon: Settings2, id: "tour-nav-settings" },
      ],
    },
  ];

  const staffItems = [{ to: "/studio/agenda" as const, label: "Minha agenda", icon: CalendarDays }];

  useEffect(() => {
    if (isStaffAccount && pathname !== "/studio/agenda") {
      void navigate({ to: "/studio/agenda", replace: true });
    }
  }, [isStaffAccount, navigate, pathname]);

  const handleCopyPublicUrl = async () => {
    if (!business?.slug) return;
    try {
      const url = `${window.location.origin}/loja/${business.slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Link público copiado para a área de transferência!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  if (isStaffAccount && pathname !== "/studio/agenda") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#707466]">
        Abrindo sua agenda…
      </div>
    );
  }

  // Identifica o título da página atual para o breadcrumb do header
  let currentPageTitle = "Visão geral";
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)) {
        currentPageTitle = item.label;
      }
    }
  }

  return (
    <div className="ello-studio min-h-screen bg-[#f5f4ed] text-[#171914] antialiased">
      {/* Mini Tutorial Guiado Interativo com luz de foco */}
      <StudioOnboardingTour />

      {/* SIDEBAR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] flex-col border-r border-[#262820] bg-[#151712] text-[#f7f6ef] lg:flex shadow-2xl">
        {/* TOPO: LOGO DA MARCA & BADGE STUDIO */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <ElloLogo tone="white" height={22} />
            <span className="rounded-md border border-[#d4f455]/30 bg-[#d4f455]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#d4f455]">
              STUDIO
            </span>
          </Link>
        </div>

        {/* CARTÃO DE IDENTIDADE DO ESTABELECIMENTO */}
        {business && (
          <div className="border-b border-white/[0.07] px-5 py-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5 border border-white/[0.06]">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#768452] to-[#4e5834] text-sm font-black text-white shadow-xs">
                {business.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-xs font-black text-white">{business.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9a9d90]">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate">Loja Online Ativa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO CATEGORIZADA */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {isStaffAccount ? (
            <nav className="space-y-1">
              {staffItems.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                      active
                        ? "bg-[#d4f455] text-[#151712] shadow-xs"
                        : "text-[#c2c5b8] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          ) : (
            navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#717565]">
                  {group.title}
                </div>
                {group.items.map(({ to, label, icon: Icon, id, ...options }) => {
                  const active =
                    "exact" in options && options.exact
                      ? pathname === to
                      : pathname === to || pathname.startsWith(`${to}/`);
                  return (
                    <Link
                      key={to}
                      id={id}
                      to={to}
                      className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
                        active
                          ? "bg-[#d4f455] text-[#151712] shadow-[0_2px_10px_-2px_rgba(212,244,85,0.4)]"
                          : "text-[#d2d5c8] font-semibold hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.5 : 2}
                        className={`shrink-0 transition-transform group-hover:scale-105 ${
                          active ? "text-[#151712]" : "text-[#969a8b] group-hover:text-white"
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* CARD INFERIOR: PRÉVIA DA LOJA & ATALHO */}
        {business && (
          <div className="border-t border-white/[0.07] p-4 bg-[#11130e]">
            <div
              id="tour-preview-card"
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#f2f1e8]">Cardápio Digital</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" /> Ao vivo
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyPublicUrl()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] py-2 text-[11px] font-bold text-[#f2f1e8] hover:bg-white/[0.1]"
                  title="Copiar link da página"
                >
                  {copiedLink ? <Check size={12} className="text-[#d4f455]" /> : <Copy size={12} />}
                  <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                </button>
                <Link
                  to="/loja/$slug"
                  params={{ slug: business.slug }}
                  target="_blank"
                  className="grid size-8 place-items-center rounded-lg bg-[#d4f455] text-[#151712] font-black transition hover:bg-[#dff96b]"
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ÁREA PRINCIPAL COM HEADER FLUTUANTE */}
      <div className="lg:pl-[268px]">
        {/* HEADER DO STUDIO */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e2e0d5] bg-[#fbfaf7]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <ElloLogo tone="dark" height={22} />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#707466]">
              <span className="font-extrabold text-[#171914]">{business?.name || "Meu Negócio"}</span>
              <span>/</span>
              <span className="font-bold text-[#4c5042]">{currentPageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {business && (
              <>
                <button
                  type="button"
                  onClick={() => void handleCopyPublicUrl()}
                  className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#d8d6cb] bg-white px-3 py-1.5 text-xs font-bold text-[#44473d] shadow-2xs hover:bg-[#f6f5ee]"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedLink ? "Link copiado" : "Copiar link"}</span>
                </button>
                <Link
                  to="/loja/$slug"
                  params={{ slug: business.slug }}
                  target="_blank"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#171914] px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition hover:bg-[#2b2e25]"
                >
                  <Store size={14} className="text-[#d4f455]" />
                  <span>Ver Loja</span>
                  <ExternalLink size={11} className="opacity-70" />
                </Link>
              </>
            )}

            <div className="h-5 w-px bg-[#e2e0d5] mx-1" />

            {/* AVATAR DO USUÁRIO & SAIR */}
            <div className="flex items-center gap-2">
              <span className="grid size-8.5 place-items-center rounded-xl bg-[#e8ebdf] text-xs font-black text-[#586341] border border-[#d6dacb]">
                {business?.name?.slice(0, 1).toUpperCase() ?? "E"}
              </span>
              <button
                type="button"
                aria-label="Sair da conta"
                title="Sair da conta"
                className="grid size-9 cursor-pointer place-items-center rounded-xl text-[#727568] transition hover:bg-[#edece4] hover:text-[#171914]"
                onClick={() =>
                  void getSupabaseBrowserClient()
                    ?.auth.signOut()
                    .then(() => navigate({ to: "/auth" }))
                }
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* NAVEGAÇÃO MOBILE EM ABAS */}
        <nav
          aria-label="Navegação móvel do painel"
          className="flex gap-1.5 overflow-x-auto border-b border-[#2b2e25] bg-[#171914] px-3 py-2 lg:hidden scrollbar-none"
        >
          {navigationGroups
            .flatMap((g) => g.items)
            .map(({ to, label, icon: Icon, id, ...options }) => {
              const active =
                "exact" in options && options.exact
                  ? pathname === to
                  : pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  id={id ? `${id}-mobile` : undefined}
                  to={to}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active ? "bg-[#d4f455] text-[#151712]" : "text-[#c2c5b8] hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </Link>
              );
            })}
        </nav>

        {/* CONTEÚDO CENTRAL */}
        <main className="mx-auto max-w-[1400px] p-4 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
