export type CouponRule = {
  code: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minimumOrder?: number;
  isActive?: boolean;
};

export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

export function isValidE164Phone(phone: string): boolean {
  const normalized = normalizePhoneE164(phone);
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: CouponRule,
): { valid: boolean; discount: number; reason?: string } {
  if (subtotal <= 0) {
    return { valid: false, discount: 0, reason: "O valor do pedido precisa ser maior que zero." };
  }
  if (coupon.isActive === false) {
    return { valid: false, discount: 0, reason: "Cupom inativo ou expirado." };
  }
  const minOrder = coupon.minimumOrder ?? 0;
  if (subtotal < minOrder) {
    return {
      valid: false,
      discount: 0,
      reason: `O valor mínimo para este cupom é de R$ ${minOrder.toFixed(2).replace(".", ",")}.`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "percent") {
    const rawDiscount = (subtotal * coupon.discountValue) / 100;
    discount = Math.round(rawDiscount * 100) / 100;
  } else {
    discount = coupon.discountValue;
  }

  // Desconto nunca pode exceder o subtotal
  discount = Math.min(subtotal, Math.max(0, discount));

  return { valid: true, discount };
}
