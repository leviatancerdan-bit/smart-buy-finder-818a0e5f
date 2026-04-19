import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrendBadge({
  trend,
  size = "md",
}: {
  trend: "up" | "down" | "stable";
  size?: "sm" | "md";
}) {
  const cfg = {
    up: {
      icon: TrendingUp,
      label: "Subiendo",
      cls: "bg-destructive/15 text-destructive border-destructive/30",
    },
    down: {
      icon: TrendingDown,
      label: "Bajando",
      cls: "bg-success/15 text-success border-success/30",
    },
    stable: {
      icon: Minus,
      label: "Estable",
      cls: "bg-warning/15 text-warning border-warning/30",
    },
  }[trend];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        cfg.cls
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {cfg.label}
    </span>
  );
}

export function VerdictBadge({
  verdict,
  label,
}: {
  verdict: "buy_now" | "wait" | "hold";
  label: string;
}) {
  const cls =
    verdict === "buy_now"
      ? "bg-success text-success-foreground"
      : verdict === "wait"
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wider",
        cls
      )}
    >
      {label}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const map: Record<string, string> = {
    tecnologia: "Tecnología",
    ia: "Plan IA",
    videojuegos: "Videojuego",
    suscripcion: "Suscripción",
    otro: "Otro",
  };
  return (
    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {map[category] ?? category}
    </span>
  );
}
