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

export type PakistanCity = { name: string; province: PakistanProvince };

/**
 * A curated set of major Pakistani cities/towns per province — not exhaustive (a fully
 * exhaustive list would run to thousands of towns), but covers where the vast majority of
 * orders will ship. Used to validate the city a customer selects at checkout/POS and to
 * resolve a city to its province for province-wide shipping zones and delivery exclusions.
 */
export const PAKISTAN_CITIES: PakistanCity[] = [
  // Punjab
  { name: "Lahore", province: "Punjab" },
  { name: "Faisalabad", province: "Punjab" },
  { name: "Rawalpindi", province: "Punjab" },
  { name: "Multan", province: "Punjab" },
  { name: "Gujranwala", province: "Punjab" },
  { name: "Sialkot", province: "Punjab" },
  { name: "Bahawalpur", province: "Punjab" },
  { name: "Sargodha", province: "Punjab" },
  { name: "Sheikhupura", province: "Punjab" },
  { name: "Jhang", province: "Punjab" },
  { name: "Rahim Yar Khan", province: "Punjab" },
  { name: "Gujrat", province: "Punjab" },
  { name: "Kasur", province: "Punjab" },
  { name: "Sahiwal", province: "Punjab" },
  { name: "Okara", province: "Punjab" },
  { name: "Wah Cantonment", province: "Punjab" },
  { name: "Dera Ghazi Khan", province: "Punjab" },
  { name: "Mianwali", province: "Punjab" },
  { name: "Chiniot", province: "Punjab" },
  { name: "Kamoke", province: "Punjab" },
  { name: "Muzaffargarh", province: "Punjab" },
  { name: "Jhelum", province: "Punjab" },
  { name: "Vehari", province: "Punjab" },
  { name: "Attock", province: "Punjab" },
  { name: "Bahawalnagar", province: "Punjab" },
  // Sindh
  { name: "Karachi", province: "Sindh" },
  { name: "Hyderabad", province: "Sindh" },
  { name: "Sukkur", province: "Sindh" },
  { name: "Larkana", province: "Sindh" },
  { name: "Mirpur Khas", province: "Sindh" },
  { name: "Nawabshah", province: "Sindh" },
  { name: "Jacobabad", province: "Sindh" },
  { name: "Shikarpur", province: "Sindh" },
  { name: "Khairpur", province: "Sindh" },
  { name: "Dadu", province: "Sindh" },
  { name: "Thatta", province: "Sindh" },
  { name: "Badin", province: "Sindh" },
  // Khyber Pakhtunkhwa
  { name: "Peshawar", province: "Khyber Pakhtunkhwa" },
  { name: "Mardan", province: "Khyber Pakhtunkhwa" },
  { name: "Abbottabad", province: "Khyber Pakhtunkhwa" },
  { name: "Mingora (Swat)", province: "Khyber Pakhtunkhwa" },
  { name: "Kohat", province: "Khyber Pakhtunkhwa" },
  { name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa" },
  { name: "Bannu", province: "Khyber Pakhtunkhwa" },
  { name: "Swabi", province: "Khyber Pakhtunkhwa" },
  { name: "Nowshera", province: "Khyber Pakhtunkhwa" },
  { name: "Charsadda", province: "Khyber Pakhtunkhwa" },
  { name: "Mansehra", province: "Khyber Pakhtunkhwa" },
  // Balochistan
  { name: "Quetta", province: "Balochistan" },
  { name: "Gwadar", province: "Balochistan" },
  { name: "Turbat", province: "Balochistan" },
  { name: "Khuzdar", province: "Balochistan" },
  { name: "Sibi", province: "Balochistan" },
  { name: "Chaman", province: "Balochistan" },
  { name: "Zhob", province: "Balochistan" },
  // Islamabad Capital Territory
  { name: "Islamabad", province: "Islamabad Capital Territory" },
  // Azad Jammu & Kashmir
  { name: "Muzaffarabad", province: "Azad Jammu & Kashmir" },
  { name: "Mirpur (AJK)", province: "Azad Jammu & Kashmir" },
  { name: "Rawalakot", province: "Azad Jammu & Kashmir" },
  // Gilgit-Baltistan
  { name: "Gilgit", province: "Gilgit-Baltistan" },
  { name: "Skardu", province: "Gilgit-Baltistan" },
];

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
