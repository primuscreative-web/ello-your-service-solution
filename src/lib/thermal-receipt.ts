import { money } from "@/components/localhub/ui";
import type { FoodOrder, DeliveryDriver, Business } from "@/lib/localhub-context";

export type ReceiptType = "bag_tag" | "kitchen" | "bar" | "complete";
export type ReceiptWidth = "58mm" | "80mm";

interface PrintReceiptOptions {
  order: FoodOrder;
  business: Business | null;
  drivers: DeliveryDriver[];
  type?: ReceiptType;
  width?: ReceiptWidth;
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] || char,
  );
}

export function printThermalReceipt({
  order,
  business,
  drivers,
  type = "bag_tag",
  width = "80mm",
}: PrintReceiptOptions) {
  const receiptWindow = window.open("", "_blank", "popup,width=440,height=750");
  if (!receiptWindow) {
    alert("Por favor, permita pop-ups no navegador para imprimir a comanda.");
    return;
  }

  const driver = order.driverId
    ? drivers.find((d) => d.id === order.driverId)
    : null;

  const driverName = driver
    ? `${driver.name} ${driver.phone ? `(${driver.phone})` : ""}`
    : "Não atribuído (definir na saída)";

  const isPaidOnline =
    order.paymentStatus === "paid" || order.paymentMethod === "online_pix";

  let paymentInstructions = "";
  if (isPaidOnline) {
    paymentInstructions = `
      <div class="paid-box">
        <div class="paid-title">✓ JÁ PAGO ONLINE</div>
        <div class="paid-sub">NÃO COBRAR NADA DO CLIENTE</div>
      </div>
    `;
  } else {
    let methodText = "DINHEIRO";
    if (order.paymentMethod === "card") methodText = "CARTÃO (LEVAR MAQUININHA)";
    else if (order.paymentMethod === "pix") methodText = "PIX NA ENTREGA";

    paymentInstructions = `
      <div class="collect-box">
        <div class="collect-title">⚠️ COBRAR DO CLIENTE: ${money(order.total)}</div>
        <div class="collect-method">FORMA: ${methodText}</div>
      </div>
    `;
  }

  const formattedDate = new Date(order.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const trackingUrl = order.publicTrackingToken
    ? `https://ello.app.br/pedido/${order.publicTrackingToken}`
    : "";

  // Segmentação de itens para Cozinha vs Bar
  const isBeverage = (name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.includes("bebida") ||
      lower.includes("refrigerante") ||
      lower.includes("coca") ||
      lower.includes("suco") ||
      lower.includes("cerveja") ||
      lower.includes("chopp") ||
      lower.includes("água") ||
      lower.includes("agua") ||
      lower.includes("drink") ||
      lower.includes("vinho") ||
      lower.includes("lata") ||
      lower.includes("600ml") ||
      lower.includes("2l") ||
      lower.includes("long neck")
    );
  };

  const filteredItems = order.items.filter((item) => {
    if (type === "bar") return isBeverage(item.name);
    if (type === "kitchen") return !isBeverage(item.name);
    return true;
  });

  // Se filtrou tudo (ex: pediu pra imprimir bar mas não tem bebida), mostra todos com aviso
  const itemsToPrint = filteredItems.length > 0 ? filteredItems : order.items;

  const itemsHtml = itemsToPrint
    .map(
      (item) => `
      <div class="item-row">
        <div class="item-name">
          <span class="item-qty">${item.quantity}×</span> ${escapeHtml(item.name)}
        </div>
        ${type !== "kitchen" && type !== "bar" ? `<div class="item-price">${money(item.price * item.quantity)}</div>` : ""}
      </div>
    `,
    )
    .join("");

  const storeName = escapeHtml(business?.name ?? "ELLO Delivery");
  const storePhone = business?.phone ? escapeHtml(business.phone) : "";

  let headerHtml = "";
  if (type === "bag_tag") {
    headerHtml = `
      <div class="staple-zone">
        <span class="staple-line">✂ - - - - - - - - - - - - - - - - - - - ✂</span>
        <div class="staple-label">GRAMPEAR NA SACOLA / EMBALAGEM</div>
      </div>
      <div class="center-header">
        <div class="store-name">${storeName}</div>
        ${storePhone ? `<div class="store-phone">Tel: ${storePhone}</div>` : ""}
        <div class="receipt-badge">VIA DA SACOLA · ENTREGA</div>
        <div class="order-huge">PEDIDO #${order.number}</div>
        <div class="order-time">${formattedDate}</div>
      </div>
    `;
  } else if (type === "kitchen") {
    headerHtml = `
      <div class="center-header">
        <div class="receipt-badge kitchen-badge">VIA DA COZINHA · PREPARO</div>
        <div class="order-huge">PEDIDO #${order.number}</div>
        <div class="order-time">${formattedDate} · ${escapeHtml(order.customerName)}</div>
      </div>
    `;
  } else if (type === "bar") {
    headerHtml = `
      <div class="center-header">
        <div class="receipt-badge bar-badge" style="background:#2563eb;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:6px;">VIA DO BAR · BEBIDAS 🍺</div>
        <div class="order-huge">PEDIDO #${order.number}</div>
        <div class="order-time">${formattedDate} · ${escapeHtml(order.customerName)}</div>
      </div>
    `;
  } else {
    headerHtml = `
      <div class="center-header">
        <div class="store-name">${storeName}</div>
        <div class="receipt-badge">VIA COMPLETA · BALCÃO</div>
        <div class="order-huge">PEDIDO #${order.number}</div>
        <div class="order-time">${formattedDate}</div>
      </div>
    `;
  }

  const deliveryInfoHtml =
    type !== "kitchen"
      ? `
      <div class="section-divider"></div>
      <div class="section-title">DESTINATÁRIO &amp; ENTREGA</div>
      <div class="info-block">
        <div><b>Cliente:</b> ${escapeHtml(order.customerName)}</div>
        <div><b>WhatsApp:</b> ${escapeHtml(order.phone)}</div>
        <div style="margin-top: 4px;"><b>Tipo:</b> ${
          order.fulfillment === "delivery"
            ? "MOTOBOY / ENTREGA EM DOMICÍLIO"
            : order.fulfillment === "pickup"
              ? "RETIRADA NO BALCÃO"
              : "CONSUMO NO LOCAL"
        }</div>
        ${
          order.fulfillment === "delivery"
            ? `
          <div class="delivery-address-box">
            <div class="address-title">ENDEREÇO DE ENTREGA:</div>
            <div class="address-text">${escapeHtml(order.address)}</div>
            ${order.deliveryAreaName ? `<div class="address-area">Bairro/Área: <b>${escapeHtml(order.deliveryAreaName)}</b></div>` : ""}
          </div>
          <div class="motoboy-box">
            <span class="motoboy-icon">🛵</span>
            <div><b>MOTOBOY:</b> <span class="motoboy-name">${escapeHtml(driverName)}</span></div>
          </div>
        `
            : ""
        }
      </div>
    `
      : "";

  const notesHtml = order.notes
    ? `
    <div class="notes-box">
      <div class="notes-title">⚠️ OBSERVAÇÕES DO PEDIDO:</div>
      <div class="notes-body">${escapeHtml(order.notes)}</div>
    </div>
  `
    : "";

  const financialHtml =
    type !== "kitchen"
      ? `
      <div class="section-divider"></div>
      ${paymentInstructions}
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal dos itens:</span>
          <span>${money(order.subtotal)}</span>
        </div>
        ${
          order.deliveryFee > 0
            ? `
          <div class="totals-row">
            <span>Taxa de entrega:</span>
            <span>${money(order.deliveryFee)}</span>
          </div>
        `
            : ""
        }
        ${
          order.discountAmount > 0
            ? `
          <div class="totals-row discount-row">
            <span>Desconto (${escapeHtml(order.couponCode || "Cupom")}):</span>
            <span>-${money(order.discountAmount)}</span>
          </div>
        `
            : ""
        }
        <div class="totals-row grand-total">
          <span>TOTAL:</span>
          <span>${money(order.total)}</span>
        </div>
      </div>
    `
      : "";

  const footerHtml = `
    <div class="footer">
      ${
        trackingUrl && type === "bag_tag"
          ? `
        <div class="tracking-box">
          <div>Rastreie seu pedido em tempo real:</div>
          <div class="tracking-link">${trackingUrl}</div>
        </div>
      `
          : ""
      }
      <div class="thanks">Obrigado pela preferência! Bom apetite! ❤️</div>
      <div class="ello-credit">ELLO Gestão de Delivery · www.ello.app.br</div>
    </div>
  `;

  const htmlContent = `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Comanda #${order.number} - ${storeName}</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 2mm 3mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      color: #000;
    }
    body {
      width: 100%;
      background: #fff;
      padding: 4px;
      font-size: 11px;
      line-height: 1.35;
    }
    .staple-zone {
      text-align: center;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .staple-line {
      font-size: 9px;
      letter-spacing: 1px;
      color: #555;
    }
    .staple-label {
      font-size: 8px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 2px;
      border: 1px dashed #777;
      padding: 2px 4px;
      display: inline-block;
    }
    .center-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .store-name {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    .store-phone {
      font-size: 10px;
      color: #444;
      margin-top: 1px;
    }
    .receipt-badge {
      display: inline-block;
      margin: 4px 0;
      padding: 2px 8px;
      border: 1px solid #000;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .kitchen-badge {
      background: #000;
      color: #fff;
    }
    .order-huge {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.04em;
      margin: 3px 0;
    }
    .order-time {
      font-size: 10px;
      color: #333;
    }
    .section-divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .info-block {
      font-size: 11px;
      line-height: 1.4;
    }
    .delivery-address-box {
      margin-top: 6px;
      padding: 6px;
      border: 1px solid #000;
      background: #f7f7f7;
    }
    .address-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .address-text {
      font-size: 12px;
      font-weight: 700;
      line-height: 1.3;
    }
    .address-area {
      font-size: 10px;
      margin-top: 3px;
    }
    .motoboy-box {
      margin-top: 6px;
      padding: 5px 6px;
      background: #eee;
      border: 1px dashed #444;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }
    .motoboy-name {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: 5px 0;
      gap: 6px;
    }
    .item-name {
      font-size: 12px;
      line-height: 1.3;
      flex: 1;
    }
    .item-qty {
      font-size: 13px;
      font-weight: 800;
    }
    .item-price {
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .notes-box {
      margin: 8px 0;
      padding: 6px 8px;
      border: 2px solid #000;
      background: #fff;
    }
    .notes-title {
      font-size: 10px;
      font-weight: 900;
      margin-bottom: 2px;
    }
    .notes-body {
      font-size: 12px;
      font-weight: 800;
      line-height: 1.35;
    }
    .paid-box {
      text-align: center;
      border: 2px solid #000;
      padding: 6px 4px;
      margin: 8px 0;
      background: #f0f0f0;
    }
    .paid-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.05em;
    }
    .paid-sub {
      font-size: 10px;
      font-weight: 700;
    }
    .collect-box {
      text-align: center;
      border: 2px solid #000;
      padding: 6px 4px;
      margin: 8px 0;
      background: #fff;
    }
    .collect-title {
      font-size: 14px;
      font-weight: 900;
    }
    .collect-method {
      font-size: 11px;
      font-weight: 700;
      margin-top: 2px;
    }
    .totals-table {
      margin-top: 6px;
      font-size: 11px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .discount-row {
      font-style: italic;
    }
    .grand-total {
      font-size: 15px;
      font-weight: 900;
      border-top: 1px solid #000;
      padding-top: 4px;
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px dashed #777;
      font-size: 9px;
      color: #444;
    }
    .tracking-box {
      margin-bottom: 6px;
      padding: 4px;
      border: 1px dotted #666;
      font-size: 8px;
    }
    .tracking-link {
      font-size: 8px;
      word-break: break-all;
      font-weight: bold;
    }
    .thanks {
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .ello-credit {
      font-size: 8px;
      color: #888;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  ${headerHtml}
  ${deliveryInfoHtml}
  <div class="section-divider"></div>
  <div class="section-title">ITENS DO PEDIDO</div>
  <div class="items-list">
    ${itemsHtml}
  </div>
  ${notesHtml}
  ${financialHtml}
  ${footerHtml}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  receiptWindow.document.open();
  receiptWindow.document.write(htmlContent);
  receiptWindow.document.close();
}
