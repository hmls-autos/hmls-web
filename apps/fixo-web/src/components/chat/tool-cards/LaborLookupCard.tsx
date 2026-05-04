import { Clock } from "lucide-react";

export interface LaborLookupOutput {
  found: boolean;
  vehicle: string;
  searchTerm: string;
  count: number;
  results: Array<{
    service: string;
    category: string;
    laborHours: number;
    engine: string;
    fuelType?: string | null;
  }>;
  note?: string;
}

export function LaborLookupCard({
  output,
  isLoading,
}: {
  output?: LaborLookupOutput;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 animate-pulse" />
        Looking up labor times...
      </div>
    );
  }
  if (!output) return null;
  if (!output.found || output.count === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        No labor records for "{output.searchTerm}" on {output.vehicle}.
      </div>
    );
  }
  const total = output.results.reduce((sum, r) => sum + r.laborHours, 0);
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {output.vehicle}
        </div>
        <span className="inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-accent">
          <Clock className="h-3 w-3" />
          {total.toFixed(1)} hr total
        </span>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {output.results.map((r) => (
          <li
            key={`${r.service}-${r.engine}`}
            className="flex items-center justify-between gap-3 py-1.5"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text">
                {r.service}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {r.engine}
                {r.fuelType ? ` · ${r.fuelType}` : ""} · {r.category}
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-background px-2 py-0.5 font-mono text-xs tabular-nums">
              {r.laborHours.toFixed(1)} hr
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
