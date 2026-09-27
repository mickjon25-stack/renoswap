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
  "Tools & equipment",
  "Deck, fence & outdoor",
] as const;

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
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Intent = (typeof INTENTS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
