import { NextResponse } from "next/server";
import { fetchUsdToInrRate, formatInrDisplay } from "@/lib/donate/exchange-rate";
import { isDonationsEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDonationsEnabled()) {
    return NextResponse.json(
      { error: "Donations are not available right now." },
      { status: 503 },
    );
  }

  const quote = await fetchUsdToInrRate();  return NextResponse.json({
    usdAmount: 1,
    inrRate: quote.rate,
    inrDisplay: formatInrDisplay(quote.rate),
    source: quote.source,
  });
}
