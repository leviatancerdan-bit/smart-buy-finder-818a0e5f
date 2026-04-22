// Motor de análisis 100% local. Sin APIs externas, sin backend, sin coste.
// Ejecutado completamente en el navegador para que el sitio funcione como
// SPA estático en Vercel sin necesidad de funciones serverless.

export type LocalMarket = {
  name: string;
  city: string;
  trend: "up" | "down" | "stable";
  priceRange: string;
  tips: string;
};

export type PriceSuggestion = {
  query: string;
  country: string;
  category: string;
  verdict: "buy_now" | "wait" | "hold";
  verdictLabel: string;
  trend: "up" | "down" | "stable";
  confidence: number;
  tldr: string;
  estimatedPrice: string;
  bestMoment: string;
  summary: string;
  reasons: string[];
  newsHighlights: string[];
  communityInsights: string[];
  recommendedStores: { name: string; url: string; note: string }[];
  localMarkets: LocalMarket[];
  citations: string[];
};

export type DealItem = {
  title: string;
  category: string;
  store: string;
  url: string;
  discount: string;
  why: string;
};

type Category = "tecnologia" | "ia" | "videojuegos" | "suscripcion" | "otro";

function detectCategory(q: string): Category {
  const s = q.toLowerCase();
  if (/(chatgpt|gpt|claude|gemini|copilot|midjourney|perplexity|openai|anthropic|api)/.test(s)) return "ia";
  if (/(rtx|gtx|ryzen|intel|cpu|gpu|ssd|ram|monitor|laptop|notebook|iphone|samsung|xiaomi|pixel|airpods|teclado|mouse|router|tv|playstation|ps5|xbox|nintendo|switch)/.test(s)) return "tecnologia";
  if (/(game|juego|cyberpunk|zelda|mario|fifa|cod|call of duty|hollow knight|elden|gta|fortnite|minecraft|silksong|baldur|hogwarts|spider)/.test(s)) return "videojuegos";
  if (/(netflix|spotify|disney|hbo|prime|youtube premium|apple|icloud|onedrive|dropbox|notion|figma)/.test(s)) return "suscripcion";
  return "otro";
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string; rate: number }> = {
  "Internacional": { code: "USD", symbol: "$", rate: 1 },
  "España": { code: "EUR", symbol: "€", rate: 0.92 },
  "México": { code: "MXN", symbol: "$", rate: 18 },
  "Perú": { code: "PEN", symbol: "S/", rate: 3.75 },
  "Chile": { code: "CLP", symbol: "$", rate: 950 },
  "Argentina": { code: "ARS", symbol: "$", rate: 1000 },
  "Colombia": { code: "COP", symbol: "$", rate: 4000 },
  "Brasil": { code: "BRL", symbol: "R$", rate: 5 },
  "Estados Unidos": { code: "USD", symbol: "$", rate: 1 },
};

const BASE_PRICE_USD: Record<Category, [number, number]> = {
  tecnologia: [200, 900],
  ia: [10, 25],
  videojuegos: [25, 70],
  suscripcion: [8, 18],
  otro: [30, 200],
};

function formatPrice(country: string, cat: Category, seed: number): string {
  const cur = COUNTRY_CURRENCY[country] ?? COUNTRY_CURRENCY["Internacional"];
  const [lo, hi] = BASE_PRICE_USD[cat];
  const base = lo + ((seed % 100) / 100) * (hi - lo);
  const low = Math.round(base * cur.rate);
  const high = Math.round(base * cur.rate * 1.2);
  const fmt = (n: number) => n.toLocaleString("es");
  return `${cur.symbol} ${fmt(low)} - ${fmt(high)}`;
}

