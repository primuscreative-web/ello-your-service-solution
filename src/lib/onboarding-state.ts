export const ONBOARDING_STORAGE_KEY = "ello:onboarding:v1";

export function parseOnboardingState(value: string | null) {
  return value === "completed";
}

export function completeOnboarding(storage: Pick<Storage, "setItem"> = window.localStorage) {
  storage.setItem(ONBOARDING_STORAGE_KEY, "completed");
}
