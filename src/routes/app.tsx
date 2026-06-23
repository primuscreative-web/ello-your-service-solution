import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNavigation } from "@/components/ello/navigation";
import { ElloAppShell } from "@/components/ello/app-shell";
import { useAuth } from "@/lib/auth/auth-context";
import type { AppMode } from "@/lib/ello-navigation";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

const FULL_SCREEN_ROUTES = ["/app/professional/", "/app/quote/"];

function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { profile } = useAuth();
  const mode: AppMode = profile?.role === "professional" ? "professional" : "client";
  const hideNavigation = FULL_SCREEN_ROUTES.some((prefix) => pathname.startsWith(prefix));

  return (
    <ElloAppShell
      footer={hideNavigation ? null : <BottomNavigation mode={mode} />}
      statusBarClassName="text-slate-800"
    >
      <div className={`flex flex-1 flex-col ${hideNavigation ? "" : "pb-24"}`}>
        <Outlet />
      </div>
    </ElloAppShell>
  );
}
