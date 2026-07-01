import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
import { ElloSurface } from "@/components/ello/primitives";
import {
  EmptyStateCard,
  ScreenHeader,
  ScreenMain,
  ScreenPage,
} from "@/components/ello/screen-layout";
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
    <ScreenPage>
      <ScreenHeader title="Clientes" subtitle="CRM da sua operação" backTo="/app/business" />

      <ScreenMain>
        <div className="ello-search-field">
          <Users className="ello-search-field-icon size-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar clientes"
            className="ello-input pl-11"
          />
        </div>

        {!configured || !user ? (
          <Empty text="Entre no modo profissional para acessar seus clientes." />
        ) : clientsQuery.isPending ? (
          <Empty text="Carregando clientes..." />
        ) : clients.length ? (
          <div className="space-y-2">
            {clients.map((client) => (
              <ElloSurface key={client.userId} className="flex items-center gap-3 p-4">
                <AvatarPhoto initials={initialsFor(client.name)} size={52} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black">{client.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{client.city}</p>
                  <p className="mt-1 text-xs font-medium text-foreground/70">
                    {client.completedServices} serviços • {client.totalRequests} solicitações
                  </p>
                </div>
              </ElloSurface>
            ))}
          </div>
        ) : (
          <Empty text="Seus clientes aparecerão após uma solicitação ou atendimento autorizado." />
        )}
      </ScreenMain>
    </ScreenPage>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <EmptyStateCard
      icon={<Users className="size-6" />}
      title="CRM de clientes"
      description={text}
    />
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
