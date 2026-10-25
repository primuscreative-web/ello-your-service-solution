import type { AppointmentNotificationPayload, OrderNotificationPayload } from "./whatsapp.server";

export type WhatsAppTemplates = {
  orderCustomer?: string;
  orderOwner?: string;
  appointment?: string;
};

export const defaultWhatsAppTemplates: Required<WhatsAppTemplates> = {
  orderCustomer:
    "Olá, *{{cliente}}*! 👋\n\nRecebemos seu *Pedido #{{pedido}}* no *{{negocio}}*! 🎉\n{{itens}}\n{{total}}\nAcompanhe o status em tempo real:\n{{link}}",
  orderOwner:
    "🔔 *NOVO PEDIDO #{{pedido}} RECEBIDO!*\n\n👤 Cliente: {{cliente}}\n📞 Telefone: {{telefone}}\n📦 Tipo: {{tipo}}\n📋 Itens: {{itens}}\n💰 Total: {{total}}\n\nAcesse o painel: https://ello.app.br/studio/pedidos",
  appointment:
    "Olá, *{{cliente}}*! 👋\n\nLembrete do seu agendamento no *{{negocio}}*:\n✂️ Serviço: {{servico}}\n👤 Profissional: {{profissional}}\n📅 Horário: {{horario}}\n📍 Local: {{endereco}}\n\nCaso precise remarcar, responda a esta mensagem. Te esperamos! ✨",
};

const formatter = (amount: number | undefined) =>
  amount ? `R$ ${amount.toFixed(2).replace(".", ",")}` : "";

export function renderWhatsAppTemplate(
  template: string | undefined,
  variables: Record<string, string>,
  fallback: () => string,
) {
  if (!template?.trim()) return fallback();
  return template.replace(/{{\s*([a-z_]+)\s*}}/gi, (_, key: string) => variables[key] ?? "").trim();
}

export function renderOrderCustomerTemplate(
  template: string | undefined,
  order: OrderNotificationPayload,
) {
  const trackingUrl = order.trackingToken
    ? `https://ello.app.br/pedido/${order.trackingToken}`
    : `https://ello.app.br/loja/${order.businessSlug}`;
  const fulfillment = { delivery: "Delivery", pickup: "Retirada", dine_in: "Consumo no local" }[
    order.fulfillment
  ];
  const statusText: Record<OrderNotificationPayload["status"], string> = {
    received: `Recebemos seu Pedido #${order.orderNumber} no ${order.businessName}!`,
    accepted: `Seu Pedido #${order.orderNumber} foi aceito pelo estabelecimento.`,
    preparing: `Seu Pedido #${order.orderNumber} está sendo preparado.`,
    ready: `Seu Pedido #${order.orderNumber} está pronto.`,
    out_for_delivery: `Seu Pedido #${order.orderNumber} saiu para entrega.`,
    completed: `Seu Pedido #${order.orderNumber} foi concluído.`,
    cancelled: `Seu Pedido #${order.orderNumber} foi cancelado.`,
  };
  return renderWhatsAppTemplate(
    template,
    {
      cliente: order.customerName,
      pedido: String(order.orderNumber),
      negocio: order.businessName,
      status: statusText[order.status],
      itens: order.itemsSummary ?? "",
      total: formatter(order.total),
      tipo: fulfillment,
      endereco: order.deliveryAddress ?? "",
      link: trackingUrl,
      telefone: order.customerPhone,
    },
    () => "",
  );
}

export function renderOrderOwnerTemplate(
  template: string | undefined,
  order: OrderNotificationPayload,
) {
  const fulfillment = { delivery: "Delivery", pickup: "Retirada", dine_in: "Consumo no local" }[
    order.fulfillment
  ];
  return renderWhatsAppTemplate(
    template,
    {
      cliente: order.customerName,
      pedido: String(order.orderNumber),
      negocio: order.businessName,
      status: order.status,
      itens: order.itemsSummary ?? "",
      total: formatter(order.total),
      tipo: fulfillment,
      endereco: order.deliveryAddress ?? "",
      link: `https://ello.app.br/studio/pedidos`,
      telefone: order.customerPhone,
    },
    () => "",
  );
}

export function renderAppointmentTemplate(
  template: string | undefined,
  appointment: AppointmentNotificationPayload,
) {
  return renderWhatsAppTemplate(
    template,
    {
      cliente: appointment.customerName,
      negocio: appointment.businessName,
      servico: appointment.serviceName,
      profissional: appointment.professionalName ?? "",
      horario: appointment.scheduledAt,
      endereco: appointment.address ?? "",
    },
    () => "",
  );
}

export function generateWhatsAppTemplateSuggestion(input: {
  kind: "orderCustomer" | "orderOwner" | "appointment";
  businessName: string;
  category: string;
  tone: "acolhedor" | "profissional" | "descontraido";
}) {
  const intro =
    input.tone === "profissional"
      ? "Olá, {{cliente}}."
      : input.tone === "descontraido"
        ? "Oi, {{cliente}}! 😊"
        : "Olá, {{cliente}}! 👋";
  const category =
    input.category === "alimentacao"
      ? "pedido"
      : input.category === "beleza"
        ? "atendimento"
        : "agendamento";
  if (input.kind === "orderCustomer") {
    return `${intro}\n\n${input.businessName} confirma: {{status}}\n📋 {{itens}}\n💰 {{total}}\n🔎 Acompanhe: {{link}}`;
  }
  if (input.kind === "orderOwner") {
    return `🔔 Novo ${category} #{{pedido}} para ${input.businessName}\n\nCliente: {{cliente}} ({{telefone}})\nTipo: {{tipo}}\nItens: {{itens}}\nTotal: {{total}}\n\nAcesse: {{link}}`;
  }
  return `${intro}\n\nLembrete do seu horário em ${input.businessName}:\nServiço: {{servico}}\nProfissional: {{profissional}}\nData e hora: {{horario}}\nEndereço: {{endereco}}\n\nSe precisar de ajuda, responda por aqui.`;
}
