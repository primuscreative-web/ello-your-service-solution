export const MARKETS = [
  { country: "BR", name: "Brasil", currency: "BRL", locale: "pt-BR", enabled: true },
  { country: "US", name: "Estados Unidos", currency: "USD", locale: "en-US", enabled: false },
  {
    country: "AE",
    name: "Emirados Árabes Unidos",
    currency: "AED",
    locale: "ar-AE",
    enabled: false,
  },
  { country: "PT", name: "Portugal", currency: "EUR", locale: "pt-PT", enabled: false },
  { country: "DE", name: "Alemanha", currency: "EUR", locale: "de-DE", enabled: false },
  { country: "FR", name: "França", currency: "EUR", locale: "fr-FR", enabled: false },
  { country: "ES", name: "Espanha", currency: "EUR", locale: "es-ES", enabled: false },
  { country: "IT", name: "Itália", currency: "EUR", locale: "it-IT", enabled: false },
  { country: "NL", name: "Países Baixos", currency: "EUR", locale: "nl-NL", enabled: false },
  { country: "IE", name: "Irlanda", currency: "EUR", locale: "en-IE", enabled: false },
  { country: "GB", name: "Reino Unido", currency: "GBP", locale: "en-GB", enabled: false },
  { country: "CH", name: "Suíça", currency: "CHF", locale: "de-CH", enabled: false },
  { country: "CN", name: "China", currency: "CNY", locale: "zh-CN", enabled: false },
  {
    country: "ZZ",
    name: "mercados internacionais",
    currency: "moeda local",
    locale: "en-US",
    enabled: false,
  },
] as const;

export type MarketCountry = (typeof MARKETS)[number]["country"];
export type PlanId = "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

// Prices are independently authored in each market. Brazil is the only market
// configured today; never derive another market's price from these values.
export const BR_PLAN_PRICES = {
  pro: { monthly: 3990, yearly: 47880, regularMonthly: 5990, regularYearly: 71880 },
  business: { monthly: 7990, yearly: 95880, regularMonthly: 11990, regularYearly: 143880 },
} as const;

export function formatMarketAmount(minorUnits: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minorUnits / 100);
}
