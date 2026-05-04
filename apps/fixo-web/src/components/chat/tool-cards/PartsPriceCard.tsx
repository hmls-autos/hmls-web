import { Package } from "lucide-react";

interface PartTier {
  brand: string;
  partNumber: string;
  price: number;
  coreCharge?: number;
  description?: string;
}

export interface PartsLookupOutput {
  found: boolean;
  vehicle: string;
  partName: string;
  recommendedPrice: number;
  recommendedTier: "Premium" | "Daily Driver" | "Economy";
  premium: PartTier[];
  dailyDriver: PartTier[];
  economy: PartTier[];
  totalOptions: number;
  note?: string;
}

const TIER_ORDER: Array<{
  key: "premium" | "dailyDriver" | "economy";
  label: string;
  badgeClass: string;
}> = [
  {
    key: "premium",
    label: "Premium",
    badgeClass:
      "bg-purple-100 text-purple-700 ring-purple-300/40 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    key: "dailyDriver",
    label: "Daily Driver",
    badgeClass:
      "bg-blue-100 text-blue-700 ring-blue-300/40 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    key: "economy",
    label: "Economy",
    badgeClass:
      "bg-gray-100 text-gray-700 ring-gray-300/40 dark:bg-gray-800 dark:text-gray-400",
  },
];

function formatPrice(cents: number): string {
  return `$${cents.toFixed(2)}`;
}

export function PartsPriceCard({
  output,
  isLoading,
}: {
  output?: PartsLookupOutput;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4 animate-pulse" />
        Looking up parts pricing...
      </div>
    );
  }
  if (!output) return null;
  if (!output.found) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        No pricing found for "{output.partName}" on {output.vehicle}.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-text">{output.partName}</div>
          <div className="text-xs text-muted-foreground">{output.vehicle}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Recommended</div>
          <div className="font-mono text-base font-semibold tabular-nums text-text">
            {formatPrice(output.recommendedPrice)}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {TIER_ORDER.map((tier) => {
          const items = output[tier.key];
          if (!items || items.length === 0) return null;
          const cheapest = Math.min(...items.map((i) => i.price));
          const dearest = Math.max(...items.map((i) => i.price));
          return (
            <div key={tier.key}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tier.badgeClass}`}
                >
                  {tier.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {cheapest === dearest
                    ? formatPrice(cheapest)
                    : `${formatPrice(cheapest)} – ${formatPrice(dearest)}`}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5 pl-2">
                {items.slice(0, 3).map((p) => (
                  <li
                    key={`${p.brand}-${p.partNumber}`}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-text">{p.brand}</span>
                      <span className="text-muted-foreground">
                        {" · "}
                        {p.partNumber}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                      {formatPrice(p.price)}
                      {p.coreCharge
                        ? ` + ${formatPrice(p.coreCharge)} core`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
