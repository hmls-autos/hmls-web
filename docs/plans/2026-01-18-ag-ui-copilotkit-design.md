# AG-UI Compliant Frontend with Headless CopilotKit

## Overview

Integrate CopilotKit in headless mode to gain full AG-UI protocol compliance while preserving the existing custom chat UI design.

## Goals

- Full AG-UI event coverage (messages, tools, state, steps, artifacts)
- Richer tool visualization with progress states
- State synchronization between frontend and agent
- Multi-modal support for structured outputs (estimates, PDFs)
- Preserve existing Framer Motion animations and emerald/zinc design

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js Web App (apps/web)                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  <CopilotKit runtimeUrl="/api/copilotkit" agent="hmls">    ││
│  │    (Headless - no UI components from CopilotKit)           ││
│  │    ├── ChatWidget.tsx    (custom popup, useCopilotChat)    ││
│  │    └── chat/page.tsx     (custom full page, useCopilotChat)││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  /api/copilotkit (Next.js API Route)                       ││
│  │    CopilotRuntime + HttpAgent → http://localhost:50051     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Deno Agent Service (apps/agent)                                │
│    /task endpoint (AG-UI SSE streaming) - NO CHANGES NEEDED     │
└─────────────────────────────────────────────────────────────────┘
```

## Packages to Install

```bash
cd apps/web
npm install @copilotkit/react-core @copilotkit/runtime @ag-ui/client
```

Note: `@copilotkit/react-ui` is NOT needed (headless mode).

## File Changes

### New Files

#### 1. `apps/web/app/api/copilotkit/route.ts`

CopilotKit runtime endpoint that bridges to the Deno agent:

```typescript
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

const runtime = new CopilotRuntime({
  agents: {
    hmls: new HttpAgent({
      url: process.env.AGENT_URL || "http://localhost:50051",
    }),
  },
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

#### 2. `apps/web/components/copilot/CopilotProvider.tsx`

Headless provider wrapper:

```typescript
"use client";

import { CopilotKit } from "@copilotkit/react-core";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="hmls">
      {children}
    </CopilotKit>
  );
}
```

### Modified Files

#### 3. `apps/web/app/layout.tsx`

Wrap with CopilotProvider:

```typescript
import { CopilotProvider } from "@/components/copilot/CopilotProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CopilotProvider>
          {children}
        </CopilotProvider>
      </body>
    </html>
  );
}
```

#### 4. `apps/web/components/ChatWidget.tsx`

Replace `useChat` with `useCopilotChat`:

```typescript
// Before
import { useChat } from "@/hooks/useChat";
const { messages, isLoading, sendMessage, clearMessages } = useChat();

// After
import { useCopilotChat } from "@copilotkit/react-core";
const {
  visibleMessages,
  isLoading,
  appendMessage,
  setMessages,
} = useCopilotChat();

// Adapt message format
const messages = visibleMessages.map(msg => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
}));

// Send message
const sendMessage = (text: string) => {
  appendMessage({ role: "user", content: text });
};

// Clear messages
const clearMessages = () => setMessages([]);
```

#### 5. `apps/web/app/chat/page.tsx`

Same changes as ChatWidget - replace `useChat` with `useCopilotChat`.

### Deleted Files

- `apps/web/hooks/useChat.ts` - Replaced by `useCopilotChat`
- `apps/web/stores/chatStore.ts` - CopilotKit manages state internally

## Environment Variables

Add to `.env.local`:

```env
AGENT_URL=http://localhost:50051
```

## Hook API Mapping

| Old (useChat) | New (useCopilotChat) |
|---------------|---------------------|
| `messages` | `visibleMessages` |
| `isLoading` | `isLoading` |
| `sendMessage(text)` | `appendMessage({ role: "user", content: text })` |
| `clearMessages()` | `setMessages([])` |
| `isConnected` | Always connected (runtime handles) |
| `currentTool` | Access via message metadata or `inProgressTool` |

## Tool Visualization

CopilotKit exposes tool call events. Update ChatWidget to show tool progress:

```typescript
const { visibleMessages, inProgressTool } = useCopilotChat();

// inProgressTool contains current tool execution info
const currentTool = inProgressTool?.name;
```

## Shared Conversation State

Both ChatWidget (popup) and chat/page.tsx share the same conversation because they're under the same `<CopilotKit>` provider. User can start in popup, navigate to /chat, and continue seamlessly.

## What This Enables

1. **Full AG-UI Event Support** - All 16 event types handled by CopilotKit
2. **Tool Progress** - Real-time tool execution status
3. **State Sync** - Bidirectional state between frontend and agent
4. **Generative UI** - Agent can render custom components (future)
5. **Human-in-the-Loop** - Confirmation flows for sensitive actions (future)

## Implementation Order

1. Install packages
2. Create `/api/copilotkit/route.ts`
3. Create `CopilotProvider.tsx`
4. Update `layout.tsx` to use provider
5. Update `ChatWidget.tsx` to use `useCopilotChat`
6. Update `chat/page.tsx` to use `useCopilotChat`
7. Delete `useChat.ts` and `chatStore.ts`
8. Test popup and full chat page
9. Verify conversation state persists between views
