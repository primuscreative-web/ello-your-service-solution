import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNavigation } from "@/components/ello/navigation";
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
    <div className="ello-shell min-h-dvh bg-white pb-20">
      <Outlet />
      {hideNavigation ? null : <BottomNavigation mode={mode} />}
    </div>
  );
}
