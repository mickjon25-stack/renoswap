/* RenoSwap — Texas-first reno materials marketplace (browser-only demo) */
const CATEGORIES = [
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
  "Deck, fence & outdoor"
];

const CONDITIONS = [
  "New unused",
  "Open box",
  "Like new",
  "Good",
  "Fair",
  "Parts / salvage"
];

const INTENTS = ["Swap", "Sell", "Sell or Swap", "Fast & Free"];

const ACTIVE_STATUSES = ["Pending Review", "Approved", "Claimed"];

function placeholder(n, label) {
  return Array.from({ length: n }, (_, i) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>
      <rect fill='#cbbba4' width='800' height='500'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-size='42' fill='#5a4e3d' font-family='Georgia'>${label} ${i + 1}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  });
}

const SEED = [
  {
    id: "l1",
    title: 'Leftover 3/4" sanded plywood, 7 sheets',
    category: "Lumber & sheet goods",
    intent: "Fast & Free",
    condition: "Good",
    description:
      "Seven 4x8 sheets from a kitchen floor job. Edges are clean. Must go before the dumpster pickup.",
    looking_for: "",
    price: 0,
    city: "Moulton",
    zip: "77975",
    pickup_ok: true,
    shipping_ok: false,
    fast_window: 24,
    photos: placeholder(3, "Plywood"),
    poster: "u_contractor",
    status: "Approved",
    approved_at: Date.now() - 3 * 3600 * 1000,
    expires_at: Date.now() + 21 * 3600 * 1000,
    dumpster_bound: true
  },
  {
    id: "l2",
    title: "Unused subway tile, 4 boxes",
    category: "Flooring, tile & stone",
    intent: "Swap",
    condition: "New unused",
    description: "White 3x6 subway tile left from a guest bath. Four unopened boxes.",
    looking_for: "Interior slab door or leftover quartz remnants",
    price: 0,
    city: "La Grange",
    zip: "78945",
    pickup_ok: true,
    shipping_ok: false,
    photos: placeholder(3, "Tile"),
    poster: "u_home",
    status: "Approved",
    approved_at: Date.now() - 2 * 86400 * 1000,
    expires_at: Date.now() + 43 * 86400 * 1000
  },
  {
    id: "l3",
    title: "Kohler faucet, brushed nickel",
    category: "Kitchen & bath",
    intent: "Sell or Swap",
    condition: "Open box",
    description:
      "Open box kitchen faucet. All parts in the box. Changed finish direction mid-project.",
    looking_for: "LED can lights or a wet saw",
    price: 85,
    city: "Gonzales",
    zip: "78629",
    pickup_ok: true,
    shipping_ok: true,
    photos: placeholder(3, "Faucet"),
    poster: "u_home",
    status: "Approved",
    approved_at: Date.now() - 5 * 86400 * 1000,
    expires_at: Date.now() + 40 * 86400 * 1000
  },
  {
    id: "l4",
    title: "Framing nailer + two fuel packs",
    category: "Tools & equipment",
    intent: "Sell",
    condition: "Good",
    description: "Paslode-style framing nailer. Fires well. Cosmetic scuffs only.",
    looking_for: "",
    price: 140,
    city: "Shiner",
    zip: "77984",
    pickup_ok: true,
    shipping_ok: true,
    photos: placeholder(3, "Nailer"),
    poster: "u_contractor",
    status: "Approved",
    approved_at: Date.now() - 1 * 86400 * 1000,
    expires_at: Date.now() + 44 * 86400 * 1000
  },
  {
    id: "l5",
    title: 'Interior slab door, 30" hollow core',
    category: "Doors, windows & trim",
    intent: "Swap",
    condition: "Good",
    description:
      "Paint-grade hollow core door from a closet remodel. Includes hinges. Ready to swap for tile or bath leftovers.",
    looking_for: "Subway tile, quartz remnant, or bath faucet",
    price: 0,
    city: "Moulton",
    zip: "77975",
    pickup_ok: true,
    shipping_ok: false,
    photos: placeholder(3, "Door"),
    poster: "u_me",
    status: "Approved",
    approved_at: Date.now() - 4 * 3600 * 1000,
    expires_at: Date.now() + 41 * 86400 * 1000
  }
];

const DEMO_PASSWORD = "demo";

/** Demo-only password encoding — NOT real security. */
function demoHash(pw) {
  try {
    return "demo$" + btoa(unescape(encodeURIComponent(String(pw || ""))));
  } catch (_) {
    return "demo$" + String(pw || "");
  }
}

function demoPasswordOk(pw, stored) {
  if (!stored) return false;
  const s = String(stored);
  if (s === String(pw || "")) return true; // legacy plain
  return s === demoHash(pw);
}

function blankUserExtras() {
  return {
    email: "",
    password: "",
    city: "",
    zip: "",
    bio: "",
    company: "",
    avatar: "",
    profileComplete: false,
    subscribed: false,
    admin: false,
    blocked: [],
    notifyEnabled: false,
    notifyMatches: true,
    notifyInterest: true,
    notifyMessages: true,
    watchKeywords: "",
    notifyPermission: "default",
    lastNotifyScan: 0,
    notifiedListingIds: [],
    notifiedOfferIds: [],
    notifiedMessageIds: [],
    notifyPromptDismissed: false
  };
}

const USERS = {
  u_me: {
    id: "u_me",
    name: "You",
    email: "you@renoswap.demo",
    password: demoHash(DEMO_PASSWORD),
    role: "Homeowner",
    contractor: false,
    subscribed: false,
    city: "Moulton",
    zip: "77975",
    bio: "Demo homeowner account for walkthroughs.",
    company: "",
    profileComplete: true,
    admin: false
  },
  u_home: {
    id: "u_home",
    name: "Elena R.",
    email: "elena@renoswap.demo",
    password: demoHash(DEMO_PASSWORD),
    role: "Homeowner",
    contractor: false,
    subscribed: false,
    city: "La Grange",
    zip: "78945",
    bio: "Remodeling a guest bath.",
    company: "",
    profileComplete: true,
    admin: false
  },
  u_contractor: {
    id: "u_contractor",
    name: "Hill Country Builds",
    email: "builds@renoswap.demo",
    password: demoHash(DEMO_PASSWORD),
    role: "Contractor",
    contractor: true,
    subscribed: false,
    city: "Shiner",
    zip: "77984",
    bio: "Residential remodel crew — leftover materials welcome.",
    company: "Hill Country Builds",
    profileComplete: true,
    admin: false
  },
  u_admin: {
    id: "u_admin",
    name: "Admin",
    email: "admin@renoswap.demo",
    password: demoHash(DEMO_PASSWORD),
    role: "Admin",
    contractor: false,
    subscribed: true,
    city: "Austin",
    zip: "78701",
    bio: "Demo admin for listing review.",
    company: "",
    profileComplete: true,
    admin: true
  }
};

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function freshData() {
  const data = {
    listings: structuredClone(SEED),
    offers: [],
    threads: [],
    messages: [],
    reports: [],
    currentUser: null,
    users: structuredClone(USERS)
  };
  seedSampleThreads(data);
  return data;
}

function seedSampleThreads(data) {
  if ((data.threads && data.threads.length) || (data.messages && data.messages.length)) {
    return;
  }
  const t1 = {
    id: "t_seed1",
    listingId: "l2",
    offerId: null,
    participants: ["u_me", "u_home"],
    created_at: Date.now() - 2 * 86400 * 1000,
    updated_at: Date.now() - 90 * 60 * 1000,
    lastRead: { u_home: Date.now() - 80 * 60 * 1000 }
  };
  const t2 = {
    id: "t_seed2",
    listingId: "l4",
    offerId: null,
    participants: ["u_me", "u_contractor"],
    created_at: Date.now() - 1 * 86400 * 1000,
    updated_at: Date.now() - 3 * 3600 * 1000,
    lastRead: { u_me: Date.now() - 2 * 3600 * 1000, u_contractor: Date.now() }
  };
  data.threads = [t1, t2];
  data.messages = [
    {
      id: "m_seed1",
      threadId: "t_seed1",
      from: "u_me",
      body: "Hi Elena — I have an interior slab door that might work for your tile. Interested in a swap?",
      at: Date.now() - 2 * 86400 * 1000
    },
    {
      id: "m_seed2",
      threadId: "t_seed1",
      from: "u_home",
      body: "Possibly! What size is the door? Looking for a standard 28–30 inch hollow core.",
      at: Date.now() - 90 * 60 * 1000
    },
    {
      id: "m_seed3",
      threadId: "t_seed2",
      from: "u_me",
      body: "Is the framing nailer still available? I can do cash Saturday in Shiner.",
      at: Date.now() - 5 * 3600 * 1000
    },
    {
      id: "m_seed4",
      threadId: "t_seed2",
      from: "u_contractor",
      body: "Still available. Saturday afternoon works — jobsite near FM 533.",
      at: Date.now() - 3 * 3600 * 1000
    }
  ];

}

const SEED_TIMER_OFFSETS = {
  l1: { approvedAgo: 3 * 3600 * 1000, expiresIn: 21 * 3600 * 1000 },
  l2: { approvedAgo: 2 * 86400 * 1000, expiresIn: 43 * 86400 * 1000 },
  l3: { approvedAgo: 5 * 86400 * 1000, expiresIn: 40 * 86400 * 1000 },
  l4: { approvedAgo: 1 * 86400 * 1000, expiresIn: 44 * 86400 * 1000 },
  l5: { approvedAgo: 4 * 3600 * 1000, expiresIn: 41 * 86400 * 1000 }
};

function mergeMissingSeedListings(data) {
  if (!Array.isArray(data.listings)) data.listings = [];
  const have = new Set(data.listings.map((l) => l.id));
  const now = Date.now();
  SEED.forEach((seed) => {
    if (have.has(seed.id)) return;
    const copy = structuredClone(seed);
    const off = SEED_TIMER_OFFSETS[seed.id];
    if (off) {
      copy.approved_at = now - off.approvedAgo;
      copy.expires_at = now + off.expiresIn;
    }
    data.listings.push(copy);
  });
}

/** Elena's pending swap on l5 — independent of other seed threads. */
function ensureElenaDoorOffer(data) {
  if (!(data.listings || []).some((l) => l.id === "l5")) return;
  if (!Array.isArray(data.offers)) data.offers = [];
  if (!Array.isArray(data.threads)) data.threads = [];
  if (!Array.isArray(data.messages)) data.messages = [];
  if (data.offers.some((o) => o.id === "o_seed1")) return;

  const at = Date.now() - 40 * 60 * 1000;
  data.offers.unshift({
    id: "o_seed1",
    listingId: "l5",
    offeredListingId: "l2",
    from: "u_home",
    type: "Swap",
    message: 'Would you trade your 30" door for my 4 boxes of subway tile?',
    status: "Pending",
    at
  });
  if (!data.threads.some((t) => t.id === "t_seed3")) {
    data.threads.push({
      id: "t_seed3",
      listingId: "l5",
      offerId: "o_seed1",
      participants: ["u_me", "u_home"],
      created_at: at,
      updated_at: at,
      lastRead: {}
    });
  }
  if (!data.messages.some((m) => m.id === "m_seed5")) {
    data.messages.push({
      id: "m_seed5",
      threadId: "t_seed3",
      from: "u_home",
      body: 'Would you trade your 30" door for my 4 boxes of subway tile?',
      at
    });
  }
}

function normalizeUser(u, id) {
  const seed = USERS[id] || null;
  const base = blankUserExtras();
  const out = Object.assign(base, seed ? structuredClone(seed) : {}, u || {}, { id: id || (u && u.id) || uid("u") });
  if (!out.name) out.name = seed ? seed.name : "User";
  if (out.contractor == null) out.contractor = out.role === "Contractor";
  if (!out.role) out.role = out.contractor ? "Contractor" : "Homeowner";
  if (out.subscribed == null) out.subscribed = false;
  if (out.admin == null) out.admin = !!out.admin || out.role === "Admin";
  if (!Array.isArray(out.blocked)) out.blocked = [];
  if (out.avatar == null) out.avatar = "";
  if (out.profileComplete == null) {
    // Existing seed accounts / prior sessions count as complete once migrated.
    out.profileComplete = !!(out.email || seed);
  }
  if (out.email && out.password && !String(out.password).startsWith("demo$")) {
    // leave plain passwords as-is for demoPasswordOk legacy check
  }
  if (seed && !out.email) out.email = seed.email;
  if (seed && !out.password) out.password = seed.password;
  if (seed && !out.city) out.city = seed.city;
  if (seed && !out.zip) out.zip = seed.zip;
  if (out.notifyEnabled == null) out.notifyEnabled = false;
  if (out.notifyMatches == null) out.notifyMatches = true;
  if (out.notifyInterest == null) out.notifyInterest = true;
  if (out.notifyMessages == null) out.notifyMessages = true;
  if (out.watchKeywords == null) out.watchKeywords = "";
  if (out.notifyPermission == null) out.notifyPermission = "default";
  if (out.lastNotifyScan == null) out.lastNotifyScan = 0;
  if (!Array.isArray(out.notifiedListingIds)) out.notifiedListingIds = [];
  if (!Array.isArray(out.notifiedOfferIds)) out.notifiedOfferIds = [];
  if (!Array.isArray(out.notifiedMessageIds)) out.notifiedMessageIds = [];
  if (out.notifyPromptDismissed == null) out.notifyPromptDismissed = false;
  return out;
}

function ensureUsersMap(data) {
  if (!data.users || typeof data.users !== "object") {
    data.users = structuredClone(USERS);
  }
  // Ensure seed users exist without wiping custom fields on them.
  Object.keys(USERS).forEach((id) => {
    if (!data.users[id]) {
      data.users[id] = structuredClone(USERS[id]);
    } else {
      data.users[id] = normalizeUser(data.users[id], id);
    }
  });
  Object.keys(data.users).forEach((id) => {
    data.users[id] = normalizeUser(data.users[id], id);
  });
}

function sessionUser(data) {
  const id = data.currentUser;
  if (!id) return null;
  return data.users[id] || null;
}

function needsAuth(data) {
  const u = sessionUser(data);
  return !u || !u.profileComplete;
}

function ensureSchema(data) {
  if (!Array.isArray(data.offers)) data.offers = [];
  if (!Array.isArray(data.threads)) data.threads = [];
  if (!Array.isArray(data.messages)) data.messages = [];
  if (!Array.isArray(data.reports)) data.reports = [];
  ensureUsersMap(data);
  // Do not force-login as u_me; null/missing means show welcome/login.
  if (data.currentUser === undefined) data.currentUser = null;
  if (data.currentUser && !data.users[data.currentUser]) data.currentUser = null;
  mergeMissingSeedListings(data);
  data.offers.forEach((o) => {
    if (!o.listingId && o.listing) o.listingId = o.listing;
    if (!o.id) o.id = uid("o");
    if (!o.status) o.status = "Pending";
  });
  data.threads.forEach((t) => {
    if (!t.lastRead) t.lastRead = {};
    if (!Array.isArray(t.participants)) t.participants = [];
  });
  seedSampleThreads(data);
  ensureElenaDoorOffer(data);
  return data;
}

const db = {
  get() {
    const raw = localStorage.getItem("renoswap_v1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.listings)) {
          return ensureSchema(parsed);
        }
      } catch (_) {
        /* fall through to seed */
      }
    }
    const data = freshData();
    localStorage.setItem("renoswap_v1", JSON.stringify(data));
    return data;
  },
  save(data) {
    localStorage.setItem("renoswap_v1", JSON.stringify(data));
  }
};

let state = {
  view: "browse",
  listingId: null,
  threadId: null,
  intentFilter: "All",
  q: "",
  category: "All",
  searchZip: null, // null → default to profile ZIP when logged in
  radiusMiles: null, // null = Anywhere in Texas; else 25 | 50 | 100
  sortBy: "expiry", // "expiry" | "distance"
  pickOfferedId: null,
  authScreen: "welcome", // welcome | create | signin | demo
  editingProfile: false,
  avatarDraft: undefined, // undefined=keep | null=cleared | string=dataURL
  profileNotice: null, // brief success banner after Save profile
  reportTarget: null, // { kind, listingId?, userId? } | null
  filtersOpen: false // mobile browse filters disclosure
};

