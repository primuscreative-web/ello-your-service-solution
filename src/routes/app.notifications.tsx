import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BriefcaseBusiness, CalendarDays, MessageCircle, Star } from "lucide-react";
import { ElloEyebrow } from "@/components/ello/primitives";
import {
  EmptyStateCard,
  ScreenHeader,
  ScreenMain,
  ScreenPage,
  ScreenTabs,
} from "@/components/ello/screen-layout";
import { useAuth } from "@/lib/auth/auth-context";
import { listMyNotifications, type NotificationItem } from "@/lib/ello-repository";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsScreen,
});

const ICONS = {
  appointment: CalendarDays,
  message: MessageCircle,
  professional: BriefcaseBusiness,
  promotion: Star,
  quote: Bell,
} as const;

function NotificationsScreen() {
  const { configured, user } = useAuth();
  const [tab, setTab] = useState("all");
  const notificationsQuery = useQuery({
    queryKey: ["ello", "me", "notifications", user?.id],
    queryFn: () => listMyNotifications(user!.id),
    enabled: Boolean(configured && user),
  });
  const notifications = notificationsQuery.data ?? [];

  return (
    <ScreenPage>
      <ScreenHeader title="Notificações" subtitle="Atualizações da sua conta" backTo="/app" />

      <ScreenTabs
        tabs={[
          { value: "all", label: "Todas" },
          { value: "unread", label: "Não lidas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScreenMain className="!space-y-0 !px-0">
        {!configured || !user ? (
          <div className="px-4">
            <EmptyState text="Entre na sua conta para acompanhar suas atualizações." />
          </div>
        ) : notificationsQuery.isPending ? (
          <div className="px-4">
            <EmptyState text="Carregando notificações..." />
          </div>
        ) : tab === "unread" ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <ElloEyebrow className="mb-3">Em breve</ElloEyebrow>
            <p>Marcação de lidas será habilitada na próxima versão.</p>
          </div>
        ) : notifications.length ? (
          <div className="divide-y divide-border/60">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <div className="px-4">
            <EmptyState text="Suas atualizações de orçamentos e agendamentos aparecerão aqui." />
          </div>
        )}
      </ScreenMain>
    </ScreenPage>
  );
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const Icon = ICONS[notification.kind];
  return (
    <Link
      to={notification.href}
      className="flex gap-3 px-4 py-4 transition-colors hover:bg-white/50"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-black">{notification.title}</strong>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
          {notification.description}
        </span>
        <span className="mt-1.5 block text-[11px] font-medium text-muted-foreground/80">
          {notification.timestamp}
        </span>
      </span>
      <span className="mt-3 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_oklch(0.56_0.24_264_/_0.5)]" />
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <EmptyStateCard icon={<Bell className="size-6" />} title="Tudo em dia" description={text} />
  );
}
