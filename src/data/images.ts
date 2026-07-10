/**
 * Curated Unsplash photo pools per category. Every ID was verified to load and
 * visually checked to match its theme, so listing photos look on-topic
 * (beach stays show beaches, ski stays show snow, etc.).
 */
const IMAGE_POOLS: Record<string, string[]> = {
  beach: [
    "1507525428034-b723cf961d3e",
    "1505228395891-9a51e7e86bf6",
    "1518548419970-58e3b4079ab2",
    "1519046904884-53103b34b206",
  ],
  city: [
    "1502602898657-3e91760cbb34",
    "1496442226666-8d4d0e62e6e9",
    "1520175480921-4edfa2983e0f",
    "1477959858617-67f85cf4f1df",
  ],
  mountain: [
    "1464822759023-fed622ff2c3b",
    "1454496522488-7a8e488e8606",
    "1519681393784-d120267933ba",
  ],
  countryside: [
    "1500382017468-9049fed747ef",
    "1444858291040-58f756a3bdd6",
    "1470071459604-3b5ec3a7fe05",
    "1464082354059-27db6ce50048",
  ],
  lake: ["1501785888041-af3ef285b470", "1439066615861-d1af74d74000", "1470770903676-69b98201ea1c"],
  ski: [
    "1605540436563-5bca919ae766",
    "1551524559-8af4e6624178",
    "1517299321609-52687d1bc55a",
    "1518608774889-b04d2abe7702",
  ],
};

const FALLBACK_CATEGORY = "city";

function unsplashUrl(id: string, width = 1200, height = 800): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/**
 * Build a listing gallery from a category's pool. `offset` (the listing's index
 * among stays sharing the category) rotates the pool so same-category listings
 * get distinct covers and orderings. Returns one URL per pool image.
 */
export function galleryForCategory(categoryKey: string, offset = 0): string[] {
  const pool = IMAGE_POOLS[categoryKey] ?? IMAGE_POOLS[FALLBACK_CATEGORY];
  return pool.map((_, i) => unsplashUrl(pool[(offset + i) % pool.length]));
}
