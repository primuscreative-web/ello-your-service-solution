import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppTopBar, CyanButton, Metric } from "@/components/ello/mobile-ui";
import { useAuth } from "@/lib/auth/auth-context";
import {
  deleteAdminLocalPartnerSpace,
  listAdminLocalPartnerSpaces,
  upsertAdminLocalPartnerSpace,
  type AdminLocalPartnerSpace,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/admin")({
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();
  const { configured, user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>(emptyPartnerForm);

  const partnersQuery = useQuery({
    queryKey: ["ello", "admin", "local-partners", user?.id],
    queryFn: () => listAdminLocalPartnerSpaces(user!.id),
    enabled: Boolean(configured && user && isAdmin),
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

  const partners = partnersQuery.data ?? [];
  const activePartners = partners.filter((partner) => partner.active);

  if (!configured) {
    return (
      <AdminNotice
        title="Supabase não configurado"
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
        body="Seu usuário precisa estar com role admin em profiles para gerenciar configurações comerciais."
      />
    );
  }

  return (
    <div>
      <AppTopBar title="Admin ELLO" subtitle="Parceiros e operacao" backTo="/app/profile" />

      <main className="space-y-4 px-4 pb-6 pt-4">
        <section className="rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-4 text-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.65)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                Controle comercial
              </p>
              <h1 className="mt-2 text-base font-black">Gerencie parceiros e campanhas</h1>
              <p className="mt-1 text-xs text-white/75">
                Publique destaque local e mantenha o espaço comercial sempre atualizado.
              </p>
            </div>
            <ShieldCheck className="size-6 text-cyan-300" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Parceiros" value={String(activePartners.length)} accent />
            <Metric label="Cadastrados" value={String(partners.length)} accent />
          </div>
        </section>

        <section className="rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_56px_-30px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black">Espaço para parceiros locais</h2>
            <Store className="size-4 text-primary" />
          </div>

          <div className="mt-3 grid gap-2">
            <input
              value={partnerForm.name}
              onChange={(event) => setPartnerForm({ ...partnerForm, name: event.target.value })}
              placeholder="Nome do parceiro"
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={partnerForm.category}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, category: event.target.value })
                }
                placeholder="Categoria"
                className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
              />
              <input
                value={partnerForm.city}
                onChange={(event) => setPartnerForm({ ...partnerForm, city: event.target.value })}
                placeholder="Cidade"
                className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
              />
            </div>
            <textarea
              value={partnerForm.description}
              onChange={(event) =>
                setPartnerForm({ ...partnerForm, description: event.target.value })
              }
              placeholder="Descrição curta"
              className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={partnerForm.ctaLabel}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, ctaLabel: event.target.value })
                }
                placeholder="Texto do botão"
                className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
              />
              <input
                value={partnerForm.ctaUrl}
                onChange={(event) => setPartnerForm({ ...partnerForm, ctaUrl: event.target.value })}
                placeholder="URL destino"
                className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
              />
            </div>
            <input
              value={partnerForm.imageUrl}
              onChange={(event) => setPartnerForm({ ...partnerForm, imageUrl: event.target.value })}
              placeholder="URL da imagem"
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={partnerForm.startsAt}
                onChange={(event) =>
                  setPartnerForm({ ...partnerForm, startsAt: event.target.value })
                }
                className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
              />
              <input
                type="datetime-local"
                value={partnerForm.endsAt}
                onChange={(event) => setPartnerForm({ ...partnerForm, endsAt: event.target.value })}
                className="h-11 min-w-0 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-white"
              />
            </div>
            <label className="flex min-h-11 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/90 px-3 text-xs font-black">
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
              <p className="rounded-2xl bg-red-50 p-2 text-[10px] font-semibold text-red-700">
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
                className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-black text-[#083d63] shadow-sm transition disabled:opacity-50"
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
            <p className="rounded-[22px] border border-white/70 bg-white/80 p-3 text-xs font-semibold text-muted-foreground shadow-[0_14px_40px_-24px_rgba(15,23,42,0.25)]">
              Nenhum parceiro cadastrado.
            </p>
          )}
        </section>
      </main>
    </div>
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
