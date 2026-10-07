import { createFileRoute } from "@tanstack/react-router";
import { getWhatsAppServerConfig } from "@/lib/config.server";

export const Route = createFileRoute("/api/whatsapp/session")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const config = getWhatsAppServerConfig();
          if (config.provider !== "evolution" || !config.apiUrl || !config.apiToken) {
            return new Response(
              JSON.stringify({
                configured: false,
                provider: config.provider,
                state: "not_configured",
                qrcode: null,
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          const baseUrl = config.apiUrl.replace(/\/$/, "");
          const instance = config.instanceId || "ello-principal";

          // 1. Checa estado da conexão
          const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
            headers: { apikey: config.apiToken },
          });

          let state = "connecting";
          if (stateRes.ok) {
            const stateData = await stateRes.json();
            state = stateData?.instance?.state || "connecting";
          }

          // 2. Se já conectado (open), não precisa de QR code
          if (state === "open") {
            return new Response(
              JSON.stringify({
                configured: true,
                provider: "evolution",
                instance,
                state: "open",
                qrcode: null,
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          // 3. Se desconectado ou conectando, busca o QR Code
          const qrRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
            headers: { apikey: config.apiToken },
          });

          let qrcode: string | null = null;
          if (qrRes.ok) {
            const qrData = await qrRes.json();
            qrcode = qrData?.base64 || qrData?.qrcode?.base64 || null;
          }

          return new Response(
            JSON.stringify({
              configured: true,
              provider: "evolution",
              instance,
              state,
              qrcode,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              configured: false,
              state: "error",
              qrcode: null,
              error: error instanceof Error ? error.message : "Erro desconhecido",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const config = getWhatsAppServerConfig();
          const baseUrl = config.apiUrl.replace(/\/$/, "");
          const instance = config.instanceId || "ello-principal";
          const body = (await request.json().catch(() => ({}))) as { action?: string };

          if (body.action === "disconnect") {
            await fetch(`${baseUrl}/instance/logout/${instance}`, {
              method: "DELETE",
              headers: { apikey: config.apiToken },
            });
            return new Response(JSON.stringify({ success: true, message: "Desconectado" }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Restart / Reconnect
          await fetch(`${baseUrl}/instance/restart/${instance}`, {
            method: "POST",
            headers: { apikey: config.apiToken },
          });

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
