import { createServerFn } from "@tanstack/react-start";

export type PriceSuggestion = {
  query: string;
  category: string;
  verdict: "buy_now" | "wait" | "hold";
  verdictLabel: string;
  trend: "up" | "down" | "stable";
  confidence: number; // 0-100
  summary: string;
  reasons: string[];
  newsHighlights: string[];
  communityInsights: string[];
  recommendedStores: { name: string; url: string; note: string }[];
  citations: string[];
};

const SYSTEM = `Eres un analista experto en precios de productos tecnológicos, planes de IA, juegos (Steam, Epic, GOG, PlayStation, Xbox) y suscripciones digitales.
Analiza el producto que el usuario pide y devuelve SOLO JSON válido (sin texto extra, sin markdown) con esta forma:
{
  "category": "tecnologia" | "ia" | "videojuegos" | "suscripcion" | "otro",
  "verdict": "buy_now" | "wait" | "hold",
  "verdictLabel": "string corto en español",
  "trend": "up" | "down" | "stable",
  "confidence": número 0-100,
  "summary": "1-2 frases en español resumiendo la situación de precio actual",
  "reasons": ["3-5 razones concretas en español"],
  "newsHighlights": ["3-5 titulares o hechos recientes con fechas si las conoces"],
  "communityInsights": ["2-4 opiniones representativas de comunidad/foros (Reddit, foros, Twitter)"],
  "recommendedStores": [
    {"name": "Nombre tienda legal y oficial", "url": "https://...", "note": "por qué confiar en ella o detalle de oferta"}
  ]
}
Reglas:
- Solo recomienda tiendas LEGALES y oficiales (Steam, Epic, GOG, Humble, PlayStation Store, Xbox Store, Amazon, web oficial del fabricante, OpenAI, Anthropic, etc.). NUNCA reventas grises ni claves dudosas.
- "verdict": buy_now si el precio está bajo o hay oferta; wait si se espera bajada; hold si está estable o no es buen momento.
- Sé específico: menciona % de descuento, fechas de rebajas (Steam Summer/Winter Sale, Black Friday, etc.) cuando aplique.
- Si no encuentras info clara, di "Información limitada" en summary y baja la confianza.
- Responde TODO en español.`;

export const analyzePrice = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    if (!data?.query || typeof data.query !== "string") {
      throw new Error("query requerido");
    }
    const q = data.query.trim().slice(0, 200);
    if (q.length < 2) throw new Error("query muy corto");
    return { query: q };
  })
  .handler(async ({ data }): Promise<PriceSuggestion> => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY no configurada");
    }

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Producto a analizar: "${data.query}". Busca noticias recientes, ofertas activas, opiniones de comunidad y devuelve solo el JSON pedido.`,
          },
        ],
        temperature: 0.2,
        search_recency_filter: "month",
        return_citations: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Perplexity error:", res.status, text);
      throw new Error(`Perplexity API error ${res.status}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";
    const citations: string[] = json.citations ?? [];

    // Extract JSON from response
    let parsed: any;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : content);
    } catch {
      throw new Error("Respuesta del modelo no es JSON válido");
    }

    return {
      query: data.query,
      category: parsed.category ?? "otro",
      verdict: parsed.verdict ?? "hold",
      verdictLabel: parsed.verdictLabel ?? "Mantente atento",
      trend: parsed.trend ?? "stable",
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 50)),
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
      citations: citations.slice(0, 8),
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
      "store": "Tienda oficial",
      "url": "https://link-oficial",
      "discount": "ej: -40% o $X menos",
      "why": "razón breve de por qué es buena oferta ahora"
    }
  ]
}
Solo tiendas legales (Steam, Epic, GOG, Humble, PlayStation/Xbox Store, Amazon, fabricantes oficiales, OpenAI, etc.). 8-12 ofertas mezclando categorías. Responde en español.`;

export const fetchDeals = createServerFn({ method: "POST" }).handler(
  async (): Promise<DealItem[]> => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error("PERPLEXITY_API_KEY no configurada");

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: DEALS_SYSTEM },
          {
            role: "user",
            content:
              "Lista las mejores ofertas y rebajas activas esta semana en productos tecnológicos, planes de IA, juegos en Steam/Epic/GOG/consolas y suscripciones digitales legales.",
          },
        ],
        temperature: 0.3,
        search_recency_filter: "week",
      }),
    });

    if (!res.ok) {
      console.error("Perplexity deals error:", res.status, await res.text());
      throw new Error(`Perplexity API error ${res.status}`);
    }
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : content);
    } catch {
      return [];
    }
    return Array.isArray(parsed.deals) ? parsed.deals.slice(0, 12) : [];
  }
);
