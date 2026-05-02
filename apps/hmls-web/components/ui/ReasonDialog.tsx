"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Resolver = (reason: string | null) => void;

interface State {
  open: boolean;
  title: string;
  description: string;
  pending: Resolver | null;
}

let setStateExternal: ((s: State) => void) | null = null;
let currentState: State = {
  open: false,
  title: "",
  description: "",
  pending: null,
};

/** Promise-based replacement for `prompt()`. Returns the entered text, or
 * `null` if the user cancelled. Caller must render `<ReasonDialog />` once
 * (mounted in root layout). Falls back to native `prompt()` if the dialog
 * isn't mounted (e.g. during SSR or test environments). */
export function askReason(opts: {
  title: string;
  description?: string;
}): Promise<string | null> {
  if (!setStateExternal) {
    return Promise.resolve(globalThis.prompt?.(opts.title) ?? null);
  }
  return new Promise<string | null>((resolve) => {
    currentState.pending?.(null);
    currentState = {
      open: true,
      title: opts.title,
      description: opts.description ?? "",
      pending: resolve,
    };
    setStateExternal?.(currentState);
  });
}

export function ReasonDialog() {
  const [state, setState] = useState<State>(currentState);
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setStateExternal = (s) => {
      currentState = s;
      setState(s);
    };
    return () => {
      setStateExternal = null;
    };
  }, []);

  useEffect(() => {
    if (state.open) {
      setValue("");
      const t = setTimeout(() => ref.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [state.open]);

  const close = (reason: string | null) => {
    state.pending?.(reason);
    currentState = { ...currentState, open: false, pending: null };
    setState(currentState);
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && close(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          {state.description && (
            <DialogDescription>{state.description}</DialogDescription>
          )}
        </DialogHeader>
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder="Optional details…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => close(null)}>
            Cancel
          </Button>
          <Button onClick={() => close(value)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
