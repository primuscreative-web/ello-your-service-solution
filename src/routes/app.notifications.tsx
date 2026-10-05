import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BriefcaseBusiness, CalendarDays, CheckCheck, MessageCircle, Star } from "lucide-react";
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

const READ_STORAGE_KEY = "ello_read_notifications_v1";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function NotificationsScreen() {
  const { configured, user } = useAuth();
  const [tab, setTab] = useState("all");
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  const notificationsQuery = useQuery({
    queryKey: ["ello", "me", "notifications", user?.id],
    queryFn: () => listMyNotifications(user!.id),
    enabled: Boolean(configured && user),
  });

  const allNotifications = notificationsQuery.data ?? [];

  const unreadNotifications = useMemo(() => {
    return allNotifications.filter((n) => !readIds.has(n.id));
  }, [allNotifications, readIds]);

  const displayedNotifications = tab === "unread" ? unreadNotifications : allNotifications;

  function markAsRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }

  function markAllAsRead() {
    const allIds = new Set(allNotifications.map((n) => n.id));
    setReadIds(allIds);
    saveReadIds(allIds);
  }

  return (
    <ScreenPage>
      <ScreenHeader
        title="Notificações"
        subtitle="Atualizações da sua conta"
        backTo="/app"
        action={
          unreadNotifications.length > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Marcar lidas
            </button>
          ) : undefined
        }
      />

      <ScreenTabs
        tabs={[
          { value: "all", label: `Todas (${allNotifications.length})` },
          { value: "unread", label: `Não lidas (${unreadNotifications.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScreenMain className="!space-y-0 !px-0">
        {!configured || !user ? (
          <div className="px-4 py-8">
            <EmptyState text="Entre na sua conta para acompanhar suas atualizações." />
          </div>
        ) : notificationsQuery.isPending ? (
          <div className="px-4 py-8">
            <EmptyState text="Carregando notificações..." />
          </div>
        ) : displayedNotifications.length ? (
          <div className="divide-y divide-border/60">
            {displayedNotifications.map((notification) => {
              const isUnread = !readIds.has(notification.id);
              return (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  isUnread={isUnread}
                  onMarkRead={() => markAsRead(notification.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-8">
            <EmptyState
              text={
                tab === "unread"
                  ? "Você leu todas as notificações recentes!"
                  : "Suas atualizações de orçamentos e agendamentos aparecerão aqui."
              }
            />
          </div>
        )}
      </ScreenMain>
    </ScreenPage>
  );
}

function NotificationRow({
  notification,
  isUnread,
  onMarkRead,
}: {
  notification: NotificationItem;
  isUnread: boolean;
  onMarkRead: () => void;
}) {
  const Icon = ICONS[notification.kind];
  return (
    <Link
      to={notification.href}
      onClick={onMarkRead}
      className={`flex gap-3 px-4 py-4 transition-colors hover:bg-white/50 ${
        isUnread ? "bg-primary/5" : ""
      }`}
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
      {isUnread && (
        <span className="mt-3 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_oklch(0.56_0.24_264_/_0.5)]" />
      )}
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <EmptyStateCard icon={<Bell className="size-6" />} title="Tudo em dia" description={text} />
  );
}
