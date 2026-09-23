import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings2,
  Store,
} from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";

const navigation = [
  { to: "/studio", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/studio/catalog", label: "Catálogo", icon: Package },
  { to: "/studio/agenda", label: "Agendamentos", icon: CalendarDays },
  { to: "/studio/settings", label: "Minha página", icon: Settings2 },
] as const;

export function StudioLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { business } = useLocalHub();

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#e8eaf1] bg-white px-5 py-6 lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#4f46e5] text-white shadow-lg shadow-indigo-200">
            <Store size={20} />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Local<span className="text-[#4f46e5]">Hub</span>
          </span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </div>
        <nav className="space-y-1">
          {navigation.map(({ to, label, icon: Icon, ...options }) => {
            const active =
              "exact" in options && options.exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-indigo-50 text-[#4338ca]" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.9} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="text-xs font-bold text-indigo-900">Prévia da sua página</div>
          <p className="mt-1 text-xs leading-relaxed text-indigo-700">
            Confira como sua página aparece para os clientes.
          </p>
          {business && (
            <Link
              to="/loja/$slug"
              params={{ slug: business.slug }}
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-800"
            >
              Abrir prévia <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[#e8eaf1] bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-[#4f46e5] text-white">
              <Store size={18} />
            </span>
            <b>LocalHub</b>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">Painel do negócio</div>
          <div className="flex items-center gap-3">
            {business && (
              <span className="hidden max-w-56 truncate text-sm font-semibold sm:block">
                {business.name}
              </span>
            )}
            <span className="grid size-9 place-items-center rounded-full bg-[#e9e7ff] text-sm font-bold text-[#4338ca]">
              {business?.name?.slice(0, 1).toUpperCase() ?? "L"}
            </span>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-[#e8eaf1] bg-white px-3 py-2 lg:hidden">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${pathname === to ? "bg-indigo-50 text-indigo-700" : "text-slate-500"}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
