import { Hono } from "hono";
import { renderToStream } from "@react-pdf/renderer";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { and, eq } from "drizzle-orm";
import { EstimatePdf } from "../pdf/EstimatePdf.tsx";
import { Errors } from "@hmls/shared/errors";

const estimates = new Hono();

// GET estimate by ID
estimates.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(eq(schema.estimates.id, id))
    .limit(1);

  if (!estimate) throw Errors.notFound("Estimate", id);
  return c.json(estimate);
});

// GET estimate PDF
estimates.get("/:id/pdf", async (c) => {
  const id = Number(c.req.param("id"));
  const token = c.req.query("token");

  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(
      token
        ? and(
          eq(schema.estimates.id, id),
          eq(schema.estimates.shareToken, token),
        )
        : eq(schema.estimates.id, id),
    )
    .limit(1);

  if (!estimate) throw Errors.notFound("Estimate", id);

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, estimate.customerId))
    .limit(1);

  if (!customer) throw Errors.notFound("Customer", estimate.customerId);

  const pdfStream = await renderToStream(
    EstimatePdf({
      estimate: {
        ...estimate,
        items: estimate.items as {
          name: string;
          description: string;
          price: number;
        }[],
      },
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        vehicleInfo: customer.vehicleInfo as {
          make?: string;
          model?: string;
          year?: string;
        } | null,
      },
    }),
  );

  return new Response(pdfStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="HMLS-Estimate-${id}.pdf"`,
    },
  });
});

export { estimates };
