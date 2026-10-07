import { useState, useMemo, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  Check,
  CarFront,
  HeartPulse,
  House,
  Loader2,
  MapPin,
  Phone,
  PawPrint,
  GraduationCap,
  Scissors,
  Search,
  Sparkles,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { useLocalHub, createSlug, type BusinessOnboardingDetails } from "@/lib/localhub-context";
import { Field, inputClass, primaryButtonClass } from "@/components/localhub/ui";
import {
  formatCep,
  fetchAddressFromCep,
  searchCities,
  BRAZILIAN_STATES,
} from "@/lib/cities";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const categories = [
  { id: "alimentacao", label: "Restaurantes/lanchonetes", icon: UtensilsCrossed },
  { id: "beleza", label: "Beleza & estética", icon: Sparkles },
  { id: "barbearia", label: "Barbearia", icon: Scissors },
  { id: "saude", label: "Saúde e bem-estar", icon: HeartPulse },
  { id: "automotivo", label: "Automotivo", icon: CarFront },
  { id: "casa", label: "Casa e manutenção", icon: House },
  { id: "educacao", label: "Educação", icon: GraduationCap },
  { id: "pet", label: "Pet", icon: PawPrint },
  { id: "outros-servicos", label: "Outros serviços", icon: Wrench },
  { id: "servicos-domesticos", label: "Serviços domésticos", icon: House },
];

const categoryBackgrounds: Record<string, string> = {
  beleza:
    "/localhub/luxury_aesthetic_nail_salon_and_beauty_spa_interior_elegant_aesthetic_with_pink/screen.png",
  barbearia:
    "/localhub/close_up_modern_clean_barbershop_showcase_before_and_after_grooming_comparison/screen.png",
  alimentacao: "/images/showcase/hamburgueria.jpg",
  saude: "/images/showcase/nutricionista.jpg",
  pet: "/images/showcase/pet-sitter.jpg",
  automotivo: "/images/ello/home-services-2-v2.webp",
  casa: "/images/ello/home-services-3.webp",
  educacao: "/images/ello/onboarding-agenda.webp",
  "outros-servicos": "/images/ello/onboarding-client.webp",
  "servicos-domesticos": "/images/ello/home-services-2.webp",
};

type SetupChoice = { id: string; label: string };
type SetupProfile = {
  specialtyTitle: string;
  specialtyDescription: string;
  specialties: SetupChoice[];
  serviceModeTitle: string;
  serviceModeDescription: string;
  serviceModes: SetupChoice[];
};

const setupProfiles: Record<string, SetupProfile> = {
  beleza: {
    specialtyTitle: "Quais serviços de beleza você oferece?",
    specialtyDescription: "Marque tudo o que seus clientes podem encontrar no seu espaço.",
    specialties: [
      { id: "cabelo", label: "Cabelo" },
      { id: "unhas", label: "Unhas" },
      { id: "estetica-facial", label: "Estética facial" },
      { id: "sobrancelhas", label: "Sobrancelhas" },
      { id: "maquiagem", label: "Maquiagem" },
      { id: "massagem", label: "Massagem" },
    ],
    serviceModeTitle: "Como você atende seus clientes?",
    serviceModeDescription: "Escolha os formatos que fazem parte da sua rotina.",
    serviceModes: [
      { id: "com-horario", label: "Com hora marcada" },
      { id: "por-chegada", label: "Por ordem de chegada" },
      { id: "no-espaco", label: "No meu espaço" },
      { id: "a-domicilio", label: "A domicílio" },
    ],
  },
  barbearia: {
    specialtyTitle: "Quais serviços sua barbearia oferece?",
    specialtyDescription: "Selecione os serviços mais importantes para seus clientes.",
    specialties: [
      { id: "corte", label: "Corte de cabelo" },
      { id: "barba", label: "Barba e bigode" },
      { id: "corte-barba", label: "Cabelo e barba" },
      { id: "pigmentacao", label: "Pigmentação" },
      { id: "tratamento-capilar", label: "Tratamento capilar" },
      { id: "infantil", label: "Corte infantil" },
    ],
    serviceModeTitle: "Qual é o seu estilo de atendimento?",
    serviceModeDescription: "Isso ajuda a orientar seus clientes antes da primeira visita.",
    serviceModes: [
      { id: "com-horario", label: "Com hora marcada" },
      { id: "por-chegada", label: "Por ordem de chegada" },
      { id: "no-espaco", label: "Na barbearia" },
      { id: "a-domicilio", label: "Atendimento a domicílio" },
    ],
  },
  alimentacao: {
    specialtyTitle: "O que tem no seu cardápio?",
    specialtyDescription: "Escolha os tipos de produto que representam sua cozinha.",
    specialties: [
      { id: "pizzas", label: "Pizzas" },
      { id: "lanches", label: "Lanches e hambúrgueres" },
      { id: "refeicoes", label: "Refeições" },
      { id: "cafes", label: "Cafés" },
      { id: "bebidas", label: "Bebidas" },
      { id: "sobremesas", label: "Sobremesas" },
      { id: "mercado", label: "Produtos e mercearia" },
    ],
    serviceModeTitle: "Como seus clientes podem pedir?",
    serviceModeDescription: "Selecione as formas de atendimento disponíveis.",
    serviceModes: [
      { id: "consumo-local", label: "Consumo no local" },
      { id: "retirada", label: "Retirada no balcão" },
      { id: "entrega", label: "Entrega" },
      { id: "encomenda", label: "Encomendas" },
    ],
  },
  saude: {
    specialtyTitle: "Qual é sua área de saúde?",
    specialtyDescription: "Selecione as especialidades que você atende.",
    specialties: [
      { id: "medicina", label: "Medicina" },
      { id: "odontologia", label: "Odontologia" },
      { id: "fisioterapia", label: "Fisioterapia" },
      { id: "psicologia", label: "Psicologia" },
      { id: "psicanalista", label: "Psicanalista" },
      { id: "nutricao", label: "Nutrição" },
      { id: "terapias", label: "Terapias e bem-estar" },
    ],
    serviceModeTitle: "Como funciona o atendimento?",
    serviceModeDescription: "Marque os formatos que você oferece aos pacientes.",
    serviceModes: [
      { id: "consultorio", label: "No consultório" },
      { id: "online", label: "Teleatendimento" },
      { id: "domiciliar", label: "Atendimento domiciliar" },
      { id: "com-horario", label: "Com hora marcada" },
    ],
  },
  automotivo: {
    specialtyTitle: "Quais serviços automotivos você realiza?",
    specialtyDescription: "Marque os tipos de serviço que sua equipe oferece.",
    specialties: [
      { id: "mecanica", label: "Mecânica" },
      { id: "eletrica", label: "Elétrica automotiva" },
      { id: "pneus", label: "Pneus e alinhamento" },
      { id: "lavagem", label: "Lavagem e estética" },
      { id: "funilaria", label: "Funilaria e pintura" },
      { id: "som-acessorios", label: "Som e acessórios" },
    ],
    serviceModeTitle: "Como você recebe os veículos?",
    serviceModeDescription: "Escolha as formas de atendimento da sua oficina.",
    serviceModes: [
      { id: "na-oficina", label: "Na oficina" },
      { id: "agendamento", label: "Com agendamento" },
      { id: "orcamento", label: "Orçamento antes do serviço" },
      { id: "socorro", label: "Socorro no local" },
    ],
  },
  casa: {
    specialtyTitle: "Quais serviços para casa você oferece?",
    specialtyDescription: "Selecione os trabalhos que seus clientes podem solicitar.",
    specialties: [
      { id: "eletrica-residencial", label: "Elétrica" },
      { id: "encanamento", label: "Encanamento" },
      { id: "reformas", label: "Reformas" },
      { id: "pintura", label: "Pintura" },
      { id: "limpeza", label: "Limpeza" },
      { id: "montagem", label: "Montagem e instalação" },
    ],
    serviceModeTitle: "Como o serviço é realizado?",
    serviceModeDescription: "Defina como você costuma atender cada solicitação.",
    serviceModes: [
      { id: "no-endereco", label: "Na casa do cliente" },
      { id: "area-atendimento", label: "Em uma área de atendimento" },
      { id: "orcamento", label: "Com orçamento prévio" },
      { id: "agendamento", label: "Com agendamento" },
    ],
  },
  educacao: {
    specialtyTitle: "O que você ensina?",
    specialtyDescription: "Marque as aulas, cursos ou acompanhamentos que oferece.",
    specialties: [
      { id: "reforco", label: "Reforço escolar" },
      { id: "idiomas", label: "Idiomas" },
      { id: "musica", label: "Música" },
      { id: "cursos", label: "Cursos e oficinas" },
      { id: "esportes", label: "Esportes e movimento" },
      { id: "consultoria-educacional", label: "Orientação educacional" },
    ],
    serviceModeTitle: "Como são suas aulas?",
    serviceModeDescription: "Selecione os formatos que você disponibiliza.",
    serviceModes: [
      { id: "presencial", label: "Presenciais" },
      { id: "online", label: "Online" },
      { id: "individual", label: "Individuais" },
      { id: "grupo", label: "Em grupo" },
    ],
  },
  pet: {
    specialtyTitle: "Como você cuida dos pets?",
    specialtyDescription: "Selecione os serviços que tutores podem encontrar.",
    specialties: [
      { id: "veterinaria", label: "Veterinária" },
      { id: "banho-tosa", label: "Banho e tosa" },
      { id: "creche-hotel", label: "Creche e hospedagem" },
      { id: "passeio", label: "Passeio" },
      { id: "adestramento", label: "Adestramento" },
      { id: "produtos-pet", label: "Produtos para pets" },
    ],
    serviceModeTitle: "Onde o atendimento acontece?",
    serviceModeDescription: "Marque como você recebe os pets e seus tutores.",
    serviceModes: [
      { id: "loja-clinica", label: "Na loja ou clínica" },
      { id: "a-domicilio", label: "A domicílio" },
      { id: "agendamento", label: "Com agendamento" },
      { id: "hospedagem", label: "Hospedagem" },
    ],
  },
  "servicos-domesticos": {
    specialtyTitle: "Quais serviços domésticos você oferece?",
    specialtyDescription: "Selecione as tarefas que seus clientes podem contratar.",
    specialties: [
      { id: "limpeza-residencial", label: "Limpeza residencial" },
      { id: "passadoria", label: "Passadoria de roupas" },
      { id: "organizacao", label: "Organização da casa" },
      { id: "cozinha-domestica", label: "Preparo de refeições" },
      { id: "lavanderia", label: "Lavanderia" },
      { id: "cuidados-domesticos", label: "Apoio à rotina da casa" },
    ],
    serviceModeTitle: "Como você atende?",
    serviceModeDescription: "Escolha os formatos de atendimento que oferece.",
    serviceModes: [
      { id: "na-casa-cliente", label: "Na casa do cliente" },
      { id: "recorrente", label: "Atendimento recorrente" },
      { id: "servico-avulso", label: "Serviço avulso" },
      { id: "materiais-inclusos", label: "Levo os materiais" },
    ],
  },
  "outros-servicos": {
    specialtyTitle: "Que tipo de serviço você oferece?",
    specialtyDescription: "Escolha as áreas que melhor descrevem seu trabalho.",
    specialties: [
      { id: "consultoria", label: "Consultoria" },
      { id: "fotografia", label: "Fotografia" },
      { id: "tecnologia", label: "Tecnologia" },
      { id: "eventos", label: "Eventos" },
      { id: "servicos-criativos", label: "Serviços criativos" },
      { id: "outro", label: "Outro serviço" },
    ],
    serviceModeTitle: "Como você atende?",
    serviceModeDescription: "Selecione os formatos disponíveis para seus clientes.",
    serviceModes: [
      { id: "presencial", label: "Presencialmente" },
      { id: "online", label: "Online" },
      { id: "a-domicilio", label: "A domicílio" },
      { id: "com-horario", label: "Com hora marcada" },
    ],
  },
};

const popularStateShortcuts = [
  "TODOS",
  "SP",
  "RJ",
  "MG",
  "PR",
  "RS",
  "SC",
  "BA",
  "PE",
  "CE",
  "GO",
  "DF",
  "ES",
  "MT",
  "MS",
  "PA",
  "AM",
];

const stepNavigationButtonClass =
  "inline-flex flex-1 min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dedfd6] bg-white px-4 py-2.5 text-sm font-semibold text-[#51534c] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#c7c9bc] hover:bg-[#fafaf7] hover:text-[#292b25] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:translate-y-0 active:scale-[0.98]";

function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  const prefixLength = digits.length > 10 ? 5 : 4;
  const formattedSubscriber =
    subscriber.length > prefixLength
      ? `${subscriber.slice(0, prefixLength)}-${subscriber.slice(prefixLength)}`
      : subscriber;

  return `(${areaCode}) ${formattedSubscriber}`;
}

