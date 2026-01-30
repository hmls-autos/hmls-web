# Diagnostic Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone multimodal diagnostic agent that analyzes photos, audio, video, and OBD-II codes to diagnose vehicle issues.

**Architecture:** Deno + Zypher agent deployed on Railway, with Supabase Auth, Stripe credits, Cloudflare R2 media storage, and shared PostgreSQL database. AG-UI protocol for conversational streaming.

**Tech Stack:** Deno, Zypher framework, Claude Sonnet 4, OpenAI Whisper, Supabase Auth, Stripe, Cloudflare R2, Drizzle ORM, PostgreSQL

---

## Phase 1: Project Setup

### Task 1.1: Create App Directory Structure

**Files:**
- Create: `apps/diagnostic-agent/deno.json`
- Create: `apps/diagnostic-agent/src/main.ts`

**Step 1: Create directory structure**

```bash
mkdir -p apps/diagnostic-agent/src/{tools,middleware,db,lib}
mkdir -p apps/diagnostic-agent/.skills/{photo-diagnosis,audio-diagnosis,video-diagnosis,obd-diagnosis,comprehensive-diagnosis}
```

**Step 2: Create deno.json**

```json
{
  "name": "@hmls/diagnostic-agent",
  "version": "0.1.0",
  "exports": "./src/main.ts",
  "tasks": {
    "dev": "deno run --allow-all --watch src/main.ts",
    "start": "deno run --allow-all src/main.ts",
    "check": "deno check src/main.ts"
  },
  "imports": {
    "@corespeed/zypher": "jsr:@zypher/agent@^0.5.0",
    "@std/dotenv": "jsr:@std/dotenv@^0.225.0",
    "drizzle-orm": "npm:drizzle-orm@^0.38.0",
    "postgres": "npm:postgres@^3.4.0",
    "@supabase/supabase-js": "npm:@supabase/supabase-js@^2.49.0",
    "stripe": "npm:stripe@^17.0.0",
    "@aws-sdk/client-s3": "npm:@aws-sdk/client-s3@^3.700.0",
    "zod": "npm:zod@^3.24.0",
    "openai": "npm:openai@^4.80.0"
  },
  "compilerOptions": {
    "strict": true
  }
}
```

**Step 3: Create placeholder main.ts**

```typescript
console.log("Diagnostic Agent starting...");
```

**Step 4: Verify setup**

Run: `cd apps/diagnostic-agent && deno check src/main.ts`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/diagnostic-agent
git commit -m "chore: scaffold diagnostic-agent app structure"
```

---

### Task 1.2: Create Environment Configuration

**Files:**
- Create: `apps/diagnostic-agent/src/env.ts`
- Create: `apps/diagnostic-agent/.env.example`

**Step 1: Create env.ts with Zod validation**

```typescript
import { z } from "zod";
import "@std/dotenv/load";

const envSchema = z.object({
  // Server
  PORT: z.string().default("8001"),

  // Database
  DATABASE_URL: z.string(),

  // AI
  ANTHROPIC_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),

  // Auth
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),

  // Storage
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string().default("diagnostic-media"),

  // Billing
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
});

