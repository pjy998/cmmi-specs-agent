/**
 * Multi-Agent Workflow Executor Types
 * 多代理工作流执行器类型定义
 */

import { AgentRole } from './model-scheduler.js';
import { TaskPriority } from './agent-manager.js';

export type WorkflowExecutionMode = 
  | 'sequential'   // 串行执行
  | 'parallel'     // 并行执行
  | 'smart';       // 智能调度

export type WorkflowStepStatus = 
  | 'pending'      // 等待执行
  | 'running'      // 执行中
  | 'completed'    // 已完成
  | 'failed'       // 执行失败
  | 'skipped'      // 已跳过
  | 'cancelled';   // 已取消

export type DependencyType = 
  | 'blocks'       // 阻塞依赖 - 必须等待依赖完成
  | 'data'         // 数据依赖 - 需要依赖的输出数据
  | 'optional';    // 可选依赖 - 依赖失败不影响执行

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentRole: AgentRole;
  prompt: string;
  priority: TaskPriority;
  estimatedDuration: number;
  timeout?: number;
  dependencies: WorkflowDependency[];
  outputs: string[];           // 输出变量名
  context?: Record<string, any>;
  retryPolicy?: RetryPolicy;
  successCriteria?: string[];  // 成功标准
  failureHandling?: FailureHandling;
}

export interface WorkflowDependency {
  stepId: string;
  type: DependencyType;
  dataMapping?: DataMapping;   // 数据映射规则
  condition?: string;          // 依赖条件表达式
}

export interface DataMapping {
  sourceField: string;         // 源步骤的输出字段
  targetField: string;         // 目标步骤的输入字段
  transform?: string;          // 数据转换函数
}

export interface RetryPolicy {
  enabled: boolean;
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryConditions: string[];   // 重试条件
}

export interface FailureHandling {
  onFailure: 'abort' | 'continue' | 'retry' | 'skip';
  fallbackStep?: string;       // 失败时的回退步骤
  errorOutput?: string;        // 错误输出变量
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  executionMode: WorkflowExecutionMode;
  steps: WorkflowStep[];
  globalContext: Record<string, any>;
  timeout: number;
  maxConcurrentSteps?: number;
  enableContextSharing: boolean;
  errorHandling: WorkflowErrorHandling;
  metadata?: Record<string, any>;
}

export interface WorkflowErrorHandling {
  onStepFailure: 'abort' | 'continue' | 'retry';
  maxGlobalRetries: number;
  errorNotification: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  executionMode: WorkflowExecutionMode;
  steps: WorkflowStepExecution[];
  globalContext: Record<string, any>;
  results: Record<string, any>;
  errors: WorkflowError[];
  metrics: WorkflowMetrics;
}

export interface WorkflowStepExecution {
  stepId: string;
  agentId?: string;
  status: WorkflowStepStatus;
  startTime?: Date;
  endTime?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  retryCount: number;
  duration?: number;
  logs: string[];
}

export interface WorkflowError {
  stepId: string;
  timestamp: Date;
  error: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  recovered: boolean;
}

export interface WorkflowMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalDuration: number;
  averageStepDuration: number;
  parallelEfficiency: number;  // 并行执行效率
  resourceUtilization: number; // 资源利用率
  successRate: number;
}

export interface WorkflowExecutorConfig {
  maxConcurrentWorkflows: number;
  defaultTimeout: number;
  enableDetailedLogging: boolean;
  contextSharingEnabled: boolean;
  retryEnabled: boolean;
  errorRecoveryEnabled: boolean;
  metricsCollectionEnabled: boolean;
  performanceOptimization: PerformanceConfig;
}

export interface PerformanceConfig {
  enableCaching: boolean;
  cacheTimeout: number;
  enablePipelining: boolean;
  batchSize: number;
  loadBalancing: boolean;
  resourcePoolSize: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'testing' | 'deployment' | 'analysis' | 'custom';
  steps: WorkflowStepTemplate[];
  parameters: WorkflowParameter[];
  defaultValues: Record<string, any>;
  tags: string[];
}

export interface WorkflowStepTemplate {
  name: string;
  agentRole: AgentRole;
  promptTemplate: string;      // 支持模板变量的提示
  dependencies: string[];      // 依赖的步骤名称
  optional: boolean;
  configuration: Record<string, any>;
}

export interface WorkflowParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: string;         // 验证规则
}

export interface ContextValue {
  value: any;
  type: string;
  timestamp: Date;
  sourceStep: string;
  metadata?: Record<string, any>;
}

export interface WorkflowContext {
  values: Record<string, ContextValue>;
  shared: boolean;
  isolated: Record<string, Record<string, any>>; // 步骤隔离的上下文
}

export interface ExecutionPlan {
  workflowId: string;
  executionMode: WorkflowExecutionMode;
  phases: ExecutionPhase[];
  estimatedDuration: number;
  resourceRequirements: ResourceRequirement[];
  riskAssessment: RiskAssessment;
}

export interface ExecutionPhase {
  id: string;
  name: string;
  steps: string[];             // 该阶段包含的步骤ID
  parallelizable: boolean;
  estimatedDuration: number;
  dependencies: string[];      // 依赖的阶段ID
}

export interface ResourceRequirement {
  agentRole: AgentRole;
  instanceCount: number;
  estimatedUsage: number;      // 预估使用时间（毫秒）
  priority: TaskPriority;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  contingencyPlan?: string;
}

export interface RiskFactor {
  type: 'dependency' | 'resource' | 'timeout' | 'complexity';
  severity: 'low' | 'medium' | 'high';
  description: string;
  probability: number;         // 0-1
  impact: number;              // 0-1
}

export interface WorkflowRegistry {
  workflows: Map<string, WorkflowDefinition>;
  templates: Map<string, WorkflowTemplate>;
  executions: Map<string, WorkflowExecution>;
  activeExecutions: Set<string>;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
