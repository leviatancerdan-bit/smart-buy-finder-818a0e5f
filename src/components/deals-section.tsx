import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchDeals, type DealItem } from "@/server/price-analysis.functions";
import { CategoryChip } from "./badges";
import { ExternalLink, Sparkles, Loader2 } from "lucide-react";

export function DealsSection() {
  const fetchDealsFn = useServerFn(fetchDeals);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchDealsFn();
      setDeals(d);
      setLoaded(true);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando ofertas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Ofertas activas esta semana
          </h2>
          <p className="mt-1 text-muted-foreground">
            Rebajas en tiendas legales: Steam, Epic, fabricantes oficiales y más.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loaded ? "Actualizar" : "Cargar ofertas"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loaded && !loading && !error && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
          Pulsa <span className="font-semibold text-foreground">Cargar ofertas</span> para
          ver las mejores rebajas detectadas.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((d, i) => (
          <a
            key={i}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-[var(--shadow-glow)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <CategoryChip category={d.category} />
              <span className="rounded-md bg-success/20 px-2 py-0.5 text-xs font-bold text-success">
                {d.discount}
              </span>
            </div>
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary">
              {d.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{d.why}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{d.store}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
