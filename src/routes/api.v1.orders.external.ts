import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getServerConfig } from "@/lib/config.server";

const orderSchema = z.object({
  businessSlug: z.string().min(1).max(100),
  externalReference: z.string().min(1).max(160),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
  }),
  fulfillment: z.enum(["delivery", "pickup"]),
  deliveryAddress: z.string().max(500).default(""),
  notes: z.string().max(500).default(""),
  paymentMethod: z.enum(["cash", "pix", "card"]),
  items: z
    .array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(30) }))
    .min(1)
    .max(50),
});

function unauthorized() {
  return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
}

export const Route = createFileRoute("/api/v1/orders/external")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getServerConfig();
        const token = config.foodOrderIngestionToken;
        const authorization = request.headers.get("authorization") ?? "";
        const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        if (!token || !provided) return unauthorized();
        const expectedBuffer = Buffer.from(token);
        const providedBuffer = Buffer.from(provided);
        if (
          expectedBuffer.length !== providedBuffer.length ||
          !timingSafeEqual(expectedBuffer, providedBuffer)
        )
          return unauthorized();
        if (!config.supabaseUrl || !config.supabaseServiceRoleKey)
          return Response.json(
            { error: "Integração de pedidos não configurada." },
            { status: 503 },
          );
        let payload: unknown;
        try {
          const rawBody = await request.text();
          if (new TextEncoder().encode(rawBody).byteLength > 65_536)
            return Response.json({ error: "Pedido excede o tamanho permitido." }, { status: 413 });
          payload = JSON.parse(rawBody);
        } catch {
          return Response.json({ error: "JSON inválido." }, { status: 400 });
        }
        const parsed = orderSchema.safeParse(payload);
        if (!parsed.success)
          return Response.json(
            { error: "Pedido inválido.", details: parsed.error.flatten() },
            { status: 400 },
          );
        const order = parsed.data;
        if (order.fulfillment === "delivery" && order.deliveryAddress.trim().length < 8)
          return Response.json({ error: "Informe o endereço de entrega." }, { status: 400 });
        const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data, error } = await supabase.rpc("localhub_ingest_external_food_order", {
          p_slug: order.businessSlug,
          p_external_reference: order.externalReference,
          p_customer_name: order.customer.name,
          p_customer_phone: order.customer.phoneE164,
          p_fulfillment: order.fulfillment,
          p_delivery_address: order.deliveryAddress,
          p_notes: order.notes,
          p_payment_method: order.paymentMethod,
          p_items: order.items,
        });
        if (error) {
          console.error("External food order rejected", error.code);
          return Response.json({ error: "Não foi possível registrar o pedido." }, { status: 422 });
        }
        const result = Array.isArray(data) ? data[0] : data;
        return Response.json(
          {
            id: result.id,
            number: Number(result.order_number),
            total: Number(result.total),
            duplicate: Boolean(result.was_duplicate),
          },
          { status: result.was_duplicate ? 200 : 201 },
        );
      },
    },
  },
});
