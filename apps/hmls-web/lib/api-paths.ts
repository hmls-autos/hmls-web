// Centralized path registry for every HMLS HTTP endpoint the web app hits.
// All functions return a full path string ready to be appended to AGENT_URL.
//
// Mounting layout (see apps/gateway/src/hmls-app.ts):
//   /api/admin/*         → adminApp  (admin.ts + orders.ts + admin-mechanics.ts)
//   /api/portal/*        → portal.ts
//   /api/mechanic/*      → mechanic.ts
//   /api/estimates/*     → estimates.ts  (numeric order ID, not share-token)
//   /api/orders/*        → ordersPdf sub-router (public PDF, numeric order ID + ?token=)

export const adminPaths = {
  // --- admin.ts (mounted under /api/admin) ---
  me: () => "/api/admin/me",
  dashboard: () => "/api/admin/dashboard",
  customers: (search?: string) =>
    search
      ? `/api/admin/customers?search=${encodeURIComponent(search)}`
      : "/api/admin/customers",
  customer: (id: number | string) => `/api/admin/customers/${id}`,

  // --- orders.ts (mounted under /api/admin/orders) ---
  orders: (status?: string) =>
    status
      ? `/api/admin/orders?status=${encodeURIComponent(status)}`
      : "/api/admin/orders",
  order: (id: number | string) => `/api/admin/orders/${id}`,
  orderStatus: (id: number | string) => `/api/admin/orders/${id}/status`,
  orderSchedule: (id: number | string) => `/api/admin/orders/${id}/schedule`,
  orderSend: (id: number | string) => `/api/admin/orders/${id}/send`,
  orderRevise: (id: number | string) => `/api/admin/orders/${id}/revise`,
  orderPayment: (id: number | string) => `/api/admin/orders/${id}/payment`,
  orderEvents: (id: number | string) => `/api/admin/orders/${id}/events`,
  orderNotes: (id: number | string) => `/api/admin/orders/${id}/notes`,

  // --- admin-mechanics.ts (mounted under /api/admin/mechanics) ---
  mechanics: () => "/api/admin/mechanics",
  mechanic: (id: number | string) => `/api/admin/mechanics/${id}`,
  mechanicAvailability: (id: number | string) =>
    `/api/admin/mechanics/${id}/availability`,
  mechanicOverrides: (
    id: number | string,
    dateFrom?: string,
    dateTo?: string,
  ) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set("from", dateFrom);
    if (dateTo) qs.set("to", dateTo);
    const s = qs.toString();
    return `/api/admin/mechanics/${id}/overrides${s ? `?${s}` : ""}`;
  },
  mechanicOverride: (id: number | string, oid: number | string) =>
    `/api/admin/mechanics/${id}/overrides/${oid}`,
  mechanicOrders: (id: number | string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const s = qs.toString();
    return `/api/admin/mechanics/${id}/orders${s ? `?${s}` : ""}`;
  },
  // POST /api/admin/mechanics/orders/:orderId/assign
  assignProvider: (orderId: number | string) =>
    `/api/admin/mechanics/orders/${orderId}/assign`,
};

export const portalPaths = {
  // --- portal.ts (mounted under /api/portal) ---
  me: () => "/api/portal/me",
  updateMe: () => "/api/portal/me",
  orders: () => "/api/portal/me/orders",
  order: (id: number | string) => `/api/portal/me/orders/${id}`,
  bookings: () => "/api/portal/me/bookings",
  approve: (id: number | string) => `/api/portal/me/orders/${id}/approve`,
  decline: (id: number | string) => `/api/portal/me/orders/${id}/decline`,
  cancelBooking: (id: number | string) =>
    `/api/portal/me/orders/${id}/cancel-booking`,
};

export const mechanicPaths = {
  // --- mechanic.ts (mounted under /api/mechanic) ---
  me: () => "/api/mechanic/me",
  availability: () => "/api/mechanic/availability",
  overrides: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const s = qs.toString();
    return `/api/mechanic/overrides${s ? `?${s}` : ""}`;
  },
  override: (id: number | string) => `/api/mechanic/overrides/${id}`,
  orders: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const s = qs.toString();
    return `/api/mechanic/orders${s ? `?${s}` : ""}`;
  },
};

// Paths used by estimates.ts (/api/estimates) and the public ordersPdf router
// (/api/orders). These use numeric order IDs (not share tokens in the path).
// Share-token auth happens via ?token= query param for the PDF routes.
//
// NOTE: useCustomer.ts currently uses /api/customers/:id which has no matching
// gateway route. The correct admin-scoped path is adminPaths.customer(id).
// That hook is stale and will be fixed in a subsequent task.
export const publicPaths = {
  // estimates.ts — GET /api/estimates/:id (authenticated owner view)
  estimate: (id: number | string) => `/api/estimates/${id}`,
  // estimates.ts — GET /api/estimates/:id/pdf (public with ?token= or authenticated)
  estimatePdf: (id: number | string, token?: string) =>
    token
      ? `/api/estimates/${id}/pdf?token=${encodeURIComponent(token)}`
      : `/api/estimates/${id}/pdf`,
  // estimates.ts — GET /api/estimates/:id/review (public share-token review page)
  estimateReview: (id: number | string, token: string) =>
    `/api/estimates/${id}/review?token=${encodeURIComponent(token)}`,
  // estimates.ts — POST /api/estimates/:id/approve?token=
  estimateApprove: (id: number | string, token: string) =>
    `/api/estimates/${id}/approve?token=${encodeURIComponent(token)}`,
  // estimates.ts — POST /api/estimates/:id/decline?token=
  estimateDecline: (id: number | string, token: string) =>
    `/api/estimates/${id}/decline?token=${encodeURIComponent(token)}`,
  // ordersPdf sub-router — GET /api/orders/:id/pdf?token=
  orderPdf: (id: number | string, token?: string) =>
    token
      ? `/api/orders/${id}/pdf?token=${encodeURIComponent(token)}`
      : `/api/orders/${id}/pdf`,
};
