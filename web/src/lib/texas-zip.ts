/**
 * True Texas ZIP check (mirrors demo app.js).
 * Allowlist of USPS 3-digit ZIP prefixes assigned to Texas:
 * 750–799 (statewide), 733 (Austin unique), 885 (El Paso PO Boxes).
 */
const TX_ZIP_PREFIXES: Set<string> = (() => {
  const s = new Set<string>(["733", "885"]);
  for (let i = 750; i <= 799; i++) s.add(String(i));
  return s;
})();

export function isTexasZip(zip: string | null | undefined): boolean {
  const z = String(zip || "").trim();
  if (!/^\d{5}$/.test(z)) return false;
  return TX_ZIP_PREFIXES.has(z.slice(0, 3));
}

export function texasZipError(zip: string | null | undefined): string | null {
  const z = String(zip || "").trim();
  if (!z) return "ZIP is required.";
  if (!/^\d{5}$/.test(z)) return "Enter a 5-digit ZIP code.";
  if (!isTexasZip(z)) return "RenoSwap is Texas-only for now — use a Texas ZIP.";
  return null;
}
