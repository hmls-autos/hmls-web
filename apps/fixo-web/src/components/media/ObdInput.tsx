"use client";

import { Plus, Send, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ObdInputProps {
  onSubmit: (codes: string[]) => void;
  onClose: () => void;
}

const OBD_PATTERN = /^[PBCU]\d{4}$/i;

export function ObdInput({ onSubmit, onClose }: ObdInputProps) {
  const [codes, setCodes] = useState<string[]>([""]);
  const [errors, setErrors] = useState<(string | null)[]>([null]);

  const updateCode = (index: number, value: string) => {
    const upper = value
      .toUpperCase()
      .replace(/[^PBCU0-9]/g, "")
      .slice(0, 5);
    const newCodes = [...codes];
    newCodes[index] = upper;
    setCodes(newCodes);

    const newErrors = [...errors];
    if (upper.length === 5 && !OBD_PATTERN.test(upper)) {
      newErrors[index] = "Invalid format (e.g. P0171)";
    } else {
      newErrors[index] = null;
    }
    setErrors(newErrors);
  };

  const addCode = () => {
    setCodes([...codes, ""]);
    setErrors([...errors, null]);
  };

  const removeCode = (index: number) => {
    if (codes.length <= 1) return;
    setCodes(codes.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validCodes = codes.filter((c) => OBD_PATTERN.test(c));
    if (validCodes.length === 0) return;
    onSubmit(validCodes);
    onClose();
  };

  const hasValidCodes = codes.some((c) => OBD_PATTERN.test(c));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight">
          Enter OBD codes
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 text-[13px] text-muted-foreground">
        Enter diagnostic trouble codes (e.g.{" "}
        <code className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[11px]">
          P0171
        </code>
        ,{" "}
        <code className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[11px]">
          B0001
        </code>
        ,{" "}
        <code className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[11px]">
          U0100
        </code>
        )
      </p>

      <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
        {codes.map((code, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: dynamic list of code inputs
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => updateCode(i, e.target.value)}
              placeholder="P0171"
              maxLength={5}
              className="flex-1 rounded-md border border-border bg-card px-3 py-2 font-mono text-sm uppercase tracking-wide text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              // biome-ignore lint/a11y/noAutofocus: focus newest input for UX
              autoFocus={i === codes.length - 1}
            />
            {codes.length > 1 && (
              <button
                type="button"
                onClick={() => removeCode(i)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 dark:hover:text-red-500"
                aria-label="Remove code"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.some((e) => e) && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-500">
          {errors.find((e) => e)}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addCode}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add code
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasValidCodes}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <Send className="h-3.5 w-3.5" />
          Analyze {codes.filter((c) => OBD_PATTERN.test(c)).length || ""} code
          {codes.filter((c) => OBD_PATTERN.test(c)).length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
