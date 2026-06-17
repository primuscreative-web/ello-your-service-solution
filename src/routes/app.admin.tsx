import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ExternalLink, ShieldCheck, Store, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AppTopBar, CyanButton, Metric } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  deleteAdminLocalPartnerSpace,
  listAdminLocalPartnerSpaces,
  listAdminMonetizationRequests,
  reviewMonetizationRequest,
  upsertAdminLocalPartnerSpace,
  type AdminLocalPartnerSpace,
  type AdminMonetizationRequest,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/admin")({
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();
  const { configured, user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>(emptyPartnerForm);

  const requestsQuery = useQuery({
    queryKey: ["ello", "admin", "monetization-requests", user?.id],
    queryFn: () => listAdminMonetizationRequests(user!.id),
    enabled: Boolean(configured && user && isAdmin),
  });
  const partnersQuery = useQuery({
    queryKey: ["ello", "admin", "local-partners", user?.id],
    queryFn: () => listAdminLocalPartnerSpaces(user!.id),
    enabled: Boolean(configured && user && isAdmin),
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { requestId: string; status: "approved" | "rejected"; days?: number }) =>
      reviewMonetizationRequest({
        userId: user!.id,
        ...input,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "admin", "monetization-requests", user?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["ello", "professionals"] }),
        queryClient.invalidateQueries({ queryKey: ["ello", "me"] }),
      ]);
    },
  });

  const partnerMutation = useMutation({
    mutationFn: () =>
      upsertAdminLocalPartnerSpace({
        userId: user!.id,
        id: partnerForm.id,
        name: partnerForm.name,
        category: partnerForm.category,
        city: partnerForm.city,
        description: partnerForm.description,
        ctaLabel: partnerForm.ctaLabel,
        ctaUrl: partnerForm.ctaUrl,
        imageUrl: partnerForm.imageUrl,
        active: partnerForm.active,
        startsAt: partnerForm.startsAt ? new Date(partnerForm.startsAt).toISOString() : null,
        endsAt: partnerForm.endsAt ? new Date(partnerForm.endsAt).toISOString() : null,
      }),
    onSuccess: async () => {
      setPartnerForm(emptyPartnerForm);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "admin", "local-partners", user?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["ello", "local-partners"] }),
      ]);
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: (id: string) => deleteAdminLocalPartnerSpace({ userId: user!.id, id }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ello", "admin", "local-partners", user?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["ello", "local-partners"] }),
      ]);
    },
  });

  const requests = requestsQuery.data ?? [];
  const partners = partnersQuery.data ?? [];
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const activePartners = partners.filter((partner) => partner.active);

  if (!configured) {
    return (
      <AdminNotice
        title="Supabase nao configurado"
        body="Configure o Supabase para abrir o painel administrativo."
      />
    );
  }

  if (!user) {
    return <AdminNotice title="Entre na ELLO" body="O painel administrativo exige login." />;
  }

  if (!isAdmin) {
    return (
      <AdminNotice
        title="Acesso restrito"
        body="Seu usuario precisa estar com role admin em profiles para revisar monetizacao."
      />
    );
  }

  return (
    <div>
      <AppTopBar title="Admin ELLO" subtitle="Monetizacao e parceiros" backTo="/app/profile" />

      <main className="space-y-4 px-4 pb-6 pt-4">
        <section className="ello-card rounded-xl p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-black">Controle comercial</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Aprova ativacoes sem gateway: destaque, ELLO LINK PRO e parceiros locais.
              </p>
            </div>
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="Pendentes" value={String(pendingRequests.length)} accent />
            <Metric label="Pedidos" value={String(requests.length)} accent />
            <Metric label="Parceiros" value={String(activePartners.length)} accent />
          </div>
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Fila de monetizacao</h2>
            <span className="text-[10px] font-bold text-muted-foreground">
              {requestsQuery.isPending ? "Carregando" : `${requests.length} pedidos`}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {requests.length ? (
              requests.map((request) => (
                <AdminRequestCard
                  key={request.id}
                  request={request}
                  busy={reviewMutation.isPending}
                  onApprove={(days) =>
                    reviewMutation.mutate({
                      requestId: request.id,
                      status: "approved",
                      days,
                    })
                  }
                  onReject={() =>
                    reviewMutation.mutate({
                      requestId: request.id,
                      status: "rejected",
                    })
                  }
                />
              ))
            ) : (
              <p className="rounded-lg bg-background p-3 text-xs font-semibold text-muted-foreground">
                Nenhuma solicitacao comercial ainda.
              </p>
            )}
          </div>

          {reviewMutation.error ? (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
              {reviewMutation.error.message}
            </p>
          ) : null}
        </section>

        <section className="ello-card rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Espaco para parceiros locais</h2>
            <Store className="size-4 text-primary" />
          </div>

          <div className="mt-3 grid gap-2">
            <input
              value={partnerForm.name}
              onChange={(event) => setPartnerForm({ ...partnerForm, name: event.target.value })}
              placeholder="Nome do parceiro"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={partnerForm.category}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, category: event.target.value })
                }
                placeholder="Categoria"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={partnerForm.city}
                onChange={(event) => setPartnerForm({ ...partnerForm, city: event.target.value })}
                placeholder="Cidade"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <textarea
              value={partnerForm.description}
              onChange={(event) =>
                setPartnerForm({ ...partnerForm, description: event.target.value })
              }
              placeholder="Descricao curta"
              className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={partnerForm.ctaLabel}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, ctaLabel: event.target.value })
                }
                placeholder="Texto do botao"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                value={partnerForm.ctaUrl}
                onChange={(event) => setPartnerForm({ ...partnerForm, ctaUrl: event.target.value })}
                placeholder="URL destino"
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <input
              value={partnerForm.imageUrl}
              onChange={(event) => setPartnerForm({ ...partnerForm, imageUrl: event.target.value })}
              placeholder="URL da imagem"
              className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={partnerForm.startsAt}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, startsAt: event.target.value })
                }
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
              <input
                type="datetime-local"
                value={partnerForm.endsAt}
                onChange={(event) => setPartnerForm({ ...partnerForm, endsAt: event.target.value })}
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
            <label className="flex min-h-10 items-center justify-between rounded-lg bg-background px-3 text-xs font-black">
              Parceiro ativo
              <input
                type="checkbox"
                checked={partnerForm.active}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, active: event.target.checked })
                }
                className="size-4 accent-primary"
              />
            </label>

            {partnerMutation.error ? (
              <p className="rounded-lg bg-red-50 p-2 text-[10px] font-semibold text-red-700">
                {partnerMutation.error.message}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <CyanButton
                disabled={partnerMutation.isPending}
                onClick={() => partnerMutation.mutate()}
                className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              >
                {partnerMutation.isPending
                  ? "Salvando..."
                  : partnerForm.id
                    ? "Atualizar parceiro"
                    : "Criar parceiro"}
              </CyanButton>
              <button
                disabled={partnerMutation.isPending}
                onClick={() => setPartnerForm(emptyPartnerForm)}
                className="h-10 rounded-lg border border-border bg-white text-xs font-black text-[#083d63] disabled:opacity-50"
              >
                Limpar
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black">Parceiros cadastrados</h2>
          {partners.length ? (
            partners.map((partner) => (
              <AdminPartnerCard
                key={partner.id}
                partner={partner}
                busy={deletePartnerMutation.isPending}
                onEdit={() => setPartnerForm(formFromPartner(partner))}
                onDelete={() => deletePartnerMutation.mutate(partner.id)}
              />
            ))
          ) : (
            <p className="ello-card rounded-xl p-3 text-xs font-semibold text-muted-foreground">
              Nenhum parceiro cadastrado.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminRequestCard({
  busy,
  onApprove,
  onReject,
  request,
}: {
  busy: boolean;
  onApprove: (days: number) => void;
  onReject: () => void;
  request: AdminMonetizationRequest;
}) {
  const [days, setDays] = useState(defaultDaysForRequest(request.requestType));

  return (
    <article className="rounded-xl bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black">{requestLabel(request.requestType)}</p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-muted-foreground">
            {request.professional?.name ?? "Profissional"} -{" "}
            {request.professional?.city ?? "cidade nao informada"}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">
        Criado em {request.createdAt}
        {request.professional?.slug ? ` - /p/${request.professional.slug}` : ""}
      </p>

      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <input
          value={days}
          onChange={(event) => setDays(Number(event.target.value) || 1)}
          min={1}
          max={365}
          type="number"
          disabled={request.status !== "pending" || busy}
          className="h-9 min-w-0 rounded-lg border border-border bg-white px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          disabled={request.status !== "pending" || busy}
          onClick={() => onApprove(days)}
          className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white disabled:bg-muted disabled:text-muted-foreground"
          aria-label="Aprovar"
        >
          <Check className="size-4" />
        </button>
        <button
          disabled={request.status !== "pending" || busy}
          onClick={onReject}
          className="grid size-9 place-items-center rounded-lg bg-red-600 text-white disabled:bg-muted disabled:text-muted-foreground"
          aria-label="Recusar"
        >
          <X className="size-4" />
        </button>
      </div>
    </article>
  );
}

function AdminPartnerCard({
  busy,
  onDelete,
  onEdit,
  partner,
}: {
  busy: boolean;
  onDelete: () => void;
  onEdit: () => void;
  partner: AdminLocalPartnerSpace;
}) {
  return (
    <article className="ello-card flex gap-3 rounded-xl p-3">
      <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/15 text-primary">
        {partner.image_url ? (
          <img src={partner.image_url} alt="" className="size-full object-cover" />
        ) : (
          <Store className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-black">{partner.name}</p>
            <p className="text-[10px] font-semibold text-muted-foreground">
              {partner.category} - {partner.city}
            </p>
          </div>
          <span className="rounded-full bg-muted px-2 py-1 text-[9px] font-black text-muted-foreground">
            {partner.active ? "Ativo" : "Pausado"}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{partner.description}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onEdit}
            className="h-8 rounded-lg border border-border bg-white px-3 text-[10px] font-black text-[#083d63]"
          >
            Editar
          </button>
          {partner.cta_url ? (
            <a
              href={partner.cta_url}
              target="_blank"
              rel="noreferrer"
              className="grid size-8 place-items-center rounded-lg bg-white text-[#083d63]"
              aria-label="Abrir parceiro"
            >
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          <button
            disabled={busy}
            onClick={onDelete}
            className="ml-auto grid size-8 place-items-center rounded-lg bg-red-50 text-red-700 disabled:opacity-50"
            aria-label="Excluir parceiro"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function AdminNotice({ body, title }: { body: string; title: string }) {
  return (
    <div>
      <AppTopBar title="Admin ELLO" subtitle="Acesso administrativo" backTo="/app/profile" />
      <main className="px-4 pt-4">
        <section className="ello-card rounded-xl p-6 text-center">
          <ShieldCheck className="mx-auto size-8 text-primary" />
          <h1 className="mt-3 text-base font-black">{title}</h1>
          <p className="mt-2 text-xs text-muted-foreground">{body}</p>
          <Link
            to="/app/profile"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#083d63] px-4 text-xs font-black text-white"
          >
            Voltar
          </Link>
        </section>
      </main>
    </div>
  );
}

function StatusPill({ status }: { status: AdminMonetizationRequest["status"] }) {
  const className =
    status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "rejected"
        ? "bg-red-100 text-red-800"
        : status === "cancelled"
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-100 text-amber-800";

  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${className}`}>
      {status === "approved"
        ? "Aprovado"
        : status === "rejected"
          ? "Recusado"
          : status === "cancelled"
            ? "Cancelado"
            : "Pendente"}
    </span>
  );
}

type PartnerFormState = {
  id: string | null;
  name: string;
  category: string;
  city: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const emptyPartnerForm: PartnerFormState = {
  id: null,
  name: "",
  category: "",
  city: "Sao Paulo, SP",
  description: "",
  ctaLabel: "Conhecer parceiro",
  ctaUrl: "",
  imageUrl: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

function formFromPartner(partner: AdminLocalPartnerSpace): PartnerFormState {
  return {
    id: partner.id,
    name: partner.name,
    category: partner.category,
    city: partner.city,
    description: partner.description,
    ctaLabel: partner.cta_label,
    ctaUrl: partner.cta_url ?? "",
    imageUrl: partner.image_url ?? "",
    startsAt: toDateTimeInput(partner.starts_at),
    endsAt: toDateTimeInput(partner.ends_at),
    active: partner.active,
  };
}

function toDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

function requestLabel(type: AdminMonetizationRequest["requestType"]) {
  if (type === "profile_boost") return "Impulsionamento de Perfil";
  if (type === "ello_link_pro") return "ELLO LINK PRO";
  return "Espaco para parceiros locais";
}

function defaultDaysForRequest(type: AdminMonetizationRequest["requestType"]) {
  if (type === "profile_boost") return 7;
  if (type === "ello_link_pro") return 30;
  return 30;
}
