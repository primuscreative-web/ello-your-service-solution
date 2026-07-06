import type React from "react";
import { Search, Sparkles } from "lucide-react";

export function SearchField({
  onChange,
  onSubmit,
  placeholder = "Descreva o serviço ou problema...",
  value,
  showAiHint = true,
}: {
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  value?: string;
  showAiHint?: boolean;
}) {
  return (
    <form
      className="relative flex items-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Search className="absolute left-4 size-5 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={`h-12 w-full rounded-2xl bg-transparent pl-12 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 ${showAiHint ? "pr-14" : ""}`}
      />
      {showAiHint ? (
        <span className="absolute right-4 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
          <Sparkles className="size-3 text-primary" />
          IA
        </span>
      ) : null}
    </form>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ello-input ${props.className ?? ""}`} />;
}
