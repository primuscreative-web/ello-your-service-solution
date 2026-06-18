import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Camera,
  FileText,
  Heart,
  HelpCircle,
  History,
  Lock,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { AppTopBar, Metric, ProPhoto } from "@/components/ello/mobile-ui";
import {
  getMyClientProfile,
  updateMyClientProfile,
  updateMyUserProfile,
} from "@/lib/ello-repository";
import { useAuth } from "@/lib/auth/auth-context";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

const MENU = [
  { icon: Heart, label: "Favoritos", to: "/app/favorites" },
  { icon: History, label: "Historico de solicitacoes", to: "/app/requests" },
  { icon: FileText, label: "Combinados de servico", to: "/app/messages" },
  { icon: Bell, label: "Notificacoes" },
  { icon: Lock, label: "Privacidade" },
  { icon: Settings, label: "Configuracoes" },
  { icon: HelpCircle, label: "Ajuda" },
];

function Profile() {
  const queryClient = useQueryClient();
  const { configured, loading, profile, refreshProfile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? user?.email ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [clientCity, setClientCity] = useState("Sao Paulo, SP");
  const [clientRegion, setClientRegion] = useState("");
  const [clientInterests, setClientInterests] = useState("");

  const clientProfileQuery = useQuery({
    queryKey: ["ello", "me", "client-profile", user?.id],
    queryFn: () => getMyClientProfile(user!.id),
    enabled: Boolean(configured && user),
  });

  const previewUrl = useMemo(() => {
    if (!avatarFile) return profile?.avatar_url ?? null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile, profile?.avatar_url]);

  useEffect(() => {
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
  }, [fullName, profile?.full_name]);

  useEffect(() => {
    const clientProfile = clientProfileQuery.data;
    if (!clientProfile) return;
    setClientCity(clientProfile.city ?? "Sao Paulo, SP");
    setClientRegion(clientProfile.region ?? "");
    setClientInterests(clientProfile.interests ?? "");
  }, [clientProfileQuery.data]);

  useEffect(() => {
    if (!avatarFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile, previewUrl]);

  const initials = useMemo(() => {
    const name = fullName || profile?.full_name || user?.email || "ELLO";
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [fullName, profile?.full_name, user?.email]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Entre na sua conta para atualizar o perfil.");
      const updatedProfile = await updateMyUserProfile({
        userId: user.id,
        fullName,
        avatarFile,
        avatarUrl: profile?.avatar_url ?? null,
      });

      await updateMyClientProfile({
        userId: user.id,
        city: clientCity,
        region: clientRegion,
        interests: clientInterests,
      });

      return updatedProfile;
    },
    onSuccess: async () => {
      setAvatarFile(null);
      await Promise.all([
        refreshProfile(),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "client-profile", user?.id],
        }),
      ]);
    },
  });

  const roleLabel = profile?.role === "professional" ? "Profissional" : "Cliente";
  const displayName = profile?.full_name ?? user?.email ?? "Perfil ELLO";

  return (
    <div>
      <AppTopBar title="Meu Perfil" subtitle={roleLabel} />

      <main className="space-y-4 px-4 pb-6 pt-4">
        <section className="ello-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <label className="group relative cursor-pointer">
              <ProPhoto initials={initials} imageUrl={previewUrl} size={72} />
              <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-primary text-white shadow-md ring-2 ring-white">
                <Camera className="size-4" />
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={!configured || !user || mutation.isPending}
                onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black">{displayName}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email ?? "Conta ainda nao conectada"}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-[#083d63] px-3 py-1 text-[10px] font-black text-white">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-[11px] font-black uppercase text-muted-foreground">
              Nome publico
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Seu nome"
              disabled={!configured || !user || mutation.isPending}
              className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-muted-foreground">
                Cidade
              </label>
              <input
                value={clientCity}
                onChange={(event) => setClientCity(event.target.value)}
                placeholder="Sao Paulo, SP"
                disabled={!configured || !user || mutation.isPending}
                className="h-11 min-w-0 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-muted-foreground">
                Regiao
              </label>
              <input
                value={clientRegion}
                onChange={(event) => setClientRegion(event.target.value)}
                placeholder="Zona Sul"
                disabled={!configured || !user || mutation.isPending}
                className="h-11 min-w-0 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-[11px] font-black uppercase text-muted-foreground">
              Interesses
            </label>
            <textarea
              value={clientInterests}
              onChange={(event) => setClientInterests(event.target.value)}
              placeholder="Ex: eletricista, diarista, manutencao residencial"
              disabled={!configured || !user || mutation.isPending}
              className="min-h-20 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {mutation.error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {mutation.error.message}
            </p>
          ) : null}
          {mutation.isSuccess ? (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              Perfil atualizado com sucesso.
            </p>
          ) : null}

          <button
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-black text-white disabled:opacity-50"
            disabled={
              !configured ||
              !user ||
              loading ||
              mutation.isPending ||
              !fullName.trim() ||
              !clientCity.trim()
            }
            onClick={() => mutation.mutate()}
          >
            <Save className="size-4" />
            {mutation.isPending ? "Salvando..." : "Salvar perfil"}
          </button>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <Metric value="12" label="Contratacoes" />
          <Metric value="4" label="Em andamento" />
          <Metric value="8" label="Avaliacoes" />
        </div>

        <Link to="/app/business" className="ello-header block rounded-xl p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Novo</p>
          <h2 className="mt-1 text-base font-black">Ative seu perfil profissional</h2>
          <p className="mt-1 text-xs text-white/75">Comece a oferecer servicos hoje</p>
        </Link>

        {profile?.role === "admin" ? (
          <Link
            to="/app/admin"
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4 text-[#083d63]"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-white text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">Painel Administrativo</span>
              <span className="text-xs font-semibold text-muted-foreground">
                Aprovar monetizacao e parceiros locais
              </span>
            </span>
          </Link>
        ) : null}

        <section className="ello-card rounded-xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#083d63]">
            Pagamento fora da plataforma
          </p>
          <h2 className="mt-1 text-sm font-black text-[#083d63]">Sem carteira ELLO nesta fase</h2>
          <p className="mt-1 text-xs leading-relaxed text-sky-900">
            {PAYMENT_POLICY.quotePaymentNotice}
          </p>
        </section>

        <section className="ello-card rounded-xl p-2">
          {MENU.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="size-5 text-[#083d63]" />
                <span className="flex-1 text-xs font-bold">{item.label}</span>
                <span className="text-muted-foreground">{">"}</span>
              </>
            );
            if (item.to) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left active:bg-muted"
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left active:bg-muted"
              >
                {content}
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
