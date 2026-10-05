import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Clock3,
  ImagePlus,
  LoaderCircle,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import {
  Field,
  inputClass,
  money,
  PageTitle,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/localhub/ui";
import {
  useLocalHub,
  type Booking,
  type ProductOptionGroup,
  type ProductVariant,
  type Service,
  type ServiceAddon,
} from "@/lib/localhub-context";
import { getBusinessCopy, supportsAppointments } from "@/lib/localhub-business";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/studio/catalog")({ component: CatalogPage });

const manicureServiceSuggestions = [
  { name: "Manicure tradicional", duration: 45 },
  { name: "Pedicure", duration: 60 },
  { name: "Mão e pé", duration: 90 },
  { name: "Esmaltação em gel", duration: 60 },
  { name: "Alongamento em gel", duration: 150 },
  { name: "Manutenção de alongamento", duration: 120 },
];

/** Supabase errors are plain objects (not Error instances), so read `message` explicitly. */
function describeError(caught: unknown, fallback: string) {
  if (caught instanceof Error && caught.message) return caught.message;
  if (caught && typeof caught === "object") {
    const { message, details, hint, code } = caught as Record<string, unknown>;
    const parts = [message, details, hint].filter(
      (part): part is string => typeof part === "string" && part.length > 0,
    );
    if (parts.length) return `${fallback} (${parts.join(" — ")}${code ? ` [${code}]` : ""})`;
  }
  return fallback;
}

/**
 * Money/decimal input that keeps its own text, so the field can be empty and never shows a
 * leading zero (typing "100" over a default "0" used to produce "0100").
 */
function DecimalInput({
  value,
  onValueChange,
  allowNegative = false,
  className,
  ...props
}: {
  value: number;
  onValueChange: (value: number) => void;
  allowNegative?: boolean;
  className?: string;
  "aria-label"?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  useEffect(() => {
    const parsed = Number(text.replace(",", "."));
    if ((Number.isFinite(parsed) ? parsed : 0) !== value) setText(value ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      placeholder={props.placeholder ?? "0,00"}
      onChange={(event) => {
        let next = event.target.value.replace(",", ".");
        next = next.replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, "");
        if (allowNegative) next = next.replace(/(?!^)-/g, "");
        const firstDot = next.indexOf(".");
        if (firstDot !== -1) {
          next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
          next = next.slice(0, firstDot + 3);
        }
        next = next.replace(/^(-?)0+(?=\d)/, "$1");
        setText(next);
        const parsed = Number(next);
        onValueChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      className={className}
    />
  );
}

function CatalogPage() {
  const { business, services, saveService, removeService, user } = useLocalHub();
  const copy = getBusinessCopy(business?.category);
  const hasAppointments = supportsAppointments(business?.category);
  const desktopGridColumns = hasAppointments
    ? "sm:grid-cols-[minmax(0,1fr)_130px_110px_110px]"
    : "sm:grid-cols-[minmax(0,1fr)_110px_110px]";
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const healthServiceModes: Booking["serviceMode"][] = ["in_person", "online"];
  async function persistService(item: Omit<Service, "id"> & { id?: string }) {
    try {
      await saveService(item);
      setError("");
      return true;
    } catch (caught) {
      setError(describeError(caught, "Não foi possível salvar o item."));
      return false;
    }
  }

  return (
    <>
      <PageTitle
        eyebrow={business?.category === "alimentacao" ? "O que você serve" : "O que você oferece"}
        title={copy.offerTitle}
        description={
          hasAppointments
            ? `Cadastre cada ${copy.offer}, defina seu tempo e preço. A duração ajusta os horários oferecidos na agenda.`
            : "Organize os itens, descrições e preços do seu cardápio público."
        }
      />
      {creating && (
        <ServiceEditor
          category={business?.category}
          availableModes={business?.category === "saude" ? healthServiceModes : undefined}
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e1e3d8] bg-[#edf0e5] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-[#667448]">
            <Package size={18} />
          </span>
          <div>
            <div className="text-sm font-bold">
              {hasAppointments
                ? `Seus ${copy.offers} aparecem na sua página`
                : "Seus itens aparecem no cardápio"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {hasAppointments
                ? `O tempo definido em cada ${copy.offer} organiza a disponibilidade e evita horários sobrepostos.`
                : "Seus clientes consultam os itens e fazem o pedido pelo WhatsApp."}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#586341]">
          {services.filter((item) => item.active).length} ativos
        </span>
      </div>
      {editing && (
        <ServiceEditor
          initial={editing}
          category={business?.category}
          availableModes={business?.category === "saude" ? healthServiceModes : undefined}
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
          <div
            className={`hidden ${desktopGridColumns} gap-4 border-b border-slate-100 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:grid`}
          >
            <span>Oferta</span>
            {hasAppointments && <span>Tempo</span>}
            <span>Preço</span>
            <span>Status</span>
          </div>
          {services.map((service) => (
            <article
              key={service.id}
              className={`grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 ${desktopGridColumns} sm:items-center sm:gap-4`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt=""
                    loading="lazy"
                    className="size-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
                    <Package size={17} />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{service.name}</div>
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {service.description || "Sem descrição"}
                  </div>
                </div>
              </div>
              {hasAppointments && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock3 size={14} />
                  {service.duration} min
                </div>
              )}
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
                    className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-[#edf0e5] hover:text-[#586341]"
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
                            setError(describeError(caught, "Não foi possível excluir o item.")),
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
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf0e5] text-[#667448]">
            <Package size={22} />
          </span>
          <h2 className="mt-4 font-bold">{copy.emptyOffersTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {copy.emptyOffersDescription}
          </p>
          <button onClick={() => setCreating(true)} className={primaryButtonClass + " mt-5"}>
            <Plus size={16} />
            {copy.addOffer}
          </button>
        </div>
      )}
    </>
  );
}

function ServiceEditor({
  initial,
  category,
  availableModes,
  onCancel,
  onSave,
}: {
  initial?: Service;
  category?: string;
  availableModes?: Booking["serviceMode"][];
  onCancel: () => void;
  onSave: (service: Omit<Service, "id"> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? 30);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [menuCategory, setMenuCategory] = useState(initial?.menuCategory ?? "");
  const [serviceModes, setServiceModes] = useState<Booking["serviceMode"][]>(
    initial?.serviceModes ?? availableModes ?? ["in_person"],
  );
  const [addons, setAddons] = useState<ServiceAddon[]>(initial?.addons ?? []);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>(
    initial?.productVariants ?? [],
  );
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>(
    initial?.optionGroups ?? [],
  );
  const [variantName, setVariantName] = useState("");
  const [variantDelta, setVariantDelta] = useState(0);
  const [choiceError, setChoiceError] = useState("");
  const [addonName, setAddonName] = useState("");
  const [addonDuration, setAddonDuration] = useState(15);
  const [addonPrice, setAddonPrice] = useState(0);
  const [ncm, setNcm] = useState(initial?.ncm ?? "");
  const [cest, setCest] = useState(initial?.cest ?? "");
  const [cfop, setCfop] = useState(initial?.cfop ?? "");
  const [fiscalOrigin, setFiscalOrigin] = useState(initial?.fiscalOrigin ?? "");
  const [taxRegimeCode, setTaxRegimeCode] = useState(initial?.taxRegimeCode ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const { business, user } = useLocalHub();
  const copy = getBusinessCopy(category);
  const hasAppointments = supportsAppointments(category);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploadingImage) {
      setImageError("Aguarde o envio da foto antes de salvar o item.");
      return;
    }
    if (category === "saude" && serviceModes.length === 0) return;
    if (
      category === "alimentacao" &&
      optionGroups.some(
        (group) =>
          !group.name.trim() ||
          group.options.length === 0 ||
          group.maxSelections < 1 ||
          group.maxSelections > 30 ||
          group.minSelections > group.maxSelections ||
          group.minSelections > group.options.length ||
          (group.required && group.minSelections < 1),
      )
    ) {
      setChoiceError("Complete cada grupo com nome, opções e limites válidos antes de salvar.");
      return;
    }
    setChoiceError("");
    onSave({
      id: initial?.id,
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl || null,
      duration,
      price,
      active,
      menuCategory,
      serviceModes,
      addons,
      productVariants,
      optionGroups,
      ncm,
      cest,
      cfop,
      fiscalOrigin,
      taxRegimeCode,
    });
  }
  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-2xl border border-[#e1e3d8] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">
            {initial ? `Editar ${copy.offer}` : copy.addOffer}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Ao salvar, a atualização aparece na sua página pública.
          </div>
        </div>
        <MoreHorizontal size={18} className="text-slate-300" />
      </div>
      {category === "beleza" && !initial && (
        <fieldset className="mb-5 rounded-xl border border-[#e7e9df] bg-[#f8f9f5] p-4">
          <legend className="px-1 text-xs font-bold text-slate-700">Sugestões para manicure</legend>
          <p className="mb-3 text-xs leading-5 text-slate-500">
            Selecione para preencher o serviço e o tempo inicial. Você pode ajustar tudo antes de
            salvar.
          </p>
          <div className="flex flex-wrap gap-2">
            {manicureServiceSuggestions.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => {
                  setName(suggestion.name);
                  setDuration(suggestion.duration);
                }}
                className="min-h-10 rounded-full border border-[#dfe3d4] bg-white px-3 text-xs font-semibold text-[#586341] transition hover:border-[#aab58a] hover:bg-[#edf0e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#667448]"
              >
                {suggestion.name} · {suggestion.duration} min
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.offerInputLabel}>
          <input
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.offerPlaceholder}
            className={inputClass}
          />
        </Field>
        <Field label={copy.offerDescriptionLabel}>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Uma breve descrição"
            className={inputClass}
          />
        </Field>
        {category === "alimentacao" && (
          <Field label="Categoria do cardápio" hint="Ex.: Hambúrgueres, bebidas, acompanhamentos">
            <input
              value={menuCategory}
              onChange={(event) => setMenuCategory(event.target.value)}
              placeholder="Ex.: Lanches"
              maxLength={60}
              className={inputClass}
            />
          </Field>
        )}
        {hasAppointments && (
          <Field
            label="Tempo do atendimento (minutos)"
            hint="Este tempo ajusta automaticamente os horários livres na agenda e evita sobreposições."
          >
            <input
              required
              type="number"
              min="5"
              max="540"
              step="5"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Preço (R$)">
          <DecimalInput
            value={price}
            onValueChange={setPrice}
            className={inputClass}
          />
        </Field>
      </div>
      {category === "alimentacao" && (
        <section className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Prévia da foto de ${name || "item do cardápio"}`}
                className="size-20 rounded-xl object-cover"
              />
            ) : (
              <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
                <ImagePlus size={24} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold">Foto do lanche ou produto</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                JPG, PNG ou WebP, até 5 MB. A foto será exibida no cardápio público.
              </p>
              <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#667448]">
                {isUploadingImage ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <ImagePlus size={15} />
                )}
                {isUploadingImage ? "Enviando foto…" : imageUrl ? "Trocar foto" : "Enviar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImage}
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) return;
                    setImageError("");
                    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
                      setImageError("Escolha uma imagem JPG, PNG ou WebP.");
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setImageError("A imagem deve ter no máximo 5 MB.");
                      return;
                    }
                    if (!business?.id || !user?.id) {
                      setImageError("Não foi possível validar o acesso ao negócio.");
                      return;
                    }
                    const client = getSupabaseBrowserClient();
                    if (!client) {
                      setImageError("O envio de imagens está temporariamente indisponível.");
                      return;
                    }
                    setIsUploadingImage(true);
                    try {
                      const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice(6);
                      const path = `${user.id}/${business.id}/${crypto.randomUUID()}.${extension}`;
                      const { error: uploadError } = await client.storage
                        .from("localhub-products")
                        .upload(path, file, {
                          cacheControl: "3600",
                          contentType: file.type,
                          upsert: false,
                        });
                      if (uploadError) throw uploadError;
                      setImageUrl(
                        client.storage.from("localhub-products").getPublicUrl(path).data.publicUrl,
                      );
                    } catch {
                      setImageError("Não foi possível enviar a imagem. Tente novamente.");
                    } finally {
                      setIsUploadingImage(false);
                    }
                  }}
                />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="ml-3 min-h-10 px-2 text-xs font-semibold text-slate-500 hover:text-red-700"
                >
                  Remover foto
                </button>
              )}
            </div>
          </div>
          {imageError && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {imageError}
            </p>
          )}
        </section>
      )}
      {category === "beleza" && (
        <section className="mt-5 rounded-xl border border-[#e7e9df] p-4">
          <h3 className="text-sm font-bold">Adicionais opcionais</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ofereça detalhes como nail art. O tempo e valor serão somados ao agendamento.
          </p>
          {addons.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100">
              {addons.map((addon, index) => (
                <li
                  key={addon.id ?? `${addon.name}-${index}`}
                  className="flex items-center gap-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                    {addon.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    +{addon.duration} min · {money(addon.price)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remover adicional ${addon.name}`}
                    onClick={() =>
                      setAddons((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px_120px_auto]">
            <input
              aria-label="Nome do adicional"
              value={addonName}
              onChange={(event) => setAddonName(event.target.value)}
              placeholder="Ex.: Nail art"
              maxLength={80}
              className={inputClass}
            />
            <input
              aria-label="Minutos adicionais"
              type="number"
              min="0"
              max="180"
              step="5"
              value={addonDuration}
              onChange={(event) => setAddonDuration(Number(event.target.value))}
              className={inputClass}
            />
            <DecimalInput
              aria-label="Preço do adicional em reais"
              value={addonPrice}
              onValueChange={setAddonPrice}
              className={inputClass}
            />
            <button
              type="button"
              disabled={addonName.trim().length < 2}
              onClick={() => {
                setAddons((current) => [
                  ...current,
                  {
                    name: addonName.trim(),
                    duration: addonDuration,
                    price: addonPrice,
                    active: true,
                  },
                ]);
                setAddonName("");
                setAddonDuration(15);
                setAddonPrice(0);
              }}
              className={secondaryButtonClass + " disabled:opacity-50"}
            >
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </section>
      )}
      {category === "alimentacao" && (
        <section className="mt-5 space-y-4 rounded-xl border border-slate-200 p-4">
          <div>
            <h3 className="text-sm font-bold">Tamanhos, sabores e adicionais</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Configure as escolhas do cliente no cardápio. O checkout valida os preços e as
              seleções no servidor.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Variações</h4>
            {productVariants.map((variant, index) => (
              <div
                key={variant.id ?? `${variant.name}-${index}`}
                className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
              >
                <span className="min-w-0 flex-1 text-sm font-medium">{variant.name}</span>
                <span className="text-xs text-slate-500">
                  {variant.priceDelta >= 0 ? "+" : "−"}
                  {money(Math.abs(variant.priceDelta))}
                </span>
                <button
                  type="button"
                  aria-label={`Remover ${variant.name}`}
                  onClick={() =>
                    setProductVariants((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_auto]">
              <input
                aria-label="Nome da variação"
                value={variantName}
                onChange={(event) => setVariantName(event.target.value)}
                placeholder="Ex.: Grande, Calabresa"
                maxLength={80}
                className={inputClass}
              />
              <DecimalInput
                aria-label="Valor adicional da variação"
                allowNegative
                value={variantDelta}
                onValueChange={setVariantDelta}
                className={inputClass}
              />
              <button
                type="button"
                disabled={variantName.trim().length < 1}
                onClick={() => {
                  setProductVariants((current) => [
                    ...current,
                    { name: variantName.trim(), priceDelta: variantDelta, active: true },
                  ]);
                  setVariantName("");
                  setVariantDelta(0);
                }}
                className={secondaryButtonClass + " disabled:opacity-50"}
              >
                <Plus size={15} /> Variação
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Grupos de adicionais
              </h4>
              <button
                type="button"
                onClick={() =>
                  setOptionGroups((current) => [
                    ...current,
                    {
                      name: "",
                      required: false,
                      minSelections: 0,
                      maxSelections: 1,
                      active: true,
                      options: [],
                    },
                  ])
                }
                className={secondaryButtonClass}
              >
                <Plus size={14} /> Grupo
              </button>
            </div>
            {optionGroups.map((group, groupIndex) => (
              <ProductOptionGroupEditor
                key={group.id ?? `group-${groupIndex}`}
                group={group}
                onChange={(next) =>
                  setOptionGroups((current) =>
                    current.map((item, index) => (index === groupIndex ? next : item)),
                  )
                }
                onRemove={() =>
                  setOptionGroups((current) => current.filter((_, index) => index !== groupIndex))
                }
              />
            ))}
            {choiceError && (
              <p role="alert" className="text-xs text-red-700">
                {choiceError}
              </p>
            )}
          </div>
        </section>
      )}
      {category === "saude" && (
        <fieldset className="mt-4 sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold text-slate-700">
            Modalidade deste atendimento
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["in_person", "Presencial"],
                ["online", "Online"],
                ["home_visit", "Domiciliar"],
              ] as const
            ).map(([mode, label]) => (
              <label
                key={mode}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={serviceModes.includes(mode)}
                  onChange={(event) =>
                    setServiceModes((current) =>
                      event.target.checked
                        ? [...current, mode]
                        : current.filter((item) => item !== mode),
                    )
                  }
                  className="size-4 accent-[#778253]"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Presencial mostra o endereço do consultório. Online abre o WhatsApp com serviço, data e
            horário preenchidos.
          </p>
        </fieldset>
      )}
      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
          className="size-4 accent-[#778253]"
        />
        Mostrar na página pública
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={category === "saude" && serviceModes.length === 0}
          className={primaryButtonClass + " disabled:cursor-not-allowed disabled:opacity-50"}
        >
          {initial ? "Salvar alterações" : copy.addOffer}
        </button>
      </div>
    </form>
  );
}

function ProductOptionGroupEditor({
  group,
  onChange,
  onRemove,
}: {
  group: ProductOptionGroup;
  onChange: (group: ProductOptionGroup) => void;
  onRemove: () => void;
}) {
  const [optionName, setOptionName] = useState("");
  const [optionPrice, setOptionPrice] = useState(0);
  return (
    <section className="rounded-xl border border-slate-200 p-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]">
        <input
          required
          aria-label="Nome do grupo"
          value={group.name}
          onChange={(event) => onChange({ ...group, name: event.target.value })}
          placeholder="Ex.: Escolha o tamanho"
          maxLength={80}
          className={inputClass}
        />
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-medium">
          <input
            type="checkbox"
            checked={group.required}
            onChange={(event) =>
              onChange({
                ...group,
                required: event.target.checked,
                minSelections: event.target.checked ? Math.max(1, group.minSelections) : 0,
              })
            }
            className="accent-[#778253]"
          />{" "}
          Obrigatório
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          Máx.
          <input
            type="number"
            min="1"
            max="30"
            value={group.maxSelections}
            onChange={(event) =>
              onChange({
                ...group,
                maxSelections: Number(event.target.value),
                minSelections: Math.min(group.minSelections, Number(event.target.value)),
              })
            }
            className={inputClass}
          />
        </label>
        <button
          type="button"
          aria-label="Remover grupo"
          onClick={onRemove}
          className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {group.options.map((option, index) => (
        <div
          key={option.id ?? `${option.name}-${index}`}
          className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"
        >
          <span className="min-w-0 flex-1">{option.name}</span>
          <span className="text-xs text-slate-500">+{money(option.priceDelta)}</span>
          <button
            type="button"
            aria-label={`Remover opção ${option.name}`}
            onClick={() =>
              onChange({
                ...group,
                options: group.options.filter((_, optionIndex) => optionIndex !== index),
              })
            }
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
        <input
          aria-label="Nome da opção"
          value={optionName}
          onChange={(event) => setOptionName(event.target.value)}
          placeholder="Ex.: Queijo extra"
          maxLength={80}
          className={inputClass}
        />
        <DecimalInput
          aria-label="Preço adicional"
          value={optionPrice}
          onValueChange={setOptionPrice}
          className={inputClass}
        />
        <button
          type="button"
          disabled={!optionName.trim()}
          onClick={() => {
            onChange({
              ...group,
              options: [
                ...group.options,
                { name: optionName.trim(), priceDelta: optionPrice, active: true },
              ],
            });
            setOptionName("");
            setOptionPrice(0);
          }}
          className={secondaryButtonClass + " disabled:opacity-50"}
        >
          <Plus size={14} /> Opção
        </button>
      </div>
    </section>
  );
}
