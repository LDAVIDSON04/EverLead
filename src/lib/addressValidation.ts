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

/**
 * In-person marketplace: agent must have at least one physical office record
 * (table row or complete metadata) with a real street line — not an email.
 */
export function hasValidInPersonOfficeForSearch(input: {
  officeLocations: OfficeLocationLike[];
  business_street?: string | null;
  business_city?: string | null;
  business_province?: string | null;
  business_address?: string | null;
}): boolean {
  const offices = input.officeLocations || [];
  for (const loc of offices) {
    const street = (loc.street_address ?? "").trim();
    if (!street || looksLikeEmailAddress(street) || street.length < 3) continue;
    if (!(loc.city ?? "").trim() || !(loc.province ?? "").trim()) continue;
    return true;
  }

  const bs = (input.business_street ?? "").trim();
  const bc = (input.business_city ?? "").trim();
  const bp = (input.business_province ?? "").trim();
  if (bs.length >= 3 && bc && bp && !looksLikeEmailAddress(bs)) {
    return true;
  }

  const ba = (input.business_address ?? "").trim();
  if (ba.length >= 5 && bc && bp && !looksLikeEmailAddress(ba)) {
    return true;
  }

  return false;
}