function OnboardingPage() {
  const { createBusiness, user, ready } = useLocalHub();
  const [step, setStep] = useState(1);
  const [onboardingDetails, setOnboardingDetails] = useState<BusinessOnboardingDetails>({
    specialties: [],
    serviceModes: [],
  });
  const [form, setForm] = useState({
    name: "",
    category: "beleza",
    city: "",
    phone: "",
    slug: "",
    description: "",
    address: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [creationCompleted, setCreationCompleted] = useState(false);
  const [cepInput, setCepInput] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [selectedStateFilter, setSelectedStateFilter] = useState("TODOS");
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const suggestedCities = useMemo(() => {
    return searchCities(citySearchQuery, selectedStateFilter, 28);
  }, [citySearchQuery, selectedStateFilter]);

  async function handleCepSearch(rawCep: string) {
    const clean = rawCep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setCepFeedback({ type: "error", message: "Digite um CEP válido com 8 dígitos." });
      return;
    }
    setCepLoading(true);
    setCepFeedback({ type: "info", message: "Localizando endereço via CEP..." });
    try {
      const result = await fetchAddressFromCep(clean);
      if (result) {
        update("city", result.fullCity);
        if (result.formattedAddress) {
          update("address", result.formattedAddress);
        }
        setCepFeedback({
          type: "success",
          message: `✓ Localizado: ${result.fullCity} — cidade e endereço preenchidos!`,
        });
      } else {
        setCepFeedback({
          type: "error",
          message: "CEP não encontrado. Você pode escolher ou digitar sua cidade abaixo.",
        });
      }
    } catch {
      setCepFeedback({
        type: "error",
        message: "Não foi possível consultar o CEP no momento. Escolha sua cidade abaixo.",
      });
    } finally {
      setCepLoading(false);
    }
  }

  function handleCepChange(val: string) {
    const formatted = formatCep(val);
    setCepInput(formatted);
    setCepFeedback(null);
    if (formatted.replace(/\D/g, "").length === 8) {
      void handleCepSearch(formatted);
    }
  }
  const pageSlug = createSlug(form.slug || form.name);
  const categoryBackground = categoryBackgrounds[form.category];
  const setupProfile = setupProfiles[form.category] ?? setupProfiles["outros-servicos"];
  const CategoryIcon = categories.find(({ id }) => id === form.category)?.icon ?? Wrench;
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const toggleOnboardingChoice = (key: "specialties" | "serviceModes", choice: string) =>
    setOnboardingDetails((current) => ({
      ...current,
      [key]: current[key].includes(choice)
        ? current[key].filter((value) => value !== choice)
        : [...current[key], choice],
    }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 5 || saving) return;
    const slug = pageSlug;
    if (!slug) return setError("Escolha um nome para o endereço da sua página.");
    if (![10, 11].includes(form.phone.replace(/\D/g, "").length)) {
      setError("Informe um WhatsApp válido com DDD antes de continuar.");
      setStep(3);
      return;
    }
    setSaving(true);
    try {
      await createBusiness({ ...form, slug, onboardingDetails });
      sessionStorage.setItem("ello_show_onboarding_tour", "true");
      setCreationCompleted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar sua página.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="grid min-h-screen place-items-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  const heading = creationCompleted
    ? "Sua página está pronta."
    : step === 1
      ? "Conte sobre seu negócio."
      : step === 2
        ? "Onde seu negócio atende?"
        : step === 3
          ? "Como seus clientes entram em contato?"
          : step === 4
            ? setupProfile.specialtyTitle
            : setupProfile.serviceModeTitle;
  const introduction = creationCompleted
    ? "Confira como seus clientes vão encontrar seu negócio ou siga para o painel para personalizar os detalhes."
    : step === 1
      ? "Vamos preparar sua página para apresentar seus produtos e serviços."
      : step === 2
        ? "Informe sua cidade ou use o CEP opcional para localizar seu endereço automaticamente."
        : step === 3
          ? "Defina seu WhatsApp e o endereço curto da sua página."
          : step === 4
            ? setupProfile.specialtyDescription
            : setupProfile.serviceModeDescription;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f5f4ef] px-4 py-8 text-[#292b25] sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-500"
        style={{
          backgroundImage: categoryBackground
            ? `linear-gradient(115deg, rgba(245,244,239,.56), rgba(245,244,239,.68)), url("${categoryBackground}")`
            : "linear-gradient(115deg, #f5f4ef, #edf0e5)",
        }}
      />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-[-.04em]">
          <span className="ello-brand-mark ello-brand-mark-small">e</span>
          ello
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  creationCompleted
                    ? "w-7 bg-emerald-600"
                    : s === step
                      ? "w-8 bg-[#292b25]"
                      : s < step
                        ? "w-6 bg-[#667448]"
                        : "w-4 bg-[#dedfd6]"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {creationCompleted ? "PRONTO" : `PASSO ${step} DE 5`}
          </span>
          {!creationCompleted && step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              aria-label="Voltar para o passo anterior"
              title="Voltar para o passo anterior"
              className="flex size-8.5 items-center justify-center rounded-xl border border-[#e2e4d8] bg-white text-[#667448] shadow-xs transition hover:bg-[#edf0e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9668]"
            >
              <ArrowLeft size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>
      <div className="relative mx-auto mt-8 grid max-w-5xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-16 lg:pt-8">
        <section>
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-[#e2e4d8] bg-[#edf0e5] text-[#667448]">
            {creationCompleted ? (
              <BadgeCheck size={22} />
            ) : step === 1 ? (
              <CategoryIcon size={22} />
            ) : step === 2 ? (
              <MapPin size={22} />
            ) : step === 3 ? (
              <Phone size={22} />
            ) : step === 4 ? (
              <Sparkles size={22} />
            ) : (
              <Clock3 size={22} />
            )}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#778253]">
            Vamos começar
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-md leading-7 text-slate-500">{introduction}</p>
          <div className="mt-7 hidden space-y-3 lg:block">
            {[
              "Uma página feita para seu negócio",
              "Catálogo que você controla",
              "Agendamentos num só lugar",
            ].map((line) => (
              <div key={line} className="flex items-center gap-2 text-sm text-slate-600">
                <Check size={16} className="text-emerald-600" />
                {line}
              </div>
            ))}
          </div>
        </section>
        <form
          onSubmit={(event) => void submit(event)}
          className="rounded-2xl border border-white/70 bg-[#fbfaf7]/90 p-5 shadow-[0_24px_80px_-38px_rgba(40,44,31,.24)] backdrop-blur-xl sm:p-8"
        >
          {creationCompleted ? (
            <div className="space-y-6" role="status">
              <div className="flex items-start gap-3 rounded-xl border border-[#dce4c8] bg-[#f1f4e9] p-4">
                <BadgeCheck
                  className="mt-0.5 shrink-0 text-[#687847]"
                  size={22}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[#34392b]">
                    {form.name} já tem um espaço na ELLO
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    As informações do cadastro foram salvas. Você pode revisar serviços, fotos e
                    horários no painel.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e4d8] bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#778253]">
                  Link da sua página
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-[#292b25]">
                  ello.app.br/loja/{pageSlug}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={`/loja/${pageSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={stepNavigationButtonClass}
                >
                  Ver página pública <ArrowRight size={16} aria-hidden="true" />
                </a>
                <Link
                  to="/studio"
                  onClick={() => sessionStorage.setItem("ello_show_onboarding_tour", "true")}
                  className={`${primaryButtonClass} w-full`}
                >
                  Ir para meu painel <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : step === 1 ? (
            <div key="step-1" className="space-y-6">
              <Field label="Nome do negócio">
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    update("name", name);
                    if (!slugEdited) update("slug", createSlug(name));
                  }}
                  placeholder="Ex.: Studio Bella"
                  className={inputClass}
                />
              </Field>
              <fieldset className="min-w-0">
                <legend className="mb-2 text-sm font-semibold text-slate-700">
                  Tipo de negócio
                </legend>
                <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {categories.map(({ id, label, icon: Icon }) => {
                    const selected = form.category === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          if (form.category !== id) {
                            setOnboardingDetails({ specialties: [], serviceModes: [] });
                          }
                          update("category", id);
                        }}
                        aria-pressed={selected}
                        className={`flex min-h-14 min-w-0 items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-semibold leading-tight shadow-xs transition-all duration-150 active:scale-[0.98] sm:text-sm ${
                          selected
                            ? "border-[#8a9668] bg-[#edf0e5] text-[#343e20] ring-2 ring-[#8a9668]/30 font-bold"
                            : "border-[#dedfd6] bg-white text-slate-700 hover:border-[#c7c9bc] hover:bg-[#fafaf7]"
                        }`}
                      >
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                            selected
                              ? "bg-[#dce3ce] text-[#343e20]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 break-words">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <Field
                label="Uma frase sobre seu negócio"
                hint="Descreva o que seus clientes encontram, diferenciais ou especialidades."
              >
                <div className="relative">
                  <textarea
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Conte o que seus clientes encontram por aqui..."
                    className={`${inputClass} resize-none pb-6`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] font-medium text-slate-400">
                    {form.description.length}/1000
                  </span>
                </div>
              </Field>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!form.name.trim()}
                className={`${primaryButtonClass} w-full`}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          ) : step === 2 ? (
            <div key="step-2" className="space-y-6">
              {/* Card de Preenchimento por CEP Opcional */}
              <div className="rounded-2xl border border-[#dedfd6] bg-white/90 p-4 shadow-xs backdrop-blur-sm sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-[#edf0e5] text-[#4c5832]">
                      <MapPin size={15} />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-[#292b25] sm:text-sm">
                        Preenchimento rápido por CEP (opcional)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Localiza cidade, bairro e rua automaticamente via correios
                      </p>
                    </div>
                  </div>
                  {cepLoading && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <Loader2 size={13} className="animate-spin" /> Buscando...
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      value={cepInput}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="Ex.: 13010-000"
                      className={inputClass}
                      aria-label="CEP opcional para preenchimento automático"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCepSearch(cepInput)}
                    disabled={cepLoading || cepInput.replace(/\D/g, "").length !== 8}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#cfd4be] bg-[#edf0e5] px-4 text-xs font-semibold text-[#343e20] transition hover:bg-[#e2e7d7] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Search size={14} /> Buscar CEP
                  </button>
                </div>

                {cepFeedback && (
                  <div
                    className={`mt-2.5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                      cepFeedback.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : cepFeedback.type === "info"
                          ? "border border-amber-200 bg-amber-50 text-amber-800"
                          : "border border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {cepFeedback.type === "success" && (
                      <Check size={14} className="shrink-0 text-emerald-600" />
                    )}
                    <span>{cepFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Campo Cidade & Pesquisa Rápida */}
              <div className="space-y-3">
                <Field
                  label="Cidade do negócio"
                  hint="Digite o nome da sua cidade ou selecione uma das sugestões abaixo."
                >
                  <div className="relative">
                    <Building2
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoFocus
                      required
                      list="brazilian-cities-list"
                      value={form.city}
                      onChange={(event) => {
                        const val = event.target.value;
                        update("city", val);
                        setCitySearchQuery(val);
                      }}
                      placeholder="Ex.: Campinas, SP ou São José dos Campos, SP"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                  <datalist id="brazilian-cities-list">
                    {suggestedCities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </Field>

                {/* Filtro rápido por Estado */}
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Filtro rápido por Estado:</span>
                    <span className="text-[11px] text-slate-400">Clique para filtrar cidades</span>
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Filtrar cidades por estado"
                  >
                    {popularStateShortcuts.map((uf) => {
                      const active = selectedStateFilter === uf;
                      return (
                        <button
                          type="button"
                          key={uf}
                          onClick={() => setSelectedStateFilter(uf)}
                          aria-pressed={active}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            active
                              ? "bg-[#343e20] text-white shadow-xs"
                              : "border border-[#dedfd6] bg-white text-slate-600 hover:border-[#b7c294] hover:bg-[#edf0e5]"
                          }`}
                        >
                          {uf}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chips de cidades sugeridas (capitais e pólos do interior) */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-700">
                    Sugestões rápidas de cidades{" "}
                    {selectedStateFilter !== "TODOS"
                      ? `em ${selectedStateFilter}`
                      : "(capitais e pólos regionais)"}
                    :
                  </div>
                  <div
                    role="group"
                    aria-label="Cidades sugeridas"
                    className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1"
                  >
                    {suggestedCities.map((city) => {
                      const selected = form.city.toLowerCase() === city.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={city}
                          onClick={() => {
                            update("city", city);
                            setCitySearchQuery("");
                          }}
                          aria-pressed={selected}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? "border-[#8a9668] bg-[#edf0e5] font-bold text-[#343e20] ring-2 ring-[#8a9668]/30"
                              : "border-[#dedfd6] bg-white text-slate-600 hover:border-[#c7c9bc] hover:bg-[#fafaf7]"
                          }`}
                        >
                          {selected && <Check size={12} className="text-[#343e20]" />}
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Endereço opcional */}
              <Field
                label="Endereço da sede ou atendimento (opcional)"
                hint="Rua, número, complemento e bairro (se tiver espaço físico ou retirada)."
              >
                <input
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Ex.: Av. Brasil, 1500 - Sala 12 - Centro"
                  className={inputClass}
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={stepNavigationButtonClass}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!form.city.trim()}
                  className={`${primaryButtonClass} flex-[2]`}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : step === 3 ? (
            <div key="step-3" className="space-y-5">
              <Field
                label="WhatsApp para contato"
                hint="Digite o número com DDD, sem o código do país. Ele será usado nos botões de WhatsApp da sua página."
              >
                <input
                  autoFocus
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={15}
                  value={form.phone}
                  onChange={(event) => {
                    setError("");
                    update("phone", formatBrazilianPhone(event.target.value));
                  }}
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Link público da sua página"
                hint="Escolha um endereço curto e fácil de lembrar. Você poderá compartilhá-lo com seus clientes."
              >
                <div className="flex items-center overflow-hidden rounded-xl border border-[#dedfd6] focus-within:border-[#8a9668] focus-within:ring-4 focus-within:ring-[#edf0e5]">
                  <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
                    /loja/
                  </span>
                  <input
                    required
                    value={form.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      update("slug", createSlug(event.target.value));
                    }}
                    placeholder="meu-negocio"
                    className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
                  />
                </div>
              </Field>
              <p className="-mt-3 rounded-lg bg-[#f1f2eb] px-3 py-2 text-xs text-slate-500">
                Seu link:{" "}
                <span className="font-semibold text-[#4c5832]">
                  ello.app.br/loja/{pageSlug || "seu-negocio"}
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={stepNavigationButtonClass}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={![10, 11].includes(form.phone.replace(/\D/g, "").length) || !pageSlug}
                  className={`${primaryButtonClass} flex-[2]`}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
              {error && step === 3 && (
                <p role="alert" className="text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}
            </div>
          ) : step === 4 ? (
            <div key="step-4" className="space-y-6">
              <fieldset className="min-w-0">
                <legend className="mb-2 text-sm font-semibold text-slate-700">
                  {setupProfile.specialtyTitle}
                </legend>
                <div
                  role="group"
                  aria-label={setupProfile.specialtyTitle}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {setupProfile.specialties.map(({ id, label }) => {
                    const selected = onboardingDetails.specialties.includes(id);
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => toggleOnboardingChoice("specialties", id)}
                        aria-pressed={selected}
                        data-selected={selected}
                        className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-semibold shadow-xs transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89966a] ${
                          selected
                            ? "border-[#8a9668] bg-[#edf0e5] text-[#343e20] ring-2 ring-[#8a9668]/30 font-bold"
                            : "border-[#dedfd6] bg-white text-slate-700 hover:border-[#c7c9bc] hover:bg-[#fafaf7]"
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-full transition-all ${
                            selected
                              ? "bg-[#586341] text-white scale-100"
                              : "border border-slate-300 bg-transparent opacity-40 scale-90"
                          }`}
                        >
                          <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">{setupProfile.specialtyDescription}</p>
              </fieldset>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={stepNavigationButtonClass}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className={`${primaryButtonClass} flex-[2]`}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full text-center text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4"
              >
                Pular por enquanto
              </button>
            </div>
          ) : (
            <div key="step-5" className="space-y-6">
              <fieldset className="min-w-0">
                <legend className="mb-2 text-sm font-semibold text-slate-700">
                  {setupProfile.serviceModeTitle}
                </legend>
                <div
                  role="group"
                  aria-label={setupProfile.serviceModeTitle}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {setupProfile.serviceModes.map(({ id, label }) => {
                    const selected = onboardingDetails.serviceModes.includes(id);
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => toggleOnboardingChoice("serviceModes", id)}
                        aria-pressed={selected}
                        data-selected={selected}
                        className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-semibold shadow-xs transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89966a] ${
                          selected
                            ? "border-[#8a9668] bg-[#edf0e5] text-[#343e20] ring-2 ring-[#8a9668]/30 font-bold"
                            : "border-[#dedfd6] bg-white text-slate-700 hover:border-[#c7c9bc] hover:bg-[#fafaf7]"
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-full transition-all ${
                            selected
                              ? "bg-[#586341] text-white scale-100"
                              : "border border-slate-300 bg-transparent opacity-40 scale-90"
                          }`}
                        >
                          <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {setupProfile.serviceModeDescription} Você pode selecionar mais de uma opção.
                </p>
                <p className="mt-2 min-h-5 text-xs font-medium text-[#667448]" aria-live="polite">
                  {onboardingDetails.serviceModes.length > 0
                    ? `${onboardingDetails.serviceModes.length} opção(ões) selecionada(s)`
                    : "Nenhuma opção selecionada"}
                </p>
              </fieldset>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className={stepNavigationButtonClass}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${primaryButtonClass} flex-[2]`}
                >
                  {saving ? "Salvando..." : "Criar minha página"} <ArrowRight size={16} />
                </button>
              </div>
              {error && (
                <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}
            </div>
          )}
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
            Suas informações ficam salvas com segurança e sincronizadas entre dispositivos.
          </p>
        </form>
      </div>
    </div>
  );
}
