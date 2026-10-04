import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, CircleAlert, Coins, Package, Save, TrendingUp } from "lucide-react";
import {
  inputClass,
  money,
  PageTitle,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/localhub/ui";
import { useLocalHub, type Service } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/precificacao")({ component: PricingPage });

function PricingPage() {
  const { business, services, ready, error, saveService, saveServiceCost } = useLocalHub();
  const [targetMargin, setTargetMargin] = useState(30);
  const [pageError, setPageError] = useState("");
  const foodBusiness = business?.category === "alimentacao";

  if (!ready) return <p className="text-sm text-slate-500">Carregando custos e preços…</p>;
  if (!foodBusiness) {
    return (
      <div className="rounded-2xl border border-[#e5e5dc] bg-white p-6 text-sm text-slate-600">
        Esta ferramenta está disponível para negócios de alimentação.
      </div>
    );
  }

  const pricedItems = services.filter((service) => service.active && service.price > 0);
  const averageMargin = pricedItems.length
    ? (pricedItems.reduce(
        (sum, item) => sum + (item.price - (item.costPrice ?? 0)) / item.price,
        0,
      ) /
        pricedItems.length) *
      100
    : 0;

  return (
    <>
      <PageTitle
        eyebrow="Gestão do cardápio"
        title="Custos e precificação"
        description="Entenda quanto custa cada item, acompanhe sua margem bruta estimada e avalie um preço de venda."
        action={
          <div className="flex items-center gap-2 rounded-xl border border-[#e5e5dc] bg-white px-3 py-2">
            <label htmlFor="target-margin" className="text-xs font-semibold text-slate-600">
              Margem desejada
            </label>
            <input
              id="target-margin"
              aria-label="Margem bruta desejada em porcentagem"
              type="number"
              min="1"
              max="99"
              step="1"
              value={targetMargin}
              onChange={(event) => setTargetMargin(Number(event.target.value))}
              className="w-16 rounded-lg border border-[#dedfd6] px-2 py-1.5 text-right text-sm font-semibold outline-none focus:border-[#8a9668]"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        }
      />

      {(pageError || error) && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {pageError || error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={Package} label="Itens ativos" value={String(pricedItems.length)} />
        <SummaryCard
          icon={Coins}
          label="Custo informado"
          value={String(services.filter((item) => (item.costPrice ?? 0) > 0).length)}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Margem bruta média"
          value={`${averageMargin.toFixed(1).replace(".", ",")}%`}
        />
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-[#e7e5d8] bg-[#f2f3ec] p-4 text-sm leading-6 text-[#626653]">
        <CircleAlert size={19} className="mt-0.5 shrink-0 text-[#778253]" />
        <p>
          Informe o custo total de uma unidade, incluindo ingredientes, embalagem e outros custos
          variáveis. A margem é uma estimativa bruta e não desconta despesas fixas, mão de obra,
          impostos, taxas de pagamento ou entrega.
        </p>
      </div>

      {services.length ? (
        <div className="space-y-4">
          {services.map((service) => (
            <PricingItem
              key={service.id}
              service={service}
              targetMargin={targetMargin}
              onSaveCost={async (cost) => {
                await saveServiceCost(service.id, cost);
                setPageError("");
              }}
              onApplyPrice={async (price) => {
                await saveService({ ...service, price });
                setPageError("");
              }}
              onError={setPageError}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Calculator size={24} className="mx-auto text-[#778253]" />
          <h2 className="mt-3 font-semibold">Adicione itens ao cardápio para começar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cada produto terá seu próprio custo e sugestão de preço.
          </p>
        </div>
      )}
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon size={15} className="text-[#778253]" /> {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#292b25]">{value}</div>
    </div>
  );
}

function PricingItem({
  service,
  targetMargin,
  onSaveCost,
  onApplyPrice,
  onError,
}: {
  service: Service;
  targetMargin: number;
  onSaveCost: (cost: number) => Promise<void>;
  onApplyPrice: (price: number) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [costInput, setCostInput] = useState(String(service.costPrice ?? 0));
  const [busy, setBusy] = useState(false);
  const cost = Number(costInput);
  const validMargin = Number.isFinite(targetMargin) && targetMargin > 0 && targetMargin < 100;
  const validCost = costInput.trim() !== "" && Number.isFinite(cost) && cost >= 0;
  const suggestedPrice =
    validCost && validMargin ? Math.ceil((cost / (1 - targetMargin / 100)) * 100) / 100 : 0;
  const unitMargin = service.price - (service.costPrice ?? 0);
  const actualMargin = service.price > 0 ? (unitMargin / service.price) * 100 : 0;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Não foi possível salvar as alterações.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-semibold text-[#292b25]">{service.name}</h2>
          <p className="mt-1 text-xs text-slate-500">Preço atual: {money(service.price)}</p>
        </div>
        <span className="rounded-full bg-[#edf0e5] px-3 py-1 text-xs font-semibold text-[#586341]">
          Margem bruta estimada: {actualMargin.toFixed(1).replace(".", ",")}%
        </span>
      </div>

      <div className="grid gap-4 py-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-slate-600">
            Custo total por unidade
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-3 text-xs text-slate-400">
              R$
            </span>
            <input
              aria-label={`Custo total por unidade de ${service.name}`}
              type="number"
              min="0"
              step="0.01"
              value={costInput}
              onChange={(event) => setCostInput(event.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </label>
        <div className="rounded-xl bg-[#f7f7f3] p-3">
          <div className="text-xs text-slate-500">Margem unitária atual</div>
          <div
            className={`mt-2 font-semibold ${unitMargin >= 0 ? "text-[#586341]" : "text-red-600"}`}
          >
            {money(unitMargin)}
          </div>
        </div>
        <div className="rounded-xl bg-[#edf0e5] p-3">
          <div className="text-xs text-[#667448]">
            Preço sugerido · {targetMargin || 0}% de margem
          </div>
          <div className="mt-2 font-semibold text-[#292b25]">
            {validMargin && validCost ? money(suggestedPrice) : "—"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy || !validCost}
          onClick={() => void run(() => onSaveCost(cost))}
          className={secondaryButtonClass}
        >
          <Save size={15} /> Salvar custo
        </button>
        <button
          type="button"
          disabled={busy || !validCost || !validMargin}
          onClick={() =>
            void run(async () => {
              await onSaveCost(cost);
              await onApplyPrice(suggestedPrice);
            })
          }
          className={primaryButtonClass}
        >
          <Calculator size={15} /> Aplicar preço sugerido
        </button>
      </div>
    </article>
  );
}
