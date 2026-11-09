export const CATEGORIES = [
  "Lumber & sheet goods",
  "Drywall & insulation",
  "Roofing",
  "Flooring, tile & stone",
  "Paint & adhesives",
  "Doors, windows & trim",
  "Kitchen & bath",
  "Cabinets & counters",
  "Electrical & lighting",
  "Plumbing",
  "Tools",
  "Deck, fence & outdoor",
  "Driveways & hardscape",
  "Landscaping",
] as const;

/** Short examples shown under the category picker on Post / Edit. */
export const CATEGORY_HINTS: Partial<Record<(typeof CATEGORIES)[number], string>> = {
  "Driveways & hardscape": "Pavers, concrete, gravel, limestone, edging, forms.",
  Tools: "Saws, tile cutters, ladders, power and hand tools.",
  Landscaping:
    "Sod, mulch, plants, planter beds (raised beds), planting pots, landscape rock, soil, irrigation parts.",
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
