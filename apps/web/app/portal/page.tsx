"use client";

import { Calendar, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import {
  usePortalBookings,
  usePortalCustomer,
  usePortalEstimates,
  usePortalQuotes,
} from "@/hooks/usePortal";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function SummaryCard({
  label,
  count,
  icon: Icon,
  href,
  color,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold text-text">{count}</p>
    </Link>
  );
}

type ActivityItem = {
  type: "booking" | "estimate" | "quote";
  label: string;
  detail: string;
  date: string;
  href: string;
};

export default function PortalDashboard() {
  const { customer, isLoading: customerLoading } = usePortalCustomer();
  const { bookings, isLoading: bookingsLoading } = usePortalBookings();
  const { estimates, isLoading: estimatesLoading } = usePortalEstimates();
  const { quotes, isLoading: quotesLoading } = usePortalQuotes();

  const isLoading =
    customerLoading || bookingsLoading || estimatesLoading || quotesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) =>
      b.status !== "completed" &&
      b.status !== "cancelled" &&
      new Date(b.scheduledAt) >= new Date(),
  );
  const activeEstimates = estimates.filter(
    (e) => new Date(e.expiresAt) >= new Date(),
  );
  const pendingQuotes = quotes.filter(
    (q) => q.status === "draft" || q.status === "sent",
  );

  // Build recent activity from all sources
  const activity: ActivityItem[] = [
    ...bookings.slice(0, 5).map((b) => ({
      type: "booking" as const,
      label: b.serviceType,
      detail: b.status,
      date: b.createdAt,
      href: "/portal/bookings",
    })),
    ...estimates.slice(0, 5).map((e) => ({
      type: "estimate" as const,
      label: `${e.items.length} item${e.items.length !== 1 ? "s" : ""}`,
      detail: `${formatCents(e.priceRangeLow)} – ${formatCents(e.priceRangeHigh)}`,
      date: e.createdAt,
      href: "/portal/estimates",
    })),
    ...quotes.slice(0, 5).map((q) => ({
      type: "quote" as const,
      label: formatCents(q.totalAmount),
      detail: q.status,
      date: q.createdAt,
      href: "/portal/quotes",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const typeIcons = {
    booking: Calendar,
    estimate: FileText,
    quote: Receipt,
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-text mb-1">
        {customer?.name ? `Welcome back, ${customer.name}` : "Welcome back"}
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Here&apos;s an overview of your account.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <SummaryCard
          label="Upcoming Bookings"
          count={upcomingBookings.length}
          icon={Calendar}
          href="/portal/bookings"
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <SummaryCard
          label="Active Estimates"
          count={activeEstimates.length}
          icon={FileText}
          href="/portal/estimates"
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <SummaryCard
          label="Pending Quotes"
          count={pendingQuotes.length}
          icon={Receipt}
          href="/portal/quotes"
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
      </div>

      {/* Recent activity */}
      <h2 className="text-lg font-display font-semibold text-text mb-4">
        Recent Activity
      </h2>
      {activity.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-secondary text-sm">No activity yet.</p>
          <Link
            href="/chat"
            className="inline-block mt-3 text-sm text-red-primary hover:text-red-dark font-medium"
          >
            Get your first estimate &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {activity.map((item, i) => {
            const Icon = typeIcons[item.type];
            return (
              <Link
                key={`${item.type}-${i}`}
                href={item.href}
                className="flex items-center gap-4 px-4 py-3 hover:bg-surface-alt transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <Icon className="w-4 h-4 text-text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{item.label}</p>
                  <p className="text-xs text-text-secondary capitalize">
                    {item.detail}
                  </p>
                </div>
                <span className="text-xs text-text-secondary shrink-0">
                  {formatDate(item.date)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
