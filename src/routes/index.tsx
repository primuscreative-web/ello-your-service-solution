import { createFileRoute, Link } from "@tanstack/react-router";
import { ElloLogo } from "@/components/ello/logo";
import { ELLO_MEDIA } from "@/lib/ello-media";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  return (
    <main className="ello-shell flex min-h-dvh flex-col overflow-hidden bg-[#002eea] text-white">
      <section className="relative isolate flex min-h-dvh flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(3.8rem+env(safe-area-inset-top))]">
        <img
          src={ELLO_MEDIA.splash.src}
          alt=""
          className="pointer-events-none absolute inset-0 -z-20 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#001fbd]/15 via-transparent to-[#000b25]/70" />

        <div className="relative z-10 flex flex-1 flex-col items-center text-center">
          <div className="mt-[15vh] flex flex-col items-center">
            <ElloLogo
              className="text-[3.5rem] text-white"
              markClassName="text-white"
              dotClassName="text-white"
            />
            <p className="mt-8 max-w-[18rem] text-[1rem] font-bold leading-relaxed text-white">
              Encontre ou ofereça serviços com facilidade.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto space-y-4">
          <Link
            to="/onboarding"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#0648ff] text-base font-bold text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition active:scale-[0.99]"
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
