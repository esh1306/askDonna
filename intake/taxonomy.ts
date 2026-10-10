export const CATEGORIES = {
  plumbing: "Water supply, taps, toilets, drains, blockages, leaks, shower and bath fittings, pipes.",
  appliance: "Landlord-supplied appliances: oven, hob, dishwasher, washing machine, fridge, extractor fan.",
  doors_windows_locks: "Doors, windows, handles, hinges, locks, keys, glazing, balcony and patio doors.",
  garden_external: "Gardens, hedges, trees, fences, sheds, paths, communal outside areas, external pipes.",
  cleaning_checkout_works: "Check-out cleaning, carpet replacement, repainting, and post-tenancy works quotes requested by the agency.",
  electrical_lighting: "Lighting, sockets, switches, fuse board, wiring, ceiling fittings.",
  heating_hot_water: "Boiler, radiators, heating controls, no hot water, no heating.",
  inspection_admin: "Inspections, meter or solar readings, photos, paperwork and other non-repair admin tasks.",
  other: "Anything that fits none of the above.",
} as const;

export type Category = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export const SEVERITIES = {
  routine: "Not urgent: inconvenience, cosmetic or wear-and-tear issue; can be scheduled in the normal course (weeks).",
  urgent: "Needs attention within days: affects normal use of the home (e.g. no cooking, no washing, door will not lock properly) but no immediate danger.",
  emergency: "Safety risk or damage in progress: active leak or flooding, gas smell, electrical danger, no heating in winter, no hot water for vulnerable people, insecure property (cannot lock external door, broken entry window).",
} as const;

export type Severity = keyof typeof SEVERITIES;
export const SEVERITY_KEYS = Object.keys(SEVERITIES) as Severity[];
