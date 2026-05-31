/** Compute age in full years from an ISO date string (YYYY-MM-DD). */
export function computeAgeFromBirthdate(birthdate: string, asOf: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const born = new Date(year, month - 1, day);
  if (
    born.getFullYear() !== year ||
    born.getMonth() !== month - 1 ||
    born.getDate() !== day
  ) {
    return null;
  }

  let age = asOf.getFullYear() - year;
  const monthDiff = asOf.getMonth() - (month - 1);
  const dayDiff = asOf.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < 0 || age > 120) return null;
  return age;
}

export function formatMemberAge(age: number | null | undefined): string | null {
  if (age == null || !Number.isFinite(age)) return null;
  return `${age}`;
}

export function validateBirthdateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Birthdate is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Use a valid date (YYYY-MM-DD).";
  }
  const age = computeAgeFromBirthdate(trimmed);
  if (age == null) return "Enter a valid birthdate.";
  if (age < 13) return "You must be at least 13 years old.";
  if (age > 120) return "Enter a realistic birthdate.";
  return null;
}
