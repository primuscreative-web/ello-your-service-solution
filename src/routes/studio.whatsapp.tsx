import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MessageCircle, Save, Sparkles } from "lucide-react";
import { ElloAtomLoader } from "@/components/ello/atom-loader";
import { PageTitle, primaryButtonClass } from "@/components/localhub/ui";
import { useLocalHub } from "@/lib/localhub-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WhatsAppTemplates } from "@/lib/whatsapp-templates";

export const Route = createFileRoute("/studio/whatsapp")({ component: WhatsAppSettingsPage });

type TemplateKind = "orderCustomer" | "orderOwner" | "appointment";
type TemplateTone = "acolhedor" | "profissional" | "descontraido";

const templateLabels: Record<TemplateKind, string> = {
  orderCustomer: "Atualização para o cliente",
  orderOwner: "Aviso de novo pedido ao negócio",
  appointment: "Mensagem de agendamento",
};
const templateVariables: Record<TemplateKind, string> = {
  orderCustomer:
    "{{cliente}}, {{pedido}}, {{negocio}}, {{status}}, {{itens}}, {{total}}, {{tipo}}, {{endereco}}, {{link}}, {{telefone}}",
  orderOwner:
    "{{cliente}}, {{pedido}}, {{negocio}}, {{status}}, {{itens}}, {{total}}, {{tipo}}, {{endereco}}, {{link}}, {{telefone}}",
  appointment: "{{cliente}}, {{negocio}}, {{servico}}, {{profissional}}, {{horario}}, {{endereco}}",
};

