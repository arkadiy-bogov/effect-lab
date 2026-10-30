const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";
const AMBIGUOUS = new Set("0OIl1|`'\"\\");

function randomInt(max) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function shuffle(chars) {
  const arr = [...chars];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function filterPool(pool, excludeAmbiguous) {
  if (!excludeAmbiguous) return pool;
  return [...pool].filter((ch) => !AMBIGUOUS.has(ch)).join("");
}

export function estimateStrength({ length, lower, upper, digits, symbols }) {
  let pool = 0;
  if (lower) pool += 26;
  if (upper) pool += 26;
  if (digits) pool += 10;
  if (symbols) pool += 20;
  if (pool <= 0 || length <= 0) return { score: 0, label: "Пусто", bits: 0 };
  const bits = Math.log2(pool) * length;
  if (bits < 40) return { score: 1, label: "Слабый", bits };
  if (bits < 60) return { score: 2, label: "Средний", bits };
  if (bits < 80) return { score: 3, label: "Хороший", bits };
  return { score: 4, label: "Отличный", bits };
}

export function generatePassword(options = {}) {
  const length = Math.max(4, Math.min(128, Math.round(options.length ?? 16)));
  const useLower = options.lower !== false;
  const useUpper = options.upper !== false;
  const useDigits = options.digits !== false;
  const useSymbols = options.symbols === true;
  const excludeAmbiguous = options.excludeAmbiguous === true;

  const groups = [];
  if (useLower) groups.push(filterPool(LOWER, excludeAmbiguous));
  if (useUpper) groups.push(filterPool(UPPER, excludeAmbiguous));
  if (useDigits) groups.push(filterPool(DIGITS, excludeAmbiguous));
  if (useSymbols) groups.push(filterPool(SYMBOLS, excludeAmbiguous));

  const usable = groups.filter((g) => g.length > 0);
  if (!usable.length) {
    throw new Error("Select at least one character set");
  }

  const all = usable.join("");
  const chars = usable.map((group) => group[randomInt(group.length)]);
  while (chars.length < length) {
    chars.push(all[randomInt(all.length)]);
  }
  return shuffle(chars).join("");
}
