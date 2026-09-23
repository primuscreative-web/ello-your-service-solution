import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { StudioLayout } from "@/components/localhub/studio-layout";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio")({ component: StudioGate });

function StudioGate() {
  const { business, ready } = useLocalHub();
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center text-indigo-600">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  if (!business) return <Navigate to="/onboarding" />;
  return <StudioLayout />;
}
