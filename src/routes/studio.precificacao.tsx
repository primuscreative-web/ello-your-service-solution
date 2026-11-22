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

type PricingProfile = {
  eyebrow: string;
  title: string;
  description: string;
  itemLabel: string;
  itemPlaceholder: string;
  serviceNoun: string;
  serviceNounPlural: string;
  categories: readonly string[];
  units: readonly { value: string; label: string }[];
  defaultSupplies: readonly Omit<ProductSupply, "id">[];
};

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

const DEFAULT_BARBER_SUPPLIES: Omit<ProductSupply, "id">[] = [
  {
    name: "Lâminas descartáveis (caixa com 100)",
    category: "Barba & acabamento",
    purchasePrice: 38,
    packageQuantity: 100,
    unitMeasure: "unidades",
    costPerUnit: 0.38,
    notes: "Exemplo de cálculo. Ajuste quantidade e valor conforme sua compra.",
  },
  {
    name: "Gel de barbear (frasco de 500 ml)",
    category: "Barba & acabamento",
    purchasePrice: 35,
    packageQuantity: 50,
    unitMeasure: "atendimentos",
    costPerUnit: 0.7,
    notes: "Rendimento ilustrativo; meça o consumo real por atendimento.",
  },
  {
    name: "Loção pós-barba (frasco de 500 ml)",
    category: "Barba & acabamento",
    purchasePrice: 42,
    packageQuantity: 50,
    unitMeasure: "atendimentos",
    costPerUnit: 0.84,
    notes: "Rendimento ilustrativo; substitua pelo valor pago pelo seu negócio.",
  },
  {
    name: "Papel de pescoço descartável (rolo)",
    category: "Descartáveis & higiene",
    purchasePrice: 18,
    packageQuantity: 100,
    unitMeasure: "unidades",
    costPerUnit: 0.18,
    notes: "Exemplo para estimar o custo por cliente.",
  },
];

const DEFAULT_PET_SUPPLIES: Omit<ProductSupply, "id">[] = [
  {
    name: "Shampoo de uso pet (frasco de 1 L)",
    category: "Banho & higiene animal",
    purchasePrice: 49.9,
    packageQuantity: 20,
    unitMeasure: "banhos",
    costPerUnit: 2.5,
    notes: "Rendimento apenas ilustrativo. Siga o rótulo e o protocolo do estabelecimento.",
  },
  {
    name: "Condicionador de uso pet (frasco de 1 L)",
    category: "Banho & higiene animal",
    purchasePrice: 54.9,
    packageQuantity: 20,
    unitMeasure: "banhos",
    costPerUnit: 2.75,
    notes: "Rendimento apenas ilustrativo. Use somente quando apropriado à espécie e ao serviço.",
  },
  {
    name: "Algodão para higiene externa (pacote)",
    category: "Higiene & descartáveis pet",
    purchasePrice: 12,
    packageQuantity: 40,
    unitMeasure: "atendimentos",
    costPerUnit: 0.3,
    notes: "Exemplo de consumo. Não representa orientação clínica.",
  },
];

const STANDARD_UNITS = [
  { value: "unidades", label: "unidades" },
  { value: "serviços", label: "serviços" },
  { value: "horas", label: "horas" },
] as const;