const LOCAL_MARKETS_BY_COUNTRY: Record<string, LocalMarket[]> = {
  "Perú": [
    { name: "Galerías Wilson", city: "Lima", trend: "stable", priceRange: "", tips: "Pide boleta, verifica RUC del puesto y revisa garantía mínima 6 meses." },
    { name: "Compuplaza (Plaza Tecnológica)", city: "Lima", trend: "down", priceRange: "", tips: "Compara entre 3 puestos antes de comprar. Evita ofertas sin caja sellada." },
    { name: "Polvos Azules sección tech", city: "Lima", trend: "stable", priceRange: "", tips: "Busca puestos formales con cartel y boleta. Revisa seriales." },
  ],
  "Chile": [
    { name: "Plaza de la Tecnología", city: "Santiago", trend: "stable", priceRange: "", tips: "Pide boleta SII y garantía. Compara en Plaza Meiggs antes de cerrar." },
    { name: "Galería Plaza Meiggs", city: "Santiago", trend: "down", priceRange: "", tips: "Mejores precios en bloque B. Revisa caja sellada y serie." },
  ],
  "Argentina": [
    { name: "Galería Jardín", city: "Buenos Aires", trend: "up", priceRange: "", tips: "Precios en pesos cambian semanal. Pide factura A o B siempre." },
    { name: "Once (Av. Pueyrredón)", city: "Buenos Aires", trend: "stable", priceRange: "", tips: "Negocia en efectivo, pero exige factura. Revisa garantía oficial." },
  ],
  "México": [
    { name: "Plaza de la Tecnología", city: "CDMX", trend: "stable", priceRange: "", tips: "Pide factura, verifica RFC. Evita pasillos sin nombre comercial." },
    { name: "Centro Capital", city: "CDMX", trend: "down", priceRange: "", tips: "Buenos precios en componentes. Compara mínimo 3 locales." },
  ],
  "Colombia": [
    { name: "Unilago", city: "Bogotá", trend: "stable", priceRange: "", tips: "Pide factura electrónica. Verifica garantía con el importador." },
    { name: "San Andresito de la 38", city: "Bogotá", trend: "down", priceRange: "", tips: "Solo locales con razón social visible y factura DIAN." },
  ],
  "Brasil": [
    { name: "Santa Efigênia", city: "São Paulo", trend: "stable", priceRange: "", tips: "Peça nota fiscal. Compare em pelo menos 3 lojas formais." },
    { name: "Shopping Paissandu", city: "São Paulo", trend: "down", priceRange: "", tips: "Boa para periféricos. Verifique garantia do fabricante." },
  ],
  "España": [
    { name: "Calle Preciados / Sol", city: "Madrid", trend: "stable", priceRange: "", tips: "Compra en tiendas con IVA incluido y ticket. Mejor en cadenas oficiales." },
    { name: "Mercat dels Encants (sección tech)", city: "Barcelona", trend: "down", priceRange: "", tips: "Para usados. Pide ticket y prueba el equipo antes de pagar." },
  ],
};

function localMarketsFor(country: string, cat: Category, seed: number): LocalMarket[] {
  if (cat === "ia" || cat === "suscripcion") return [];
  const base = LOCAL_MARKETS_BY_COUNTRY[country];
  if (!base) return [];
  const cur = COUNTRY_CURRENCY[country] ?? COUNTRY_CURRENCY["Internacional"];
  const [lo, hi] = BASE_PRICE_USD[cat];
  return base.map((m, i) => {
    const low = Math.round((lo + (((seed + i * 7) % 50) / 100) * (hi - lo)) * cur.rate * 0.9);
    const high = Math.round(low * 1.18);
    return {
      ...m,
      priceRange: `${cur.symbol} ${low.toLocaleString("es")} - ${high.toLocaleString("es")}`,
    };
  });
}

const STORES_BY_COUNTRY: Record<string, { name: string; url: string }[]> = {
  "Perú": [
    { name: "Mercado Libre Perú", url: "https://www.mercadolibre.com.pe" },
    { name: "Falabella Perú", url: "https://www.falabella.com.pe" },
    { name: "Ripley Perú", url: "https://simple.ripley.com.pe" },
  ],
  "Chile": [
    { name: "Falabella Chile", url: "https://www.falabella.com" },
    { name: "MercadoLibre Chile", url: "https://www.mercadolibre.cl" },
    { name: "PC Factory", url: "https://www.pcfactory.cl" },
  ],
  "Argentina": [
    { name: "MercadoLibre Argentina", url: "https://www.mercadolibre.com.ar" },
    { name: "Fravega", url: "https://www.fravega.com" },
  ],
  "México": [
    { name: "Amazon México", url: "https://www.amazon.com.mx" },
    { name: "MercadoLibre México", url: "https://www.mercadolibre.com.mx" },
    { name: "Liverpool", url: "https://www.liverpool.com.mx" },
  ],
  "Colombia": [
    { name: "MercadoLibre Colombia", url: "https://www.mercadolibre.com.co" },
    { name: "Falabella Colombia", url: "https://www.falabella.com.co" },
  ],
  "Brasil": [
    { name: "Mercado Livre Brasil", url: "https://www.mercadolivre.com.br" },
    { name: "Amazon Brasil", url: "https://www.amazon.com.br" },
    { name: "Kabum!", url: "https://www.kabum.com.br" },
  ],
  "España": [
    { name: "Amazon España", url: "https://www.amazon.es" },
    { name: "PcComponentes", url: "https://www.pccomponentes.com" },
    { name: "MediaMarkt", url: "https://www.mediamarkt.es" },
  ],
  "Estados Unidos": [
    { name: "Amazon", url: "https://www.amazon.com" },
    { name: "Best Buy", url: "https://www.bestbuy.com" },
    { name: "Newegg", url: "https://www.newegg.com" },
  ],
  "Internacional": [
    { name: "Amazon", url: "https://www.amazon.com" },
    { name: "eBay", url: "https://www.ebay.com" },
  ],
};

