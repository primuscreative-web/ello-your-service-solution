import type { ReactNode } from "react";
import { StatusBar } from "./status-bar";

export function ElloAppShell({
  children,
  footer,
  statusBarClassName = "text-slate-800",
}: {
  children: ReactNode;
  footer?: ReactNode;
  statusBarClassName?: string;
}) {
  return (
    <div className="desktop-mockup-bg">
      <div className="phone-chassis">
        <div className="phone-dynamic-island" />
        <div className="phone-home-indicator" />
        <div className="phone-screen">
          <StatusBar className={statusBarClassName} />
          <div className="phone-screen-content-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-white">
            {children}
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