let countdownTimer = null;

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function expireListings(data) {
  const now = Date.now();
  data.listings.forEach((l) => {
    if (
      (l.status === "Approved" || l.status === "Claimed") &&
      l.expires_at &&
      l.expires_at < now
    ) {
      l.status = "Expired";
    }
  });
}

function activeCount(data, userId) {
  return data.listings.filter(
    (l) => l.poster === userId && ACTIVE_STATUSES.includes(l.status)
  ).length;
}

function canPost(data, userId) {
  const me = data.users[userId];
  const count = activeCount(data, userId);
  if (me.subscribed) return true;
  return count < 3;
}

function badgeClass(intent) {
  if (intent === "Fast & Free") return "free";
  if (intent === "Sell") return "sell";
  return "swap";
}

function timeLeft(ts) {
  const ms = ts - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m ${s}s left`;
}

function liveCountdownParts(ts) {
  const ms = Math.max(0, ts - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { ms, d, h, m, s, urgent: ms > 0 && ms < 6 * 3600000 };
}

function formatCountdown(ts) {
  const { ms, d, h, m, s } = liveCountdownParts(ts);
  if (ms <= 0) return "Expired";
  if (d > 0) return `${d}d ${h}h ${m}m ${String(s).padStart(2, "0")}s`;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function userBy(id) {
  return db.get().users[id];
}

/**
 * True Texas ZIP check (v1).
 * Approach: allowlist of USPS 3-digit ZIP prefixes assigned to Texas —
 * 750–799 (statewide), 733 (Austin unique), 885 (El Paso PO Boxes).
 * City stays free-text; only the ZIP must pass this check.
 */
const TX_ZIP_PREFIXES = (function () {
  const s = new Set(["733", "885"]);
  for (let i = 750; i <= 799; i++) s.add(String(i));
  return s;
})();

function isTexasZip(zip) {
  const z = String(zip || "").trim();
  if (!/^\d{5}$/.test(z)) return false;
  return TX_ZIP_PREFIXES.has(z.slice(0, 3));
}

/**
 * Compact TX ZIP → lat/lng for near-me distance (Haversine miles).
 *
 * Approach:
 * 1. Exact ZIPs for seed towns + common metro/city centers (best accuracy).
 * 2. Fallback: 3-digit USPS prefix → approximate region centroid
 *    (covers any TX ZIP we accept via isTexasZip, at coarser resolution).
 * 3. Unknown / non-TX → null; listing still shows, distance rendered as "—".
 * Not a GIS product — good enough for demo radius filters within Texas.
 */
const TX_ZIP_EXACT = {
  // Seed listings / demo profiles
  "77975": [29.5736, -97.1425], // Moulton
  "78945": [29.9052, -96.8767], // La Grange
  "78629": [29.5016, -97.4525], // Gonzales
  "77984": [29.4291, -97.1703], // Shiner
  "78701": [30.2711, -97.7437], // Austin downtown (admin seed)
  // Major metros / common cities
  "78702": [30.2632, -97.7140],
  "78704": [30.2457, -97.7689],
  "78745": [30.2072, -97.7970],
  "78757": [30.3500, -97.7270],
  "78613": [30.5052, -97.8203], // Cedar Park
  "78664": [30.5083, -97.6789], // Round Rock
  "78666": [29.8833, -97.9414], // San Marcos
  "78130": [29.7030, -98.1245], // New Braunfels
  "78155": [29.5541, -97.9670], // Seguin
  "78626": [30.6332, -97.6780], // Georgetown
  "77833": [30.1674, -96.3977], // Brenham
  "77840": [30.6280, -96.3344], // College Station
  "77801": [30.6723, -96.3700], // Bryan
  "77901": [28.8053, -97.0036], // Victoria
  "77904": [28.8660, -96.9900],
  "77401": [29.7050, -95.4600], // Bellaire / Houston area
  "77002": [29.7569, -95.3656], // Houston downtown
  "77006": [29.7410, -95.3910],
  "77019": [29.7530, -95.4070],
  "77024": [29.7630, -95.5140],
  "77056": [29.7480, -95.4670],
  "77098": [29.7350, -95.4140],
  "77429": [29.9900, -95.5900], // Cypress
  "77433": [29.9400, -95.7300], // Cypress W
  "77494": [29.7400, -95.8300], // Katy
  "77573": [29.5070, -95.0950], // League City
  "77546": [29.5200, -95.2000], // Friendswood
  "77380": [30.1600, -95.4700], // The Woodlands
  "77339": [30.0500, -95.2600], // Kingwood
  "78201": [29.4690, -98.5300], // San Antonio
  "78205": [29.4241, -98.4936],
  "78209": [29.4900, -98.4600],
  "78212": [29.4500, -98.5000],
  "78216": [29.5300, -98.5100],
  "78230": [29.5500, -98.5600],
  "78240": [29.5300, -98.6100],
  "78245": [29.4200, -98.7000],
  "78258": [29.6400, -98.4900],
  "78006": [29.7940, -98.7320], // Boerne
  "78015": [29.7900, -98.7400],
  "78028": [30.0474, -99.1403], // Kerrville
  "78023": [29.5600, -98.7600], // Helotes
  "78108": [29.5600, -98.2700], // Cibolo
  "78148": [29.5400, -98.2800], // Universal City
  "78154": [29.5700, -98.3000], // Schertz
  "75201": [32.7872, -96.7984], // Dallas
  "75204": [32.8020, -96.7890],
  "75206": [32.8350, -96.7700],
  "75214": [32.8230, -96.7400],
  "75219": [32.8120, -96.8150],
  "75225": [32.8600, -96.7900],
  "75230": [32.9000, -96.7800],
  "75001": [32.9600, -96.8400], // Addison
  "75024": [33.0800, -96.8400], // Plano
  "75025": [33.0900, -96.7500],
  "75034": [33.2000, -96.6200], // Frisco
  "75035": [33.1700, -96.7000],
  "75056": [33.1200, -96.9000], // The Colony
  "75063": [32.9300, -96.9900], // Irving
  "75067": [33.0200, -97.0000], // Lewisville
  "75070": [33.2000, -96.6400], // McKinney
  "75074": [33.0200, -96.7000], // Plano E
  "75080": [32.9600, -96.7300], // Richardson
  "75093": [33.0400, -96.8400], // Plano W
  "75104": [32.5900, -96.9500], // Cedar Hill
  "75115": [32.6000, -96.8700], // DeSoto
  "75150": [32.8000, -96.6300], // Mesquite
  "75165": [32.3500, -96.8500], // Waxahachie
  "76001": [32.6500, -97.1700], // Arlington
  "76006": [32.7700, -97.1000],
  "76010": [32.7300, -97.1000],
  "76012": [32.7700, -97.1500],
  "76013": [32.7200, -97.1700],
  "76016": [32.6900, -97.2300],
  "76017": [32.6600, -97.1700],
  "76102": [32.7555, -97.3308], // Fort Worth
  "76107": [32.7400, -97.3800],
  "76109": [32.7100, -97.3700],
  "76116": [32.7300, -97.4400],
  "76132": [32.6700, -97.4100],
  "76133": [32.6600, -97.3800],
  "76137": [32.8600, -97.2900],
  "76201": [33.2148, -97.1331], // Denton
  "76226": [33.1200, -97.0900], // Argyle
  "76227": [33.2000, -96.9900], // Aubrey
  "76244": [32.9300, -97.2500], // Keller/N FW
  "76248": [32.9300, -97.2300], // Keller
  "76262": [32.9800, -97.2500], // Roanoke
  "76051": [32.9400, -97.0200], // Grapevine
  "76092": [32.9400, -97.1500], // Southlake
  "76177": [32.9800, -97.3100],
  "79901": [31.7587, -106.4869], // El Paso
  "79902": [31.7800, -106.4900],
  "79912": [31.8400, -106.5400],
  "79924": [31.8600, -106.4300],
  "79925": [31.7800, -106.3600],
  "79936": [31.7600, -106.3000],
  "79401": [33.5779, -101.8552], // Lubbock
  "79416": [33.5900, -101.9300],
  "79424": [33.5300, -101.9400],
  "79101": [35.2070, -101.8330], // Amarillo
  "79106": [35.2000, -101.8700],
  "79109": [35.1700, -101.9000],
  "76901": [31.4638, -100.4370], // San Angelo
  "76904": [31.4000, -100.4800],
  "79701": [31.9973, -102.0779], // Midland
  "79707": [32.0300, -102.1600],
  "79761": [31.8457, -102.3676], // Odessa
  "79762": [31.8800, -102.3400],
  "79601": [32.4487, -99.7331], // Abilene
  "79606": [32.3900, -99.8000],
  "76701": [31.5493, -97.1467], // Waco
  "76710": [31.5400, -97.2000],
  "76712": [31.5200, -97.2200],
  "76502": [31.0980, -97.3400], // Temple
  "76504": [31.1000, -97.3700],
  "76513": [31.0600, -97.4700], // Belton
  "76522": [31.1300, -97.9000], // Copperas Cove
  "76542": [31.1200, -97.7300], // Killeen
  "76549": [31.0900, -97.7700],
  "77859": [30.5800, -96.0700], // Hearne
  "78602": [30.1000, -97.3200], // Bastrop
  "78610": [30.0400, -97.8700], // Buda
  "78617": [30.1500, -97.6200], // Del Valle
  "78620": [30.1900, -98.0900], // Dripping Springs
  "78640": [30.0000, -97.8600], // Kyle
  "78641": [30.5600, -97.8700], // Leander
  "78645": [30.4400, -97.9800], // Lago Vista
  "78653": [30.3500, -97.5300], // Manor
  "78660": [30.4300, -97.6200], // Pflugerville
  "78681": [30.5200, -97.7100], // Round Rock NW
  "78934": [29.7900, -96.9700], // Columbus
  "78941": [29.7200, -97.0700], // Flatonia
  "78942": [30.1000, -96.8700], // Giddings
  "78956": [29.6800, -97.1100], // Schulenburg
  "77957": [29.2900, -96.5400], // Edna
  "77964": [29.4500, -96.8400], // Hallettsville
  "77954": [29.1800, -97.3000], // Cuero
  "78102": [28.4400, -97.7500], // Beeville
  "78363": [27.8000, -97.4000], // Kingsville
  "78401": [27.8006, -97.3964], // Corpus Christi
  "78411": [27.7300, -97.3900],
  "78413": [27.6800, -97.4000],
  "78414": [27.6500, -97.3800],
  "78418": [27.6200, -97.2500],
  "78501": [26.2034, -98.2300], // McAllen
  "78504": [26.2700, -98.2300],
  "78521": [25.9017, -97.4975], // Brownsville
  "78526": [25.9500, -97.4800],
  "78539": [26.3000, -98.1600], // Edinburg
  "78550": [26.1900, -97.7000], // Harlingen
  "78572": [26.1600, -98.3200], // Mission
  "78577": [26.2200, -98.3300], // Pharr
  "78596": [26.1600, -97.9900], // Weslaco
  "77701": [30.0802, -94.1266], // Beaumont
  "77706": [30.1000, -94.1600],
  "77630": [30.0900, -93.7400], // Orange
  "77642": [29.8800, -93.9300], // Port Arthur
  "75901": [31.3382, -94.7291], // Lufkin
  "75904": [31.3400, -94.7800],
  "75601": [32.5007, -94.7405], // Longview
  "75604": [32.5200, -94.8000],
  "75701": [32.3513, -95.3011], // Tyler
  "75703": [32.2900, -95.3200],
  "75501": [33.4251, -94.0477], // Texarkana
  "75401": [33.1384, -96.1100], // Greenville
  "75087": [32.9300, -96.4500], // Rockwall
  "75160": [32.7700, -96.2800], // Terrell
  "75126": [32.6500, -96.4700], // Forney
  "75032": [32.9100, -96.4600], // Heath/Rockwall
  "75098": [33.0100, -96.5400], // Wylie
  "75002": [33.0900, -96.6700], // Allen
  "75069": [33.2000, -96.6200], // McKinney alt
  "75071": [33.2200, -96.6400]
};

/** 3-digit TX ZIP prefix → approximate centroid [lat, lng]. */
const TX_ZIP_PREFIX_CENTROID = {
  "733": [30.27, -97.74], // Austin unique
  "885": [31.76, -106.49], // El Paso PO Boxes
  "750": [33.02, -96.80], // N Dallas / Plano / Frisco
  "751": [32.65, -96.70], // SE DFW
  "752": [32.78, -96.80], // Dallas
  "753": [32.78, -96.80],
  "754": [33.20, -96.10], // NE Texas
  "755": [33.40, -94.10], // Texarkana
  "756": [32.50, -94.70], // Longview / ETX
  "757": [32.35, -95.30], // Tyler
  "758": [31.70, -95.50], // Palestine area
  "759": [31.30, -94.70], // Lufkin / deep ETX
  "760": [32.70, -97.15], // Arlington / Mid-Cities
  "761": [32.75, -97.33], // Fort Worth
  "762": [33.20, -97.15], // Denton / N FW
  "763": [33.90, -98.50], // Wichita Falls
  "764": [32.70, -98.10], // Mineral Wells
  "765": [31.10, -97.50], // Killeen / Temple
  "766": [31.60, -97.00], // Hillsboro / Waco fringe
  "767": [31.55, -97.15], // Waco
  "768": [31.70, -99.00], // Brownwood
  "769": [31.46, -100.44], // San Angelo
  "770": [29.76, -95.37], // Houston core
  "771": [29.76, -95.37],
  "772": [29.76, -95.37],
  "773": [30.15, -95.40], // N Houston / Woodlands / Conroe
  "774": [29.70, -95.70], // W Houston / Katy / Sugar Land
  "775": [29.50, -95.10], // SE Houston / Galveston
  "776": [30.00, -94.00], // Beaumont / Port Arthur
  "777": [30.08, -94.13], // Beaumont
  "778": [30.60, -96.30], // Bryan / College Station
  "779": [28.80, -97.00], // Victoria / Lavaca (Moulton/Shiner)
  "780": [29.40, -98.90], // Hill Country / SA west
  "781": [29.40, -98.20], // SA east / New Braunfels
  "782": [29.42, -98.49], // San Antonio
  "783": [27.80, -97.40], // Corpus / Coastal Bend
  "784": [27.80, -97.40], // Corpus Christi
  "785": [26.20, -98.20], // RGV / McAllen / Brownsville
  "786": [30.20, -97.70], // Austin metro / Central TX (Gonzales fringe)
  "787": [30.27, -97.74], // Austin
  "788": [29.00, -99.50], // Uvalde / SW
  "789": [29.90, -96.90], // La Grange / Columbus corridor
  "790": [35.20, -101.80], // Amarillo / Panhandle
  "791": [35.21, -101.83], // Amarillo
  "792": [34.50, -100.50], // Childress / Panhandle
  "793": [33.60, -102.40], // Levelland / S Plains
  "794": [33.58, -101.86], // Lubbock
  "795": [32.80, -100.00], // Abilene fringe
  "796": [32.45, -99.73], // Abilene
  "797": [31.90, -102.30], // Midland / Odessa
  "798": [31.00, -104.50], // Alpine / Far West
  "799": [31.76, -106.49] // El Paso
};

function zipCoords(zip) {
  const z = String(zip || "").trim();
  if (!/^\d{5}$/.test(z)) return null;
  if (TX_ZIP_EXACT[z]) return TX_ZIP_EXACT[z];
  const prefix = z.slice(0, 3);
  if (TX_ZIP_PREFIX_CENTROID[prefix]) return TX_ZIP_PREFIX_CENTROID[prefix];
  return null;
}

/** Great-circle distance in miles (Haversine). */
function milesBetween(a, b) {
  if (!a || !b) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h =
    s1 * s1 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatMiles(mi) {
  if (mi == null || !Number.isFinite(mi)) return "—";
  if (mi < 10) return Math.round(mi * 10) / 10 + " mi";
  return Math.round(mi) + " mi";
}

function effectiveSearchZip(data) {
  const raw = state.searchZip;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).trim();
  }
  const me = data.users[data.currentUser];
  return (me && me.zip) || "";
}

function tokenizeMatch(s) {
  return String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "your", "our",
  "any", "or", "leftover", "unused", "new", "like", "good", "open", "box"
]);

/**
 * Score how well an offered listing matches a target's looking_for
 * (plus light title/category token overlap). Higher = better match.
 */
function scoreSwapMatch(offered, target) {
  if (!offered || !target) return 0;
  let score = 0;
  const looking = tokenizeMatch(target.looking_for);
  const hay = tokenizeMatch(
    [offered.title, offered.category, offered.description].join(" ")
  );
  const haySet = new Set(hay);
  const titleLower = String(offered.title || "").toLowerCase();
  const catLower = String(offered.category || "").toLowerCase();
  for (const t of looking) {
    if (haySet.has(t)) score += 4;
    else if (titleLower.includes(t)) score += 3;
    else if (catLower.includes(t)) score += 2;
  }
  if (target.category && offered.category === target.category) score += 1;
  // Title tokens of target vs offered looking_for (mutual interest hint)
  const theirTitle = tokenizeMatch(target.title);
  const myLooking = tokenizeMatch(offered.looking_for);
  for (const t of myLooking) {
    if (theirTitle.includes(t) || String(target.title || "").toLowerCase().includes(t)) {
      score += 1;
    }
  }
  return score;
}

/** Browse: other Approved listings that overlap viewer's looking_for texts. */
function browseMatchesForYou(data, pool) {
  const meId = data.currentUser;
  if (!meId) return [];
  const myLooking = data.listings
    .filter(
      (l) =>
        l.poster === meId &&
        l.status === "Approved" &&
        String(l.looking_for || "").trim()
    )
    .map((l) => l.looking_for);
  if (!myLooking.length) return [];
  const fakeTarget = { looking_for: myLooking.join(" "), category: "", title: "" };
  return pool
    .filter((l) => l.poster !== meId && l.status === "Approved")
    .map((l) => ({ l, score: scoreSwapMatch(l, fakeTarget) }))
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.l);
}

/* ——— Browser notifications (Notification API, tab-open demo) ——— */
let notifyPollTimer = null;
const NOTIFY_POLL_MS = 45000;
const NOTIFIED_CAP = 200;

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function notifyPlain(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[&<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function syncNotifyPermissionSnapshot(me) {
  if (!me) return;
  if (!notificationsSupported()) {
    me.notifyPermission = "unsupported";
    return;
  }
  me.notifyPermission = Notification.permission;
}

function notificationsAllowed(me) {
  if (!me || !me.notifyEnabled) return false;
  if (!notificationsSupported()) return false;
  return Notification.permission === "granted";
}

function pushNotifiedId(arr, id) {
  if (!id) return;
  if (arr.includes(id)) return;
  arr.push(id);
  while (arr.length > NOTIFIED_CAP) arr.shift();
}

function fireAppNotification(title, body, opts) {
  opts = opts || {};
  if (!notificationsSupported() || Notification.permission !== "granted") return null;
  try {
    const n = new Notification(notifyPlain(title) || "RenoSwap", {
      body: notifyPlain(body),
      tag: opts.tag || undefined,
      silent: false
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch (_) {}
      if (opts.listingId) go("detail", opts.listingId);
      else if (opts.threadId) goThread(opts.threadId);
      else if (opts.view) go(opts.view);
      try {
        n.close();
      } catch (_) {}
    };
    return n;
  } catch (_) {
    return null;
  }
}

/** Tokens from Approved listings' looking_for + watchKeywords. */
function userInterestTokens(data, me) {
  if (!me) return [];
  const parts = [];
  (data.listings || []).forEach((l) => {
    if (l.poster === me.id && l.status === "Approved" && String(l.looking_for || "").trim()) {
      parts.push(l.looking_for);
    }
  });
  if (String(me.watchKeywords || "").trim()) parts.push(me.watchKeywords);
  return tokenizeMatch(parts.join(" "));
}

function listingMatchScoreForUser(listing, tokens) {
  if (!listing || !tokens.length) return 0;
  const fakeTarget = { looking_for: tokens.join(" "), category: "", title: "" };
  return scoreSwapMatch(listing, fakeTarget);
}

async function requestNotifyPermission() {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me) return;
  if (!notificationsSupported()) {
    alert("This browser does not support notifications.");
    syncNotifyPermissionSnapshot(me);
    db.save(data);
    render();
    return;
  }
  let perm = Notification.permission;
  if (perm === "default") {
    try {
      perm = await Notification.requestPermission();
    } catch (_) {
      perm = Notification.permission;
    }
  }
  me.notifyPermission = perm;
  if (perm === "granted") {
    me.notifyEnabled = true;
    if (me.notifyMatches == null) me.notifyMatches = true;
    if (me.notifyInterest == null) me.notifyInterest = true;
    if (me.notifyMessages == null) me.notifyMessages = true;
  } else {
    me.notifyEnabled = false;
  }
  db.save(data);
  render();
  if (perm === "granted") scanAndNotify(db.get(), { baseline: true });
}

function setNotifyEnabled(on) {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me) return;
  if (on) {
    if (!notificationsSupported()) {
      alert("This browser does not support notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      me.notifyEnabled = true;
      syncNotifyPermissionSnapshot(me);
      db.save(data);
      render();
      scanAndNotify(db.get(), { baseline: true });
      return;
    }
    if (Notification.permission === "denied") {
      me.notifyEnabled = false;
      syncNotifyPermissionSnapshot(me);
      db.save(data);
      render();
      return;
    }
    requestNotifyPermission();
    return;
  }
  me.notifyEnabled = false;
  syncNotifyPermissionSnapshot(me);
  db.save(data);
  render();
}

function setNotifyPref(key, value) {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me) return;
  if (!["notifyMatches", "notifyInterest", "notifyMessages"].includes(key)) return;
  me[key] = !!value;
  db.save(data);
  render();
}

function saveWatchKeywords(e) {
  e.preventDefault();
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me) return;
  const fd = new FormData(e.target);
  me.watchKeywords = String(fd.get("watchKeywords") || "")
    .trim()
    .slice(0, 200);
  db.save(data);
  state.profileNotice = "Watch keywords saved.";
  render();
  scanAndNotify(db.get(), { refreshMatches: true });
}

function dismissNotifyPrompt() {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me) return;
  me.notifyPromptDismissed = true;
  db.save(data);
  render();
}

function notifyBannerHTML(me) {
  if (!me || !notificationsSupported()) return "";
  syncNotifyPermissionSnapshot(me);
  if (Notification.permission === "denied") return "";
  if (Notification.permission === "granted" && me.notifyEnabled) return "";
  if (me.notifyPromptDismissed && Notification.permission !== "default") return "";
  if (Notification.permission === "default" && me.notifyPromptDismissed) {
    // soft: still show once in a while? Spec: soft banner if default. Allow dismiss.
    // If dismissed while default, hide until Account.
    return "";
  }
  if (Notification.permission === "granted" && !me.notifyEnabled) {
    return `
      <div class="notify-banner" role="status">
        <div>
          <strong>Browser permission is on</strong>
          <p class="help" style="margin:4px 0 0">Turn on RenoSwap alerts for matching listings, offers, and messages.</p>
        </div>
        <div class="notify-banner-actions">
          <button type="button" class="primary" onclick="setNotifyEnabled(true)">Enable alerts</button>
          <button type="button" class="ghost" onclick="dismissNotifyPrompt()">Not now</button>
        </div>
      </div>`;
  }
  if (Notification.permission === "default" && !me.notifyPromptDismissed) {
    return `
      <div class="notify-banner" role="status">
        <div>
          <strong>Turn on notifications for swaps &amp; buys</strong>
          <p class="help" style="margin:4px 0 0">Get pinged when a listing matches what you are looking for, or when someone wants your materials.</p>
        </div>
        <div class="notify-banner-actions">
          <button type="button" class="primary" onclick="requestNotifyPermission()">Allow</button>
          <button type="button" class="ghost" onclick="dismissNotifyPrompt()">Not now</button>
        </div>
      </div>`;
  }
  return "";
}

function notifySettingsHTML(me) {
  if (!me) return "";
  syncNotifyPermissionSnapshot(me);
  const supported = notificationsSupported();
  const perm = supported ? Notification.permission : "unsupported";
  const permLabel =
    perm === "granted"
      ? "Granted"
      : perm === "denied"
        ? "Denied"
        : perm === "unsupported"
          ? "Not supported in this browser"
          : "Not asked yet (default)";
  const deniedHelp =
    perm === "denied"
      ? `<p class="help">Notifications were blocked. Re-enable them in your browser site settings for this page, then use Allow again here.</p>`
      : "";
  const subDisabled = !(perm === "granted" && me.notifyEnabled);
  return `
    <div class="panel notify-settings" style="margin-top:16px;background:#f3eee4;box-shadow:none">
      <h3 style="margin-top:0;font-size:16px">Notifications</h3>
      <p class="help" style="margin-top:0">Browser alerts while RenoSwap is open in this tab (demo — no push server).</p>
      <p class="meta">Permission: <b>${escapeHtml(permLabel)}</b></p>
      ${deniedHelp}
      <label class="notify-toggle">
        <input type="checkbox" ${me.notifyEnabled && perm === "granted" ? "checked" : ""} ${
          !supported || perm === "denied" ? "disabled" : ""
        } onchange="setNotifyEnabled(this.checked)" />
        <span>Allow notifications</span>
      </label>
      <div class="notify-subprefs" style="opacity:${subDisabled ? "0.55" : "1"}">
        <label class="notify-toggle">
          <input type="checkbox" ${me.notifyMatches !== false ? "checked" : ""} ${
            subDisabled ? "disabled" : ""
          } onchange="setNotifyPref('notifyMatches', this.checked)" />
          <span>Alert me when listings match my “looking for”</span>
        </label>
        <label class="notify-toggle">
          <input type="checkbox" ${me.notifyInterest !== false ? "checked" : ""} ${
            subDisabled ? "disabled" : ""
          } onchange="setNotifyPref('notifyInterest', this.checked)" />
          <span>Alert me when someone wants to buy/swap/claim my listings</span>
        </label>
        <label class="notify-toggle">
          <input type="checkbox" ${me.notifyMessages !== false ? "checked" : ""} ${
            subDisabled ? "disabled" : ""
          } onchange="setNotifyPref('notifyMessages', this.checked)" />
          <span>Alert me for new messages</span>
        </label>
      </div>
      <form onsubmit="saveWatchKeywords(event)" class="watch-keywords-form">
        <div class="field" style="margin-bottom:8px">
          <label>Watch keywords (comma-separated)</label>
          <input name="watchKeywords" maxlength="200" value="${escapeAttr(me.watchKeywords || "")}" placeholder="quartz, wet saw, subway tile" />
        </div>
        <button class="ghost" type="submit">Save keywords</button>
      </form>
      ${
        perm === "default"
          ? `<div class="actions" style="margin-top:10px"><button type="button" class="primary" onclick="requestNotifyPermission()">Allow notifications</button></div>`
          : ""
      }
    </div>`;
}

function scanAndNotify(data, opts) {
  opts = opts || {};
  const me = data && data.users[data.currentUser];
  if (!me || !notificationsAllowed(me)) return;
  const firstScan = !Number(me.lastNotifyScan);
  const baseline = !!opts.baseline || firstScan;
  const since = baseline ? Number.MAX_SAFE_INTEGER : Number(me.lastNotifyScan) || 0;
  const now = Date.now();

  if (me.notifyMatches !== false) {
    const tokens = userInterestTokens(data, me);
    if (tokens.length) {
      (data.listings || []).forEach((l) => {
        if (!l || l.poster === me.id || l.status !== "Approved") return;
        if ((me.notifiedListingIds || []).includes(l.id)) return;
        const when = Number(l.approved_at) || 0;
        if (!baseline && !opts.refreshMatches) {
          if (when && when <= since) return;
          if (!when && since > 0) return;
        }
        const score = listingMatchScoreForUser(l, tokens);
        if (score < 3) return;
        pushNotifiedId(me.notifiedListingIds, l.id);
        if (baseline) return;
        fireAppNotification(
          "Listing matches what you're looking for",
          (l.title || "Listing") + " · " + (l.intent || "Listing"),
          { tag: "match-" + l.id, listingId: l.id }
        );
      });
    }
  }

  if (me.notifyInterest !== false) {
    (data.offers || []).forEach((o) => {
      if (!o || o.from === me.id) return;
      if ((me.notifiedOfferIds || []).includes(o.id)) return;
      const l = listingById(data, o.listingId || o.listing);
      if (!l || l.poster !== me.id) return;
      const when = Number(o.at) || 0;
      if (!baseline && when && when <= since) return;
      pushNotifiedId(me.notifiedOfferIds, o.id);
      if (!baseline) {
        const kind =
          o.type === "Claim Free"
            ? "Fast & Free claim"
            : (o.type || "Offer") + " offer";
        fireAppNotification(
          "Someone is interested in your listing",
          kind + ' on "' + (l.title || "listing") + '"',
          { tag: "offer-" + o.id, listingId: l.id }
        );
      }
      // Dedupe auto-messages created with the offer/claim
      (data.messages || []).forEach((m) => {
        if (m.from !== o.from) return;
        if (Math.abs((m.at || 0) - (o.at || 0)) > 5000) return;
        const th = (data.threads || []).find((t) => t.id === m.threadId);
        if (!th || th.listingId !== l.id) return;
        pushNotifiedId(me.notifiedMessageIds, m.id);
      });
    });
  }

  if (me.notifyMessages !== false) {
    (data.messages || []).forEach((m) => {
      if (!m || m.from === me.id) return;
      if ((me.notifiedMessageIds || []).includes(m.id)) return;
      const thread = (data.threads || []).find((t) => t.id === m.threadId);
      if (!thread || !(thread.participants || []).includes(me.id)) return;
      const when = Number(m.at) || 0;
      if (!baseline && when && when <= since) return;
      pushNotifiedId(me.notifiedMessageIds, m.id);
      if (baseline) return;
      const listing = listingById(data, thread.listingId);
      const fromUser = userBy(m.from);
      fireAppNotification(
        "New message" + (fromUser ? " from " + fromUser.name : ""),
        m.body,
        {
          tag: "msg-" + m.id,
          threadId: thread.id,
          listingId: listing && listing.id
        }
      );
    });
  }

  me.lastNotifyScan = now;
  syncNotifyPermissionSnapshot(me);
  db.save(data);
}

function ensureNotifyPolling() {
  if (notifyPollTimer) return;
  notifyPollTimer = setInterval(() => {
    const data = db.get();
    if (needsAuth(data)) return;
    scanAndNotify(data);
  }, NOTIFY_POLL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const data = db.get();
      if (!needsAuth(data)) scanAndNotify(data);
    }
  });
}

const REPORT_REASONS = [
  "Wrong category",
  "Not reno materials",
  "Scam or suspicious",
  "No-show risk",
  "Other"
];

function blockedIds(user) {
  return (user && Array.isArray(user.blocked) ? user.blocked : []).slice();
}

function isUserBlocked(me, otherId) {
  if (!me || !otherId) return false;
  return blockedIds(me).includes(otherId);
}

function messagingBlocked(data, otherId) {
  const me = data.users[data.currentUser];
  const other = data.users[otherId];
  return isUserBlocked(me, otherId) || isUserBlocked(other, data.currentUser);
}

function blockUser(userId) {
  if (!userId) return;
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me || userId === data.currentUser) return;
  if (!Array.isArray(me.blocked)) me.blocked = [];
  if (!me.blocked.includes(userId)) me.blocked.push(userId);
  db.save(data);
  state.reportTarget = null;
  render();
}

function unblockUser(userId) {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me || !Array.isArray(me.blocked)) return;
  me.blocked = me.blocked.filter((id) => id !== userId);
  db.save(data);
  render();
}

function openReport(kind, listingId, userId) {
  state.reportTarget = {
    kind: kind, // "listing" | "user"
    listingId: listingId || null,
    userId: userId || null
  };
  render();
  window.scrollTo(0, 0);
}

function cancelReport() {
  state.reportTarget = null;
  render();
}

function submitReport(e) {
  e.preventDefault();
  const data = db.get();
  const t = state.reportTarget;
  if (!t) return;
  const fd = new FormData(e.target);
  const reason = String(fd.get("reason") || "").trim();
  const note = String(fd.get("note") || "").trim().slice(0, 400);
  if (!REPORT_REASONS.includes(reason)) {
    alert("Pick a report reason.");
    return;
  }
  data.reports.unshift({
    id: uid("r"),
    reporter: data.currentUser,
    kind: t.kind,
    listingId: t.listingId || null,
    targetUserId: t.userId || null,
    reason,
    note,
    at: Date.now(),
    status: "Pending"
  });
  db.save(data);
  state.reportTarget = null;
  alert("Report submitted. Thanks — an admin will review it.");
  render();
}

function reportFormHTML(data) {
  const t = state.reportTarget;
  if (!t) return "";
  const listing = t.listingId ? listingById(data, t.listingId) : null;
  const target = t.userId ? userBy(t.userId) : null;
  const heading =
    t.kind === "listing"
      ? `Report listing${listing ? ": " + escapeHtml(listing.title) : ""}`
      : `Report user${target ? ": " + escapeHtml(target.name) : ""}`;
  return `
    <div class="panel report-panel" style="margin-bottom:14px">
      <h3 style="margin-top:0">${heading}</h3>
      <p class="help">Reports go to the demo admin queue. No real enforcement.</p>
      <form onsubmit="submitReport(event)">
        <div class="field"><label>Reason *</label>
          <select name="reason" required>
            <option value="">Select…</option>
            ${REPORT_REASONS.map((r) => `<option value="${escapeAttr(r)}">${escapeHtml(r)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Optional note</label>
          <textarea name="note" rows="2" maxlength="400" placeholder="Anything an admin should know"></textarea>
        </div>
        <div class="actions">
          <button class="danger" type="submit">Submit report</button>
          <button class="ghost" type="button" onclick="cancelReport()">Cancel</button>
        </div>
      </form>
    </div>`;
}

function resolveReport(id, status) {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me || !me.admin) return;
  const r = (data.reports || []).find((x) => x.id === id);
  if (!r || r.status !== "Pending") return;
  r.status = status; // Resolved | Dismissed
  r.resolved_at = Date.now();
  r.resolved_by = data.currentUser;
  db.save(data);
  render();
}

function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
  );
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function listingById(data, id) {
  return data.listings.find((x) => x.id === id);
}

