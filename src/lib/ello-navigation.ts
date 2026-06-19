export type AppMode = "client" | "professional";

const CLIENT_ITEMS = [
  { label: "Início", to: "/app", icon: "home" },
  { label: "Busca", to: "/app/search", icon: "search" },
  { label: "Favoritos", to: "/app/favorites", icon: "heart" },
  { label: "Mensagens", to: "/app/messages", icon: "message" },
  { label: "Perfil", to: "/app/profile", icon: "user" },
] as const;

const PROFESSIONAL_ITEMS = [
  { label: "Início", to: "/app/business", icon: "home" },
  { label: "Agenda", to: "/app/agenda", icon: "calendar" },
  { label: "Clientes", to: "/app/business/clients", icon: "users" },
  { label: "Orçamentos", to: "/app/business/quotes", icon: "receipt" },
  { label: "Mais", to: "/app/settings", icon: "menu" },
] as const;

export function getBottomNavigation(mode: AppMode) {
  return mode === "professional" ? PROFESSIONAL_ITEMS : CLIENT_ITEMS;
}
