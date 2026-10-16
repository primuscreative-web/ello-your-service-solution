import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ImagePlus,
  Film,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Store,
  Upload,
  Check,
  AlertCircle,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { PageTitle, SurfaceCard, primaryButtonClass, secondaryButtonClass, money } from "@/components/localhub/ui";
import { useLocalHub, type PortfolioItem, type Service } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BeforeAfterSlider } from "@/components/localhub/portfolio-view";

export const Route = createFileRoute("/studio/portfolio")({ component: StudioPortfolioPage });

function StudioPortfolioPage() {
  const { business, services, user, saveBusiness } = useLocalHub();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estado do formulário
  const [mediaType, setMediaType] = useState<"image" | "video" | "before_after">("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [tag, setTag] = useState("Transformação");
  const [featured, setFeatured] = useState(false);

  // Lista de itens do portfólio
  const items: PortfolioItem[] = business?.portfolioItems ?? business?.onboardingDetails?.portfolioItems ?? [];

  const openNewModal = () => {
    setEditingItem(null);
    setMediaType("image");
    setTitle("");
    setDescription("");
    setMediaUrl("");
    setThumbnailUrl("");
    setBeforeUrl("");
    setAfterUrl("");
    setServiceId("");
    setTag("Transformação");
    setFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setMediaType(item.mediaType);
    setTitle(item.title);
    setDescription(item.description || "");
    setMediaUrl(item.mediaUrl || "");
    setThumbnailUrl(item.thumbnailUrl || "");
    setBeforeUrl(item.beforeUrl || "");
    setAfterUrl(item.afterUrl || "");
    setServiceId(item.serviceId || "");
    setTag(item.tag || "Transformação");
    setFeatured(Boolean(item.featured));
    setModalOpen(true);
  };

  // Upload de imagem ou vídeo para o Supabase Storage
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: "mediaUrl" | "thumbnailUrl" | "beforeUrl" | "afterUrl",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id || !user?.id) return;

    setUploading(true);
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Cliente de banco não disponível");

      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/business-${business.id}/portfolio-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await client.storage
        .from("business-banners")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const publicUrl = client.storage.from("business-banners").getPublicUrl(filePath).data.publicUrl;

      if (targetField === "mediaUrl") setMediaUrl(publicUrl);
      else if (targetField === "thumbnailUrl") setThumbnailUrl(publicUrl);
      else if (targetField === "beforeUrl") setBeforeUrl(publicUrl);
      else if (targetField === "afterUrl") setAfterUrl(publicUrl);

      toast.success("Arquivo enviado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no envio do arquivo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (mediaType === "before_after" && (!beforeUrl || !afterUrl)) {
      toast.error("Informe a foto do Antes e a foto do Depois.");
      return;
    }
    if (mediaType !== "before_after" && !mediaUrl) {
      toast.error("Informe o link ou envie o arquivo da mídia.");
      return;
    }

    setSaving(true);
    try {
      const selectedService = services.find((s) => s.id === serviceId);

      const newItem: PortfolioItem = {
        id: editingItem ? editingItem.id : `portfolio_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        mediaType,
        mediaUrl: mediaType === "before_after" ? afterUrl : mediaUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        beforeUrl: mediaType === "before_after" ? beforeUrl.trim() : undefined,
        afterUrl: mediaType === "before_after" ? afterUrl.trim() : undefined,
        serviceId: serviceId || undefined,
        serviceName: selectedService ? selectedService.name : undefined,
        tag: tag.trim() || undefined,
        featured,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      const updatedItems = editingItem
        ? items.map((i) => (i.id === editingItem.id ? newItem : i))
        : [newItem, ...items];

      await saveBusiness({
        ...business,
        portfolioItems: updatedItems,
        onboardingDetails: {
          ...(business.onboardingDetails ?? { specialties: [], serviceModes: [] }),
          portfolioItems: updatedItems,
        },
      });

      toast.success(editingItem ? "Trabalho atualizado!" : "Novo trabalho adicionado ao portfólio!");
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar trabalho.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!business || !confirm("Deseja realmente remover este item do seu portfólio?")) return;

    try {
      const updatedItems = items.filter((i) => i.id !== id);
      await saveBusiness({
        ...business,
        portfolioItems: updatedItems,
        onboardingDetails: {
          ...(business.onboardingDetails ?? { specialties: [], serviceModes: [] }),
          portfolioItems: updatedItems,
        },
      });
      toast.success("Trabalho removido do portfólio.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover item.");
    }
  };

  // Estatísticas do Portfólio
  const photosCount = items.filter((i) => i.mediaType === "image").length;
  const videosCount = items.filter((i) => i.mediaType === "video").length;
  const beforeAfterCount = items.filter((i) => i.mediaType === "before_after").length;
  const linkedServicesCount = items.filter((i) => Boolean(i.serviceId)).length;

  return (
    <div className="space-y-7">
      {/* CABEÇALHO */}
      <PageTitle
        eyebrow="Apresentação de Serviços"
        title="Portfólio & Trabalhos Realizados"
        description="Apresente seus trabalhos com fotos em alta resolução, vídeos e comparações interativas de Antes & Depois. Prova visual é o maior fator de decisão de agendamento."
        action={
          <div className="flex items-center gap-2.5">
            {business?.slug && (
              <Link
                to="/loja/$slug"
                params={{ slug: business.slug }}
                target="_blank"
                className={secondaryButtonClass}
              >
                <Store size={15} />
                <span>Ver na Loja</span>
                <ExternalLink size={12} className="opacity-70" />
              </Link>
            )}
            <button type="button" onClick={openNewModal} className={primaryButtonClass}>
              <Plus size={16} />
              <span>Novo Trabalho</span>
            </button>
          </div>
        }
      />

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total no Portfólio", value: items.length, icon: Layers, color: "text-[#5e6940] bg-[#edf0e5]" },
          { label: "Fotos de Trabalhos", value: photosCount, icon: ImagePlus, color: "text-blue-800 bg-blue-100" },
          { label: "Vídeos & Reels", value: videosCount, icon: Film, color: "text-purple-800 bg-purple-100" },
          { label: "Antes & Depois", value: beforeAfterCount, icon: Sparkles, color: "text-amber-800 bg-amber-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-[#dedfd6]/80 bg-white p-5 shadow-xs transition hover:border-[#c7c9bc]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#686b60]">{label}</span>
              <span className={`grid size-8 place-items-center rounded-lg ${color}`}>
                <Icon size={16} />
              </span>
            </div>
            <div className="mt-3 font-display text-2xl font-black text-[#171914]">{value}</div>
          </div>
        ))}
      </div>

      {/* GRADE DE TRABALHOS DO PORTFÓLIO */}
      {items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const linkedService = services.find((s) => s.id === item.serviceId);
            const isVideo = item.mediaType === "video";
            const isBeforeAfter = item.mediaType === "before_after" && Boolean(item.beforeUrl && item.afterUrl);

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#dedfd6]/90 bg-white shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* MÍDIA VISUAL DO CARD */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                  {isBeforeAfter ? (
                    <BeforeAfterSlider
                      beforeUrl={item.beforeUrl!}
                      afterUrl={item.afterUrl!}
                      aspectRatio="aspect-4/3"
                    />
                  ) : isVideo ? (
                    <div className="relative size-full">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="size-full object-cover" />
                      ) : item.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={item.mediaUrl} className="size-full object-cover" muted />
                      ) : (
                        <div className="grid size-full place-items-center text-slate-400">
                          <Film size={36} />
                        </div>
                      )}
                      <div className="absolute inset-0 grid place-items-center bg-black/40">
                        <span className="grid size-10 place-items-center rounded-full bg-[#d4f455] text-[#151712]">
                          <Play size={16} className="fill-[#151712] ml-0.5" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img src={item.mediaUrl} alt={item.title} className="size-full object-cover" />
                  )}

                  {/* Badges de Mídia */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    {item.tag && (
                      <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#171914] shadow-xs">
                        {item.tag}
                      </span>
                    )}
                    {item.mediaType === "before_after" && (
                      <span className="rounded-full bg-[#d4f455] px-2 py-0.5 text-[9px] font-black text-[#151712] uppercase tracking-wider">
                        Antes & Depois
                      </span>
                    )}
                    {item.mediaType === "video" && (
                      <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">
                        Vídeo
                      </span>
                    )}
                  </div>

                  {item.featured && (
                    <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-[#151712] uppercase tracking-wider shadow-xs">
                      <Sparkles size={9} /> Destaque
                    </span>
                  )}
                </div>

                {/* CONTEÚDO E AÇÕES */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-sm font-black text-[#171914]">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#686b60]">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f0efe9] flex items-center justify-between">
                    <div>
                      {linkedService ? (
                        <div className="text-[11px] font-bold text-[#768452]">
                          Vinculado a: <span className="text-[#171914]">{linkedService.name}</span> ({money(linkedService.price)})
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9a9d90]">Sem serviço vinculado</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="grid size-8 place-items-center rounded-lg text-[#686b60] hover:bg-[#edf0e5] hover:text-[#171914]"
                        title="Editar trabalho"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(item.id)}
                        className="grid size-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Excluir trabalho"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#dedfd6] bg-white p-12 text-center shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#edf0e5] text-[#586341]">
            <ImagePlus size={32} />
          </div>
          <h3 className="mt-4 font-display text-lg font-black text-[#171914]">
            Seu Portfólio ainda está vazio
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#686b60]">
            Cadastre fotos, vídeos e comparações de Antes & Depois dos serviços que você realiza. Clientes agendam muito mais quando veem o resultado real do seu trabalho!
          </p>
          <button
            type="button"
            onClick={openNewModal}
            className={`mt-6 ${primaryButtonClass}`}
          >
            <Plus size={16} />
            <span>Adicionar Meu Primeiro Trabalho</span>
          </button>
        </div>
      )}

      {/* MODAL DE CADASTRO E EDIÇÃO DE TRABALHO */}
      {modalOpen && (
        <div
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-3xl border border-[#dedfd6] bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#e8e6df] pb-4">
              <div>
                <h3 className="font-display text-lg font-black text-[#171914]">
                  {editingItem ? "Editar Trabalho do Portfólio" : "Novo Trabalho no Portfólio"}
                </h3>
                <p className="text-xs text-[#707466]">
                  Apresente detalhes visuais para encantar os clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-5 space-y-4">
              {/* TIPO DE MÍDIA */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c4f44] mb-1.5">
                  Formato da Mídia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "image", label: "📷 Foto Única", desc: "Imagem do trabalho" },
                    { id: "video", label: "🎥 Vídeo / Reels", desc: "MP4 ou link de vídeo" },
                    { id: "before_after", label: "🌓 Antes & Depois", desc: "Comparador deslizante" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMediaType(tab.id as typeof mediaType)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        mediaType === tab.id
                          ? "border-[#768452] bg-[#edf0e5] font-black text-[#171914]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold">{tab.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{tab.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* TÍTULO */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c4f44] mb-1">
                  Título do Trabalho *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Polimento Técnico e Vitrificação / Tosa na Tesoura Spits"
                  className="w-full rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2.5 text-xs text-[#171914] outline-none focus:border-[#768452] focus:ring-4 focus:ring-[#768452]/15"
                />
              </div>

              {/* CAMPOS ESPECÍFICOS DE MÍDIA */}
              {mediaType === "before_after" ? (
                <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-amber-900 mb-1">
                      Foto do "Antes" *
                    </label>
                    <input
                      type="url"
                      required
                      value={beforeUrl}
                      onChange={(e) => setBeforeUrl(e.target.value)}
                      placeholder="https://... ou faça upload"
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs outline-none"
                    />
                    <label className="mt-2 inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-amber-900 hover:underline">
                      <Upload size={12} />
                      <span>{uploading ? "Enviando…" : "Enviar foto do Antes"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => void handleFileUpload(e, "beforeUrl")}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-emerald-900 mb-1">
                      Foto do "Depois" *
                    </label>
                    <input
                      type="url"
                      required
                      value={afterUrl}
                      onChange={(e) => setAfterUrl(e.target.value)}
                      placeholder="https://... ou faça upload"
                      className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs outline-none"
                    />
                    <label className="mt-2 inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-900 hover:underline">
                      <Upload size={12} />
                      <span>{uploading ? "Enviando…" : "Enviar foto do Depois"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => void handleFileUpload(e, "afterUrl")}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              ) : mediaType === "video" ? (
                <div className="space-y-3 rounded-2xl border border-purple-200 bg-purple-50/30 p-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-purple-900 mb-1">
                      Link do Vídeo (YouTube / Reels / MP4) *
                    </label>
                    <input
                      type="url"
                      required
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... ou https://.../video.mp4"
                      className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-purple-800 mb-1">
                      Thumbnail / Capa do Vídeo (Opcional)
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://... foto de capa do vídeo"
                      className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs outline-none"
                    />
                    <label className="mt-1.5 inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-purple-900 hover:underline">
                      <Upload size={12} />
                      <span>{uploading ? "Enviando…" : "Enviar imagem de capa"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => void handleFileUpload(e, "thumbnailUrl")}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c4f44] mb-1">
                    Link da Foto ou Arquivo *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://... ou clique no botão ao lado para enviar foto"
                      className="flex-1 rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2.5 text-xs text-[#171914] outline-none"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#dedfd6] bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      <Upload size={14} />
                      <span>{uploading ? "Enviando…" : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => void handleFileUpload(e, "mediaUrl")}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* DESCRIÇÃO E DETALHES DO PROCEDIMENTO */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c4f44] mb-1">
                  Descrição do Procedimento / Trabalho
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que foi realizado, técnicas, produtos aplicados ou diferenciais para valorizar seu serviço..."
                  className="w-full rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2.5 text-xs text-[#171914] outline-none resize-y"
                />
              </div>

              {/* VÍNCULO COM O SERVIÇO & TAG */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c4f44] mb-1">
                    Vincular a um Serviço do Catálogo
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full rounded-xl border border-[#dedfd6] bg-white px-3 py-2.5 text-xs outline-none cursor-pointer"
                  >
                    <option value="">Nenhum (Apenas exibição)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({money(s.price)})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Permite que o cliente clique em "Agendar este serviço" direto pela foto/vídeo!
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4c4f44] mb-1">
                    Tag / Categoria do Trabalho
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Ex: Antes & Depois, Procedimento, Bastidores"
                    className="w-full rounded-xl border border-[#dedfd6] bg-white px-3 py-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* DESTAQUE */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="size-4 rounded accent-[#768452]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Fixar como Destaque no topo da vitrine
                  </span>
                </label>
              </div>

              {/* BOTÕES DO FORMULÁRIO */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#e8e6df]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className={primaryButtonClass}
                >
                  {saving ? "Salvando…" : editingItem ? "Salvar Alterações" : "Publicar Trabalho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
