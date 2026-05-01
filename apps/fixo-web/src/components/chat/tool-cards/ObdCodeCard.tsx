import { AlertTriangle } from "lucide-react";

export interface ObdLookupOutput {
  code: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

const SEVERITY_STYLE: Record<ObdLookupOutput["severity"], string> = {
  low: "bg-green-100 text-green-700 ring-green-300/40 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-700 ring-yellow-300/40 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-amber-100 text-amber-700 ring-amber-300/40 dark:bg-amber-900/30 dark:text-amber-400",
  critical:
    "bg-red-100 text-red-700 ring-red-300/40 dark:bg-red-900/30 dark:text-red-400",
};

export function ObdCodeCard({
  output,
  isLoading,
}: {
  output?: ObdLookupOutput;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-surface-alt/60 px-3 py-2 text-sm text-text-secondary">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary/50" />
        Looking up OBD code...
      </div>
    );
  }
  if (!output) return null;
  const showAlert =
    output.severity === "high" || output.severity === "critical";
  return (
    <div className="rounded-xl border border-border bg-surface-alt/40 p-3">
      <div className="flex items-center gap-2">
        <code className="rounded-md bg-background px-2 py-0.5 font-mono text-sm font-semibold tabular-nums">
          {output.code}
        </code>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            SEVERITY_STYLE[output.severity]
          }`}
        >
          {showAlert && <AlertTriangle className="h-3 w-3" />}
          {output.severity}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-text">{output.description}</p>
    </div>
  );
}
