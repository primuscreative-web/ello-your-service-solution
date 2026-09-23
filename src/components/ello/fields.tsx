import type React from "react";
import { Search } from "lucide-react";

export function SearchField({
  onChange,
  onSubmit,
  placeholder = "Descreva o serviço ou problema...",
  value,
}: {
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  value?: string;
}) {
  return (
    <form
      className="ello-search-field relative flex items-center rounded-[10px] border border-slate-200 bg-white transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
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
        className="h-12 w-full rounded-[10px] bg-transparent pl-12 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
      />
    </form>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ello-input ${props.className ?? ""}`} />;
}
