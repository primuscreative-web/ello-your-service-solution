import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, CreditCard, Landmark, WalletCards } from "lucide-react";
import { ElloInfoBanner, ElloSurface } from "@/components/ello/primitives";
import { ScreenHeader, ScreenMain, ScreenPage } from "@/components/ello/screen-layout";
import { PAYMENT_POLICY } from "@/lib/payments/payment-policy";
import { createDisabledWalletView, formatWalletCurrency } from "@/lib/wallet";

export const Route = createFileRoute("/app/wallet")({
  component: WalletScreen,
});

function WalletScreen() {
  const wallet = createDisabledWalletView();

  return (
    <ScreenPage>
      <ScreenHeader title="Carteira ELLO" subtitle="Pagamentos e saldo" backTo="/app/profile" />

      <ScreenMain>
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[oklch(0.42_0.2_264)] via-[oklch(0.32_0.14_264)] to-[oklch(0.22_0.08_264)] p-5 text-white shadow-[0_28px_80px_-24px_oklch(0.32_0.14_264_/_0.55)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                Saldo disponível
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-tight">
                {formatWalletCurrency(wallet.availableCents)}
              </h2>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/10 p-3 backdrop-blur-sm">
              <WalletCards className="size-7 text-white/85" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
            <MiniBalance label="Pendente" value={formatWalletCurrency(wallet.pendingCents)} />
            <MiniBalance label="Gateway" value="Desconectado" />
          </div>
        </section>

        <ElloInfoBanner
          icon={<CreditCard className="size-5" />}
          eyebrow="Em preparação"
          title="Gateway ainda não conectado"
          body={PAYMENT_POLICY.professionalPaymentNotice}
        />

        <ElloSurface className="p-4">
          <h2 className="ello-section-title">Ações rápidas</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <DisabledAction icon={Banknote} label="Pix" />
            <DisabledAction icon={Landmark} label="Banco" />
            <DisabledAction icon={CreditCard} label="Sacar" />
          </div>
        </ElloSurface>

        <ElloSurface className="p-4">
          <h2 className="ello-section-title">Histórico</h2>
          <p className="mt-4 rounded-[1.25rem] bg-secondary/80 p-4 text-center text-sm text-muted-foreground">
            Nenhuma transação será exibida até o gateway ser conectado.
          </p>
        </ElloSurface>
      </ScreenMain>
    </ScreenPage>
  );
}

function MiniBalance({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/65">{label}</p>
      <strong className="mt-1 block text-sm font-bold">{value}</strong>
    </div>
  );
}

function DisabledAction({ icon: Icon, label }: { icon: typeof Banknote; label: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex h-20 flex-col items-center justify-center gap-2 rounded-[1.125rem] border border-border/60 bg-secondary/50 text-xs font-bold text-muted-foreground"
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
