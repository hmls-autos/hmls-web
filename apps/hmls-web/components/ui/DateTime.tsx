"use client";

import { useEffect, useState } from "react";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

const FORMATTERS = {
  date: formatDate,
  datetime: formatDateTime,
  time: formatTime,
} as const;

type Format = keyof typeof FORMATTERS;

interface Props {
  value: string | null | undefined;
  format?: Format;
  fallback?: string;
}

/** Renders a localized date/time string only on the client to avoid SSR
 * hydration mismatch (server runs in UTC, browser runs in user's TZ).
 * Until hydration, renders the `fallback` (default: empty string). */
export function DateTime({ value, format = "datetime", fallback = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!value) return <>{fallback}</>;
  if (!mounted) {
    return (
      <time dateTime={value} suppressHydrationWarning>
        {fallback}
      </time>
    );
  }
  return <time dateTime={value}>{FORMATTERS[format](value)}</time>;
}
