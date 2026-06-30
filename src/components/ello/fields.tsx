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
      className="ello-search-field"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Search className="ello-search-field-icon size-5" />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={`ello-input ${showAiHint ? "pr-14" : ""}`}
      />
      {showAiHint ? (
        <span className="ello-search-ai-hint">
          <Sparkles className="size-2.5" />
          IA
        </span>
      ) : null}
    </form>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`ello-input ${props.className ?? ""}`}
    />
  );
}
