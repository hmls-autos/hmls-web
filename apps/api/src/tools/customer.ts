import { z } from "zod";
import { db, schema } from "../db/client.ts";
import { eq } from "drizzle-orm";
import { toolResult } from "@hmls/shared/tool-result";

export const getServicesTool = {
  name: "get_services",
  description:
    "Get the list of available services with descriptions and labor hours from the database.",
  schema: z.object({}),
  execute: async (_params: Record<string, never>, _ctx: unknown) => {
    const servicesList = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true))
      .orderBy(schema.services.name);

    return toolResult({
      services: servicesList.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        laborHours: Number(s.laborHours),
        category: s.category,
      })),
    });
  },
};

// Export as array for consistency with other tool files
export const serviceTools = [getServicesTool];
