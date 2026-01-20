import { z } from "zod";
import { db, schema } from "../db/client.ts";
import { eq, or } from "drizzle-orm";

export const getCustomerTool = {
  name: "get_customer",
  description: "Look up an existing customer by phone number or email address.",
  schema: z.object({
    phone: z.string().optional().describe("Customer's phone number"),
    email: z.string().email().optional().describe("Customer's email address"),
  }),
  execute: async (params: { phone?: string; email?: string }, _ctx: unknown) => {
    if (!params.phone && !params.email) {
      return JSON.stringify({
        found: false,
        message: "Please provide a phone number or email",
      });
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
      return JSON.stringify({
        found: false,
        message: "No customer found with that information",
      });
    }

    return JSON.stringify({
      found: true,
      customer: customer[0],
    });
  },
};

export const createCustomerTool = {
  name: "create_customer",
  description:
    "Create a new customer record with their contact and vehicle information.",
  schema: z.object({
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
  }, _ctx: unknown) => {
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

    return JSON.stringify({
      success: true,
      customerId: customer.id,
      message: `Customer ${params.name} created successfully`,
    });
  },
};

export const getServicesTool = {
  name: "get_services",
  description:
    "Get the list of available services with descriptions and pricing from the database.",
  schema: z.object({}),
  execute: async (_params: Record<string, never>, _ctx: unknown) => {
    const servicesList = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true))
      .orderBy(schema.services.name);

    return JSON.stringify({
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
    });
  },
};

export const customerTools = [
  getCustomerTool,
  createCustomerTool,
  getServicesTool,
];
