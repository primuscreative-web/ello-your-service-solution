import { createFileRoute, Link } from "@tanstack/react-router";
import { ElloLogo } from "@/components/ello/logo";
import { ELLO_MEDIA } from "@/lib/ello-media";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#002eea] text-white">
      <section className="relative isolate flex min-h-dvh flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))]">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_36%,rgba(42,105,255,0.96),rgba(0,35,184,0.98)_48%,rgba(0,14,45,1)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[58%] bg-gradient-to-t from-[#000b25] via-[#0037f1]/30 to-transparent" />

        <div className="flex flex-1 flex-col items-center text-center">
          <div className="mt-[16vh] flex flex-col items-center">
            <ElloLogo
              className="text-[3.55rem] text-white"
              markClassName="text-white"
              dotClassName="text-white"
            />
            <p className="mt-8 max-w-[18rem] text-[1.02rem] font-bold leading-relaxed text-white">
              Encontre ou ofereça serviços com facilidade.
            </p>
          </div>

          <img
            src={ELLO_MEDIA.splash.src}
            alt="Profissionais ELLO"
            className="pointer-events-none absolute inset-x-1/2 bottom-[8.9rem] -z-0 h-[48dvh] max-h-[430px] min-h-[310px] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
          />
        </div>

        <div className="relative z-10 mt-auto space-y-4">
          <Link
            to="/onboarding"
            className="flex h-14 w-full items-center justify-center rounded-xl bg-[#0648ff] text-base font-bold text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition active:scale-[0.99]"
          >
            Começar
          </Link>
          <Link to="/auth" className="block py-1 text-center text-base font-bold text-white/95">
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
