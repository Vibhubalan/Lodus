import {
  buildDeliverabilityHeaders,
  requireResendInProduction,
  resolveFromAddress,
  resolveReplyTo,
  warnIfDevMailLinks,
} from "@/lib/email/mail-config";

export type OutboundMail = {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
  entityRefId: string;
};

async function sendViaResend(mail: OutboundMail, from: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resendFrom = process.env.RESEND_FROM?.trim() || from;
  const headers = buildDeliverabilityHeaders(mail.entityRefId);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: mail.to,
      cc: mail.cc,
      reply_to: resolveReplyTo(from),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}

function logDevMail(mail: OutboundMail, from: string) {
  console.log("\n--- LODUS EMAIL (dev — set RESEND_API_KEY to send) ---");
  console.log("From:", from);
  console.log("To:", mail.to.join(", "));
  if (mail.cc?.length) console.log("CC:", mail.cc.join(", "));
  console.log("Subject:", mail.subject);
  console.log("X-Entity-Ref-ID:", mail.entityRefId);
  console.log(mail.text);
  console.log("---\n");
}

export async function dispatchOutboundMail(
  mail: OutboundMail,
): Promise<{ ok: true; provider: "resend" | "dev" }> {
  const from = resolveFromAddress();
  warnIfDevMailLinks();
  requireResendInProduction();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    logDevMail(mail, from);
    return { ok: true, provider: "dev" };
  }

  await sendViaResend(mail, from);
  return { ok: true, provider: "resend" };
}
