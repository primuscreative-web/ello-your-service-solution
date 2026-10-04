import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCouponDiscount,
  isValidE164Phone,
  normalizePhoneE164,
  type CouponRule,
} from "./coupons.ts";

test("normalizes Brazilian phone numbers into E.164", () => {
  assert.equal(normalizePhoneE164("(11) 98765-4321"), "+5511987654321");
  assert.equal(normalizePhoneE164("11987654321"), "+5511987654321");
  assert.equal(normalizePhoneE164("+5511987654321"), "+5511987654321");
  assert.equal(normalizePhoneE164("+14155552671"), "+14155552671");
});

test("validates valid and invalid E.164 phones", () => {
  assert.equal(isValidE164Phone("(11) 98765-4321"), true);
  assert.equal(isValidE164Phone("11987654321"), true);
  assert.equal(isValidE164Phone("123"), false);
  assert.equal(isValidE164Phone(""), false);
});

test("calculates fixed discount correctly without exceeding subtotal", () => {
  const coupon: CouponRule = {
    code: "BEMVINDO15",
    discountType: "fixed",
    discountValue: 15,
    minimumOrder: 30,
    isActive: true,
  };

  const resultOk = calculateCouponDiscount(50, coupon);
  assert.equal(resultOk.valid, true);
  assert.equal(resultOk.discount, 15);

  const resultUnderMinimum = calculateCouponDiscount(25, coupon);
  assert.equal(resultUnderMinimum.valid, false);
  assert.match(resultUnderMinimum.reason ?? "", /mínimo/i);

  // Desconto maior que o subtotal é limitado ao subtotal
  const bigCoupon: CouponRule = {
    code: "VALE100",
    discountType: "fixed",
    discountValue: 100,
    isActive: true,
  };
  const resultCapped = calculateCouponDiscount(45, bigCoupon);
  assert.equal(resultCapped.valid, true);
  assert.equal(resultCapped.discount, 45);
});

test("calculates percentage discount accurately", () => {
  const coupon: CouponRule = {
    code: "PROMO10",
    discountType: "percent",
    discountValue: 10,
    minimumOrder: 0,
    isActive: true,
  };

  const result = calculateCouponDiscount(159.9, coupon);
  assert.equal(result.valid, true);
  assert.equal(result.discount, 15.99);
});

test("rejects inactive coupons or zero subtotal", () => {
  const coupon: CouponRule = {
    code: "EXPIRADO",
    discountType: "fixed",
    discountValue: 10,
    isActive: false,
  };

  const resultInactive = calculateCouponDiscount(100, coupon);
  assert.equal(resultInactive.valid, false);
  assert.match(resultInactive.reason ?? "", /inativo/i);

  const resultZero = calculateCouponDiscount(0, { ...coupon, isActive: true });
  assert.equal(resultZero.valid, false);
});
