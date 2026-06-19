import test from "node:test";
import assert from "node:assert/strict";
import { createDisabledWalletView } from "./wallet.ts";

test("disabled wallet never invents balance or transactions", () => {
  const wallet = createDisabledWalletView();
  assert.equal(wallet.gatewayStatus, "disconnected");
  assert.equal(wallet.availableCents, 0);
  assert.equal(wallet.pendingCents, 0);
  assert.deepEqual(wallet.transactions, []);
  assert.equal(wallet.canWithdraw, false);
});