function offerById(data, id) {
  return data.offers.find((x) => x.id === id);
}

function threadUnreadCount(data, thread, userId) {
  const since = (thread.lastRead && thread.lastRead[userId]) || 0;
  return data.messages.filter(
    (m) => m.threadId === thread.id && m.from !== userId && m.at > since
  ).length;
}

function totalUnread(data, userId) {
  return data.threads
    .filter((t) => t.participants.includes(userId))
    .reduce((n, t) => n + threadUnreadCount(data, t, userId), 0);
}

function markThreadRead(data, threadId, userId) {
  const t = data.threads.find((x) => x.id === threadId);
  if (!t) return;
  if (!t.lastRead) t.lastRead = {};
  t.lastRead[userId] = Date.now();
}

function findOrCreateThread(data, listingId, otherUserId, offerId) {
  const me = data.currentUser;
  let thread = data.threads.find(
    (t) =>
      t.listingId === listingId &&
      t.participants.includes(me) &&
      t.participants.includes(otherUserId) &&
      (offerId ? t.offerId === offerId : !t.offerId || t.offerId === null)
  );
  if (!thread && offerId) {
    thread = data.threads.find(
      (t) =>
        t.listingId === listingId &&
        t.participants.includes(me) &&
        t.participants.includes(otherUserId) &&
        t.offerId === offerId
    );
  }
  if (!thread) {
    thread = {
      id: uid("t"),
      listingId,
      offerId: offerId || null,
      participants: [me, otherUserId],
      created_at: Date.now(),
      updated_at: Date.now(),
      lastRead: { [me]: Date.now() }
    };
    data.threads.unshift(thread);
  } else if (offerId && !thread.offerId) {
    thread.offerId = offerId;
  }
  return thread;
}

