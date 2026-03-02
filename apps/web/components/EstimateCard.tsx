"use client";

import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { useState } from "react";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

export interface EstimateCardData {
  success: boolean;
  estimateId?: number;
  vehicle: string;
  items: Array<{ name: string; description?: string; price: number }>;
  subtotal: number;
  priceRange: string;
  expiresAt?: string;
  shareUrl?: string;
  downloadUrl?: string;
  note?: string;
}

interface EstimateCardProps {
  data: EstimateCardData;
}

export function EstimateCard({ data }: EstimateCardProps) {
  const [showPdf, setShowPdf] = useState(false);

  const pdfUrl = data.shareUrl ? `${AGENT_URL}${data.shareUrl}` : null;
  const downloadLink = data.downloadUrl
    ? `${AGENT_URL}${data.downloadUrl}`
    : pdfUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-red-200 bg-red-50/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-red-100">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-primary text-white text-xs">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-red-900 text-sm">
          Estimate {data.estimateId ? `#${data.estimateId}` : ""}
        </span>
        <span className="text-xs text-red-700/70 ml-1">{data.vehicle}</span>
        {data.note && (
          <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Not saved
          </span>
        )}
      </div>

      {/* Line items */}
      <div className="px-4 py-3 space-y-1.5">
        {data.items.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex justify-between text-sm"
          >
            <div className="flex-1 min-w-0">
              <span className="text-red-900">{item.name}</span>
              {item.description && (
                <span className="text-red-700/60 text-xs ml-1 truncate">
                  — {item.description}
                </span>
              )}
            </div>
            <span className="font-medium text-red-900 ml-3 tabular-nums">
              ${item.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 border-t border-red-100 bg-red-50/80">
        <div className="flex justify-between text-sm">
          <span className="text-red-700">Subtotal</span>
          <span className="font-semibold text-red-900 tabular-nums">
            ${data.subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-red-700">Estimated Range</span>
          <span className="font-semibold text-red-900">{data.priceRange}</span>
        </div>
        {data.expiresAt && (
          <p className="text-xs text-red-600/60 mt-2">
            Valid until{" "}
            {new Date(data.expiresAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Actions */}
      {pdfUrl && (
        <div className="px-4 py-2.5 border-t border-red-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPdf(!showPdf)}
            className="text-xs font-medium text-red-primary hover:text-red-dark transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            {showPdf ? "Hide PDF" : "View PDF"}
          </button>
          {downloadLink && (
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-red-primary hover:text-red-dark transition-colors flex items-center gap-1 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
        </div>
      )}

      {/* Embedded PDF */}
      {showPdf && pdfUrl && (
        <div className="border-t border-red-100">
          <iframe
            src={pdfUrl}
            title={`Estimate ${data.estimateId || ""} PDF`}
            className="w-full h-[500px] bg-white"
          />
        </div>
      )}
    </motion.div>
  );
}
