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
import { normalizePhoneE164 } from "@/lib/coupons";
import {
  renderAppointmentTemplate,
  renderOrderCustomerTemplate,
  renderOrderOwnerTemplate,
} from "@/lib/whatsapp-templates";

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

function noStore(response: Response): Response {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function noStoreJson(body: unknown, init?: ResponseInit): Response {
  return noStore(Response.json(body, init));
}

export const Route = createFileRoute("/api/notifications/whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Defesa Anti-Spam / Anti-Flood (Rate Limiting de 30 requisições/min por IP)
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`wa-notify:${ip}`, 30, 60_000);
        if (!rateLimit.allowed) {
          return noStore(createRateLimitResponse(rateLimit.resetSeconds));
        }

        try {
          const body = await request.json();
          const parsed = requestSchema.safeParse(body);

          if (!parsed.success) {
            return noStoreJson(
              {
                error: "Payload inválido para notificação WhatsApp.",
                details: parsed.error.flatten(),
              },
              { status: 400 },
            );
          }

          const data = parsed.data;
          const auth = await authenticateRequestUser(request);
          let supabase: ReturnType<typeof getSecurityAdminSupabase> | null = null;
          if (auth.user) {
            try {
              supabase = getSecurityAdminSupabase();
            } catch {
              return noStoreJson({ error: "Integração temporariamente indisponível." }, { status: 503 });
            }
          }

          // 2. Proteção de Envio Direto (Spam Relay Prevention)
          // Se for "direct", exige OBRIGATORIAMENTE usuário autenticado no sistema
          if (data.type === "direct") {
            if (!auth.user) {
              return noStoreJson(
                { error: "Acesso negado. Disparos diretos exigem autenticação de lojista." },
                { status: 401 },
              );
            }
            const { data: businesses } = await supabase!
              .from("localhub_businesses")
              .select("id")
              .eq("owner_id", auth.user.id);
            if (!businesses?.length) {
              return noStoreJson({ error: "Negócio não encontrado para esta conta." }, { status: 403 });
            }
            const result = await sendWhatsAppMessage({ phone: data.phone, text: data.text });
            return noStoreJson(result);
          }

          // 3. Validação de Pedido (Order Spoofing Prevention)
          if (data.type === "order") {
            const orderPayload = data.order as OrderNotificationPayload;

            // Se não for um usuário autenticado da loja, deve comprovar que o pedido é legítimo e existente
            if (!auth.user) {
              if (!orderPayload.trackingToken) {
                return noStoreJson(
                  {
                    error:
                      "Não autorizado. Token de rastreamento do pedido é obrigatório para notificações públicas.",
                  },
                  { status: 403 },
                );
              }

              // Busca pedido no banco de dados para validar integridade
              const { data: dbOrder, error: dbError } = await supabase!
                .from("localhub_orders")
                .select("id, customer_phone, business_id, public_tracking_token")
                .eq("public_tracking_token", orderPayload.trackingToken)
                .maybeSingle();

              if (dbError || !dbOrder) {
                return noStoreJson(
                  { error: "Pedido não localizado para envio de notificação." },
                  { status: 404 },
                );
              }

              // Valida se o destinatário bate estritamente com os dados reais do pedido (usando E.164)
              const normDbPhone = normalizePhoneE164(dbOrder.customer_phone);
              const normPayloadPhone = normalizePhoneE164(orderPayload.customerPhone);

              if (data.target === "customer" && normDbPhone !== normPayloadPhone) {
                return noStoreJson(
                  { error: "Número de telefone divergente do cadastro do pedido." },
                  { status: 403 },
                );
              }

              if (data.target === "owner") {
                const { data: business } = await supabase!
                  .from("localhub_businesses")
                  .select("phone")
                  .eq("id", dbOrder.business_id)
                  .maybeSingle();

                const expectedOwnerNorm = normalizePhoneE164(business?.phone || "");
                const givenOwnerNorm = normalizePhoneE164(data.ownerPhone || "");

                if (expectedOwnerNorm && givenOwnerNorm && expectedOwnerNorm !== givenOwnerNorm) {
                  return noStoreJson(
                    { error: "Telefone do estabelecimento divergente do cadastro." },
                    { status: 403 },
                  );
                }
              }
            }
            if (auth.user && orderPayload.trackingToken) {
              const { data: order } = await supabase!
                .from("localhub_orders")
                .select("business_id")
                .eq("public_tracking_token", orderPayload.trackingToken)
                .maybeSingle();
              const { data: business } = await supabase!
                .from("localhub_businesses")
                .select("owner_id")
                .eq("id", order?.business_id ?? "")
                .maybeSingle();
              if (business?.owner_id !== auth.user.id) {
                return noStoreJson({ error: "Pedido fora da sua conta." }, { status: 403 });
              }
            }

            if (data.target === "owner" && data.ownerPhone) {
              if (!auth.user && orderPayload.trackingToken) {
                const { data: order } = await supabase!
                  .from("localhub_orders")
                  .select("business_id")
                  .eq("public_tracking_token", orderPayload.trackingToken)
                  .maybeSingle();
                const { data: business } = await supabase!
                  .from("localhub_businesses")
                  .select("phone")
                  .eq("id", order?.business_id ?? "")
                  .maybeSingle();
                if (
                  !business?.phone ||
                  normalizePhoneE164(business.phone) !== normalizePhoneE164(data.ownerPhone)
                ) {
                  return noStoreJson({ error: "Envio ao estabelecimento não autorizado." }, { status: 403 });
                }
              } else if (!auth.user) {
                return noStoreJson({ error: "Envio ao estabelecimento não autorizado." }, { status: 403 });
              }
              let templates: { orderOwner?: string } | null = null;
              if (orderPayload.trackingToken) {
                const { data: order } = await supabase!
                  .from("localhub_orders")
                  .select("business_id")
                  .eq("public_tracking_token", orderPayload.trackingToken)
                  .maybeSingle();
                if (order?.business_id) {
                  const { data: business } = await supabase!
                    .from("localhub_businesses")
                    .select("whatsapp_templates")
                    .eq("id", order.business_id)
                    .maybeSingle();
                  templates = business?.whatsapp_templates ?? null;
                }
              }
              const text = templates?.orderOwner
                ? renderOrderOwnerTemplate(templates.orderOwner, orderPayload)
                : formatOwnerNewOrderWhatsAppMessage(orderPayload);
              const result = await sendWhatsAppMessage({ phone: data.ownerPhone, text });
              return noStoreJson(result);
            }

            let templates: { orderCustomer?: string } | null = null;
            if (orderPayload.trackingToken) {
              const { data: order } = await supabase!
                .from("localhub_orders")
                .select("business_id")
                .eq("public_tracking_token", orderPayload.trackingToken)
                .maybeSingle();
              if (order?.business_id) {
                const { data: business } = await supabase!
                  .from("localhub_businesses")
                  .select("whatsapp_templates")
                  .eq("id", order.business_id)
                  .maybeSingle();
                templates = business?.whatsapp_templates ?? null;
              }
            } else if (data.target === "owner" && !auth.user) {
              return noStoreJson({ error: "Envio ao estabelecimento não autorizado." }, { status: 403 });
            }
            const text = templates?.orderCustomer
              ? renderOrderCustomerTemplate(templates.orderCustomer, orderPayload)
              : formatOrderWhatsAppMessage(orderPayload);
            const result = await sendWhatsAppMessage({ phone: orderPayload.customerPhone, text });
            return noStoreJson(result);
          }

          // 4. Validação de Agendamento
          if (data.type === "appointment") {
            const aptPayload = data.appointment as AppointmentNotificationPayload;

            // Se for público, valida agendamento real ou autenticação
            if (!auth.user) {
              if (!aptPayload.appointmentId) {
                return noStoreJson({ error: "Agendamento não autorizado." }, { status: 403 });
              }
              const { data: dbBooking } = await supabase!
                .from("localhub_bookings")
                .select("id, phone, customer_name")
                .eq("id", aptPayload.appointmentId)
                .maybeSingle();

              if (
                !dbBooking ||
                normalizePhoneE164(dbBooking.phone) !== normalizePhoneE164(aptPayload.customerPhone) ||
                dbBooking.customer_name.trim().toLocaleLowerCase() !==
                  aptPayload.customerName.trim().toLocaleLowerCase()
              ) {
                return noStoreJson({ error: "Agendamento não encontrado." }, { status: 404 });
              }
            }
            if (auth.user && aptPayload.appointmentId) {
              const { data: booking } = await supabase!
                .from("localhub_bookings")
                .select("business_id")
                .eq("id", aptPayload.appointmentId)
                .maybeSingle();
              const { data: business } = await supabase!
                .from("localhub_businesses")
                .select("owner_id")
                .eq("id", booking?.business_id ?? "")
                .maybeSingle();
              if (!booking || business?.owner_id !== auth.user.id) {
                return noStoreJson({ error: "Agendamento fora da sua conta." }, { status: 403 });
              }
            }

            let template: string | undefined;
            if ((data.appointment as any).appointmentId) {
              const { data: booking } = await supabase!
                .from("localhub_bookings")
                .select("business_id")
                .eq("id", (data.appointment as any).appointmentId)
                .maybeSingle();
              if (booking?.business_id) {
                const { data: business } = await supabase!
                  .from("localhub_businesses")
                  .select("whatsapp_templates")
                  .eq("id", booking.business_id)
                  .maybeSingle();
                template = business?.whatsapp_templates?.appointment;
              }
            }
            const text = template
              ? renderAppointmentTemplate(template, aptPayload)
              : formatAppointmentWhatsAppMessage(aptPayload);
            const result = await sendWhatsAppMessage({ phone: aptPayload.customerPhone, text });
            return noStoreJson(result);
          }

          return noStoreJson({ error: "Tipo de notificação não suportado." }, { status: 400 });
        } catch (err) {
          console.error("[SEGURANÇA] Falha ao processar notificação WhatsApp:", err);
          return noStoreJson(
            { error: "Falha ao processar requisição de notificação." },
            { status: 500 },
          );
        }
      },
    },
  },
});
