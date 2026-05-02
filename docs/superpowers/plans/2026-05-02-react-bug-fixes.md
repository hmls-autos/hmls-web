# React/Next.js Bug Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the ~28 confirmed React/Next.js issues identified in two scans of `apps/hmls-web/`, grouped into 5 sequential PRs that each land independently.

**Architecture:** Five focused PRs land in order. Each removes a category of bugs without touching the others. Within a PR, related issues are batched so reviewers can validate one mental model per PR.

**Tech stack:** Next.js 16 App Router, React 19, SWR 2, Sonner (already installed), shadcn/ui (radix-ui), Tailwind 4, Biome, TypeScript strict.

**No automated tests** in this codebase. Each PR ships with a manual verification checklist that exercises the specific surfaces it touches.

---

## Open decisions (need user sign-off before PR 3 + PR 4)

### D1 — Date timezone strategy (affects PR 4)
`lib/format.ts` formatters omit `timeZone`, so SSR (Deno Deploy = UTC) and client (user local) produce different strings → hydration mismatch warnings on every page that renders dates.

**Options:**
- **(A) `<DateTime>` wrapper component** — render `null` until `useEffect` fires, then formatted string. One file to change behavior; one component to import. Brief flash of empty space for dates on first paint.
- **(B) `<time suppressHydrationWarning>{formatted}</time>`** — keep formatters as-is, mark all date spans. ~30 call sites to touch. No flash.
- **(C) Hardcode shop TZ `America/Los_Angeles`** — every customer sees PST regardless of their TZ. Wrong for any future non-CA customer.

**Recommendation: A.** One central component, no flash on most callers because dates appear under `Skeleton` loaders anyway, low-touch.

### D2 — Replace `prompt()` / `window.confirm()` (affects PR 3)
Seven callers (5 `prompt`, 2 `confirm`) for cancellation reasons + clear-chat confirms. Need a real UI.

**Options:**
- **(A) Build `ReasonDialog` + `ConfirmDialog` components** on top of shadcn `Dialog` / `AlertDialog` and use them in all 7 places.
- **(B) Inline the dialog state in each consumer** — more code per page, less abstraction.

**Recommendation: A.** Two reusable components, ~50 lines each, swap `prompt()` calls for `await reasonDialog({...})` (Promise-based API).

### D3 — Profile empty-string handling (affects PR 3)
`/api/portal/me` PUT currently filters `name || undefined` → server doesn't update. User can't clear an existing phone number.

**Verify before fix:** does the gateway accept `null` for these fields? Check `apps/gateway/src/routes/portal.ts` PUT handler. If yes → send `null` for cleared fields. If no → coordinate a tiny gateway change in same PR.

**Recommendation:** Plan for `null`. PR includes the agent route change if needed.

### D4 — Don't fix list (acknowledged, deferred)
- `PageEnter` route-change remount — intentional for animation
- Mechanic detail page re-fetching whole mechanics list for KPIs — needs `/api/admin/mechanics/:id` to return KPI fields; gateway change, separate PR
- Per-card `loading` prop on portal Order/BookingCard — works fine, optimization not worth it
- `/admin/orders` "More" dropdown click-outside — separate UX feature

---

## File structure

No new top-level directories. New files:

- `apps/hmls-web/components/ui/DateTime.tsx` — D1 wrapper
- `apps/hmls-web/components/ui/ReasonDialog.tsx` — D2 prompt replacement
- `apps/hmls-web/components/ui/ConfirmDialog.tsx` — D2 confirm replacement (or thin wrapper around shadcn `AlertDialog` if it exists)
- `apps/hmls-web/lib/swr-stable.ts` — single-line `useStableArray<T>(data?: T[]): T[]` helper for PR 1

Modified files are listed per PR.

---

## PR 1 — Stabilize foundation

**Issues fixed:** #6 (SWR `data ?? []` instability), #4 (AuthProvider memo + JWT decode), #9 (AuthProvider unmount guard), #26 part 1 (Login double-push).

**Why first:** every later PR consumes stable hook return values and stable Auth context. Doing this first means PR 2's "stop syncing SWR to state" fixes don't have to fight unstable references.

### Files

- Create: `apps/hmls-web/lib/swr-stable.ts`
- Modify: `apps/hmls-web/hooks/useAdmin.ts`, `useAdminMechanics.ts`, `useMechanic.ts`, `usePortal.ts`
- Modify: `apps/hmls-web/components/AuthProvider.tsx`
- Modify: `apps/hmls-web/app/(auth)/login/page.tsx`

### Tasks

