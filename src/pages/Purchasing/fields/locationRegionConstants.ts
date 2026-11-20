/**
 * Separation of Region (Geographic Divisions / States / Cities / Countries)
 * and Location (Legal Entities / Operating Locations / Branches).
 * Seeded from the 64 master records imported from QuickBooks.
 */

export const DEFAULT_REGIONS: string[] = [
  "Arkansas",
  "Atlanta",
  "Australia",
  "Baton Rouge, Louisiana",
  "Berlin (Germany)",
  "Brazil",
  "Chicago, IL",
  "Coconut Creek, FL",
  "Colombia",
  "Dallas, TX",
  "Dubai",
  "Dublin (Ireland)",
  "Ireland",
  "Japan",
  "Ketchum, ID",
  "Korea",
  "Lake Mary, FL",
  "London (UK)",
  "Los Angeles, CA",
  "Louisville, KY",
  "Mesa, AZ",
  "Sharjah, UAE",
  "Sudbury, MA / Colleyville, TX",
  "Taiwan",
  "Toronto, ON",
  "Turkey",
  "United Kingdom",
  "Vancouver, BC",
  "Vietnam",
  "Washington, DC",
  "West Palm Beach, FL",
  "West Sacramento, CA",
];

export const DEFAULT_LOCATIONS: string[] = [
  "Advocate CPA",
  "A & J Land Surveyors, Inc.",
  "Andrew Spiewak Land Surveyor, Inc.",
  "Cardinal Civil Resources",
  "Cardinal Civil Resources (Manassas, VA)",
  "Cardinal Civil Resources (Rock Hill, SC)",
  "Cardinal Civil Resources (Virginia Beach, VA)",
  "Cardinal Civil Resources (Waynesboro, VA)",
  "Cardinal Civil Resources (Williamsburg, VA)",
  "Casado Design Ltd",
  "DaaS (Orlando)",
  "High Prairie Survey Co.",
  "Holt Surveying & Mapping, Inc.",
  "KJM Land Surveying LLC",
  "Laventure & Associates Inc",
  "L.D. King Engineering",
  "Lescure Engineers, Inc.",
  "Miller Land Surveying Corporation",
  "Morgan Surveying, Inc.",
  "Putt Land Surveying, Inc.",
  "Rampart Surveys, LLC",
  "Smith Surveying Group",
  "Spider Sensors (Taiwan)",
  "Sunrise Window Cleaners",
  "The Dunes Golf and Beach Club",
  "Vara 3D Inc. (Murray, UT)",
  "Wallace Surveying Corporation",
  "Weddle Surveying, Inc.",
  "ZenaAI (Baton Rouge, LA)",
  "Zenadrone (Turkey)",
  "Zenatech Inc. (McDonough, GA)",
  "Zenatech Inc. (Richardson, TX)",
];

const REGION_SET = new Set(DEFAULT_REGIONS.map((r) => r.trim().toLowerCase()));

export function isRegionName(name?: string | null): boolean {
  if (!name) return false;
  return REGION_SET.has(name.trim().toLowerCase());
}
