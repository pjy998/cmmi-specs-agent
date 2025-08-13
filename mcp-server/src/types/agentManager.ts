/**
 * CMMI Agent Manager Types
 * CMMI代理管理系统类型定义
 */

import { AgentRole, AIModel } from './modelScheduler.js';

export type AgentStatus = 
  | 'idle'          // 空闲
  | 'busy'          // 忙碌
  | 'error'         // 错误
  | 'offline'       // 离线
  | 'maintenance';  // 维护中

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type LoadBalanceStrategy = 
  | 'round-robin'   // 轮询
  | 'least-busy'    // 最少任务
  | 'weighted'      // 权重分配
  | 'performance';  // 性能优先

export interface AgentInstance {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  currentTasks: number;
  maxConcurrentTasks: number;
  preferredModel: AIModel;
  capabilities: string[];
  performance: AgentPerformance;
  configuration: AgentConfiguration;
  lastHeartbeat: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface AgentConfiguration {
  timeout: number;
  retryAttempts: number;
  memoryLimit: number;
  enableLogging: boolean;
  customPrompts?: Record<string, string>;
  modelPreferences?: AIModel[];
  specializationTags?: string[];
}

export interface AgentPerformance {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  successRate: number;
  lastTaskTime?: Date;
  performanceScore: number;
  reliability: number;
}

export interface TaskRequest {
  id: string;
  type: string;
  content: string;
  priority: TaskPriority;
  requiredCapabilities: string[];
  estimatedDuration: number;
  deadline?: Date;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TaskAssignment {
  taskId: string;
  agentId: string;
  assignedAt: Date;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  status: 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
}

export interface LoadBalanceConfig {
  strategy: LoadBalanceStrategy;
  maxTasksPerAgent: number;
  healthCheckInterval: number;
  failoverEnabled: boolean;
  weights?: Record<AgentRole, number>;
  performanceThreshold: number;
}

export interface HealthCheck {
  agentId: string;
  timestamp: Date;
  status: AgentStatus;
  responseTime: number;
  memoryUsage: number;
  taskQueueSize: number;
  lastError?: string;
  systemMetrics?: SystemMetrics;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
}

export interface AgentManagerConfig {
  maxAgentsPerRole: number;
  healthCheckInterval: number;
  taskTimeout: number;
  enableAutoScaling: boolean;
  enableFailover: boolean;
  loadBalanceConfig: LoadBalanceConfig;
  performanceThresholds: {
    minSuccessRate: number;
    maxAverageResponseTime: number;
    maxTaskQueueSize: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffDelay: number;
  };
}

export interface AgentLifecycleEvent {
  type: 'created' | 'started' | 'stopped' | 'error' | 'recovered' | 'destroyed';
  agentId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface TaskRoutingResult {
  selectedAgent: AgentInstance;
  routingReason: string;
  estimatedWaitTime: number;
  alternativeAgents: AgentInstance[];
  loadBalanceMetrics: {
    totalAgents: number;
    availableAgents: number;
    averageLoad: number;
  };
}

export interface AgentCluster {
  role: AgentRole;
  instances: AgentInstance[];
  totalCapacity: number;
  currentLoad: number;
  averagePerformance: number;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
}

export interface FailoverConfig {
  enabled: boolean;
  maxFailureCount: number;
  failureWindow: number; // 时间窗口（毫秒）
  recoveryTime: number;  // 恢复时间（毫秒）
  backupAgents: Record<AgentRole, number>; // 每个角色的备用代理数量
}

export interface ScalingPolicy {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;   // CPU/内存使用率阈值
  scaleDownThreshold: number;
  scaleUpCooldown: number;    // 扩容冷却时间
  scaleDownCooldown: number;  // 缩容冷却时间
  targetUtilization: number; // 目标利用率
}

export interface MonitoringMetrics {
  timestamp: Date;
  agentMetrics: Record<string, AgentPerformance>;
  systemMetrics: SystemMetrics;
  taskMetrics: {
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    taskThroughput: number;
  };
  resourceUtilization: {
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
    storageUsage: number;
  };
}