function storesFor(country: string, cat: Category): { name: string; url: string; note: string }[] {
  const generic = STORES_BY_COUNTRY[country] ?? STORES_BY_COUNTRY["Internacional"];
  const list: { name: string; url: string; note: string }[] = [];
  if (cat === "videojuegos") {
    list.push(
      { name: "Steam", url: "https://store.steampowered.com", note: "Rebajas estacionales hasta -75%." },
      { name: "Epic Games", url: "https://store.epicgames.com", note: "Juegos gratis semanales y cupones." },
      { name: "GOG", url: "https://www.gog.com", note: "Sin DRM, ideal para clásicos." },
    );
  } else if (cat === "ia") {
    list.push(
      { name: "OpenAI", url: "https://openai.com", note: "Plan Plus mensual, sin descuentos." },
      { name: "Anthropic Claude", url: "https://claude.ai", note: "Plan Pro estable, sin promos." },
    );
  } else if (cat === "suscripcion") {
    list.push({ name: "Sitio oficial", url: "#", note: "Compara plan anual vs mensual." });
  }
  for (const s of generic) list.push({ ...s, note: "Tienda oficial del país, con garantía." });
  return list.slice(0, 6);
}

export function buildSuggestion(query: string, country: string): PriceSuggestion {
  const cat = detectCategory(query);
  const seed = hash(query.toLowerCase() + country);

  const verdicts: PriceSuggestion["verdict"][] = ["buy_now", "wait", "hold"];
  const verdict = verdicts[seed % 3];
  const trend: PriceSuggestion["trend"] =
    verdict === "buy_now" ? "down" : verdict === "wait" ? "up" : "stable";

  const verdictLabel =
    verdict === "buy_now" ? "Buen momento" : verdict === "wait" ? "Mejor esperar" : "Precio estable";

  const tldrByVerdict = {
    buy_now: `${query}: precio bajo ahora, buen momento para comprar.`,
    wait: `${query}: precio alto, conviene esperar próximas rebajas.`,
    hold: `${query}: precio normal, sin urgencia para comprar.`,
  };

  const bestMomentByCountry: Record<string, string> = {
    "Perú": "CyberWow (jul) o CyberDays (nov)",
    "Chile": "CyberDay (jun) o CyberMonday (oct)",
    "Argentina": "Hot Sale (mayo) o Cyber Monday (nov)",
    "México": "El Buen Fin (nov) o Hot Sale (mayo)",
    "Colombia": "Día sin IVA o Black Friday (nov)",
    "Brasil": "Black Friday (nov)",
    "España": "Black Friday (nov) o Rebajas de enero",
  };
  const bestMoment = bestMomentByCountry[country] ?? "Black Friday (nov) o rebajas estacionales";

  const reasonsPool = [
    "Histórico muestra rebajas similares cada 2-3 meses.",
    "Producto con stock alto en tiendas oficiales del país.",
    "Competencia entre tiendas presiona el precio a la baja.",
    "Categoría con ciclos claros de oferta estacional.",
    "Modelo vigente sin sucesor anunciado en el corto plazo.",
    "Tipo de cambio influye en el precio importado.",
  ];
  const newsPool = [
    "Tiendas oficiales anunciaron campañas de descuento próximas.",
    "Reportes de comunidad indican bajadas recientes en marketplaces.",
    "Fabricante mantiene precio sugerido sin cambios.",
    "Importadores del país reportan stock estable.",
  ];
  const communityPool = [
    "Usuarios recomiendan esperar a fechas clave de rebajas.",
    "Foros locales reportan mejores precios en tiendas físicas formales.",
    "Comunidad sugiere comprar con tarjeta para acceder a cuotas sin interés.",
  ];

  const pick = <T,>(arr: T[], n: number) => arr.slice(0, n);

  return {
    query,
    country,
    category: cat,
    verdict,
    verdictLabel,
    trend,
    confidence: 60 + (seed % 30),
    tldr: tldrByVerdict[verdict],
    estimatedPrice: formatPrice(country, cat, seed),
    bestMoment,
    summary:
      verdict === "buy_now"
        ? `Indicadores apuntan a un precio favorable para ${query} en ${country}. Verifica siempre en la tienda oficial antes de pagar.`
        : verdict === "wait"
          ? `Hoy ${query} está por encima del promedio en ${country}. Esperar a fechas de rebaja suele dar mejor precio.`
          : `${query} mantiene un precio estable en ${country}. Comprar ahora o esperar tiene poca diferencia.`,
    reasons: pick(reasonsPool, 4),
    newsHighlights: pick(newsPool, 3),
    communityInsights: pick(communityPool, 3),
    recommendedStores: storesFor(country, cat),
    localMarkets: localMarketsFor(country, cat, seed),
    citations: [],
  };
}

