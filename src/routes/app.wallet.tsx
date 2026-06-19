import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, ChevronLeft, CreditCard, Landmark, WalletCards } from "lucide-react";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";
import { createDisabledWalletView, formatWalletCurrency } from "@/lib/wallet";

export const Route = createFileRoute("/app/wallet")({
  component: WalletScreen,
});

function WalletScreen() {
  const wallet = createDisabledWalletView();

  return (
    <div className="min-h-dvh bg-white pb-24">
      <header className="flex items-center border-b border-border px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Link to="/app/profile" aria-label="Voltar" className="grid size-10 place-items-center">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-black">Carteira ELLO</h1>
        <span className="size-10" />
      </header>

      <main className="space-y-5 px-5 py-5">
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-white/75">Saldo disponÃ­vel</p>
              <h2 className="mt-2 text-4xl font-black">
                {formatWalletCurrency(wallet.availableCents)}
              </h2>
            </div>
            <WalletCards className="size-7 text-white/80" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
            <MiniBalance label="Pendente" value={formatWalletCurrency(wallet.pendingCents)} />
            <MiniBalance label="Gateway" value="Desconectado" />
          </div>
        </section>

        <section className="rounded-3xl border border-border p-4">
          <h2 className="text-base font-black">Gateway ainda nÃ£o conectado</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {PAYMENT_POLICY.professionalPaymentNotice}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <DisabledAction icon={Banknote} label="Pix" />
            <DisabledAction icon={Landmark} label="Banco" />
            <DisabledAction icon={CreditCard} label="Sacar" />
          </div>
        </section>

        <section className="rounded-3xl border border-border p-4">
          <h2 className="text-base font-black">HistÃ³rico</h2>
          {wallet.transactions.length ? null : (
            <p className="mt-4 rounded-2xl bg-secondary p-4 text-center text-sm text-muted-foreground">
              Nenhuma transaÃ§Ã£o serÃ¡ exibida atÃ© o gateway ser conectado.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function MiniBalance({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/70">{label}</p>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}

function DisabledAction({ icon: Icon, label }: { icon: typeof Banknote; label: string }) {
  return (
    <button
      disabled
      className="flex h-20 flex-col items-center justify-center gap-2 rounded-2xl bg-secondary text-xs font-bold text-muted-foreground"
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
