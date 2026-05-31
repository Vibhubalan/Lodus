const USD_INR_FALLBACK = 85;
const EXCHANGE_API = "https://open.er-api.com/v6/latest/USD";

export type UsdInrQuote = {
  rate: number;
  source: "live" | "fallback";
};

export async function fetchUsdToInrRate(): Promise<UsdInrQuote> {
  try {
    const response = await fetch(EXCHANGE_API, { cache: "no-store" });

    if (!response.ok) {
      return { rate: USD_INR_FALLBACK, source: "fallback" };
    }

    const data = (await response.json()) as {
      result?: string;
      rates?: { INR?: number };
    };

    const inr = data.rates?.INR;
    if (data.result !== "success" || typeof inr !== "number" || !Number.isFinite(inr) || inr <= 0) {
      return { rate: USD_INR_FALLBACK, source: "fallback" };
    }

    return { rate: inr, source: "live" };
  } catch {
    return { rate: USD_INR_FALLBACK, source: "fallback" };
  }
}

/** $1 USD → INR paise for Stripe (e.g. ₹84.50 → 8450). */
export function usdOneToInrPaise(rate: number) {
  return Math.round(rate * 100);
}

export function formatInrDisplay(rate: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}
