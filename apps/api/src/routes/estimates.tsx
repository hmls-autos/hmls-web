// apps/api/src/routes/estimates.tsx

import { Hono } from "hono";
import { renderToStream } from "@react-pdf/renderer";
import { db, schema } from "../db/client";
import { eq, and } from "drizzle-orm";
import { EstimatePdf } from "../pdf/EstimatePdf";

const estimates = new Hono();

// GET /api/estimates/:id/pdf
estimates.get("/:id/pdf", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const token = c.req.query("token");

  if (isNaN(id)) {
    return c.json({ error: "Invalid estimate ID" }, 400);
  }

  let estimate;

  if (token) {
    // Public access via share token
    const [result] = await db
      .select()
      .from(schema.estimates)
      .where(
        and(
          eq(schema.estimates.id, id),
          eq(schema.estimates.shareToken, token)
        )
      )
      .limit(1);
    estimate = result;
  } else {
    // For authenticated access, check user session
    // For now, allow access if no token (will add auth middleware later)
    const [result] = await db
      .select()
      .from(schema.estimates)
      .where(eq(schema.estimates.id, id))
      .limit(1);
    estimate = result;
  }

  if (!estimate) {
    return c.json({ error: "Estimate not found" }, 404);
  }

  // Get customer info
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, estimate.customerId))
    .limit(1);

  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  // Generate PDF
  const pdfStream = await renderToStream(
    <EstimatePdf
      estimate={{
        ...estimate,
        items: estimate.items as any[],
      }}
      customer={{
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        vehicleInfo: customer.vehicleInfo as any,
      }}
    />
  );

  // Return PDF response
  return new Response(pdfStream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="HMLS-Estimate-${id}.pdf"`,
    },
  });
});

export default estimates;
