import { z } from "zod";
import { db, schema } from "../db/client.ts";
import { eq, or } from "drizzle-orm";

export const getCustomerTool = {
  name: "get_customer",
  description: "Look up an existing customer by phone number or email address.",
  parameters: z.object({
    phone: z.string().optional().describe("Customer's phone number"),
    email: z.string().email().optional().describe("Customer's email address"),
  }),
  execute: async (params: { phone?: string; email?: string }) => {
    if (!params.phone && !params.email) {
      return {
        found: false,
        message: "Please provide a phone number or email",
      };
    }

    const conditions = [];
    if (params.phone) conditions.push(eq(schema.customers.phone, params.phone));
    if (params.email) conditions.push(eq(schema.customers.email, params.email));

    const customer = await db
      .select()
      .from(schema.customers)
      .where(or(...conditions))
      .limit(1);

    if (customer.length === 0) {
      return {
        found: false,
        message: "No customer found with that information",
      };
    }

    return {
      found: true,
      customer: customer[0],
    };
  },
};

export const createCustomerTool = {
  name: "create_customer",
  description:
    "Create a new customer record with their contact and vehicle information.",
  parameters: z.object({
    name: z.string().describe("Customer's full name"),
    phone: z.string().describe("Customer's phone number"),
    email: z.string().email().optional().describe("Customer's email address"),
    address: z.string().optional().describe("Customer's address for service"),
    vehicleMake: z.string().optional().describe("Vehicle make (e.g., Toyota)"),
    vehicleModel: z.string().optional().describe("Vehicle model (e.g., Camry)"),
    vehicleYear: z.string().optional().describe("Vehicle year (e.g., 2020)"),
  }),
  execute: async (params: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
  }) => {
    const vehicleInfo =
      params.vehicleMake || params.vehicleModel || params.vehicleYear
        ? {
          make: params.vehicleMake,
          model: params.vehicleModel,
          year: params.vehicleYear,
        }
        : null;

    const [customer] = await db
      .insert(schema.customers)
      .values({
        name: params.name,
        phone: params.phone,
        email: params.email,
        address: params.address,
        vehicleInfo,
      })
      .returning();

    return {
      success: true,
      customerId: customer.id,
      message: `Customer ${params.name} created successfully`,
    };
  },
};

export const getServicesTool = {
  name: "get_services",
  description:
    "Get the list of available services with descriptions and pricing from the database.",
  parameters: z.object({}),
  execute: async () => {
    const servicesList = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true))
      .orderBy(schema.services.name);

    return {
      services: servicesList.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        minPrice: s.minPrice / 100,
        maxPrice: s.maxPrice / 100,
        priceRange: `$${s.minPrice / 100}-${s.maxPrice / 100}`,
        duration: s.duration,
        category: s.category,
      })),
    };
  },
};

export const createEstimateTool = {
  name: "create_estimate",
  description:
    "Generate an informal price estimate for the customer. This is NOT a formal quote - just a quick price range to share in chat. Use this before creating a formal Stripe quote.",
  parameters: z.object({
    services: z
      .array(
        z.object({
          name: z.string().describe("Service name"),
          description: z.string().describe("Brief description of work needed"),
          estimatedPrice: z.number().describe("Estimated price in dollars"),
        }),
      )
      .describe("List of services needed"),
    notes: z.string().optional().describe(
      "Any additional notes about the estimate",
    ),
  }),
  execute: (params: {
    services: { name: string; description: string; estimatedPrice: number }[];
    notes?: string;
  }) => {
    const totalMin = params.services.reduce(
      (sum, s) => sum + s.estimatedPrice * 0.9,
      0,
    );
    const totalMax = params.services.reduce(
      (sum, s) => sum + s.estimatedPrice * 1.1,
      0,
    );
    const totalEstimate = params.services.reduce(
      (sum, s) => sum + s.estimatedPrice,
      0,
    );

    return {
      services: params.services,
      estimatedTotal: totalEstimate,
      priceRange: {
        low: Math.round(totalMin),
        high: Math.round(totalMax),
      },
      notes: params.notes,
      disclaimer:
        "This is an informal estimate. Final price may vary based on actual conditions. Would you like me to send you a formal quote?",
    };
  },
};

export const customerTools = [
  getCustomerTool,
  createCustomerTool,
  getServicesTool,
  createEstimateTool,
];
