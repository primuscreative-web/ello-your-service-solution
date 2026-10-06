import { getWhatsAppServerConfig } from "./config.server.ts";
import { normalizePhoneE164, isValidE164Phone } from "./coupons.ts";

export type OrderNotificationPayload = {
  orderNumber: number | string;
  customerName: string;
  customerPhone: string;
  businessName: string;
  businessSlug: string;
  trackingToken?: string;
  status: "received" | "accepted" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  fulfillment: "delivery" | "pickup" | "dine_in";
  itemsSummary?: string;
  total?: number;
  deliveryAddress?: string;
};

export type AppointmentNotificationPayload = {
  customerName: string;
  customerPhone: string;
  businessName: string;
  serviceName: string;
  professionalName?: string;
  scheduledAt: string; // ISO ou formatado
  address?: string;
};

export type SendWhatsAppResult = {
  success: boolean;
  provider: string;
  messageId?: string;
  directLink: string;
  error?: string;
  simulated?: boolean;
};

export function buildDirectWhatsAppLink(phone: string, text: string): string {
  const normalized = normalizePhoneE164(phone).replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function formatOrderWhatsAppMessage(order: OrderNotificationPayload): string {
  const trackingUrl = order.trackingToken
    ? `https://ello.app.br/pedido/${order.trackingToken}`
    : `https://ello.app.br/loja/${order.businessSlug}`;

  const greeting = `Olá, *${order.customerName.trim()}*! 👋`;

  switch (order.status) {
    case "received":
      return (
        `${greeting}\n\n` +
        `Recebemos seu *Pedido #${order.orderNumber}* no *${order.businessName}*! 🎉\n` +
        `Logo o estabelecimento começará o preparo.\n\n` +
        (order.itemsSummary ? `📋 *Itens:* ${order.itemsSummary}\n` : "") +
        (order.total ? `💰 *Total:* R$ ${order.total.toFixed(2).replace(".", ",")}\n\n` : "\n") +
        `📱 Acompanhe o status em tempo real:\n${trackingUrl}`
      );

    case "accepted":
    case "preparing":
      return (
        `${greeting}\n\n` +
        `👨‍🍳 Seu *Pedido #${order.orderNumber}* já está sendo *preparado com todo carinho* no *${order.businessName}*!\n\n` +
        `📱 Acompanhe o progresso:\n${trackingUrl}`
      );

    case "out_for_delivery":
      return (
        `${greeting}\n\n` +
        `🛵💨 *Saiu para entrega!* Seu *Pedido #${order.orderNumber}* está a caminho do seu endereço.\n` +
        (order.deliveryAddress ? `📍 *Destino:* ${order.deliveryAddress}\n\n` : "\n") +
        `📱 Acompanhe o motoboy:\n${trackingUrl}`
      );

    case "ready":
      return (
        `${greeting}\n\n` +
        `🛍️✨ *Seu Pedido #${order.orderNumber} está pronto!* Pode retirar no balcão do *${order.businessName}*.\n\n` +
        `📱 Veja as instruções e comprovante:\n${trackingUrl}`
      );

    case "completed":
      return (
        `${greeting}\n\n` +
        `❤️ Seu *Pedido #${order.orderNumber}* no *${order.businessName}* foi concluído com sucesso!\n\n` +
        `Muito obrigado pela preferência e bom apetite!`
      );

    case "cancelled":
      return (
        `${greeting}\n\n` +
        `Avisamos que o *Pedido #${order.orderNumber}* no *${order.businessName}* foi cancelado.\n` +
        `Se tiver qualquer dúvida, entre em contato com a nossa equipe.`
      );

    default:
      return (
        `${greeting}\n\n` +
        `Atualização sobre o seu *Pedido #${order.orderNumber}* no *${order.businessName}*.\n` +
        `📱 Acompanhe em tempo real:\n${trackingUrl}`
      );
  }
}

export function formatOwnerNewOrderWhatsAppMessage(order: OrderNotificationPayload): string {
  const fulfillmentLabel =
    order.fulfillment === "delivery"
      ? "🛵 Delivery"
      : order.fulfillment === "pickup"
        ? "🛍️ Retirada no Balcão"
        : "🍽️ Consumo no Local";

  return (
    `🔔 *NOVO PEDIDO #${order.orderNumber} RECEBIDO!*\n\n` +
    `👤 *Cliente:* ${order.customerName}\n` +
    `📞 *Telefone:* ${order.customerPhone}\n` +
    `📦 *Tipo:* ${fulfillmentLabel}\n` +
    (order.itemsSummary ? `📋 *Itens:* ${order.itemsSummary}\n` : "") +
    (order.total ? `💰 *Total:* R$ ${order.total.toFixed(2).replace(".", ",")}\n\n` : "\n") +
    `⚡ Acesse o painel de pedidos:\nhttps://ello.app.br/studio/pedidos`
  );
}

export function formatAppointmentWhatsAppMessage(appointment: AppointmentNotificationPayload): string {
  return (
    `Olá, *${appointment.customerName.trim()}*! 👋\n\n` +
    `Passando para lembrar do seu agendamento no *${appointment.businessName}*:\n\n` +
    `✂️ *Serviço:* ${appointment.serviceName}\n` +
    (appointment.professionalName ? `👤 *Profissional:* ${appointment.professionalName}\n` : "") +
    `📅 *Horário:* ${appointment.scheduledAt}\n` +
    (appointment.address ? `📍 *Local:* ${appointment.address}\n\n` : "\n") +
    `Caso precise remarcar ou avisar sobre imprevistos, responda a esta mensagem. Te esperamos! ✨`
  );
}

export async function sendWhatsAppMessage({
  phone,
  text,
}: {
  phone: string;
  text: string;
}): Promise<SendWhatsAppResult> {
  const normalizedPhone = normalizePhoneE164(phone);
  const directLink = buildDirectWhatsAppLink(phone, text);

  if (!isValidE164Phone(normalizedPhone)) {
    return {
      success: false,
      provider: "none",
      directLink,
      error: `Número de telefone inválido: ${phone}`,
    };
  }

  const config = getWhatsAppServerConfig();
  const digitsOnly = normalizedPhone.replace(/\D/g, "");

  if (config.provider === "none" || !config.apiUrl) {
    // Modo simulação / fallback gracioso quando nenhuma API externa está configurada
    return {
      success: true,
      simulated: true,
      provider: "none",
      directLink,
    };
  }

  try {
    if (config.provider === "evolution") {
      // Evolution API: POST {apiUrl}/message/sendText/{instanceId}
      const response = await fetch(`${config.apiUrl.replace(/\/$/, "")}/message/sendText/${config.instanceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiToken,
        },
        body: JSON.stringify({
          number: digitsOnly,
          options: { delay: 1200, presence: "composing" },
          textMessage: { text },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, provider: "evolution", directLink, error: `Evolution API HTTP ${response.status}: ${errorText}` };
      }

      const json = await response.json();
      return { success: true, provider: "evolution", messageId: json?.key?.id, directLink };
    }

    if (config.provider === "zapi") {
      // Z-API: POST {apiUrl}/instances/{instanceId}/token/{apiToken}/send-text
      const url = `${config.apiUrl.replace(/\/$/, "")}/instances/${config.instanceId}/token/${config.apiToken}/send-text`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digitsOnly, message: text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, provider: "zapi", directLink, error: `Z-API HTTP ${response.status}: ${errorText}` };
      }

      const json = await response.json();
      return { success: true, provider: "zapi", messageId: json?.messageId, directLink };
    }

    if (config.provider === "webhook") {
      // Webhook Genérico HTTP POST
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {}),
        },
        body: JSON.stringify({ phone: normalizedPhone, digitsOnly, message: text }),
      });

      if (!response.ok) {
        return { success: false, provider: "webhook", directLink, error: `Webhook HTTP ${response.status}` };
      }

      return { success: true, provider: "webhook", directLink };
    }

    return { success: false, provider: config.provider, directLink, error: `Provedor ${config.provider} não implementado.` };
  } catch (err) {
    return {
      success: false,
      provider: config.provider,
      directLink,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