const PRICING_PROFILES: Record<string, PricingProfile> = {
  beleza: {
    eyebrow: "Beleza & estética",
    title: "Custos de produtos e insumos",
    description: "Organize cosméticos, materiais de unhas, cabelo, estética facial e depilação por custo e rendimento.",
    itemLabel: "Nome do produto ou insumo",
    itemPlaceholder: "Ex.: esmalte, máscara capilar ou sérum facial",
    serviceNoun: "procedimento",
    serviceNounPlural: "procedimentos",
    categories: ["Unhas & Manicure", "Cabelo & Química", "Estética Facial", "Depilação", "Descartáveis & Biossegurança", "Geral / Outros"],
    units: [
      { value: "aplicações", label: "aplicações" },
      { value: "ml", label: "ml (mililitros)" },
      { value: "g", label: "g (gramas)" },
      { value: "unidades", label: "unidades" },
      { value: "pares", label: "pares" },
      { value: "doses", label: "doses" },
    ],
    defaultSupplies: DEFAULT_BEAUTY_SUPPLIES,
  },
  barbearia: {
    eyebrow: "Barbearia",
    title: "Custos de produtos e materiais",
    description: "Controle lâminas, produtos de barba, acabamento e descartáveis usados nos serviços da barbearia.",
    itemLabel: "Nome do produto ou material",
    itemPlaceholder: "Ex.: lâmina, gel de barbear ou papel de pescoço",
    serviceNoun: "serviço",
    serviceNounPlural: "serviços",
    categories: ["Corte & finalização", "Barba & acabamento", "Higiene & descartáveis", "Geral / Outros"],
    units: [
      { value: "atendimentos", label: "atendimentos" },
      { value: "unidades", label: "unidades" },
      { value: "ml", label: "ml (mililitros)" },
      { value: "g", label: "g (gramas)" },
      { value: "pares", label: "pares" },
    ],
    defaultSupplies: DEFAULT_BARBER_SUPPLIES,
  },
  pet: {
    eyebrow: "Pet care",
    title: "Custos de produtos e materiais pet",
    description: "Registre itens de higiene animal, banho, pelagem e descartáveis. Use produtos adequados à espécie e ao serviço realizado.",
    itemLabel: "Nome do produto ou material pet",
    itemPlaceholder: "Ex.: shampoo de uso pet, toalha descartável ou laço",
    serviceNoun: "atendimento",
    serviceNounPlural: "atendimentos",
    categories: ["Banho & higiene animal", "Pelagem & acabamento", "Higiene & descartáveis pet", "Geral / Outros"],
    units: [
      { value: "banhos", label: "banhos" },
      { value: "atendimentos", label: "atendimentos" },
      { value: "ml", label: "ml (mililitros)" },
      { value: "g", label: "g (gramas)" },
      { value: "unidades", label: "unidades" },
      { value: "pares", label: "pares" },
    ],
    defaultSupplies: DEFAULT_PET_SUPPLIES,
  },
  saude: {
    eyebrow: "Saúde & bem-estar",
    title: "Custos de materiais e insumos",
    description: "Registre materiais consumidos por consulta ou atendimento. Os exemplos e custos devem seguir a especialidade e as compras reais da clínica.",
    itemLabel: "Nome do material ou insumo",
    itemPlaceholder: "Ex.: material de uso profissional consumido no atendimento",
    serviceNoun: "atendimento",
    serviceNounPlural: "atendimentos",
    categories: ["Materiais de atendimento", "EPI & descartáveis", "Equipamentos & manutenção", "Geral / Outros"],
    units: [...STANDARD_UNITS, { value: "doses", label: "doses" }, { value: "ml", label: "ml (mililitros)" }, { value: "g", label: "g (gramas)" }],
    defaultSupplies: [],
  },
  automotivo: {
    eyebrow: "Automotivo",
    title: "Custos de peças, fluidos e materiais",
    description: "Separe peças, lubrificantes, produtos de limpeza e materiais por serviço ou veículo. Confirme compatibilidade e preço pela ordem de serviço e nota fiscal.",
    itemLabel: "Nome da peça, fluido ou material",
    itemPlaceholder: "Ex.: filtro, óleo ou produto de limpeza automotiva",
    serviceNoun: "serviço",
    serviceNounPlural: "serviços",
    categories: ["Lubrificantes & fluidos", "Peças & filtros", "Limpeza automotiva", "EPI & descartáveis", "Ferramentas & manutenção", "Geral / Outros"],
    units: [
      { value: "serviços", label: "serviços" }, { value: "unidades", label: "unidades" },
      { value: "ml", label: "ml (mililitros)" }, { value: "L", label: "L (litros)" },
      { value: "g", label: "g (gramas)" }, { value: "kg", label: "kg (quilogramas)" },
      { value: "horas", label: "horas" }, { value: "km", label: "km" },
    ],
    defaultSupplies: [],
  },
  casa: {
    eyebrow: "Casa & manutenção",
    title: "Custos de materiais e ferramentas",
    description: "Organize materiais por especialidade, como elétrica, hidráulica, pintura e manutenção. Registre o consumo por serviço ou orçamento.",
    itemLabel: "Nome do material ou ferramenta",
    itemPlaceholder: "Ex.: cabo, conexão hidráulica, tinta ou abrasivo",
    serviceNoun: "serviço",
    serviceNounPlural: "serviços",
    categories: ["Elétrica", "Hidráulica", "Pintura", "Materiais de manutenção", "Ferramentas & EPI", "Deslocamento", "Geral / Outros"],
    units: [
      { value: "serviços", label: "serviços" }, { value: "unidades", label: "unidades" },
      { value: "m", label: "m (metros)" }, { value: "m²", label: "m² (metros quadrados)" },
      { value: "L", label: "L (litros)" }, { value: "kg", label: "kg (quilogramas)" },
      { value: "horas", label: "horas" }, { value: "km", label: "km" },
    ],
    defaultSupplies: [],
  },
  educacao: {
    eyebrow: "Educação",
    title: "Custos de materiais e recursos de aula",
    description: "Acompanhe materiais pedagógicos, impressos, licenças e outros recursos usados por aula, turma ou aluno.",
    itemLabel: "Nome do material ou recurso",
    itemPlaceholder: "Ex.: material didático, impressão ou licença de plataforma",
    serviceNoun: "aula",
    serviceNounPlural: "aulas",
    categories: ["Materiais pedagógicos", "Impressos & papelaria", "Plataformas & licenças", "Equipamentos", "Deslocamento", "Geral / Outros"],
    units: [
      { value: "aulas", label: "aulas" }, { value: "alunos", label: "alunos" },
      { value: "unidades", label: "unidades" }, { value: "páginas", label: "páginas" },
      { value: "meses", label: "meses" }, { value: "horas", label: "horas" },
    ],
    defaultSupplies: [],
  },
  "servicos-domesticos": {
    eyebrow: "Serviços domésticos",
    title: "Custos de produtos e materiais de limpeza",
    description: "Calcule o consumo de produtos de limpeza, utensílios e equipamentos por diária ou serviço. Ajuste os valores às compras e ao método de trabalho usados.",
    itemLabel: "Nome do produto ou material de limpeza",
    itemPlaceholder: "Ex.: detergente, pano, luva ou saco para resíduos",
    serviceNoun: "diária",
    serviceNounPlural: "diárias",
    categories: ["Produtos de limpeza", "Utensílios & panos", "EPI & descartáveis", "Equipamentos", "Deslocamento", "Geral / Outros"],
    units: [
      { value: "diárias", label: "diárias" }, { value: "serviços", label: "serviços" },
      { value: "ml", label: "ml (mililitros)" }, { value: "L", label: "L (litros)" },
      { value: "unidades", label: "unidades" }, { value: "pares", label: "pares" },
      { value: "horas", label: "horas" }, { value: "km", label: "km" },
    ],
    defaultSupplies: [],
  },
  "outros-servicos": {
    eyebrow: "Outros serviços",
    title: "Custos de materiais e ferramentas",
    description: "Cadastre apenas os materiais e recursos realmente usados nos serviços do seu negócio, sem itens sugeridos de outros nichos.",
    itemLabel: "Nome do material, ferramenta ou recurso",
    itemPlaceholder: "Ex.: material consumido em um serviço",
    serviceNoun: "serviço",
    serviceNounPlural: "serviços",
    categories: ["Materiais do serviço", "Ferramentas & equipamentos", "EPI & segurança", "Deslocamento", "Geral / Outros"],
    units: STANDARD_UNITS,
    defaultSupplies: [],
  },
};

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
  const profile = PRICING_PROFILES[business?.category ?? ""] ?? PRICING_PROFILES["outros-servicos"];

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
    <SuppliesAndPricingManager
      key={business?.category ?? "outros-servicos"}
      profile={profile}
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
// MÓDULO DE INSUMOS COM PERFIL EXCLUSIVO POR NICHO
// =========================================================================

