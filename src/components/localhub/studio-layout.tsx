import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Bike,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings2,
  MessageCircle,
  LogOut,
  ClipboardList,
  BarChart3,
  Calculator,
  UsersRound,
  HeartHandshake,
  WalletCards,
  Utensils,
  Tag,
  Copy,
  Check,
  Store,
  Sparkles,
  ImagePlus,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBusinessCopy } from "@/lib/localhub-business";
import { StudioOnboardingTour } from "@/components/localhub/studio-onboarding-tour";
import { ElloLogo } from "@/components/ello/logo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type StudioNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  id?: string;
};

type StudioNavGroup = { title: string; items: StudioNavItem[] };

export function StudioLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { business, user, isStaffAccount } = useLocalHub();
  const businessCopy = getBusinessCopy(business?.category);
  const isFoodBusiness = business?.category === "alimentacao";
  const navigate = useNavigate();
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationGroups: StudioNavGroup[] = [
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
      items: isFoodBusiness
        ? [
            { to: "/studio/catalog" as const, label: "Cardápio", icon: Package, id: "tour-nav-catalog" },
            {
              to: "/studio/crm" as const,
              label: "Cupons & Promoções",
              icon: Tag,
              id: "tour-nav-coupons",
            },
          ] satisfies StudioNavItem[]
        : [
            { to: "/studio/catalog" as const, label: businessCopy.offerTitle, icon: Package, id: "tour-nav-catalog" },
            { to: "/studio/portfolio" as const, label: "Portfólio & Trabalhos", icon: ImagePlus, id: "tour-nav-portfolio" },
            { to: "/studio/crm" as const, label: "Clientes & Fichas", icon: HeartHandshake, id: "tour-nav-crm" },
            { to: "/studio/profissionais" as const, label: "Profissionais", icon: UsersRound },
          ] satisfies StudioNavItem[],
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
        { to: "/studio/settings", label: "Minha Página", icon: Settings2, id: "tour-nav-settings" },
        { to: "/studio/whatsapp", label: "WhatsApp", icon: MessageCircle, id: "tour-nav-whatsapp" },
        { to: "/planos", label: "Planos & Assinatura", icon: Sparkles, id: "tour-nav-planos" },
      ],
    },
  ];

  const staffItems: StudioNavItem[] = [{ to: "/studio/agenda", label: "Minha agenda", icon: CalendarDays }];
  const operationItem = navigationGroups[0].items.find((item) => item.id === "tour-nav-operations")!;
  const catalogItem = navigationGroups[1].items[0];
  const mobileNavigationItems = isStaffAccount
    ? staffItems.map((item) => ({ ...item, label: "Agenda" }))
    : [
        { ...navigationGroups[0].items[0], label: "Início" },
        { ...operationItem, label: isFoodBusiness ? "Pedidos" : "Agenda" },
        { ...catalogItem, label: isFoodBusiness ? "Cardápio" : "Serviços" },
      ];
  const activeMobileDestination = mobileNavigationItems.some((item) =>
    item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );

  useEffect(() => {
    if (isStaffAccount && pathname !== "/studio/agenda") {
      void navigate({ to: "/studio/agenda", replace: true });
    }
  }, [isStaffAccount, navigate, pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    <div className="ello-studio min-h-screen min-w-0 bg-[#f5f4ed] text-[#171914] antialiased">
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
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="truncate text-xs font-black text-white">{business.name}</h3>
                  <Link
                    to="/planos"
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition bg-[#d4f455]/15 text-[#d4f455] hover:bg-[#d4f455]/25 border border-[#d4f455]/30"
                  >
                    {business.onboardingDetails?.plan === "pro"
                      ? "⚡ PRO"
                      : business.onboardingDetails?.plan === "business"
                      ? "🏢 BUSINESS"
                      : "GRÁTIS"}
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9a9d90] mt-0.5">
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
      <div className="min-w-0 lg:pl-[268px]">
        {/* HEADER DO STUDIO */}
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b border-[#e2e0d5] bg-[#fbfaf7]/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-2xl sm:min-h-16 sm:px-8">
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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3.5">
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
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-xl bg-[#171914] px-2.5 py-1.5 text-[11px] font-black text-white shadow-xs transition hover:bg-[#2b2e25] sm:gap-1.5 sm:px-3.5 sm:text-xs"
                >
                  <Store size={14} className="text-[#d4f455]" />
                  <span>Ver Loja</span>
                  <ExternalLink size={11} className="opacity-70" />
                </Link>
              </>
            )}

            <div className="h-5 w-px bg-[#e2e0d5] mx-1" />

            {/* AVATAR DO USUÁRIO & SAIR */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="grid size-8 place-items-center rounded-xl border border-[#d6dacb] bg-[#e8ebdf] text-xs font-black text-[#586341] sm:size-8.5">
                {business?.name?.slice(0, 1).toUpperCase() ?? "E"}
              </span>
              <button
                type="button"
                aria-label="Sair da conta"
                title="Sair da conta"
                className="hidden size-9 cursor-pointer place-items-center rounded-xl text-[#727568] transition hover:bg-[#edece4] hover:text-[#171914] lg:grid"
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

        {/* CONTEÚDO CENTRAL */}
        <main className="mx-auto min-w-0 max-w-[1400px] p-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:p-7 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:p-9">
          <Outlet />
        </main>
      </div>

      {/* DOCK PRINCIPAL MOBILE */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      >
        <div className="mx-auto flex max-w-xl items-stretch gap-1 rounded-[24px] border border-white/70 bg-[#fbfaf7]/85 p-1.5 shadow-[0_-8px_32px_rgba(24,26,20,0.12),0_4px_20px_rgba(24,26,20,0.08)] backdrop-blur-2xl">
          {mobileNavigationItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[10px] font-semibold leading-tight transition-colors active:scale-[0.97] ${
                  active ? "bg-[#e8ebdf] text-[#303728]" : "text-[#74786c] hover:text-[#25271f]"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            );
          })}

          {!isStaffAccount && (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className={`flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[10px] font-semibold leading-tight transition-colors active:scale-[0.97] ${
                activeMobileDestination ? "text-[#74786c] hover:text-[#25271f]" : "bg-[#e8ebdf] text-[#303728]"
              }`}
            >
              <MoreHorizontal size={19} strokeWidth={1.8} />
              <span>Mais</span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-[#dedfd6] bg-[#fbfaf7] p-0 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(20,24,15,0.22)] ease-out data-[state=open]:duration-300 data-[state=closed]:duration-200 lg:hidden"
        >
          <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-[#c8cbbd]" />
          <SheetHeader className="px-5 pb-4 pt-5 text-left">
            <SheetTitle className="text-xl font-bold tracking-tight text-[#20221b]">
              {business?.name || "Menu do Studio"}
            </SheetTitle>
            <SheetDescription className="text-sm text-[#74786c]">
              Acesse qualquer área do seu negócio.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-4">
            {(isStaffAccount ? [{ title: "OPERAÇÃO", items: staffItems }] : navigationGroups).map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h2 className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#848879]">
                  {group.title}
                </h2>
                <div className="overflow-hidden rounded-2xl border border-[#e7e6de] bg-white">
                  {group.items.map(({ to, label, icon: Icon, id, exact }, index) => {
                    const active = exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
                    return (
                      <SheetClose asChild key={to}>
                        <Link
                          id={id ? `${id}-mobile-sheet` : undefined}
                          to={to}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-12 items-center gap-3 px-3.5 py-2.5 text-sm font-medium active:bg-[#f1f2eb] ${
                            index ? "border-t border-[#efeee8]" : ""
                          } ${active ? "bg-[#f4f5ee] text-[#303728]" : "text-[#383a32]"}`}
                        >
                          <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${active ? "bg-[#e2e8d4] text-[#4f5c37]" : "bg-[#f4f3ed] text-[#75796c]"}`}>
                            <Icon size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{label}</span>
                          {active && <span className="size-1.5 rounded-full bg-[#768452]" />}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </section>
            ))}

            {business && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyPublicUrl()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#e5e4dc] bg-white px-3 text-xs font-semibold text-[#45483e] active:scale-[0.98]"
                >
                  {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                  {copiedLink ? "Link copiado" : "Copiar link"}
                </button>
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() =>
                      void getSupabaseBrowserClient()
                        ?.auth.signOut()
                        .then(() => navigate({ to: "/auth" }))
                    }
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#e5e4dc] bg-white px-3 text-xs font-semibold text-[#8a3f37] active:scale-[0.98]"
                  >
                    <LogOut size={15} />
                    Sair da conta
                  </button>
                </SheetClose>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
