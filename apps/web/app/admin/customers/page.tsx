"use client";

import { Mail, Phone, Search, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAdminCustomer, useAdminCustomers } from "@/hooks/useAdmin";

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

function CustomerDetail({ id }: { id: number }) {
  const { data, isLoading } = useAdminCustomer(id);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { customer, bookings, estimates, quotes } = data;
  const vehicle = customer.vehicleInfo;

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-text">
            {customer.name ?? "Unnamed"}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-secondary">
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {customer.email}
              </span>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {customer.phone}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-text-secondary">
          Since {formatDate(customer.createdAt)}
        </span>
      </div>

      {vehicle && (vehicle.year || vehicle.make || vehicle.model) && (
        <p className="text-sm text-text-secondary mb-4">
          Vehicle:{" "}
          {[vehicle.year, vehicle.make, vehicle.model]
            .filter(Boolean)
            .join(" ")}
        </p>
      )}

      {customer.address && (
        <p className="text-sm text-text-secondary mb-4">{customer.address}</p>
      )}

      <div className="grid grid-cols-3 gap-4 text-center border-t border-border pt-4">
        <div>
          <p className="text-xl font-display font-bold text-text">
            {bookings.length}
          </p>
          <p className="text-xs text-text-secondary">Bookings</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-text">
            {estimates.length}
          </p>
          <p className="text-xs text-text-secondary">Estimates</p>
        </div>
        <div>
          <p className="text-xl font-display font-bold text-text">
            {quotes.length}
          </p>
          <p className="text-xs text-text-secondary">Quotes</p>
        </div>
      </div>

      {/* Recent bookings */}
      {bookings.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Bookings
          </h4>
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text truncate">{b.serviceType}</span>
                <span className="text-xs text-text-secondary shrink-0 ml-2">
                  {formatDate(b.scheduledAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent quotes */}
      {quotes.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Quotes
          </h4>
          <div className="space-y-2">
            {quotes.slice(0, 5).map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text">{formatCents(q.totalAmount)}</span>
                <span className="text-xs text-text-secondary capitalize">
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const { customers, isLoading } = useAdminCustomers(search || undefined);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-text mb-1">
        Customers
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        All registered customers.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-red-primary/50 focus:border-red-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer list */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <Users className="w-8 h-8 text-text-secondary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                {search
                  ? "No customers match your search."
                  : "No customers yet."}
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl divide-y divide-border">
              {customers.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/customers?id=${c.id}`}
                  className={`block px-4 py-3 hover:bg-surface-alt transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    selectedId === c.id ? "bg-surface-alt" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text font-medium truncate">
                      {c.name ?? "Unnamed"}
                    </p>
                    <span className="text-xs text-text-secondary shrink-0 ml-2">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {c.email ?? c.phone ?? "No contact info"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Customer detail */}
        <div>
          {selectedId ? (
            <CustomerDetail id={selectedId} />
          ) : (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <Users className="w-8 h-8 text-text-secondary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                Select a customer to view details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
