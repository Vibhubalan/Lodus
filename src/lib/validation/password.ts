/** Enforce password complexity: min 8 chars, 1 uppercase, 1 number, 1 special char */
export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  // Any character that is not an alphanumeric character or a space counts as a special char
  if (!/[^a-zA-Z0-9\s]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
}
