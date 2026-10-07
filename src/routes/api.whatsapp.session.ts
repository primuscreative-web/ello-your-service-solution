import { createFileRoute } from "@tanstack/react-router";
import { getWhatsAppServerConfig } from "@/lib/config.server";
import {
  authenticateRequestUser,
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
} from "@/lib/security.server";

export const Route = createFileRoute("/api/whatsapp/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // 1. Rate Limiting por IP (Máx 20 checagens de status por minuto)
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`wa-session-get:${ip}`, 20, 60_000);
        if (!rateLimit.allowed) {
          return createRateLimitResponse(rateLimit.resetSeconds);
        }

        // 2. Proteção de Acesso: Apenas usuários autenticados da plataforma
        const auth = await authenticateRequestUser(request);
        if (!auth.user) {
          return Response.json(
            { error: "Acesso não autorizado. Autenticação de lojista necessária." },
            { status: 401 },
          );
        }

        try {
          const config = getWhatsAppServerConfig();
          if (config.provider !== "evolution" || !config.apiUrl || !config.apiToken) {
            return Response.json({
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
            return Response.json({
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

          return Response.json({
            configured: true,
            provider: "evolution",
            instance,
            state,
            qrcode,
          });
        } catch (error) {
          return Response.json(
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
          return createRateLimitResponse(rateLimit.resetSeconds);
        }

        // 2. Autenticação obrigatória
        const auth = await authenticateRequestUser(request);
        if (!auth.user) {
          return Response.json(
            { error: "Acesso não autorizado. Apenas lojistas autenticados podem gerenciar sessões." },
            { status: 401 },
          );
        }

        try {
          const config = getWhatsAppServerConfig();
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
              return Response.json(
                { success: false, error: `Falha ao desconectar instância: ${errTxt}` },
                { status: 502 },
              );
            }

            return Response.json({ success: true, message: "Instância desconectada com sucesso." });
          }

          // Restart / Reconnect
          await fetch(`${baseUrl}/instance/restart/${instance}`, {
            method: "POST",
            headers: { apikey: config.apiToken },
            signal: AbortSignal.timeout(10000),
          });

          return Response.json({ success: true, message: "Instância reiniciada." });
        } catch (error) {
          return Response.json(
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
