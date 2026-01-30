# Diagnostic Agent Design

A standalone multimodal diagnostic agent for vehicle troubleshooting, deployed separately from the existing HMLS agent.

## Overview

The diagnostic agent analyzes photos, audio, video, and OBD-II codes to help customers diagnose vehicle issues. It operates on a credit-based subscription model and is designed for future mobile app integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (future)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ Supabase Auth (OAuth + JWT)
┌─────────────────────────▼───────────────────────────────────┐
│                  Diagnostic Agent API                        │
│                  (Railway - Deno/Zypher)                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Claude Sonnet│   Whisper    │ Frame Extract│  OBD Parser    │
│ (images/chat)│   (audio)    │   (video)    │  (codes/BT)    │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │               │
       └──────────────┼──────────────┼───────────────┘
                      ▼              ▼
              ┌──────────────┐ ┌──────────────┐
              │ Cloudflare R2│ │  PostgreSQL  │
              │   (media)    │ │  (shared DB) │
              └──────────────┘ └──────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Deno + Zypher framework |
| AI (reasoning/vision) | Claude Sonnet 4 |
| AI (audio) | OpenAI Whisper |
| Video processing | ffmpeg (frame extraction) |
| Auth | Supabase Auth (Google, Apple OAuth + JWT) |
| Media storage | Cloudflare R2 |
| Database | PostgreSQL (shared with HMLS) |
| Billing/Credits | Stripe |
| Deployment | Railway |
| Protocol | AG-UI (conversational streaming) |

## Subscription & Credits

### Tiers

| Tier | Monthly Credits | Price |
|------|-----------------|-------|
| Free | 10 | $0 |
| Pro | 100 | TBD |
| Premium | 200 | TBD |

### Credit Costs

| Input Type | Credits |
|------------|---------|
| Text + OBD codes | 1 |
| Photo (each) | 2 |
| Audio (per 30s) | 5 |
| Video (per 30s) | 10 |

### Rules

- Credits reset each billing cycle (no rollover)
- Top-up packs available for purchase
- Stripe handles subscription state and credit balance
- JWT contains tier for fast access control
- Middleware deducts credits before agent processes input

## Input Methods

### OBD-II Codes
- Manual text entry (e.g., "P0301")
- Photo of code reader screen (OCR extraction)
- Bluetooth OBD-II adapter (future mobile app)

### Media
- Photos: Engine bay, tires, brakes, damage, dashboard
- Audio: Engine sounds, brake noises, clicking, grinding
- Video: Issues in motion, exhaust smoke, vibrations

## Data Model

Stripe handles subscriptions and credits. Database stores diagnostic data only.

### diagnosticSessions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customerId | uuid | FK to customers |
| status | enum | pending, processing, complete, failed |
| creditsCharged | int | Total credits used |
| createdAt | timestamp | Session start |
| completedAt | timestamp | Session end |
| result | jsonb | AI-generated diagnosis |

**Result JSON structure:**
```json
{
  "diagnosis": "Primary issue identified",
  "confidence": "high|medium|low",
  "obdAnalysis": [
    {
      "code": "P0301",
      "description": "Cylinder 1 misfire",
      "possibleCauses": ["worn spark plug", "faulty coil"],
      "recommendedActions": ["inspect spark plugs"]
    }
  ],
  "mediaAnalysis": [
    {
      "mediaId": "uuid",
      "findings": "Brake pads worn to 2mm",
      "severity": "high"
    }
  ],
  "overallRecommendation": "Replace spark plugs and brake pads"
}
```

### diagnosticMedia

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sessionId | uuid | FK to diagnosticSessions |
| type | enum | photo, audio, video, obd_photo |
| r2Key | string | Cloudflare R2 object key |
| creditCost | int | Credits charged for this media |
| metadata | jsonb | Duration, dimensions, etc. |
| processingStatus | enum | pending, processing, complete, failed |
| transcription | text | Whisper output (for audio) |
| createdAt | timestamp | Upload time |

### obdCodes

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sessionId | uuid | FK to diagnosticSessions |
| code | string | e.g., "P0301" |
| source | enum | manual, bluetooth, ocr |
| createdAt | timestamp | Input time |

## API Endpoints

### Diagnostics (AG-UI Protocol)

```
POST   /diagnostics              → Start new session
GET    /diagnostics/:id          → Get session status + result
POST   /diagnostics/:id/input    → Send text, photo, audio, video, or OBD
GET    /diagnostics              → List user's diagnostic history
```

### OBD Helpers

```
POST   /obd/parse-image          → OCR extract codes from photo
WS     /obd/connect              → WebSocket for Bluetooth adapter (future)
```

