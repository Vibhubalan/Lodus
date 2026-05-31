import {
  approveUser,
  consumeToken,
  markTokenUsed,
} from "@/lib/auth/user-service";
import { verifySignedApprovalToken } from "@/lib/auth/approval-token";
import { getBaseUrl } from "@/lib/email/send";

type PageKind = "success" | "info" | "error";

function htmlPage(kind: PageKind, title: string, message: string, status: number) {
  const accent =
    kind === "success" ? "#248046" : kind === "info" ? "#d9a441" : "#ff4655";
  const loginUrl = `${getBaseUrl()}/login`;
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — Lodus</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at 50% 0%, rgba(239,68,68,0.10) 0%, transparent 55%), #0b0b0f;
        color: #ece8ea;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        padding: 24px;
      }
      .card {
        width: 100%;
        max-width: 460px;
        background: rgba(13,17,24,0.72);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 36px 32px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        backdrop-filter: blur(14px);
        text-align: center;
      }
      .badge {
        width: 56px; height: 56px;
        margin: 0 auto 20px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: 700;
        color: ${accent};
        border: 2px solid ${accent};
        background: ${accent}1a;
      }
      h1 { font-size: 20px; margin: 0 0 12px; letter-spacing: 0.5px; }
      p { color: #b9b1b5; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
      a.btn {
        display: inline-block;
        background: ${accent};
        color: #fff;
        text-decoration: none;
        padding: 12px 22px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .brand { margin-top: 26px; font-size: 11px; color: #6c656a; letter-spacing: 3px; text-transform: uppercase; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="badge">${kind === "success" ? "✓" : kind === "info" ? "!" : "×"}</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <a class="btn" href="${loginUrl}">Go to Lodus</a>
      <div class="brand">Lodus Admin</div>
    </main>
  </body>
</html>`;

  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");
  const userId = Number(url.searchParams.get("userId"));

  // 1. Validate the cryptographic token structure.
  if (!tokenParam || !Number.isInteger(userId) || userId <= 0) {
    return htmlPage("error", "Invalid Link", "This approval link is malformed.", 400);
  }

  const rawToken = verifySignedApprovalToken(userId, tokenParam);
  if (!rawToken) {
    return htmlPage(
      "error",
      "Invalid Signature",
      "This approval link is invalid or has been tampered with.",
      400,
    );
  }

  // Single-use + time-decay enforcement via the backing DB token.
  const row = await consumeToken(rawToken, "approve");
  if (!row || row.userId !== userId) {
    return htmlPage(
      "info",
      "Link Expired",
      "This approval link has already been used or has expired. No action was taken.",
      410,
    );
  }
  await markTokenUsed(row.id);

  // 2-5. Race-condition gate handled atomically inside approveUser.
  const result = await approveUser(userId, "email-link@lodus", "email");

  if (result.ok) {
    return htmlPage(
      "success",
      "Member Approved",
      "The applicant has been approved via the secure email channel and a welcome email with their temporary login password has been sent.",
      200,
    );
  }

  if (result.reason === "already_approved") {
    if (result.channel === "dashboard") {
      return htmlPage(
        "info",
        "Already Approved",
        "This application has already been approved via the Admin Dashboard Panel.",
        409,
      );
    }
    return htmlPage(
      "info",
      "Already Approved",
      "This application has already been approved.",
      409,
    );
  }

  return htmlPage(
    "error",
    "Applicant Not Found",
    "We could not find the applicant associated with this link.",
    404,
  );
}
