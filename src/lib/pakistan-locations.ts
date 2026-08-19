import citiesData from "./pakistan-cities-data.json";

export const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Azad Jammu & Kashmir",
  "Gilgit-Baltistan",
] as const;

export type PakistanProvince = (typeof PAKISTAN_PROVINCES)[number];

export type PakistanCity = { name: string; province: PakistanProvince; postalCode: string };

/**
 * Every Pakistan Post office in the official National Post Code Directory — both Part-I
 * (delivery post offices, ~2,500 of them once the head "GPO" entries are de-duplicated) and
 * Part-II (non-delivery post offices, ~740). Both parts are included here on purpose: a
 * non-delivery office still needs to be selectable so a customer whose town isn't serviced gets
 * a clear "we don't deliver there" message instead of not finding their town at all. Which
 * offices are actually non-deliverable is tracked separately via `ShippingZone` rows with
 * `excluded: true` (see the shipping-exclusions CSV imported through /admin/shipping) — this
 * file is just the reference list of valid place names, postal codes, and provinces.
 *
 * Data is large (3,300+ entries) so it lives in pakistan-cities-data.json rather than an inline
 * array. Multiple postal circles within one metro (e.g. Karachi's Saddar/Alhydri/City/New
 * Town/Korangi GPOs, Lahore's Cantt GPO) are collapsed into a single head-office city entry.
 * Where the same place name is used by more than one post office (or collides with a head-office
 * city name), the entry is disambiguated as "Name (Parent city)".
 */
export const PAKISTAN_CITIES: PakistanCity[] = citiesData as PakistanCity[];

const cityLookup = new Map(PAKISTAN_CITIES.map((c) => [c.name.toLowerCase(), c]));

/** Case/whitespace-insensitive lookup by exact city name. */
export function findPakistanCity(name: string): PakistanCity | undefined {
  return cityLookup.get(name.trim().toLowerCase());
}

export function isKnownPakistanCity(name: string): boolean {
  return cityLookup.has(name.trim().toLowerCase());
}

export const PAKISTAN_CITIES_BY_PROVINCE: Record<PakistanProvince, string[]> = Object.fromEntries(
  PAKISTAN_PROVINCES.map((province) => [
    province,
    PAKISTAN_CITIES.filter((c) => c.province === province).map((c) => c.name),
  ])
) as Record<PakistanProvince, string[]>;
