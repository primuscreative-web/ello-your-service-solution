import test from "node:test";
import assert from "node:assert/strict";
import { ONBOARDING_STORAGE_KEY, parseOnboardingState } from "./onboarding-state.ts";

test("uses a versioned storage key", () => {
  assert.equal(ONBOARDING_STORAGE_KEY, "ello:onboarding:v1");
});

test("accepts only the completed state", () => {
  assert.equal(parseOnboardingState("completed"), true);
  assert.equal(parseOnboardingState(null), false);
  assert.equal(parseOnboardingState("anything"), false);
});
