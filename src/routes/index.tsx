import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import {
  analyzePrice,
  type PriceSuggestion,
} from "@/server/price-analysis.functions";
import { useHistory } from "@/hooks/use-history";
import { ResultCard } from "@/components/result-card";
import { DealsSection } from "@/components/deals-section";
import { TrendBadge } from "@/components/badges";
import { Search, Loader2, Clock, X, Trash2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PriceWatch — Sugerencias de precio en productos tech, IA y juegos" },
      {
        name: "description",
        content:
          "Analiza si subir o bajar el precio de cualquier producto tecnológico, plan de IA o videojuego. Noticias, comentarios y tiendas legales.",
      },
      { property: "og:title", content: "PriceWatch — Análisis inteligente de precios" },
      {
        property: "og:description",
        content:
          "Descubre cuándo comprar o esperar. IA + búsqueda web real para tech, planes de IA y juegos.",
      },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = [
  "RTX 4070 Super",
  "ChatGPT Plus",
  "Cyberpunk 2077",
  "iPhone 15 Pro",
  "Hollow Knight Silksong",
  "Claude Pro",
];

function Index() {
  const analyze = useServerFn(analyzePrice);
  const { items, add, remove, clear } = useHistory();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyze({ data: { query: q.trim() } });
      setResult(res);
      add({
        query: res.query,
        at: Date.now(),
        verdict: res.verdict,
        trend: res.trend,
      });
    } catch (e: any) {
      setError(e?.message ?? "Error analizando producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <header className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Análisis con IA
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-6xl">
            ¿Subo, bajo o{" "}
            <span className="bg-[var(--gradient-primary)] bg-clip-text text-transparent">
              espero?
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Analiza tendencias de precios, noticias y opiniones de comunidad para
            productos tecnológicos, planes de IA y juegos. Solo tiendas legales.
          </p>
        </header>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="mx-auto mt-10 max-w-2xl"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-elevated)] focus-within:border-primary">
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: RTX 4070, Cyberpunk 2077, ChatGPT Plus..."
              className="flex-1 bg-transparent px-1 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Analizar"
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  submit(s);
                }}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card/60 p-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Analizando precios, tendencias y ofertas con IA...
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-10">
            <ResultCard result={result} />
          </div>
        )}

        {/* History */}
        {items.length > 0 && (
          <section className="mt-16">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Tu historial
              </h2>
              <button
                onClick={clear}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Borrar
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((h) => (
                <div
                  key={h.query + h.at}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 p-3"
                >
                  <button
                    onClick={() => {
                      setQuery(h.query);
                      submit(h.query);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="font-semibold text-foreground group-hover:text-primary">
                      {h.query}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <TrendBadge trend={h.trend} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(h.at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => remove(h.query)}
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Eliminar"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deals */}
        <DealsSection />

        <footer className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          PriceWatch usa IA para sugerir momentos de compra. Las recomendaciones son
          orientativas; verifica siempre el precio en la tienda oficial antes de comprar.
        </footer>
      </div>
    </div>
  );
}
