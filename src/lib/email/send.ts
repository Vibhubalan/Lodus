import { createEntityRefId, getAppBaseUrl } from "@/lib/email/mail-config";
import { dispatchOutboundMail } from "@/lib/email/providers";
import {
  buildEmailLayout,
  escapeHtml,
  htmlToPlainText,
  infoPanelHtml,
  otpCodeBlock,
  plainFooter,
} from "@/lib/email/template";

export type SendEmailOptions = {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Optional override; otherwise generated per send */
  entityRefId?: string;
};

export async function sendEmail({
  to,
  cc,
  subject,
  html,
  text,
  entityRefId,
}: SendEmailOptions) {
  const recipients = Array.isArray(to) ? to : [to];
  const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
  const plainText = text?.trim() || htmlToPlainText(html);
  const refId = entityRefId ?? createEntityRefId();

  const result = await dispatchOutboundMail({
    to: recipients,
    cc: ccRecipients,
    subject,
    html,
    text: plainText,
    entityRefId: refId,
  });

  return { ok: true as const, dev: result.provider === "dev" };
}

// ─── Transactional templates (HTML + plain text) ───────────────────────────

export function verificationEmailContent(verifyUrl: string, name: string) {
  const greeting = `Hi ${name}, welcome to Lodus.`;
  const html = buildEmailLayout({
    preheader: "Confirm your email to continue your membership application.",
    greeting,
    bodyHtml: `<p style="margin:0 0 16px;">Please confirm your email address so we can review your application.</p>
      <p style="margin:0;font-size:14px;color:#5c5c5c;">This link expires in 24 hours.</p>`,
    cta: { label: "Verify your email", href: verifyUrl },
  });
  const text =
    `Hi ${name}, welcome to Lodus.\n\n` +
    `Please confirm your email address:\n${verifyUrl}\n\n` +
    `This link expires in 24 hours.` +
    plainFooter();
  return { html, text };
}

/** @deprecated Use verificationEmailContent — kept for import compatibility */
export function verificationEmailHtml(verifyUrl: string, name: string) {
  return verificationEmailContent(verifyUrl, name).html;
}

export function adminApprovalAlertEmailContent({
  applicantName,
  applicantEmail,
  phone,
  message,
  directApproveUrl,
  dashboardUrl,
}: {
  applicantName: string;
  applicantEmail: string;
  phone: string;
  message: string;
  directApproveUrl: string;
  dashboardUrl: string;
}) {
  const greeting = "Hi there,";
  const panel = infoPanelHtml([
    { label: "Name", value: applicantName },
    { label: "Email", value: applicantEmail },
    { label: "Phone", value: phone },
    { label: "Reason for joining", value: message || "—" },
  ]);
  const html = buildEmailLayout({
    preheader: `${applicantName} is ready for your review.`,
    greeting,
    bodyHtml: `<p style="margin:0 0 16px;">A member verified their email and is now <strong>pending review</strong>.</p>
      ${panel}
      <p style="margin:16px 0 0;font-size:14px;color:#5c5c5c;">You can approve from the dashboard or use the one-time approval link below.</p>
      <p style="margin:12px 0 0;font-size:14px;"><a href="${dashboardUrl}" style="color:#b45309;text-decoration:underline;">Open approvals dashboard</a></p>`,
    cta: { label: "Review applicant", href: directApproveUrl },
    footerNote:
      "The approval link is single-use, signed, and expires in 24 hours. If the applicant was already approved, the link will report that safely.",
  });
  const text =
    `A new Lodus applicant is ready for review.\n\n` +
    `Name: ${applicantName}\nEmail: ${applicantEmail}\nPhone: ${phone}\nReason: ${message || "—"}\n\n` +
    `Approve: ${directApproveUrl}\nDashboard: ${dashboardUrl}\n\n` +
    `The approval link is single-use and expires in 24 hours.` +
    plainFooter();
  return { html, text };
}

export function adminApprovalAlertEmailHtml(
  params: Parameters<typeof adminApprovalAlertEmailContent>[0],
) {
  return adminApprovalAlertEmailContent(params).html;
}

export function applicationResultEmailContent(approved: boolean, name: string) {
  const greeting = `Hi ${name},`;
  const body = approved
    ? `<p style="margin:0 0 16px;">Your membership application was approved. Check your inbox for instructions to sign in and complete your profile.</p>`
    : `<p style="margin:0;">Thank you for your interest in Lodus. Your application was not approved at this time. If you have questions, reply to this email.</p>`;
  const html = buildEmailLayout({
    preheader: approved ? "Your Lodus application was approved." : "An update on your Lodus application.",
    greeting,
    bodyHtml: body,
  });
  const text =
    (approved
      ? `Hi ${name},\n\nYour Lodus membership application was approved. Check your inbox for sign-in instructions.`
      : `Hi ${name},\n\nThank you for applying to Lodus. Your application was not approved at this time.`) +
    plainFooter();
  return { html, text };
}

