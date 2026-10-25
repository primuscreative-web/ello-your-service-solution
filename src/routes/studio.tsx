import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { StudioLayout } from "@/components/localhub/studio-layout";
import { useLocalHub } from "@/lib/localhub-context";
import { ElloAtomLoader } from "@/components/ello/atom-loader";

export const Route = createFileRoute("/studio")({ component: StudioGate });

function StudioGate() {
  const { business, ready, user, error, refresh } = useLocalHub();
  const [loadingExpired, setLoadingExpired] = useState(false);

  useEffect(() => {
    if (ready) {
      setLoadingExpired(false);
      return;
    }
    const timeout = window.setTimeout(() => setLoadingExpired(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [ready]);

  if (!ready && loadingExpired)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f4ed] px-5 text-center">
        <div className="max-w-sm rounded-2xl border border-[#e5e6db] bg-white p-6 shadow-sm">
          <p className="font-bold text-[#171914]">O Studio demorou para carregar</p>
          <p className="mt-2 text-sm text-slate-500">Confira sua conexão e tente carregar seus dados novamente.</p>
          <button
            type="button"
            onClick={() => {
              setLoadingExpired(false);
              void refresh();
            }}
            className="mt-4 rounded-xl bg-[#171914] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );

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
