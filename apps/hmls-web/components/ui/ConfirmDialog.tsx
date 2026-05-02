"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Resolver = (confirmed: boolean) => void;

interface State {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
  pending: Resolver | null;
}

let setStateExternal: ((s: State) => void) | null = null;
let currentState: State = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  destructive: false,
  pending: null,
};

/** Promise-based replacement for `window.confirm()`. Returns `true` on
 * confirm, `false` on cancel/dismiss. Caller must render `<ConfirmDialog />`
 * once (mounted in root layout). Falls back to native `confirm()` if the
 * dialog isn't mounted. */
export function askConfirm(opts: {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (!setStateExternal) {
    return Promise.resolve(globalThis.confirm?.(opts.title) ?? false);
  }
  return new Promise<boolean>((resolve) => {
    currentState.pending?.(false);
    currentState = {
      open: true,
      title: opts.title,
      description: opts.description ?? "",
      confirmLabel: opts.confirmLabel ?? "Confirm",
      destructive: opts.destructive ?? false,
      pending: resolve,
    };
    setStateExternal?.(currentState);
  });
}

export function ConfirmDialog() {
  const [state, setState] = useState<State>(currentState);

  useEffect(() => {
    setStateExternal = (s) => {
      currentState = s;
      setState(s);
    };
    return () => {
      setStateExternal = null;
    };
  }, []);

  const close = (confirmed: boolean) => {
    state.pending?.(confirmed);
    currentState = { ...currentState, open: false, pending: null };
    setState(currentState);
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && close(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          {state.description && (
            <DialogDescription>{state.description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={state.destructive ? "destructive" : "default"}
            onClick={() => close(true)}
          >
            {state.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
