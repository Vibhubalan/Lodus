import { NextResponse } from "next/server";
import {
  fetchUsdToInrRate,
  formatInrDisplay,
  usdOneToInrPaise,
} from "@/lib/donate/exchange-rate";
import { isDonationsEnabled } from "@/lib/features";
import { getSiteUrl } from "@/lib/site-url";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    if (!isDonationsEnabled()) {
      return NextResponse.json(
        { error: "Donations are not available right now." },
        { status: 503 },
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Donations are not available right now." },
        { status: 503 },
      );
    }

    const quote = await fetchUsdToInrRate();
    const amountInPaise = usdOneToInrPaise(quote.rate);
    const baseUrl = getSiteUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            unit_amount: amountInPaise,
            product_data: {
              name: "Support Lodus",
              description: "Just for fun — $1 USD donation (live INR conversion)",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?donate=success`,
      cancel_url: `${baseUrl}/?donate=cancelled`,
      metadata: {
        usd_amount: "1.00",
        inr_rate: String(quote.rate),
        rate_source: quote.source,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      amountInPaise,
      inrRate: quote.rate,
      inrDisplay: formatInrDisplay(quote.rate),
      source: quote.source,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
