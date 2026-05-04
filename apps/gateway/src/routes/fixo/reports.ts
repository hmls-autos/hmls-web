import { Hono } from "hono";
import { renderToStream } from "@react-pdf/renderer";
import { db, schema } from "@hmls/agent/db";
import { eq } from "drizzle-orm";
import { DiagnosticReportPdf } from "@hmls/agent";
import type { AuthContext } from "../../middleware/fixo/auth.ts";

type Variables = { auth: AuthContext };

const reports = new Hono<{ Variables: Variables }>();

// GET /sessions/:id/report - Generate Fixo PDF report
reports.get("/:id/report", async (c) => {
  const auth = c.get("auth");
  const sessionId = parseInt(c.req.param("id"));

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return c.json({ error: "Invalid session ID" }, 400);
  }

  // Fetch session
  const [session] = await db
    .select()
    .from(schema.fixoSessions)
    .where(eq(schema.fixoSessions.id, sessionId))
    .limit(1);

  if (
    !session ||
    (session.userId !== auth.userId && session.customerId !== auth.customerId) ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    return c.json({ error: "Session not found" }, 404);
  }

  // Check session has a result
  if (!session.result) {
    return c.json({ error: "Session has no result yet" }, 400);
  }

  // Fetch vehicle info if attached
  let vehicleInfo = null;
  if (session.vehicleId) {
    const [vehicle] = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, session.vehicleId))
      .limit(1);
    if (vehicle) {
      vehicleInfo = {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
      };
    }
  }

  // Count media files
  const mediaFiles = await db
    .select()
    .from(schema.fixoMedia)
    .where(eq(schema.fixoMedia.sessionId, sessionId));

  // Parse result (stored as JSONB)
  const result = session.result as {
    summary?: string;
    overallSeverity?: string;
    issues?: Array<{
      title: string;
      severity: string;
      description: string;
      recommendedAction: string;
      estimatedCost?: string;
    }>;
    obdCodes?: Array<{
      code: string;
      meaning: string;
      severity: string;
    }>;
  };

  const pdfStream = await renderToStream(
    DiagnosticReportPdf({
      sessionId: session.id,
      createdAt: session.createdAt,
      vehicle: vehicleInfo,
      result: {
        summary: result.summary ?? "No summary available.",
        overallSeverity: (result.overallSeverity as "critical" | "high" | "medium" | "low") ??
          "low",
        issues: (result.issues ?? []).map((issue) => ({
          ...issue,
          severity: issue.severity as "critical" | "high" | "medium" | "low",
        })),
        obdCodes: result.obdCodes,
        mediaCount: mediaFiles.length,
      },
    }),
  );

  return new Response(pdfStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Fixo-Report-${sessionId}.pdf"`,
    },
  });
});

export { reports };