- [ ] **1.1 Create `lib/swr-stable.ts`**

```ts
import { useMemo } from "react";

const EMPTY: readonly never[] = Object.freeze([]);

/** SWR returns a stable reference for `data` while it's defined, but `data ?? []`
 * creates a fresh `[]` every render when data is `undefined`, which breaks
 * downstream `useEffect` / `useMemo` deps. This memoizes to the same empty
 * array reference across renders. */
export function useStableArray<T>(data: T[] | undefined): T[] {
  return useMemo(() => data ?? (EMPTY as unknown as T[]), [data]);
}
```

- [ ] **1.2 Wire `useStableArray` into all 4 hook files**

For each `data ?? []` site in `hooks/useAdmin.ts`, `useAdminMechanics.ts`, `useMechanic.ts`, `usePortal.ts`:

```diff
-  return { customers: data ?? [], isLoading, ... };
+  return { customers: useStableArray(data), isLoading, ... };
```

There are 9 such sites total. Touch each one.

- [ ] **1.3 Memoize `AuthProvider` value + JWT decode**

`components/AuthProvider.tsx`:

```diff
+import { useMemo } from "react";

 export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [supabase] = useState(() => createClient());

   useEffect(() => {
+    let cancelled = false;
     supabase.auth
       .getSession()
       .then(({ data: { session } }) => {
+        if (cancelled) return;
         setSession(session);
         setUser(session?.user ?? null);
         setIsLoading(false);
       });

     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (_event, session) => {
+        if (cancelled) return;
         setSession(session);
         setUser(session?.user ?? null);
         setIsLoading(false);
       },
     );

-    return () => subscription.unsubscribe();
+    return () => {
+      cancelled = true;
+      subscription.unsubscribe();
+    };
   }, [supabase]);

-  const { isAdmin, isMechanic } = rolesFromSession(session);
+  const { isAdmin, isMechanic } = useMemo(
+    () => rolesFromSession(session),
+    [session?.access_token],
+  );

+  const value = useMemo(
+    () => ({ user, session, supabase, isLoading, isAdmin, isMechanic }),
+    [user, session, supabase, isLoading, isAdmin, isMechanic],
+  );

-  return (
-    <AuthContext.Provider value={{ user, session, supabase, isLoading, isAdmin, isMechanic }}>
+  return (
+    <AuthContext.Provider value={value}>
       {children}
     </AuthContext.Provider>
   );
 }
```

- [ ] **1.4 Login page — drop redundant `router.push`**

`app/(auth)/login/page.tsx`:

```diff
       if (mode === "login") {
         const { error } = await supabase.auth.signInWithPassword({ email, password });
         if (error) throw error;
-        router.push("/chat");
+        // session change triggers redirect via the existing useEffect
       } else {
```

- [ ] **1.5 Verify**

```bash
cd apps/hmls-web
bun run typecheck
bun run lint
bun run build
```

Manual: log in / log out, confirm Navbar updates, confirm chat page redirects after login (single redirect, no flicker), confirm React DevTools shows `AuthProvider` value reference is stable across unrelated renders.

- [ ] **1.6 Commit**

```bash
git add apps/hmls-web/lib/swr-stable.ts apps/hmls-web/hooks apps/hmls-web/components/AuthProvider.tsx apps/hmls-web/app/\(auth\)/login/page.tsx
git commit -m "fix(web): stabilize SWR hook returns + AuthProvider value"
```

---

## PR 2 — Stop SWR-to-state data loss

**Issues fixed:** #1 (mechanic availability page), #2 (EditHoursDialog), #3 (customers mutate inconsistency), #19 (estimate review page race).

**Why now:** the highest-impact category — the bugs actually destroy user input. PR 1 made array refs stable; this PR removes the offending `useEffect` syncs entirely.

### Files

- Modify: `apps/hmls-web/app/(mechanic)/mechanic/availability/page.tsx`
- Modify: `apps/hmls-web/components/admin/mechanics/EditHoursDialog.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/customers/page.tsx`
- Modify: `apps/hmls-web/app/estimate/[id]/page.tsx`

### Tasks

- [ ] **2.1 Mechanic availability — initialize once, no resync**

Pattern: drop the props→state effect; instead key the form on the data load identity (or use `useState(() => initialFromData)`). Since data starts as `[]` and arrives later, use a "first non-empty" gate:

