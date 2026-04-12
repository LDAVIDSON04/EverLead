/**
 * Human-readable service_type from marketplace booking questionnaire
 * (funeral single value or comma-separated lawyer/financial/insurance).
 */
export function formatBookingServiceType(
  service: string | null | undefined,
  whenEmpty = "N/A"
): string {
  if (service == null || String(service).trim() === "") return whenEmpty;
  const s = String(service).trim();
  if (s === "cremation") return "Cremation";
  if (s === "burial") return "Burial";
  if (s === "unsure") return "Unsure";
  if (s === "other") return "Other";
  return s
    .split(",")
    .map((part) => {
      const t = part.trim();
      if (t.toLowerCase() === "other") return "Other";
      return t;
    })
    .join(", ");
}
