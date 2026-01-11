/**
 * Shared entity types derived from database schema
 */

export interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleInfo: VehicleInfo | null;
  stripeCustomerId: string | null;
  createdAt: Date;
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
}

export interface Conversation {
  id: number;
  customerId: number | null;
  channel: string;
  startedAt: Date;
  endedAt: Date | null;
}

export interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Booking {
  id: number;
  customerId: number | null;
  serviceType: string;
  scheduledAt: Date;
  location: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  calcomBookingId: string | null;
  createdAt: Date;
}

export interface Quote {
  id: number;
  customerId: number | null;
  bookingId: number | null;
  stripeQuoteId: string | null;
  stripeInvoiceId: string | null;
  items: QuoteItem[];
  totalAmount: number; // in cents
  status: "draft" | "sent" | "accepted" | "invoiced" | "paid";
  expiresAt: Date | null;
  createdAt: Date;
}

export interface QuoteItem {
  service: string;
  description: string;
  amount: number; // in cents
}

export interface Service {
  id: number;
  name: string;
  description: string;
  minPrice: number; // in cents
  maxPrice: number; // in cents
  duration: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
