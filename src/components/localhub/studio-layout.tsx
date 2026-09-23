import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings2,
  LogOut,
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const navigation = [
  { to: "/studio", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/studio/catalog", label: "Catálogo", icon: Package },
  { to: "/studio/agenda", label: "Agendamentos", icon: CalendarDays },
  { to: "/studio/settings", label: "Minha página", icon: Settings2 },
] as const;

export function StudioLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { business, user } = useLocalHub();
  const navigate = useNavigate();

  return (
    <div className="ello-studio min-h-screen bg-[#f5f4ef] text-[#292b25]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-[#e6e5dd] bg-[#fbfaf7] px-5 py-7 lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="ello-brand-mark">e</span>
          <span className="text-xl font-semibold tracking-[-.06em]">ello</span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Seu espaço
        </div>
        <nav className="space-y-1">
          {navigation.map(({ to, label, icon: Icon, ...options }) => {
            const active =
              "exact" in options && options.exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#edf0e5] text-[#535d38]" : "text-[#696b64] hover:bg-[#f0f0e9] hover:text-[#292b25]"}`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-[#e6e5dd] bg-[#f4f4ed] p-4">
          <div className="text-xs font-semibold text-[#35372f]">Prévia da sua página</div>
          <p className="mt-1 text-xs leading-relaxed text-[#777970]">
            Confira como sua página aparece para os clientes.
          </p>
          {business && (
            <Link
              to="/loja/$slug"
              params={{ slug: business.slug }}
              className="mt-3 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#667448]"
            >
              Abrir prévia <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#e6e5dd] bg-[#fbfaf7]/95 px-5 backdrop-blur-md sm:px-8">
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
          className="flex gap-1 overflow-x-auto border-b border-[#e6e5dd] bg-[#fbfaf7] px-3 py-2 lg:hidden"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold ${pathname === to ? "bg-[#edf0e5] text-[#535d38]" : "text-slate-500"}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