```diff
-  const { availability, isLoading, saveAvailability } = useMechanicAvailability();
-  const [slots, setSlots] = useState<Slot[]>([]);
+  const { availability, isLoading, saveAvailability, mutate } = useMechanicAvailability();
+  const [slots, setSlots] = useState<Slot[] | null>(null);
   ...
-  useEffect(() => {
-    setSlots(
-      availability.map((a) => ({ ... })),
-    );
-  }, [availability]);
+  // Initialize once when availability first loads. After that, slots is
+  // user-owned — SWR revalidations don't blow away in-progress edits.
+  // Saving calls `mutate()` so the next read reflects the persisted truth.
+  if (slots === null && !isLoading) {
+    setSlots(
+      availability.map((a) => ({
+        dayOfWeek: a.dayOfWeek,
+        startTime: normalizeTime(a.startTime),
+        endTime: normalizeTime(a.endTime),
+      })),
+    );
+  }
+  const currentSlots = slots ?? [];
```

(`setSlots` during render is allowed when guarded — React 18+ skips the re-render and re-runs synchronously.)

Replace `slots` references in render with `currentSlots`.

- [ ] **2.2 EditHoursDialog — same pattern, gated on `open`**

`components/admin/mechanics/EditHoursDialog.tsx`:

```diff
-  useEffect(() => {
-    if (open) {
-      setSlots(availability.map((a) => ({ ... })));
-      setError(null);
-    }
-  }, [open, availability]);
+  // Reset only on open transition, not on every availability ref change.
+  const wasOpen = useRef(false);
+  if (open && !wasOpen.current) {
+    wasOpen.current = true;
+    setSlots(availability.map((a) => ({
+      dayOfWeek: a.dayOfWeek,
+      startTime: normalize(a.startTime),
+      endTime: normalize(a.endTime),
+    })));
+    setError(null);
+  } else if (!open && wasOpen.current) {
+    wasOpen.current = false;
+  }
```

- [ ] **2.3 Customers page — share mutate via SWR matcher**

`app/(admin)/admin/customers/page.tsx` `CustomerDetail`:

```diff
-  const { mutate: mutateList } = useAdminCustomers();
+  // mutate by URL prefix — matches all `/api/admin/customers?search=...`
+  // variants the parent might be using.
+  const { mutate: globalMutate } = useSWRConfig();
+  const refreshList = () =>
+    globalMutate((key) => typeof key === "string" && key.startsWith("/api/admin/customers"));
   ...
-  await Promise.all([mutateDetail(), mutateList()]);
+  await Promise.all([mutateDetail(), refreshList()]);
   ...
-  await mutateList();
+  await refreshList();
   onDeleted();
```

Add `import { useSWRConfig } from "swr";`.

- [ ] **2.4 Estimate review page — switch to SWR with abort**

`app/estimate/[id]/page.tsx`: replace the `useState(null) + useCallback fetch + useEffect` with `useSWR`:

```diff
-import { useCallback, useEffect, useState } from "react";
+import { useState } from "react";
+import useSWR from "swr";
...
-  const [data, setData] = useState<EstimateReview | null>(null);
-  const [error, setError] = useState<string | null>(null);
-  const [loading, setLoading] = useState(true);
-  ...
-  const fetchEstimate = useCallback(async () => { ... }, [id, token]);
-  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);
+  const swrKey = token
+    ? `${AGENT_URL}/api/estimates/${id}/review?token=${encodeURIComponent(token)}`
+    : null;
+  const { data, error: swrError, isLoading } = useSWR<EstimateReview>(
+    swrKey,
+    async (url) => {
+      const res = await fetch(url);
+      if (!res.ok) {
+        const body = await res.json().catch(() => null);
+        throw new Error(body?.error?.message ?? "Estimate not found");
+      }
+      return res.json();
+    },
+  );
+  const error = !token ? "Missing token" : swrError?.message ?? null;
+  const loading = !!swrKey && isLoading;
```

SWR handles abort + race-free dedupe automatically.

- [ ] **2.5 Verify**

```bash
bun run typecheck && bun run lint && bun run build
```

Manual:
1. `/mechanic/availability` — type a new slot, leave the tab and come back; verify edit is preserved (was lost before).
2. `/admin/mechanics/:id` open Edit Hours dialog → edit a slot → tab away/back → confirm edits persist.
3. `/admin/customers?search=foo` → delete a customer → list updates without manual reload (was stale before).
4. `/estimate/:id?token=...` open in two tabs, refresh; confirm no stale flicker.

- [ ] **2.6 Commit**

```bash
git commit -m "fix(web): stop SWR revalidation from clobbering user form edits"
```

---

## PR 3 — Error feedback + replace alert/prompt/confirm

**Issues fixed:** #11–14 (silent failures in Profile, toggleActive, deleteOverride, Profile empty-string), all 7 `alert()` callers, all 7 `prompt()`/`confirm()` callers.

