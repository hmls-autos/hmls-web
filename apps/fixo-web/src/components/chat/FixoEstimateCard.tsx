"use client";

import { Check, ClipboardCopy, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FixoEstimateData } from "@/hooks/useAgentChat";

interface FixoEstimateCardProps {
  data: FixoEstimateData;
}

export function FixoEstimateCard({ data }: FixoEstimateCardProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = data.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/estimate/${data.shareToken}`
    : null;

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently ignore clipboard errors
    }
  };

  return (
    <Card className="w-full overflow-hidden border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
            <FileText
              className="h-3.5 w-3.5 text-foreground"
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Estimate
              {data.estimateId ? (
                <span className="ml-1 font-mono text-xs tabular-nums text-muted-foreground">
                  #{data.estimateId}
                </span>
              ) : null}
            </CardTitle>
            <p className="truncate text-xs text-muted-foreground">
              {data.vehicle}
            </p>
          </div>
          {data.note && (
            <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400">
              Not saved
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5 py-3">
        {data.items.map((item, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable id
            key={i}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{item.name}</span>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
            <span className="shrink-0 font-mono font-medium tabular-nums">
              ${(item.unitPrice * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2.5 border-t border-border bg-muted/40">
        <div className="flex justify-between pt-1 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono font-semibold tabular-nums">
            ${data.subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated range</span>
          <span className="self-center font-mono text-base font-semibold leading-none tabular-nums text-accent">
            {data.priceRange}
          </span>
        </div>
        {data.expiresAt && (
          <p className="text-xs text-muted-foreground">
            Valid until{" "}
            <span className="tabular-nums">
              {new Date(data.expiresAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        )}
        {shareUrl && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-full border-border bg-card hover:bg-muted"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <ClipboardCopy className="h-3.5 w-3.5" />
                Share estimate
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
