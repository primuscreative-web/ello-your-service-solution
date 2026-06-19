export type WalletView = {
  gatewayStatus: "disconnected" | "connected";
  availableCents: number;
  pendingCents: number;
  canWithdraw: boolean;
  transactions: Array<{
    id: string;
    label: string;
    amountCents: number;
    createdAt: string;
    status: "pending" | "completed" | "failed";
  }>;
};

export function createDisabledWalletView(): WalletView {
  return {
    gatewayStatus: "disconnected",
    availableCents: 0,
    pendingCents: 0,
    canWithdraw: false,
    transactions: [],
  };
}

export function formatWalletCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}
