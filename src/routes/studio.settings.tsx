import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Check,
  Copy,
  CalendarDays,
  ExternalLink,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
  Store,
  Trash2,
} from "lucide-react";
import { formatCep, fetchAddressFromCep } from "@/lib/cities";
import {
  Field,
  inputClass,
  PageTitle,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/localhub/ui";
import {
  createSlug,
  defaultOpeningHours,
  localDateInputValue,
  useLocalHub,
  type BusinessDayHours,
  type BusinessOnboardingDetails,
  type BusinessOpeningHours,
  type StaffMember,
} from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatSetupChoice, getBusinessCopy } from "@/lib/localhub-business";

export const Route = createFileRoute("/studio/settings")({ component: SettingsPage });

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 10 * 1024 * 1024;
const weekDays = [
  ["1", "Segunda-feira"],
  ["2", "Terça-feira"],
  ["3", "Quarta-feira"],
  ["4", "Quinta-feira"],
  ["5", "Sexta-feira"],
  ["6", "Sábado"],
  ["7", "Domingo"],
] as const;

function SettingsPage() {
  const {
    business,
    services,
    user,
    saveBusiness,
    deliveryAreas,
    saveDeliveryArea,
    removeDeliveryArea,
    staff,
    saveStaff,
  } = useLocalHub();
  const [form, setForm] = useState({ ...business! });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [blockedDateInput, setBlockedDateInput] = useState("");
  const [specialtyDraft, setSpecialtyDraft] = useState("");
  const [serviceModeDraft, setServiceModeDraft] = useState("");
  const [deliveryAreaName, setDeliveryAreaName] = useState("");
  const [deliveryAreaFee, setDeliveryAreaFee] = useState("0");
  const [deliveryAreaBusy, setDeliveryAreaBusy] = useState(false);
  const [deliveryAreaEdits, setDeliveryAreaEdits] = useState<
    Record<string, { name: string; fee: string }>
  >({});
  const [deliveryAreaSavingId, setDeliveryAreaSavingId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffSpecialty, setStaffSpecialty] = useState("");
  const [staffRegistrationLabel, setStaffRegistrationLabel] = useState("");
  const [staffRegistrationNumber, setStaffRegistrationNumber] = useState("");
  const [staffAccessEmail, setStaffAccessEmail] = useState("");
  const [staffWeeklyHours, setStaffWeeklyHours] = useState<BusinessOpeningHours>(
    business?.openingHours ?? defaultOpeningHours,
  );
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [cepDraft, setCepDraft] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string | null>(null);

  async function handleCepSearch(val: string) {
    const clean = val.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    setCepFeedback(null);
    try {
      const res = await fetchAddressFromCep(clean);
      if (res) {
        setSaved(false);
        setForm((current) => ({
          ...current,
          city: res.fullCity,
          address: res.formattedAddress || current.address,
        }));
        setCepFeedback(`✓ ${res.fullCity} preenchido via CEP!`);
      } else {
        setCepFeedback("CEP não encontrado.");
      }
    } catch {
      setCepFeedback("Erro ao consultar CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  const openingHours = form.openingHours ?? defaultOpeningHours;

  useEffect(() => {
    setForm({ ...business! });
  }, [business]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview("");
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    const urls = galleryFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [galleryFiles]);

  const set = (key: keyof typeof form, value: string | null) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  function updateDayHours(day: string, value: Partial<BusinessDayHours>) {
    setSaved(false);
    setForm((current) => ({
      ...current,
      openingHours: {
        ...(current.openingHours ?? defaultOpeningHours),
        [day]: { ...(current.openingHours ?? defaultOpeningHours)[day], ...value },
      },
    }));
  }

  function startStaffEdit(member?: StaffMember) {
    setStaffFormOpen(true);
    setStaffId(member?.id ?? null);
    setStaffName(member?.name ?? "");
    setStaffSpecialty(member?.specialty ?? "");
    setStaffRegistrationLabel(member?.registrationLabel ?? "");
    setStaffRegistrationNumber(member?.registrationNumber ?? "");
    setStaffAccessEmail(member?.accessEmail ?? "");
    setStaffWeeklyHours(member?.weeklyHours ?? openingHours);
  }

  async function submitStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      Object.values(staffWeeklyHours).some(
        (hours) => !hours.closed && (!hours.open || !hours.close || hours.close <= hours.open),
      )
    ) {
      setError("Confira os horários: o fim do expediente deve ser depois do início.");
      return;
    }
    setStaffSaving(true);
    setError("");
    try {
      await saveStaff({
        id: staffId ?? undefined,
        name: staffName,
        specialty: staffSpecialty,
        registrationLabel: staffRegistrationLabel,
        registrationNumber: staffRegistrationNumber,
        accessEmail: staffAccessEmail,
        avatarUrl: staff.find((member) => member.id === staffId)?.avatarUrl ?? null,
        weeklyHours: staffWeeklyHours,
        blockedDates: staff.find((member) => member.id === staffId)?.blockedDates ?? [],
        active: staff.find((member) => member.id === staffId)?.active ?? true,
      });
      setStaffFormOpen(false);
      setStaffId(null);
      setStaffName("");
      setStaffSpecialty("");
      setStaffRegistrationLabel("");
      setStaffRegistrationNumber("");
      setStaffAccessEmail("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Não foi possível salvar a profissional.",
      );
    } finally {
      setStaffSaving(false);
    }
  }

  function addBlockedDate() {
    if (!blockedDateInput) return;
    const dates = form.blockedDates ?? [];
    if (blockedDateInput < localDateInputValue()) {
      setError("Escolha hoje ou uma data futura.");
      return;
    }
    if (dates.includes(blockedDateInput)) {
      setError("Essa data já está marcada como fechada.");
      return;
    }
    setError("");
    setSaved(false);
    setForm((current) => ({
      ...current,
      blockedDates: [...(current.blockedDates ?? []), blockedDateInput].sort(),
    }));
    setBlockedDateInput("");
  }

  function updateOnboardingDetails(next: BusinessOnboardingDetails) {
    setSaved(false);
    setForm((current) => ({ ...current, onboardingDetails: next }));
  }

  function addOnboardingChoice(field: keyof BusinessOnboardingDetails, value: string) {
    const choice = createSlug(value);
    if (!choice) return;
    const details = form.onboardingDetails ?? { specialties: [], serviceModes: [] };
    const values = details[field];
    if (values.includes(choice)) return;
    updateOnboardingDetails({ ...details, [field]: [...values, choice] });
    if (field === "specialties") setSpecialtyDraft("");
    else setServiceModeDraft("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business?.id) return;
    if (form.category === "alimentacao" && !form.acceptsDelivery && !form.acceptsPickup && !form.acceptsDineIn) {
      setError("Ative pelo menos uma modalidade para receber pedidos.");
      return;
    }
    const invalidHours = weekDays.some(([day]) => {
      const hours = openingHours[day] ?? defaultOpeningHours[day];
      if (hours.closed) return false;
      if (hours.close <= hours.open) return true;
      const hasBreak = Boolean(hours.breakStart || hours.breakEnd);
      return (
        hasBreak &&
        (!hours.breakStart ||
          !hours.breakEnd ||
          hours.breakStart <= hours.open ||
          hours.breakEnd <= hours.breakStart ||
          hours.breakEnd >= hours.close)
      );
    });
    if (invalidHours) {
      setError("Confira abertura, fechamento e intervalo em cada dia aberto.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let bannerUrl = form.bannerUrl ?? null;
      let logoUrl = form.logoUrl ?? null;
      let galleryUrls = form.galleryUrls ?? [];
      if (bannerFile || logoFile || galleryFiles.length > 0) {
        const client = getSupabaseBrowserClient();
        if (!client || !user) throw new Error("Entre novamente para enviar a imagem.");
        if (bannerFile) {
          const extension =
            bannerFile.type === "image/jpeg" ? "jpg" : bannerFile.type.split("/")[1];
          const path = `${user.id}/business-${business.id}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await client.storage
            .from("business-banners")
            .upload(path, bannerFile, {
              cacheControl: "3600",
              contentType: bannerFile.type,
              upsert: false,
            });
          if (uploadError) throw uploadError;
          bannerUrl = client.storage.from("business-banners").getPublicUrl(path).data.publicUrl;
        }
        if (logoFile) {
          const extension =
            logoFile.type === "image/jpeg" ? "jpg" : logoFile.type.split("/")[1];
          const path = `${user.id}/business-${business.id}/logo-${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await client.storage
            .from("business-banners")
            .upload(path, logoFile, {
              cacheControl: "3600",
              contentType: logoFile.type,
              upsert: false,
            });
          if (uploadError) throw uploadError;
          logoUrl = client.storage.from("business-banners").getPublicUrl(path).data.publicUrl;
        }
        for (const file of galleryFiles) {
          const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
          const path = `${user.id}/business-${business.id}/portfolio-${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await client.storage
            .from("business-banners")
            .upload(path, file, {
              cacheControl: "3600",
              contentType: file.type,
              upsert: false,
            });
          if (uploadError) throw uploadError;
          galleryUrls = [
            ...galleryUrls,
            client.storage.from("business-banners").getPublicUrl(path).data.publicUrl,
          ];
        }
      }
      await saveBusiness({ ...form, bannerUrl, logoUrl, galleryUrls, slug: createSlug(form.slug) });
      setForm((current) => ({ ...current, bannerUrl, logoUrl, galleryUrls }));
      const removedUrls = (business.galleryUrls ?? []).filter((url) => !galleryUrls.includes(url));
      if (removedUrls.length && user) {
        const client = getSupabaseBrowserClient();
        const ownerPrefix = `${user.id}/business-${business.id}/`;
        const paths = removedUrls
          .map((url) =>
            decodeURIComponent(new URL(url).pathname.split("/business-banners/")[1] ?? ""),
          )
          .filter((path) => path.startsWith(ownerPrefix));
        if (client && paths.length) {
          const { error: removeError } = await client.storage
            .from("business-banners")
            .remove(paths);
          if (removeError)
            setError(
              "As fotos foram removidas da página, mas uma imagem não pôde ser apagada do armazenamento.",
            );
        }
      }
      setBannerFile(null);
      setGalleryFiles([]);
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

  function selectBanner(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!imageTypes.includes(file.type)) {
      setError("Escolha uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("A imagem deve ter até 10 MB.");
      return;
    }
    setError("");
    setSaved(false);
    setBannerFile(file);
  }

  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!imageTypes.includes(file.type)) {
      setError("Escolha uma imagem JPG, PNG ou WebP para a logo.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("A logo deve ter até 10 MB.");
      return;
    }
    setError("");
    setSaved(false);
    setLogoFile(file);
  }

  function selectGalleryFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.some((file) => !imageTypes.includes(file.type))) {
      setError("Escolha fotos JPG, PNG ou WebP.");
      return;
    }
    if (files.some((file) => file.size > maxImageSize)) {
      setError("Cada foto deve ter até 10 MB.");
      return;
    }
    const current = (form.galleryUrls ?? []).length + galleryFiles.length;
    if (current + files.length > 12) {
      setError("O portfólio aceita até 12 fotos.");
      return;
    }
    setError("");
    setSaved(false);
    setGalleryFiles((currentFiles) => [...currentFiles, ...files]);
  }

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/loja/${form.slug}` : "";
  const activeServices = services.filter((service) => service.active);
  const businessCopy = getBusinessCopy(form.category);
  const isFoodBusiness = form.category === "alimentacao";
  const banner = bannerPreview || form.bannerUrl || "";
  const logo = logoPreview || form.logoUrl || "";

  return (
    <>
      <PageTitle
        eyebrow="Presença online"
        title="Sua página pública"
        description="Edite as informações e confira a prévia antes de salvar."
        action={
          <a
            href={"/loja/" + form.slug}
            target="_blank"
            rel="noreferrer"
            className={secondaryButtonClass}
          >
            Abrir página pública <ExternalLink size={15} />
          </a>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(390px,.9fr)]">
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <section>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Capa da página</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Uma imagem horizontal para apresentar seu negócio.
                </p>
              </div>
              {banner && (
                <button
                  type="button"
                  onClick={() => {
                    setBannerFile(null);
                    set("bannerUrl", null);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-red-700"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>
            <label className="group mt-4 flex min-h-36 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-[#8a9668] hover:bg-[#f7f8f3]">
              {banner ? (
                <img src={banner} alt="Prévia da capa" className="h-44 w-full object-cover" />
              ) : (
                <span className="px-5 py-7">
                  <ImagePlus className="mx-auto text-[#778253]" size={25} />
                  <span className="mt-2 block text-sm font-semibold text-slate-700">
                    Adicionar foto de capa
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Recomendado: 1600 × 600 px (proporção 8:3). JPG, PNG ou WebP · até 10 MB
                  </span>
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectBanner}
                className="sr-only"
              />
            </label>
            {banner && (
              <p className="mt-2 text-xs text-slate-400">Clique na imagem para escolher outra.</p>
            )}
          </section>

          <section className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Logotipo do estabelecimento</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Aparece em destaque centralizado no topo do cardápio digital (estilo InstaDelivery).
                </p>
              </div>
              {logo && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    set("logoUrl", null);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-red-700"
                >
                  <Trash2 size={14} /> Remover logo
                </button>
              )}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <label className="group flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-[#8a9668] hover:bg-[#f7f8f3] shadow-xs">
                {logo ? (
                  <img src={logo} alt="Prévia do logotipo" className="size-full object-cover" />
                ) : (
                  <span className="grid place-items-center text-slate-400 group-hover:text-[#778253]">
                    <ImagePlus size={22} />
                  </span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selectLogo}
                  className="sr-only"
                />
              </label>
              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Foto quadrada ou circular</p>
                <p className="text-[11px] text-slate-400">Recomendado: 500 × 500 px. Formatos JPG, PNG ou WebP.</p>
                <label className="inline-block cursor-pointer font-bold text-[#687847] hover:underline">
                  {logo ? "Trocar imagem da logo" : "Selecionar arquivo de logo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selectLogo}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </section>

          {form.category !== "alimentacao" && (
            <section id="portfolio" className="scroll-mt-24 border-t border-slate-100 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">Portfólio de trabalhos</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Mostre fotos reais das suas unhas e técnicas. Até 12 imagens, JPG, PNG ou WebP.
                  </p>
                </div>
                <label className={secondaryButtonClass + " shrink-0 cursor-pointer"}>
                  <ImagePlus size={15} /> Adicionar fotos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={selectGalleryFiles}
                    className="sr-only"
                  />
                </label>
              </div>
              {(form.galleryUrls ?? []).length > 0 || galleryFiles.length > 0 ? (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(form.galleryUrls ?? []).map((imageUrl, index) => (
                    <div
                      key={imageUrl}
                      className="relative overflow-hidden rounded-xl bg-slate-100"
                    >
                      <img
                        src={imageUrl}
                        alt={`Foto ${index + 1} do portfólio`}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={`Remover foto ${index + 1} do portfólio`}
                        onClick={() => {
                          setSaved(false);
                          setForm((current) => ({
                            ...current,
                            galleryUrls: (current.galleryUrls ?? []).filter(
                              (url) => url !== imageUrl,
                            ),
                          }));
                        }}
                        className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-black/65 text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {galleryPreviewUrls.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="relative overflow-hidden rounded-xl bg-slate-100"
                    >
                      <img
                        src={imageUrl}
                        alt={`Nova foto ${index + 1} do portfólio`}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={`Remover nova foto ${index + 1}`}
                        onClick={() =>
                          setGalleryFiles((files) =>
                            files.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                        className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-black/65 text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">
                  Adicione fotos para apresentar seu trabalho na página pública.
                </div>
              )}
            </section>
          )}

          <section className="border-t border-slate-100 pt-5">
            <h2 className="font-bold">Informações que seus clientes veem</h2>
            <p className="mt-1 text-xs text-slate-400">
              Esses dados aparecem diretamente na página pública.
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Categoria do negócio">
                <input
                  required
                  value={form.category}
                  onChange={(event) => set("category", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Nome do negócio">
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Sobre o negócio" hint={`${form.description.length}/220 caracteres`}>
                <textarea
                  rows={4}
                  maxLength={220}
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  className={inputClass + " resize-y"}
                />
              </Field>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <MapPin size={13} className="text-[#687847]" /> Preencher por CEP (opcional)
                  </span>
                  {cepLoading && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                      <Loader2 size={11} className="animate-spin" /> Buscando endereço...
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="Ex.: 13010-000"
                    value={cepDraft}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      setCepDraft(formatted);
                      if (formatted.replace(/\D/g, "").length === 8) {
                        void handleCepSearch(formatted);
                      }
                    }}
                    className={inputClass}
                    aria-label="CEP opcional para preencher endereço"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCepSearch(cepDraft)}
                    disabled={cepLoading || cepDraft.replace(/\D/g, "").length !== 8}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Buscar CEP
                  </button>
                </div>
                {cepFeedback && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check size={12} /> {cepFeedback}
                  </p>
                )}
              </div>
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
              <section className="border-t border-slate-100 pt-5">
                <h2 className="font-bold">Especialidades e formatos de atendimento</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Esses itens aparecem na sua página pública. Adicione ou remova opções conforme
                  seus serviços.
                </p>
                {(
                  [
                    ["specialties", "Especialidades", specialtyDraft, setSpecialtyDraft],
                    [
                      "serviceModes",
                      "Formas de atendimento",
                      serviceModeDraft,
                      setServiceModeDraft,
                    ],
                  ] as const
                ).map(([field, label, draft, setDraft]) => {
                  const details = form.onboardingDetails ?? { specialties: [], serviceModes: [] };
                  const choices = details[field];
                  return (
                    <div key={field} className="mt-4">
                      <Field label={label}>
                        <div className="flex gap-2">
                          <input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addOnboardingChoice(field, draft);
                              }
                            }}
                            className={inputClass}
                            placeholder={
                              field === "specialties"
                                ? "Ex.: Manicure em gel"
                                : "Ex.: Atendimento online"
                            }
                          />
                          <button
                            type="button"
                            onClick={() => addOnboardingChoice(field, draft)}
                            disabled={!draft.trim()}
                            className={secondaryButtonClass + " shrink-0 disabled:opacity-50"}
                          >
                            Adicionar
                          </button>
                        </div>
                      </Field>
                      {choices.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {choices.map((choice) => (
                            <li
                              key={choice}
                              className="inline-flex items-center gap-2 rounded-full bg-[#edf0e5] px-3 py-1.5 text-xs font-medium text-[#586341]"
                            >
                              {formatSetupChoice(choice)}
                              <button
                                type="button"
                                aria-label={`Remover ${formatSetupChoice(choice)}`}
                                onClick={() =>
                                  updateOnboardingDetails({
                                    ...details,
                                    [field]: choices.filter((item) => item !== choice),
                                  })
                                }
                                className="font-bold text-slate-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </section>
              {["beleza", "saude"].includes(form.category) && (
                <section className="border-t border-slate-100 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold">
                        {form.category === "saude"
                          ? "Profissionais e agenda"
                          : "Equipe e disponibilidade"}
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Cadastre a equipe, personalize os horários e defina o e-mail de acesso à
                        agenda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startStaffEdit()}
                      className={secondaryButtonClass + " shrink-0"}
                    >
                      Adicionar profissional
                    </button>
                  </div>
                  {staff.length > 0 && (
                    <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {staff.map((member) => (
                        <li key={member.id} className="flex flex-wrap items-center gap-3 p-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf0e5] text-sm font-bold text-[#586341]">
                            {member.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {member.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {member.specialty || "Atendimento geral"} ·{" "}
                              {member.active ? "Ativa" : "Pausada"}
                              {member.accessEmail
                                ? ` · Acesso configurado para ${member.accessEmail}`
                                : " · Sem acesso individual"}
                              {form.category === "saude" &&
                              member.registrationLabel &&
                              member.registrationNumber
                                ? ` · ${member.registrationLabel} ${member.registrationNumber}`
                                : ""}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => startStaffEdit(member)}
                            className="min-h-9 rounded-lg px-3 text-xs font-semibold text-[#667448] hover:bg-[#edf0e5]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void saveStaff({ ...member, active: !member.active }).catch(
                                (caught: unknown) =>
                                  setError(
                                    caught instanceof Error
                                      ? caught.message
                                      : "Não foi possível atualizar a profissional.",
                                  ),
                              )
                            }
                            className="min-h-9 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                          >
                            {member.active ? "Pausar" : "Ativar"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {staffFormOpen && (
                    <form
                      onSubmit={(event) => void submitStaff(event)}
                      className="mt-4 space-y-4 rounded-xl bg-slate-50 p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Nome do profissional">
                          <input
                            required
                            maxLength={80}
                            value={staffName}
                            onChange={(event) => setStaffName(event.target.value)}
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Especialidade">
                          <input
                            maxLength={80}
                            value={staffSpecialty}
                            onChange={(event) => setStaffSpecialty(event.target.value)}
                            placeholder="Ex.: Manicure e nail art"
                            className={inputClass}
                          />
                        </Field>
                        {form.category === "saude" && (
                          <>
                            <Field
                              label="Conselho ou registro"
                              hint="Ex.: CRM, CRP, CREFITO ou CRN"
                            >
                              <input
                                maxLength={24}
                                value={staffRegistrationLabel}
                                onChange={(event) => setStaffRegistrationLabel(event.target.value)}
                                placeholder="Ex.: CRP"
                                className={inputClass}
                              />
                            </Field>
                            <Field
                              label="Número de registro"
                              hint="Informação exibida no perfil público; confira antes de publicar."
                            >
                              <input
                                maxLength={40}
                                value={staffRegistrationNumber}
                                onChange={(event) => setStaffRegistrationNumber(event.target.value)}
                                placeholder="Ex.: 00/00000"
                                className={inputClass}
                              />
                            </Field>
                          </>
                        )}
                        <Field
                          label="E-mail para acesso à agenda"
                          hint="Compartilhe este e-mail com a profissional. Ela deve entrar ou criar uma conta ELLO com ele e confirmar o endereço."
                        >
                          <input
                            type="email"
                            maxLength={254}
                            value={staffAccessEmail}
                            onChange={(event) => setStaffAccessEmail(event.target.value)}
                            placeholder="profissional@exemplo.com"
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Horários desta profissional
                        </p>
                        <div className="mt-2 space-y-2">
                          {weekDays.map(([day, label]) => {
                            const hours =
                              staffWeeklyHours[day] ??
                              openingHours[day] ??
                              defaultOpeningHours[day];
                            return (
                              <div
                                key={day}
                                className="grid items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_auto_1fr_1fr]"
                              >
                                <span className="text-xs font-medium">{label}</span>
                                <label className="flex items-center gap-2 text-xs text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={!hours.closed}
                                    onChange={(event) =>
                                      setStaffWeeklyHours((current) => ({
                                        ...current,
                                        [day]: { ...hours, closed: !event.target.checked },
                                      }))
                                    }
                                    className="size-4 accent-[#667448]"
                                  />
                                  Aberta
                                </label>
                                <input
                                  aria-label={`${label}: início do expediente da profissional`}
                                  type="time"
                                  value={hours.open}
                                  disabled={hours.closed}
                                  onChange={(event) =>
                                    setStaffWeeklyHours((current) => ({
                                      ...current,
                                      [day]: { ...hours, open: event.target.value },
                                    }))
                                  }
                                  className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs disabled:opacity-50"
                                />
                                <input
                                  aria-label={`${label}: fim do expediente da profissional`}
                                  type="time"
                                  value={hours.close}
                                  disabled={hours.closed}
                                  onChange={(event) =>
                                    setStaffWeeklyHours((current) => ({
                                      ...current,
                                      [day]: { ...hours, close: event.target.value },
                                    }))
                                  }
                                  className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs disabled:opacity-50"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setStaffFormOpen(false)}
                          className={secondaryButtonClass}
                        >
                          Cancelar
                        </button>
                        <button type="submit" disabled={staffSaving} className={primaryButtonClass}>
                          {staffSaving
                            ? "Salvando…"
                            : staffId
                              ? "Salvar profissional"
                              : "Adicionar à equipe"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}
              {["beleza", "saude"].includes(form.category) && (
                <section className="border-t border-slate-100 pt-5">
                  <h2 className="font-bold">
                    {form.category === "saude"
                      ? "Orientações pré-atendimento"
                      : "Orientações para agendamentos"}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {form.category === "saude"
                      ? "Informe endereço, acessibilidade e o que o paciente precisa saber antes da consulta. Não solicite dados clínicos por esta área."
                      : "Explique com clareza suas regras de atraso, cancelamento ou sinal. Elas aparecem antes do pedido."}
                  </p>
                  <Field
                    label={
                      form.category === "saude"
                        ? "Instruções pré-atendimento"
                        : "Política de agendamento"
                    }
                    hint={`${(form.bookingPolicy ?? "").length}/280 caracteres`}
                  >
                    <textarea
                      rows={3}
                      maxLength={280}
                      value={form.bookingPolicy ?? ""}
                      onChange={(event) => {
                        setSaved(false);
                        setForm((current) => ({ ...current, bookingPolicy: event.target.value }));
                      }}
                      placeholder="Ex.: Avise com pelo menos 24 horas se precisar cancelar."
                      className={inputClass + " resize-y"}
                    />
                  </Field>
                </section>
              )}
              {isFoodBusiness && (
                <section className="border-t border-slate-100 pt-5">
                  <h2 className="font-bold">Pedidos, retirada e entrega</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Os pedidos feitos na sua página aparecem no painel. O pagamento é combinado na
                    entrega ou retirada; a ELLO não cobra comissão por pedido.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.acceptsPickup ?? true}
                        onChange={(event) => {
                          setSaved(false);
                          setForm((current) => ({
                            ...current,
                            acceptsPickup: event.target.checked,
                          }));
                        }}
                        className="size-4 accent-[#667448]"
                      />
                    Retirada
                    </label>
                    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.acceptsDelivery ?? true}
                        onChange={(event) => {
                          setSaved(false);
                          setForm((current) => ({
                            ...current,
                            acceptsDelivery: event.target.checked,
                          }));
                        }}
                        className="size-4 accent-[#667448]"
                      />
                      Entrega
                    </label>
                    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.acceptsDineIn ?? false}
                        onChange={(event) => {
                          setSaved(false);
                          setForm((current) => ({ ...current, acceptsDineIn: event.target.checked }));
                        }}
                        className="size-4 accent-[#667448]"
                      />
                      Consumo no local
                    </label>
                  </div>
                  <section className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <label className="flex min-h-10 items-center gap-3 text-sm font-semibold">
                      <input type="checkbox" checked={form.loyaltyEnabled ?? false} onChange={(event) => { setSaved(false); setForm((current) => ({ ...current, loyaltyEnabled: event.target.checked })); }} className="size-4 accent-[#667448]" />
                      Ativar fidelidade
                    </label>
                    {form.loyaltyEnabled && <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Tipo de recompensa"><select value={form.loyaltyMode ?? "points"} onChange={(event) => { const nextMode = event.target.value as "points" | "cashback"; setSaved(false); setForm((current) => ({ ...current, loyaltyRate: nextMode === "cashback" ? (current.loyaltyRate ?? 0) * 100 : (current.loyaltyRate ?? 0) / 100, loyaltyMode: nextMode })); }} className={inputClass}><option value="points">Pontos por compra</option><option value="cashback">Cashback</option></select></Field>
                      <Field label={form.loyaltyMode === "cashback" ? "Cashback (%)" : "Pontos por R$ gasto"} hint={form.loyaltyMode === "cashback" ? "Ex.: 3% retorna R$ 3 a cada R$ 100." : "Ex.: 1 ponto para cada R$ 1 gasto."}><input type="number" min="0" max={form.loyaltyMode === "cashback" ? 100 : 1} step="0.1" value={form.loyaltyMode === "cashback" ? (form.loyaltyRate ?? 0) * 100 : form.loyaltyRate ?? 0} onChange={(event) => { const value = Number(event.target.value); setSaved(false); setForm((current) => ({ ...current, loyaltyRate: current.loyaltyMode === "cashback" ? value / 100 : value })); }} className={inputClass} /></Field>
                    </div>}
                    <p className="mt-2 text-xs leading-5 text-slate-500">O saldo é acumulado em compras concluídas. O uso do saldo no checkout ficará disponível junto com a autenticação segura do cliente.</p>
                  </section>
                  <div className="mt-3 max-w-xs">
                    <Field
                      label="Taxa padrão (R$)"
                      hint="Usada somente enquanto você não cadastrar taxas por bairro."
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={form.deliveryFee ?? 0}
                        onChange={(event) => {
                          setSaved(false);
                          setForm((current) => ({
                            ...current,
                            deliveryFee: Number(event.target.value),
                          }));
                        }}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="text-sm font-bold">Taxas por bairro</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Cadastre as regiões atendidas e o valor de cada entrega. No checkout, o bairro
                      identificado no endereço será sugerido e o cliente poderá confirmar a opção.
                    </p>
                    <div className="mt-3 space-y-2">
                      {deliveryAreas.map((area) => (
                        <div
                          key={area.id}
                          className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <input
                            aria-label={`Bairro ${area.name}`}
                            required
                            minLength={2}
                            maxLength={80}
                            value={deliveryAreaEdits[area.id]?.name ?? area.name}
                            onChange={(event) =>
                              setDeliveryAreaEdits((current) => ({
                                ...current,
                                [area.id]: {
                                  name: event.target.value,
                                  fee: current[area.id]?.fee ?? String(area.fee),
                                },
                              }))
                            }
                            className="min-h-10 min-w-32 flex-1 rounded-lg border border-slate-200 px-2 text-sm"
                          />
                          <label className="flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs text-slate-500">
                            R$
                            <input
                              aria-label={`Taxa de ${area.name}`}
                              type="number"
                              min="0"
                              step="0.50"
                              value={deliveryAreaEdits[area.id]?.fee ?? String(area.fee)}
                              onChange={(event) =>
                                setDeliveryAreaEdits((current) => ({
                                  ...current,
                                  [area.id]: {
                                    name: current[area.id]?.name ?? area.name,
                                    fee: event.target.value,
                                  },
                                }))
                              }
                              className="w-20 text-sm font-semibold text-slate-800 outline-none"
                            />
                          </label>
                          <button
                            type="button"
                            disabled={deliveryAreaSavingId === area.id}
                            onClick={() => {
                              const edit = deliveryAreaEdits[area.id] ?? {
                                name: area.name,
                                fee: String(area.fee),
                              };
                              setDeliveryAreaSavingId(area.id);
                              void saveDeliveryArea({
                                id: area.id,
                                name: edit.name,
                                fee: Number(edit.fee),
                                active: area.active,
                              })
                                .then(() => {
                                  setDeliveryAreaEdits((current) => {
                                    const next = { ...current };
                                    delete next[area.id];
                                    return next;
                                  });
                                  setError("");
                                })
                                .catch((caught: unknown) =>
                                  setError(
                                    caught instanceof Error
                                      ? caught.message
                                      : "Não foi possível atualizar o bairro.",
                                  ),
                                )
                                .finally(() => setDeliveryAreaSavingId(null));
                            }}
                            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[#667448] hover:bg-[#edf0e5]"
                          >
                            {deliveryAreaSavingId === area.id ? "Salvando…" : "Salvar"}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remover taxa do bairro ${area.name}`}
                            onClick={() => {
                              if (window.confirm(`Remover ${area.name}?`))
                                void removeDeliveryArea(area.id).catch((caught: unknown) =>
                                  setError(
                                    caught instanceof Error
                                      ? caught.message
                                      : "Não foi possível remover o bairro.",
                                  ),
                                );
                            }}
                            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                      {!deliveryAreas.length && (
                        <p className="rounded-xl bg-white px-3 py-4 text-xs text-slate-500">
                          Nenhum bairro cadastrado. A taxa padrão continua valendo até adicionar as
                          áreas.
                        </p>
                      )}
                    </div>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        setDeliveryAreaBusy(true);
                        void saveDeliveryArea({
                          name: deliveryAreaName,
                          fee: Number(deliveryAreaFee),
                          active: true,
                        })
                          .then(() => {
                            setDeliveryAreaName("");
                            setDeliveryAreaFee("0");
                            setError("");
                          })
                          .catch((caught: unknown) =>
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : "Não foi possível salvar o bairro.",
                            ),
                          )
                          .finally(() => setDeliveryAreaBusy(false));
                      }}
                      className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px_auto]"
                    >
                      <input
                        aria-label="Nome do bairro"
                        required
                        minLength={2}
                        maxLength={80}
                        value={deliveryAreaName}
                        onChange={(event) => setDeliveryAreaName(event.target.value)}
                        placeholder="Nome do bairro"
                        className={inputClass}
                      />
                      <input
                        aria-label="Taxa do bairro em reais"
                        required
                        type="number"
                        min="0"
                        step="0.50"
                        value={deliveryAreaFee}
                        onChange={(event) => setDeliveryAreaFee(event.target.value)}
                        className={inputClass}
                      />
                      <button
                        disabled={deliveryAreaBusy}
                        className={secondaryButtonClass + " min-h-11"}
                      >
                        {deliveryAreaBusy ? "Salvando…" : "Adicionar bairro"}
                      </button>
                    </form>
                  </div>

                  {/* Integração iFood */}
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/40 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-xl bg-red-600 text-white font-black text-xs">
                          iF
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-red-950">Integração iFood</h3>
                          <p className="text-xs text-red-800">
                            Receba pedidos do iFood diretamente no seu KDS da ELLO.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-red-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean((form as any).ifoodConnected)}
                          onChange={(e) => {
                            setSaved(false);
                            setForm((prev) => ({ ...prev, ifoodConnected: e.target.checked } as any));
                          }}
                          className="size-4 accent-red-600"
                        />
                        {(form as any).ifoodConnected ? "Conectado" : "Desconectado"}
                      </label>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700">Merchant ID (iFood)</label>
                        <input
                          value={(form as any).ifoodMerchantId ?? ""}
                          onChange={(e) => {
                            setSaved(false);
                            setForm((prev) => ({ ...prev, ifoodMerchantId: e.target.value } as any));
                          }}
                          placeholder="Ex: 1a2b3c4d-5e6f-..."
                          className="mt-1 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">Webhook ELLO (para configurar no Portal iFood)</label>
                        <div className="mt-1 flex items-center justify-between rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-mono text-slate-600">
                          <span className="truncate">https://ello.app.br/api/v1/orders/external</span>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText("https://ello.app.br/api/v1/orders/external");
                              alert("URL do Webhook copiada!");
                            }}
                            className="ml-2 font-bold text-red-700 hover:underline"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Avaliações Google (Google Meu Negócio) */}
                  <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                        G
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-blue-950">Avaliações Google (Google Meu Negócio)</h3>
                        <p className="text-xs text-blue-800">
                          Aumente sua nota no Google enviando o link de avaliação 5 estrelas após cada entrega.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs">
                      <label className="font-semibold text-slate-700">Link direto de Avaliação Google</label>
                      <input
                        value={(form as any).googleReviewsUrl ?? ""}
                        onChange={(e) => {
                          setSaved(false);
                          setForm((prev) => ({ ...prev, googleReviewsUrl: e.target.value } as any));
                        }}
                        placeholder="https://g.page/r/SUA_EMPRESA/review"
                        className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs outline-none"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        O ELLO incluirá um botão "⭐ Avaliar no Google" na página de rastreamento e na mensagem de entrega concluída.
                      </p>
                    </div>
                  </div>

                  {/* Totem & Modo Autoatendimento */}
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
                          📱
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-emerald-950">Totem & Autoatendimento no Tablet</h3>
                          <p className="text-xs text-emerald-800">
                            Transforme qualquer tablet ou tela touch num totem interativo de pedidos para seus clientes.
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/totem/${form.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                      >
                        Abrir Totem <ExternalLink size={12} />
                      </a>
                    </div>
                    <p className="mt-2 text-xs font-mono text-emerald-900 bg-white p-2 rounded-lg border border-emerald-200">
                      https://ello.app.br/totem/{form.slug}
                    </p>
                  </div>
                </section>
              )}
              <section className="border-t border-slate-100 pt-5">
                <h2 className="font-bold">
                  {isFoodBusiness
                    ? "Horário de funcionamento"
                    : "Disponibilidade para agendamentos"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {isFoodBusiness
                    ? "Defina quando sua loja recebe pedidos. Os horários ficam visíveis no cardápio público."
                    : "Defina os dias e horários em que seus clientes podem solicitar atendimento. Os intervalos respeitam a duração configurada em cada serviço."}
                </p>
                <div className="mt-4 space-y-2">
                  {weekDays.map(([day, label]) => {
                    const hours = openingHours[day] ?? defaultOpeningHours[day];
                    return (
                      <div key={day} className="min-w-0 rounded-xl border border-slate-100 p-3">
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                          <span className="text-sm font-semibold">{label}</span>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={!hours.closed}
                                onChange={(event) =>
                                  updateDayHours(day, { closed: !event.target.checked })
                                }
                                className="size-4 accent-[#667448]"
                              />
                              Aberto
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={Boolean(hours.breakStart && hours.breakEnd)}
                                disabled={hours.closed}
                                onChange={(event) =>
                                  updateDayHours(
                                    day,
                                    event.target.checked
                                      ? { breakStart: "12:00", breakEnd: "13:00" }
                                      : { breakStart: null, breakEnd: null },
                                  )
                                }
                                className="size-4 accent-[#667448]"
                              />
                              Intervalo
                            </label>
                          </div>
                        </div>
                        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                          <label className="block min-w-0 text-xs text-slate-500">
                            <span className="mb-1.5 block">Abre</span>
                            <input
                              aria-label={`${label}: horário de abertura`}
                              type="time"
                              value={hours.open}
                              disabled={hours.closed}
                              onChange={(event) =>
                                updateDayHours(day, { open: event.target.value })
                              }
                              className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800 disabled:opacity-50"
                            />
                          </label>
                          <label className="block min-w-0 text-xs text-slate-500">
                            <span className="mb-1.5 block">Fecha</span>
                            <input
                              aria-label={`${label}: horário de fechamento`}
                              type="time"
                              value={hours.close}
                              disabled={hours.closed}
                              onChange={(event) =>
                                updateDayHours(day, { close: event.target.value })
                              }
                              className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800 disabled:opacity-50"
                            />
                          </label>
                        </div>
                        {hours.breakStart && hours.breakEnd && (
                          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:max-w-sm">
                            <label className="flex items-center gap-2 text-xs text-slate-500">
                              Pausa de
                              <input
                                aria-label={`${label}: início do intervalo`}
                                type="time"
                                value={hours.breakStart}
                                onChange={(event) =>
                                  updateDayHours(day, { breakStart: event.target.value })
                                }
                                className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800"
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-500">
                              até
                              <input
                                aria-label={`${label}: fim do intervalo`}
                                type="time"
                                value={hours.breakEnd}
                                onChange={(event) =>
                                  updateDayHours(day, { breakEnd: event.target.value })
                                }
                                className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="border-t border-slate-100 pt-5">
                <h2 className="font-bold">Folgas, feriados e datas fechadas</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Nessas datas a página não oferecerá horários, mesmo que o dia da semana esteja
                  aberto.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Field label="Adicionar uma data">
                    <input
                      type="date"
                      min={localDateInputValue()}
                      value={blockedDateInput}
                      onChange={(event) => setBlockedDateInput(event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={addBlockedDate}
                    disabled={!blockedDateInput || (form.blockedDates ?? []).length >= 180}
                    className={secondaryButtonClass + " disabled:opacity-50"}
                  >
                    Adicionar folga
                  </button>
                </div>
                {(form.blockedDates ?? []).length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {(form.blockedDates ?? []).map((blockedDate) => (
                      <li
                        key={blockedDate}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                      >
                        {new Date(`${blockedDate}T12:00:00`).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setSaved(false);
                            setForm((current) => ({
                              ...current,
                              blockedDates: (current.blockedDates ?? []).filter(
                                (date) => date !== blockedDate,
                              ),
                            }));
                          }}
                          aria-label={`Remover folga em ${blockedDate}`}
                          className="font-bold text-slate-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <Field label="Link da página" hint="Use letras, números e hífens.">
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
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <span role="status" className="text-xs font-semibold text-emerald-700">
              {saved
                ? "Alterações salvas na página pública"
                : "Prévia atualizada · alterações não salvas"}
            </span>
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              <Save size={15} />
              {saving ? "Salvando..." : "Salvar e publicar"}
            </button>
          </section>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        <aside className="xl:sticky xl:top-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#292b25]">Prévia ao vivo</h2>
              <p className="mt-1 text-xs text-slate-400">Assim seus clientes verão a página.</p>
            </div>
            <span className="rounded-full bg-[#edf0e5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#667448]">
              {saved ? "Atualizada" : "Prévia ao vivo"}
            </span>
          </div>
          <article className="overflow-hidden rounded-[22px] border border-slate-200 bg-[#f5f4ef] shadow-lg shadow-slate-900/5">
            <header
              className="relative flex min-h-52 items-end overflow-hidden bg-[#292b25] bg-cover bg-center p-5 text-white sm:min-h-60 sm:p-7"
              style={
                banner
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(20,22,18,.1), rgba(20,22,18,.78)), url("${banner}")`,
                    }
                  : undefined
              }
            >
              {!banner && (
                <>
                  <div className="absolute -right-10 -top-20 size-64 rounded-full border border-white/10" />
                  <div className="absolute -right-3 -top-12 size-48 rounded-full border border-white/10" />
                </>
              )}
              <div className="relative">
                <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
                  {form.name || "Nome do seu negócio"}
                </h3>
                <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-white/80">
                  {form.description || "Conte aos clientes o que torna seu negócio especial."}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/75">
                  {(form.address || form.city) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} /> {[form.address, form.city].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Store size={13} />
                    {form.category === "alimentacao"
                      ? "Pedidos pelo WhatsApp"
                      : "Agendamento online"}
                  </span>
                </div>
              </div>
            </header>

            <section className="p-4 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#778253]">
                    Conheça
                  </p>
                  <h4 className="mt-1 font-display text-xl font-bold">{businessCopy.offerTitle}</h4>
                </div>
                <Link
                  to="/studio/catalog"
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#667448] hover:bg-white"
                >
                  Editar {businessCopy.offerTitle.toLowerCase()} <ArrowUpRight size={14} />
                </Link>
              </div>
              {activeServices.length ? (
                <div className="mt-3 space-y-2">
                  {activeServices.slice(0, 3).map((service) => (
                    <a
                      key={service.id}
                      href={
                        form.category === "alimentacao"
                          ? `/loja/${form.slug}`
                          : `/loja/${form.slug}?servico=${encodeURIComponent(service.id)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label={
                        form.category === "alimentacao"
                          ? `Ver ${service.name} no cardápio público`
                          : `Agendar ${service.name} na página pública`
                      }
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf0e5] text-[#667448]">
                        {form.category === "alimentacao" ? (
                          <Store size={16} />
                        ) : (
                          <CalendarDays size={16} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{service.name}</span>
                        <span className="mt-1 block truncate text-[11px] text-slate-500">
                          {service.description ||
                            (form.category === "alimentacao"
                              ? "Item do cardápio"
                              : `${service.duration} min`)}
                        </span>
                      </span>
                      <span className="text-xs font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(service.price)}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
                  <p className="text-xs text-slate-500">
                    Seus {businessCopy.offers} aparecerão aqui.
                  </p>
                  <Link
                    to="/studio/catalog"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#667448]"
                  >
                    {businessCopy.addOffer} <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`/loja/${form.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#292b25] px-3 text-xs font-bold text-white"
                >
                  <CalendarDaysIcon />{" "}
                  {form.category === "alimentacao" ? "Ver cardápio" : businessCopy.bookingAction}
                </a>
                <a
                  href={form.phone ? `https://wa.me/${form.phone.replace(/\D/g, "")}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!form.phone}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#586341] aria-disabled:pointer-events-none aria-disabled:opacity-50"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </section>
          </article>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void copy()}
              type="button"
              className={secondaryButtonClass + " flex-1"}
            >
              <Copy size={14} /> Copiar link público
            </button>
            <a
              href={"/loja/" + form.slug}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir página pública"
              className={secondaryButtonClass + " px-3"}
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <p className="mt-2 break-all text-center text-[11px] text-slate-400">{publicUrl}</p>
          <p className="mt-4 rounded-xl border border-[#e1e3d8] bg-white/70 p-3 text-xs leading-5 text-slate-500">
            Serviços e preços são editados no{" "}
            <Link to="/studio/catalog" className="font-bold text-[#667448]">
              Catálogo
            </Link>{" "}
            e refletem aqui automaticamente.
          </p>
        </aside>
      </div>
    </>
  );
}

function CalendarDaysIcon() {
  return (
    <span aria-hidden="true" className="text-[13px]">
      ▦
    </span>
  );
}
