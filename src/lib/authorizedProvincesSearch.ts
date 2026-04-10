/**
 * Match profile.metadata.authorized_provinces (comma-separated AB, BC, … or full names)
 * against the province segment of a search location (e.g. "Calgary, AB" → "AB").
 * When metadata is empty, returns true (legacy agents without the field).
 */

const PROVINCE_MAP: Record<string, string[]> = {
  alberta: ["ab", "alberta"],
  "british columbia": ["bc", "british columbia"],
  manitoba: ["mb", "manitoba"],
  "new brunswick": ["nb", "new brunswick"],
  newfoundland: ["nl", "nf", "newfoundland", "newfoundland and labrador"],
  "northwest territories": ["nt", "nwt", "northwest territories"],
  "nova scotia": ["ns", "nova scotia"],
  nunavut: ["nu", "nunavut"],
  ontario: ["on", "ontario"],
  "prince edward island": ["pe", "pei", "prince edward island"],
  quebec: ["qc", "pq", "quebec"],
  saskatchewan: ["sk", "saskatchewan"],
  yukon: ["yt", "yukon", "yukon territory"],
};

export function canonicalProvinceName(provinceStr: string | null | undefined): string | null {
  if (!provinceStr) return null;
  const normalized = provinceStr.toLowerCase().trim();
  for (const [provinceName, abbreviations] of Object.entries(PROVINCE_MAP)) {
    if (
      abbreviations.some((abbr) => abbr.toLowerCase() === normalized) ||
      provinceName.toLowerCase() === normalized
    ) {
      return provinceName;
    }
  }
  return normalized;
}

/** When `authorized_provinces` is non-empty, search must match one of those provinces. Legacy: empty → allow. */
export function agentSearchMatchesAuthorizedProvinces(
  authorizedProvincesMetadata: unknown,
  searchProvinceSegment: string | null | undefined
): boolean {
  if (!searchProvinceSegment || !String(searchProvinceSegment).trim()) return true;

  const target = canonicalProvinceName(searchProvinceSegment);
  if (!target) return true;

  if (authorizedProvincesMetadata == null) return true;
  const raw = String(authorizedProvincesMetadata).trim();
  if (!raw) return true;

  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return true;

  return list.some((entry) => canonicalProvinceName(entry) === target);
}
