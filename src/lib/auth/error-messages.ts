/** Maps raw auth errors to safe, user-facing copy (no internals). */
export function toUserAuthError(error?: string | null): string {
  if (!error?.trim()) {
    return "Something went wrong. Please try again.";
  }

  const raw = error.trim();

  const known: Record<string, string> = {
    CredentialsSignin:
      "Invalid email or password, or your account is not approved yet.",
    Configuration: "Sign-in is temporarily unavailable. Please try again later.",
    AccessDenied: "You are not authorized to sign in.",
    Verification: "The verification link is invalid or has expired.",
  };

  if (known[raw]) return known[raw];

  const lower = raw.toLowerCase();

  if (
    lower.includes("digest") ||
    lower.includes("sql") ||
    lower.includes("constraint") ||
    lower.includes("undefined") ||
    lower.includes("env") ||
    lower.includes("oauth") ||
    lower.includes("admin_email") ||
    lower.includes("google_client") ||
    lower.includes("unexpected response")
  ) {
    return "Something went wrong. Please try again.";
  }

  if (lower.includes("pending") && lower.includes("approval")) {
    return "Your application is still pending approval.";
  }
  if (lower.includes("verify") && lower.includes("email")) {
    return "Please verify your email before signing in.";
  }
  if (lower.includes("rejected")) {
    return "Your membership application was not approved.";
  }
  if (lower.includes("gmail")) {
    return "Please use a valid Gmail address to apply.";
  }
  if (lower.includes("whitelisted") || lower.includes("access denied")) {
    return "You are not authorized to access the admin area.";
  }

  // Server action messages we control — safe to show
  if (
    raw.length <= 160 &&
    !raw.includes(" at ") &&
    !raw.includes("Error:") &&
    !raw.includes("http")
  ) {
    return raw;
  }

  return "Something went wrong. Please try again.";
}
