import assert from "node:assert/strict";
import test from "node:test";
import { verifyAsaasWebhookToken } from "./asaas.server.ts";

test("verifies valid Asaas webhook token", () => {
  // Test with sample token
  process.env.ASAAS_WEBHOOK_TOKEN = "test_webhook_token_secret_123456";

  assert.equal(verifyAsaasWebhookToken("test_webhook_token_secret_123456"), true);
  assert.equal(verifyAsaasWebhookToken("wrong_token"), false);
  assert.equal(verifyAsaasWebhookToken(""), false);
  assert.equal(verifyAsaasWebhookToken(null), false);
});

test("rejects tokens of different lengths securely without error", () => {
  process.env.ASAAS_WEBHOOK_TOKEN = "secret_exact_32_characters_12345";

  assert.equal(verifyAsaasWebhookToken("short"), false);
  assert.equal(verifyAsaasWebhookToken("a_very_long_token_that_exceeds_the_expected_length_by_far"), false);
});