### Billing (Stripe Proxy)

```
GET    /billing/credits          → Current balance from Stripe
POST   /billing/topup            → Purchase credits, returns Stripe checkout URL
POST   /billing/webhook          → Stripe webhook handler
```

## Agent Flow

```
1. Customer starts session
   └── POST /diagnostics → creates session, opens conversation

2. Conversational loop (AG-UI streaming)
   └── POST /diagnostics/:id/input
       ├── Middleware: validate Supabase JWT
       ├── Middleware: check sufficient credits
       ├── Middleware: deduct credits from Stripe
       ├── Store raw input (media to R2, codes to DB)
       ├── Agent processes input:
       │   ├── Photos → Claude Sonnet (vision)
       │   ├── Audio → Whisper → text → Claude
       │   ├── Video → extract frames → Claude + Whisper
       │   └── OBD codes → Claude with automotive context
       ├── Agent responds conversationally:
       │   "I see a P0301 code - that's a cylinder 1 misfire.
       │    Can you send a photo of your spark plugs?"
       └── Repeat until diagnosis complete

3. Session closes with summary
   └── Agent provides final diagnosis in chat
   └── Result JSON saved to session for history
```

## Project Structure

```
apps/diagnostic-agent/
├── deno.json
├── src/
│   ├── main.ts                    # Entry point, Zypher setup
│   ├── agent.ts                   # Diagnostic agent definition
│   │
│   ├── tools/
│   │   ├── analyzeImage.ts        # Claude vision
│   │   ├── transcribeAudio.ts     # Whisper
│   │   ├── extractVideoFrames.ts  # ffmpeg
│   │   ├── lookupObdCode.ts       # Code reference
│   │   └── storage.ts             # R2 upload/fetch
│   │
│   ├── middleware/
│   │   ├── auth.ts                # Validate Supabase JWT
│   │   └── credits.ts             # Check/deduct Stripe balance
│   │
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema
│   │   └── client.ts              # DB connection
│   │
│   └── lib/
│       ├── stripe.ts              # Stripe client
│       ├── r2.ts                  # Cloudflare R2 client
│       ├── supabase.ts            # Supabase auth client
│       └── whisper.ts             # OpenAI Whisper client
│
├── .skills/
│   ├── photo-diagnosis/skill.md
│   ├── audio-diagnosis/skill.md
│   ├── video-diagnosis/skill.md
│   ├── obd-diagnosis/skill.md
│   └── comprehensive-diagnosis/skill.md
│
├── Dockerfile
└── railway.toml
```

## Agent Skills

### photo-diagnosis
Analyzes vehicle photos for:
- Tire wear patterns (cupping, feathering, edge wear)
- Brake pad thickness and rotor condition
- Engine bay leaks, corrosion, worn belts/hoses
- Exhaust smoke color (white, blue, black)
- Body damage assessment

### audio-diagnosis
Interprets vehicle sounds:
- Knocking/pinging (detonation, rod knock, piston slap)
- Squealing (belt, brakes, power steering)
- Grinding (brakes, transmission, CV joint)
- Clicking/ticking (low oil, lifters, CV joint)
- Humming/whining (wheel bearing, transmission)

### video-diagnosis
Processes video for:
- Frame extraction for visual analysis
- Audio track transcription
- Motion-based issues (vibration, steering pull)
- Smoke patterns over time
- Dashboard warning light behavior

### obd-diagnosis
Interprets OBD-II codes:
- Code structure parsing (P/B/C/U, generic vs manufacturer)
- Common code quick reference
- Severity classification
- Root cause vs symptom identification

### comprehensive-diagnosis
Synthesizes all inputs:
- Correlates evidence across input types
- Identifies root cause vs symptoms
- Prioritizes by severity (critical/high/medium/low)
- Estimates repair complexity
- Generates structured diagnosis report

## Error Handling

| Scenario | Handling |
|----------|----------|
| Insufficient credits | 402 response with balance + required cost |
| Invalid/corrupt media | Error response, no credit deduction |
| Whisper fails | Agent asks for clearer audio recording |
| Video too long | Reject with max duration limit |
| Stripe unavailable | Queue credit ops, allow with grace period |
| Unrecognized OBD code | Agent attempts diagnosis, flags uncertainty |

### Refund Policy
- Processing failure (our fault): Auto-refund credits
- Bad quality input: No refund (customer can retry)

## Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=diagnostic-media

# Billing
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Future Considerations

- Mobile app with native camera/microphone access
- Bluetooth OBD-II adapter integration (ELM327)
- Integration with HMLS estimate agent for repair quotes
- Fleet/business tier for multiple vehicles
- Historical diagnosis comparison for repeat issues
