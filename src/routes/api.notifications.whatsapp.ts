import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  sendWhatsAppMessage,
  formatOrderWhatsAppMessage,
  formatAppointmentWhatsAppMessage,
  formatOwnerNewOrderWhatsAppMessage,
  type OrderNotificationPayload,
  type AppointmentNotificationPayload,
} from "@/lib/whatsapp.server";
import {
  authenticateRequestUser,
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  getSecurityAdminSupabase,
} from "@/lib/security.server";

const notifyOrderSchema = z.object({
  type: z.literal("order"),
  order: z.object({
    orderNumber: z.union([z.number(), z.string()]),
    customerName: z.string().min(1).max(120),
    customerPhone: z.string().min(8).max(30),
    businessName: z.string().min(1).max(120),
    businessSlug: z.string().min(1).max(120),
    trackingToken: z.string().uuid().optional(),
    status: z.enum([
      "received",
      "accepted",
      "preparing",
      "ready",
      "out_for_delivery",
      "completed",
      "cancelled",
    ]),
    fulfillment: z.enum(["delivery", "pickup", "dine_in"]),
    itemsSummary: z.string().max(1000).optional(),
    total: z.number().optional(),
    deliveryAddress: z.string().max(500).optional(),
  }),
  target: z.enum(["customer", "owner"]).default("customer"),
  ownerPhone: z.string().max(30).optional(),
});

const notifyAppointmentSchema = z.object({
  type: z.literal("appointment"),
  appointment: z.object({
    customerName: z.string().min(1).max(120),
    customerPhone: z.string().min(8).max(30),
    businessName: z.string().min(1).max(120),
    serviceName: z.string().min(1).max(120),
    professionalName: z.string().max(120).optional(),
    scheduledAt: z.string().max(100),
    address: z.string().max(500).optional(),
    appointmentId: z.string().uuid().optional(),
  }),
});

const notifyDirectSchema = z.object({
  type: z.literal("direct"),
  phone: z.string().min(8).max(30),
  text: z.string().min(1).max(2000),
});

const requestSchema = z.discriminatedUnion("type", [
  notifyOrderSchema,
  notifyAppointmentSchema,
  notifyDirectSchema,
]);

export const Route = createFileRoute("/api/notifications/whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Defesa Anti-Spam / Anti-Flood (Rate Limiting de 30 requisições/min por IP)
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`wa-notify:${ip}`, 30, 60_000);
        if (!rateLimit.allowed) {
          return createRateLimitResponse(rateLimit.resetSeconds);
        }

        try {
          const body = await request.json();
          const parsed = requestSchema.safeParse(body);

          if (!parsed.success) {
            return Response.json(
              { error: "Payload inválido para notificação WhatsApp.", details: parsed.error.flatten() },
              { status: 400 },
            );
          }

          const data = parsed.data;
          const auth = await authenticateRequestUser(request);
          const supabase = getSecurityAdminSupabase();

          // 2. Proteção de Envio Direto (Spam Relay Prevention)
          // Se for "direct", exige OBRIGATORIAMENTE usuário autenticado no sistema
          if (data.type === "direct") {
            if (!auth.user) {
              return Response.json(
                { error: "Acesso negado. Disparos diretos exigem autenticação de lojista." },
                { status: 401 },
              );
            }
            const result = await sendWhatsAppMessage({ phone: data.phone, text: data.text });
            return Response.json(result);
          }

          // 3. Validação de Pedido (Order Spoofing Prevention)
          if (data.type === "order") {
            const orderPayload = data.order as OrderNotificationPayload;

            // Se não for um usuário autenticado da loja, deve comprovar que o pedido é legítimo e existente
            if (!auth.user) {
              if (!orderPayload.trackingToken) {
                return Response.json(
                  { error: "Não autorizado. Token de rastreamento do pedido é obrigatório para notificações públicas." },
                  { status: 403 },
                );
              }

              // Busca pedido no banco de dados para validar integridade
              const { data: dbOrder, error: dbError } = await supabase
                .from("localhub_orders")
                .select("id, customer_phone, business_id, public_tracking_token")
                .eq("public_tracking_token", orderPayload.trackingToken)
                .maybeSingle();

              if (dbError || !dbOrder) {
                return Response.json(
                  { error: "Pedido não localizado para envio de notificação." },
                  { status: 404 },
                );
              }

              // Valida se o destinatário bate estritamente com os dados reais do pedido
              const cleanDbPhone = dbOrder.customer_phone.replace(/\D/g, "");
              const cleanPayloadPhone = orderPayload.customerPhone.replace(/\D/g, "");

              if (data.target === "customer" && cleanDbPhone !== cleanPayloadPhone) {
                return Response.json(
                  { error: "Número de telefone divergente do cadastro do pedido." },
                  { status: 403 },
                );
              }

              if (data.target === "owner") {
                const { data: business } = await supabase
                  .from("localhub_businesses")
                  .select("phone")
                  .eq("id", dbOrder.business_id)
                  .maybeSingle();

                const expectedOwnerPhone = (business?.phone || "").replace(/\D/g, "");
                const givenOwnerPhone = (data.ownerPhone || "").replace(/\D/g, "");

                if (expectedOwnerPhone && givenOwnerPhone && expectedOwnerPhone !== givenOwnerPhone) {
                  return Response.json(
                    { error: "Telefone do estabelecimento divergente do cadastro." },
                    { status: 403 },
                  );
                }
              }
            }

            if (data.target === "owner" && data.ownerPhone) {
              const text = formatOwnerNewOrderWhatsAppMessage(orderPayload);
              const result = await sendWhatsAppMessage({ phone: data.ownerPhone, text });
              return Response.json(result);
            }

            const text = formatOrderWhatsAppMessage(orderPayload);
            const result = await sendWhatsAppMessage({ phone: orderPayload.customerPhone, text });
            return Response.json(result);
          }

          // 4. Validação de Agendamento
          if (data.type === "appointment") {
            const aptPayload = data.appointment as AppointmentNotificationPayload;

            // Se for público, valida agendamento real ou autenticação
            if (!auth.user && (data.appointment as any).appointmentId) {
              const { data: dbBooking } = await supabase
                .from("localhub_bookings")
                .select("id, phone")
                .eq("id", (data.appointment as any).appointmentId)
                .maybeSingle();

              if (!dbBooking) {
                return Response.json({ error: "Agendamento não encontrado." }, { status: 404 });
              }
            }

            const text = formatAppointmentWhatsAppMessage(aptPayload);
            const result = await sendWhatsAppMessage({ phone: aptPayload.customerPhone, text });
            return Response.json(result);
          }

          return Response.json({ error: "Tipo de notificação não suportado." }, { status: 400 });
        } catch (err) {
          console.error("[SEGURANÇA] Falha ao processar notificação WhatsApp:", err);
          return Response.json(
            { error: "Falha ao processar requisição de notificação." },
            { status: 500 },
          );
        }
      },
    },
  },
});
