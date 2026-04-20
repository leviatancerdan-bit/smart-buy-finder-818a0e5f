import { createServerFn } from "@tanstack/react-start";

export type PriceSuggestion = {
  query: string;
  country: string;
  category: string;
  verdict: "buy_now" | "wait" | "hold";
  verdictLabel: string;
  trend: "up" | "down" | "stable";
  confidence: number; // 0-100
  tldr: string;
  estimatedPrice: string;
  bestMoment: string;
  summary: string;
  reasons: string[];
  newsHighlights: string[];
  communityInsights: string[];
  recommendedStores: { name: string; url: string; note: string }[];
  citations: string[];
};

const SYSTEM = `Eres un analista experto en precios de productos tecnológicos, planes de IA, juegos (Steam, Epic, GOG, PlayStation, Xbox) y suscripciones digitales.
Te darán un producto y un país. Devuelve SOLO JSON válido (sin markdown ni texto extra) con esta forma EXACTA:
{
  "category": "tecnologia" | "ia" | "videojuegos" | "suscripcion" | "otro",
  "verdict": "buy_now" | "wait" | "hold",
  "verdictLabel": "string corto en español (máx 4 palabras)",
  "trend": "up" | "down" | "stable",
  "confidence": número 0-100,
  "tldr": "UNA sola frase corta y directa con la recomendación (máx 20 palabras, lenguaje sencillo)",
  "estimatedPrice": "rango o precio típico en la moneda local del país, ej: '500-650 USD' o 'MXN 12,000-14,000'. Si no sabes, 'No disponible'",
  "bestMoment": "frase corta indicando cuándo conviene comprar, ej: 'Espera al Black Friday (nov)' o 'Ahora mismo en Steam Sale'",
  "summary": "2-3 frases en español, claras y sin tecnicismos, explicando la situación de precio",
  "reasons": ["3-5 razones MUY concretas y cortas en español, cada una de máx 15 palabras"],
  "newsHighlights": ["3-5 hechos relevantes sobre precios, lanzamientos o rebajas conocidas, frases cortas"],
  "communityInsights": ["2-4 opiniones típicas de comunidad/foros (Reddit, foros, Twitter), frases cortas"],
  "recommendedStores": [
    {"name": "Tienda oficial disponible en el país", "url": "https://...", "note": "por qué confiar o detalle de oferta (máx 12 palabras)"}
  ]
}
Reglas estrictas:
- Adapta TODO al país indicado: moneda local, tiendas que operan ahí, fechas de rebajas regionales (ej: El Buen Fin en México, CyberDay en Chile, Black Friday en US/EU).
- Solo tiendas LEGALES y oficiales (Steam, Epic, GOG, Humble, PlayStation/Xbox Store, Amazon del país, Mercado Libre oficial, web del fabricante, OpenAI, Anthropic). NUNCA reventas grises.
- "verdict": buy_now (oferta activa o precio bajo), wait (se espera bajada pronto), hold (estable, ni mal ni buen momento).
- Lenguaje: español claro, sin jerga técnica innecesaria. Frases cortas. El usuario debe entender en 5 segundos.
- Si no tienes datos claros, di "Información limitada" en summary y baja la confianza por debajo de 50.`;

async function callLovableAI(messages: { role: string; content: string }[]) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY no configurada");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) {
    throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
  }
  if (res.status === 402) {
    throw new Error("Se requieren créditos en Lovable AI para continuar.");
  }
  if (!res.ok) {
    const text = await res.text();
    console.error("Lovable AI error:", res.status, text);
    throw new Error(`AI Gateway error ${res.status}`);
  }
  const json = await res.json();
  return (json.choices?.[0]?.message?.content ?? "") as string;
}

function extractJson(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Respuesta del modelo no es JSON válido");
    return JSON.parse(match[0]);
  }
}

export const analyzePrice = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string; country?: string }) => {
    if (!data?.query || typeof data.query !== "string") {
      throw new Error("query requerido");
    }
    const q = data.query.trim().slice(0, 200);
    if (q.length < 2) throw new Error("query muy corto");
    const country = (data.country ?? "Internacional").toString().trim().slice(0, 50);
    return { query: q, country };
  })
  .handler(async ({ data }): Promise<PriceSuggestion> => {
    const content = await callLovableAI([
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Producto: "${data.query}"\nPaís: ${data.country}\n\nDevuelve solo el JSON pedido, adaptado a la moneda y tiendas de ${data.country}.`,
      },
    ]);

    const parsed = extractJson(content);

    return {
      query: data.query,
      country: data.country,
      category: parsed.category ?? "otro",
      verdict: parsed.verdict ?? "hold",
      verdictLabel: parsed.verdictLabel ?? "Mantente atento",
      trend: parsed.trend ?? "stable",
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 50)),
      tldr: parsed.tldr ?? "",
      estimatedPrice: parsed.estimatedPrice ?? "No disponible",
      bestMoment: parsed.bestMoment ?? "",
      summary: parsed.summary ?? "",
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 6) : [],
      newsHighlights: Array.isArray(parsed.newsHighlights)
        ? parsed.newsHighlights.slice(0, 6)
        : [],
      communityInsights: Array.isArray(parsed.communityInsights)
        ? parsed.communityInsights.slice(0, 6)
        : [],
      recommendedStores: Array.isArray(parsed.recommendedStores)
        ? parsed.recommendedStores.slice(0, 6)
        : [],
      citations: [],
    };
  });

export type DealItem = {
  title: string;
  category: string;
  store: string;
  url: string;
  discount: string;
  why: string;
};

const DEALS_SYSTEM = `Eres un experto en ofertas legales. Devuelve SOLO JSON con esta forma:
{
  "deals": [
    {
      "title": "Nombre del producto",
      "category": "tecnologia" | "ia" | "videojuegos" | "suscripcion",
      "store": "Tienda oficial disponible en el país",
      "url": "https://link-oficial",
      "discount": "ej: -40% o $X menos en moneda local",
      "why": "razón breve (máx 12 palabras)"
    }
  ]
}
Solo tiendas legales del país indicado (Steam, Epic, GOG, Humble, PlayStation/Xbox Store, Amazon local, Mercado Libre oficial, fabricantes oficiales, OpenAI, etc.). 8-12 ofertas mezclando categorías. Responde en español.`;

export const fetchDeals = createServerFn({ method: "POST" })
  .inputValidator((data: { country?: string }) => {
    const country = (data?.country ?? "Internacional").toString().trim().slice(0, 50);
    return { country };
  })
  .handler(async ({ data }): Promise<DealItem[]> => {
    const content = await callLovableAI([
      { role: "system", content: DEALS_SYSTEM },
      {
        role: "user",
        content: `País: ${data.country}. Lista 8-12 ofertas y rebajas típicas o probables en productos tecnológicos, planes de IA, juegos en Steam/Epic/GOG/consolas y suscripciones digitales legales, adaptadas a la moneda y tiendas de ${data.country}.`,
      },
    ]);

    try {
      const parsed = extractJson(content);
      return Array.isArray(parsed.deals) ? parsed.deals.slice(0, 12) : [];
    } catch {
      return [];
    }
  });
