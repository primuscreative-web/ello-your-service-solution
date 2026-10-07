import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calculator,
  CircleAlert,
  Coins,
  Package,
  Save,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Scissors,
  Check,
  Search,
  DollarSign,
  ArrowRight,
  X,
  Info,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  inputClass,
  money,
  PageTitle,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/localhub/ui";
import {
  useLocalHub,
  type Service,
  type ProductSupply,
  type ServiceSupplyUsage,
} from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/precificacao")({ component: PricingPage });

const DEFAULT_BEAUTY_SUPPLIES: Omit<ProductSupply, "id">[] = [
  {
    name: "Gel Construtor Pink Hard (30g)",
    category: "Unhas & Manicure",
    brand: "Vòlia",
    purchasePrice: 89.9,
    packageQuantity: 15,
    unitMeasure: "aplicações",
    costPerUnit: 5.99,
    notes: "Rendimento médio de 15 procedimentos completos de fibra ou gel.",
  },
  {
    name: "Kit Descartável Manicure (Lixa + Palito)",
    category: "Descartáveis & Biossegurança",
    brand: "Santa Clara",
    purchasePrice: 45.0,
    packageQuantity: 50,
    unitMeasure: "unidades",
    costPerUnit: 0.9,
    notes: "1 kit individual descartável por atendimento.",
  },
  {
    name: "Máscara Reconstrutora / Hidratação (1kg)",
    category: "Cabelo & Química",
    brand: "Wella / Truss",
    purchasePrice: 135.0,
    packageQuantity: 30,
    unitMeasure: "aplicações",
    costPerUnit: 4.5,
    notes: "Dose média de 30g a 35g por hidratação capilar.",
  },
  {
    name: "Pó Descolorante Dust Free (500g)",
    category: "Cabelo & Química",
    brand: "Schwarzkopf",
    purchasePrice: 79.0,
    packageQuantity: 10,
    unitMeasure: "aplicações",
    costPerUnit: 7.9,
    notes: "Dose de 50g para mechas ou descoloração.",
  },
  {
    name: "Ácido Hialurônico / Sérum Facial (50ml)",
    category: "Estética Facial",
    brand: "Dermage",
    purchasePrice: 110.0,
    packageQuantity: 25,
    unitMeasure: "aplicações",
    costPerUnit: 4.4,
    notes: "2ml por sessão de higienização ou revitalização facial.",
  },
  {
    name: "Cera Depilatória Quente (1kg)",
    category: "Depilação",
    brand: "Depilflax",
    purchasePrice: 58.0,
    packageQuantity: 20,
    unitMeasure: "aplicações",
    costPerUnit: 2.9,
    notes: "Uso fracionado por região depilada.",
  },
  {
    name: "Lâminas de Barbearia (Caixa c/ 100 un)",
    category: "Barbearia",
    brand: "Wilkinson / Derby",
    purchasePrice: 38.0,
    packageQuantity: 100,
    unitMeasure: "unidades",
    costPerUnit: 0.38,
    notes: "1 meia-lâmina descartável por barboterapia ou acabamento.",
  },
  {
    name: "Luvas de Nitrilo Rosa/Preta (Caixa c/ 100 un)",
    category: "Descartáveis & Biossegurança",
    brand: "Unigloves",
    purchasePrice: 42.0,
    packageQuantity: 50,
    unitMeasure: "pares",
    costPerUnit: 0.84,
    notes: "1 par de luvas de proteção por atendimento.",
  },
];

const SUPPLY_CATEGORIES = [
  "Todas",
  "Unhas & Manicure",
  "Cabelo & Química",
  "Estética Facial",
  "Barbearia",
  "Depilação",
  "Descartáveis & Biossegurança",
  "Geral / Outros",
] as const;

function PricingPage() {
  const {
    business,
    services,
    ready,
    error,
    saveService,
    saveServiceCost,
    saveSupplies,
    saveServiceSupplyFormula,
  } = useLocalHub();

  const isFoodBusiness = business?.category === "alimentacao";

  if (!ready) {
    return <p className="text-sm text-slate-500">Carregando custos e preços…</p>;
  }

  if (isFoodBusiness) {
    return (
      <FoodPricingManager
        services={services}
        saveService={saveService}
        saveServiceCost={saveServiceCost}
        error={error}
      />
    );
  }

  return (
    <BeautySuppliesAndPricingManager
      business={business}
      services={services}
      saveService={saveService}
      saveServiceCost={saveServiceCost}
      saveSupplies={saveSupplies}
      saveServiceSupplyFormula={saveServiceSupplyFormula}
      contextError={error}
    />
  );
}

