import { useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, MapPin, Scissors, Store } from "lucide-react";
import { useLocalHub, createSlug } from "@/lib/localhub-context";
import { Field, inputClass, primaryButtonClass } from "@/components/localhub/ui";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const categories = [
  { id: "beleza", label: "Beleza & estética", icon: "✨" },
  { id: "barbearia", label: "Barbearia", icon: "💈" },
  { id: "alimentacao", label: "Alimentação", icon: "🍽️" },
  { id: "servicos", label: "Serviços locais", icon: "🛠️" },
];

function OnboardingPage() {
  const { createBusiness, user, ready } = useLocalHub();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = createSlug(form.slug || form.name);
    if (!slug) return setError("Escolha um nome para o endereço da sua página.");
    setSaving(true);
    try {
      await createBusiness({ ...form, slug });
      await navigate({ to: "/studio" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar sua página.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="grid min-h-screen place-items-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen bg-[#faf8ff] px-4 py-8 text-[#131b2e] sm:py-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Store size={18} />
          </span>
          LocalHub
        </Link>
        <span className="text-xs font-semibold text-slate-400">PASSO {step} DE 2</span>
      </header>
      <div className="mx-auto mt-8 grid max-w-5xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-16 lg:pt-8">
        <section>
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            {step === 1 ? <Scissors size={22} /> : <MapPin size={22} />}
          </div>
          <div className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">
            Vamos começar
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {step === 1 ? "Conte sobre seu negócio." : "Onde seus clientes encontram você?"}
          </h1>
          <p className="mt-4 max-w-md leading-7 text-slate-500">
            {step === 1
              ? "Vamos preparar sua página para apresentar seus produtos e serviços."
              : "Adicione localização e contato. Você pode mudar essas informações depois."}
          </p>
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
          className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_24px_80px_-38px_rgba(40,44,91,.25)] sm:p-8"
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
                  {categories.map(({ id, label, icon }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => update("category", id)}
                      className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold transition sm:text-sm ${form.category === id ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
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
          ) : (
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
              <Field label="WhatsApp">
                <input
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
                hint="Escolha um endereço curto para a prévia da sua página."
              >
                <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
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
              <Field label="Endereço (opcional)">
                <input
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Rua, número e bairro"
                  className={inputClass}
                />
              </Field>
              {error && (
                <p role="alert" className="text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${primaryButtonClass} flex-[2]`}
                >
                  {saving ? "Salvando..." : "Criar minha página"} <ArrowRight size={16} />
                </button>
              </div>
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
