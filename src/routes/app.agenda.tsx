import { createFileRoute, Link } from "@tanstack/react-router";
import { APPOINTMENTS, getProfessional } from "@/lib/ello-data";
import { ProAvatar } from "@/components/ello/avatar";

export const Route = createFileRoute("/app/agenda")({
  component: Agenda,
});

const STATUS_STYLES = {
  confirmado: "bg-emerald-100 text-emerald-800",
  pendente: "bg-amber-100 text-amber-800",
  concluido: "bg-zinc-200 text-zinc-700",
};

function Agenda() {
  return (
    <div className="px-5 pb-8 pt-8">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Agenda
      </span>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight">
        Seus compromissos
      </h1>

      <div className="mt-6 space-y-3">
        {APPOINTMENTS.map((a) => {
          const pro = getProfessional(a.professionalId);
          if (!pro) return null;
          return (
            <Link
              key={a.id}
              to="/app/professional/$id"
              params={{ id: pro.id }}
              className="block rounded-3xl border border-border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                    {a.date} • {a.time}
                  </span>
                  <h3 className="font-display mt-1 text-base font-bold">{a.service}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <ProAvatar initials={pro.initials} tone={pro.avatarTone} size={40} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{pro.name}</p>
                  <p className="text-xs text-muted-foreground">{pro.profession}</p>
                </div>
                <button className="rounded-xl border border-border px-3 py-2 text-xs font-bold">
                  Chat
                </button>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-3xl border border-dashed border-border bg-white p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Quer reagendar ou cancelar?<br />Entre em contato direto pelo chat.
        </p>
      </div>
    </div>
  );
}