function addMessage(data, threadId, body, from) {
  const msg = {
    id: uid("m"),
    threadId,
    from: from || data.currentUser,
    body: String(body || "").trim(),
    at: Date.now()
  };
  if (!msg.body) return null;
  data.messages.push(msg);
  const t = data.threads.find((x) => x.id === threadId);
  if (t) t.updated_at = msg.at;
  return msg;
}

function render() {
  clearCountdown();
  const data = db.get();
  expireListings(data);
  db.save(data);

  if (needsAuth(data)) {
    const authScreen = state.authScreen || "welcome";
    const showSignInTop =
      authScreen !== "signin"
        ? `<button class="ghost" type="button" onclick="setAuthScreen('signin')">Sign in</button>`
        : "";
    document.getElementById("app").innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand" onclick="setAuthScreen('welcome')">
            <div class="logo">RS</div>
            <div>
              <h1>RenoSwap</h1>
              <span>Texas first · swap first</span>
            </div>
          </div>
          <nav class="nav" aria-label="Auth">${showSignInTop}</nav>
        </header>
        <main class="wrap">${authHTML(data)}</main>
      </div>`;
    return;
  }

  const unread = totalUnread(data, data.currentUser);
  const msgLabel =
    unread > 0
      ? `Messages <span class="nav-badge">${unread > 9 ? "9+" : unread}</span>`
      : "Messages";
  const msgBadgeOnly =
    unread > 0
      ? `<span class="nav-badge">${unread > 9 ? "9+" : unread}</span>`
      : "";
  const isAdmin = !!(sessionUser(data) && sessionUser(data).admin);
  const bottomBrowse =
    state.view === "browse" || state.view === "detail" ? "active" : "";
  const bottomPost =
    state.view === "post" || state.view === "propose" ? "active" : "";
  const bottomMessages =
    state.view === "messages" || state.view === "thread" ? "active" : "";
  const bottomAccount =
    state.view === "account" || state.view === "mine" ? "active" : "";
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand" onclick="go('browse')">
          <div class="logo">RS</div>
          <div>
            <h1>RenoSwap</h1>
            <span>Texas first · swap first</span>
          </div>
        </div>
        <nav class="nav top-nav" aria-label="Desktop">
          <button class="nav-desktop ${state.view === "browse" ? "active" : ""}" onclick="go('browse')">Browse</button>
          <button class="nav-desktop ${state.view === "post" ? "active" : ""}" onclick="go('post')">Post</button>
          <button class="nav-desktop ${state.view === "mine" ? "active" : ""}" onclick="go('mine')">My listings</button>
          <button class="nav-desktop ${
            state.view === "messages" || state.view === "thread" ? "active" : ""
          }" onclick="go('messages')">${msgLabel}</button>
          ${
            isAdmin
              ? `<button class="nav-admin ${state.view === "admin" ? "active" : ""}" onclick="go('admin')">Admin</button>`
              : ""
          }
          <button class="nav-desktop ${state.view === "account" ? "active" : ""}" onclick="go('account')">Account</button>
          <button type="button" class="topbar-user" onclick="go('account')" title="Account" aria-label="Account">
            ${avatarHTML(sessionUser(data), "sm")}
          </button>
        </nav>
      </header>
      <main class="wrap">${notifyBannerHTML(sessionUser(data))}${viewHTML(data)}</main>
      <nav class="bottom-nav" aria-label="Primary">
        <button type="button" class="${bottomBrowse}" onclick="go('browse')">
          <span class="bn-icon" aria-hidden="true">⌂</span>
          <span class="bn-label">Browse</span>
        </button>
        <button type="button" class="${bottomPost}" onclick="go('post')">
          <span class="bn-icon" aria-hidden="true">＋</span>
          <span class="bn-label">Post</span>
        </button>
        <button type="button" class="${bottomMessages}" onclick="go('messages')">
          <span class="bn-icon bn-msg" aria-hidden="true">✉${msgBadgeOnly}</span>
          <span class="bn-label">Messages</span>
        </button>
        <button type="button" class="${bottomAccount}" onclick="go('account')">
          <span class="bn-icon" aria-hidden="true">☺</span>
          <span class="bn-label">Account</span>
        </button>
      </nav>
    </div>`;

  if (state.view === "detail") startCountdownIfNeeded(data);
  if (state.view === "post") {
    const sel = document.querySelector('select[name="intent"]');
    if (sel) togglePostFields(sel.value);
  }
  if (state.view === "thread") {
    const box = document.getElementById("msgCompose");
    if (box) box.focus();
    const scroller = document.getElementById("msgList");
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }
  ensureNotifyPolling();
  scanAndNotify(data);
}

function startCountdownIfNeeded(data) {
  const l = data.listings.find((x) => x.id === state.listingId);
  if (!l || l.intent !== "Fast & Free" || !l.expires_at) return;
  if (!["Approved", "Claimed"].includes(l.status)) return;

  const tick = () => {
    const el = document.getElementById("liveCountdown");
    if (!el) {
      clearCountdown();
      return;
    }
    const parts = liveCountdownParts(l.expires_at);
    el.textContent = formatCountdown(l.expires_at);
    el.classList.toggle("urgent", parts.urgent || parts.ms <= 0);
    if (parts.ms <= 0) {
      clearCountdown();
      const data2 = db.get();
      expireListings(data2);
      db.save(data2);
      render();
    }
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function go(view, listingId) {
  if (view === "admin") {
    const data = db.get();
    const me = sessionUser(data);
    if (!me || !me.admin) {
      state.view = "browse";
      state.reportTarget = null;
      render();
      window.scrollTo(0, 0);
      return;
    }
  }
  state.view = view;
  if (listingId !== undefined) state.listingId = listingId;
  if (view !== "thread") state.threadId = null;
  if (view !== "propose") state.pickOfferedId = null;
  if (view !== "detail" && view !== "thread") state.reportTarget = null;
  if (view !== "account") {
    state.editingProfile = false;
    state.profileNotice = null;
  }
  render();
  window.scrollTo(0, 0);
}

function goThread(threadId) {
  state.view = "thread";
  state.threadId = threadId;
  const data = db.get();
  markThreadRead(data, threadId, data.currentUser);
  db.save(data);
  render();
  window.scrollTo(0, 0);
}

function setAuthScreen(screen) {
  state.authScreen = screen || "welcome";
  if (screen === "create") state.avatarDraft = undefined;
  render();
}

function userInitials(name) {
  const parts = String(name || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarHue(key) {
  let h = 0;
  const s = String(key || "x");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** size: xs | sm | md | lg */
function avatarHTML(u, size) {
  size = size || "sm";
  const name = (u && u.name) || "User";
  const cls = `avatar avatar-${size}`;
  if (u && u.avatar) {
    return `<span class="${cls}" title="${escapeAttr(name)}"><img src="${escapeAttr(u.avatar)}" alt="" /></span>`;
  }
  const hue = avatarHue((u && u.id) || name);
  return `<span class="${cls} avatar-fallback" style="--avatar-hue:${hue}" title="${escapeAttr(name)}" aria-hidden="true">${escapeHtml(userInitials(name))}</span>`;
}

function effectiveAvatarUrl(existing) {
  if (state.avatarDraft === null) return "";
  if (typeof state.avatarDraft === "string") return state.avatarDraft;
  return existing || "";
}

function avatarEditorHTML(existingAvatar, previewName) {
  const url = effectiveAvatarUrl(existingAvatar);
  const previewUser = {
    id: "preview",
    name: previewName || "You",
    avatar: url || ""
  };
  const preview = avatarHTML(previewUser, "lg");
  const hasPhoto = !!url;
  return `
    <div class="field avatar-field">
      <label>Profile photo</label>
      <div class="avatar-editor">
        <div id="avatarPreview">${preview}</div>
        <div class="avatar-editor-actions">
          <label class="ghost file-btn">${hasPhoto ? "Change photo" : "Choose photo"}
            <input type="file" accept="image/*" hidden onchange="onAvatarPicked(event)" />
          </label>
          <button type="button" class="ghost" id="avatarClearBtn" style="display:${hasPhoto ? "inline-flex" : "none"}" onclick="clearAvatarDraft()">Remove photo</button>
        </div>
      </div>
      <p class="help">Upload a new photo, preview it, or remove it. Resized to ~256px and stored in this browser only.</p>
    </div>`;
}

function compressImageFile(file, maxPx, quality) {
  maxPx = maxPx || 256;
  quality = quality == null ? 0.72 : quality;
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || "").startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Image is too large (max 8MB before compress)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (!w || !h) {
          reject(new Error("Could not read image dimensions."));
          return;
        }
        const scale = Math.min(1, maxPx / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let out = "";
        try {
          out = canvas.toDataURL("image/webp", quality);
        } catch (_) {
          out = "";
        }
        if (!out || !out.startsWith("data:image/webp") || out.length > 140000) {
          out = canvas.toDataURL("image/jpeg", quality);
        }
        if (out.length > 180000) {
          out = canvas.toDataURL("image/jpeg", 0.55);
        }
        if (out.length > 220000) {
          out = canvas.toDataURL("image/jpeg", 0.4);
        }
        resolve(out);
      };
      img.onerror = () => reject(new Error("Could not load that image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

async function onAvatarPicked(e) {
  const input = e.target;
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const dataUrl = await compressImageFile(file);
    state.avatarDraft = dataUrl;
    const preview = document.getElementById("avatarPreview");
    if (preview) {
      preview.innerHTML = avatarHTML({ id: "preview", name: "You", avatar: dataUrl }, "lg");
    }
    const clearBtn = document.getElementById("avatarClearBtn");
    if (clearBtn) clearBtn.style.display = "inline-flex";
  } catch (err) {
    alert((err && err.message) || "Could not use that image.");
  }
  input.value = "";
}

function clearAvatarDraft() {
  state.avatarDraft = null;
  const preview = document.getElementById("avatarPreview");
  if (preview) {
    preview.innerHTML = avatarHTML({ id: "preview", name: "You", avatar: "" }, "lg");
  }
  const clearBtn = document.getElementById("avatarClearBtn");
  if (clearBtn) clearBtn.style.display = "none";
}

function applyAvatarDraft(user) {
  if (!user) return;
  if (state.avatarDraft === null) user.avatar = "";
  else if (typeof state.avatarDraft === "string") user.avatar = state.avatarDraft;
  state.avatarDraft = undefined;
}

function profileBadgeHTML(u, opts) {
  if (!u) return `<span class="meta">Unknown</span>`;
  const showBadge = opts && opts.compact;
  const name = escapeHtml(u.name || "User");
  const badge = u.contractor
    ? `<span class="role-badge contractor">Contractor</span>`
    : showBadge
      ? `<span class="role-badge homeowner">Homeowner</span>`
      : "";
  if (opts && opts.nameOnly) return name;
  const hideAv = opts && opts.hideAvatar;
  const size = (opts && opts.avatarSize) || (showBadge ? "xs" : "sm");
  const av = hideAv ? "" : avatarHTML(u, size);
  return `<span class="poster-line">${av}<span class="poster-name">${name}</span>${badge}</span>`;
}

function authHTML(data) {
  const screen = state.authScreen || "welcome";
  if (screen === "create") return authCreateHTML();
  if (screen === "signin") return authSignInHTML(data);
  if (screen === "demo") return authDemoHTML();
  return `
    <section class="hero auth-hero">
      <h2>Welcome to RenoSwap</h2>
      <p>Texas-first leftover reno materials — swap first, sell when you need to, Fast &amp; Free when the dumpster is coming. Browser demo only (no real backend).</p>
      <div class="actions auth-actions">
        <button class="primary" onclick="setAuthScreen('create')">Create profile</button>
        <button class="ghost" onclick="setAuthScreen('signin')">Sign in</button>
        <button class="ghost" onclick="setAuthScreen('demo')">Continue as demo user</button>
      </div>
      <p class="help" style="margin-top:14px;color:#e6d7c4">Passwords are demo-only and stored in localStorage — not secure.</p>
    </section>`;
}

function authCreateHTML() {
  return `
    <div class="panel auth-panel">
      <button class="ghost" onclick="setAuthScreen('welcome')">← Back</button>
      <h2>Create profile</h2>
      <p class="help">Demo signup — saved only in this browser. No email verification.</p>
      <div class="warn">Demo only: password is stored locally (encoded, not real security). Do not reuse a real password.</div>
      <form onsubmit="submitCreateProfile(event)">
        <div class="field"><label>Name *</label>
          <input name="name" required maxlength="60" placeholder="Alex M." />
        </div>
        <div class="field"><label>Email * <span class="help" style="display:inline;font-weight:400">(demo only)</span></label>
          <input name="email" type="email" required maxlength="120" placeholder="you@example.com" />
        </div>
        <div class="field"><label>Password *</label>
          <input name="password" type="password" required minlength="3" maxlength="64" autocomplete="new-password" />
        </div>
        <div class="field"><label>Role *</label>
          <select name="role" onchange="toggleAuthContractorFields(this.value)">
            <option value="Homeowner">Homeowner</option>
            <option value="Contractor">Contractor</option>
          </select>
        </div>
        <div class="field" id="companyField" style="display:none"><label>Company name</label>
          <input name="company" maxlength="80" placeholder="Hill Country Builds" />
        </div>
        <div class="field"><label>City *</label>
          <input name="city" required maxlength="60" placeholder="Moulton" />
        </div>
        <div class="field"><label>ZIP * (Texas)</label>
          <input name="zip" required maxlength="5" pattern="\\d{5}" inputmode="numeric" placeholder="77975" />
        </div>
        <div class="field"><label>Short bio (optional)</label>
          <textarea name="bio" rows="2" maxlength="280" placeholder="Kitchen remodel leftovers…"></textarea>
        </div>
        ${avatarEditorHTML("", "You")}
        <button class="primary" type="submit">Create &amp; continue</button>
      </form>
    </div>`;
}

function toggleAuthContractorFields(role) {
  const el = document.getElementById("companyField");
  if (el) el.style.display = role === "Contractor" ? "block" : "none";
}

function authSignInHTML(data) {
  return `
    <div class="panel auth-panel">
      <button class="ghost" onclick="setAuthScreen('welcome')">← Back</button>
      <h2>Sign in</h2>
      <p class="help">Email + password against users saved in this browser.</p>
      <div class="warn">Demo only — not real authentication.</div>
      <form onsubmit="submitSignIn(event)">
        <div class="field"><label>Email</label>
          <input name="email" type="email" required maxlength="120" />
        </div>
        <div class="field"><label>Password</label>
          <input name="password" type="password" required maxlength="64" autocomplete="current-password" />
        </div>
        <button class="primary" type="submit">Sign in</button>
      </form>
      <p class="help" style="margin-top:14px">Need a quick walkthrough? <a href="#" onclick="event.preventDefault(); setAuthScreen('demo')">Use a demo account</a>.</p>
    </div>`;
}

function authDemoHTML() {
  const demos = [
    { id: "u_me", blurb: "Sample “You” — owns the interior door listing" },
    { id: "u_home", blurb: "Elena — tile swap / incoming offer" },
    { id: "u_contractor", blurb: "Hill Country Builds — contractor badge + Fast & Free plywood" },
    { id: "u_admin", blurb: "Admin — review Pending listings" }
  ];
  return `
    <div class="panel auth-panel">
      <button class="ghost" onclick="setAuthScreen('welcome')">← Back</button>
      <h2>Continue as demo user</h2>
      <p class="help">Seeds / logs into a sample account for testing. Password for all demo emails: <code>demo</code>.</p>
      <div class="demo-list">
        ${demos
          .map((d) => {
            const u = USERS[d.id];
            return `
              <button type="button" class="demo-card" onclick="loginAsDemo('${d.id}')">
                <div class="row">
                  <span class="demo-card-user">${avatarHTML(u, "sm")}<b>${escapeHtml(u.name)}</b></span>
                  ${u.contractor ? `<span class="role-badge contractor">Contractor</span>` : u.admin ? `<span class="role-badge admin">Admin</span>` : `<span class="role-badge homeowner">Homeowner</span>`}
                </div>
                <div class="meta">${escapeHtml(u.email)} · ${escapeHtml(u.city)}, TX</div>
                <div class="help">${escapeHtml(d.blurb)}</div>
              </button>`;
          })
          .join("")}
      </div>
    </div>`;
}

function findUserByEmail(data, email) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle) return null;
  return Object.values(data.users).find(
    (u) => String(u.email || "").trim().toLowerCase() === needle
  );
}

function enterSession(data, userId) {
  data.currentUser = userId;
  db.save(data);
  state.view = "browse";
  state.listingId = null;
  state.threadId = null;
  state.editingProfile = false;
  state.avatarDraft = undefined;
  state.authScreen = "welcome";
  const u = data.users[userId];
  state.searchZip = (u && u.zip) || null;
  render();
  window.scrollTo(0, 0);
}

function submitCreateProfile(e) {
  e.preventDefault();
  const data = db.get();
  const fd = new FormData(e.target);
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const role = String(fd.get("role") || "Homeowner");
  const city = String(fd.get("city") || "").trim();
  const zip = String(fd.get("zip") || "").trim();
  const bio = String(fd.get("bio") || "").trim();
  const company = String(fd.get("company") || "").trim();
  if (!name) {
    alert("Name is required.");
    return;
  }
  if (!email) {
    alert("Email is required.");
    return;
  }
  if (password.length < 3) {
    alert("Use at least 3 characters for the demo password.");
    return;
  }
  if (!isTexasZip(zip)) {
    alert("Texas ZIP required in v1.");
    return;
  }
  if (findUserByEmail(data, email)) {
    alert("That email is already registered in this browser. Sign in instead.");
    return;
  }
  const id = uid("u");
  const contractor = role === "Contractor";
  data.users[id] = {
    id,
    name,
    email,
    password: demoHash(password),
    role: contractor ? "Contractor" : "Homeowner",
    contractor,
    subscribed: false,
    city,
    zip,
    bio,
    company: contractor ? company : "",
    avatar: "",
    profileComplete: true,
    admin: false,
    blocked: []
  };
  applyAvatarDraft(data.users[id]);
  enterSession(data, id);
}

function submitSignIn(e) {
  e.preventDefault();
  const data = db.get();
  const fd = new FormData(e.target);
  const email = String(fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");
  const user = findUserByEmail(data, email);
  if (!user || !demoPasswordOk(password, user.password)) {
    alert("Email or password doesn’t match a saved demo user.");
    return;
  }
  if (!user.profileComplete) {
    user.profileComplete = true;
  }
  enterSession(data, user.id);
}

function loginAsDemo(userId) {
  const data = db.get();
  ensureUsersMap(data);
  if (!data.users[userId]) {
    data.users[userId] = structuredClone(USERS[userId]);
  }
  const u = data.users[userId];
  u.profileComplete = true;
  if (!u.password) u.password = demoHash(DEMO_PASSWORD);
  if (!u.email && USERS[userId]) u.email = USERS[userId].email;
  enterSession(data, userId);
}

function logout() {
  const data = db.get();
  data.currentUser = null;
  db.save(data);
  state.authScreen = "welcome";
  state.editingProfile = false;
  state.avatarDraft = undefined;
  state.view = "browse";
  state.listingId = null;
  state.threadId = null;
  render();
  window.scrollTo(0, 0);
}

function submitEditProfile(e) {
  e.preventDefault();
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me) return;
  const fd = new FormData(e.target);
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const role = String(fd.get("role") || "Homeowner");
  const city = String(fd.get("city") || "").trim();
  const zip = String(fd.get("zip") || "").trim();
  const bio = String(fd.get("bio") || "").trim();
  const company = String(fd.get("company") || "").trim();
  const newPw = String(fd.get("password") || "");
  if (!name) {
    alert("Name is required.");
    return;
  }
  if (!email) {
    alert("Email is required.");
    return;
  }
  if (!city) {
    alert("City is required.");
    return;
  }
  if (!isTexasZip(zip)) {
    alert("Texas ZIP required in v1.");
    return;
  }
  const other = findUserByEmail(data, email);
  if (other && other.id !== me.id) {
    alert("That email is already used by another demo account.");
    return;
  }
  const prevZip = String(me.zip || "").trim();
  me.name = name;
  me.email = email;
  me.city = city;
  me.zip = zip;
  me.bio = bio;
  me.contractor = role === "Contractor";
  me.role = me.admin ? "Admin" : me.contractor ? "Contractor" : "Homeowner";
  me.company = me.contractor ? company : "";
  me.profileComplete = true;
  if (newPw) {
    if (newPw.length < 3) {
      alert("New password needs at least 3 characters (or leave blank).");
      return;
    }
    me.password = demoHash(newPw);
  }
  applyAvatarDraft(me);
  db.save(data);
  // Keep browse near-me default in sync when profile ZIP changes
  // (or when searchZip still matched the previous profile ZIP / was empty).
  const curSearch = state.searchZip == null ? "" : String(state.searchZip).trim();
  if (zip !== prevZip || !curSearch || curSearch === prevZip) {
    state.searchZip = zip;
  }
  state.editingProfile = false;
  state.avatarDraft = undefined;
  state.profileNotice =
    "Profile saved. Photo and location update across Account, listings, messages, and Browse near-me.";
  render();
  window.scrollTo(0, 0);
}

function startEditProfile() {
  state.editingProfile = true;
  state.avatarDraft = undefined;
  state.profileNotice = null;
  render();
  window.scrollTo(0, 0);
}

function cancelEditProfile() {
  state.editingProfile = false;
  state.avatarDraft = undefined;
  render();
}

function viewHTML(data) {
  if (state.view === "admin") {
    const me = sessionUser(data);
    if (!me || !me.admin) {
      state.view = "browse";
      return browseHTML(data);
    }
  }
  if (state.view === "browse") return browseHTML(data);
  if (state.view === "detail") return detailHTML(data);
  if (state.view === "post") return postHTML(data);
  if (state.view === "mine") return mineHTML(data);
  if (state.view === "admin") return adminHTML(data);
  if (state.view === "account") return accountHTML(data);
  if (state.view === "messages") return messagesHTML(data);
  if (state.view === "thread") return threadHTML(data);
  if (state.view === "propose") return proposeSwapHTML(data);
  return "";
}

function browseHTML(data) {
  const me = data.users[data.currentUser];
  const blocked = new Set(blockedIds(me));
  const searchZip = effectiveSearchZip(data);
  const origin = zipCoords(searchZip);
  const radius = state.radiusMiles; // null = Anywhere

  let items = data.listings.filter(
    (l) =>
      (l.status === "Approved" || l.status === "Claimed") &&
      !blocked.has(l.poster)
  );
  if (state.intentFilter !== "All") {
    items = items.filter((l) => l.intent === state.intentFilter);
  }
  if (state.category !== "All") {
    items = items.filter((l) => l.category === state.category);
  }
  if (state.q) {
    const q = state.q.toLowerCase();
    items = items.filter((l) =>
      [l.title, l.description, l.looking_for, l.category]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  // Attach distance when a search ZIP is set
  const withDist = items.map((l) => {
    const dest = zipCoords(l.zip);
    const mi =
      origin && dest ? milesBetween(origin, dest) : null;
    return { l, mi };
  });

  let filtered = withDist;
  if (radius != null && origin) {
    filtered = withDist.filter(({ mi }) => {
      // Unknown ZIP coords: keep listing (graceful fallback)
      if (mi == null) return true;
      return mi <= radius;
    });
  }

  filtered.sort((a, b) => {
    const af = a.l.intent === "Fast & Free" ? 0 : 1;
    const bf = b.l.intent === "Fast & Free" ? 0 : 1;
    if (af !== bf) return af - bf;
    if (state.sortBy === "distance" && origin) {
      const am = a.mi == null ? Number.POSITIVE_INFINITY : a.mi;
      const bm = b.mi == null ? Number.POSITIVE_INFINITY : b.mi;
      if (am !== bm) return am - bm;
    }
    return (a.l.expires_at || 0) - (b.l.expires_at || 0);
  });

  const matchPool = filtered.map((x) => x.l);
  const matchesForYou = browseMatchesForYou(data, matchPool);

  const intents = ["All", ...INTENTS];
  const zipDisplay = escapeAttr(searchZip);
  const radiusVal = radius == null ? "anywhere" : String(radius);

  return `
    <section class="hero">
      <h2>Swap leftover renovation materials before they hit the dumpster.</h2>
      <p>Texas-first marketplace for homeowners and contractors. Swap first. Selling is allowed. Fast &amp; Free for 24, 48, or 72 hour pickup.</p>
      <button class="primary" onclick="go('post')">Post an item</button>
    </section>
    <details class="filters-disclosure" ${
      (
        (typeof window !== "undefined" &&
          window.matchMedia("(min-width: 800px)").matches) ||
        state.filtersOpen
      )
        ? "open"
        : ""
    } ontoggle="state.filtersOpen=this.open">
      <summary class="filters-summary">
        <span>Filters</span>
        <span class="filters-summary-meta meta">${
          state.intentFilter !== "All" ? escapeHtml(state.intentFilter) : "All intents"
        }${state.q ? " · search" : ""}${
          searchZip ? ` · ${escapeHtml(searchZip)}` : ""
        }</span>
      </summary>
      <div class="filters-body">
        <div class="pills">
          ${intents
            .map(
              (i) =>
                `<button class="pill ${state.intentFilter === i ? "on" : ""}" onclick="setFilter('${i}')">${i}</button>`
            )
            .join("")}
        </div>
        <div class="filters">
          <input placeholder="Search titles, looking-for, tile, lumber..." value="${escapeAttr(state.q)}" oninput="state.q=this.value; state.filtersOpen=true; render()" />
          <select onchange="state.category=this.value; state.filtersOpen=true; render()">
            <option>All</option>
            ${CATEGORIES.map(
              (c) => `<option ${state.category === c ? "selected" : ""}>${c}</option>`
            ).join("")}
          </select>
          <select onchange="state.sortBy=this.value; state.filtersOpen=true; render()">
            <option value="expiry" ${state.sortBy === "expiry" ? "selected" : ""}>Sort: Soonest expiry</option>
            <option value="distance" ${state.sortBy === "distance" ? "selected" : ""}>Sort: Distance</option>
          </select>
        </div>
        <div class="filters location-filters">
          <div class="field" style="margin:0">
            <label class="meta" style="display:block;margin-bottom:4px">Search ZIP</label>
            <input maxlength="5" pattern="\\d{5}" inputmode="numeric" placeholder="e.g. 77975"
              value="${zipDisplay}"
              oninput="state.searchZip=this.value; state.filtersOpen=true; render()" />
          </div>
          <div class="field" style="margin:0">
            <label class="meta" style="display:block;margin-bottom:4px">Radius</label>
            <select onchange="setBrowseRadius(this.value)">
              <option value="25" ${radiusVal === "25" ? "selected" : ""}>25 miles</option>
              <option value="50" ${radiusVal === "50" ? "selected" : ""}>50 miles</option>
              <option value="100" ${radiusVal === "100" ? "selected" : ""}>100 miles</option>
              <option value="anywhere" ${radiusVal === "anywhere" ? "selected" : ""}>Anywhere in Texas</option>
            </select>
          </div>
          <div class="field" style="margin:0;display:flex;align-items:flex-end">
            <p class="meta" style="margin:0 0 10px">
              ${
                searchZip
                  ? origin
                    ? `Near ${escapeHtml(searchZip)}${radius != null ? ` · ≤ ${radius} mi` : " · all Texas"}`
                    : `ZIP ${escapeHtml(searchZip)} not in lookup — showing all (distance —)`
                  : "Set a ZIP to see distances"
              }
            </p>
          </div>
        </div>
      </div>
    </details>
    ${
      matchesForYou.length
        ? `<div class="match-strip">
            <div class="match-strip-head">
              <strong>Matches for you</strong>
              <span class="meta">Based on looking-for on your Approved listings</span>
            </div>
            <div class="match-strip-row">
              ${matchesForYou
                .map((l) => {
                  const dest = zipCoords(l.zip);
                  const mi = origin && dest ? milesBetween(origin, dest) : null;
                  const dist = searchZip ? formatMiles(mi) : "";
                  return `<button type="button" class="match-chip" onclick="go('detail','${l.id}')">
                    <span class="match-chip-title">${escapeHtml(l.title)}</span>
                    <span class="meta">${escapeHtml(l.city)}${dist ? ` · ${escapeHtml(dist)}` : ""} · ${escapeHtml(l.intent)}</span>
                  </button>`;
                })
                .join("")}
            </div>
          </div>`
        : ""
    }
    <div class="grid">
      ${
        filtered.map(({ l, mi }) => cardHTML(l, { miles: searchZip ? mi : undefined, showDistance: !!searchZip })).join("") ||
        "<p>No listings match.</p>"
      }
    </div>`;
}

function cardHTML(l, opts) {
  opts = opts || {};
  const u = userBy(l.poster);
  let priceLine;
  if (l.status === "Claimed") {
    priceLine = "Claimed · pending pickup";
  } else if (l.intent === "Sell" || l.intent === "Sell or Swap") {
    priceLine = "$" + l.price;
  } else if (l.intent === "Fast & Free") {
    priceLine = timeLeft(l.expires_at);
  } else {
    priceLine = "Looking for swap";
  }
  const distLabel = opts.showDistance
    ? formatMiles(opts.miles)
    : "";
  return `
    <article class="card" onclick="go('detail','${l.id}')">
      <div class="thumb" style="background-image:url('${l.photos[0]}')">
        <span class="badge ${badgeClass(l.intent)}">${escapeHtml(l.intent)}</span>
        ${l.status === "Claimed" ? `<span class="badge claimed">Claimed</span>` : ""}
      </div>
      <div class="card-body">
        <h3>${escapeHtml(l.title)}</h3>
        <div class="meta">${escapeHtml(l.city)}, TX${distLabel ? ` · <span class="dist">${escapeHtml(distLabel)}</span>` : ""} · ${escapeHtml(l.condition)}</div>
        <div class="row" style="margin-top:8px">
          <div class="meta">${escapeHtml(priceLine)}</div>
          <div class="meta">${profileBadgeHTML(u, { compact: true })}</div>
        </div>
      </div>
    </article>`;
}

function safetyHTML() {
  return `
    <div class="safety">
      <h4>Stay safe at pickup</h4>
      <ul>
        <li>Meet in public or at a staffed jobsite.</li>
        <li>Inspect materials before paying or swapping.</li>
        <li>No deposits to strangers.</li>
        <li>Use Report listing / Report user if something feels off. Block hides their listings and messaging.</li>
      </ul>
    </div>`;
}

function detailHTML(data) {
  const l = data.listings.find((x) => x.id === state.listingId);
  if (!l) return "<p>Listing not found.</p>";
  const u = userBy(l.poster);
  const me = data.users[data.currentUser];
  const mine = l.poster === data.currentUser;
  const isFast = l.intent === "Fast & Free";
  const showMoney =
    l.intent === "Sell" || l.intent === "Sell or Swap";
  const iBlockedThem = isUserBlocked(me, l.poster);

  let myMatchHint = "";
  if (
    !mine &&
    ["Swap", "Sell or Swap"].includes(l.intent) &&
    String(l.looking_for || "").trim()
  ) {
    const mineApproved = data.listings.filter(
      (x) =>
        x.poster === data.currentUser &&
        x.status === "Approved" &&
        x.id !== l.id
    );
    const ranked = mineApproved
      .map((x) => ({ x, score: scoreSwapMatch(x, l) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    if (ranked.length) {
      const top = ranked.slice(0, 3);
      myMatchHint = `
        <div class="match-hint">
          <strong>Best matches for their looking for</strong>
          <ul>
            ${top
              .map(
                (r) =>
                  `<li>${escapeHtml(r.x.title)} <span class="meta">(${escapeHtml(r.x.city)})</span></li>`
              )
              .join("")}
          </ul>
          ${
            l.status === "Approved"
              ? `<button class="ghost" style="margin-top:6px" onclick="go('propose','${l.id}')">Propose a swap with a match</button>`
              : ""
          }
        </div>`;
    }
  }

  let claimedBanner = "";
  if (l.status === "Claimed") {
    claimedBanner = `
      <div class="claimed-banner">
        <strong>Claimed — pending pickup.</strong>
        Arrange a time with the poster and pick up before the listing expires.
      </div>`;
  }

  let countdownBlock = "";
  if (isFast && l.expires_at && ["Approved", "Claimed"].includes(l.status)) {
    countdownBlock = `
      <div class="meta">Fast &amp; Free window</div>
      <div class="countdown" id="liveCountdown">${formatCountdown(l.expires_at)}</div>
      ${
        l.dumpster_bound
          ? `<div class="warn">Fast &amp; Free: this goes in a dumpster if not picked up by ${new Date(l.expires_at).toLocaleString()}.</div>`
          : ""
      }`;
  } else if (l.dumpster_bound && l.expires_at) {
    countdownBlock = `<div class="warn">Fast &amp; Free: this goes in a dumpster if not picked up by ${new Date(l.expires_at).toLocaleString()}.</div>`;
  }

  let trustActions = "";
  if (!mine) {
    trustActions = `
      <div class="actions trust-actions">
        <button class="ghost" onclick="openReport('listing','${l.id}','${l.poster}')">Report listing</button>
        <button class="ghost" onclick="openReport('user',null,'${l.poster}')">Report user</button>
        ${
          iBlockedThem
            ? `<button class="ghost" onclick="unblockUser('${l.poster}')">Unblock user</button>`
            : `<button class="danger" onclick="if(confirm('Block this user? Their listings and messages will be hidden.')) blockUser('${l.poster}')">Block user</button>`
        }
      </div>
      ${iBlockedThem ? `<div class="warn">You blocked this poster. Unblock from Account or here to see their listings again.</div>` : ""}
      ${reportFormHTML(data)}`;
  }

  return `
    <div class="detail-grid">
      <div>
        <div class="photos">
          <img src="${l.photos[0]}" alt="" />
          <div>
            <img class="small" src="${l.photos[1] || l.photos[0]}" alt="" />
            <img class="small" src="${l.photos[2] || l.photos[0]}" alt="" />
          </div>
        </div>
        <div class="panel" style="margin-top:12px">
          ${claimedBanner}
          <h2 style="margin:0 0 6px">${escapeHtml(l.title)}</h2>
          <div class="meta">${escapeHtml(l.intent)} · ${escapeHtml(l.category)} · ${escapeHtml(l.condition)} · ${escapeHtml(l.city)}, TX ${escapeHtml(l.zip)}</div>
          <p>${escapeHtml(l.description)}</p>
          ${l.looking_for ? `<p><b>Looking for:</b> ${escapeHtml(l.looking_for)}</p>` : ""}
          ${myMatchHint}
          ${countdownBlock}
          ${safetyHTML()}
        </div>
      </div>
      <aside class="panel">
        <div class="ok">${profileBadgeHTML(u)}${u && u.city ? ` · ${escapeHtml(u.city)}, TX` : ""}</div>
        <p><b>${showMoney ? "$" + l.price : isFast ? "Free · pickup only" : "No cash required"}</b></p>
        <span class="status-chip ${escapeAttr(String(l.status).replace(/\s+/g, '-'))}">${escapeHtml(l.status)}</span>
        <p class="meta" style="margin-top:10px">Pickup ${l.pickup_ok ? "yes" : "no"} · Shipping ${l.shipping_ok ? "yes" : "no"}</p>
        ${
          l.expires_at && !isFast
            ? `<p class="meta">Expires: ${timeLeft(l.expires_at)}</p>`
            : ""
        }
        ${
          showMoney
            ? `<div class="pay-note">Pay at pickup with cash, Venmo, or Zelle. No in-app checkout.</div>`
            : `<div class="pay-note">Pickup in person. No in-app checkout or deposits.</div>`
        }
        ${mine ? ownerActions(l, data) : actionBox(l, data)}
        ${trustActions}
      </aside>
    </div>`;
}

function offersForListing(data, listingId) {
  return data.offers.filter(
    (o) => (o.listingId || o.listing) === listingId
  );
}

function offerCardHTML(data, offer, opts) {
  const target = listingById(data, offer.listingId || offer.listing);
  const offered = offer.offeredListingId
    ? listingById(data, offer.offeredListingId)
    : null;
  const from = userBy(offer.from);
  const isOwner =
    target && target.poster === data.currentUser && offer.status === "Pending";
  const isMine = offer.from === data.currentUser && offer.status === "Pending";
  return `
    <div class="offer-card">
      <div class="row">
        <div>
          <b>${escapeHtml(offer.type)}</b>
          <span class="status-chip ${escapeAttr(offer.status)}">${escapeHtml(offer.status)}</span>
        </div>
        <div class="meta">${from ? escapeHtml(from.name) : ""} · ${new Date(offer.at).toLocaleString()}</div>
      </div>
      ${
        offered
          ? `<p class="meta" style="margin:8px 0">Offering: <a href="#" onclick="event.preventDefault(); go('detail','${offered.id}')">${escapeHtml(offered.title)}</a> (${escapeHtml(offered.intent)} · ${escapeHtml(offered.city)})</p>`
          : ""
      }
      ${offer.message ? `<p>${escapeHtml(offer.message)}</p>` : ""}
      <div class="actions">
        ${
          isOwner
            ? `<button class="primary" onclick="respondOffer('${offer.id}','Accepted')">Accept</button>
               <button class="danger" onclick="respondOffer('${offer.id}','Declined')">Decline</button>`
            : ""
        }
        ${
          isMine
            ? `<button class="ghost" onclick="respondOffer('${offer.id}','Withdrawn')">Withdraw</button>`
            : ""
        }
        ${
          opts && opts.showThread
            ? `<button class="ghost" onclick="openOfferThread('${offer.id}')">Open thread</button>`
            : ""
        }
      </div>
    </div>`;
}

function ownerActions(l, data) {
  const buttons = [`<p class="help">This is your listing.</p>`];
  if (["Approved", "Claimed"].includes(l.status)) {
    buttons.push(
      `<div class="actions">
        <button class="ghost" onclick="markComplete('${l.id}')">Mark completed</button>
        <button class="danger" onclick="hideListing('${l.id}')">Hide listing</button>
      </div>`
    );
  }
  if (l.status === "Draft" || l.status === "Pending Review") {
    buttons.push(
      `<div class="actions"><button class="danger" onclick="hideListing('${l.id}')">Cancel / hide</button></div>`
    );
  }
  const incoming = offersForListing(data, l.id).filter(
    (o) => o.from !== data.currentUser
  );
  if (incoming.length) {
    buttons.push(`<h4 style="margin:16px 0 8px">Offers</h4>`);
    buttons.push(incoming.map((o) => offerCardHTML(data, o, { showThread: true })).join(""));
  }
  return buttons.join("");
}

function actionBox(l, data) {
  data = data || db.get();
  const blockedMsg = messagingBlocked(data, l.poster);
  const msgBtn = blockedMsg
    ? `<p class="help" style="margin-top:8px">Messaging disabled — you blocked this user (or they blocked you).</p>`
    : `<button class="ghost" style="margin-top:8px" onclick="messagePoster('${l.id}')">Message poster</button>`;
  if (l.status === "Claimed") {
    return `<p class="help">This listing is claimed and pending pickup.</p>${msgBtn}`;
  }
  if (l.status !== "Approved") {
    return `<p class="help">This listing is ${escapeHtml(l.status)}.</p>`;
  }
  if (blockedMsg) {
    return `<div class="warn">This poster is blocked. Unblock to claim, offer, or message.</div>${msgBtn}`;
  }
  if (l.intent === "Fast & Free") {
    return `<button class="primary" onclick="claimFree('${l.id}')">Claim for pickup</button>
      ${msgBtn}
      <p class="help">Local pickup only. Confirm a time with the poster.</p>`;
  }
  if (l.intent === "Sell") {
    return `<button class="primary" onclick="makeBuyOffer('${l.id}')">Offer to buy</button>
      ${msgBtn}
      <p class="help">Buy offers stay simple — message the poster. Pay at pickup.</p>`;
  }
  return `
    <button class="primary" onclick="go('propose','${l.id}')">Propose a swap</button>
    ${
      l.intent === "Sell or Swap"
        ? `<button class="ghost" style="margin-top:8px" onclick="makeBuyOffer('${l.id}')">Offer to buy</button>`
        : ""
    }
    ${msgBtn}
    <p class="help">Swap proposals attach one of your Approved listings.</p>`;
}

function proposeSwapHTML(data) {
  const target = listingById(data, state.listingId);
  if (!target) return "<p>Listing not found.</p>";
  if (target.poster === data.currentUser) {
    return `<p>You can't propose a swap on your own listing.</p><button class="ghost" onclick="go('detail','${target.id}')">Back</button>`;
  }
  if (messagingBlocked(data, target.poster)) {
    return `<p>This poster is blocked. Unblock them to propose a swap.</p><button class="ghost" onclick="go('detail','${target.id}')">Back</button>`;
  }
  if (target.status !== "Approved" || !["Swap", "Sell or Swap"].includes(target.intent)) {
    return `<p>Swaps aren't available on this listing.</p><button class="ghost" onclick="go('detail','${target.id}')">Back</button>`;
  }
  const mine = data.listings.filter(
    (l) =>
      l.poster === data.currentUser &&
      l.status === "Approved" &&
      l.id !== target.id
  );
  if (!mine.length) {
    return `
      <div class="panel" style="max-width:640px">
        <button class="ghost" onclick="go('detail','${target.id}')">← Back</button>
        <h2>Propose a swap</h2>
        <p>For: <b>${escapeHtml(target.title)}</b></p>
        <div class="empty-state">
          <h3>Post and get a listing approved first</h3>
          <p class="help">You need at least one Approved listing of your own to attach as a swap offer.</p>
          <div class="actions">
            <button class="primary" onclick="go('post')">Post an item</button>
            <button class="ghost" onclick="go('mine')">My listings</button>
          </div>
        </div>
      </div>`;
  }

  const ranked = mine
    .map((l) => ({ l, score: scoreSwapMatch(l, target) }))
    .sort((a, b) => b.score - a.score || a.l.title.localeCompare(b.l.title));
  const bestScore = ranked[0] ? ranked[0].score : 0;
  const hasBest = bestScore > 0;

  const pickCard = (l, score, isBest) => `
          <label class="pick-card ${state.pickOfferedId === l.id ? "selected" : ""} ${isBest ? "best-match" : ""}">
            <input type="radio" name="offered" value="${l.id}" ${
              state.pickOfferedId === l.id ? "checked" : ""
            } onchange="state.pickOfferedId=this.value; render()" />
            <div class="pick-thumb" style="background-image:url('${l.photos[0]}')"></div>
            <div>
              <b>${escapeHtml(l.title)}</b>
              ${
                isBest
                  ? `<span class="match-pill">Best match</span>`
                  : score > 0
                    ? `<span class="match-pill soft">Match</span>`
                    : ""
              }
              <div class="meta">${escapeHtml(l.intent)} · ${escapeHtml(l.city)} · ${escapeHtml(l.condition)}</div>
            </div>
          </label>`;

  let pickHTML;
  if (hasBest) {
    const bestOnes = ranked.filter((x) => x.score === bestScore && x.score > 0);
    const rest = ranked.filter((x) => !(x.score === bestScore && x.score > 0));
    pickHTML = `
        <p class="meta" style="margin-top:12px"><b>Best matches for their looking for</b></p>
        <div class="pick-grid">
          ${bestOnes.map((x) => pickCard(x.l, x.score, true)).join("")}
        </div>
        ${
          rest.length
            ? `<p class="meta" style="margin-top:14px">Your other Approved listings</p>
        <div class="pick-grid">
          ${rest.map((x) => pickCard(x.l, x.score, false)).join("")}
        </div>`
            : ""
        }`;
  } else {
    pickHTML = `
      <div class="pick-grid">
        ${ranked.map((x) => pickCard(x.l, x.score, false)).join("")}
      </div>`;
  }

  return `
    <div class="panel" style="max-width:720px">
      <button class="ghost" onclick="go('detail','${target.id}')">← Back</button>
      <h2>Propose a swap</h2>
      <p>Attach <b>one</b> of your Approved listings to offer for <b>${escapeHtml(target.title)}</b>.</p>
      <p class="meta">They are looking for: ${escapeHtml(target.looking_for || "—")}</p>
      ${pickHTML}
      <form onsubmit="submitSwapOffer(event)">
        <div class="field" style="margin-top:14px">
          <label>Message (optional)</label>
          <textarea name="message" rows="3" placeholder="Happy to meet in La Grange this weekend…"></textarea>
        </div>
        <button class="primary" ${state.pickOfferedId ? "" : "disabled"}>Send swap offer</button>
      </form>
    </div>`;
}

function submitSwapOffer(e) {
  e.preventDefault();
  const data = db.get();
  const target = listingById(data, state.listingId);
  if (!target || target.status !== "Approved") return;
  if (messagingBlocked(data, target.poster)) {
    alert("Unblock this user before sending an offer.");
    return;
  }
  const offeredId = state.pickOfferedId;
  const offered = listingById(data, offeredId);
  if (!offered || offered.poster !== data.currentUser || offered.status !== "Approved") {
    alert("Pick one of your Approved listings.");
    return;
  }
  const fd = new FormData(e.target);
  const message = String(fd.get("message") || "").trim();
  const offer = {
    id: uid("o"),
    listingId: target.id,
    offeredListingId: offered.id,
    from: data.currentUser,
    type: "Swap",
    message: message || "",
    status: "Pending",
    at: Date.now()
  };
  data.offers.unshift(offer);
  const thread = findOrCreateThread(data, target.id, target.poster, offer.id);
  const body =
    message ||
    `I'd like to swap my "${offered.title}" for your "${target.title}".`;
  addMessage(data, thread.id, body, data.currentUser);
  markThreadRead(data, thread.id, data.currentUser);
  db.save(data);
  state.pickOfferedId = null;
  goThread(thread.id);
}

function makeBuyOffer(listingId) {
  const data0 = db.get();
  const l0 = listingById(data0, listingId);
  if (l0 && messagingBlocked(data0, l0.poster)) {
    alert("Unblock this user before offering.");
    return;
  }
  const note = prompt("Optional note for the seller (pay at pickup):", "");
  if (note === null) return;
  const data = db.get();
  const l = listingById(data, listingId);
  if (!l || l.status !== "Approved") return;
  const offer = {
    id: uid("o"),
    listingId: l.id,
    offeredListingId: null,
    from: data.currentUser,
    type: "Buy",
    message: String(note || "").trim(),
    status: "Pending",
    at: Date.now()
  };
  data.offers.unshift(offer);
  const thread = findOrCreateThread(data, l.id, l.poster, offer.id);
  const body =
    offer.message ||
    `I'd like to buy "${l.title}"${l.price ? " for $" + l.price : ""}.`;
  addMessage(data, thread.id, body, data.currentUser);
  markThreadRead(data, thread.id, data.currentUser);
  db.save(data);
  goThread(thread.id);
}

function messagePoster(listingId) {
  const data = db.get();
  const l = listingById(data, listingId);
  if (!l || l.poster === data.currentUser) return;
  if (messagingBlocked(data, l.poster)) {
    alert("Messaging is disabled with this user (blocked).");
    return;
  }
  const thread = findOrCreateThread(data, l.id, l.poster, null);
  db.save(data);
  goThread(thread.id);
}

function openOfferThread(offerId) {
  const data = db.get();
  const offer = offerById(data, offerId);
  if (!offer) return;
  const l = listingById(data, offer.listingId || offer.listing);
  if (!l) return;
  const other =
    offer.from === data.currentUser ? l.poster : offer.from;
  const thread = findOrCreateThread(data, l.id, other, offer.id);
  db.save(data);
  goThread(thread.id);
}

function respondOffer(offerId, status) {
  const data = db.get();
  const offer = offerById(data, offerId);
  if (!offer || offer.status !== "Pending") return;
  const l = listingById(data, offer.listingId || offer.listing);
  if (!l) return;
  if (status === "Withdrawn") {
    if (offer.from !== data.currentUser) return;
  } else {
    if (l.poster !== data.currentUser) return;
  }
  offer.status = status;
  const other =
    data.currentUser === offer.from ? l.poster : offer.from;
  const thread = findOrCreateThread(data, l.id, other, offer.id);
  const label =
    status === "Accepted"
      ? "accepted"
      : status === "Declined"
        ? "declined"
        : "withdrew";
  addMessage(
    data,
    thread.id,
    `Offer ${label}: ${offer.type}${
      offer.offeredListingId
        ? " (attached listing " +
          (listingById(data, offer.offeredListingId) || {}).title +
          ")"
        : ""
    }.`,
    data.currentUser
  );
  db.save(data);
  render();
}

function messagesHTML(data) {
  const me = data.currentUser;
  const threads = data.threads
    .filter((t) => t.participants.includes(me))
    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  if (!threads.length) {
    return `
      <h2>Messages</h2>
      <div class="empty-state panel">
        <h3>No conversations yet</h3>
        <p class="help">Open a listing and tap “Message poster” or propose a swap.</p>
        <button class="primary" onclick="go('browse')">Browse listings</button>
      </div>`;
  }
  return `
    <h2>Messages</h2>
    <div class="thread-list">
      ${threads
        .map((t) => {
          const listing = listingById(data, t.listingId);
          const otherId = t.participants.find((p) => p !== me);
          const other = userBy(otherId);
          const blocked = messagingBlocked(data, otherId);
          const unread = blocked ? 0 : threadUnreadCount(data, t, me);
          const msgs = data.messages
            .filter((m) => m.threadId === t.id)
            .sort((a, b) => a.at - b.at);
          const last = msgs[msgs.length - 1];
          const offer = t.offerId ? offerById(data, t.offerId) : null;
          return `
            <button class="thread-item ${unread ? "has-unread" : ""} ${blocked ? "blocked-thread" : ""}" onclick="goThread('${t.id}')">
              <div class="row thread-item-head">
                <span class="thread-item-user">${avatarHTML(other, "sm")}<b>${escapeHtml((other && other.name) || "User")}${blocked ? ' <span class="status-chip Rejected">Blocked</span>' : ""}</b></span>
                <span class="meta">${last ? new Date(last.at).toLocaleString() : ""}</span>
              </div>
              <div class="meta">${escapeHtml((listing && listing.title) || "Listing")}${
                offer ? ` · ${escapeHtml(offer.type)} offer` : ""
              }</div>
              <div class="thread-preview">${
                unread ? `<span class="unread-dot"></span>` : ""
              }${escapeHtml(last ? last.body : "No messages yet")}</div>
            </button>`;
        })
        .join("")}
    </div>`;
}

function threadHTML(data) {
  const thread = data.threads.find((t) => t.id === state.threadId);
  if (!thread) {
    return `<p>Thread not found.</p><button class="ghost" onclick="go('messages')">Back to messages</button>`;
  }
  const me = data.currentUser;
  if (!thread.participants.includes(me)) {
    return `<p>Not your thread.</p>`;
  }
  markThreadRead(data, thread.id, me);
  db.save(data);

  const listing = listingById(data, thread.listingId);
  const otherId = thread.participants.find((p) => p !== me);
  const other = userBy(otherId);
  const offer = thread.offerId ? offerById(data, thread.offerId) : null;
  const msgs = data.messages
    .filter((m) => m.threadId === thread.id)
    .sort((a, b) => a.at - b.at);

  let offerBlock = "";
  if (offer) {
    offerBlock = offerCardHTML(data, offer, { showThread: false });
  }

  const meUser = data.users[me];
  const blockedMsg = messagingBlocked(data, otherId);
  const iBlockedThem = isUserBlocked(meUser, otherId);

  return `
    <div class="thread-view">
      <button class="ghost" onclick="go('messages')">← Messages</button>
      <div class="panel thread-header">
        <div class="row thread-header-row">
          ${avatarHTML(other, "md")}
          <div>
            <h2 style="margin:0">${escapeHtml((other && other.name) || "User")}</h2>
            <div class="meta">
              About:
              ${
                listing
                  ? `<a href="#" onclick="event.preventDefault(); go('detail','${listing.id}')">${escapeHtml(listing.title)}</a>`
                  : "listing"
              }
            </div>
          </div>
        </div>
        ${offerBlock}
        <div class="actions trust-actions">
          <button class="ghost" onclick="openReport('user','${thread.listingId || ""}','${otherId}')">Report user</button>
          ${
            iBlockedThem
              ? `<button class="ghost" onclick="unblockUser('${otherId}')">Unblock user</button>`
              : `<button class="danger" onclick="if(confirm('Block this user?')) blockUser('${otherId}')">Block user</button>`
          }
        </div>
        ${reportFormHTML(data)}
      </div>
      <div class="msg-list" id="msgList">
        ${
          msgs
            .map((m) => {
              const mine = m.from === me;
              const u = userBy(m.from);
              return `
                <div class="msg-bubble ${mine ? "mine" : "theirs"}">
                  <div class="msg-meta">${escapeHtml(u ? u.name : "")} · ${new Date(m.at).toLocaleString()}</div>
                  <div class="msg-body">${escapeHtml(m.body)}</div>
                </div>`;
            })
            .join("") || `<p class="help">Say hello to start the conversation.</p>`
        }
      </div>
      ${
        blockedMsg
          ? `<div class="panel warn">Messaging disabled with this user (blocked).</div>`
          : `<form class="compose panel" onsubmit="sendMessage(event)">
        <textarea id="msgCompose" name="body" rows="2" required maxlength="2000" placeholder="Write a message…"></textarea>
        <button class="primary" type="submit">Send</button>
      </form>`
      }
    </div>`;
}

function sendMessage(e) {
  e.preventDefault();
  const data = db.get();
  const thread = data.threads.find((t) => t.id === state.threadId);
  if (!thread || !thread.participants.includes(data.currentUser)) return;
  const otherId = thread.participants.find((p) => p !== data.currentUser);
  if (messagingBlocked(data, otherId)) {
    alert("Messaging is disabled with this user (blocked).");
    return;
  }
  const fd = new FormData(e.target);
  const body = String(fd.get("body") || "").trim();
  if (!body) return;
  addMessage(data, thread.id, body, data.currentUser);
  markThreadRead(data, thread.id, data.currentUser);
  db.save(data);
  render();
}

function postHTML(data) {
  const me = data.users[data.currentUser];
  const count = activeCount(data, data.currentUser);
  const blocked = !canPost(data, data.currentUser);
  const overLimitUnsub = count > 3 && !me.subscribed;

  return `
    <div class="panel" style="max-width:720px">
      <h2>Post an item</h2>
      <p class="help">Admin approval required. Texas listings only. 3 photos minimum. 45-day life after approval, or 24/48/72 hours for Fast &amp; Free (timer starts when admin approves).</p>
      ${
        blocked
          ? `<div class="warn">You already have ${count} active posts (Pending Review, Approved, or Claimed). ${
              overLimitUnsub
                ? "You canceled the extra-listing plan while over the free limit — new posts are blocked until you drop to 3 active or resubscribe."
                : "Upgrade to $3.99/month for a 4th+ listing."
            }</div>`
          : `<p class="help">Active free slots used: ${count} / 3${!me.subscribed ? "" : " (subscribed — unlimited)"}.</p>`
      }
      <form onsubmit="submitListing(event)">
        <div class="field"><label>Intent</label>
          <select name="intent" onchange="togglePostFields(this.value)">
            ${INTENTS.map((i) => `<option>${i}</option>`).join("")}
          </select>
        </div>
        <div class="field" id="fastField" style="display:none"><label>Pickup window</label>
          <select name="fast_window">
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
            <option value="72">72 hours</option>
          </select>
          <div class="help">Window starts when an admin approves — not when you submit.</div>
        </div>
        <div class="field"><label>Title</label>
          <input name="title" maxlength="80" required placeholder="Leftover 3/4 plywood, 8 sheets" />
        </div>
        <div class="field"><label>Category</label>
          <select name="category" required>
            ${CATEGORIES.map((c) => `<option>${c}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Description</label>
          <textarea name="description" rows="4" required minlength="20"></textarea>
        </div>
        <div class="field"><label>Condition</label>
          <select name="condition">
            ${CONDITIONS.map((c) => `<option>${c}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>3 photos minimum</label>
          <input name="photos" type="file" accept="image/*" multiple required />
          <div class="help">Choose at least three images from your phone.</div>
        </div>
        <div class="field" id="priceField" style="display:none"><label>Price USD</label>
          <input name="price" type="number" min="1" step="0.01" />
          <div class="help">Buyer pays at pickup (cash / Venmo / Zelle). No in-app checkout.</div>
        </div>
        <div class="field" id="lookField"><label>Looking for</label>
          <textarea name="looking_for" rows="2" placeholder="Tile, wet saw, interior doors"></textarea>
          <div class="help">Required for Swap and Sell or Swap.</div>
        </div>
        <div class="field"><label>City</label>
          <input name="city" value="${escapeAttr(me.city || "Moulton")}" required />
        </div>
        <div class="field"><label>ZIP</label>
          <input name="zip" value="${escapeAttr(me.zip || "77975")}" required maxlength="5" pattern="\\d{5}" inputmode="numeric" />
          <div class="help">Texas ZIP required in v1.</div>
        </div>
        <div class="field"><label><input type="checkbox" name="pickup_ok" checked /> Local pickup</label></div>
        <div class="field" id="shipField">
          <label><input type="checkbox" name="shipping_ok" /> Willing to ship</label>
        </div>
        <div class="field" id="dumpField" style="display:none">
          <label><input type="checkbox" name="dumpster" /> These materials will be thrown out if not picked up in time.</label>
          <div class="help">Required for Fast &amp; Free. Pickup only; price is $0.</div>
        </div>
        <button class="primary" ${blocked ? "disabled" : ""}>Submit for review</button>
      </form>
    </div>`;
}

function togglePostFields(intent) {
  const fast = document.getElementById("fastField");
  const dump = document.getElementById("dumpField");
  const price = document.getElementById("priceField");
  const look = document.getElementById("lookField");
  const ship = document.getElementById("shipField");
  if (!fast) return;
  fast.style.display = intent === "Fast & Free" ? "block" : "none";
  dump.style.display = intent === "Fast & Free" ? "block" : "none";
  price.style.display =
    intent === "Sell" || intent === "Sell or Swap" ? "block" : "none";
  look.style.display =
    intent === "Swap" || intent === "Sell or Swap" ? "block" : "none";
  ship.style.display = intent === "Fast & Free" ? "none" : "block";
}

async function filesToData(files) {
  const arr = [...files].slice(0, 10);
  return Promise.all(
    arr.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(f);
        })
    )
  );
}

async function submitListing(e) {
  e.preventDefault();
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!canPost(data, data.currentUser)) {
    alert(
      me.subscribed
        ? "Unable to post."
        : "Upgrade required for a 4th active listing (or cancel extras until you have 3 or fewer)."
    );
    return;
  }
  const fd = new FormData(e.target);
  const intent = fd.get("intent");
  const files = e.target.photos.files;
  const zip = String(fd.get("zip") || "").trim();

  if (!files || files.length < 3) {
    alert("Add at least 3 photos.");
    return;
  }
  if (!isTexasZip(zip)) {
    alert("Texas ZIP required in v1.");
    return;
  }
  if (
    (intent === "Swap" || intent === "Sell or Swap") &&
    !String(fd.get("looking_for") || "").trim()
  ) {
    alert("Looking for is required on swap posts.");
    return;
  }
  if (
    (intent === "Sell" || intent === "Sell or Swap") &&
    Number(fd.get("price")) <= 0
  ) {
    alert("Enter a price.");
    return;
  }
  if (intent === "Fast & Free" && !fd.get("dumpster")) {
    alert("Confirm these materials are dumpster-bound.");
    return;
  }
  if (intent === "Fast & Free" && !fd.get("pickup_ok")) {
    alert("Fast & Free requires local pickup.");
    return;
  }

  const photos = await filesToData(files);
  data.listings.unshift({
    id: "l" + Date.now(),
    title: fd.get("title"),
    category: fd.get("category"),
    intent,
    condition: fd.get("condition"),
    description: fd.get("description"),
    looking_for:
      intent === "Fast & Free" || intent === "Sell" ? "" : fd.get("looking_for"),
    price:
      intent === "Sell" || intent === "Sell or Swap"
        ? Number(fd.get("price"))
        : 0,
    city: fd.get("city"),
    zip,
    pickup_ok: intent === "Fast & Free" ? true : !!fd.get("pickup_ok"),
    shipping_ok: intent !== "Fast & Free" && !!fd.get("shipping_ok"),
    fast_window: intent === "Fast & Free" ? Number(fd.get("fast_window")) : null,
    photos,
    poster: data.currentUser,
    status: "Pending Review",
    dumpster_bound: intent === "Fast & Free",
    created_at: Date.now()
  });
  db.save(data);
  alert("Submitted for admin approval (Pending Review).");
  go("mine");
}

function mineHTML(data) {
  const mine = data.listings.filter((l) => l.poster === data.currentUser);
  const count = activeCount(data, data.currentUser);
  const me = data.users[data.currentUser];
  const myListingIds = new Set(mine.map((l) => l.id));
  const incoming = data.offers.filter(
    (o) => myListingIds.has(o.listingId || o.listing) && o.from !== data.currentUser
  );
  const outgoing = data.offers.filter((o) => o.from === data.currentUser);

  return `
    <h2>My listings</h2>
    <p class="help">Active used toward the free limit of 3 (Pending Review / Approved / Claimed): <b>${count}</b>${
      me.subscribed ? " · Subscribed" : ""
    }</p>
    ${
      count > 3 && !me.subscribed
        ? `<div class="warn">You have more than 3 active listings without a subscription. New posts are blocked until you hide/complete extras or upgrade.</div>`
        : ""
    }
    ${
      incoming.length
        ? `<div class="panel" style="margin-bottom:16px">
            <h3 style="margin-top:0">Incoming offers</h3>
            ${incoming
              .map((o) => {
                const t = listingById(data, o.listingId || o.listing);
                return `<div class="meta" style="margin-bottom:6px">On: ${escapeHtml(
                  (t && t.title) || "listing"
                )}</div>${offerCardHTML(data, o, { showThread: true })}`;
              })
              .join("")}
          </div>`
        : ""
    }
    ${
      outgoing.length
        ? `<div class="panel" style="margin-bottom:16px">
            <h3 style="margin-top:0">Your offers</h3>
            ${outgoing
              .map((o) => {
                const t = listingById(data, o.listingId || o.listing);
                return `<div class="meta" style="margin-bottom:6px">To: ${escapeHtml(
                  (t && t.title) || "listing"
                )}</div>${offerCardHTML(data, o, { showThread: true })}`;
              })
              .join("")}
          </div>`
        : ""
    }
    <div class="grid">${
      mine
        .map((l) => {
          const card = cardHTML(l);
          if (l.status === "Rejected") {
            return `<div>
              ${card}
              <div class="warn" style="margin-top:6px">Rejected${
                l.reject_reason
                  ? `: ${escapeHtml(l.reject_reason)}`
                  : " (no reason given)"
              }</div>
            </div>`;
          }
          if (l.status === "Pending Review") {
            return `<div>${card}<div class="meta" style="margin-top:6px">Status: Pending Review</div></div>`;
          }
          return card;
        })
        .join("") || "<p>None yet.</p>"
    }</div>`;
}

function adminHTML(data) {
  const pending = data.listings.filter((l) => l.status === "Pending Review");
  const all = data.listings;
  const pendingReports = (data.reports || []).filter((r) => r.status === "Pending");
  return `
    <h2>Admin review</h2>
    <p class="help">Approving sets expiry: 45 days for normal listings, or the Fast &amp; Free 24/48/72h window starting now.</p>
    <h3>Pending listings</h3>
    ${
      pending
        .map(
          (l) => `
      <div class="panel" style="margin-bottom:10px">
        <div class="thumbs" style="margin-bottom:10px">
          ${(l.photos || [])
            .slice(0, 3)
            .map((p) => `<img src="${p}" alt="" />`)
            .join("")}
        </div>
        <b>${escapeHtml(l.title)}</b>
        <div class="meta">${escapeHtml(l.intent)} · ${escapeHtml(l.city)} ${escapeHtml(l.zip)} · ${escapeHtml(l.category)} · poster ${escapeHtml((userBy(l.poster) || {}).name || l.poster)}</div>
        <p>${escapeHtml(l.description)}</p>
        ${l.looking_for ? `<p class="meta">Looking for: ${escapeHtml(l.looking_for)}</p>` : ""}
        <div class="actions">
          <button class="primary" onclick="approve('${l.id}')">Approve</button>
          <button class="danger" onclick="reject('${l.id}')">Reject</button>
        </div>
      </div>`
        )
        .join("") || "<p>No pending listings.</p>"
    }
    <h3>Pending reports</h3>
    ${
      pendingReports
        .map((r) => {
          const reporter = userBy(r.reporter);
          const target = r.targetUserId ? userBy(r.targetUserId) : null;
          const listing = r.listingId ? listingById(data, r.listingId) : null;
          return `
      <div class="panel" style="margin-bottom:10px">
        <div class="row">
          <b>${escapeHtml(r.reason)}</b>
          <span class="status-chip Pending-Review">Pending</span>
        </div>
        <div class="meta">${new Date(r.at).toLocaleString()} · by ${escapeHtml((reporter && reporter.name) || r.reporter)}</div>
        ${listing ? `<p class="meta">Listing: <a href="#" onclick="event.preventDefault(); go('detail','${listing.id}')">${escapeHtml(listing.title)}</a></p>` : ""}
        ${target ? `<p class="meta">User: ${escapeHtml(target.name)} (${escapeHtml(target.id)})</p>` : ""}
        ${r.note ? `<p>${escapeHtml(r.note)}</p>` : ""}
        <div class="actions">
          <button class="primary" onclick="resolveReport('${r.id}','Resolved')">Resolve</button>
          <button class="ghost" onclick="resolveReport('${r.id}','Dismissed')">Dismiss</button>
        </div>
      </div>`;
        })
        .join("") || "<p>No pending reports.</p>"
    }
    <h3>All listings</h3>
    <div class="grid">${all.map(cardHTML).join("")}</div>`;
}

function approve(id) {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me || !me.admin) return;
  const l = data.listings.find((x) => x.id === id);
  if (!l) return;
  l.status = "Approved";
  l.approved_at = Date.now();
  l.reject_reason = "";
  if (l.intent === "Fast & Free") {
    const hours = Number(l.fast_window) || 24;
    l.expires_at = Date.now() + hours * 3600 * 1000;
  } else {
    l.expires_at = Date.now() + 45 * 86400 * 1000;
  }
  db.save(data);
  render();
  scanAndNotify(db.get());
}

function reject(id) {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (!me || !me.admin) return;
  const l = data.listings.find((x) => x.id === id);
  if (!l) return;
  const reason = prompt("Optional short reject reason (shown to the poster):");
  if (reason === null) return; // canceled
  l.status = "Rejected";
  l.reject_reason = String(reason || "").trim().slice(0, 200);
  db.save(data);
  render();
}

function claimFree(id) {
  const data = db.get();
  const l = data.listings.find((x) => x.id === id);
  if (!l || l.status !== "Approved") return;
  if (messagingBlocked(data, l.poster)) {
    alert("Unblock this user before claiming.");
    return;
  }
  l.status = "Claimed";
  l.claimant = data.currentUser;
  l.claimed_at = Date.now();
  data.offers.push({
    id: uid("o"),
    listingId: id,
    offeredListingId: null,
    type: "Claim Free",
    from: data.currentUser,
    message: "",
    status: "Accepted",
    at: Date.now()
  });
  const thread = findOrCreateThread(data, id, l.poster, null);
  addMessage(
    data,
    thread.id,
    `I claimed "${l.title}" for pickup. Let's coordinate a time.`,
    data.currentUser
  );
  db.save(data);
  alert("Claimed. Coordinate pickup with the poster before the window ends.");
  goThread(thread.id);
}

function markComplete(id) {
  const data = db.get();
  const l = data.listings.find((x) => x.id === id);
  if (!l || l.poster !== data.currentUser) return;
  l.status = "Completed";
  db.save(data);
  render();
}

function hideListing(id) {
  const data = db.get();
  const l = data.listings.find((x) => x.id === id);
  if (!l || l.poster !== data.currentUser) return;
  l.status = "Hidden";
  db.save(data);
  render();
}

function accountHTML(data) {
  const me = data.users[data.currentUser];
  const count = activeCount(data, data.currentUser);
  const cancelWarn =
    me.subscribed && count > 3
      ? `<div class="warn">If you cancel while you have more than 3 active listings, new posts stay blocked until you drop to 3 or resubscribe.</div>`
      : "";
  const blockedNote =
    !me.subscribed && count > 3
      ? `<div class="warn">Extra-listing plan canceled (or never active) while over the free limit. You cannot post until active listings ≤ 3 or you upgrade.</div>`
      : "";
  const notice = state.profileNotice
    ? `<div class="ok account-notice" role="status">${escapeHtml(state.profileNotice)}</div>`
    : "";
  const locLabel =
    me.city || me.zip
      ? `${escapeHtml(me.city || "—")}, TX ${escapeHtml(me.zip || "")}`
      : "No location set";

  if (state.editingProfile) {
    return `
      <div class="panel" style="max-width:640px">
        <button class="ghost" type="button" onclick="cancelEditProfile()">← Back to Account</button>
        <h2>Edit profile</h2>
        <p class="help">Update your photo and Texas location anytime — e.g. if you move. Changes show in the top bar, listings, messages, and Browse near-me.</p>
        <div class="warn">Demo only: password changes stay in this browser.</div>
        <form onsubmit="submitEditProfile(event)">
          ${avatarEditorHTML(me.avatar || "", me.name || "You")}
          <div class="profile-location-block">
            <h3 class="profile-section-title">Location</h3>
            <p class="help" style="margin-top:0">City + Texas ZIP. Browse near-me uses this ZIP by default after you save.</p>
            <div class="field"><label>City *</label>
              <input name="city" required maxlength="60" value="${escapeAttr(me.city || "")}" placeholder="Moulton" />
            </div>
            <div class="field"><label>ZIP * (Texas)</label>
              <input name="zip" required maxlength="5" pattern="\\d{5}" inputmode="numeric" value="${escapeAttr(me.zip || "")}" placeholder="77975" />
            </div>
          </div>
          <h3 class="profile-section-title">Account details</h3>
          <div class="field"><label>Name *</label>
            <input name="name" required maxlength="60" value="${escapeAttr(me.name)}" />
          </div>
          <div class="field"><label>Email *</label>
            <input name="email" type="email" required maxlength="120" value="${escapeAttr(me.email || "")}" />
          </div>
          <div class="field"><label>New password (optional)</label>
            <input name="password" type="password" minlength="3" maxlength="64" placeholder="Leave blank to keep current" autocomplete="new-password" />
          </div>
          <div class="field"><label>Role *</label>
            ${
              me.admin
                ? `<input type="hidden" name="role" value="${me.contractor ? "Contractor" : "Homeowner"}" />
                   <div class="ok">Admin (demo)</div>
                   <div class="help">Admin accounts keep admin privileges. Switch demo users for other roles.</div>`
                : `<select name="role" onchange="toggleEditCompany(this.value)">
              <option value="Homeowner" ${!me.contractor ? "selected" : ""}>Homeowner</option>
              <option value="Contractor" ${me.contractor ? "selected" : ""}>Contractor</option>
            </select>`
            }
          </div>
          <div class="field" id="editCompanyField" style="display:${me.contractor ? "block" : "none"}"><label>Company name</label>
            <input name="company" maxlength="80" value="${escapeAttr(me.company || "")}" />
          </div>
          <div class="field"><label>Short bio</label>
            <textarea name="bio" rows="2" maxlength="280">${escapeHtml(me.bio || "")}</textarea>
          </div>
          <div class="actions profile-save-row">
            <button class="primary" type="submit">Save profile</button>
            <button class="ghost" type="button" onclick="cancelEditProfile()">Cancel</button>
          </div>
        </form>
      </div>`;
  }

  return `
    <div class="panel" style="max-width:640px">
      <h2>Account</h2>
      ${notice}
      <div class="account-hero">
        ${avatarHTML(me, "lg")}
        <div>
          <div class="ok" style="margin-bottom:6px">${profileBadgeHTML(me, { hideAvatar: true })}</div>
          <p class="meta" style="margin:0">${escapeHtml(me.email || "—")}</p>
        </div>
      </div>
      <div class="account-location-card">
        <div>
          <div class="account-location-label">Your location</div>
          <div class="account-location-value">${locLabel}</div>
          <p class="help" style="margin:6px 0 0">Used as the default Browse near-me ZIP. Change it anytime if you move.</p>
        </div>
        <button class="primary" type="button" onclick="startEditProfile()">Edit profile</button>
      </div>
      ${me.company ? `<p class="meta">Company: ${escapeHtml(me.company)}</p>` : ""}
      ${me.bio ? `<p>${escapeHtml(me.bio)}</p>` : ""}
      <p>Active listings: ${count} / 3 free</p>
      <p>Subscription: ${me.subscribed ? "Active $3.99/month" : "Not subscribed"}</p>
      ${cancelWarn}
      ${blockedNote}
      <div class="actions">
        <button class="ghost" onclick="go('mine')">My listings</button>
        <button class="ghost" type="button" onclick="startEditProfile()">Edit photo &amp; location</button>
        <button class="primary" onclick="toggleSub()">${
          me.subscribed ? "Cancel extra-listing plan" : "Upgrade $3.99/month"
        }</button>
      </div>
      <div class="actions signout-row">
        <button class="danger signout-btn" type="button" onclick="logout()">Sign out</button>
      </div>
      ${notifySettingsHTML(me)}
      <div class="panel" style="margin-top:16px;background:#f3eee4;box-shadow:none">
        <h3 style="margin-top:0;font-size:16px">Blocked users</h3>
        ${
          blockedIds(me).length
            ? `<ul class="blocked-list">
                ${blockedIds(me)
                  .map((id) => {
                    const u = userBy(id);
                    return `<li class="row">
                      <span>${escapeHtml((u && u.name) || id)}</span>
                      <button class="ghost" onclick="unblockUser('${id}')">Unblock</button>
                    </li>`;
                  })
                  .join("")}
              </ul>`
            : `<p class="help">No blocked users. Use Report / Block on a listing or message thread.</p>`
        }
      </div>
      <p class="help" style="margin-top:14px">This prototype stores data in your browser only (localStorage). It is not the live RenoSwap domain.</p>
      <p class="help">Pay sellers at pickup with cash, Venmo, or Zelle — no in-app checkout.</p>
      <div class="panel" style="margin-top:16px;background:#f3eee4;box-shadow:none">
        <h3 style="margin-top:0;font-size:16px">Demo accounts (testing)</h3>
        <p class="help">Sign in with email + password <code>demo</code>, or switch instantly:</p>
        <div class="actions">
          <button class="ghost" onclick="loginAsDemo('u_me')">You</button>
          <button class="ghost" onclick="loginAsDemo('u_home')">Elena</button>
          <button class="ghost" onclick="loginAsDemo('u_contractor')">Hill Country Builds</button>
          <button class="ghost" onclick="loginAsDemo('u_admin')">Admin</button>
        </div>
      </div>
      <button class="ghost" style="margin-top:10px" onclick="resetDemo()">Reset demo data (restore seeds)</button>
    </div>`;
}

function toggleEditCompany(role) {
  const el = document.getElementById("editCompanyField");
  if (el) el.style.display = role === "Contractor" ? "block" : "none";
}

function toggleSub() {
  const data = db.get();
  const me = data.users[data.currentUser];
  if (me.subscribed) {
    const count = activeCount(data, data.currentUser);
    if (count > 3) {
      const ok = confirm(
        `You have ${count} active listings. Canceling blocks new posts until you drop to 3 or resubscribe. Continue?`
      );
      if (!ok) return;
    }
    me.subscribed = false;
  } else {
    me.subscribed = true;
  }
  db.save(data);
  render();
}

function resetDemo() {
  if (!confirm("Clear local data and restore sample listings + message threads? You will return to the login screen.")) return;
  localStorage.removeItem("renoswap_v1");
  state = {
    view: "browse",
    listingId: null,
    threadId: null,
    intentFilter: "All",
    q: "",
    category: "All",
    searchZip: null,
    radiusMiles: null,
    sortBy: "expiry",
    pickOfferedId: null,
    authScreen: "welcome",
    editingProfile: false,
    avatarDraft: undefined,
    profileNotice: null,
    reportTarget: null,
    filtersOpen: false
  };
  render();
}

function setBrowseRadius(v) {
  if (v === "anywhere" || v === "" || v == null) {
    state.radiusMiles = null;
  } else {
    const n = Number(v);
    state.radiusMiles = Number.isFinite(n) ? n : null;
  }
  state.filtersOpen = true;
  render();
}

function setFilter(v) {
  state.intentFilter = v;
  state.filtersOpen = true;
  render();
}

render();