function SuppliesAndPricingManager({
  profile,
  business,
  services,
  saveService,
  saveServiceCost,
  saveSupplies,
  saveServiceSupplyFormula,
  contextError,
}: {
  profile: PricingProfile;
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
  // A margem depende da operação; não sugerimos uma porcentagem padrão.
  const [targetMargin, setTargetMargin] = useState(0);

  // Lista atual de insumos
  const supplies: ProductSupply[] = business?.onboardingDetails?.supplies ?? [];
  const profileCategorySet = useMemo(() => new Set(profile.categories), [profile.categories]);
  const profileSupplies = useMemo(
    () => supplies.filter((supply) => profileCategorySet.has(supply.category ?? "")),
    [profileCategorySet, supplies],
  );
  const legacySupplies = useMemo(
    () => supplies.filter((supply) => !profileCategorySet.has(supply.category ?? "")),
    [profileCategorySet, supplies],
  );
  const formulas: Record<string, ServiceSupplyUsage[]> =
    business?.onboardingDetails?.serviceSupplyFormulas ?? {};

  // Form State para Insumo
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState(profile.categories[0]);
  const [formBrand, setFormBrand] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formPackageQty, setFormPackageQty] = useState("");
  const [formUnitMeasure, setFormUnitMeasure] = useState(profile.units[0]?.value ?? "unidades");
  const [formNotes, setFormNotes] = useState("");

  const openNewSupplyForm = () => {
    setEditingSupply(null);
    setCategoryFilter("Todas");
    setFormName("");
    setFormCategory(profile.categories[0]);
    setFormBrand("");
    setFormPurchasePrice("");
    setFormPackageQty("");
    setFormUnitMeasure(profile.units[0]?.value ?? "unidades");
    setFormNotes("");
    setShowSupplyForm(true);
  };

  const openEditSupplyForm = (item: ProductSupply) => {
    setEditingSupply(item);
    setFormName(item.name);
    setFormCategory(item.category ?? profile.categories[0]);
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
        toast.success(`Item "${formName}" adicionado ao perfil de ${profile.eyebrow}.`);
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

  // Carregar exemplos ilustrativos exclusivos deste nicho.
  const handleLoadDefaults = async () => {
    if (profile.defaultSupplies.length === 0) return;
    setBusy(true);
    try {
      const generated = profile.defaultSupplies.map((item, idx) => ({
        ...item,
        id: `sup_def_${Date.now()}_${idx}`,
      }));
      const merged = [...supplies, ...generated];
      await saveSupplies(merged);
      toast.success(`Exemplos de ${profile.eyebrow} adicionados. Confira e ajuste os valores.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao carregar exemplos.");
    } finally {
      setBusy(false);
    }
  };

  // Métricas Globais
  const totalInvested = profileSupplies.reduce((acc, s) => acc + (s.purchasePrice || 0), 0);
  const averageProductPrice = profileSupplies.length > 0 ? totalInvested / profileSupplies.length : 0;
  const averageCostPerUnit =
    profileSupplies.length > 0
      ? profileSupplies.reduce((acc, s) => acc + (s.costPerUnit || 0), 0) / profileSupplies.length
      : 0;

  const formulasWithOutOfProfileItems = services.filter((service) =>
    (formulas[service.id] ?? []).some(
      (usage) => !profileSupplies.some((supply) => supply.id === usage.supplyId),
    ),
  ).length;

  // Filtragem
  const supplyFilters = [
    "Todas",
    ...profile.categories,
    ...(legacySupplies.length > 0 ? ["Fora do perfil"] : []),
  ];
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const isInProfile = profileCategorySet.has(s.category ?? "");
      const matchesCategory =
        categoryFilter === "Todas"
          ? isInProfile
          : categoryFilter === "Fora do perfil"
            ? !isInProfile
            : isInProfile && s.category === categoryFilter;
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.brand && s.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [supplies, profileCategorySet, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow={profile.eyebrow}
        title={profile.title}
        description={profile.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {profileSupplies.length === 0 && profile.defaultSupplies.length > 0 && (
              <button
                type="button"
                onClick={handleLoadDefaults}
                disabled={busy}
                className={secondaryButtonClass}
              >
                <Sparkles size={15} className="text-[#687348]" />
                Carregar exemplos de {profile.eyebrow}
              </button>
            )}
            <button
              type="button"
              onClick={openNewSupplyForm}
              className={primaryButtonClass}
            >
              <Plus size={16} />
              Novo item de {profile.eyebrow}
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

      {legacySupplies.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {legacySupplies.length} {legacySupplies.length === 1 ? "item está" : "itens estão"} em categorias de outro perfil. Os dados foram preservados e ficam fora dos totais e das fichas deste nicho.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab("supplies");
              setCategoryFilter("Fora do perfil");
            }}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-amber-100"
          >
            Revisar e reclassificar
          </button>
        </div>
      )}

      {profile.defaultSupplies.length > 0 && (
        <p className="text-xs text-slate-500">
          Os modelos sugeridos usam valores ilustrativos. Confira rendimento, compatibilidade e preço nas suas compras antes de usar os cálculos.
        </p>
      )}

      {/* CARDS DE RESUMO DE MÉDIAS E CUSTOS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Package size={16} className="text-[#778253]" />
            Total de itens
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#292b25]">
            {profileSupplies.length}{" "}
            <span className="text-xs font-normal text-slate-400">itens do nicho</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Materiais cadastrados neste perfil
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Coins size={16} className="text-[#778253]" />
            Compras registradas neste perfil
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#292b25]">
            {money(totalInvested)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Soma dos valores de compra cadastrados
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Calculator size={16} className="text-[#778253]" />
            Valor médio por item
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-[#292b25]">
            {money(averageProductPrice)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Média dos itens deste nicho
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5e5dc] bg-white p-5 shadow-xs bg-emerald-50/30 border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <TrendingUp size={16} className="text-emerald-600" />
            Custo médio por unidade de uso
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-emerald-900">
            {money(averageCostPerUnit)}
            <span className="text-xs font-normal text-emerald-700"> / unidade</span>
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
          Produtos & insumos ({profileSupplies.length})
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
          Ficha técnica dos {profile.serviceNounPlural} ({services.length})
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
                {editingSupply ? "Editar item" : `Cadastrar item — ${profile.eyebrow}`}
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
                  {profile.itemLabel} *
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={profile.itemPlaceholder}
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
                    {formCategory && !profile.categories.includes(formCategory) && (
                      <option value={formCategory}>
                        {formCategory} (fora do perfil atual)
                      </option>
                    )}
                    {profile.categories.map((cat) => (
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
                  Fornecedor, fabricante ou referência (opcional)
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="Ex.: fornecedor, fabricante ou marca"
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
                <span className="text-[10px] text-slate-400">Quantidade total comprada ou rendimento informado</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Unidade de Medida *
                  <select
                    value={formUnitMeasure}
                    onChange={(e) => setFormUnitMeasure(e.target.value)}
                    className={`${inputClass} mt-1`}
                  >
                    {formUnitMeasure && !profile.units.some((unit) => unit.value === formUnitMeasure) && (
                      <option value={formUnitMeasure}>{formUnitMeasure} (unidade já cadastrada)</option>
                    )}
                    {profile.units.map((unit) => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
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
                  placeholder="Ex.: informe o rendimento real observado ou indicado pelo fabricante."
                  className={`${inputClass} mt-1`}
                />
              </label>
            </div>

            {/* DESTAQUE DO CÁLCULO DE CUSTO MÉDIO POR QUANTIDADE */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Custo calculado por unidade de uso
                </div>
                <div className="mt-1 text-xs text-emerald-800">
                  {currentPackageQty > 0 ? (
                    <>
                      Cada <strong>1 {formUnitMeasure}</strong> deste item custa para o seu negócio:
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
                {editingSupply ? "Atualizar item" : "Salvar item"}
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
                {supplyFilters.map((cat) => (
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
              <h3 className="mt-3 font-bold text-slate-700">
                {categoryFilter === "Fora do perfil" ? "Nenhum item fora do perfil" : "Nenhum item cadastrado neste nicho"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                {categoryFilter === "Fora do perfil"
                  ? "Todos os itens preservados já foram reclassificados ou removidos."
                  : profile.description}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={openNewSupplyForm}
                  className={primaryButtonClass}
                >
                  <Plus size={16} /> Cadastrar primeiro item
                </button>
                {profile.defaultSupplies.length > 0 && categoryFilter !== "Fora do perfil" && (
                  <button
                    type="button"
                    onClick={handleLoadDefaults}
                    disabled={busy}
                    className={secondaryButtonClass}
                  >
                    <Sparkles size={16} /> Carregar exemplos de {profile.eyebrow}
                  </button>
                )}
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
                          Valor de compra
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

      {/* CONTEÚDO DA ABA 2: FICHA TÉCNICA POR NICHO */}
      {activeTab === "formulas" && (
        <div className="space-y-4">
          {formulasWithOutOfProfileItems > 0 && (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {formulasWithOutOfProfileItems} ficha(s) têm vínculos com itens indisponíveis neste perfil. Reclassifique ou remova esses vínculos antes de salvar novos custos.
            </div>
          )}
          <div className="rounded-2xl border border-[#e5e5dc] bg-white p-4 text-xs text-slate-600 flex items-start gap-3">
            <Info size={18} className="text-[#687348] shrink-0 mt-0.5" />
            <p>
              Vincule apenas materiais deste perfil aos {profile.serviceNounPlural} do catálogo.
              O sistema estima o custo variável desses materiais, o lucro bruto e a margem bruta. Não inclui automaticamente despesas fixas, impostos ou taxas.
            </p>
          </div>

          {services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Scissors size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-bold text-slate-700">Nenhum {profile.serviceNoun} no catálogo</h3>
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
                  allSupplies={profileSupplies}
                  savedUsage={formulas[service.id] ?? []}
                  serviceNoun={profile.serviceNoun}
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
          profile={profile}
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
  serviceNoun,
  onSaveFormula,
  onApplyPrice,
}: {
  service: Service;
  allSupplies: ProductSupply[];
  savedUsage: ServiceSupplyUsage[];
  serviceNoun: string;
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
  const unresolvedUsages = usages.filter((usage) => !supplyMap.has(usage.supplyId));

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
  const grossProfit = unresolvedUsages.length === 0 ? servicePrice - totalSupplyCost : 0;
  const grossMargin =
    unresolvedUsages.length === 0 && servicePrice > 0 ? (grossProfit / servicePrice) * 100 : 0;
  const markup = totalSupplyCost > 0 ? servicePrice / totalSupplyCost : 0;

  const handleSave = async () => {
    if (unresolvedUsages.length > 0) {
      toast.error("Corrija os itens fora do perfil antes de salvar este custo.");
      return;
    }
    setSaving(true);
    try {
      await onSaveFormula(usages, Math.round(totalSupplyCost * 100) / 100);
      toast.success(`Custo do ${serviceNoun} "${service.name}" atualizado para ${money(totalSupplyCost)}!`);
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
              unresolvedUsages.length > 0
                ? "bg-amber-100 text-amber-800"
                : grossMargin >= 70
                  ? "bg-emerald-100 text-emerald-800"
                  : grossMargin >= 50
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
            }`}
          >
            {unresolvedUsages.length > 0
              ? "Corrija itens fora do perfil"
              : `Margem bruta estimada: ${grossMargin.toFixed(1).replace(".", ",")}%`}
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
          Insumos e materiais consumidos neste {serviceNoun}:
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
              if (!sup) {
                return (
                  <div key={u.supplyId} className="flex items-center justify-between gap-2 border-b border-amber-200 pb-1.5 last:border-0 last:pb-0 text-amber-900">
                    <span>Item vinculado fora deste nicho (quantidade: {u.quantity}). Reclassifique-o na aba de insumos ou remova este vínculo.</span>
                    <button type="button" onClick={() => handleRemoveUsage(u.supplyId)} className="shrink-0 rounded px-2 py-1 font-semibold hover:bg-amber-100" title="Remover vínculo fora do perfil">Remover</button>
                  </div>
                );
              }
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
            <span className="text-slate-400 block">Lucro bruto estimado por {serviceNoun}:</span>
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
          disabled={saving || unresolvedUsages.length > 0}
          className={primaryButtonClass}
        >
          <Save size={15} /> Salvar custo no {serviceNoun}
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
  profile,
}: {
  targetMargin: number;
  setTargetMargin: (val: number) => void;
  profile: PricingProfile;
}) {
  const [simulatedCost, setSimulatedCost] = useState("");
  const [simulatedHours, setSimulatedHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

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
          Estime um preço para cada {profile.serviceNoun}, incluindo os custos e a margem bruta que você definir. Confira também despesas fixas, tributos e taxas, que não entram neste cálculo.
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
              placeholder="Informe o custo real"
            />
          </label>
          <span className="text-[11px] text-slate-400">Materiais e custos variáveis deste nicho</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Tempo de trabalho (horas)
            <input
              type="number"
              step="0.25"
              value={simulatedHours}
              onChange={(e) => setSimulatedHours(e.target.value)}
              className={`${inputClass} mt-1`}
              placeholder="Informe o tempo previsto"
            />
          </label>
          <span className="text-[11px] text-slate-400">Duração prevista para este serviço</span>
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
              placeholder="Informe o valor real"
            />
          </label>
          <span className="text-[11px] text-slate-400">Sua remuneração desejada/hora</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Margem bruta desejada (%)
            <input
              type="number"
              min="1"
              max="99"
              value={targetMargin || ""}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
              className={`${inputClass} mt-1`}
              placeholder="Defina sua margem"
            />
          </label>
          <span className="text-[11px] text-slate-400">Sem percentual pré-definido</span>
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
              {money(cost)} materiais + {money(laborCost)} mão de obra
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
              {validMargin ? `Margem bruta definida: ${targetMargin}%` : "Informe uma margem para calcular"}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              Lucro bruto estimado por {profile.serviceNoun}
            </span>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {money(grossProfit)}
            </div>
            <span className="text-[11px] text-emerald-700">
              Antes de despesas fixas, tributos e taxas
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
  const [targetMargin, setTargetMargin] = useState(0);
  const [pageError, setPageError] = useState("");

  const pricedItems = services.filter(
    (service) => service.active && service.price > 0 && (service.costPrice ?? 0) > 0,
  );
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
              Margem bruta desejada
            </label>
            <input
              id="target-margin"
              aria-label="Margem bruta desejada em porcentagem"
              type="number"
              min="1"
              max="99"
              step="1"
              value={targetMargin || ""}
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
            {pricedItems.length ? `${averageMargin.toFixed(1).replace(".", ",")}%` : "—"}
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
  const [costInput, setCostInput] = useState(
    service.costPrice == null ? "" : String(service.costPrice),
  );
  const [busy, setBusy] = useState(false);
  const cost = Number(costInput);
  const validMargin = Number.isFinite(targetMargin) && targetMargin > 0 && targetMargin < 100;
  const validCost = costInput.trim() !== "" && Number.isFinite(cost) && cost >= 0;
  const suggestedPrice =
    validCost && validMargin ? Math.ceil((cost / (1 - targetMargin / 100)) * 100) / 100 : 0;
  const hasRecordedCost = (service.costPrice ?? 0) > 0;
  const unitMargin = hasRecordedCost ? service.price - (service.costPrice ?? 0) : null;
  const actualMargin = hasRecordedCost && service.price > 0 ? (unitMargin! / service.price) * 100 : null;

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
          {!hasRecordedCost || service.price <= 0
            ? "Informe o preço e o custo para calcular a margem"
            : `Margem bruta estimada: ${actualMargin!.toFixed(1).replace(".", ",")}%`}
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
            className={`mt-2 font-semibold ${unitMargin != null && unitMargin >= 0 ? "text-[#586341]" : "text-red-600"}`}
          >
            {unitMargin == null ? "—" : money(unitMargin)}
          </div>
        </div>
        <div className="rounded-xl bg-[#edf0e5] p-3">
          <div className="text-xs text-[#667448]">
            {validMargin ? `Preço sugerido · ${targetMargin}% de margem` : "Preço sugerido"}
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
