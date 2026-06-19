import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  MessageCircle,
  Star,
} from "lucide-react";
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
  const notificationsQuery = useQuery({
    queryKey: ["ello", "me", "notifications", user?.id],
    queryFn: () => listMyNotifications(user!.id),
    enabled: Boolean(configured && user),
  });
  const notifications = notificationsQuery.data ?? [];

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Notificações</h1>
        <span className="size-10" />
      </header>

      <div className="grid grid-cols-2 border-b border-border text-center text-sm font-bold">
        <span className="border-b-2 border-primary py-4 text-primary">Todas</span>
        <span className="py-4 text-muted-foreground">Não lidas</span>
      </div>

      <main>
        {!configured || !user ? (
          <EmptyState text="Entre na sua conta para acompanhar suas atualizações." />
        ) : notificationsQuery.isPending ? (
          <EmptyState text="Carregando notificações..." />
        ) : notifications.length ? (
          notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))
        ) : (
          <EmptyState text="Suas atualizações de orçamentos e agendamentos aparecerão aqui." />
        )}
      </main>
    </div>
  );
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
  const Icon = ICONS[notification.kind];
  return (
    <Link to={notification.href} className="flex gap-3 border-b border-border px-5 py-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{notification.title}</strong>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
          {notification.description}
        </span>
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {notification.timestamp}
        </span>
      </span>
      <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <section className="px-8 py-20 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Bell className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-black">Tudo em dia</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </section>
  );
}
