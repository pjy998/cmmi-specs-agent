/**
 * Model Scheduler Types
 * 模型调度器类型定义
 */

export type AIModel = 'gpt-4.1' | 'claude-sonnet-4';

export type AgentRole = 
  | 'requirements-agent'
  | 'design-agent' 
  | 'coding-agent'
  | 'test-agent'
  | 'tasks-agent'
  | 'spec-agent';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export interface AgentModelMapping {
  [key: string]: AIModel;
}

export interface ModelInvokeOptions {
  timeout?: number;
  complexity?: TaskComplexity;
  domain?: 'technical' | 'business' | 'general';
  preserveFormatting?: boolean;
  retryAttempts?: number;
}

export interface ModelResponse {
  content: string;
  model: AIModel;
  metadata?: {
    responseTime: number;
    tokenCount?: number;
    complexity: TaskComplexity;
  };
}

export interface TaskComplexityAnalysis {
  complexity: TaskComplexity;
  factors: {
    contentLength: number;
    technicalTermCount: number;
    structureComplexity: number;
    languageComplexity: number;
  };
  recommendedTimeout: number;
  recommendedModel?: AIModel;
}

export interface CopilotChatClientConfig {
  timeout: number;
  retryPolicy: 'none' | 'linear' | 'exponential';
  maxRetries: number;
  baseDelay: number;
}

export interface CopilotChatRequest {
  model: AIModel;
  prompt: string;
  options: ModelInvokeOptions;
}

export interface ModelSchedulerConfig {
  defaultTimeout: number;
  agentModelMap: AgentModelMapping;
  complexityTimeoutMultipliers: {
    simple: number;
    medium: number;
    complex: number;
  };
  copilotChatConfig: CopilotChatClientConfig;
}
