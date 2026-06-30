import type { ReactNode } from "react";
import { StatusBar } from "./status-bar";

export function ElloAppShell({
  children,
  footer,
  statusBarClassName = "text-slate-800",
  dark = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  statusBarClassName?: string;
  dark?: boolean;
}) {
  return (
    <div className="desktop-mockup-bg">
      <div className="phone-chassis">
        <div className="phone-dynamic-island" />
        <div className="phone-home-indicator" />
        <div
          className={`phone-screen relative isolate overflow-hidden ello-noise-overlay ${
            dark ? "ello-mesh-dark" : "ello-mesh-bg"
          }`}
        >
          {!dark ? (
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_90%_0%,oklch(0.58_0.22_285_/_0.1),transparent_50%)]" />
          ) : null}
          <StatusBar className={statusBarClassName} />
          <div className="phone-screen-content-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
