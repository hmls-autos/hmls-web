export { toolResult } from "./lib/tool-result.ts";
export { AppError, ErrorCode, Errors } from "./lib/errors.ts";
export { createDbClient } from "./db/client.ts";

// Schema and derived types
export * as schema from "./db/schema.ts";
export type {
  Customer,
  CustomerInsert,
  Order,
  OrderDetail,
  OrderEvent,
  OrderInsert,
  OrderItem,
  PricingConfig,
  Provider,
  ProviderAvailability,
  ProviderInsert,
  ProviderScheduleOverride,
  Shop,
  VehicleInfo,
} from "./db/types.ts";

// Order state machine
export type {
  Actor,
  ActorKind,
  OrderMainStep,
  OrderStatus,
  OrderStepState,
  TerminalStatus,
} from "./order/status.ts";
export {
  ACTOR_PERMISSIONS,
  EDITABLE_STATUSES,
  ORDER_BRANCH_STATUSES,
  ORDER_MAIN_STEPS,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_ALLOWED_STATUSES,
  TRANSITIONS,
  _checkTransitionActorCoverage,
  actorString,
  allowedTransitions,
  availableActions,
  canActorTransition,
  getOrderStepState,
  isOrderStatus,
  isTerminal,
  resolveAuthority,
} from "./order/status.ts";
