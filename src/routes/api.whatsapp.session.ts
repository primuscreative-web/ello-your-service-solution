import { createFileRoute } from "@tanstack/react-router";
import { getWhatsAppServerConfig } from "@/lib/config.server";
import {
  authenticateRequestUser,
  getSecurityAdminSupabase,
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/security.server";

function noStore(response: Response): Response {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function noStoreJson(body: unknown, init?: ResponseInit): Response {
  return noStore(Response.json(body, init));
}

export const Route = createFileRoute("/api/whatsapp/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // 1. Rate Limiting por IP (Máx 20 checagens de status por minuto)
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`wa-session-get:${ip}`, 20, 60_000);
        if (!rateLimit.allowed) {
          return noStore(createRateLimitResponse(rateLimit.resetSeconds));
        }

        const auth = await authenticateRequestUser(request);
        if (!auth.user) {
          return noStoreJson({ error: "Acesso não autorizado." }, { status: 401 });
        }
        let supabase;
        try {
          supabase = getSecurityAdminSupabase();
        } catch {
          return noStoreJson({ error: "Integração temporariamente indisponível." }, { status: 503 });
        }
        const { data: business } = await supabase
          .from("localhub_businesses")
          .select("id")
          .eq("owner_id", auth.user.id)
          .maybeSingle();
        if (!business) {
          return noStoreJson({ error: "Negócio não encontrado para esta conta." }, { status: 403 });
        }

        // 2. Leitura de estado e QR Code da instância
        try {
          const config = getWhatsAppServerConfig();
          if (config.provider !== "evolution" || !config.apiUrl || !config.apiToken) {
            return noStoreJson({
              configured: false,
              provider: config.provider,
              state: "not_configured",
              qrcode: null,
            });
          }

          const baseUrl = config.apiUrl.replace(/\/$/, "");
          const instance = config.instanceId || "ello-principal";

          // 3. Checa estado da conexão na Evolution API
          const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
            headers: { apikey: config.apiToken },
            signal: AbortSignal.timeout(8000),
          });

          let state = "connecting";
          if (stateRes.ok) {
            const stateData = await stateRes.json();
            state = stateData?.instance?.state || "connecting";
          }

          // Se já conectado (open), não expõe QR code desnecessariamente
          if (state === "open") {
            return noStoreJson({
              configured: true,
              provider: "evolution",
              instance,
              state: "open",
              qrcode: null,
            });
          }

          // Se desconectado ou conectando, busca o QR Code
          const qrRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
            headers: { apikey: config.apiToken },
            signal: AbortSignal.timeout(10000),
          });

          let qrcode: string | null = null;
          if (qrRes.ok) {
            const qrData = await qrRes.json();
            qrcode = qrData?.base64 || qrData?.qrcode?.base64 || null;
          }

          // Se houver QR code pronto para escaneamento, marca o estado como aguardando leitura
          if (state !== "open" && qrcode) {
            state = "connecting";
          }

          return noStoreJson({
            configured: true,
            provider: "evolution",
            instance,
            state,
            qrcode,
          });
        } catch (error) {
          return noStoreJson(
            {
              configured: false,
              state: "error",
              qrcode: null,
              error: error instanceof Error ? error.message : "Falha ao consultar sessão WhatsApp.",
            },
            { status: 500 },
          );
        }
      },

      POST: async ({ request }) => {
        // 1. Rate Limiting estrito para ações de comando (Máx 5 por minuto)
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`wa-session-cmd:${ip}`, 5, 60_000);
        if (!rateLimit.allowed) {
          return noStore(createRateLimitResponse(rateLimit.resetSeconds));
        }

        // 2. Autenticação obrigatória
        const auth = await authenticateRequestUser(request);
        if (!auth.user) {
          return noStoreJson(
            { error: "Acesso não autorizado. Apenas lojistas autenticados podem gerenciar sessões." },
            { status: 401 },
          );
        }

        let supabase;
        try {
          supabase = getSecurityAdminSupabase();
        } catch {
          return noStoreJson({ error: "Integração temporariamente indisponível." }, { status: 503 });
        }
        const { data: business } = await supabase
          .from("localhub_businesses")
          .select("id")
          .eq("owner_id", auth.user.id)
          .maybeSingle();
        if (!business) {
          return noStoreJson({ error: "Negócio não encontrado para esta conta." }, { status: 403 });
        }

        try {
          const config = getWhatsAppServerConfig();
          if (config.provider !== "evolution" || !config.apiUrl || !config.apiToken) {
            return noStoreJson({ error: "Integração WhatsApp não configurada." }, { status: 503 });
          }
          const baseUrl = config.apiUrl.replace(/\/$/, "");
          const instance = config.instanceId || "ello-principal";
          const body = (await request.json().catch(() => ({}))) as { action?: string };

          if (body.action === "disconnect") {
            console.info(`[SEGURANÇA] Desconexão de WhatsApp solicitada pelo usuário ${auth.user.id}`);
            const logoutRes = await fetch(`${baseUrl}/instance/logout/${instance}`, {
              method: "DELETE",
              headers: { apikey: config.apiToken },
              signal: AbortSignal.timeout(10000),
            });

            if (!logoutRes.ok) {
              const errTxt = await logoutRes.text().catch(() => "");
              return noStoreJson(
                { success: false, error: `Falha ao desconectar instância: ${errTxt}` },
                { status: 502 },
              );
            }

            return noStoreJson({ success: true, message: "Instância desconectada com sucesso." });
          }

          // Restart / Reconnect
          await fetch(`${baseUrl}/instance/restart/${instance}`, {
            method: "POST",
            headers: { apikey: config.apiToken },
            signal: AbortSignal.timeout(10000),
          });

          return noStoreJson({ success: true, message: "Instância reiniciada." });
        } catch (error) {
          return noStoreJson(
            {
              success: false,
              error: error instanceof Error ? error.message : "Erro interno ao processar comando.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
