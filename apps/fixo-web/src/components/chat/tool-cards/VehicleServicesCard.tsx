import { Wrench } from "lucide-react";

export interface VehicleServicesOutput {
  found: boolean;
  vehicle: string;
  engines?: string[];
  categories?: Array<{ category: string; jobCount: number }>;
  totalJobs?: number;
  message?: string;
}

export function VehicleServicesCard({
  output,
  isLoading,
}: {
  output?: VehicleServicesOutput;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-surface-alt/60 px-3 py-2 text-sm text-text-secondary">
        <Wrench className="h-4 w-4 animate-pulse" />
        Loading service catalog...
      </div>
    );
  }
  if (!output) return null;
  if (!output.found) {
    return (
      <div className="rounded-xl border border-border bg-surface-alt/40 px-3 py-2 text-sm text-text-secondary">
        {output.message ?? `No service catalog for ${output.vehicle}.`}
      </div>
    );
  }
  const total = output.totalJobs ?? 0;
  const categories = output.categories ?? [];
  return (
    <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-text">{output.vehicle}</div>
          {output.engines && output.engines.length > 0 && (
            <div className="text-xs text-text-secondary">
              {output.engines.slice(0, 3).join(", ")}
              {output.engines.length > 3
                ? ` +${output.engines.length - 3} more`
                : ""}
            </div>
          )}
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {total} jobs
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {categories.map((c) => (
          <div
            key={c.category}
            className="flex items-center justify-between rounded-md bg-background px-2 py-1.5 text-xs"
          >
            <span className="truncate font-medium text-text">{c.category}</span>
            <span className="ml-2 shrink-0 font-mono tabular-nums text-text-secondary">
              {c.jobCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
