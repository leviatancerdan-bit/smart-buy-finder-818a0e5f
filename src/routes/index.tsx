import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  buildSuggestion,
  type PriceSuggestion,
} from "@/lib/price-analysis";
import { useHistory } from "@/hooks/use-history";
import { ResultCard } from "@/components/result-card";
import { DealsSection } from "@/components/deals-section";
import { TrendBadge } from "@/components/badges";
import { CountrySelect } from "@/components/country-select";
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
          "Descubre cuándo comprar o esperar. Análisis local de tech, planes de IA y juegos.",
      },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = [
  "RTX 4070 Super",
  "RTX 4090",
  "Ryzen 7 7800X3D",
  "ChatGPT Plus",
  "Claude Pro",
  "GitHub Copilot",
  "Cyberpunk 2077",
  "Hollow Knight Silksong",
  "Elden Ring",
  "Baldur's Gate 3",
  "iPhone 15 Pro",
  "Samsung S24",
  "PlayStation 5",
  "Nintendo Switch OLED",
  "AirPods Pro 2",
  "Spotify Premium",
  "Netflix",
  "Notion",
];

const SEARCH_STEPS = [
  "Detectando categoría del producto...",
  "Cruzando precios históricos...",
  "Revisando tiendas oficiales...",
  "Analizando comentarios de la comunidad...",
  "Calculando mejor momento de compra...",
];

function Index() {
  const { items, add, remove, clear } = useHistory();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Internacional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceSuggestion | null>(null);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const visibleSuggestions = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTIONS.slice(0, 8);
    const matches = SUGGESTIONS.filter((s) => s.toLowerCase().includes(q));
    return matches.length > 0 ? matches.slice(0, 8) : SUGGESTIONS.slice(0, 6);
  })();

  // Limpia timers al desmontar
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearInterval(t));
    };
  }, []);

  const submit = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setProgress(0);
    setStepIdx(0);

    // Auto-refresh: barra de progreso + rotación de pasos en vivo
    timersRef.current.forEach((t) => clearInterval(t));
    const progTimer = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.random() * 6 + 2 : p));
    }, 120);
    const stepTimer = setInterval(() => {
      setStepIdx((i) => (i + 1) % SEARCH_STEPS.length);
    }, 700);
    timersRef.current = [progTimer, stepTimer];

    try {
      // Simulamos "fases" del análisis (todo local, sin red)
      await new Promise((r) => setTimeout(r, 1400));
      const res = buildSuggestion(q.trim(), country);
      setProgress(100);
      // Pequeña pausa para que el 100% se vea
      await new Promise((r) => setTimeout(r, 200));
      setResult(res);
      add({
        query: res.query,
        at: Date.now(),
        verdict: res.verdict,
        trend: res.trend,
      });
    } finally {
      timersRef.current.forEach((t) => clearInterval(t));
      timersRef.current = [];
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Análisis 100% local
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="mx-auto mt-10 max-w-2xl"
        >
          <div className="card-glow flex items-center gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-[var(--shadow-elevated)] backdrop-blur-xl transition focus-within:border-primary">
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
              className="cta-pulse inline-flex items-center gap-2 rounded-xl bg-[var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-[1.02] hover:opacity-95 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analizar"}
            </button>
          </div>

          <div className="mt-3 flex justify-center">
            <CountrySelect value={country} onChange={setCountry} />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {visibleSuggestions.map((s) => (
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

        {/* Auto-refresh: barra de progreso en vivo */}
        {loading && (
          <div className="card-glow fade-up mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-semibold">Analizando "{query}"</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground transition-all">
              {SEARCH_STEPS[stepIdx]}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full rounded-full bg-[var(--gradient-primary)] transition-all duration-150"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>Refrescando datos...</span>
              <span>{Math.round(Math.min(100, progress))}%</span>
            </div>
          </div>
        )}

        {result && (
          <div className="fade-up mt-10">
            <ResultCard result={result} />
          </div>
        )}

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

        <DealsSection country={country} />

        <footer className="mt-20 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          PriceWatch funciona 100% en tu navegador, sin servidor ni APIs externas.
          Las recomendaciones son orientativas; verifica siempre el precio en la
          tienda oficial antes de comprar.
        </footer>
      </div>
    </div>
  );
}
