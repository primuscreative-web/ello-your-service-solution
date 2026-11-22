import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
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
  HelpCircle,
  Sparkles,
  Gift,
  Plus,
  Pencil,
  Film,
  X,
} from "lucide-react";
import { formatCep, fetchAddressFromCep } from "@/lib/cities";
import { ElloAtomLoader } from "@/components/ello/atom-loader";
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
  type Service,
  type StaffMember,
} from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatSetupChoice, getBusinessCopy } from "@/lib/localhub-business";
import { getPlanLimit, hasPlanFeature } from "@/lib/plan-access";
import { getStorefrontThemes, type StorefrontThemeId } from "@/lib/storefront-themes";
import {
  LuckyWheel,
  type LuckyWheelSettings,
  type LuckyWheelPrize,
  defaultNichePrizes,
} from "@/components/localhub/lucky-wheel";

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
    savePublicTheme,
    saveService,
    removeService,
    deliveryAreas,
    saveDeliveryArea,
    removeDeliveryArea,
    staff,
    saveStaff,
    planSubscription,
    ready,
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
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const [editingMode, setEditingMode] = useState(false);
  const [editTarget, setEditTarget] = useState<{ section: string; serviceId?: string } | null>(null);
  const [serviceDraft, setServiceDraft] = useState<(Omit<Service, "id"> & { id?: string }) | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMessage, setThemeMessage] = useState("");
  const pageVideos = (form.onboardingDetails?.portfolioItems ?? []).filter((item) => item.mediaType === "video").length;
  const pageVideoLimit = ready ? getPlanLimit(planSubscription, "portfolioVideos") : null;
  const canAddPageVideo = ready && hasPlanFeature(planSubscription, "video_portfolio") &&
    (pageVideoLimit === null || pageVideos < pageVideoLimit);
  const pageThemes = getStorefrontThemes(form.category);
  const selectedPublicTheme = form.publicTheme ?? "standard";
  const themeSubject = form.category === "alimentacao"
    ? "cardápio"
    : form.category === "beleza"
      ? "página de beleza"
      : form.category === "pet"
        ? "página pet"
      : form.category === "saude"
        ? "página de saúde"
      : "página pública";
  const themeCategoryLabel = form.category === "alimentacao"
    ? "alimentação"
    : form.category === "beleza"
      ? "beleza"
      : form.category === "saude"
        ? "saúde e bem-estar"
      : "cuidado pet";

  async function persistPublicTheme() {
    setThemeSaving(true);
    setThemeMessage("");
    try {
      await savePublicTheme(selectedPublicTheme);
      setThemeMessage("Tema salvo e aplicado à página pública.");
    } catch (caught) {
      setThemeMessage(caught instanceof Error ? caught.message : "Não foi possível salvar o tema.");
    } finally {
      setThemeSaving(false);
    }
  }

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

  function addOnboardingChoice(field: "specialties" | "serviceModes", value: string) {
    const choice = createSlug(value);
    if (!choice) return;
    const details = form.onboardingDetails ?? { specialties: [], serviceModes: [] };
    const values = details[field];
    if (values.includes(choice)) return;
    updateOnboardingDetails({ ...details, [field]: [...values, choice] });
    if (field === "specialties") setSpecialtyDraft("");
    else setServiceModeDraft("");
  }

  const wheelSettings: LuckyWheelSettings = form.onboardingDetails?.wheelSettings ?? form.wheelSettings ?? {
    enabled: true,
    trigger: "both",
    minOrderValue: 20,
    title: "Roleta de Prêmios da Casa 🎰",
    subtitle: "Gire e ganhe um presente para seu próximo pedido!",
    prizes: defaultNichePrizes[form.category] || defaultNichePrizes.alimentacao,
  };

  function updateWheelSettings(next: Partial<LuckyWheelSettings>) {
    setSaved(false);
    const updated: LuckyWheelSettings = { ...wheelSettings, ...next };
    const nextDetails: BusinessOnboardingDetails = {
      ...(form.onboardingDetails ?? { specialties: [], serviceModes: [] }),
      wheelSettings: updated,
    };
    setForm((current) => ({
      ...current,
      onboardingDetails: nextDetails,
      wheelSettings: updated,
    }));
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
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

  function sendPreviewUpdate() {
    const frame = previewFrameRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage({ type: "ello:studio-preview-update", business: { ...form, bannerUrl: banner || null, logoUrl: logo || null, galleryUrls: [...(form.galleryUrls ?? []), ...galleryPreviewUrls] }, services }, window.location.origin);
    frame.postMessage({ type: "ello:studio-edit-mode", enabled: editingMode }, window.location.origin);
  }

  useEffect(() => {
    const receiveTarget = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== previewFrameRef.current?.contentWindow || event.data?.type !== "ello:studio-edit-target") return;
      if (!["profile", "media", "hours", "catalog", "service"].includes(event.data.section)) return;
      setEditTarget({ section: event.data.section, serviceId: event.data.serviceId });
      const current = services.find((item) => item.id === event.data.serviceId);
      setServiceDraft(current ?? null);
    };
    window.addEventListener("message", receiveTarget);
    return () => window.removeEventListener("message", receiveTarget);
  }, [services]);

  useEffect(() => { sendPreviewUpdate(); }, [form, banner, logo, galleryPreviewUrls, services, editingMode]);

  async function savePageService() {
    if (!serviceDraft?.name.trim()) return;
    try {
      await saveService({ ...serviceDraft, name: serviceDraft.name.trim(), description: serviceDraft.description.trim(), menuCategory: serviceDraft.menuCategory ?? "", serviceModes: serviceDraft.serviceModes ?? ["in_person"] });
      setServiceDraft(null);
      setEditTarget({ section: "catalog" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar o item."); }
  }

  async function deletePageService(service: Service) {
    if (!confirm(`Excluir “${service.name}” do cardápio?`)) return;
    try { await removeService(service.id); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível excluir o item."); }
  }

  async function addPageVideo() {
    if (!videoUrl.trim()) return;
    if (!ready) {
      setError("Aguarde a confirmação do seu plano para adicionar vídeos.");
      return;
    }
    if (!hasPlanFeature(planSubscription, "video_portfolio")) {
      setError("Vídeos no portfólio estão disponíveis a partir do plano Pro.");
      return;
    }
    if (ready && pageVideoLimit !== null && pageVideos >= pageVideoLimit) {
      setError(`O limite de ${pageVideoLimit} vídeos do plano foi atingido.`);
      return;
    }
    const portfolioItems = [...(form.onboardingDetails?.portfolioItems ?? []), { id: crypto.randomUUID(), title: "Vídeo", mediaType: "video" as const, mediaUrl: videoUrl.trim(), createdAt: new Date().toISOString() }];
    const onboardingDetails = { ...(form.onboardingDetails ?? { specialties: [], serviceModes: [] }), portfolioItems };
    const next = { ...form, onboardingDetails, portfolioItems };
    try { await saveBusiness(next); setForm(next); setVideoUrl(""); setError(""); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar o vídeo."); }
  }

  return (
    <>
      <PageTitle eyebrow="Minha página" title="Editar página" description="Veja sua loja como ela aparece no celular e edite cada parte diretamente na página." action={<a href={`/loja/${form.slug}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>Abrir página <ExternalLink size={15} /></a>} />
      <div className="studio-page-editor mx-auto w-full max-w-[1180px]">
        {pageThemes.length > 0 && (
          <section className="studio-theme-picker mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5" aria-labelledby="store-theme-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#778253]">Aparência da página</p>
                <h2 id="store-theme-title" className="mt-1 text-base font-bold text-[#20221c]">Escolha o tema do seu {themeSubject}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">A prévia muda na hora. Salve para aplicar na página pública.</p>
              </div>
              <button type="button" onClick={() => void persistPublicTheme()} disabled={themeSaving || selectedPublicTheme === (business?.publicTheme ?? "standard")} className={`${primaryButtonClass} min-h-11 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}>
                {themeSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {themeSaving ? "Salvando tema" : "Salvar tema"}
              </button>
            </div>
            <fieldset className="mt-4">
              <legend className="sr-only">Temas disponíveis para negócios de {themeCategoryLabel}</legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                {pageThemes.map((theme) => {
                  const selectedTheme = selectedPublicTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      aria-pressed={selectedTheme}
                      onClick={() => {
                        setForm((current) => ({ ...current, publicTheme: theme.id as StorefrontThemeId }));
                        setThemeMessage("");
                      }}
                      className={`studio-theme-option min-w-0 rounded-xl border p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#687944] sm:p-3 ${selectedTheme ? "is-selected" : ""}`}
                    >
                      <span className="studio-theme-swatch block overflow-hidden rounded-lg border border-black/5" style={{ "--theme-bg": theme.palette[0], "--theme-surface": theme.palette[1], "--theme-accent": theme.palette[2] } as CSSProperties} aria-hidden="true">
                        <span className="studio-theme-swatch-top" />
                        <span className="studio-theme-swatch-content"><i /><i /><i /></span>
                      </span>
                      <span className="mt-2 block text-xs font-bold text-[#20221c] sm:text-sm">{theme.name}</span>
                      <span className="mt-0.5 block text-[10px] leading-4 text-slate-500 sm:text-[11px]">{theme.description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {themeMessage && <p role="status" className={`mt-3 text-xs ${themeMessage.includes("salvo") ? "text-emerald-700" : "text-amber-800"}`}>{themeMessage}</p>}
          </section>
        )}
        <div className="studio-page-editor-toolbar mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs sm:px-5">
          <div className="min-w-0"><h2 className="text-sm font-bold">Sua página no celular</h2><p className="text-xs text-slate-500">Prévia ao vivo · toque no lápis para editar</p></div>
          <button type="button" onClick={() => { setEditingMode((value) => !value); setEditTarget(null); setTimeout(sendPreviewUpdate, 0); }} className={editingMode ? primaryButtonClass : secondaryButtonClass}><Pencil size={15} /> {editingMode ? "Concluir" : "Editar página"}</button>
        </div>
        <div className="studio-page-preview-shell overflow-hidden rounded-[28px] border border-slate-200 bg-[#f5f4ef] p-2 shadow-sm sm:mx-auto sm:w-fit sm:rounded-[38px] sm:border-[8px] sm:border-[#22231f] sm:bg-white sm:p-0 sm:shadow-xl">
          <iframe ref={previewFrameRef} title="Prévia editável da página pública" src={`/loja/${form.slug}?studioPreview=1`} onLoad={sendPreviewUpdate} className="studio-page-preview-frame block h-[calc(100dvh-15rem)] min-h-[480px] w-full rounded-2xl bg-white sm:h-[min(78vh,850px)] sm:min-h-[620px] sm:w-[390px] sm:rounded-none" />
        </div>
        {editingMode && <p className="studio-page-editor-hint mt-3 text-center text-xs text-[#586341]">Toque no lápis que aparece sobre a parte que deseja editar.</p>}
        <details className="mt-5 rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Mais configurações</summary><div className="mt-3 flex flex-wrap gap-2"><Link to="/studio/catalog" className={secondaryButtonClass}>Catálogo completo <ArrowUpRight size={14} /></Link><Link to="/studio/whatsapp" className={secondaryButtonClass}>Configurar WhatsApp <ArrowUpRight size={14} /></Link></div></details>
      </div>
      {editTarget && <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/30" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditTarget(null); }}><section className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"><header className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#778253]">Editar na página</p><h2 className="text-lg font-bold">{editTarget.section === "profile" ? "Perfil do negócio" : editTarget.section === "media" ? "Fotos e vídeos" : editTarget.section === "hours" ? "Horários" : "Cardápio"}</h2></div><button type="button" onClick={() => setEditTarget(null)} aria-label="Fechar" className="grid size-10 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></header><div className="flex-1 space-y-4 overflow-y-auto p-5">
        {editTarget.section === "profile" && <form id="page-profile" onSubmit={(event) => { void submit(event).then(() => setEditTarget(null)); }} className="space-y-4"><Field label="Nome do negócio"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Descrição"><textarea className={inputClass} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="WhatsApp"><input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Endereço"><input className={inputClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field><Field label="Cidade"><input className={inputClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field><button className={primaryButtonClass}><Save size={15} /> Salvar perfil</button></form>}
      {editTarget.section === "media" && <div className="space-y-4"><label className="block cursor-pointer rounded-xl border p-3 text-sm font-semibold">{banner ? "Trocar foto de capa" : "Adicionar foto de capa"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectBanner} className="sr-only" /></label><label className="block cursor-pointer rounded-xl border p-3 text-sm font-semibold">{logo ? "Trocar foto de perfil" : "Adicionar foto de perfil"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectLogo} className="sr-only" /></label><label className="block cursor-pointer rounded-xl border p-3 text-sm font-semibold">Adicionar fotos à página<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectGalleryFiles} className="sr-only" /></label><div className="grid grid-cols-3 gap-2">{(form.galleryUrls ?? []).map((url) => <img key={url} src={url} alt="Foto da página" className="aspect-square rounded-lg object-cover" />)}{galleryPreviewUrls.map((url) => <img key={url} src={url} alt="Nova foto" className="aspect-square rounded-lg object-cover" />)}</div><Field label={`Link do vídeo · ${ready ? `${pageVideos}${pageVideoLimit === null ? " sem limite" : `/${pageVideoLimit}`} no plano` : "verificando plano"}`}><input className={inputClass} disabled={!canAddPageVideo} value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Link público do vídeo" /></Field>{!canAddPageVideo && <p className="text-xs text-slate-600">{!ready ? "Verificando o plano da conta…" : !hasPlanFeature(planSubscription, "video_portfolio") ? <>Vídeos estão disponíveis no Pro. <Link to="/planos" className="font-semibold text-[#586341] underline">Ver planos</Link></> : "Você atingiu o limite de vídeos deste plano."}</p>}<button type="button" disabled={!canAddPageVideo} onClick={() => void addPageVideo()} className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}><Film size={15} /> Adicionar vídeo</button><button type="button" onClick={() => void submit()} className={primaryButtonClass}><Save size={15} /> Salvar fotos e vídeos</button></div>}
        {editTarget.section === "hours" && <div className="space-y-3">{weekDays.map(([day,label]) => <div key={day} className="rounded-xl border p-3"><div className="mb-3 flex items-center justify-between"><b className="text-sm">{label}</b><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={openingHours[day]?.closed ?? true} onChange={(event) => setForm({ ...form, openingHours: { ...openingHours, [day]: { ...(openingHours[day] ?? defaultOpeningHours[day]), closed: event.target.checked } } })} /> Fechado</label></div>{!openingHours[day]?.closed && <div className="grid grid-cols-2 gap-3"><Field label="Abre"><input type="time" className={inputClass} value={openingHours[day]?.open ?? "09:00"} onChange={(event) => setForm({ ...form, openingHours: { ...openingHours, [day]: { ...(openingHours[day] ?? defaultOpeningHours[day]), open: event.target.value } } })} /></Field><Field label="Fecha"><input type="time" className={inputClass} value={openingHours[day]?.close ?? "18:00"} onChange={(event) => setForm({ ...form, openingHours: { ...openingHours, [day]: { ...(openingHours[day] ?? defaultOpeningHours[day]), close: event.target.value } } })} /></Field></div>}</div>)}<button type="button" onClick={() => void submit()} className={primaryButtonClass}><Save size={15} /> Salvar horários</button></div>}
        {(editTarget.section === "catalog" || editTarget.section === "service") && <div className="space-y-3"><button type="button" onClick={() => setServiceDraft({ name: "", description: "", duration: 30, price: 0, active: true, serviceModes: ["in_person"] })} className={secondaryButtonClass}><Plus size={15} /> Novo item</button>{serviceDraft && <div className="space-y-3 rounded-xl border bg-slate-50 p-4"><Field label="Nome"><input className={inputClass} value={serviceDraft.name} onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })} /></Field><Field label="Descrição"><textarea className={inputClass} value={serviceDraft.description} onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })} /></Field><Field label="Preço"><input type="number" min="0" step="0.01" className={inputClass} value={serviceDraft.price} onChange={(event) => setServiceDraft({ ...serviceDraft, price: Number(event.target.value) })} /></Field><button type="button" onClick={() => void savePageService()} className={primaryButtonClass}><Save size={15} /> Salvar item</button></div>}{services.map((service) => <div key={service.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span>{service.name} · {Number(service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span className="flex gap-2"><button type="button" onClick={() => setServiceDraft(service)} className="rounded border px-2 py-1">Editar</button><button type="button" onClick={() => void deletePageService(service)} aria-label={`Excluir ${service.name}`} className="text-red-600"><Trash2 size={15} /></button></span></div>)}</div>}
      </div></section></div>}
      {error && <p role="alert" className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl bg-red-50 p-3 text-sm text-red-700 shadow">{error}</p>}{saved && <p role="status" className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-xl bg-[#edf0e5] p-3 text-sm text-[#586341] shadow">Alterações salvas</p>}
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
