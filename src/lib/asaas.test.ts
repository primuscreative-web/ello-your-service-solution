import assert from "node:assert/strict";
import test from "node:test";
import { isAsaasConfigured, verifyAsaasWebhookToken } from "./asaas.server.ts";

test("verifies valid Asaas webhook token", () => {
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

test("identifies whether Asaas is configured via environment variable", () => {
  process.env.ASAAS_API_KEY = "test_api_key_valid_length_sample";
  assert.equal(isAsaasConfigured(), true);

  process.env.ASAAS_API_KEY = "";
  assert.equal(isAsaasConfigured(), false);

  process.env.ASAAS_API_KEY = "short";
  assert.equal(isAsaasConfigured(), false);
});
