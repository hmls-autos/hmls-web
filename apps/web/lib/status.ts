export interface StatusConfig {
  label: string;
  color: string;
}

export const BOOKING_STATUS: Record<string, StatusConfig> = {
  requested: {
    label: "Requested",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  in_progress: {
    label: "In Progress",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  completed: {
    label: "Completed",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

export const ORDER_STATUS: Record<string, StatusConfig> = {
  estimated: {
    label: "Estimated",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  customer_approved: {
    label: "Customer Approved",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  customer_declined: {
    label: "Customer Declined",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  quoted: {
    label: "Quoted",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  accepted: {
    label: "Accepted",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  scheduled: {
    label: "Scheduled",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  in_progress: {
    label: "In Progress",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  completed: {
    label: "Completed",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

/** Portal-facing order status labels (slightly different from admin). */
export const PORTAL_ORDER_STATUS: Record<string, StatusConfig> = {
  ...ORDER_STATUS,
  estimated: {
    label: "Pending Review",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  customer_approved: {
    label: "Approved",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  customer_declined: {
    label: "Declined",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  quoted: {
    label: "Quote Ready",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  accepted: {
    label: "Paid",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  declined: {
    label: "Quote Declined",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export const QUOTE_STATUS: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    color:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  },
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  viewed: {
    label: "Viewed",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  accepted: {
    label: "Accepted",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  invoiced: {
    label: "Invoiced",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  paid: {
    label: "Paid",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  expired: {
    label: "Expired",
    color:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  estimated: ["customer_approved", "customer_declined", "cancelled"],
  customer_approved: ["quoted", "cancelled"],
  quoted: ["accepted", "declined", "cancelled"],
  accepted: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
};
