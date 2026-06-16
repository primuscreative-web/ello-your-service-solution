import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/ello/mobile-ui";

export const Route = createFileRoute("/app")({
  component: AppShell,
});

function AppShell() {
  return (
    <div className="ello-shell pb-16">
      <Outlet />
      <BottomNav />
    </div>
  );
}
