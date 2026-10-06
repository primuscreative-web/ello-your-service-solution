import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
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
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBusinessCopy } from "@/lib/localhub-business";

export function StudioLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hash = useRouterState({ select: (state) => state.location.hash });
  const { business, user, isStaffAccount } = useLocalHub();
  const businessCopy = getBusinessCopy(business?.category);
  const isFoodBusiness = business?.category === "alimentacao";
  const navigate = useNavigate();
  const ownerNavigation = [
    { to: "/studio", label: "Visão geral", icon: LayoutDashboard, exact: true },
    { to: "/studio/catalog", label: businessCopy.offerTitle, icon: Package },
    {
      to: isFoodBusiness ? "/studio/pedidos" : "/studio/agenda",
      label: isFoodBusiness ? "Pedidos" : "Agendamentos",
      icon: isFoodBusiness ? ClipboardList : CalendarDays,
    },
    ...(isFoodBusiness ? [{ to: "/studio/entregas" as const, label: "Motoboys", icon: Bike }] : []),
    ...(isFoodBusiness
      ? [{ to: "/studio/metricas" as const, label: "Métricas", icon: BarChart3 }]
      : []),
    ...(isFoodBusiness
      ? [{ to: "/studio/precificacao" as const, label: "Custos e preços", icon: Calculator }]
      : []),
    ...(isFoodBusiness
      ? [
          { to: "/studio/crm" as const, label: "Clientes e promoções", icon: HeartHandshake },
          { to: "/studio/caixa" as const, label: "Frente de caixa", icon: WalletCards },
        ]
      : []),
    { to: "/studio/financeiro" as const, label: "Financeiro e carteira", icon: WalletCards },
    ...(!isFoodBusiness
      ? [
          {
            to: "/studio/profissionais" as const,
            label: "Profissionais",
            icon: UsersRound,
          },
        ]
      : []),
    { to: "/studio/settings", label: "Minha página", icon: Settings2 },
  ] as const;
  const navigation = isStaffAccount
    ? [{ to: "/studio/agenda" as const, label: "Minha agenda", icon: CalendarDays }]
    : ownerNavigation;

  useEffect(() => {
    if (isStaffAccount && pathname !== "/studio/agenda") {
      void navigate({ to: "/studio/agenda", replace: true });
    }
  }, [isStaffAccount, navigate, pathname]);

  if (isStaffAccount && pathname !== "/studio/agenda") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Abrindo sua agenda…
      </div>
    );
  }

  return (
    <div className="ello-studio min-h-screen bg-[#f8f7f4] text-[#292b25]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-[#34352f] bg-[#292b25] px-5 py-7 text-[#f7f6ef] lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="ello-brand-mark">e</span>
          <span className="text-xl font-semibold tracking-[-.06em]">ello</span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b7b9ac]">
          Seu espaço
        </div>
        <nav className="space-y-1">
          {navigation.map(({ to, label, icon: Icon, ...options }) => {
            const active =
              "exact" in options && options.exact
                ? pathname === to
                : pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? "bg-[#d0f25a] text-[#292b25] font-bold shadow-xs"
                    : "text-[#dedfd8] font-medium hover:bg-[#3a3c34] hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} className="shrink-0 transition-transform group-hover:scale-105" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#484a40] bg-[#32342d]/90 p-4 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#f4f3ea]">Prévia da sua página</span>
            <span className="rounded-full bg-[#484a40] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#d0f25a]">Online</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#c9cbc1]">
            Confira como sua página aparece para os clientes em tempo real.
          </p>
          {business && (
            <Link
              to="/loja/$slug"
              params={{ slug: business.slug }}
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#40433a] px-3 py-1.5 text-xs font-semibold text-[#d0f25a] transition hover:bg-[#4d5045]"
            >
              Abrir prévia <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e8e6df] bg-[#fbfaf7]/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="ello-brand-mark ello-brand-mark-small">e</span>
            <b className="font-semibold tracking-[-.04em]">ello</b>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">Painel do negócio</div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-xs text-slate-500 md:block">
              {user?.email}
            </span>
            {business && (
              <span className="hidden max-w-56 truncate text-sm font-semibold sm:block">
                {business.name}
              </span>
            )}
            <span className="grid size-9 place-items-center rounded-full bg-[#e8ebdf] text-sm font-semibold text-[#586341]">
              {business?.name?.slice(0, 1).toUpperCase() ?? "E"}
            </span>
            <button
              type="button"
              aria-label="Sair da conta"
              title="Sair da conta"
              className="grid size-10 place-items-center rounded-[10px] text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              onClick={() =>
                void getSupabaseBrowserClient()
                  ?.auth.signOut()
                  .then(() => navigate({ to: "/auth" }))
              }
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <nav
          aria-label="Navegação do painel"
          className="flex gap-1 overflow-x-auto border-b border-[#34352f] bg-[#292b25] px-3 py-2 lg:hidden"
        >
          {navigation.map(({ to, label, icon: Icon, ...options }) => {
            const active =
              "exact" in options && options.exact
                ? pathname === to
                : pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${active ? "bg-[#d0f25a] text-[#292b25]" : "text-[#dedfd8]"}`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