function WhatsAppSettingsPage() {
  const { business, saveWhatsAppTemplates } = useLocalHub();
  const [templates, setTemplates] = useState<WhatsAppTemplates>(business?.whatsappTemplates ?? {});
  const [templateKind, setTemplateKind] = useState<TemplateKind>("orderCustomer");
  const [templateTone, setTemplateTone] = useState<TemplateTone>("acolhedor");
  const [templateBusy, setTemplateBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [waState, setWaState] = useState<
    "loading" | "open" | "connecting" | "close" | "not_configured"
  >("loading");
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    setTemplates(business?.whatsappTemplates ?? {});
  }, [business?.whatsappTemplates]);

  const fetchWhatsAppStatus = async () => {
    try {
      setWaLoading(true);
      const supabase = getSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data.session;
      const response = await fetch("/api/whatsapp/session", {
        headers: { authorization: session?.access_token ? `Bearer ${session.access_token}` : "" },
      });
      const data = await response.json().catch(() => ({}));
      if (data.qrcode) {
        setWaQrCode(data.qrcode);
        setWaState(data.state === "open" ? "open" : "connecting");
      } else if (data.state === "open") {
        setWaState("open");
        setWaQrCode(null);
      } else {
        setWaState(data.state || "connecting");
      }
    } catch {
      setWaState("close");
    } finally {
      setWaLoading(false);
    }
  };

  useEffect(() => {
    void fetchWhatsAppStatus();
    const interval = setInterval(() => {
      if (waState === "connecting" || waState === "close") void fetchWhatsAppStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [waState]);

  const updateTemplate = (value: string) => {
    setSaved(false);
    setFeedback("");
    setTemplates((current) => ({ ...current, [templateKind]: value }));
  };

  const generateTemplate = async () => {
    setTemplateBusy(true);
    setFeedback("");
    setError("");
    try {
      const client = getSupabaseBrowserClient();
      const session = (await client?.auth.getSession())?.data.session;
      const response = await fetch("/api/whatsapp/generate-template", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ kind: templateKind, tone: templateTone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o texto.");
      updateTemplate(data.suggestion);
      setFeedback("Sugestão criada. Revise e salve para ativá-la.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao gerar sugestão.");
    } finally {
      setTemplateBusy(false);
    }
  };

  const saveTemplates = async () => {
    setSaving(true);
    setError("");
    try {
      await saveWhatsAppTemplates(templates);
      setSaved(true);
      setFeedback("Modelos do WhatsApp salvos.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar os modelos.");
    } finally {
      setSaving(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!confirm("Deseja realmente desconectar o WhatsApp desta loja?")) return;
    setWaLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data.session;
      await fetch("/api/whatsapp/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ action: "disconnect" }),
      });
      await fetchWhatsAppStatus();
    } finally {
      setWaLoading(false);
    }
  };

  const currentText = templates[templateKind] ?? "";
  const statusLabel =
    waState === "open"
      ? "Conectado"
      : waState === "connecting"
        ? "Aguardando leitura"
        : waState === "loading"
          ? "Verificando"
          : "Desconectado";
  const statusClass =
    waState === "open"
      ? "bg-emerald-600 text-white"
      : waState === "connecting"
        ? "bg-amber-500 text-white"
        : "bg-slate-400 text-white";

  return (
    <>
      <PageTitle
        eyebrow="Configurações do WhatsApp"
        title="WhatsApp do negócio"
        description="Conecte o número do negócio e personalize as mensagens automáticas. Estas configurações são salvas separadamente da sua página pública."
      />

      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                <MessageCircle size={20} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-emerald-950">Conexão para disparos automáticos</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 max-w-xl text-xs leading-5 text-emerald-800">
                  {business?.category === "alimentacao"
                    ? "Envie atualizações de pedidos e avisos da loja pelo WhatsApp do negócio."
                    : "Envie confirmações e lembretes de atendimento pelo WhatsApp do negócio."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void fetchWhatsAppStatus()}
                disabled={waLoading}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                {waLoading ? "Atualizando..." : "Atualizar conexão"}
              </button>
              {waState === "open" && (
                <button
                  type="button"
                  onClick={() => void disconnectWhatsApp()}
                  disabled={waLoading}
                  className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Desconectar
                </button>
              )}
            </div>
          </div>
          {waState === "open" ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-sm font-semibold text-emerald-900">
              Seu WhatsApp está conectado e pronto para enviar mensagens automáticas.
            </div>
          ) : (
            <div className="mt-4 grid gap-5 rounded-xl border border-emerald-200 bg-white p-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-3">
                {waQrCode ? (
                  <img
                    src={
                      waQrCode.startsWith("data:") ? waQrCode : `data:image/png;base64,${waQrCode}`
                    }
                    alt="QR Code do WhatsApp"
                    className="size-48 rounded-lg"
                  />
                ) : (
                  <div className="grid size-48 place-items-center p-4 text-center text-xs text-slate-400">
                    {waLoading || waState === "loading"
                      ? "Carregando QR Code..."
                      : "Use Atualizar conexão para carregar o QR Code."}
                  </div>
                )}
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Aponte a câmera do WhatsApp
                </span>
              </div>
              <div className="space-y-2 text-xs leading-5 text-slate-600">
                <h3 className="text-sm font-bold text-slate-900">Como conectar</h3>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Abra o WhatsApp no celular do negócio.</li>
                  <li>Acesse Aparelhos conectados e escolha Conectar um aparelho.</li>
                  <li>Aponte a câmera para o QR Code. O status será atualizado automaticamente.</li>
                </ol>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#292b25]">Modelos de mensagens automáticas</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Configure e salve cada modelo do WhatsApp separadamente da página pública.
              </p>
            </div>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
              Assistente de texto ELLO
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs font-semibold text-slate-600">
              Tipo de mensagem
              <select
                value={templateKind}
                onChange={(event) => setTemplateKind(event.target.value as TemplateKind)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                {Object.entries(templateLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Tom da mensagem
              <select
                value={templateTone}
                onChange={(event) => setTemplateTone(event.target.value as TemplateTone)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                <option value="acolhedor">Acolhedor</option>
                <option value="profissional">Profissional</option>
                <option value="descontraido">Descontraído</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void generateTemplate()}
              disabled={templateBusy}
              className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {templateBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {templateBusy ? "Gerando..." : "Gerar sugestão"}
            </button>
          </div>

          <label className="mt-5 block text-xs font-semibold text-slate-600">
            Texto da mensagem
            <textarea
              value={currentText}
              onChange={(event) => updateTemplate(event.target.value)}
              rows={7}
              maxLength={1800}
              placeholder="Sem texto personalizado. O sistema usará a mensagem padrão."
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="mt-2 space-y-1 text-[11px] text-slate-500">
            <p>
              <b>Variáveis disponíveis:</b> {templateVariables[templateKind]}
            </p>
            <p>
              {currentText.length}/1800 caracteres. Deixe vazio para restaurar a mensagem padrão.
            </p>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Prévia da sugestão
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {currentText ||
                "O envio continuará usando a mensagem padrão até você personalizar este modelo."}
            </p>
          </div>
          {(feedback || error) && (
            <p
              role={error ? "alert" : "status"}
              className={`mt-3 text-xs font-semibold ${error ? "text-red-700" : "text-emerald-800"}`}
            >
              {error || feedback}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <span className="text-xs font-semibold text-slate-500">
              {saved ? "Modelos do WhatsApp salvos" : "Alterações ainda não salvas"}
            </span>
            <button
              type="button"
              onClick={() => void saveTemplates()}
              disabled={saving}
              className={primaryButtonClass}
            >
              <Save size={15} /> {saving ? "Salvando..." : "Salvar modelos do WhatsApp"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
