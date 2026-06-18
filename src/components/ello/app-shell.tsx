import type { ReactNode } from "react";

export function ElloAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white md:bg-slate-100">
      <div className="ello-screen ello-shell min-h-dvh w-full overflow-x-hidden bg-white md:border-x md:border-border">
        {children}
      </div>
    </div>
  );
}
