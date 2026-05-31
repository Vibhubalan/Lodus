import { isPublicMailUrl, getAppBaseUrl } from "@/lib/email/mail-config";

/** Warm, minimal palette for transactional mail */
export const EMAIL_COLORS = {
  pageBg: "#faf9f6",
  cardBg: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#5c5c5c",
  border: "#e8e6e1",
  accent: "#b45309",
  accentHover: "#92400e",
  codeBg: "#f5f3ef",
} as const;

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export { createEntityRefId } from "@/lib/email/mail-config";

function getUnsubscribeUrl(): string | null {
  const explicit = process.env.MAIL_UNSUBSCRIBE_URL?.trim();
  if (explicit && isPublicMailUrl(explicit)) return explicit;
  const profileUrl = `${getAppBaseUrl().replace(/\/$/, "")}/profile`;
  if (isPublicMailUrl(profileUrl)) return profileUrl;
  return null;
}

export type EmailLayoutOptions = {
  preheader?: string;
  greeting: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
};

export function buildEmailLayout({
  preheader,
  greeting,
  bodyHtml,
  cta,
  footerNote,
}: EmailLayoutOptions): string {
  const unsubscribeUrl = getUnsubscribeUrl();
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>`
    : "";

  const ctaBlock = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
        <tr>
          <td style="border-radius:6px;background:${EMAIL_COLORS.accent};">
            <a href="${cta.href}" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const footerExtra = footerNote
    ? `<p style="margin:16px 0 0;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${EMAIL_COLORS.textMuted};">${footerNote}</p>`
    : "";

  const unsubscribeBlock = unsubscribeUrl
    ? `<p style="margin:20px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${EMAIL_COLORS.textMuted};">
        <a href="${unsubscribeUrl}" style="color:${EMAIL_COLORS.textMuted};text-decoration:underline;">Manage email preferences</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Lodus</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_COLORS.pageBg};">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_COLORS.pageBg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${EMAIL_COLORS.cardBg};border:1px solid ${EMAIL_COLORS.border};border-radius:8px;box-shadow:0 2px 12px rgba(26,26,26,0.06);">
          <tr>
            <td style="padding:40px 36px 32px;font-family:${FONT_STACK};">
              <p style="margin:0 0 24px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_COLORS.accent};">Lodus</p>
              <p style="margin:0 0 20px;font-size:17px;line-height:1.6;color:${EMAIL_COLORS.text};">${escapeHtml(greeting)}</p>
              <div style="font-size:15px;line-height:1.6;color:${EMAIL_COLORS.text};">${bodyHtml}</div>
              ${ctaBlock}
              ${footerExtra}
              <p style="margin:32px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_COLORS.text};">
                Warmly,<br />
                <span style="color:${EMAIL_COLORS.textMuted};">The Lodus Team</span>
              </p>
              ${unsubscribeBlock}
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:11px;line-height:1.5;color:${EMAIL_COLORS.textMuted};text-align:center;">
          You received this message because you have a Lodus account or application.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpCodeBlock(label: string, code: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background-color:${EMAIL_COLORS.codeBg};border:1px solid ${EMAIL_COLORS.border};border-radius:6px;">
    <tr>
      <td style="padding:20px;text-align:center;">
        <p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${EMAIL_COLORS.textMuted};">${escapeHtml(label)}</p>
        <p style="margin:0;font-family:'SF Mono', Monaco, Consolas, monospace;font-size:28px;font-weight:700;letter-spacing:0.2em;color:${EMAIL_COLORS.text};">${escapeHtml(code)}</p>
      </td>
    </tr>
  </table>`;
}

export function infoPanelHtml(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (r) =>
        `<p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:14px;line-height:1.5;color:${EMAIL_COLORS.text};"><strong style="color:${EMAIL_COLORS.textMuted};font-weight:600;">${escapeHtml(r.label)}:</strong> ${escapeHtml(r.value)}</p>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:${EMAIL_COLORS.codeBg};border:1px solid ${EMAIL_COLORS.border};border-radius:6px;">
    <tr><td style="padding:18px 20px;">${rowsHtml}</td></tr>
  </table>`;
}

/** Strip HTML to a readable plain-text fallback when callers omit `text`. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function plainFooter(): string {
  const unsubscribeUrl = getUnsubscribeUrl();
  const lines = ["\n\nWarmly,\nThe Lodus Team"];
  if (unsubscribeUrl) {
    lines.push(`\nManage email preferences: ${unsubscribeUrl}`);
  }
  return lines.join("");
}
