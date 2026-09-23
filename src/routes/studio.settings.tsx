import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Globe2, Save } from "lucide-react";
import { Field, inputClass, PageTitle, primaryButtonClass } from "@/components/localhub/ui";
import { createSlug, useLocalHub } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/settings")({ component: SettingsPage });

function SettingsPage() {
  const { business, saveBusiness } = useLocalHub();
  const [form, setForm] = useState({ ...business! });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveBusiness({ ...form, slug: createSlug(form.slug) });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }
  async function copy() {
    await navigator.clipboard.writeText(window.location.origin + "/loja/" + form.slug);
    setSaved(true);
  }
  return (
    <>
      <PageTitle
        eyebrow="Presença online"
        title="Minha página"
        description="Atualize as informações que seus clientes veem ao acessar seu link."
      />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <form
          onSubmit={(event) => void submit(event)}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="font-bold">Informações do negócio</h2>
          <p className="mt-1 text-xs text-slate-400">Mantenha seu perfil atualizado.</p>
          <div className="mt-5 space-y-4">
            <Field label="Nome">
              <input
                required
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Sobre o negócio">
              <textarea
                rows={4}
                maxLength={220}
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                className={inputClass + " resize-none"}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cidade">
                <input
                  required
                  value={form.city}
                  onChange={(event) => set("city", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Endereço">
              <input
                value={form.address}
                onChange={(event) => set("address", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Link público" hint="Use letras, números e hífens.">
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 focus-within:border-[#8a9668]">
                <span className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
                  /loja/
                </span>
                <input
                  required
                  value={form.slug}
                  onChange={(event) => set("slug", createSlug(event.target.value))}
                  className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
                />
              </div>
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span role="status" className="text-xs font-semibold text-emerald-700">
              {saved ? "Alterações salvas na nuvem" : ""}
            </span>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              <Save size={15} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e1e3d8] bg-gradient-to-br from-[#edf0e5] to-white p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Globe2 className="text-[#667448]" size={18} />
              Endereço da prévia
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              A página pública permanece disponível por este link e reflete os dados da nuvem.
            </p>
            <div className="mt-4 break-all rounded-xl border border-[#e1e3d8] bg-white px-3 py-3 text-sm font-semibold text-[#586341]">
              {typeof window !== "undefined" ? window.location.origin : ""}/loja/{form.slug}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => void copy()}
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292b25] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#414338]"
              >
                <Copy size={14} />
                Copiar endereço
              </button>
              <a
                href={"/loja/" + form.slug}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e1e3d8] bg-white px-3 py-2.5 text-xs font-bold text-[#586341]"
              >
                <ExternalLink size={14} />
                Abrir página
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Check size={17} />
              Privacidade dos dados
            </div>
            <p className="mt-2 text-xs leading-5 text-amber-800/80">
              Os dados do negócio e os agendamentos são protegidos por políticas de acesso no banco.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
