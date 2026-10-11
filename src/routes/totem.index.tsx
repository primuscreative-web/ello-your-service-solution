import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLocalHub } from "@/lib/localhub-context";
import { ElloAtomLoader } from "@/components/ello/atom-loader";

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
      <div className="flex flex-col items-center gap-4">
        <ElloAtomLoader size={56} />
        <p className="text-sm font-semibold tracking-wider text-slate-300">Iniciando Autoatendimento no Totem…</p>
      </div>
    </div>
  );
}

export default TotemIndexPage;
