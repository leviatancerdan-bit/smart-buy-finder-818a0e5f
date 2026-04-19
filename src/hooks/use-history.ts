import { useEffect, useState } from "react";

const KEY = "pricewatch_history_v1";

export type HistoryEntry = {
  query: string;
  at: number;
  verdict: "buy_now" | "wait" | "hold";
  trend: "up" | "down" | "stable";
};

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: HistoryEntry[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const add = (entry: HistoryEntry) => {
    const dedup = items.filter(
      (i) => i.query.toLowerCase() !== entry.query.toLowerCase()
    );
    save([entry, ...dedup].slice(0, 25));
  };

  const remove = (query: string) => {
    save(items.filter((i) => i.query !== query));
  };

  const clear = () => save([]);

  return { items, add, remove, clear };
}