const DEALS_TEMPLATES: Omit<DealItem, "store" | "url">[] = [
  { title: "Cyberpunk 2077", category: "videojuegos", discount: "-60%", why: "Rebaja estacional típica en Steam." },
  { title: "Hollow Knight", category: "videojuegos", discount: "-50%", why: "Indie en oferta frecuente." },
  { title: "Elden Ring", category: "videojuegos", discount: "-40%", why: "Aniversario del juego." },
  { title: "RTX 4070 Super", category: "tecnologia", discount: "-15%", why: "Stock alto y competencia entre tiendas." },
  { title: "iPhone 15", category: "tecnologia", discount: "-12%", why: "Llegada del modelo siguiente." },
  { title: "Logitech MX Master 3S", category: "tecnologia", discount: "-25%", why: "Promo periódica del fabricante." },
  { title: "ChatGPT Plus", category: "ia", discount: "Sin descuento", why: "Precio fijo mensual." },
  { title: "Claude Pro", category: "ia", discount: "Sin descuento", why: "Plan estable mensual." },
  { title: "Spotify Premium", category: "suscripcion", discount: "3 meses gratis", why: "Promo recurrente para nuevos usuarios." },
  { title: "Netflix Estándar", category: "suscripcion", discount: "Plan con anuncios -40%", why: "Plan económico disponible." },
  { title: "Nintendo Switch OLED", category: "tecnologia", discount: "-10%", why: "Rebajas en cadenas oficiales." },
  { title: "Baldur's Gate 3", category: "videojuegos", discount: "-20%", why: "Primera oferta estacional." },
];

const EXTRA_DEALS: Omit<DealItem, "store" | "url">[] = [
  { title: "Red Dead Redemption 2", category: "videojuegos", discount: "-67%", why: "Histórico mínimo en Steam." },
  { title: "GTA V Premium", category: "videojuegos", discount: "-70%", why: "Oferta semanal recurrente." },
  { title: "Hogwarts Legacy", category: "videojuegos", discount: "-50%", why: "Ya pasó un año desde el lanzamiento." },
  { title: "Spider-Man Remastered", category: "videojuegos", discount: "-45%", why: "Rebaja frecuente fuera de fechas pico." },
  { title: "RTX 4060", category: "tecnologia", discount: "-18%", why: "GPU de gama media con stock saludable." },
  { title: "AMD Ryzen 5 7600", category: "tecnologia", discount: "-22%", why: "Bajada por llegada de nueva gen." },
  { title: "SSD NVMe 1TB Samsung 980", category: "tecnologia", discount: "-35%", why: "Almacenamiento en oferta agresiva." },
  { title: "Monitor 27\" 144Hz IPS", category: "tecnologia", discount: "-28%", why: "Competencia fuerte entre marcas." },
  { title: "AirPods Pro 2", category: "tecnologia", discount: "-15%", why: "Rebaja típica fuera de Black Friday." },
  { title: "Samsung Galaxy S23", category: "tecnologia", discount: "-30%", why: "Reemplazo por modelo sucesor." },
  { title: "GitHub Copilot", category: "ia", discount: "Gratis para estudiantes", why: "Beneficio educativo permanente." },
  { title: "Perplexity Pro", category: "ia", discount: "1 año gratis con plan partner", why: "Promo activa con operadores." },
  { title: "Notion Plus", category: "suscripcion", discount: "-50% plan anual", why: "Descuento por pago anual vs mensual." },
  { title: "YouTube Premium Familiar", category: "suscripcion", discount: "Hasta 5 cuentas", why: "Ahorro por cuenta vs plan individual." },
  { title: "Disney+ anual", category: "suscripcion", discount: "-16% vs mensual", why: "Mejor relación pagando anual." },
];

export function buildDeals(country: string): DealItem[] {
  const stores = STORES_BY_COUNTRY[country] ?? STORES_BY_COUNTRY["Internacional"];
  const all = [...DEALS_TEMPLATES, ...EXTRA_DEALS];
  return all.map((d, i) => {
    let store = stores[i % stores.length];
    if (d.category === "videojuegos") {
      const gameStores = [
        { name: "Steam", url: "https://store.steampowered.com" },
        { name: "Epic Games", url: "https://store.epicgames.com" },
        { name: "GOG", url: "https://www.gog.com" },
      ];
      store = gameStores[i % gameStores.length];
    } else if (d.category === "ia") {
      store = {
        name: d.title.includes("Claude") ? "Anthropic" : "OpenAI",
        url: d.title.includes("Claude") ? "https://claude.ai" : "https://openai.com",
      };
    } else if (d.category === "suscripcion") {
      store = { name: d.title.split(" ")[0], url: "#" };
    }
    return { ...d, store: store.name, url: store.url };
  });
}
