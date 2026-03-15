export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={`border-2 border-red-primary border-t-transparent rounded-full animate-spin ${className ?? "w-6 h-6"}`}
    />
  );
}
