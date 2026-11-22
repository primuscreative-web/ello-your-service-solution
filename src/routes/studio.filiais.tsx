import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin, Pencil, Phone, Plus, Power, X } from "lucide-react";
import { toast } from "sonner";
import {
  Field,
  inputClass,
  PageTitle,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasPlanFeature } from "@/lib/plan-access";
import { MARKETS } from "@/lib/market-pricing";

export const Route = createFileRoute("/studio/filiais")({ component: BusinessUnitsPage });

type BusinessUnit = {
  id: string;
  name: string;
  country_code: string;
  city: string;
  address: string;
  phone: string;
  is_active: boolean;
  created_at: string;
};

type UnitForm = Pick<BusinessUnit, "name" | "country_code" | "city" | "address" | "phone">;

const emptyForm: UnitForm = { name: "", country_code: "BR", city: "", address: "", phone: "" };

function BusinessUnitsPage() {
  const { business, planSubscription, ready, isStaffAccount } = useLocalHub();
  const canManage = hasPlanFeature(planSubscription, "multi_unit") && !isStaffAccount;
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [form, setForm] = useState<UnitForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    if (!business?.id || !canManage) {
      setUnits([]);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Não foi possível conectar ao serviço de dados.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase.rpc("localhub_list_business_units", {
      p_business_id: business.id,
    });

    if (queryError) {
      setError("Não foi possível carregar as filiais. Tente novamente em instantes.");
      setLoading(false);
      return;
    }

    setUnits(Array.isArray(data) ? (data as BusinessUnit[]) : []);
    setLoading(false);
  }, [business?.id, canManage]);

  useEffect(() => {
    if (ready) void loadUnits();
  }, [loadUnits, ready]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (unit: BusinessUnit) => {
    setEditingId(unit.id);
    setForm({
      name: unit.name,
      country_code: unit.country_code,
      city: unit.city,
      address: unit.address,
      phone: unit.phone,
    });
    setFormOpen(true);
  };

  const saveUnit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!business?.id || saving) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Não foi possível conectar ao serviço de dados.");
      return;
    }

    setSaving(true);
    const { error: saveError } = await supabase.rpc("localhub_save_business_unit", {
      p_business_id: business.id,
      p_unit_id: editingId,
      p_name: form.name.trim(),
      p_country_code: form.country_code,
      p_city: form.city.trim(),
      p_address: form.address.trim(),
      p_phone: form.phone.trim(),
    });
    setSaving(false);

    if (saveError) {
      toast.error(
        saveError.message?.includes("INVALID_UNIT_DATA")
          ? "Confira o nome, a cidade, o endereço e o telefone da filial."
          : "Não foi possível salvar a filial. Tente novamente.",
      );
      return;
    }

    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    toast.success(editingId ? "Filial atualizada." : "Filial cadastrada.");
    await loadUnits();
  };

  const toggleUnit = async (unit: BusinessUnit) => {
    if (!business?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Não foi possível conectar ao serviço de dados.");
      return;
    }

    const { data, error: updateError } = await supabase.rpc("localhub_set_business_unit_active", {
      p_business_id: business.id,
      p_unit_id: unit.id,
      p_is_active: !unit.is_active,
    });

    if (updateError || data !== true) {
      toast.error("Não foi possível alterar o status desta filial.");
      return;
    }

    toast.success(
      unit.is_active ? "Filial desativada; os dados foram mantidos." : "Filial ativada.",
    );
    await loadUnits();
  };

  if (!ready || loading) {
    return (
      <div className="grid min-h-64 place-items-center text-sm text-slate-500">
        Carregando filiais…
      </div>
    );
  }

  if (!canManage) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf0e5] text-[#586341]">
          <Building2 size={26} />
        </div>
        <h1 className="mt-4 text-xl font-black text-slate-900">Gestão de filiais</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Este recurso está disponível no plano Business. Faça upgrade para cadastrar endereços e
          contatos das unidades.
        </p>
        <Link to="/planos" className={`${primaryButtonClass} mt-5 inline-flex`}>
          Conhecer o plano Business
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0">
      <PageTitle
        eyebrow="Business"
        title="Gestão de filiais"
        description="Cadastre filiais sem limite no Business e mantenha seus endereços e contatos organizados."
        action={
          <button type="button" onClick={openCreate} className={primaryButtonClass}>
            <Plus size={16} /> Adicionar filial
          </button>
        }
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#dfe4d2] bg-[#f7f8f3] p-4 text-sm text-[#4f5940]">
        <Building2 size={18} className="mt-0.5 shrink-0" />
        <p>
          Nesta etapa, a gestão cobre o cadastro dos locais. A separação de agenda, catálogo, equipe
          e relatórios por filial será conectada nas próximas etapas.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void loadUnits()} className="font-bold underline">
            Tentar novamente
          </button>
        </div>
      )}

      {units.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <MapPin size={30} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-base font-bold text-slate-900">Nenhuma filial cadastrada</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Registre os dados de localização e contato para começar a organizar suas unidades.
          </p>
          <button type="button" onClick={openCreate} className={`${secondaryButtonClass} mt-5`}>
            <Plus size={16} /> Cadastrar primeira filial
          </button>
        </section>
      ) : (
        <section aria-label="Filiais cadastradas" className="grid gap-4 md:grid-cols-2">
          {units.map((unit) => (
            <article
              key={unit.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-bold text-slate-900">{unit.name}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${unit.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {unit.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={15} className="mt-0.5 shrink-0" />
                    <span>
                      {unit.address}, {unit.city} ·{" "}
                      {MARKETS.find((market) => market.country === unit.country_code)?.name ??
                        unit.country_code}
                    </span>
                  </p>
                  {unit.phone && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={15} className="shrink-0" /> {unit.phone}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(unit)}
                    className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Editar ${unit.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleUnit(unit)}
                    className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={unit.is_active ? `Desativar ${unit.name}` : `Ativar ${unit.name}`}
                  >
                    <Power size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-unit-dialog-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="business-unit-dialog-title" className="text-lg font-black text-slate-900">
                  {editingId ? "Editar filial" : "Adicionar filial"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informe os dados de localização e contato.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(event) => void saveUnit(event)} className="space-y-4">
              <Field label="Nome da filial">
                <input
                  className={inputClass}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="organization"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Ex.: Unidade Centro"
                />
              </Field>
              <Field
                label="País / região"
                hint="Mercados ainda em preparação podem exigir configuração adicional antes de operar."
              >
                <select
                  className={inputClass}
                  value={form.country_code}
                  onChange={(event) => setForm({ ...form, country_code: event.target.value })}
                >
                  {MARKETS.filter((market) => market.country !== "ZZ").map((market) => (
                    <option key={market.country} value={market.country}>
                      {market.name}
                      {market.enabled ? "" : " — em preparação"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cidade">
                <input
                  className={inputClass}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  placeholder="Cidade"
                />
              </Field>
              <Field label="Endereço completo">
                <input
                  className={inputClass}
                  required
                  minLength={5}
                  maxLength={240}
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </Field>
              <Field label="Telefone (opcional)">
                <input
                  className={inputClass}
                  type="tel"
                  maxLength={32}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="Telefone da unidade"
                />
              </Field>
              <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className={secondaryButtonClass}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {saving ? "Salvando…" : editingId ? "Salvar alterações" : "Cadastrar filial"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
