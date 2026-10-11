import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { UtensilsCrossed } from "lucide-react";
import { useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/totem/")({
  component: TotemIndexPage,
});

export function TotemIndexPage() {
  const { business } = useLocalHub();
  const navigate = useNavigate();

  useEffect(() => {
    const slug = business?.slug || "maniello";
    void navigate({
      to: "/totem/$slug",
      params: { slug },
      replace: true,
    });
  }, [business?.slug, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1c16] text-[#f2f4ec]">
      <div className="flex flex-col items-center gap-3">
        <UtensilsCrossed size={36} className="animate-spin text-[#d0f25a]" />
        <p className="text-sm font-semibold tracking-wider">Iniciando Autoatendimento no Totem…</p>
      </div>
    </div>
  );
}

export default TotemIndexPage;
