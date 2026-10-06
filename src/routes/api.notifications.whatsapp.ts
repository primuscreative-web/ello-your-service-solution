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

const notifyOrderSchema = z.object({
  type: z.literal("order"),
  order: z.object({
    orderNumber: z.union([z.number(), z.string()]),
    customerName: z.string(),
    customerPhone: z.string(),
    businessName: z.string(),
    businessSlug: z.string(),
    trackingToken: z.string().optional(),
    status: z.enum(["received", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"]),
    fulfillment: z.enum(["delivery", "pickup", "dine_in"]),
    itemsSummary: z.string().optional(),
    total: z.number().optional(),
    deliveryAddress: z.string().optional(),
  }),
  target: z.enum(["customer", "owner"]).default("customer"),
  ownerPhone: z.string().optional(),
});

const notifyAppointmentSchema = z.object({
  type: z.literal("appointment"),
  appointment: z.object({
    customerName: z.string(),
    customerPhone: z.string(),
    businessName: z.string(),
    serviceName: z.string(),
    professionalName: z.string().optional(),
    scheduledAt: z.string(),
    address: z.string().optional(),
  }),
});

const notifyDirectSchema = z.object({
  type: z.literal("direct"),
  phone: z.string(),
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

          if (data.type === "order") {
            const orderPayload = data.order as OrderNotificationPayload;
            if (data.target === "owner" && data.ownerPhone) {
              const text = formatOwnerNewOrderWhatsAppMessage(orderPayload);
              const result = await sendWhatsAppMessage({ phone: data.ownerPhone, text });
              return Response.json(result);
            }

            const text = formatOrderWhatsAppMessage(orderPayload);
            const result = await sendWhatsAppMessage({ phone: orderPayload.customerPhone, text });
            return Response.json(result);
          }

          if (data.type === "appointment") {
            const aptPayload = data.appointment as AppointmentNotificationPayload;
            const text = formatAppointmentWhatsAppMessage(aptPayload);
            const result = await sendWhatsAppMessage({ phone: aptPayload.customerPhone, text });
            return Response.json(result);
          }

          if (data.type === "direct") {
            const result = await sendWhatsAppMessage({ phone: data.phone, text: data.text });
            return Response.json(result);
          }

          return Response.json({ error: "Tipo de notificação não suportado." }, { status: 400 });
        } catch (err) {
          return Response.json(
            { error: "Erro interno no envio de notificação.", details: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});
