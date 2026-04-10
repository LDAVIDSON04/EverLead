/**
 * Street / business address fields must not contain email addresses.
 * Used for agent office metadata and office_locations.
 */

const EMAILISH = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True if the value looks like an email (not acceptable in street/address lines). */
export function looksLikeEmailAddress(value: string | null | undefined): boolean {
  const t = (value ?? "").trim();
  if (!t) return false;
  if (t.includes("@")) {
    const at = t.split("@");
    if (at.length >= 2 && at[1] && at[1].includes(".")) return true;
    if (EMAILISH.test(t)) return true;
  }
  return EMAILISH.test(t);
}

export const ADDRESS_REJECT_EMAIL_MESSAGE =
  "Enter a real street address. Email addresses are not allowed in this field.";

/** Single line: ok for save if empty optional, or non-empty and not email-like. */
export function validateAddressLine(
  value: string | null | undefined,
  options: { optional?: boolean } = {}
): { ok: true } | { ok: false; error: string } {
  const t = (value ?? "").trim();
  if (!t) {
    return options.optional ? { ok: true } : { ok: false, error: ADDRESS_REJECT_EMAIL_MESSAGE };
  }
  if (looksLikeEmailAddress(t)) {
    return { ok: false, error: ADDRESS_REJECT_EMAIL_MESSAGE };
  }
  return { ok: true };
}

export type OfficeLocationLike = {
  street_address?: string | null;
  city?: string | null;
  province?: string | null;
};

function isValidOfficeStreetLine(street: string): boolean {
  const t = street.trim();
  if (!t || looksLikeEmailAddress(t) || t.length < 3) return false;
  return true;
}

/**
 * In-person marketplace: require at least one `office_locations` row with a real civic
 * street_address (not email-like, min length), plus city and province.
 * Profile metadata is not used — agents must have persisted offices to appear in-person.
 */
export function hasValidInPersonOfficeForSearch(input: {
  officeLocations: OfficeLocationLike[];
}): boolean {
  const offices = input.officeLocations || [];

  for (const loc of offices) {
    const street = (loc.street_address ?? "").trim();
    if (!isValidOfficeStreetLine(street)) continue;
    if (!(loc.city ?? "").trim() || !(loc.province ?? "").trim()) continue;
    return true;
  }

  return false;
}
