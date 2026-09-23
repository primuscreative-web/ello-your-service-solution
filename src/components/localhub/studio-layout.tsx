import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings2,
  Store,
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
    <div className="min-h-screen bg-[#f7f8fa] text-[#202735]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-slate-200/80 bg-white px-5 py-7 lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-[#4359a8] text-white">
            <Store size={20} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Local<span className="text-[#4f46e5]">Hub</span>
          </span>
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
                className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#eef1f9] text-[#354a91]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold text-slate-800">Prévia da sua página</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Confira como sua página aparece para os clientes.
          </p>
          {business && (
            <Link
              to="/loja/$slug"
              params={{ slug: business.slug }}
              className="mt-3 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#4359a8]"
            >
              Abrir prévia <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#4359a8] text-white">
              <Store size={18} />
            </span>
            <b>LocalHub</b>
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
            <span className="grid size-9 place-items-center rounded-full bg-[#eef1f9] text-sm font-semibold text-[#354a91]">
              {business?.name?.slice(0, 1).toUpperCase() ?? "L"}
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
          className="flex gap-1 overflow-x-auto border-b border-slate-200/80 bg-white px-3 py-2 lg:hidden"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold ${pathname === to ? "bg-[#eef1f9] text-[#354a91]" : "text-slate-500"}`}
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
