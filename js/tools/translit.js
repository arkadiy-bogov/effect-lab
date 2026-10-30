// Профили назначения: URL, код, ISO 9, загранпаспорт РФ

const BASE_LAT = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  і: "i",
  ї: "yi",
  є: "ye",
  ґ: "g",
};

const PASSPORT = {
  ...BASE_LAT,
  ё: "e",
  й: "i",
  ю: "iu",
  я: "ia",
  ъ: "",
  ь: "",
};

const ISO9 = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "ë",
  ж: "ž",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "č",
  ш: "š",
  щ: "ŝ",
  ъ: "ʺ",
  ы: "y",
  ь: "ʹ",
  э: "è",
  ю: "û",
  я: "â",
  і: "ì",
  ї: "ï",
  є: "ê",
  ґ: "g̀",
};

const URL_MAP = {
  ...BASE_LAT,
  й: "j",
  х: "h",
  ц: "c",
  щ: "sch",
};

export const TRANSLIT_PROFILES = [
  {
    id: "url",
    label: "URL / ЧПУ",
    hint: "Нижний регистр, дефисы, без лишних символов. Для slug и путей.",
  },
  {
    id: "code",
    label: "Код / идентификатор",
    hint: "Безопасный идентификатор: snake_case или camelCase.",
  },
  {
    id: "intl",
    label: "Международный (ISO 9)",
    hint: "Научная транслитерация ISO 9:1995 с диакритикой, 1:1.",
  },
  {
    id: "passport",
    label: "Загранпаспорт РФ",
    hint: "Правила МИД/ICAO для российских загранпаспортов.",
  },
];

function mapChar(ch, table) {
  const lower = ch.toLowerCase();
  const mapped = table[lower];
  if (mapped == null) return ch;
  if (ch !== lower && mapped) {
    return mapped[0].toUpperCase() + mapped.slice(1);
  }
  return mapped;
}

function applyTable(text, table) {
  let out = "";
  for (const ch of text) {
    if (/[A-Za-z0-9]/.test(ch)) {
      out += ch;
      continue;
    }
    out += mapChar(ch, table);
  }
  return out;
}

function toSlug(text) {
  return applyTable(text, URL_MAP)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toCode(text, style) {
  const raw = applyTable(text, BASE_LAT)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!raw) return "";

  if (style === "camel") {
    return raw
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
      .join("");
  }

  if (style === "pascal") {
    return raw
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("");
  }

  let snake = raw.toLowerCase();
  if (/^[0-9]/.test(snake)) snake = `id_${snake}`;
  return snake;
}

function toPassport(text) {
  return applyTable(text, PASSPORT)
    .replace(/[^A-Za-z\-\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toIntl(text) {
  return applyTable(text, ISO9);
}

export function transliterate(text, profile = "url", options = {}) {
  const value = String(text ?? "");
  switch (profile) {
    case "code":
      return toCode(value, options.codeStyle || "snake");
    case "intl":
      return toIntl(value);
    case "passport":
      return toPassport(value);
    case "url":
    default:
      return toSlug(value);
  }
}
