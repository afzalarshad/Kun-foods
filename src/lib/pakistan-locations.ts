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
 * Every city Pakistan Post treats as its own delivery "Account Office" (GPO), sourced from the
 * official National Post Code Directory (Part-I, Delivery Post Offices) — not a curated
 * shortlist. `postalCode` is that city's own GPO postal code, used as a sane default at
 * checkout/POS and to validate the city a customer selects. `province` resolves a city to its
 * province for province-wide shipping zones and delivery exclusions.
 *
 * Multiple postal circles within one metro (e.g. Karachi's Saddar/Alhydri/City/New Town/Korangi
 * GPOs, Lahore's Cantt GPO) are collapsed into a single city entry — customers pick "Karachi" or
 * "Lahore", not a specific postal circle. A handful of well-known towns (Gwadar, Swabi, Chiniot,
 * Zhob, Chaman, Badin, Thatta, Mingora) aren't present as their own Account Office in the source
 * directory — mail for them routes through a neighboring city's GPO — so they aren't listed here
 * as separate cities; add them manually with a verified postal code if the business needs to.
 */
export const PAKISTAN_CITIES: PakistanCity[] = [
  // Punjab
  { name: "Attock", province: "Punjab", postalCode: "43600" },
  { name: "Bahawalnagar", province: "Punjab", postalCode: "62300" },
  { name: "Bahawalpur", province: "Punjab", postalCode: "63100" },
  { name: "Bhakkar", province: "Punjab", postalCode: "30000" },
  { name: "Chakwal", province: "Punjab", postalCode: "48800" },
  { name: "Dera Ghazi Khan", province: "Punjab", postalCode: "32200" },
  { name: "Faisalabad", province: "Punjab", postalCode: "38000" },
  { name: "Gujar Khan", province: "Punjab", postalCode: "47850" },
  { name: "Gujranwala", province: "Punjab", postalCode: "52250" },
  { name: "Gujrat", province: "Punjab", postalCode: "50700" },
  { name: "Jhang", province: "Punjab", postalCode: "35200" },
  { name: "Jhelum", province: "Punjab", postalCode: "49600" },
  { name: "Kahuta", province: "Punjab", postalCode: "47330" },
  { name: "Kasur", province: "Punjab", postalCode: "55050" },
  { name: "Khanewal", province: "Punjab", postalCode: "58150" },
  { name: "Khushab", province: "Punjab", postalCode: "41000" },
  { name: "Lahore", province: "Punjab", postalCode: "54000" },
  { name: "Layyah", province: "Punjab", postalCode: "31200" },
  { name: "Mandi Bahauddin", province: "Punjab", postalCode: "50400" },
  { name: "Mianwali", province: "Punjab", postalCode: "42200" },
  { name: "Multan", province: "Punjab", postalCode: "60000" },
  { name: "Murree", province: "Punjab", postalCode: "47150" },
  { name: "Muzaffargarh", province: "Punjab", postalCode: "34200" },
  { name: "Narowal", province: "Punjab", postalCode: "51600" },
  { name: "Okara", province: "Punjab", postalCode: "56300" },
  { name: "Rahimyar Khan", province: "Punjab", postalCode: "64200" },
  { name: "Rawalpindi", province: "Punjab", postalCode: "46000" },
  { name: "Sahiwal", province: "Punjab", postalCode: "57000" },
  { name: "Sargodha", province: "Punjab", postalCode: "40100" },
  { name: "Sheikhupura", province: "Punjab", postalCode: "39350" },
  { name: "Sialkot", province: "Punjab", postalCode: "51310" },
  { name: "Talagang", province: "Punjab", postalCode: "48100" },
  { name: "Toba Tek Singh", province: "Punjab", postalCode: "36050" },
  { name: "Vehari", province: "Punjab", postalCode: "61100" },
  { name: "Wah Cantonment", province: "Punjab", postalCode: "47040" },
  // Sindh
  { name: "Dadu", province: "Sindh", postalCode: "76200" },
  { name: "Hyderabad", province: "Sindh", postalCode: "71000" },
  { name: "Jacobabad", province: "Sindh", postalCode: "79000" },
  { name: "Karachi", province: "Sindh", postalCode: "74200" },
  { name: "Khairpur", province: "Sindh", postalCode: "66020" },
  { name: "Larkana", province: "Sindh", postalCode: "77150" },
  { name: "Mirpur Khas", province: "Sindh", postalCode: "69000" },
  { name: "Nawabshah", province: "Sindh", postalCode: "67450" },
  { name: "Sanghar", province: "Sindh", postalCode: "68100" },
  { name: "Shikarpur", province: "Sindh", postalCode: "78100" },
  { name: "Sukkur", province: "Sindh", postalCode: "65200" },
  // Khyber Pakhtunkhwa
  { name: "Abbottabad", province: "Khyber Pakhtunkhwa", postalCode: "22010" },
  { name: "Bannu", province: "Khyber Pakhtunkhwa", postalCode: "28100" },
  { name: "Batkhela", province: "Khyber Pakhtunkhwa", postalCode: "23020" },
  { name: "Charsadda", province: "Khyber Pakhtunkhwa", postalCode: "24420" },
  { name: "Chitral", province: "Khyber Pakhtunkhwa", postalCode: "17200" },
  { name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa", postalCode: "29050" },
  { name: "Haripur", province: "Khyber Pakhtunkhwa", postalCode: "22620" },
  { name: "Karak", province: "Khyber Pakhtunkhwa", postalCode: "27200" },
  { name: "Kohat", province: "Khyber Pakhtunkhwa", postalCode: "26000" },
  { name: "Lakki Marwat", province: "Khyber Pakhtunkhwa", postalCode: "28420" },
  { name: "Mansehra", province: "Khyber Pakhtunkhwa", postalCode: "21300" },
  { name: "Mardan", province: "Khyber Pakhtunkhwa", postalCode: "23200" },
  { name: "Nowshera", province: "Khyber Pakhtunkhwa", postalCode: "24100" },
  { name: "Peshawar", province: "Khyber Pakhtunkhwa", postalCode: "25000" },
  { name: "Saidu Sharif", province: "Khyber Pakhtunkhwa", postalCode: "19200" },
  { name: "Tank", province: "Khyber Pakhtunkhwa", postalCode: "29400" },
  // Balochistan
  { name: "Khuzdar", province: "Balochistan", postalCode: "89100" },
  { name: "Loralai", province: "Balochistan", postalCode: "84800" },
  { name: "Nushki", province: "Balochistan", postalCode: "95200" },
  { name: "Quetta", province: "Balochistan", postalCode: "87300" },
  { name: "Sibi", province: "Balochistan", postalCode: "82000" },
  { name: "Turbat", province: "Balochistan", postalCode: "92600" },
  // Islamabad Capital Territory
  { name: "Islamabad", province: "Islamabad Capital Territory", postalCode: "44000" },
  // Azad Jammu & Kashmir
  { name: "Bagh", province: "Azad Jammu & Kashmir", postalCode: "12500" },
  { name: "Bhimber", province: "Azad Jammu & Kashmir", postalCode: "10040" },
  { name: "Kotli", province: "Azad Jammu & Kashmir", postalCode: "11100" },
  { name: "Mirpur", province: "Azad Jammu & Kashmir", postalCode: "10250" },
  { name: "Muzaffarabad", province: "Azad Jammu & Kashmir", postalCode: "13100" },
  { name: "Palandri", province: "Azad Jammu & Kashmir", postalCode: "12010" },
  { name: "Rawalakot", province: "Azad Jammu & Kashmir", postalCode: "12350" },
  // Gilgit-Baltistan
  { name: "Gilgit", province: "Gilgit-Baltistan", postalCode: "15100" },
  { name: "Skardu", province: "Gilgit-Baltistan", postalCode: "16100" },
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
