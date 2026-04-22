import { useEffect, useMemo, useState } from "react";
import { buildDeals, type DealItem } from "@/lib/price-analysis";
import { CategoryChip } from "./badges";
import { ExternalLink, Sparkles, Loader2, Search, ArrowUpDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type SortBy = "discount" | "title" | "store";

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "videojuegos", label: "Videojuegos" },
  { id: "ia", label: "Planes IA" },
  { id: "suscripcion", label: "Suscripciones" },
];

function discountValue(d: string): number {
  const m = d.match(/-?(\d+)\s*%/);
  if (m) return parseInt(m[1], 10);
  if (/gratis/i.test(d)) return 100;
  return 0;
}

export function DealsSection({ country }: { country: string }) {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("discount");

  const load = async () => {
    setLoading(true);
    // Pequeño delay simulado para feedback visual
    await new Promise((r) => setTimeout(r, 250));
    setDeals(buildDeals(country));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const filtered = useMemo(() => {
    let out = deals;
    if (filter !== "all") out = out.filter((d) => d.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      out = out.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.store.toLowerCase().includes(q) ||
          d.why.toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    if (sortBy === "discount") {
      sorted.sort((a, b) => discountValue(b.discount) - discountValue(a.discount));
    } else if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "store") {
      sorted.sort((a, b) => a.store.localeCompare(b.store));
    }
    return sorted;
  }, [deals, filter, search, sortBy]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: deals.length };
    for (const d of deals) c[d.category] = (c[d.category] ?? 0) + 1;
    return c;
  }, [deals]);

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">
            Ofertas activas esta semana
          </h2>
          <p className="mt-1 text-muted-foreground">
            Rebajas en tiendas legales para{" "}
            <span className="font-semibold text-foreground">{country}</span>: Steam,
            Epic, fabricantes oficiales y más.
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
            <RefreshCw className="h-4 w-4" />
          )}
          Actualizar
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar ofertas por nombre, tienda..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-transparent text-sm text-foreground outline-none"
          >
            <option value="discount">Mayor descuento</option>
            <option value="title">Nombre A–Z</option>
            <option value="store">Tienda A–Z</option>
          </select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
              filter === f.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {f.label}
            {counts[f.id] != null && (
              <span className="rounded-full bg-background/60 px-1.5 text-[10px] tabular-nums">
                {counts[f.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && deals.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-border bg-card/40"
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && deals.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
          No se encontraron ofertas con esos filtros.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d, i) => {
          const dv = discountValue(d.discount);
          const hot = dv >= 40;
          return (
            <a
              key={`${d.title}-${i}`}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-[var(--shadow-glow)]"
            >
              {hot && (
                <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 rounded-full bg-[var(--gradient-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-glow)]">
                  <Sparkles className="h-3 w-3" />
                  Hot
                </span>
              )}
              <div className="mb-2 flex items-center justify-between">
                <CategoryChip category={d.category} />
                <span className="rounded-md bg-success/20 px-2 py-0.5 text-xs font-bold text-success">
                  {d.discount}
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary">
                {d.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.why}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">{d.store}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground transition group-hover:text-primary">
                  Ver oferta
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
