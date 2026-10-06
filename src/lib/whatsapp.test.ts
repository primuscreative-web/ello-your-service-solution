import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOrderWhatsAppMessage,
  formatAppointmentWhatsAppMessage,
  formatOwnerNewOrderWhatsAppMessage,
  buildDirectWhatsAppLink,
  sendWhatsAppMessage,
} from "./whatsapp.server.ts";

test("gera link direto do WhatsApp (wa.me) formatado corretamente", () => {
  const link = buildDirectWhatsAppLink("(11) 98765-4321", "Olá!");
  assert.equal(link, "https://wa.me/5511987654321?text=Ol%C3%A1!");
});

test("formata mensagem de pedido recebido com link de tracking e itens", () => {
  const message = formatOrderWhatsAppMessage({
    orderNumber: 42,
    customerName: "Maria Silva",
    customerPhone: "11988887777",
    businessName: "Pizzaria Bella",
    businessSlug: "pizzaria-bella",
    trackingToken: "token-abc-123",
    status: "received",
    fulfillment: "delivery",
    itemsSummary: "1x Pizza Calabresa, 1x Coca-Cola 2L",
    total: 75.5,
  });

  assert.match(message, /Maria Silva/);
  assert.match(message, /Pedido #42/);
  assert.match(message, /Pizzaria Bella/);
  assert.match(message, /Pizza Calabresa/);
  assert.match(message, /R\$ 75,50/);
  assert.match(message, /https:\/\/ello\.app\.br\/pedido\/token-abc-123/);
});

test("formata mensagem de pedido que saiu para entrega com endereço", () => {
  const message = formatOrderWhatsAppMessage({
    orderNumber: 105,
    customerName: "João Santos",
    customerPhone: "11977776666",
    businessName: "Burger House",
    businessSlug: "burger-house",
    trackingToken: "token-xyz-789",
    status: "out_for_delivery",
    fulfillment: "delivery",
    deliveryAddress: "Rua das Flores, 123 - Apto 42",
  });

  assert.match(message, /Saiu para entrega!/);
  assert.match(message, /Rua das Flores, 123 - Apto 42/);
  assert.match(message, /https:\/\/ello\.app\.br\/pedido\/token-xyz-789/);
});

test("formata mensagem de alerta para o lojista sobre novo pedido", () => {
  const message = formatOwnerNewOrderWhatsAppMessage({
    orderNumber: 201,
    customerName: "Carlos Souza",
    customerPhone: "(11) 99999-8888",
    businessName: "Doceria Mel",
    businessSlug: "doceria-mel",
    status: "received",
    fulfillment: "delivery",
    itemsSummary: "2x Bolo de Pote de Chocolate",
    total: 30.0,
  });

  assert.match(message, /NOVO PEDIDO #201 RECEBIDO!/);
  assert.match(message, /Carlos Souza/);
  assert.match(message, /2x Bolo de Pote/);
  assert.match(message, /https:\/\/ello\.app\.br\/studio\/pedidos/);
});

test("formata lembrete de agendamento de serviço", () => {
  const message = formatAppointmentWhatsAppMessage({
    customerName: "Fernanda Lima",
    customerPhone: "11988881111",
    businessName: "Espaço Glamour",
    serviceName: "Corte e Escova",
    professionalName: "Juliana Cabeleireira",
    scheduledAt: "15/10/2026 às 14:30",
    address: "Av. Paulista, 1000",
  });

  assert.match(message, /Fernanda Lima/);
  assert.match(message, /Corte e Escova/);
  assert.match(message, /Juliana Cabeleireira/);
  assert.match(message, /15\/10\/2026 às 14:30/);
});

test("rejeita envio se número for inválido", async () => {
  const result = await sendWhatsAppMessage({ phone: "123", text: "Teste" });
  assert.equal(result.success, false);
  assert.match(result.error ?? "", /inválido/i);
});

test("opera em modo simulado/contingência quando provedor de API não configurado", async () => {
  const result = await sendWhatsAppMessage({ phone: "11987654321", text: "Mensagem teste" });
  assert.equal(result.success, true);
  assert.equal(result.simulated, true);
  assert.match(result.directLink, /wa\.me\/5511987654321/);
});