**Depends on D2 + D3 sign-off.**

### Files

- Create: `apps/hmls-web/components/ui/ReasonDialog.tsx`
- Create: `apps/hmls-web/components/ui/ConfirmDialog.tsx` (or wrap shadcn AlertDialog if vendored)
- Modify: `apps/hmls-web/app/(portal)/portal/profile/page.tsx`
- Modify: `apps/hmls-web/app/(portal)/portal/orders/page.tsx`
- Modify: `apps/hmls-web/app/(portal)/portal/orders/[id]/page.tsx`
- Modify: `apps/hmls-web/app/(portal)/portal/bookings/page.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/orders/[id]/page.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/mechanics/page.tsx`
- Modify: `apps/hmls-web/app/(mechanic)/mechanic/time-off/page.tsx`
- Modify: `apps/hmls-web/app/(marketing)/chat/page.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/chat/page.tsx`
- Modify: `apps/hmls-web/app/estimate/[id]/page.tsx`

### Tasks

- [ ] **3.1 Build `ReasonDialog`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Resolver = (reason: string | null) => void;
let pending: Resolver | null = null;
let setOpen: ((open: boolean) => void) | null = null;
let setTitle: ((t: string) => void) | null = null;
let setDescription: ((d: string) => void) | null = null;

export function askReason(opts: { title: string; description?: string }): Promise<string | null> {
  if (!setOpen || !setTitle) {
    return Promise.resolve(globalThis.prompt?.(opts.title) ?? null);
  }
  return new Promise<string | null>((resolve) => {
    pending?.(null);
    pending = resolve;
    setTitle?.(opts.title);
    setDescription?.(opts.description ?? "");
    setOpen?.(true);
  });
}

