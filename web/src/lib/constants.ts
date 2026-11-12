export const CATEGORIES = [
  "Appliances & HVAC",
  "Cabinets & counters",
  "Deck, fence & outdoor",
  "Doors, windows & trim",
  "Driveways & hardscape",
  "Drywall & insulation",
  "Electrical & lighting",
  "Flooring, tile & stone",
  "Kitchen & bath",
  "Landscaping",
  "Lumber & sheet goods",
  "Paint & adhesives",
  "Plumbing",
  "Roofing",
  "Tools & equipment",
  "Other",
] as const;

/** Short examples shown under the category picker on Post / Edit. */
export const CATEGORY_HINTS: Partial<Record<(typeof CATEGORIES)[number], string>> = {
  "Appliances & HVAC": "Stoves, dishwashers, water heaters, window units, ceiling fans, vents and ductwork.",
  "Driveways & hardscape": "Pavers, concrete, gravel, limestone, edging, forms.",
  "Tools & equipment":
    "Saws, tile cutters, ladders, power and hand tools, lawnmowers and yard equipment. A lawnmower can go under Tools & equipment or Landscaping.",
  Landscaping:
    "Sod, mulch, plants, planter beds (raised beds), planting pots, landscape rock, soil, irrigation parts, lawnmowers. A lawnmower can go under Landscaping or Tools & equipment.",
  Other: "Anything that doesn't fit another category.",
};

export const CONDITIONS = [
  "New unused",
  "Open box",
  "Like new",
  "Good",
  "Fair",
  "Parts / salvage",
] as const;

export const INTENTS = ["Swap", "Sell", "Sell or Swap", "Fast & Free"] as const;

export const ACTIVE_STATUSES = [
  "Pending Review",
  "Approved",
  "Claimed",
] as const;

export const LISTING_STATUSES = [
  "Pending Review",
  "Approved",
  "Claimed",
  "Rejected",
  "Expired",
  "Deleted",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Intent = (typeof INTENTS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
