import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Camera,
  ChevronRight,
  CircleHelp,
  FileClock,
  Heart,
  LockKeyhole,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
  UserRoundCog,
  WalletCards,
} from "lucide-react";
import { AvatarPhoto } from "@/components/ello/media";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMyClientProfile,
  updateMyClientProfile,
  updateMyUserProfile,
} from "@/lib/ello-repository";

export const Route = createFileRoute("/app/profile")({
  component: ProfileScreen,
});

const MENU = [
  { icon: Heart, label: "Favoritos", to: "/app/favorites" },
  { icon: FileClock, label: "Histórico de solicitações", to: "/app/requests" },
  { icon: MessageCircle, label: "Mensagens", to: "/app/messages" },
  { icon: Bell, label: "Notificações", to: "/app/notifications" },
] as const;

function ProfileScreen() {
  const { configured, loading, profile, refreshProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? user?.email ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [city, setCity] = useState("São Paulo, SP");
  const [region, setRegion] = useState("");
  const [interests, setInterests] = useState("");
  const clientProfileQuery = useQuery({
    queryKey: ["ello", "me", "client-profile", user?.id],
    queryFn: () => getMyClientProfile(user!.id),
    enabled: Boolean(configured && user),
  });
  const previewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url),
    [avatarFile, profile?.avatar_url],
  );

  useEffect(() => {
    const clientProfile = clientProfileQuery.data;
    if (!clientProfile) return;
    setCity(clientProfile.city || "São Paulo, SP");
    setRegion(clientProfile.region ?? "");
    setInterests(clientProfile.interests ?? "");
  }, [clientProfileQuery.data]);

  useEffect(() => {
    if (!avatarFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile, previewUrl]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Entre na sua conta para atualizar o perfil.");
      await updateMyUserProfile({
        userId: user.id,
        fullName,
        avatarFile,
        avatarUrl: profile?.avatar_url ?? null,
      });
      await updateMyClientProfile({
        userId: user.id,
        city,
        region,
        interests,
      });
    },
    onSuccess: async () => {
      setAvatarFile(null);
      setEditing(false);
      await Promise.all([
        refreshProfile(),
        queryClient.invalidateQueries({
          queryKey: ["ello", "me", "client-profile", user?.id],
        }),
      ]);
    },
  });

  const displayName = profile?.full_name || user?.email || "Perfil ELLO";
  const initials = initialsFor(displayName);

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center justify-between px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <h1 className="text-xl font-black">Meu perfil</h1>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="text-sm font-bold text-primary"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </header>

      <main className="px-5">
        <section className="flex flex-col items-center border-b border-border pb-6 text-center">
          <label className="relative">
            <AvatarPhoto imageUrl={previewUrl} initials={initials} size={88} />
            {editing ? (
              <>
                <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-primary text-white ring-2 ring-white">
                  <Camera className="size-4" />
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                />
              </>
            ) : null}
          </label>
          <h2 className="mt-4 text-lg font-black">{displayName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.email ?? "Conta não conectada"}
          </p>
          <span className="mt-3 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {profile?.role === "professional" ? "Modo profissional" : "Modo cliente"}
          </span>
        </section>

        {editing ? (
          <section className="space-y-4 border-b border-border py-6">
            <ProfileField label="Nome" value={fullName} onChange={setFullName} />
            <ProfileField label="Cidade" value={city} onChange={setCity} />
            <ProfileField label="Região" value={region} onChange={setRegion} />
            <label className="block">
              <span className="text-sm font-black">Interesses</span>
              <textarea
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
                className="mt-2 min-h-24 w-full resize-none rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
              />
            </label>
            {mutation.error ? (
              <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {mutation.error.message}
              </p>
            ) : null}
            <button
              disabled={
                !configured ||
                !user ||
                loading ||
                mutation.isPending ||
                !fullName.trim() ||
                !city.trim()
              }
              onClick={() => mutation.mutate()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-45"
            >
              <Save className="size-4" />
              {mutation.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </section>
        ) : null}

        <section className="divide-y divide-border py-3">
          {MENU.map((item) => (
            <MenuLink key={item.label} {...item} />
          ))}
          <MenuLink icon={WalletCards} label="Carteira ELLO" to="/app/wallet" />
          <MenuLink icon={UserRoundCog} label="Alternar modo" to="/role" />
          <MenuLink icon={Settings} label="Configurações" to="/app/settings" />
        </section>

        <section className="rounded-2xl bg-secondary p-4">
          <div className="flex items-start gap-3">
            <WalletCards className="mt-0.5 size-5 text-primary" />
            <div>
              <h2 className="text-sm font-black">Pagamentos em preparação</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                A Carteira ELLO será ativada quando o gateway de pagamentos for conectado.
              </p>
            </div>
          </div>
        </section>

        {profile?.role === "admin" ? (
          <Link
            to="/app/admin"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-border p-4"
          >
            <ShieldCheck className="size-5 text-primary" />
            <span className="flex-1 text-sm font-bold">Painel administrativo</span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-xs font-bold">
            <LockKeyhole className="size-4" />
            Privacidade
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-xs font-bold">
            <CircleHelp className="size-4" />
            Ajuda
          </button>
        </div>
      </main>
    </div>
  );
}

function ProfileField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function MenuLink({ icon: Icon, label, to }: { icon: typeof Heart; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 py-4">
      <Icon className="size-5 text-foreground/80" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ChevronRight className="size-5 text-muted-foreground" />
    </Link>
  );
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
