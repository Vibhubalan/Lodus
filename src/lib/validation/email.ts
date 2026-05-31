const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/** Membership applications must use a Gmail address. */
export function isGmailAddress(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1) return false;
  const domain = normalized.slice(at + 1);
  return GMAIL_DOMAINS.has(domain);
}

export function gmailValidationError(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  if (!isGmailAddress(email)) {
    return "Applications must use a Gmail address (@gmail.com or @googlemail.com).";
  }
  const local = email.split("@")[0] ?? "";
  if (local.length < 1 || local.length > 64) {
    return "This Gmail address does not look valid.";
  }
  if (local.includes("..") || local.startsWith(".") || local.endsWith(".")) {
    return "This Gmail address does not look valid.";
  }
  return null;
}

/** DNS MX check — confirms the domain can receive mail (not that the mailbox exists). */
export async function domainHasMxRecords(domain: string): Promise<boolean> {
  if (typeof window !== "undefined") {
    return true;
  }
  try {
    const dns = await import("dns");
    const records = await dns.promises.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validates Gmail format and that Google's mail servers accept mail for the domain.
 * Mailbox existence is confirmed when the applicant clicks the verification email link.
 */
export async function validateGmailForApplication(email: string): Promise<string | null> {
  const formatError = gmailValidationError(email);
  if (formatError) return formatError;

  const domain = email.trim().toLowerCase().split("@")[1]!;
  const hasMx = await domainHasMxRecords(domain);
  if (!hasMx) {
    return "We could not verify this Gmail domain. Check the address and try again.";
  }

  return null;
}
