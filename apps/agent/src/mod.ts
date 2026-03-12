// Agent factories
export { type AgentConfig, type CreateAgentOptions, createHmlsAgent } from "./hmls/agent.ts";
export { createDiagnosticAgent, type CreateDiagnosticAgentOptions } from "./fixo/agent.ts";

// Types
export { formatUserContext, type UserContext } from "./types/user-context.ts";

// Diagnostic business logic (used by gateway middleware/routes)
export {
  addCredits,
  calculateAudioCredits,
  calculateVideoCredits,
  createCheckoutSession,
  createPortalSession,
  CREDIT_COSTS,
  deductCredits,
  getCustomerCredits,
  getStripeCustomerIdForUser,
  handleSubscriptionWebhook,
  type InputType,
  stripe,
} from "./fixo/lib/stripe.ts";
export {
  deleteMedia,
  getMedia,
  getMediaUrl,
  uploadMedia,
  type UploadResult,
} from "./fixo/lib/storage.ts";
export { getAgent } from "./fixo/lib/agent-cache.ts";

// Notifications
export { notifyOrderStatusChange } from "./lib/notifications.ts";

// PDF components (for gateway rendering)
export { EstimatePdf } from "./hmls/pdf/EstimatePdf.tsx";
export { DiagnosticReportPdf } from "./fixo/pdf/fixo-report.tsx";
