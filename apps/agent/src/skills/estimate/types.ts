// apps/agent/src/skills/estimate/types.ts

export interface ServiceInput {
  serviceId?: number;
  name: string;
  description: string;
  laborHours?: number;
  partsCost?: number;
}

export interface LineItem {
  name: string;
  description: string;
  price: number; // in cents
}

export interface PricingConfig {
  hourlyRate: number;
  diagnosticFee: number;
  afterHoursFee: number;
  rushFee: number;
  partsMarkupTier1: number;
  partsMarkupTier2: number;
  partsMarkupTier3: number;
}

export interface EstimateResult {
  success: boolean;
  estimateId: number;
  downloadUrl: string;
  shareUrl: string;
  subtotal: number;
  priceRange: string;
  expiresAt: Date;
}
