import { createFileRoute, Link } from "@tanstack/react-router";
import { ElloLogo } from "@/components/ello/logo";

export const Route = createFileRoute("/")({
  component: Splash,
});

const PROFESSIONS = [
  { icon: "⚡", label: "Eletricista" },
  { icon: "🎨", label: "Pintor" },
  { icon: "💅", label: "Manicure" },
  { icon: "📸", label: "Fotógrafo" },
  { icon: "🐕", label: "Pet Care" },
  { icon: "🚚", label: "Frete" },
  { icon: "🏋️", label: "Personal" },
  { icon: "💻", label: "Designer" },
  { icon: "👵", label: "Cuidador" },
  { icon: "👨‍🍳", label: "Cozinheiro" },
  { icon: "🌿", label: "Jardineiro" },
  { icon: "🔧", label: "Encanador" },
];

function Splash() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-background px-6 pb-12 pt-16">
      {/* Background grid of professions */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 gap-3 p-4 opacity-20">
        {PROFESSIONS.map((p, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-2xl bg-white text-3xl animate-reveal"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {p.icon}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <ElloLogo className="text-6xl" />
        <p className="mt-4 max-w-xs text-balance text-base text-muted-foreground">
          Encontre ou ofereça serviços com facilidade.
        </p>
      </div>

      <div className="relative z-10 space-y-3">
        <Link
          to="/onboarding"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-foreground font-semibold text-background shadow-lg transition-transform active:scale-[0.98]"
        >
          Começar
        </Link>
        <Link
          to="/auth"
          className="block text-center text-sm font-medium text-muted-foreground"
        >
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}