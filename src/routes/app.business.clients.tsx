import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Search } from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyProfessionalClients } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/business/clients")({
  component: ProfessionalClientsScreen,
});

function ProfessionalClientsScreen() {
  const { configured, user } = useAuth();
  const [query, setQuery] = useState("");
  const clientsQuery = useQuery({
    queryKey: ["ello", "me", "professional-clients", user?.id],
    queryFn: () => listMyProfessionalClients(user!.id),
    enabled: Boolean(configured && user),
  });
  const clients = (clientsQuery.data ?? []).filter((client) =>
    `${client.name} ${client.city}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app/business" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Clientes</h1>
        <span className="size-10" />
      </header>
      <main className="px-5 py-5">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar clientes"
            className="min-w-0 flex-1 text-sm outline-none"
          />
        </label>
        <div className="mt-4 divide-y divide-border">
          {!configured || !user ? (
            <Empty text="Entre no modo profissional para acessar seus clientes." />
          ) : clientsQuery.isPending ? (
            <Empty text="Carregando clientes..." />
          ) : clients.length ? (
            clients.map((client) => (
              <article key={client.userId} className="flex items-center gap-3 py-4">
                <AvatarPhoto initials={initialsFor(client.name)} size={52} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black">{client.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{client.city}</p>
                  <p className="mt-1 text-xs">
                    {client.completedServices} serviços concluídos • {client.totalRequests}{" "}
                    solicitações
                  </p>
                </div>
              </article>
            ))
          ) : (
            <Empty text="Seus clientes aparecerão após uma solicitação ou atendimento autorizado." />
          )}
        </div>
      </main>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-20 text-center text-sm leading-relaxed text-muted-foreground">{text}</p>;
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