// =========================================================================
// MÓDULO EXCLUSIVO DE BELEZA, ESTÉTICA, BARBEARIA & SERVIÇOS
// =========================================================================

function BeautySuppliesAndPricingManager({
  business,
  services,
  saveService,
  saveServiceCost,
  saveSupplies,
  saveServiceSupplyFormula,
  contextError,
}: {
  business: any;
  services: Service[];
  saveService: (service: Omit<Service, "id"> & { id?: string }) => Promise<void>;
  saveServiceCost: (serviceId: string, costPrice: number) => Promise<void>;
  saveSupplies: (supplies: ProductSupply[]) => Promise<void>;
  saveServiceSupplyFormula: (
    serviceId: string,
    usages: ServiceSupplyUsage[],
    calculatedCost?: number,
  ) => Promise<void>;
  contextError: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"supplies" | "formulas" | "simulator">("supplies");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [editingSupply, setEditingSupply] = useState<ProductSupply | null>(null);
  const [busy, setBusy] = useState(false);
  const [targetMargin, setTargetMargin] = useState(80);

  // Lista atual de insumos
  const supplies: ProductSupply[] = business?.onboardingDetails?.supplies ?? [];
  const formulas: Record<string, ServiceSupplyUsage[]> =
    business?.onboardingDetails?.serviceSupplyFormulas ?? {};

  // Form State para Insumo
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Unhas & Manicure");
  const [formBrand, setFormBrand] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formPackageQty, setFormPackageQty] = useState("");
  const [formUnitMeasure, setFormUnitMeasure] = useState("aplicações");
  const [formNotes, setFormNotes] = useState("");

  const openNewSupplyForm = () => {
    setEditingSupply(null);
    setFormName("");
    setFormCategory("Unhas & Manicure");
    setFormBrand("");
    setFormPurchasePrice("");
    setFormPackageQty("");
    setFormUnitMeasure("aplicações");
    setFormNotes("");
    setShowSupplyForm(true);
  };

  const openEditSupplyForm = (item: ProductSupply) => {
    setEditingSupply(item);
    setFormName(item.name);
    setFormCategory(item.category ?? "Unhas & Manicure");
    setFormBrand(item.brand ?? "");
    setFormPurchasePrice(String(item.purchasePrice));
    setFormPackageQty(String(item.packageQuantity));
    setFormUnitMeasure(item.unitMeasure);
    setFormNotes(item.notes ?? "");
    setShowSupplyForm(true);
  };

  // Cálculo prévio em tempo real
  const currentPurchasePrice = Number(formPurchasePrice || 0);
  const currentPackageQty = Number(formPackageQty || 0);
  const currentCostPerUnit =
    currentPackageQty > 0 ? currentPurchasePrice / currentPackageQty : 0;

  // Salvar insumo
  const handleSaveSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Informe o nome do produto/insumo.");
      return;
    }
    if (currentPurchasePrice <= 0) {
      toast.error("Informe o valor de compra da embalagem.");
      return;
    }
    if (currentPackageQty <= 0) {
      toast.error("Informe a quantidade ou rendimento da embalagem.");
      return;
    }

    const calculatedCost = Math.round((currentPurchasePrice / currentPackageQty) * 100) / 100;

    setBusy(true);
    try {
      let updatedSupplies: ProductSupply[];
      if (editingSupply) {
        updatedSupplies = supplies.map((s) =>
          s.id === editingSupply.id
            ? {
                ...s,
                name: formName.trim(),
                category: formCategory,
                brand: formBrand.trim() || undefined,
                purchasePrice: currentPurchasePrice,
                packageQuantity: currentPackageQty,
                unitMeasure: formUnitMeasure.trim() || "aplicações",
                costPerUnit: calculatedCost,
                notes: formNotes.trim() || undefined,
              }
            : s,
        );
        toast.success(`Insumo "${formName}" atualizado com sucesso!`);
      } else {
        const newSupply: ProductSupply = {
          id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: formName.trim(),
          category: formCategory,
          brand: formBrand.trim() || undefined,
          purchasePrice: currentPurchasePrice,
          packageQuantity: currentPackageQty,
          unitMeasure: formUnitMeasure.trim() || "aplicações",
          costPerUnit: calculatedCost,
          notes: formNotes.trim() || undefined,
        };
        updatedSupplies = [...supplies, newSupply];
        toast.success(`Insumo "${formName}" adicionado à sua bancada!`);
      }

      await saveSupplies(updatedSupplies);
      setShowSupplyForm(false);
      setEditingSupply(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao salvar produto.");
    } finally {
      setBusy(false);
    }
  };

  // Excluir insumo
  const handleDeleteSupply = async (id: string, name: string) => {
    if (!confirm(`Deseja remover o insumo "${name}"?`)) return;
    setBusy(true);
    try {
      const filtered = supplies.filter((s) => s.id !== id);
      await saveSupplies(filtered);
      toast.success("Insumo removido com sucesso.");
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao remover insumo.");
    } finally {
      setBusy(false);
    }
  };

  // Carregar exemplos prontos de beleza
  const handleLoadDefaults = async () => {
    setBusy(true);
    try {
      const generated = DEFAULT_BEAUTY_SUPPLIES.map((item, idx) => ({
        ...item,
        id: `sup_def_${Date.now()}_${idx}`,
      }));
      const merged = [...supplies, ...generated];
      await saveSupplies(merged);
      toast.success("8 insumos essenciais de beleza e estética carregados!");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao carregar exemplos.");
    } finally {
      setBusy(false);
    }
  };

  // Métricas Globais
  const totalInvested = supplies.reduce((acc, s) => acc + (s.purchasePrice || 0), 0);
  const averageProductPrice = supplies.length > 0 ? totalInvested / supplies.length : 0;
  const averageCostPerUnit =
    supplies.length > 0
      ? supplies.reduce((acc, s) => acc + (s.costPerUnit || 0), 0) / supplies.length
      : 0;

  const servicesWithCosts = services.filter((s) => (s.costPrice ?? 0) > 0);
  const averageServicesMargin =
    servicesWithCosts.length > 0
      ? servicesWithCosts.reduce((acc, s) => {
          const cost = s.costPrice ?? 0;
          return s.price > 0 ? acc + ((s.price - cost) / s.price) * 100 : acc;
        }, 0) / servicesWithCosts.length
      : 0;

  // Filtragem
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const matchesCategory =
        categoryFilter === "Todas" || s.category === categoryFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.brand && s.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [supplies, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Beleza, Barbearia & Estética"
        title="Custos de Produtos & Insumos"
        description="Cadastre os cosméticos da bancada, acompanhe o rendimento por quantidade e descubra o custo médio por aplicação e a margem de cada procedimento."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {supplies.length === 0 && (
              <button
                type="button"
                onClick={handleLoadDefaults}
                disabled={busy}
                className={secondaryButtonClass}
              >
                <Sparkles size={15} className="text-[#687348]" />
                Carregar Insumos Sugeridos
              </button>
            )}
            <button
              type="button"
              onClick={openNewSupplyForm}
              className={primaryButtonClass}
            >
              <Plus size={16} />
              Novo Produto / Insumo
            </button>
          </div>
        }
      />

      {contextError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {contextError}
        </div>
      )}

      {/* CARDS DE RESUMO DE MÉDIAS E CUSTOS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Package size={16} className="text-[#778253]" />
            Total de Insumos
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#292b25]">
            {supplies.length}{" "}
            <span className="text-xs font-normal text-slate-400">produtos</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Itens e descartáveis cadastrados
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Coins size={16} className="text-[#778253]" />
            Investimento em Estoque
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#292b25]">
            {money(totalInvested)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Soma de aquisição das embalagens
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Calculator size={16} className="text-[#778253]" />
            Custo Médio por Produto
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#292b25]">
            {money(averageProductPrice)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Média de preço por pote/embalagem
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs bg-emerald-50/30 border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <TrendingUp size={16} className="text-emerald-600" />
            Custo Médio por Aplicação
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-900">
            {money(averageCostPerUnit)}
            <span className="text-xs font-normal text-emerald-700"> / dose</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700">
            Média de custo unitário por uso
          </p>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("supplies")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition ${
            activeTab === "supplies"
              ? "border-[#687348] text-[#292b25]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package size={16} />
          Produtos & Insumos de Bancada ({supplies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("formulas")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition ${
            activeTab === "formulas"
              ? "border-[#687348] text-[#292b25]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Scissors size={16} />
          Ficha Técnica dos Procedimentos ({services.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 pb-3 border-b-2 transition ${
            activeTab === "simulator"
              ? "border-[#687348] text-[#292b25]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp size={16} />
          Simulador de Margem & Preço
        </button>
      </div>

      {/* MODAL / FORMULÁRIO DE CADASTRO DE INSUMO */}
      {showSupplyForm && (
        <div className="rounded-2xl border border-[#d6dcbc] bg-[#f8f9f4] p-5 shadow-sm sm:p-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-[#d0f25a] text-[#292b25]">
                <Package size={16} />
              </span>
              <h3 className="font-bold text-[#292b25]">
                {editingSupply ? "Editar Produto / Insumo" : "Cadastrar Novo Produto de Bancada"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSupplyForm(false);
                setEditingSupply(null);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveSupply} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Nome do Produto / Cosmético *
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Gel Construtor Pink Hard (30g), Máscara Capilar, etc."
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Categoria
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`${inputClass} mt-1`}
                  >
                    {SUPPLY_CATEGORIES.filter((c) => c !== "Todas").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Marca / Fabricante (opcional)
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ex: Vòlia, Wella, Santa Clara"
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Preço de Compra (R$) *
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="Ex: 89.90"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <span className="text-[10px] text-slate-400">Valor pago pela embalagem</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Rendimento / Quantidade *
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formPackageQty}
                    onChange={(e) => setFormPackageQty(e.target.value)}
                    placeholder="Ex: 15 ou 500"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <span className="text-[10px] text-slate-400">Total que rende o pote/pacote</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Unidade de Medida *
                  <select
                    value={formUnitMeasure}
                    onChange={(e) => setFormUnitMeasure(e.target.value)}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="aplicações">aplicações (procedimentos)</option>
                    <option value="ml">ml (mililitros)</option>
                    <option value="g">g (gramas)</option>
                    <option value="unidades">unidades (kits/itens)</option>
                    <option value="pares">pares (luvas/calçados)</option>
                    <option value="doses">doses</option>
                  </select>
                </label>
                <span className="text-[10px] text-slate-400">Forma de consumo</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Observações / Detalhes de rendimento (opcional)
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Rende cerca de 15 manutenções ou alongamentos completos."
                  className={`${inputClass} mt-1`}
                />
              </label>
            </div>

            {/* DESTAQUE DO CÁLCULO DE CUSTO MÉDIO POR QUANTIDADE */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Custo Médio Calculado por Quantidade / Aplicação
                </div>
                <div className="mt-1 text-xs text-emerald-800">
                  {currentPackageQty > 0 ? (
                    <>
                      Cada <strong>1 {formUnitMeasure}</strong> deste produto custa para o seu negócio:
                    </>
                  ) : (
                    "Informe o preço e a quantidade para calcular a média."
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-900">
                  {money(currentCostPerUnit)}
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  {" "}/ {formUnitMeasure}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSupplyForm(false);
                  setEditingSupply(null);
                }}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button type="submit" disabled={busy} className={primaryButtonClass}>
                <Check size={16} />
                {editingSupply ? "Atualizar Insumo" : "Salvar Insumo na Bancada"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTEÚDO DA ABA 1: PRODUTOS & INSUMOS DE BANCADA */}
      {activeTab === "supplies" && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS E BUSCA */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5e5dc] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filtrar por:</span>
              <div className="flex flex-wrap gap-1">
                {SUPPLY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      categoryFilter === cat
                        ? "bg-[#687348] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-w-[200px] max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar produto ou marca…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-8 text-xs`}
              />
            </div>
          </div>

          {filteredSupplies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Package size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-bold text-slate-700">Nenhum produto cadastrado</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Cadastre seus cosméticos, esmaltes, pomadas ou descartáveis para calcular o
                custo médio por aplicação e compor o preço de cada atendimento.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={openNewSupplyForm}
                  className={primaryButtonClass}
                >
                  <Plus size={16} /> Cadastrar Primeiro Produto
                </button>
                <button
                  type="button"
                  onClick={handleLoadDefaults}
                  disabled={busy}
                  className={secondaryButtonClass}
                >
                  <Sparkles size={16} /> Carregar 8 Insumos de Exemplo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSupplies.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#e5e5dc] bg-white p-4 shadow-xs transition hover:border-[#8a9668] hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {item.category ?? "Geral"}
                      </span>
                      {item.brand && (
                        <span className="text-[11px] font-semibold text-slate-400">
                          {item.brand}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 font-bold text-[#292b25] text-sm leading-snug">
                      {item.name}
                    </h4>

                    {item.notes && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {item.notes}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">
                          Preço da embalagem
                        </span>
                        <strong className="text-slate-700 font-semibold">
                          {money(item.purchasePrice)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">
                          Rendimento total
                        </span>
                        <strong className="text-slate-700 font-semibold">
                          {item.packageQuantity} {item.unitMeasure}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block leading-none">
                        Custo Médio
                      </span>
                      <strong className="text-xs font-black">
                        {money(item.costPerUnit)} / {item.unitMeasure}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditSupplyForm(item)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="Editar produto"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSupply(item.id, item.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Excluir produto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: FICHA TÉCNICA POR PROCEDIMENTO */}
      {activeTab === "formulas" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e5e5dc] bg-white p-4 text-xs text-slate-600 flex items-start gap-3">
            <Info size={18} className="text-[#687348] shrink-0 mt-0.5" />
            <p>
              Vincule os produtos e descartáveis utilizados em cada atendimento do seu catálogo.
              O sistema soma automaticamente os custos dos insumos, calcula seu <strong>Lucro Bruto</strong> e sua <strong>Margem Real</strong>, e permite salvar o custo oficial no serviço com 1 clique.
            </p>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Scissors size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-bold text-slate-700">Nenhum procedimento no catálogo</h3>
              <p className="mt-1 text-xs text-slate-500">
                Cadastre seus serviços em "O que você oferece" para montar a ficha técnica de insumos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <ServiceFormulaCard
                  key={service.id}
                  service={service}
                  allSupplies={supplies}
                  savedUsage={formulas[service.id] ?? []}
                  onSaveFormula={async (usages, totalCost) => {
                    await saveServiceSupplyFormula(service.id, usages, totalCost);
                  }}
                  onApplyPrice={async (newPrice) => {
                    await saveService({ ...service, price: newPrice });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: SIMULADOR DE MARGEM & PREÇO */}
      {activeTab === "simulator" && (
        <SimulatorTab
          targetMargin={targetMargin}
          setTargetMargin={setTargetMargin}
          services={services}
          supplies={supplies}
        />
      )}
    </div>
  );
}

// =========================================================================
// CARD DE FICHA TÉCNICA DO PROCEDIMENTO
// =========================================================================

function ServiceFormulaCard({
  service,
  allSupplies,
  savedUsage,
  onSaveFormula,
  onApplyPrice,
}: {
  service: Service;
  allSupplies: ProductSupply[];
  savedUsage: ServiceSupplyUsage[];
  onSaveFormula: (usages: ServiceSupplyUsage[], totalCost: number) => Promise<void>;
  onApplyPrice: (newPrice: number) => Promise<void>;
}) {
  const [usages, setUsages] = useState<ServiceSupplyUsage[]>(savedUsage);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>(allSupplies[0]?.id ?? "");
  const [supplyQty, setSupplyQty] = useState<string>("1");
  const [saving, setSaving] = useState(false);

  // Mapear insumos
  const supplyMap = useMemo(() => {
    return new Map(allSupplies.map((s) => [s.id, s]));
  }, [allSupplies]);

  // Adicionar insumo à fórmula
  const handleAddSupply = () => {
    if (!selectedSupplyId) {
      toast.error("Selecione um insumo.");
      return;
    }
    const qty = Number(supplyQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    const existingIndex = usages.findIndex((u) => u.supplyId === selectedSupplyId);
    if (existingIndex >= 0) {
      const next = [...usages];
      next[existingIndex] = { ...next[existingIndex], quantity: qty };
      setUsages(next);
      toast.success("Quantidade do insumo atualizada.");
    } else {
      setUsages([...usages, { supplyId: selectedSupplyId, quantity: qty }]);
      toast.success("Insumo adicionado à ficha técnica.");
    }
    setSupplyQty("1");
  };

  const handleRemoveUsage = (supplyId: string) => {
    setUsages(usages.filter((u) => u.supplyId !== supplyId));
  };

  // Cálculo total do custo de insumos deste serviço
  const totalSupplyCost = useMemo(() => {
    return usages.reduce((sum, item) => {
      const sup = supplyMap.get(item.supplyId);
      const cost = sup ? sup.costPerUnit * item.quantity : 0;
      return sum + cost;
    }, 0);
  }, [usages, supplyMap]);

  const servicePrice = service.price ?? 0;
  const grossProfit = servicePrice - totalSupplyCost;
  const grossMargin = servicePrice > 0 ? (grossProfit / servicePrice) * 100 : 0;
  const markup = totalSupplyCost > 0 ? servicePrice / totalSupplyCost : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveFormula(usages, Math.round(totalSupplyCost * 100) / 100);
      toast.success(`Custo do procedimento "${service.name}" atualizado para ${money(totalSupplyCost)}!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao salvar custo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#292b25] text-base">{service.name}</h3>
            {service.duration && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 font-semibold">
                {service.duration} min
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Preço cobrado: <strong>{money(servicePrice)}</strong> · Custo atual cadastrado:{" "}
            <strong>{money(service.costPrice ?? 0)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              grossMargin >= 70
                ? "bg-emerald-100 text-emerald-800"
                : grossMargin >= 50
                ? "bg-amber-100 text-amber-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            Margem Bruta: {grossMargin.toFixed(1).replace(".", ",")}%
          </span>
          {markup > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Markup: {markup.toFixed(1)}x
            </span>
          )}
        </div>
      </div>

      {/* ADICIONAR INSUMOS NA FICHA */}
      <div className="mt-4">
        <span className="text-xs font-bold text-slate-700 block mb-2">
          Insumos & Produtos consumidos neste atendimento:
        </span>

        {allSupplies.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              value={selectedSupplyId}
              onChange={(e) => setSelectedSupplyId(e.target.value)}
              className={`${inputClass} max-w-xs text-xs`}
            >
              {allSupplies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({money(s.costPerUnit)} / {s.unitMeasure})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={supplyQty}
                onChange={(e) => setSupplyQty(e.target.value)}
                className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="Qtd"
              />
              <span className="text-xs text-slate-400">
                {supplyMap.get(selectedSupplyId)?.unitMeasure ?? "un"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddSupply}
              className={secondaryButtonClass}
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mb-3 italic">
            Cadastre insumos na aba anterior para selecioná-los aqui.
          </p>
        )}

        {/* LISTA DE INSUMOS VINCULADOS */}
        {usages.length > 0 ? (
          <div className="space-y-1.5 rounded-xl border border-slate-100 bg-[#f9f9f6] p-3 text-xs">
            {usages.map((u) => {
              const sup = supplyMap.get(u.supplyId);
              if (!sup) return null;
              const subtotal = sup.costPerUnit * u.quantity;
              return (
                <div
                  key={u.supplyId}
                  className="flex items-center justify-between gap-2 border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{sup.name}</span>
                    <span className="text-slate-500">
                      ({u.quantity} {sup.unitMeasure} × {money(sup.costPerUnit)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{money(subtotal)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUsage(u.supplyId)}
                      className="text-slate-400 hover:text-red-600"
                      title="Remover insumo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
            Nenhum insumo vinculado a este serviço ainda.
          </div>
        )}
      </div>

      {/* BALANÇO FINANCEIRO & BOTÃO DE SALVAR */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Custo Total em Insumos:</span>
            <strong className="text-sm font-bold text-slate-800">
              {money(totalSupplyCost)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block">Lucro Bruto por Cliente:</span>
            <strong
              className={`text-sm font-bold ${
                grossProfit >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {money(grossProfit)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={primaryButtonClass}
        >
          <Save size={15} /> Salvar Custo no Procedimento
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// SIMULADOR DE MARGEM & PREÇO DE VENDA
// =========================================================================

function SimulatorTab({
  targetMargin,
  setTargetMargin,
  services,
  supplies,
}: {
  targetMargin: number;
  setTargetMargin: (val: number) => void;
  services: Service[];
  supplies: ProductSupply[];
}) {
  const [simulatedCost, setSimulatedCost] = useState("15");
  const [simulatedHours, setSimulatedHours] = useState("1");
  const [hourlyRate, setHourlyRate] = useState("40");

  const cost = Number(simulatedCost || 0);
  const hours = Number(simulatedHours || 0);
  const hourCost = Number(hourlyRate || 0);
  const laborCost = hours * hourCost;
  const totalCost = cost + laborCost;

  const validMargin = targetMargin > 0 && targetMargin < 100;
  const suggestedPrice =
    validMargin && totalCost > 0
      ? Math.ceil((totalCost / (1 - targetMargin / 100)) * 100) / 100
      : 0;

  const grossProfit = suggestedPrice - totalCost;

  return (
    <div className="rounded-2xl border border-[#e5e5dc] bg-white p-6 shadow-xs space-y-6">
      <div>
        <h3 className="font-bold text-[#292b25] text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-[#687348]" />
          Simulador Inteligente de Preço & Margem de Lucro
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Descubra quanto você deve cobrar pelo procedimento considerando o custo dos insumos, o tempo de atendimento e a margem de lucro que deseja colocar no bolso.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Custo dos Insumos (R$)
            <input
              type="number"
              step="0.5"
              value={simulatedCost}
              onChange={(e) => setSimulatedCost(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="Ex: 15.00"
            />
          </label>
          <span className="text-[11px] text-slate-400">Cosméticos e descartáveis</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Tempo de Atendimento (horas)
            <input
              type="number"
              step="0.25"
              value={simulatedHours}
              onChange={(e) => setSimulatedHours(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="Ex: 1 ou 1.5"
            />
          </label>
          <span className="text-[11px] text-slate-400">Duração da cadeira/maca</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Valor da sua Hora / Mão de Obra (R$)
            <input
              type="number"
              step="5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="Ex: 40.00"
            />
          </label>
          <span className="text-[11px] text-slate-400">Sua remuneração desejada/hora</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Margem de Lucro Desejada (%)
            <input
              type="number"
              min="10"
              max="95"
              value={targetMargin}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
              className={`${inputClass} mt-1`}
              placeholder="80"
            />
          </label>
          <span className="text-[11px] text-slate-400">Lucro livre do negócio</span>
        </div>
      </div>

      {/* RESULTADO DA SIMULAÇÃO */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              Custo Total Estimado
            </span>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {money(totalCost)}
            </div>
            <span className="text-[11px] text-slate-500">
              {money(cost)} insumos + {money(laborCost)} mão de obra
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wider">
              Preço Sugerido de Venda
            </span>
            <div className="text-3xl font-black text-emerald-950 mt-1">
              {money(suggestedPrice)}
            </div>
            <span className="text-[11px] text-emerald-800">
              Garante sua margem de {targetMargin}%
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              Lucro Líquido por Procedimento
            </span>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {money(grossProfit)}
            </div>
            <span className="text-[11px] text-emerald-700">
              Valor que sobra no caixa do salão/clínica
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MÓDULO DE GASTRONOMIA & ALIMENTAÇÃO (PRESERVADO)
// =========================================================================

function FoodPricingManager({
  services,
  saveService,
  saveServiceCost,
  error,
}: {
  services: Service[];
  saveService: (service: Omit<Service, "id"> & { id?: string }) => Promise<void>;
  saveServiceCost: (serviceId: string, costPrice: number) => Promise<void>;
  error: string | null;
}) {
  const [targetMargin, setTargetMargin] = useState(30);
  const [pageError, setPageError] = useState("");

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
        title="Custos e precificação de pratos"
        description="Entenda quanto custa cada item, acompanhe sua margem bruta estimada e avalie um preço de venda ideal."
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
        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Package size={15} className="text-[#778253]" /> Itens ativos
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-[#292b25]">
            {pricedItems.length}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Coins size={15} className="text-[#778253]" /> Custo informado
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-[#292b25]">
            {services.filter((item) => (item.costPrice ?? 0) > 0).length}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingUp size={15} className="text-[#778253]" /> Margem bruta média
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-[#292b25]">
            {averageMargin.toFixed(1).replace(".", ",")}%
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-[#e7e5d8] bg-[#f2f3ec] p-4 text-sm leading-6 text-[#626653]">
        <CircleAlert size={19} className="mt-0.5 shrink-0 text-[#778253]" />
        <p>
          Informe o custo total de uma unidade, incluindo ingredientes, embalagem e outros custos
          variáveis. A margem é uma estimativa bruta e não desconta despesas fixas, impostos ou entrega.
        </p>
      </div>

      {services.length ? (
        <div className="space-y-4">
          {services.map((service) => (
            <FoodPricingItem
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

function FoodPricingItem({
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
