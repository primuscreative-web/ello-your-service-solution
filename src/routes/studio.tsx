import { createFileRoute, Navigate } from "@tanstack/react-router";
import { StudioLayout } from "@/components/localhub/studio-layout";
import { useLocalHub } from "@/lib/localhub-context";
import { ElloAtomLoader } from "@/components/ello/atom-loader";

export const Route = createFileRoute("/studio")({ component: StudioGate });

function StudioGate() {
  const { business, ready, user, error } = useLocalHub();
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center bg-[#13150d]">
        <ElloAtomLoader size={56} label="Carregando Studio..." />
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="grid min-h-screen place-items-center px-5 text-center text-sm text-red-700"
      >
        Não foi possível carregar sua conta: {error}
      </div>
    );
  if (!user) return <Navigate to="/auth" />;
  if (!business) return <Navigate to="/onboarding" />;
  return <StudioLayout />;
}
