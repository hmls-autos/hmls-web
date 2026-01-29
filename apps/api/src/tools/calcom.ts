import { z } from "zod";
import { env } from "../env.ts";
import { Errors } from "../lib/errors.ts";
import { toolResult } from "../lib/tool-result.ts";

const CALCOM_API_BASE = "https://api.cal.com/v1";

async function calcomRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CALCOM_API_BASE}${endpoint}`;
  console.log(`[calcom] ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw Errors.external("Cal.com", `${response.status} - ${error}`);
  }

  return response.json();
}

export const getAvailabilityTool = {
  name: "get_availability",
  description:
    "Check available time slots for booking an appointment. Returns available slots for the next 7 days.",
  schema: z.object({
    startDate: z
      .string()
      .describe("Start date in YYYY-MM-DD format (defaults to today)"),
    endDate: z
      .string()
      .describe(
        "End date in YYYY-MM-DD format (defaults to 7 days from start)"
      ),
  }),
  execute: async (params: { startDate?: string; endDate?: string }, _ctx: unknown) => {
    const start = params.startDate || new Date().toISOString().split("T")[0];
    const end =
      params.endDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const data = await calcomRequest<{ slots?: unknown[] }>(
      `/availability?eventTypeId=${env.CALCOM_EVENT_TYPE_ID}&startTime=${start}&endTime=${end}`
    );

    return toolResult({
      availableSlots: data.slots || [],
      dateRange: { start, end },
    });
  },
};

export const createBookingTool = {
  name: "create_booking",
  description:
    "Create a new booking/appointment for a customer. Requires customer details and preferred time slot.",
  schema: z.object({
    name: z.string().describe("Customer's full name"),
    email: z.string().email().describe("Customer's email address"),
    phone: z.string().describe("Customer's phone number"),
    startTime: z
      .string()
      .describe("Appointment start time in ISO 8601 format"),
    duration: z
      .number()
      .describe(
        "Appointment duration in minutes. Determine this based on the services the customer needs."
      ),
    serviceType: z.string().describe("Type of service requested"),
    location: z.string().describe("Service location/address"),
    notes: z.string().optional().describe("Additional notes about the service"),
  }),
  execute: async (params: {
    name: string;
    email: string;
    phone: string;
    startTime: string;
    duration: number;
    serviceType: string;
    location: string;
    notes?: string;
  }, _ctx: unknown) => {
    const booking = await calcomRequest<{
      id: number;
      uid: string;
    }>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        eventTypeId: Number(env.CALCOM_EVENT_TYPE_ID),
        start: params.startTime,
        lengthInMinutes: params.duration,
        responses: {
          name: params.name,
          email: params.email,
          phone: params.phone,
          location: params.location,
        },
        metadata: {
          serviceType: params.serviceType,
          notes: params.notes || "",
        },
      }),
    });

    console.log(`[calcom] Booking created: ${booking.uid} for ${params.name}`);

    return toolResult({
      success: true,
      bookingId: booking.id,
      confirmationNumber: booking.uid,
      scheduledTime: params.startTime,
      message: `Booking confirmed for ${params.name} on ${new Date(
        params.startTime
      ).toLocaleString()}`,
    });
  },
};

export const calcomTools = [getAvailabilityTool, createBookingTool];
