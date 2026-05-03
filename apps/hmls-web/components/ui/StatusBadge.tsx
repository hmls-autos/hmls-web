import type { StatusConfig } from "@/lib/status-display";

export function StatusBadge({
  status,
  config,
}: {
  status: string;
  config: Record<string, StatusConfig>;
}) {
  const entry = config[status] ?? {
    label: status,
    color: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${entry.color}`}
    >
      {entry.label}
    </span>
  );
}
