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
      className={`flex h-11 select-none items-center justify-between px-6 pt-3 text-[11px] font-semibold tracking-tight transition-colors duration-300 ${className}`}
      aria-hidden="true"
    >
      {/* Time */}
      <span className="font-semibold">{time}</span>

      {/* Dynamic Island Spacer (desktop frame overlaps this area, so we leave it empty or add signal metrics) */}
      <div className="w-[110px] shrink-0 md:block hidden" />

      {/* Indicators */}
      <div className="flex items-center gap-1.5">
        {/* Cellular Signal Bars */}
        <div className="flex items-end gap-[1.5px] h-2.5 pb-[1px]" aria-label="Sinal de celular excelente">
          <div className="w-[2.5px] h-1.5 rounded-[0.5px] bg-current" />
          <div className="w-[2.5px] h-2 rounded-[0.5px] bg-current" />
          <div className="w-[2.5px] h-2.5 rounded-[0.5px] bg-current" />
          <div className="w-[2.5px] h-3 rounded-[0.5px] bg-current" />
        </div>

        {/* Wi-Fi Icon */}
        <Wifi className="size-3" />

        {/* Battery */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold">98%</span>
          <div className="relative flex items-center">
            <Battery className="w-5 h-3.5 stroke-1" />
            <div className="absolute left-[3px] top-[4.5px] h-1.5 w-2.5 rounded-[1px] bg-current" />
          </div>
        </div>
      </div>
    </div>
  );
}
