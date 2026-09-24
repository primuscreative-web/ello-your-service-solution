import { useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Check,
  CarFront,
  HeartPulse,
  House,
  MapPin,
  Phone,
  PawPrint,
  GraduationCap,
  Scissors,
  Sparkles,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { useLocalHub, createSlug, type BusinessOnboardingDetails } from "@/lib/localhub-context";
import { Field, inputClass, primaryButtonClass } from "@/components/localhub/ui";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const categories = [
  { id: "beleza", label: "Beleza & estética", icon: Sparkles },
  { id: "barbearia", label: "Barbearia", icon: Scissors },
  { id: "alimentacao", label: "Alimentação", icon: UtensilsCrossed },
  { id: "servicos", label: "Serviços locais", icon: Wrench },
];

const serviceCategories = [
  { id: "saude", label: "Saúde e bem-estar", icon: HeartPulse },
  { id: "automotivo", label: "Automotivo", icon: CarFront },
  { id: "casa", label: "Casa e manutenção", icon: House },
  { id: "educacao", label: "Educação", icon: GraduationCap },
  { id: "pet", label: "Pet", icon: PawPrint },
  { id: "outros-servicos", label: "Outros serviços", icon: Wrench },
];

const categoryBackgrounds: Record<string, string> = {
  beleza:
    "/localhub/luxury_aesthetic_nail_salon_and_beauty_spa_interior_elegant_aesthetic_with_pink/screen.png",
  barbearia:
    "/localhub/close_up_modern_clean_barbershop_showcase_before_and_after_grooming_comparison/screen.png",
  alimentacao:
    "/localhub/artisanal_gourmet_burger_restaurant_cozy_interior_and_rustic_ambiance_warm/screen.png",
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
      { id: "cafes-bebidas", label: "Cafés e bebidas" },
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

const stepNavigationButtonClass =
  "flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50";

function OnboardingPage() {
  const { createBusiness, user, ready } = useLocalHub();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [servicesExpanded, setServicesExpanded] = useState(false);
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
  const isServiceCategory = serviceCategories.some(({ id }) => id === form.category);
  const categoryBackground = categoryBackgrounds[form.category];
  const setupProfile = setupProfiles[form.category] ?? setupProfiles["outros-servicos"];
  const CategoryIcon =
    [...categories, ...serviceCategories].find(({ id }) => id === form.category)?.icon ?? Wrench;
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const toggleOnboardingChoice = (key: keyof BusinessOnboardingDetails, choice: string) =>
    setOnboardingDetails((current) => ({
      ...current,
      [key]: current[key].includes(choice)
        ? current[key].filter((value) => value !== choice)
        : [...current[key], choice],
    }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 5) return;
    const slug = createSlug(form.slug || form.name);
    if (!slug) return setError("Escolha um nome para o endereço da sua página.");
    setSaving(true);
    try {
      await createBusiness({ ...form, slug, onboardingDetails });
      await navigate({ to: "/studio" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar sua página.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="grid min-h-screen place-items-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  const heading =
    step === 1
      ? "Conte sobre seu negócio."
      : step === 2
        ? "Onde seu negócio atende?"
        : step === 3
          ? "Como seus clientes entram em contato?"
          : step === 4
            ? setupProfile.specialtyTitle
            : setupProfile.serviceModeTitle;
  const introduction =
    step === 1
      ? "Vamos preparar sua página para apresentar seus produtos e serviços."
      : step === 2
        ? "Informe a cidade e, se quiser, o endereço onde seu negócio funciona."
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
            ? `linear-gradient(115deg, rgba(245,244,239,.78), rgba(245,244,239,.88)), url("${categoryBackground}")`
            : "linear-gradient(115deg, #f5f4ef, #edf0e5)",
        }}
      />
      <header className="relative mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-[-.04em]">
          <span className="ello-brand-mark ello-brand-mark-small">e</span>
          ello
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">PASSO {step} DE 5</span>
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={step === 1}
            aria-label="Voltar para o passo 1"
            title="Voltar para o passo 1"
            className="flex size-8 items-center justify-center rounded-lg border border-[#e2e4d8] text-[#667448] transition hover:bg-[#edf0e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a9668] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={15} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="relative mx-auto mt-8 grid max-w-5xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-16 lg:pt-8">
        <section>
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-[#e2e4d8] bg-[#edf0e5] text-[#667448]">
            {step === 1 ? (
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
          {step === 1 ? (
            <div className="space-y-6">
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
              <Field label="Tipo de negócio">
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(({ id, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        if (form.category !== id) {
                          setOnboardingDetails({ specialties: [], serviceModes: [] });
                        }
                        update("category", id);
                        setServicesExpanded(id === "servicos");
                      }}
                      aria-pressed={
                        id === "servicos"
                          ? isServiceCategory || servicesExpanded
                          : form.category === id
                      }
                      aria-expanded={id === "servicos" ? servicesExpanded : undefined}
                      aria-controls={id === "servicos" ? "service-category-options" : undefined}
                      className={`flex min-h-14 items-center gap-2 rounded-[10px] border px-3 text-left text-xs font-semibold transition sm:text-sm ${(id === "servicos" ? isServiceCategory || servicesExpanded : form.category === id) ? "border-[#b7c294] bg-[#edf0e5] text-[#4c5832]" : "border-[#dedfd6] text-slate-600 hover:bg-[#f7f7f1]"}`}
                    >
                      <Icon size={17} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
                {servicesExpanded && (
                  <div
                    id="service-category-options"
                    className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                  >
                    {serviceCategories.map(({ id, label, icon: Icon }) => (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          if (form.category !== id) {
                            setOnboardingDetails({ specialties: [], serviceModes: [] });
                          }
                          update("category", id);
                        }}
                        aria-pressed={form.category === id}
                        className={`flex min-h-12 items-center gap-2 rounded-[10px] border px-3 text-left text-xs font-semibold transition ${form.category === id ? "border-[#b7c294] bg-[#edf0e5] text-[#4c5832]" : "border-[#dedfd6] bg-white/70 text-slate-600 hover:bg-white"}`}
                      >
                        <Icon size={16} aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="Uma frase sobre seu negócio">
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  rows={3}
                  maxLength={220}
                  placeholder="Conte o que seus clientes encontram por aqui..."
                  className={`${inputClass} resize-none`}
                />
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
            <div className="space-y-5">
              <Field label="Cidade">
                <input
                  autoFocus
                  required
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                  placeholder="Ex.: São Paulo, SP"
                  className={inputClass}
                />
              </Field>
              <Field label="Endereço (opcional)" hint="Você pode adicionar rua, número e bairro.">
                <input
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Rua, número e bairro"
                  className={inputClass}
                />
              </Field>
              <div className="flex gap-3">
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
            <div className="space-y-5">
              <Field label="WhatsApp">
                <input
                  autoFocus
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="(11) 99999-9999"
                  className={inputClass}
                />
              </Field>
              <Field
                label="Endereço da sua página"
                hint="Escolha um endereço curto para compartilhar."
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
                  disabled={!form.phone.trim() || !createSlug(form.slug || form.name)}
                  className={`${primaryButtonClass} flex-[2]`}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : step === 4 ? (
            <div className="space-y-6">
              <Field label={setupProfile.specialtyTitle} hint={setupProfile.specialtyDescription}>
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
                        className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-[#b7c294] bg-[#edf0e5] text-[#4c5832]" : "border-[#dedfd6] bg-white/65 text-slate-600 hover:bg-white"}`}
                      >
                        {label}
                        {selected && <Check size={16} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </Field>
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
            <div className="space-y-6">
              <Field
                label={setupProfile.serviceModeTitle}
                hint={setupProfile.serviceModeDescription}
              >
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
                        className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? "border-[#b7c294] bg-[#edf0e5] text-[#4c5832]" : "border-[#dedfd6] bg-white/65 text-slate-600 hover:bg-white"}`}
                      >
                        {label}
                        {selected && <Check size={16} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </Field>
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
