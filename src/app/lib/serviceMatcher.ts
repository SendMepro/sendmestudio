export type ServiceKeywordSource = {
  id: string;
  keywords?: string[];
  name?: string;
};

const serviceAliases: Record<string, string[]> = {
  balayage: [
    "balayage",
    "balayagee",
    "balayash",
    "balayageh",
    "balallage",
    "ballage",
    "balaje",
    "balalle",
    "balayach",
    "balayachis",
    "ballayage",
    "ballayash",
    "bayalage",
    "bayalash",
    "balay",
    "baleage",
    "baleaje",
    "balayaje",
    "baliage",
    "baliaje",
    "balayague",
    "mechas",
    "iluminacion",
    "iluminación",
    "rubios",
    "rubio",
    "rubia",
    "rayitos",
    "reflejos",
    "claritos",
    "babylight",
    "babylights",
  ],
  color: [
    "color",
    "coloracion",
    "coloración",
    "colorar",
    "colorear",
    "tintura",
    "tinte",
    "tono",
    "tonalidad",
    "cambio de color",
    "raiz",
    "raíz",
    "canas",
    "cubrimiento",
    "cobertura",
    "matizar",
    "matiz",
    "rubio",
    "castano",
    "castaño",
    "pelirrojo",
    "morena iluminada",
  ],
  corte: [
    "corte",
    "cortar",
    "cortarme",
    "cortito",
    "cabello",
    "pelo",
    "melena",
    "capas",
    "flequillo",
    "chascas",
    "puntas",
    "rebajar",
    "despuntar",
    "bob",
    "long bob",
    "pixie",
    "degradado",
    "forma",
    "movimiento",
    "corte mujer",
  ],
  lavado: [
    "lavado",
    "lavar",
    "shampoo",
    "champu",
    "champú",
    "brushing",
    "peinado",
    "secado",
    "blower",
    "cepillado",
    "ondas",
    "plancha",
    "styling",
    "lavado y peinado",
    "lavarme",
    "lavado cabello",
    "lavado de pelo",
    "lavado de cabello",
  ],
  hidratacion: [
    "hidratacion",
    "hidratación",
    "hidratar",
    "hidratante",
    "tratamiento",
    "nutricion",
    "nutrición",
    "reparacion",
    "reparación",
    "frizz",
    "seco",
    "reseco",
    "opaco",
    "mascarilla",
    "olaplex",
    "repair",
    "ritual",
    "brillo",
    "suavidad",
    "pelo seco",
    "cabello seco",
  ],
  gloss: [
    "gloss",
    "glossing",
    "brillo",
    "baño de brillo",
    "bano de brillo",
    "matiz",
    "matizar",
    "toner",
    "tonalizar",
    "sellado",
    "luminosidad",
    "refresh color",
    "mantenimiento color",
    "brillo color",
    "glaseado",
  ],
  alisado: [
    "alisado",
    "alisar",
    "liso",
    "keratina",
    "queratina",
    "anti frizz",
    "antifrizz",
    "btx",
    "botox capilar",
    "brasileno",
    "brasileño",
    "planchado",
    "suavizado",
    "cabello liso",
    "pelo liso",
    "control frizz",
  ],
};

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function unique(values: string[]) {
  return [...new Set(values.map(normalizeSearchText).filter(Boolean))];
}

function aliasesFor(service: ServiceKeywordSource) {
  return unique([
    service.id,
    service.name ?? "",
    ...(service.keywords ?? []),
    ...(serviceAliases[service.id] ?? []),
  ]);
}

export function fuzzyIncludes(text: string, keyword: string) {
  const normalizedText = normalizeSearchText(text);
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  if (normalizedText.includes(normalizedKeyword)) {
    return true;
  }

  const words = normalizedText.split(" ").filter(Boolean);

  if (normalizedKeyword.includes(" ")) {
    return false;
  }

  return words.some((word) => {
    if (Math.abs(word.length - normalizedKeyword.length) > 2) {
      return false;
    }

    const distance = levenshtein(word, normalizedKeyword);
    const tolerance = normalizedKeyword.length >= 8 ? 2 : 1;
    const similarity = 1 - distance / Math.max(word.length, normalizedKeyword.length);

    return distance <= tolerance || similarity >= 0.78;
  });
}

export function matchesServiceText(
  text: string,
  serviceId: string,
  keywords: string[] = []
) {
  return aliasesFor({ id: serviceId, keywords }).some((alias) => fuzzyIncludes(text, alias));
}

export function matchTextToServices(text: string, services: ServiceKeywordSource[]) {
  return services
    .map((service) => ({
      service,
      matched: aliasesFor(service).some((alias) => fuzzyIncludes(text, alias)),
    }))
    .filter((item) => item.matched)
    .map((item) => item.service);
}

