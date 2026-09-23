import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { StudioLayout } from "@/components/localhub/studio-layout";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio")({ component: StudioGate });

function StudioGate() {
  const { business, ready, user, error } = useLocalHub();
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center text-indigo-600">
        <LoaderCircle className="animate-spin" />
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
