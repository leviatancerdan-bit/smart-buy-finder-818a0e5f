import { Globe } from "lucide-react";

export const COUNTRIES = [
  { code: "INT", name: "Internacional", flag: "🌍" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "DO", name: "Rep. Dominicana", flag: "🇩🇴" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "DE", name: "Alemania", flag: "🇩🇪" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
] as const;

export function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground transition focus-within:border-primary">
      <Globe className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        País
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent pr-1 font-medium text-foreground outline-none"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.name} className="bg-card text-foreground">
            {c.flag} {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
