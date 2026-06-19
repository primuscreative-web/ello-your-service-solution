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
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </form>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${
        props.className ?? ""
      }`}
    />
  );
}
