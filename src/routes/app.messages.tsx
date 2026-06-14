import { createFileRoute } from "@tanstack/react-router";
import { CONVERSATIONS, getProfessional } from "@/lib/ello-data";
import { ProAvatar } from "@/components/ello/avatar";

export const Route = createFileRoute("/app/messages")({
  component: Messages,
});

function Messages() {
  return (
    <div className="px-5 pb-8 pt-8">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Mensagens
      </span>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight">
        Conversas
      </h1>

      <div className="mt-6 space-y-2">
        {CONVERSATIONS.map((c) => {
          const pro = getProfessional(c.professionalId);
          if (!pro) return null;
          return (
            <button
              key={c.id}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left"
            >
              <ProAvatar initials={pro.initials} tone={pro.avatarTone} size={52} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold">{pro.name}</p>
                  <span className="font-mono text-[10px] text-muted-foreground">{c.timestamp}</span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {c.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}