export function ReasonDialog() {
  const [open, _setOpen] = useState(false);
  const [title, _setTitle] = useState("");
  const [description, _setDescription] = useState("");
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setOpen = _setOpen; setTitle = _setTitle; setDescription = _setDescription; return () => { setOpen = null; setTitle = null; setDescription = null; }; }, []);
  useEffect(() => { if (open) { setValue(""); setTimeout(() => ref.current?.focus(), 50); } }, [open]);

  const close = (reason: string | null) => {
    pending?.(reason);
    pending = null;
    _setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close(null)}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <Textarea ref={ref} value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
        <DialogFooter>
          <Button variant="outline" onClick={() => close(null)}>Cancel</Button>
          <Button onClick={() => close(value)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Mount `<ReasonDialog />` once in `app/layout.tsx` near `<Toaster />`.

- [ ] **3.2 Build `ConfirmDialog`** (similar shape, returns `Promise<boolean>`).

```tsx
// Same singleton pattern as ReasonDialog. askConfirm({ title, description }): Promise<boolean>.
```

Mount once in `app/layout.tsx`.

- [ ] **3.3 Replace all 7 `prompt()` calls**

Sites:
- `app/(portal)/portal/bookings/page.tsx:110`
- `app/(portal)/portal/orders/page.tsx:120`
- `app/(portal)/portal/orders/[id]/page.tsx:258`
- `app/(admin)/admin/orders/[id]/page.tsx:682, 698`

Pattern:
```diff
-    const reason = prompt("Reason for cancelling (optional):");
-    if (reason === null) return;
+    const reason = await askReason({ title: "Reason for cancelling (optional)" });
+    if (reason === null) return;  // user clicked Cancel
```

- [ ] **3.4 Replace 2 `window.confirm()` calls**

Sites:
- `app/(marketing)/chat/page.tsx:225`
- `app/(admin)/admin/chat/page.tsx:168`

```diff
-              if (uiMessages.length === 0 || window.confirm("Clear chat history?")) {
+              if (uiMessages.length === 0 || (await askConfirm({ title: "Clear chat history?" }))) {
                 clearMessages();
               }
```

(Wrap the onClick in async or make `clearMessages` orchestration async.)

- [ ] **3.5 Replace all 7 `alert()` calls with `toast.error`**

Pattern (sites listed in scan):
```diff
-      alert(e instanceof Error ? e.message : `Failed to ${action} order`);
+      toast.error(e instanceof Error ? e.message : `Failed to ${action} order`);
```

`import { toast } from "sonner";` per file.

- [ ] **3.6 Profile page — add catch + null clearing**

`app/(portal)/portal/profile/page.tsx`:

```diff
   async function handleSave() {
     setSaving(true);
+    try {
       await authFetch("/api/portal/me", {
         method: "PUT",
         body: JSON.stringify({
-          name: name || undefined,
-          phone: phone || undefined,
-          address: address || undefined,
+          name: name.trim() || null,
+          phone: phone.trim() || null,
+          address: address.trim() || null,
           vehicleInfo: {
-            make: vehicleMake || undefined,
-            model: vehicleModel || undefined,
-            year: vehicleYear || undefined,
+            make: vehicleMake.trim() || null,
+            model: vehicleModel.trim() || null,
+            year: vehicleYear.trim() || null,
           },
         }),
       });
       await mutate();
       setEditing(false);
+    } catch (e) {
+      toast.error(e instanceof Error ? e.message : "Failed to save profile");
+    } finally {
       setSaving(false);
+    }
   }
```

**(Pre-flight check D3):** verify `apps/gateway/src/routes/portal.ts` PUT handler accepts `null` for these fields. If it ignores nulls, add a tiny patch in the same PR that treats `null` as "set to null".

- [ ] **3.7 Mechanics page — `toggleActive` add catch**

`app/(admin)/admin/mechanics/page.tsx`:

```diff
   async function toggleActive(m: MechanicListRow) {
+    try {
       if (m.isActive) {
         await authFetch(`/api/admin/mechanics/${m.id}`, { method: "DELETE" });
       } else {
         await authFetch(`/api/admin/mechanics/${m.id}`, {
           method: "PATCH",
           body: JSON.stringify({ isActive: true }),
         });
       }
       await mutate();
+    } catch (e) {
+      toast.error(e instanceof Error ? e.message : "Failed to update mechanic");
+    }
   }
```

- [ ] **3.8 Time-off page — await + catch `deleteOverride`**

`app/(mechanic)/mechanic/time-off/page.tsx`:

```diff
                   <Button
                     variant="ghost"
                     size="sm"
-                    onClick={() => deleteOverride(o.id)}
+                    onClick={async () => {
+                      try {
+                        await deleteOverride(o.id);
+                      } catch (e) {
+                        toast.error(e instanceof Error ? e.message : "Failed to delete override");
+                      }
+                    }}
                     className="text-muted-foreground hover:text-red-500"
                   >
```

- [ ] **3.9 Verify**

Manual click-through:
1. Profile: clear phone field → save → verify phone is now null on the server (network tab).
2. Mechanics: deactivate (force a 5xx via DevTools → throttle to "Offline") → toast appears; UI doesn't get stuck.
3. Cancel a booking → ReasonDialog opens → submit empty → still cancels (reason optional).
4. Clear chat → ConfirmDialog → cancel → chat preserved.
5. All 7 alert sites: trigger their failure path (offline) → toast shows.

- [ ] **3.10 Commit**

```bash
git commit -m "fix(web): replace alert/prompt with toast + dialogs, surface silent errors"
```

---

## PR 4 — SSR / hydration / safety

**Issues fixed:** #21 (lib/format timezone), #22 (BookingWidget today UTC), #23 (Suspense around useSearchParams), #15/#20 (chat proxy abort signal).

**Depends on D1 sign-off.**

### Files

- Create: `apps/hmls-web/components/ui/DateTime.tsx`
- Modify: `apps/hmls-web/lib/format.ts` (no behavior change, just leave; new component used at call sites)
- Modify: ~25 date call sites — see grep output (`formatDate(`, `formatDateTime(`, `formatTime(`)
- Modify: `apps/hmls-web/components/BookingWidget.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/customers/page.tsx`
- Modify: `apps/hmls-web/app/api/chat/route.ts`
- Modify: `apps/hmls-web/app/api/staff-chat/route.ts`

### Tasks

- [ ] **4.1 Build `DateTime` component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

const FORMATTERS = {
  date: formatDate,
  datetime: formatDateTime,
  time: formatTime,
} as const;

interface Props {
  value: string | null | undefined;
  format?: keyof typeof FORMATTERS;
  fallback?: string;
}

/** Renders a localized date/time string only on the client to avoid SSR
 * hydration mismatch (server runs in UTC, browser runs in user's TZ).
 * Until hydration, renders `fallback` (default: empty string). */
export function DateTime({ value, format = "datetime", fallback = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!value) return <>{fallback}</>;
  if (!mounted) {
    return <time dateTime={value} suppressHydrationWarning>{fallback}</time>;
  }
  return <time dateTime={value}>{FORMATTERS[format](value)}</time>;
}
```

- [ ] **4.2 Replace date call sites**

For each grep hit, swap:
```diff
-{formatDateTime(order.createdAt)}
+<DateTime value={order.createdAt} format="datetime" />
```

Sites are listed in the bug-scan grep output (~25). Don't replace usages inside `formatDate(...)` chained into other strings (e.g. tooltip titles, alert messages) — those don't render to DOM and are safe. Only swap when the result is a child of a JSX node.

Edge case: `app/(portal)/portal/orders/[id]/page.tsx` `PrintReceipt` renders dates inside `print:` only. Hydration warning still fires on initial paint. Wrap in DateTime anyway.

- [ ] **4.3 BookingWidget — local-TZ today**

`components/BookingWidget.tsx`:

```diff
-  const today = new Date().toISOString().split("T")[0];
-  const maxDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
+  // Use local TZ for the date picker min/max; ISO splitting picks UTC and
+  // disables "today" for users west of UTC during evening hours.
+  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
+  const today = fmt(new Date());
+  const maxDate = fmt(new Date(Date.now() + 14 * 86400000));
```

This BookingWidget appears in the marketing page (server render). It now uses `Date` constructor on render, but the values feed into `<input min/max>` attributes which don't trigger hydration mismatch (browsers compute their own "today" against `min`).

- [ ] **4.4 Suspense around `useSearchParams` in customers page**

`app/(admin)/admin/customers/page.tsx`:

```diff
+import { Suspense } from "react";
...
-export default function CustomersPage() {
+function CustomersPageInner() {
   ...
 }
+
+export default function CustomersPage() {
+  return (
+    <Suspense fallback={<CustomerListSkeleton />}>
+      <CustomersPageInner />
+    </Suspense>
+  );
+}
```

- [ ] **4.5 Chat proxy — forward abort signal + harden headers**

`app/api/chat/route.ts` and `app/api/staff-chat/route.ts`:

```diff
     const upstream = await fetch(`${GATEWAY_URL}/api/chat`, {
       method: "POST",
       headers,
       body: JSON.stringify(json),
+      signal: req.signal,
     });
```

- [ ] **4.6 Verify**

```bash
bun run typecheck && bun run lint && bun run build
```

Manual:
1. Open admin dashboard in DevTools console with React strict mode → no hydration mismatch warnings.
2. BookingWidget: open at 11 PM PST → "today" is selectable as min.
3. Customers page: build succeeds with no `useSearchParams` deopt warning.
4. Open chat → start a stream → close tab → check Deno gateway logs that the upstream was aborted (no continued token generation).

- [ ] **4.7 Commit**

```bash
git commit -m "fix(web): SSR-safe date rendering, abort propagation, Suspense boundaries"
```

---

## PR 5 — Performance polish + cleanup

**Issues fixed:** #5 (chat filter memo), #25 (mechanic detail filter Date drift), #11 (ScheduleStrip Date dep), #10 (SetTimeDialog mount + memo), #7 (customer search debounce), #8 (useAgentChat endpoint stability), #12 (About observer cleanup), #27 (delete Markdown.tsx), #28 (MessageBranchContent), #30 (AddTimeOffDialog reset), #32 (MobileNav functional setter).

### Files

- Modify: `apps/hmls-web/app/(marketing)/chat/page.tsx`, `app/(admin)/admin/chat/page.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/mechanics/[id]/page.tsx`
- Modify: `apps/hmls-web/components/admin/mechanics/ScheduleStrip.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/orders/[id]/page.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/customers/page.tsx`
- Modify: `apps/hmls-web/hooks/useAgentChat.ts`
- Modify: `apps/hmls-web/components/sections/About.tsx`
- Delete: `apps/hmls-web/components/ui/Markdown.tsx`
- Modify: `apps/hmls-web/components/ai-elements/message.tsx`
- Modify: `apps/hmls-web/components/admin/mechanics/AddTimeOffDialog.tsx`
- Modify: `apps/hmls-web/components/MobileNav.tsx`

### Tasks

- [ ] **5.1 Chat filter + nextUserAnswer map memo**

In both chat pages, replace the inline filter + slice/find with:

```diff
-  const renderable = uiMessages.filter((msg) => { ... });
+  const renderable = useMemo(
+    () => uiMessages.filter((msg) => {
+      if (msg.role !== "user" && msg.role !== "assistant") return false;
+      return msg.parts.some(
+        (p) => (p.type === "text" && p.text.trim().length > 0) ||
+               isToolOrDynamicToolUIPart(p),
+      );
+    }),
+    [uiMessages],
+  );
+  const nextUserAnswerByAssistantId = useMemo(() => {
+    const map = new Map<string, string>();
+    let pendingAssistantIds: string[] = [];
+    for (const msg of renderable) {
+      if (msg.role === "assistant") pendingAssistantIds.push(msg.id);
+      else if (msg.role === "user") {
+        const text = msg.parts.find((p): p is { type: "text"; text: string } => p.type === "text")?.text;
+        if (text) for (const id of pendingAssistantIds) map.set(id, text);
+        pendingAssistantIds = [];
+      }
+    }
+    return map;
+  }, [renderable]);
```

In the `.map`:
```diff
-              const nextUserMsg = msg.role === "assistant" ? renderable.slice(idx + 1).find(...) : undefined;
-              const nextUserAnswer = nextUserMsg?.parts.find(...)?.text;
+              const nextUserAnswer = msg.role === "assistant"
+                ? nextUserAnswerByAssistantId.get(msg.id)
+                : undefined;
```

- [ ] **5.2 Mechanic detail — hoist `Date.now()` cutoff**

`app/(admin)/admin/mechanics/[id]/page.tsx`:

```diff
-  const upcoming = mechanicOrders.filter(
-    (b) => b.scheduledAt && new Date(b.scheduledAt) >= new Date(),
-  );
+  const now = useMemo(() => Date.now(), [mechanicOrders]);
+  const upcoming = mechanicOrders.filter(
+    (b) => b.scheduledAt && new Date(b.scheduledAt).getTime() >= now,
+  );
```

- [ ] **5.3 ScheduleStrip — Date dep by `getTime()`**

`components/admin/mechanics/ScheduleStrip.tsx`:

```diff
-  const days = useMemo(() => {
+  const startMs = startDate?.getTime();
+  const days = useMemo(() => {
     const start = startDate ? new Date(startDate) : new Date();
     start.setHours(0, 0, 0, 0);
     return Array.from({ length: 7 }, (_, i) => { ... });
-  }, [startDate]);
+  }, [startMs]);
```

- [ ] **5.4 SetTimeDialog — conditional mount + memo `suggestedDurationMinutes`**

`app/(admin)/admin/orders/[id]/page.tsx`:

```diff
+  const suggestedDurationMinutes = useMemo(
+    () => Math.max(60, Math.round(
+      order.items.filter((it) => it.category === "labor")
+        .reduce((sum, it) => sum + (it.laborHours ?? 0) * 60, 0),
+    ) || 60),
+    [order.items],
+  );
   ...
-      <SetTimeDialog
-        open={setTimeOpen}
-        onOpenChange={setSetTimeOpen}
-        ...
-        suggestedDurationMinutes={Math.max(60, Math.round(order.items.filter(...).reduce(...)) || 60)}
-        ...
-      />
+      {setTimeOpen && (
+        <SetTimeDialog
+          open
+          onOpenChange={setSetTimeOpen}
+          ...
+          suggestedDurationMinutes={suggestedDurationMinutes}
+          ...
+        />
+      )}
```

- [ ] **5.5 Customer search debounce**

`app/(admin)/admin/customers/page.tsx`:

```diff
-  const [search, setSearch] = useState("");
-  const { customers, isLoading, mutate: mutateList } = useAdminCustomers(search || undefined);
+  const [search, setSearch] = useState("");
+  const deferredSearch = useDeferredValue(search);
+  const { customers, isLoading, mutate: mutateList } = useAdminCustomers(deferredSearch || undefined);
```

`useDeferredValue` from React 19 provides built-in batching without explicit debounce timing.

- [ ] **5.6 useAgentChat — keep transport endpoint in sync**

`hooks/useAgentChat.ts`:

```diff
+  const endpointRef = useRef(endpoint);
+  endpointRef.current = endpoint;
   ...
   if (!transportRef.current) {
     transportRef.current = new DefaultChatTransport<UIMessage>({
-      api: endpoint,
+      api: () => endpointRef.current,
       headers: () => headersRef.current,
     });
   }
```

(Verify `DefaultChatTransport` `api` accepts a function in `ai` v6 — fall back to recreating transport on endpoint change if not.)

- [ ] **5.7 About — clean up observer**

`components/sections/About.tsx`:

```diff
   useEffect(() => {
+    const observers: IntersectionObserver[] = [];
     ...
     for (const el of [imageRef.current, textRef.current]) {
       ...
-      const observer = new IntersectionObserver(...);
+      const observer = new IntersectionObserver(...);
+      observers.push(observer);
       observer.observe(el);
     }
+    return () => { for (const o of observers) o.disconnect(); };
   }, []);
```

- [ ] **5.8 Delete Markdown.tsx**

```bash
git rm apps/hmls-web/components/ui/Markdown.tsx
```

Verify nothing imports it (grep).

- [ ] **5.9 MessageBranchContent content-aware effect**

`components/ai-elements/message.tsx`:

```diff
   useEffect(() => {
-    if (branches.length !== childrenArray.length) {
-      setBranches(childrenArray);
-    }
+    setBranches(childrenArray);
   }, [childrenArray, setBranches]);
```

(`branches` removed from deps; SetState short-circuits when value unchanged.)

- [ ] **5.10 AddTimeOffDialog — reset on open**

```diff
+  useEffect(() => {
+    if (!open) return;
+    setDate("");
+    setIsAvailable(false);
+    setStartTime("");
+    setEndTime("");
+    setReason("");
+    setError(null);
+  }, [open]);
```

- [ ] **5.11 MobileNav — functional setter**

`components/MobileNav.tsx`:

```diff
-        onClick={() => setIsOpen(!isOpen)}
+        onClick={() => setIsOpen((prev) => !prev)}
```

- [ ] **5.12 Verify**

```bash
bun run typecheck && bun run lint && bun run build
```

Manual:
1. Long chat (50+ messages) — typing in input remains responsive during streaming.
2. Customer search — type fast, no per-keystroke server hit (Network tab batches).
3. SetTimeDialog opens fresh each time.
4. Add Time Off dialog: cancel mid-fill, reopen → fields are blank.

- [ ] **5.13 Commit**

```bash
git commit -m "perf(web): chat memoization, search defer, lazy dialog mount, dead code"
```

---

## Verification matrix (all PRs combined, run before merging PR 5)

| Surface | What to test | Confirms |
|---------|--------------|----------|
| Login + redirect | Email login as customer, admin, mechanic | PR 1 (#4, #9, #31) |
| Customer chat (long) | 50+ message conversation | PR 1 + PR 5 (#5) |
| Mechanic availability | Edit + tab away + come back | PR 2 (#1) |
| Admin EditHours dialog | Same as above inside dialog | PR 2 (#2) |
| Customer search + delete | Search → delete → list refresh | PR 2 (#3) |
| Profile clear field | Set phone empty → save → verify null persisted | PR 3 (#14) + D3 |
| Cancel booking | Customer portal cancellation | PR 3 (prompt → ReasonDialog) |
| Clear chat | Both surfaces | PR 3 (confirm → ConfirmDialog) |
| Toggle mechanic offline | DevTools throttle → trigger 5xx | PR 3 (#17) |
| Date rendering | Inspect network UTC vs local | PR 4 (#21) |
| Booking widget at midnight | Rotate user TZ to UTC+12 | PR 4 (#22) |
| Customers Suspense | Build passes, page works | PR 4 (#23) |
| Chat abort | Network tab → close mid-stream | PR 4 (#15) |
| SetTimeDialog reopen | Open → cancel → reopen | PR 5 (#10) |

---

## Risks

- **AuthProvider memoization** — if any consumer was incorrectly relying on identity changes, behavior changes. Audit search:
  ```bash
  grep -rn "useAuth()" apps/hmls-web --include="*.tsx" | wc -l
  ```
  ~12 callers. Each just destructures fields — safe.

- **`setSlots` during render in PR 2.1** — React 18+ pattern, valid but unusual. Alternative is `useEffect([isLoading])` to capture first non-loading render. Pick whichever the team finds cleaner; behavior identical.

- **DateTime hydration delay** — first paint shows empty for any visible date. Skeletons hide most cases, but title-row "Created Apr 28" and similar will flash. Acceptable tradeoff vs hydration warnings; if not, switch to D1.B (`suppressHydrationWarning`).

- **`useDeferredValue` in PR 5.5** — new in React 19; verify the build tooling pipes through. If not, fall back to a `useDebouncedValue(search, 250)` hook.

- **Worktree state at PR boundaries** — each PR is independently revertible. Land in order; don't squash across PRs.

---

## What's NOT in this plan (deferred backlog)

- Mechanic detail page re-fetching whole mechanics list for KPIs (#21 from scan 1) — needs gateway change to expose KPIs on `/api/admin/mechanics/:id`.
- `/admin/orders` "More" filter dropdown click-outside handler — separate UX feature.
- `PageEnter` route-change remount — intentional for animation.
- Per-card `loading={loading}` prop pattern — works correctly, marginal gain.
- BAR § 3353 compliance flow — pre-existing product backlog, unrelated.
- `lib/fetcher.ts` calling `getSession()` per request — could cache, but Supabase SDK already memoizes; verify before changing.
