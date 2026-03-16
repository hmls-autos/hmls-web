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
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold">
              Estimate{data.estimateId ? ` #${data.estimateId}` : ""}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              {data.vehicle}
            </p>
          </div>
          {data.note && (
            <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
              Not saved
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-3 space-y-1.5">
        {data.items.map((item, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable id
            key={i}
            className="flex justify-between items-start gap-3 text-sm"
          >
            <div className="flex-1 min-w-0">
              <span className="text-foreground font-medium">{item.name}</span>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              )}
            </div>
            <span className="font-medium tabular-nums shrink-0">
              ${(item.unitPrice * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3 border-t">
        <div className="flex justify-between text-sm pt-1">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold tabular-nums">
            ${data.subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated range</span>
          <span className="font-bold text-primary text-base leading-none self-center">
            {data.priceRange}
          </span>
        </div>
        {data.expiresAt && (
          <p className="text-xs text-muted-foreground">
            Valid until{" "}
            {new Date(data.expiresAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
        {shareUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardCopy className="h-3.5 w-3.5" />
                Share Estimate
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
