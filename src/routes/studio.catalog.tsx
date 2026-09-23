import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock3, MoreHorizontal, Package, Pencil, Plus, Power, Trash2 } from "lucide-react";
import {
  Field,
  inputClass,
  money,
  PageTitle,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/localhub/ui";
import { useLocalHub, type Service } from "@/lib/localhub-context";

export const Route = createFileRoute("/studio/catalog")({ component: CatalogPage });

function CatalogPage() {
  const { services, saveService, removeService } = useLocalHub();
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  async function persistService(item: Omit<Service, "id"> & { id?: string }) {
    try {
      await saveService(item);
      setError("");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o serviço.");
      return false;
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="O que você oferece"
        title="Catálogo"
        description="Mantenha serviços e preços atualizados na sua página pública."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
            className={primaryButtonClass}
          >
            <Plus size={16} />
            Novo serviço
          </button>
        }
      />
      {creating && (
        <ServiceEditor
          onCancel={() => setCreating(false)}
          onSave={(item) => {
            void persistService(item).then((saved) => {
              if (saved) setCreating(false);
            });
          }}
        />
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-indigo-600">
            <Package size={18} />
          </span>
          <div>
            <div className="text-sm font-bold">Seus serviços aparecem na sua página</div>
            <div className="mt-1 text-xs text-slate-500">
              Os clientes podem escolher um serviço e pedir um horário.
            </div>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-indigo-700">
          {services.filter((item) => item.active).length} ativos
        </span>
      </div>
      {editing && (
        <ServiceEditor
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(item) => {
            void persistService(item).then((saved) => {
              if (saved) setEditing(null);
            });
          }}
        />
      )}
      {services.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_130px_110px_110px] gap-4 border-b border-slate-100 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
            <span>Serviço</span>
            <span>Duração</span>
            <span>Preço</span>
            <span>Status</span>
          </div>
          {services.map((service) => (
            <article
              key={service.id}
              className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_130px_110px_110px] sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Package size={17} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{service.name}</div>
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {service.description || "Sem descrição"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 size={14} />
                {service.duration} min
              </div>
              <div className="text-sm font-bold">{money(service.price)}</div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[10px] font-bold " +
                    (service.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500")
                  }
                >
                  {service.active ? "Ativo" : "Oculto"}
                </span>
                <div className="flex gap-1">
                  <button
                    title="Editar serviço"
                    onClick={() => {
                      setCreating(false);
                      setEditing(service);
                    }}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    title={service.active ? "Ocultar serviço" : "Ativar serviço"}
                    onClick={() => void persistService({ ...service, active: !service.active })}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <Power size={15} />
                  </button>
                  <button
                    title="Excluir serviço"
                    onClick={() => {
                      if (window.confirm("Excluir " + service.name + " do catálogo?"))
                        void removeService(service.id)
                          .then(() => setError(""))
                          .catch((caught: unknown) =>
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : "Não foi possível excluir o serviço.",
                            ),
                          );
                    }}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Package size={22} />
          </span>
          <h2 className="mt-4 font-bold">Seu catálogo começa aqui</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Adicione o primeiro serviço com preço e duração para que os clientes possam pedir um
            horário.
          </p>
          <button onClick={() => setCreating(true)} className={primaryButtonClass + " mt-5"}>
            <Plus size={16} />
            Adicionar serviço
          </button>
        </div>
      )}
    </>
  );
}

function ServiceEditor({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Service;
  onCancel: () => void;
  onSave: (service: Omit<Service, "id"> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? 30);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      id: initial?.id,
      name: name.trim(),
      description: description.trim(),
      duration,
      price,
      active,
    });
  }
  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">{initial ? "Editar serviço" : "Novo serviço"}</div>
          <div className="mt-1 text-xs text-slate-400">
            As alterações são salvas neste navegador.
          </div>
        </div>
        <MoreHorizontal size={18} className="text-slate-300" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do serviço">
          <input
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Corte feminino"
            className={inputClass}
          />
        </Field>
        <Field label="Descrição">
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Uma breve descrição"
            className={inputClass}
          />
        </Field>
        <Field label="Duração (minutos)">
          <input
            required
            type="number"
            min="5"
            step="5"
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Preço (R$)">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
            className={inputClass}
          />
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="size-4 accent-indigo-600"
        />
        Mostrar na página pública
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancelar
        </button>
        <button type="submit" className={primaryButtonClass}>
          {initial ? "Salvar alterações" : "Adicionar serviço"}
        </button>
      </div>
    </form>
  );
}
