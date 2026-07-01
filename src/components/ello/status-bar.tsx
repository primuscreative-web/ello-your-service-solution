import { useEffect, useState } from "react";
import { Battery, Wifi } from "lucide-react";

export function StatusBar({ className = "text-slate-800" }: { className?: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`mx-3 mt-2 flex h-9 select-none items-center justify-between rounded-full border border-white/50 bg-white/50 px-4 text-[11px] font-semibold tracking-tight shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-colors duration-300 ${className}`}
      aria-hidden="true"
    >
      <span className="font-semibold tabular-nums">{time}</span>

      <div className="w-[110px] shrink-0 md:block hidden" />

      <div className="flex items-center gap-1.5">
        <div
          className="flex h-2.5 items-end gap-[1.5px] pb-[1px]"
          aria-label="Sinal de celular excelente"
        >
          <div className="h-1.5 w-[2.5px] rounded-[0.5px] bg-current opacity-60" />
          <div className="h-2 w-[2.5px] rounded-[0.5px] bg-current opacity-75" />
          <div className="h-2.5 w-[2.5px] rounded-[0.5px] bg-current opacity-90" />
          <div className="h-3 w-[2.5px] rounded-[0.5px] bg-current" />
        </div>

        <Wifi className="size-3 opacity-90" />

        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold tabular-nums">98%</span>
          <div className="relative flex items-center">
            <Battery className="h-3.5 w-5 stroke-1" />
            <div className="absolute left-[3px] top-[4.5px] h-1.5 w-2.5 rounded-[1px] bg-current" />
          </div>
        </div>
      </div>
    </div>
  );
}