export const env = envSchema.parse(Deno.env.toObject());
export type Env = z.infer<typeof envSchema>;
```

**Step 2: Create .env.example**

```bash
# Server
PORT=8001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Auth (Supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=...

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=diagnostic-media

# Billing (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/env.ts apps/diagnostic-agent/.env.example
git commit -m "feat(diagnostic-agent): add environment configuration with Zod validation"
```

---

## Phase 2: Database Schema

### Task 2.1: Create Drizzle Schema

**Files:**
- Create: `apps/diagnostic-agent/src/db/schema.ts`
- Create: `apps/diagnostic-agent/src/db/client.ts`

**Step 1: Create schema.ts**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Reference existing customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  phone: text("phone"),
  stripeCustomerId: text("stripe_customer_id"),
});

// Enums
export const sessionStatusEnum = pgEnum("diagnostic_session_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const mediaTypeEnum = pgEnum("diagnostic_media_type", [
  "photo",
  "audio",
  "video",
  "obd_photo",
]);

export const processingStatusEnum = pgEnum("diagnostic_processing_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const obdSourceEnum = pgEnum("diagnostic_obd_source", [
  "manual",
  "bluetooth",
  "ocr",
]);

// Diagnostic Sessions
export const diagnosticSessions = pgTable("diagnostic_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  status: sessionStatusEnum("status").notNull().default("pending"),
  creditsCharged: integer("credits_charged").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  result: jsonb("result"),
});

// Diagnostic Media
export const diagnosticMedia = pgTable("diagnostic_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => diagnosticSessions.id),
  type: mediaTypeEnum("type").notNull(),
  r2Key: text("r2_key").notNull(),
  creditCost: integer("credit_cost").notNull(),
  metadata: jsonb("metadata"),
  processingStatus: processingStatusEnum("processing_status")
    .notNull()
    .default("pending"),
  transcription: text("transcription"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// OBD Codes
export const obdCodes = pgTable("diagnostic_obd_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => diagnosticSessions.id),
  code: text("code").notNull(),
  source: obdSourceEnum("source").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types
export type DiagnosticSession = typeof diagnosticSessions.$inferSelect;
export type NewDiagnosticSession = typeof diagnosticSessions.$inferInsert;
export type DiagnosticMedia = typeof diagnosticMedia.$inferSelect;
export type NewDiagnosticMedia = typeof diagnosticMedia.$inferInsert;
export type ObdCode = typeof obdCodes.$inferSelect;
export type NewObdCode = typeof obdCodes.$inferInsert;
```

**Step 2: Create client.ts**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.ts";
import * as schema from "./schema.ts";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

**Step 3: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/db/schema.ts src/db/client.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/diagnostic-agent/src/db
git commit -m "feat(diagnostic-agent): add Drizzle schema for diagnostic tables"
```

---

### Task 2.2: Create Database Migration

**Files:**
- Create: `apps/diagnostic-agent/drizzle.config.ts`
- Create: `apps/diagnostic-agent/migrations/0001_diagnostic_tables.sql`

**Step 1: Create drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL")!,
  },
});
```

**Step 2: Create migration SQL**

```sql
-- Enums
CREATE TYPE diagnostic_session_status AS ENUM ('pending', 'processing', 'complete', 'failed');
CREATE TYPE diagnostic_media_type AS ENUM ('photo', 'audio', 'video', 'obd_photo');
CREATE TYPE diagnostic_processing_status AS ENUM ('pending', 'processing', 'complete', 'failed');
CREATE TYPE diagnostic_obd_source AS ENUM ('manual', 'bluetooth', 'ocr');

-- Diagnostic Sessions
CREATE TABLE diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  status diagnostic_session_status NOT NULL DEFAULT 'pending',
  credits_charged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB
);

-- Diagnostic Media
CREATE TABLE diagnostic_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id),
  type diagnostic_media_type NOT NULL,
  r2_key TEXT NOT NULL,
  credit_cost INTEGER NOT NULL,
  metadata JSONB,
  processing_status diagnostic_processing_status NOT NULL DEFAULT 'pending',
  transcription TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OBD Codes
CREATE TABLE diagnostic_obd_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id),
  code TEXT NOT NULL,
  source diagnostic_obd_source NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_diagnostic_sessions_customer ON diagnostic_sessions(customer_id);
CREATE INDEX idx_diagnostic_media_session ON diagnostic_media(session_id);
CREATE INDEX idx_diagnostic_obd_codes_session ON diagnostic_obd_codes(session_id);
```

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/drizzle.config.ts apps/diagnostic-agent/migrations
git commit -m "feat(diagnostic-agent): add database migration for diagnostic tables"
```

---

## Phase 3: External Service Clients

### Task 3.1: Create Supabase Auth Client

**Files:**
- Create: `apps/diagnostic-agent/src/lib/supabase.ts`

**Step 1: Create supabase.ts**

```typescript
import { createClient } from "@supabase/supabase-js";
import { env } from "../env.ts";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export interface AuthUser {
  id: string;
  email: string;
  tier: "free" | "pro" | "premium";
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Extract tier from user metadata (set during signup/subscription)
  const tier = (user.user_metadata?.tier as AuthUser["tier"]) || "free";

  return {
    id: user.id,
    email: user.email!,
    tier,
  };
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/lib/supabase.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/lib/supabase.ts
git commit -m "feat(diagnostic-agent): add Supabase auth client"
```

---

### Task 3.2: Create Stripe Client

**Files:**
- Create: `apps/diagnostic-agent/src/lib/stripe.ts`

**Step 1: Create stripe.ts**

```typescript
import Stripe from "stripe";
import { env } from "../env.ts";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Credit costs per input type
export const CREDIT_COSTS = {
  text: 1,
  obd: 1,
  photo: 2,
  audio: 5, // per 30s
  video: 10, // per 30s
} as const;

export type InputType = keyof typeof CREDIT_COSTS;

export async function getCustomerCredits(
  stripeCustomerId: string
): Promise<number> {
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) {
    throw new Error("Customer not found");
  }
  // Credits stored as balance in cents (1 credit = 1 cent for simplicity)
  return Math.floor((customer.balance ?? 0) / -1); // Negative balance = available credits
}

export async function deductCredits(
  stripeCustomerId: string,
  amount: number,
  description: string
): Promise<void> {
  await stripe.customers.createBalanceTransaction(stripeCustomerId, {
    amount: amount, // Positive = deduct (increase balance owed)
    currency: "usd",
    description,
  });
}

export async function addCredits(
  stripeCustomerId: string,
  amount: number,
  description: string
): Promise<void> {
  await stripe.customers.createBalanceTransaction(stripeCustomerId, {
    amount: -amount, // Negative = add credits (decrease balance owed)
    currency: "usd",
    description,
  });
}

export function calculateAudioCredits(durationSeconds: number): number {
  return Math.ceil(durationSeconds / 30) * CREDIT_COSTS.audio;
}

export function calculateVideoCredits(durationSeconds: number): number {
  return Math.ceil(durationSeconds / 30) * CREDIT_COSTS.video;
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/lib/stripe.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/lib/stripe.ts
git commit -m "feat(diagnostic-agent): add Stripe client with credit management"
```

---

### Task 3.3: Create Cloudflare R2 Client

**Files:**
- Create: `apps/diagnostic-agent/src/lib/r2.ts`

**Step 1: Create r2.ts**

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../env.ts";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadMedia(
  file: Uint8Array,
  filename: string,
  contentType: string,
  sessionId: string
): Promise<UploadResult> {
  const key = `sessions/${sessionId}/${Date.now()}-${filename}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`,
  };
}

export async function getMedia(key: string): Promise<Uint8Array> {
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    })
  );

  return new Uint8Array(await response.Body!.transformToByteArray());
}

export async function deleteMedia(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/lib/r2.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/lib/r2.ts
git commit -m "feat(diagnostic-agent): add Cloudflare R2 storage client"
```

---

### Task 3.4: Create OpenAI Whisper Client

**Files:**
- Create: `apps/diagnostic-agent/src/lib/whisper.ts`

**Step 1: Create whisper.ts**

```typescript
import OpenAI from "openai";
import { env } from "../env.ts";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  duration: number;
}

export async function transcribeAudio(
  audioData: Uint8Array,
  filename: string
): Promise<TranscriptionResult> {
  // Create a File object from the audio data
  const file = new File([audioData], filename, { type: "audio/webm" });

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  return {
    text: response.text,
    duration: response.duration ?? 0,
  };
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/lib/whisper.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/lib/whisper.ts
git commit -m "feat(diagnostic-agent): add OpenAI Whisper client for audio transcription"
```

---

## Phase 4: Agent Tools

### Task 4.1: Create Image Analysis Tool

**Files:**
- Create: `apps/diagnostic-agent/src/tools/analyzeImage.ts`

**Step 1: Create analyzeImage.ts**

```typescript
import { z } from "zod";
import { env } from "../env.ts";

const analyzeImageSchema = z.object({
  imageUrl: z.string().describe("URL of the image to analyze"),
  context: z
    .string()
    .optional()
    .describe("Additional context about what to look for"),
});

export const analyzeImageTool = {
  name: "analyzeImage",
  description:
    "Analyze a vehicle photo for damage, wear, fluid leaks, and mechanical issues",
  parameters: analyzeImageSchema,
  execute: async (params: z.infer<typeof analyzeImageSchema>) => {
    const { imageUrl, context } = params;

    const prompt = `You are an expert automotive technician. Analyze this vehicle image and identify:
- Any visible damage or wear
- Fluid leaks or stains
- Component condition (tires, brakes, belts, hoses, etc.)
- Warning signs that need attention

${context ? `Additional context: ${context}` : ""}

Provide a detailed analysis with severity ratings (low/medium/high) for any issues found.`;

    // Use Claude API directly for vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "url",
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const result = await response.json();
    return result.content[0].text;
  },
};
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/tools/analyzeImage.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/tools/analyzeImage.ts
git commit -m "feat(diagnostic-agent): add image analysis tool with Claude vision"
```

---

### Task 4.2: Create Audio Transcription Tool

**Files:**
- Create: `apps/diagnostic-agent/src/tools/transcribeAudio.ts`

**Step 1: Create transcribeAudio.ts**

```typescript
import { z } from "zod";
import { transcribeAudio as whisperTranscribe } from "../lib/whisper.ts";
import { getMedia } from "../lib/r2.ts";

const transcribeAudioSchema = z.object({
  r2Key: z.string().describe("R2 storage key for the audio file"),
  filename: z.string().describe("Original filename of the audio"),
});

export const transcribeAudioTool = {
  name: "transcribeAudio",
  description:
    "Transcribe vehicle audio (engine sounds, brake noises, etc.) using Whisper",
  parameters: transcribeAudioSchema,
  execute: async (params: z.infer<typeof transcribeAudioSchema>) => {
    const { r2Key, filename } = params;

    // Fetch audio from R2
    const audioData = await getMedia(r2Key);

    // Transcribe with Whisper
    const result = await whisperTranscribe(audioData, filename);

    return {
      transcription: result.text,
      durationSeconds: result.duration,
      analysis: `Audio transcription: "${result.text}". Duration: ${result.duration} seconds.`,
    };
  },
};
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/tools/transcribeAudio.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/tools/transcribeAudio.ts
git commit -m "feat(diagnostic-agent): add audio transcription tool with Whisper"
```

---

### Task 4.3: Create Video Frame Extraction Tool

**Files:**
- Create: `apps/diagnostic-agent/src/tools/extractVideoFrames.ts`

**Step 1: Create extractVideoFrames.ts**

```typescript
import { z } from "zod";
import { getMedia, uploadMedia } from "../lib/r2.ts";

const extractVideoFramesSchema = z.object({
  r2Key: z.string().describe("R2 storage key for the video file"),
  sessionId: z.string().describe("Session ID for storing extracted frames"),
  frameCount: z
    .number()
    .default(5)
    .describe("Number of frames to extract (default 5)"),
});

export const extractVideoFramesTool = {
  name: "extractVideoFrames",
  description: "Extract key frames from a video for visual analysis",
  parameters: extractVideoFramesSchema,
  execute: async (params: z.infer<typeof extractVideoFramesSchema>) => {
    const { r2Key, sessionId, frameCount } = params;

    // Fetch video from R2
    const videoData = await getMedia(r2Key);

    // Write to temp file for ffmpeg
    const tempInput = await Deno.makeTempFile({ suffix: ".mp4" });
    const tempOutput = await Deno.makeTempDir();

    try {
      await Deno.writeFile(tempInput, videoData);

      // Extract frames with ffmpeg
      const command = new Deno.Command("ffmpeg", {
        args: [
          "-i",
          tempInput,
          "-vf",
          `fps=1/${Math.ceil(30 / frameCount)}`, // Distribute frames across ~30s
          "-frames:v",
          String(frameCount),
          `${tempOutput}/frame_%03d.jpg`,
        ],
      });

      const { code } = await command.output();
      if (code !== 0) {
        throw new Error("ffmpeg failed to extract frames");
      }

      // Upload extracted frames to R2
      const frameKeys: string[] = [];
      for (let i = 1; i <= frameCount; i++) {
        const framePath = `${tempOutput}/frame_${String(i).padStart(3, "0")}.jpg`;
        try {
          const frameData = await Deno.readFile(framePath);
          const result = await uploadMedia(
            frameData,
            `frame_${i}.jpg`,
            "image/jpeg",
            sessionId
          );
          frameKeys.push(result.key);
        } catch {
          // Frame might not exist if video is shorter
          break;
        }
      }

      return {
        frameCount: frameKeys.length,
        frameKeys,
        message: `Extracted ${frameKeys.length} frames from video`,
      };
    } finally {
      // Cleanup temp files
      await Deno.remove(tempInput);
      await Deno.remove(tempOutput, { recursive: true });
    }
  },
};
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/tools/extractVideoFrames.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/tools/extractVideoFrames.ts
git commit -m "feat(diagnostic-agent): add video frame extraction tool with ffmpeg"
```

---

### Task 4.4: Create OBD Code Lookup Tool

**Files:**
- Create: `apps/diagnostic-agent/src/tools/lookupObdCode.ts`

**Step 1: Create lookupObdCode.ts**

```typescript
import { z } from "zod";

const lookupObdCodeSchema = z.object({
  code: z.string().describe("OBD-II code to look up (e.g., P0301)"),
});

// Common OBD-II code reference
const OBD_CODES: Record<string, { description: string; system: string }> = {
  // Misfire codes
  P0300: { description: "Random/Multiple Cylinder Misfire Detected", system: "Ignition" },
  P0301: { description: "Cylinder 1 Misfire Detected", system: "Ignition" },
  P0302: { description: "Cylinder 2 Misfire Detected", system: "Ignition" },
  P0303: { description: "Cylinder 3 Misfire Detected", system: "Ignition" },
  P0304: { description: "Cylinder 4 Misfire Detected", system: "Ignition" },
  P0305: { description: "Cylinder 5 Misfire Detected", system: "Ignition" },
  P0306: { description: "Cylinder 6 Misfire Detected", system: "Ignition" },
  P0307: { description: "Cylinder 7 Misfire Detected", system: "Ignition" },
  P0308: { description: "Cylinder 8 Misfire Detected", system: "Ignition" },

  // Fuel system
  P0171: { description: "System Too Lean (Bank 1)", system: "Fuel" },
  P0172: { description: "System Too Rich (Bank 1)", system: "Fuel" },
  P0174: { description: "System Too Lean (Bank 2)", system: "Fuel" },
  P0175: { description: "System Too Rich (Bank 2)", system: "Fuel" },

  // Emissions
  P0420: { description: "Catalyst System Efficiency Below Threshold (Bank 1)", system: "Emissions" },
  P0430: { description: "Catalyst System Efficiency Below Threshold (Bank 2)", system: "Emissions" },
  P0440: { description: "Evaporative Emission Control System Malfunction", system: "EVAP" },
  P0442: { description: "Evaporative Emission Control System Leak Detected (small leak)", system: "EVAP" },
  P0455: { description: "Evaporative Emission Control System Leak Detected (gross leak)", system: "EVAP" },
  P0456: { description: "Evaporative Emission Control System Leak Detected (very small leak)", system: "EVAP" },

  // Engine
  P0011: { description: "Intake Camshaft Position Timing Over-Advanced (Bank 1)", system: "Timing" },
  P0012: { description: "Intake Camshaft Position Timing Over-Retarded (Bank 1)", system: "Timing" },
  P0128: { description: "Coolant Thermostat Below Regulating Temperature", system: "Cooling" },

  // Transmission
  P0700: { description: "Transmission Control System Malfunction", system: "Transmission" },
  P0715: { description: "Input/Turbine Speed Sensor Circuit Malfunction", system: "Transmission" },

  // Sensors
  P0101: { description: "Mass Air Flow Circuit Range/Performance Problem", system: "Sensors" },
  P0102: { description: "Mass Air Flow Circuit Low Input", system: "Sensors" },
  P0103: { description: "Mass Air Flow Circuit High Input", system: "Sensors" },
  P0113: { description: "Intake Air Temperature Circuit High Input", system: "Sensors" },
  P0117: { description: "Engine Coolant Temperature Circuit Low Input", system: "Sensors" },
  P0118: { description: "Engine Coolant Temperature Circuit High Input", system: "Sensors" },
  P0131: { description: "O2 Sensor Circuit Low Voltage (Bank 1 Sensor 1)", system: "Sensors" },
  P0134: { description: "O2 Sensor Circuit No Activity Detected (Bank 1 Sensor 1)", system: "Sensors" },
  P0500: { description: "Vehicle Speed Sensor Malfunction", system: "Sensors" },
};

export const lookupObdCodeTool = {
  name: "lookupObdCode",
  description: "Look up OBD-II diagnostic trouble code description and system",
  parameters: lookupObdCodeSchema,
  execute: async (params: z.infer<typeof lookupObdCodeSchema>) => {
    const { code } = params;
    const upperCode = code.toUpperCase().trim();

    const info = OBD_CODES[upperCode];

    if (info) {
      return {
        code: upperCode,
        description: info.description,
        system: info.system,
        found: true,
      };
    }

    // Parse code structure for unknown codes
    const codeType = upperCode[0];
    const typeMap: Record<string, string> = {
      P: "Powertrain",
      B: "Body",
      C: "Chassis",
      U: "Network",
    };

    return {
      code: upperCode,
      description: "Code not in reference database",
      system: typeMap[codeType] || "Unknown",
      found: false,
      note: "Manufacturer-specific code or not in common database. Agent will interpret based on context.",
    };
  },
};
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/tools/lookupObdCode.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/tools/lookupObdCode.ts
git commit -m "feat(diagnostic-agent): add OBD-II code lookup tool"
```

---

### Task 4.5: Create Storage Tool

**Files:**
- Create: `apps/diagnostic-agent/src/tools/storage.ts`

**Step 1: Create storage.ts**

```typescript
import { z } from "zod";
import { uploadMedia, getMedia } from "../lib/r2.ts";

const saveMediaSchema = z.object({
  data: z.string().describe("Base64-encoded media data"),
  filename: z.string().describe("Filename for the media"),
  contentType: z.string().describe("MIME type of the media"),
  sessionId: z.string().describe("Session ID for organizing storage"),
});

const getMediaSchema = z.object({
  r2Key: z.string().describe("R2 storage key for the media"),
});

export const saveMediaTool = {
  name: "saveMedia",
  description: "Save uploaded media (photo, audio, video) to cloud storage",
  parameters: saveMediaSchema,
  execute: async (params: z.infer<typeof saveMediaSchema>) => {
    const { data, filename, contentType, sessionId } = params;

    // Decode base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

    const result = await uploadMedia(binaryData, filename, contentType, sessionId);

    return {
      success: true,
      r2Key: result.key,
      url: result.url,
    };
  },
};

export const getMediaTool = {
  name: "getMedia",
  description: "Retrieve media from cloud storage",
  parameters: getMediaSchema,
  execute: async (params: z.infer<typeof getMediaSchema>) => {
    const { r2Key } = params;

    const data = await getMedia(r2Key);

    return {
      success: true,
      data: btoa(String.fromCharCode(...data)),
      size: data.length,
    };
  },
};
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/tools/storage.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/tools/storage.ts
git commit -m "feat(diagnostic-agent): add media storage tools for R2"
```

---

## Phase 5: Middleware

### Task 5.1: Create Auth Middleware

**Files:**
- Create: `apps/diagnostic-agent/src/middleware/auth.ts`

**Step 1: Create auth.ts**

```typescript
import { verifyToken, type AuthUser } from "../lib/supabase.ts";
import { db } from "../db/client.ts";
import { customers } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface AuthContext {
  user: AuthUser;
  customerId: string;
  stripeCustomerId: string;
}

export async function authenticateRequest(
  request: Request
): Promise<AuthContext | Response> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up customer by email to get customerId and stripeCustomerId
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, user.email))
    .limit(1);

  if (!customer) {
    return new Response(JSON.stringify({ error: "Customer not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!customer.stripeCustomerId) {
    return new Response(JSON.stringify({ error: "Customer has no billing account" }), {
      status: 402,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    user,
    customerId: customer.id,
    stripeCustomerId: customer.stripeCustomerId,
  };
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/middleware/auth.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/middleware/auth.ts
git commit -m "feat(diagnostic-agent): add authentication middleware"
```

---

### Task 5.2: Create Credits Middleware

**Files:**
- Create: `apps/diagnostic-agent/src/middleware/credits.ts`

**Step 1: Create credits.ts**

```typescript
import {
  getCustomerCredits,
  deductCredits,
  CREDIT_COSTS,
  calculateAudioCredits,
  calculateVideoCredits,
  type InputType,
} from "../lib/stripe.ts";

export interface CreditCheck {
  hasEnough: boolean;
  balance: number;
  required: number;
}

export async function checkCredits(
  stripeCustomerId: string,
  inputType: InputType,
  durationSeconds?: number
): Promise<CreditCheck> {
  const balance = await getCustomerCredits(stripeCustomerId);

  let required: number;
  switch (inputType) {
    case "audio":
      required = calculateAudioCredits(durationSeconds ?? 30);
      break;
    case "video":
      required = calculateVideoCredits(durationSeconds ?? 30);
      break;
    default:
      required = CREDIT_COSTS[inputType];
  }

  return {
    hasEnough: balance >= required,
    balance,
    required,
  };
}

export async function processCredits(
  stripeCustomerId: string,
  inputType: InputType,
  sessionId: string,
  durationSeconds?: number
): Promise<{ charged: number } | Response> {
  const check = await checkCredits(stripeCustomerId, inputType, durationSeconds);

  if (!check.hasEnough) {
    return new Response(
      JSON.stringify({
        error: "Insufficient credits",
        balance: check.balance,
        required: check.required,
        shortfall: check.required - check.balance,
      }),
      {
        status: 402,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await deductCredits(
    stripeCustomerId,
    check.required,
    `Diagnostic session ${sessionId}: ${inputType} analysis`
  );

  return { charged: check.required };
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/middleware/credits.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/middleware/credits.ts
git commit -m "feat(diagnostic-agent): add credit check and deduction middleware"
```

---

## Phase 6: Agent Definition

### Task 6.1: Create System Prompt

**Files:**
- Create: `apps/diagnostic-agent/src/system-prompt.ts`

**Step 1: Create system-prompt.ts**

```typescript
export const SYSTEM_PROMPT = `You are an expert automotive diagnostic assistant. You help customers diagnose vehicle problems by analyzing photos, audio recordings, videos, and OBD-II diagnostic codes.

## Your Capabilities

1. **Photo Analysis**: Examine images of engine bays, tires, brakes, body damage, and other vehicle components to identify issues.

2. **Audio Analysis**: Listen to engine sounds, brake noises, and other vehicle audio to diagnose mechanical problems.

3. **Video Analysis**: Review videos showing vehicle behavior, warning lights, or mechanical issues in motion.

4. **OBD-II Code Interpretation**: Explain diagnostic trouble codes and their likely causes.

## Diagnostic Approach

1. **Gather Information**: Ask clarifying questions about symptoms, when they occur, and vehicle history.

2. **Analyze Evidence**: Use the provided photos, audio, video, and codes to identify patterns.

3. **Correlate Findings**: Connect symptoms across different inputs to find root causes.

4. **Provide Diagnosis**: Give clear explanations with confidence levels and severity ratings.

5. **Recommend Actions**: Suggest next steps, from DIY fixes to professional service.

## Response Style

- Be conversational and helpful
- Use plain language, avoid excessive jargon
- Rate issue severity: Critical (stop driving), High, Medium, Low
- Distinguish confirmed issues from suspected ones
- Always recommend professional inspection for safety-critical items
- Ask for additional input if needed (more photos, different angles, etc.)

## Safety First

- If you identify a critical safety issue (brake failure, steering problems, etc.), immediately warn the customer not to drive
- Be clear about limitations - you can identify likely issues but cannot replace in-person inspection
- Recommend professional diagnosis for complex or dangerous problems`;
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/system-prompt.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/system-prompt.ts
git commit -m "feat(diagnostic-agent): add diagnostic agent system prompt"
```

---

### Task 6.2: Create Agent Definition

**Files:**
- Create: `apps/diagnostic-agent/src/agent.ts`

**Step 1: Create agent.ts**

```typescript
import {
  createZypherAgent,
  ZypherAgent,
  anthropic,
  type ZypherContext,
} from "@corespeed/zypher";
import { env } from "./env.ts";
import { SYSTEM_PROMPT } from "./system-prompt.ts";
import { analyzeImageTool } from "./tools/analyzeImage.ts";
import { transcribeAudioTool } from "./tools/transcribeAudio.ts";
import { extractVideoFramesTool } from "./tools/extractVideoFrames.ts";
import { lookupObdCodeTool } from "./tools/lookupObdCode.ts";
import { saveMediaTool, getMediaTool } from "./tools/storage.ts";

const MODEL = "claude-sonnet-4-20250514";

const allTools = [
  analyzeImageTool,
  transcribeAudioTool,
  extractVideoFramesTool,
  lookupObdCodeTool,
  saveMediaTool,
  getMediaTool,
];

export async function createDiagnosticAgent(): Promise<ZypherAgent> {
  const isProduction = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  if (isProduction) {
    // Production: no filesystem access
    const mockContext: ZypherContext = {
      workingDirectory: "/src",
      zypherDir: "/tmp/.zypher",
      workspaceDataDir: "/tmp/.zypher/data",
      fileAttachmentCacheDir: "/tmp/.zypher/cache",
      skillsDir: "/tmp/.zypher/skills",
    };

    return new ZypherAgent(
      mockContext,
      anthropic(MODEL, { apiKey: env.ANTHROPIC_API_KEY }),
      {
        tools: allTools,
        overrides: {
          systemPromptLoader: async () => SYSTEM_PROMPT,
        },
      }
    );
  }

  // Development: full features
  const agent = await createZypherAgent({
    model: anthropic(MODEL, { apiKey: env.ANTHROPIC_API_KEY }),
    tools: allTools,
    overrides: {
      systemPromptLoader: async () => SYSTEM_PROMPT,
    },
  });

  // Load skills
  await agent.skills.discover();
  const skillNames = Array.from(agent.skills.skills.values()).map(
    (s) => s.metadata.name
  );
  if (skillNames.length > 0) {
    console.log(`[diagnostic-agent] Skills loaded: ${skillNames.join(", ")}`);
  }

  return agent;
}
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/agent.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/agent.ts
git commit -m "feat(diagnostic-agent): add Zypher agent definition with tools"
```

---

## Phase 7: API Server

### Task 7.1: Create Main Entry Point

**Files:**
- Modify: `apps/diagnostic-agent/src/main.ts`

**Step 1: Update main.ts with full server**

```typescript
import { env } from "./env.ts";
import { createDiagnosticAgent } from "./agent.ts";
import { authenticateRequest, type AuthContext } from "./middleware/auth.ts";
import { processCredits } from "./middleware/credits.ts";
import { db } from "./db/client.ts";
import {
  diagnosticSessions,
  diagnosticMedia,
  obdCodes,
} from "./db/schema.ts";
import { eq } from "drizzle-orm";
import { uploadMedia } from "./lib/r2.ts";
import type { InputType } from "./lib/stripe.ts";

const agent = await createDiagnosticAgent();

console.log(`[diagnostic-agent] Starting server on port ${env.PORT}`);

Deno.serve({ port: parseInt(env.PORT) }, async (request) => {
  const url = new URL(request.url);
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // All other routes require auth
  const authResult = await authenticateRequest(request);
  if (authResult instanceof Response) {
    return authResult;
  }
  const auth: AuthContext = authResult;

  try {
    // POST /diagnostics - Start new session
    if (method === "POST" && url.pathname === "/diagnostics") {
      const [session] = await db
        .insert(diagnosticSessions)
        .values({ customerId: auth.customerId })
        .returning();

      return new Response(
        JSON.stringify({
          sessionId: session.id,
          status: session.status,
          message: "Diagnostic session started. Send inputs to analyze.",
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // GET /diagnostics - List sessions
    if (method === "GET" && url.pathname === "/diagnostics") {
      const sessions = await db
        .select()
        .from(diagnosticSessions)
        .where(eq(diagnosticSessions.customerId, auth.customerId))
        .orderBy(diagnosticSessions.createdAt);

      return new Response(JSON.stringify({ sessions }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Match /diagnostics/:id routes
    const sessionMatch = url.pathname.match(/^\/diagnostics\/([^/]+)(\/.*)?$/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      const subPath = sessionMatch[2] || "";

      // Verify session belongs to customer
      const [session] = await db
        .select()
        .from(diagnosticSessions)
        .where(eq(diagnosticSessions.id, sessionId))
        .limit(1);

      if (!session || session.customerId !== auth.customerId) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // GET /diagnostics/:id - Get session details
      if (method === "GET" && !subPath) {
        const media = await db
          .select()
          .from(diagnosticMedia)
          .where(eq(diagnosticMedia.sessionId, sessionId));

        const codes = await db
          .select()
          .from(obdCodes)
          .where(eq(obdCodes.sessionId, sessionId));

        return new Response(
          JSON.stringify({ session, media, codes }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // POST /diagnostics/:id/input - Process input
      if (method === "POST" && subPath === "/input") {
        const body = await request.json();
        const { type, content, filename, contentType, durationSeconds } = body;

        // Validate input type
        const validTypes = ["text", "obd", "photo", "audio", "video"];
        if (!validTypes.includes(type)) {
          return new Response(
            JSON.stringify({ error: "Invalid input type" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check and deduct credits
        const creditResult = await processCredits(
          auth.stripeCustomerId,
          type as InputType,
          sessionId,
          durationSeconds
        );
        if (creditResult instanceof Response) {
          return creditResult;
        }

        // Update session credits
        await db
          .update(diagnosticSessions)
          .set({
            creditsCharged: session.creditsCharged + creditResult.charged,
            status: "processing",
          })
          .where(eq(diagnosticSessions.id, sessionId));

        // Handle different input types
        let agentInput: string;

        if (type === "text") {
          agentInput = content;
        } else if (type === "obd") {
          // Store OBD code
          await db.insert(obdCodes).values({
            sessionId,
            code: content,
            source: "manual",
          });
          agentInput = `OBD-II Code: ${content}`;
        } else if (type === "photo" || type === "audio" || type === "video") {
          // Upload media to R2
          const binaryData = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
          const uploadResult = await uploadMedia(
            binaryData,
            filename,
            contentType,
            sessionId
          );

          // Store media record
          await db.insert(diagnosticMedia).values({
            sessionId,
            type: type === "photo" ? "photo" : type === "audio" ? "audio" : "video",
            r2Key: uploadResult.key,
            creditCost: creditResult.charged,
            metadata: { filename, contentType, durationSeconds },
          });

          agentInput = `[${type.toUpperCase()} uploaded: ${filename}] URL: ${uploadResult.url}`;
        } else {
          agentInput = content;
        }

        // Run agent with input
        const response = await agent.runTask(agentInput, {
          stream: false,
        });

        return new Response(
          JSON.stringify({
            response: response.content,
            creditsCharged: creditResult.charged,
            sessionCreditsTotal: session.creditsCharged + creditResult.charged,
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("[diagnostic-agent] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
```

**Step 2: Verify types**

Run: `cd apps/diagnostic-agent && deno check src/main.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/main.ts
git commit -m "feat(diagnostic-agent): add API server with session and input endpoints"
```

---

## Phase 8: Agent Skills

### Task 8.1: Create Photo Diagnosis Skill

**Files:**
- Create: `apps/diagnostic-agent/.skills/photo-diagnosis/skill.md`

**Step 1: Create skill file (use content from design document)**

See `docs/plans/2026-01-30-diagnostic-agent-design.md` Section 8 for full content.

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/.skills/photo-diagnosis
git commit -m "feat(diagnostic-agent): add photo-diagnosis skill"
```

---

### Task 8.2: Create Audio Diagnosis Skill

**Files:**
- Create: `apps/diagnostic-agent/.skills/audio-diagnosis/skill.md`

**Step 1: Create skill file (use content from design document)**

See `docs/plans/2026-01-30-diagnostic-agent-design.md` Section 8 for full content.

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/.skills/audio-diagnosis
git commit -m "feat(diagnostic-agent): add audio-diagnosis skill"
```

---

### Task 8.3: Create Video Diagnosis Skill

**Files:**
- Create: `apps/diagnostic-agent/.skills/video-diagnosis/skill.md`

**Step 1: Create skill file (use content from design document)**

See `docs/plans/2026-01-30-diagnostic-agent-design.md` Section 8 for full content.

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/.skills/video-diagnosis
git commit -m "feat(diagnostic-agent): add video-diagnosis skill"
```

---

### Task 8.4: Create OBD Diagnosis Skill

**Files:**
- Create: `apps/diagnostic-agent/.skills/obd-diagnosis/skill.md`

**Step 1: Create skill file (use content from design document)**

See `docs/plans/2026-01-30-diagnostic-agent-design.md` Section 8 for full content.

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/.skills/obd-diagnosis
git commit -m "feat(diagnostic-agent): add obd-diagnosis skill"
```

---

### Task 8.5: Create Comprehensive Diagnosis Skill

**Files:**
- Create: `apps/diagnostic-agent/.skills/comprehensive-diagnosis/skill.md`

**Step 1: Create skill file (use content from design document)**

See `docs/plans/2026-01-30-diagnostic-agent-design.md` Section 8 for full content.

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/.skills/comprehensive-diagnosis
git commit -m "feat(diagnostic-agent): add comprehensive-diagnosis skill"
```

---

## Phase 9: Deployment

### Task 9.1: Create Dockerfile

**Files:**
- Create: `apps/diagnostic-agent/Dockerfile`

**Step 1: Create Dockerfile**

```dockerfile
FROM denoland/deno:2.1.4

WORKDIR /app

# Copy dependency files
COPY deno.json .

# Cache dependencies
RUN deno install

# Copy source
COPY src/ src/
COPY .skills/ .skills/

# Compile
RUN deno cache src/main.ts

# Run
EXPOSE 8001
CMD ["deno", "run", "--allow-all", "src/main.ts"]
```

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/Dockerfile
git commit -m "feat(diagnostic-agent): add Dockerfile for Railway deployment"
```

---

### Task 9.2: Create Railway Configuration

**Files:**
- Create: `apps/diagnostic-agent/railway.toml`

**Step 1: Create railway.toml**

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Step 2: Commit**

```bash
git add apps/diagnostic-agent/railway.toml
git commit -m "feat(diagnostic-agent): add Railway deployment configuration"
```

---

### Task 9.3: Add to Turbo Config

**Files:**
- Modify: `turbo.json` (if needed)
- Modify: `package.json` (add dev script)

**Step 1: Add dev:diagnostic script to root package.json**

Add to scripts:
```json
"dev:diagnostic": "cd apps/diagnostic-agent && deno task dev"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add diagnostic-agent dev script to root package.json"
```

---

## Phase 10: Testing

### Task 10.1: Create Integration Test

**Files:**
- Create: `apps/diagnostic-agent/src/test/integration.test.ts`

**Step 1: Create basic integration test**

```typescript
import { assertEquals } from "jsr:@std/assert";

Deno.test("health check returns ok", async () => {
  const response = await fetch("http://localhost:8001/health");
  const body = await response.json();
  assertEquals(body.status, "ok");
});

Deno.test("unauthenticated request returns 401", async () => {
  const response = await fetch("http://localhost:8001/diagnostics");
  assertEquals(response.status, 401);
});
```

**Step 2: Add test task to deno.json**

Add to tasks:
```json
"test": "deno test --allow-all src/test/"
```

**Step 3: Commit**

```bash
git add apps/diagnostic-agent/src/test apps/diagnostic-agent/deno.json
git commit -m "test(diagnostic-agent): add basic integration tests"
```

---

## Summary

This implementation plan covers:

1. **Phase 1-2**: Project setup, environment config, database schema
2. **Phase 3**: External service clients (Supabase, Stripe, R2, Whisper)
3. **Phase 4**: Agent tools (image, audio, video, OBD, storage)
4. **Phase 5**: Auth and credits middleware
5. **Phase 6**: Agent definition with system prompt
6. **Phase 7**: API server with endpoints
7. **Phase 8**: Agent skills (5 diagnostic skills)
8. **Phase 9**: Deployment config (Docker, Railway)
9. **Phase 10**: Basic integration tests

Total: ~25 tasks across 10 phases.
