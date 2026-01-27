// apps/api/src/prompts/types.ts

export type AgentType = "receptionist" | "diagnostic";

export interface UserContext {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface ToolInfo {
  name: string;
  description: string;
}

export interface PromptConfig {
  agentType: AgentType;
  userContext?: UserContext;
  tools?: ToolInfo[];
  locale?: string;
}

export type PromptSection = (config: PromptConfig) => string[];