export function applicationResultEmailHtml(approved: boolean, name: string) {
  return applicationResultEmailContent(approved, name).html;
}

export function otpApprovalEmailContent(
  otp: string,
  loginUrl: string,
  name: string,
  email?: string,
) {
  const greeting = `Hi ${name}, welcome to Lodus.`;
  const html = buildEmailLayout({
    preheader: "Your application was approved — sign in with your temporary code.",
    greeting,
    bodyHtml: `<p style="margin:0 0 16px;">Your membership application was approved. Sign in with your email and the temporary code below, then complete your profile.</p>
      ${otpCodeBlock("Temporary sign-in code", otp)}`,
    cta: { label: "Sign in to Lodus", href: loginUrl },
    footerNote: "After signing in, you will set a permanent password and finish your profile.",
  });
  const text =
    `Hi ${name}, welcome to Lodus.\n\n` +
    `Your application was approved.\n\n` +
    `Sign in at: ${loginUrl}\n` +
    (email ? `Email: ${email}\n` : "") +
    `Temporary code: ${otp}\n\n` +
    `After signing in, set your permanent password and complete your profile.` +
    plainFooter();
  return { html, text };
}

export function otpApprovalEmailHtml(otp: string, loginUrl: string, name: string) {
  return otpApprovalEmailContent(otp, loginUrl, name).html;
}

export function otpPasswordResetEmailContent(otp: string, name: string) {
  const greeting = `Hi ${name},`;
  const html = buildEmailLayout({
    preheader: "Your password reset verification code.",
    greeting,
    bodyHtml: `<p style="margin:0 0 16px;">You requested a password reset. Enter the code below on the reset screen, then choose and confirm your new password.</p>
      ${otpCodeBlock("Verification code", otp)}`,
    footerNote: "This code expires in 10 minutes. If you did not request this, secure your account immediately.",
  });
  const text =
    `Hi ${name},\n\n` +
    `Your Lodus password reset code is: ${otp}\n\n` +
    `Enter it on the reset screen, then set your new password. Expires in 10 minutes.\n\n` +
    `If you did not request this, secure your account immediately.` +
    plainFooter();
  return { html, text };
}

export function otpPasswordResetEmailHtml(otp: string, name: string) {
  return otpPasswordResetEmailContent(otp, name).html;
}

/** Admin-initiated reset — member signs in with OTP, then sets a permanent password in Profile. */
export function adminPasswordResetEmailContent(otp: string, name: string, loginUrl: string) {
  const greeting = `Hi ${name},`;
  const html = buildEmailLayout({
    preheader: "An administrator reset your Lodus password.",
    greeting,
    bodyHtml: `<p style="margin:0 0 16px;">An administrator initiated a password reset for your account. Sign in with the temporary code below, then open <strong>Profile → Password &amp; Security</strong> to set a new permanent password.</p>
      ${otpCodeBlock("Temporary sign-in code", otp)}`,
    cta: { label: "Sign in to Lodus", href: loginUrl },
    footerNote: "This code expires in 10 minutes.",
  });
  const text =
    `Hi ${name},\n\n` +
    `An administrator reset your Lodus password.\n\n` +
    `Sign in: ${loginUrl}\n` +
    `Temporary code: ${otp}\n\n` +
    `Then open Profile → Password & Security to set a new permanent password. Expires in 10 minutes.` +
    plainFooter();
  return { html, text };
}

export function adminPasswordResetEmailHtml(otp: string, name: string, loginUrl: string) {
  return adminPasswordResetEmailContent(otp, name, loginUrl).html;
}

export function phoneVerificationEmailContent(code: string, phone: string, name: string) {
  const greeting = `Hi ${name},`;
  const html = buildEmailLayout({
    preheader: "Your phone verification code for Lodus.",
    greeting,
    bodyHtml: `<p style="margin:0 0 16px;">Use this code to verify the phone number <strong>${escapeHtml(phone)}</strong> on your profile.</p>
      ${otpCodeBlock("Verification code", code)}`,
    footerNote: "This code expires in 15 minutes.",
  });
  const text =
    `Hi ${name},\n\n` +
    `Your Lodus phone verification code for ${phone} is: ${code}\n\n` +
    `Expires in 15 minutes.` +
    plainFooter();
  return { html, text };
}

export function phoneVerificationEmailHtml(code: string, phone: string, name: string) {
  return phoneVerificationEmailContent(code, phone, name).html;
}

export { getAppBaseUrl as getBaseUrl };
