// ELLO Service Worker — Notificações em Segundo Plano & PWA

const CACHE_NAME = "ello-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Tratamento de notificações em tempo real (Web Push)
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "🔔 Novo Pedido no ELLO!", body: event.data ? event.data.text() : "Novo pedido aguardando aceite." };
  }

  const title = data.title || "🔔 Novo Pedido Recebido!";
  const options = {
    body: data.body || "Toque para abrir a cozinha e aceitar o pedido.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [300, 150, 300, 150, 600],
    tag: data.tag || "ello-order-alert",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/studio/pedidos",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ação de clique na notificação nativa
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/studio/pedidos";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/studio/pedidos") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
