/**
 * CMMI Agent Manager Implementation
 * CMMI代理管理系统核心实现
 */

import {
  AgentInstance,
  TaskRequest,
  TaskAssignment,
  TaskPriority,
  AgentManagerConfig,
  TaskRoutingResult,
  AgentCluster,
  HealthCheck,
  AgentLifecycleEvent,
  MonitoringMetrics
} from '../types/agentManager.js';
import { AgentRole, AIModel } from '../types/modelScheduler.js';
import { ModelScheduler } from './modelScheduler.js';
import { logger } from '../utils/logger.js';

export class CMMIAgentManager {
  private agents: Map<string, AgentInstance>;
  private taskAssignments: Map<string, TaskAssignment>;
  private clusters: Map<AgentRole, AgentCluster>;
  private config: AgentManagerConfig;
  private modelScheduler: ModelScheduler;
  private healthCheckTimer?: NodeJS.Timeout;
  // private metricsHistory: MonitoringMetrics[]; // 暂时不使用

  constructor(modelScheduler: ModelScheduler, config?: Partial<AgentManagerConfig>) {
    this.modelScheduler = modelScheduler;
    this.agents = new Map();
    this.taskAssignments = new Map();
    this.clusters = new Map();
    // this.metricsHistory = []; // 暂时不使用
    
    this.config = {
      maxAgentsPerRole: 3,
      healthCheckInterval: 30000, // 30秒
      taskTimeout: 300000,        // 5分钟
      enableAutoScaling: true,
      enableFailover: true,
      loadBalanceConfig: {
        strategy: 'performance',
        maxTasksPerAgent: 5,
        healthCheckInterval: 30000,
        failoverEnabled: true,
        performanceThreshold: 0.8
      },
      performanceThresholds: {
        minSuccessRate: 0.85,
        maxAverageResponseTime: 30000,
        maxTaskQueueSize: 10
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffDelay: 60000
      },
      ...config
    };

    this.initializeClusters();
    this.startHealthChecking();
  }

  /**
   * 初始化代理集群
   * Initialize agent clusters for each role
   */
  private initializeClusters(): void {
    const roles: AgentRole[] = [
      'requirements-agent',
      'design-agent', 
      'coding-agent',
      'test-agent',
      'tasks-agent',
      'spec-agent'
    ];

    roles.forEach(role => {
      this.clusters.set(role, {
        role,
        instances: [],
        totalCapacity: 0,
        currentLoad: 0,
        averagePerformance: 0,
        status: 'offline'
      });
    });

    logger.info('🏗️ CMMI Agent clusters initialized', { roles });
  }

  /**
   * 创建新的代理实例
   * Create a new agent instance
   */
  async createAgent(
    role: AgentRole, 
    preferredModel?: AIModel,
    customConfig?: Partial<AgentInstance>
  ): Promise<AgentInstance> {
    const agentId = `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: AgentInstance = {
      id: agentId,
      role,
      status: 'idle',
      currentTasks: 0,
      maxConcurrentTasks: 3,
      preferredModel: preferredModel || this.modelScheduler.selectModel(role),
      capabilities: this.getDefaultCapabilities(role),
      performance: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        successRate: 1.0,
        performanceScore: 1.0,
        reliability: 1.0
      },
      configuration: {
        timeout: 60000,
        retryAttempts: 3,
        memoryLimit: 512,
        enableLogging: true
      },
      lastHeartbeat: new Date(),
      createdAt: new Date(),
      ...customConfig
    };

    // 添加到集群
    const cluster = this.clusters.get(role);
    if (cluster) {
      cluster.instances.push(agent);
      cluster.totalCapacity += agent.maxConcurrentTasks;
      cluster.status = cluster.instances.length > 0 ? 'healthy' : 'offline';
    }

    this.agents.set(agentId, agent);

    // 记录生命周期事件
    this.recordLifecycleEvent({
      type: 'created',
      agentId,
      timestamp: new Date(),
      details: { role, preferredModel }
    });

    logger.info('✅ Agent created successfully', { 
      agentId, 
      role, 
      preferredModel,
      clusterSize: cluster?.instances.length 
    });

    return agent;
  }

  /**
   * 获取角色的默认能力
   * Get default capabilities for agent role
   */
  private getDefaultCapabilities(role: AgentRole): string[] {
    const capabilityMap = {
      'requirements-agent': ['requirement-analysis', 'stakeholder-management', 'use-case-modeling'],
      'design-agent': ['system-design', 'architecture-planning', 'component-design'],
      'coding-agent': ['code-generation', 'refactoring', 'code-review'],
      'test-agent': ['test-planning', 'test-case-generation', 'automation-testing'],
      'tasks-agent': ['task-breakdown', 'project-planning', 'resource-allocation'],
      'spec-agent': ['specification-writing', 'documentation', 'standard-compliance']
    };
    
    return capabilityMap[role] || [];
  }

  /**
   * 智能任务路由
   * Intelligent task routing with load balancing
   */
  async routeTask(taskRequest: TaskRequest): Promise<TaskRoutingResult> {
    logger.info('🎯 Starting task routing', { 
      taskId: taskRequest.id, 
      type: taskRequest.type,
      priority: taskRequest.priority 
    });

    // 1. 根据能力筛选合适的代理
    const candidateAgents = this.findCapableAgents(taskRequest.requiredCapabilities);
    
    if (candidateAgents.length === 0) {
      throw new Error(`No agents available with required capabilities: ${taskRequest.requiredCapabilities.join(', ')}`);
    }

    // 2. 根据负载均衡策略选择最佳代理
    const selectedAgent = this.selectBestAgent(candidateAgents, taskRequest);
    
    // 3. 计算等待时间
    const estimatedWaitTime = this.calculateWaitTime(selectedAgent, taskRequest);
    
    // 4. 获取备选代理
    const alternativeAgents = candidateAgents
      .filter(agent => agent.id !== selectedAgent.id)
      .slice(0, 3);

    // 5. 计算负载均衡指标
    const loadBalanceMetrics = this.calculateLoadMetrics(candidateAgents);

    logger.info('✅ Task routing completed', {
      taskId: taskRequest.id,
      selectedAgentId: selectedAgent.id,
      estimatedWaitTime,
      alternativesCount: alternativeAgents.length
    });

    return {
      selectedAgent,
      routingReason: this.getRoutingReason(selectedAgent, taskRequest),
      estimatedWaitTime,
      alternativeAgents,
      loadBalanceMetrics
    };
  }

  /**
   * 查找具备所需能力的代理
   * Find agents with required capabilities
   */
  private findCapableAgents(requiredCapabilities: string[]): AgentInstance[] {
    const capableAgents: AgentInstance[] = [];
    
    for (const agent of this.agents.values()) {
      // 检查代理状态
      if (agent.status !== 'idle' && agent.status !== 'busy') {
        continue;
      }
      
      // 检查任务容量
      if (agent.currentTasks >= agent.maxConcurrentTasks) {
        continue;
      }
      
      // 检查能力匹配
      const hasRequiredCapabilities = requiredCapabilities.every(capability =>
        agent.capabilities.includes(capability)
      );
      
      if (hasRequiredCapabilities) {
        capableAgents.push(agent);
      }
    }
    
    return capableAgents;
  }

  /**
   * 选择最佳代理
   * Select the best agent based on load balance strategy
   */
  private selectBestAgent(candidates: AgentInstance[], taskRequest: TaskRequest): AgentInstance {
    switch (this.config.loadBalanceConfig.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(candidates);
      
      case 'least-busy':
        return this.selectLeastBusy(candidates);
      
      case 'weighted':
        return this.selectWeighted(candidates);
      
      case 'performance':
      default:
        return this.selectByPerformance(candidates, taskRequest);
    }
  }

  /**
   * 轮询选择
   * Round-robin selection
   */
  private selectRoundRobin(candidates: AgentInstance[]): AgentInstance {
    // 简化实现：选择ID最小的可用代理
    const sorted = candidates.sort((a, b) => a.id.localeCompare(b.id));
    if (sorted.length === 0) {
      throw new Error('No candidates available');
    }
    return sorted[0]!; // 已检查length > 0
  }

  /**
   * 选择最空闲的代理
   * Select least busy agent
   */
  private selectLeastBusy(candidates: AgentInstance[]): AgentInstance {
    return candidates.reduce((least, current) => 
      current.currentTasks < least.currentTasks ? current : least
    );
  }

  /**
   * 权重选择
   * Weighted selection
   */
  private selectWeighted(candidates: AgentInstance[]): AgentInstance {
    const weights = this.config.loadBalanceConfig.weights || {} as Record<AgentRole, number>;
    
    return candidates.reduce((best, current) => {
      const currentWeight = weights[current.role] || 1;
      const bestWeight = weights[best.role] || 1;
      
      const currentScore = currentWeight / (current.currentTasks + 1);
      const bestScore = bestWeight / (best.currentTasks + 1);
      
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 基于性能选择
   * Performance-based selection
   */
  private selectByPerformance(candidates: AgentInstance[], taskRequest: TaskRequest): AgentInstance {
    return candidates.reduce((best, current) => {
      // 综合评分：性能分数 * 可靠性 / (当前任务数 + 1) * 优先级权重
      const priorityWeight = this.getPriorityWeight(taskRequest.priority);
      
      const currentScore = (current.performance.performanceScore * current.performance.reliability) 
                         / (current.currentTasks + 1) * priorityWeight;
      
      const bestScore = (best.performance.performanceScore * best.performance.reliability) 
                       / (best.currentTasks + 1) * priorityWeight;
      
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 获取优先级权重
   * Get priority weight for task routing
   */
  private getPriorityWeight(priority: TaskPriority): number {
    const weights = {
      'low': 0.5,
      'medium': 1.0,
      'high': 1.5,
      'critical': 2.0
    };
    return weights[priority] || 1.0;
  }

  /**
   * 计算预估等待时间
   * Calculate estimated wait time
   */
  private calculateWaitTime(agent: AgentInstance, _taskRequest: TaskRequest): number {
    // 基于当前任务数和平均响应时间估算
    const baseWaitTime = agent.performance.averageResponseTime || 30000;
    const queueMultiplier = Math.max(1, agent.currentTasks);
    return Math.floor(baseWaitTime * queueMultiplier * 0.8);
  }

  /**
   * 获取路由原因
   * Get routing reason explanation
   */
  private getRoutingReason(agent: AgentInstance, _taskRequest: TaskRequest): string {
    const strategy = this.config.loadBalanceConfig.strategy;
    const reasons = {
      'round-robin': `Round-robin selection for ${agent.role}`,
      'least-busy': `Least busy agent with ${agent.currentTasks} current tasks`,
      'weighted': `Weighted selection based on role priority`,
      'performance': `Best performance score: ${agent.performance.performanceScore.toFixed(2)}`
    };
    
    return reasons[strategy] || 'Default selection';
  }

  /**
   * 计算负载均衡指标
   * Calculate load balance metrics
   */
  private calculateLoadMetrics(candidates: AgentInstance[]) {
    const totalAgents = candidates.length;
    const availableAgents = candidates.filter(agent => 
      agent.status === 'idle' && agent.currentTasks < agent.maxConcurrentTasks
    ).length;
    
    const averageLoad = totalAgents > 0 
      ? candidates.reduce((sum, agent) => sum + agent.currentTasks, 0) / totalAgents 
      : 0;

    return {
      totalAgents,
      availableAgents,
      averageLoad: Math.round(averageLoad * 100) / 100
    };
  }

  /**
   * 分配任务给代理
   * Assign task to agent
   */
  async assignTask(agent: AgentInstance, taskRequest: TaskRequest): Promise<TaskAssignment> {
    const assignment: TaskAssignment = {
      taskId: taskRequest.id,
      agentId: agent.id,
      assignedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + taskRequest.estimatedDuration),
      status: 'assigned',
      progress: 0
    };

    // 更新代理状态
    agent.currentTasks++;
    agent.status = agent.currentTasks > 0 ? 'busy' : 'idle';

    // 记录任务分配
    this.taskAssignments.set(taskRequest.id, assignment);

    logger.info('📋 Task assigned to agent', {
      taskId: taskRequest.id,
      agentId: agent.id,
      currentTasks: agent.currentTasks
    });

    return assignment;
  }

  /**
   * 完成任务
   * Complete task assignment
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const assignment = this.taskAssignments.get(taskId);
    if (!assignment) {
      throw new Error(`Task assignment not found: ${taskId}`);
    }

    const agent = this.agents.get(assignment.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${assignment.agentId}`);
    }

    // 更新任务状态
    assignment.status = 'completed';
    assignment.actualCompletion = new Date();
    assignment.progress = 100;
    assignment.result = result;

    // 更新代理状态
    agent.currentTasks = Math.max(0, agent.currentTasks - 1);
    agent.status = agent.currentTasks > 0 ? 'busy' : 'idle';

    // 更新性能指标
    this.updateAgentPerformance(agent, assignment, true);

    logger.info('✅ Task completed successfully', {
      taskId,
      agentId: agent.id,
      duration: assignment.actualCompletion.getTime() - assignment.assignedAt.getTime()
    });
  }

  /**
   * 任务失败处理
   * Handle task failure
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const assignment = this.taskAssignments.get(taskId);
    if (!assignment) {
      throw new Error(`Task assignment not found: ${taskId}`);
    }

    const agent = this.agents.get(assignment.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${assignment.agentId}`);
    }

    // 更新任务状态
    assignment.status = 'failed';
    assignment.error = error;

    // 更新代理状态
    agent.currentTasks = Math.max(0, agent.currentTasks - 1);
    agent.status = agent.currentTasks > 0 ? 'busy' : 'idle';

    // 更新性能指标
    this.updateAgentPerformance(agent, assignment, false);

    logger.error('❌ Task failed', {
      taskId,
      agentId: agent.id,
      error
    });
  }

  /**
   * 更新代理性能指标
   * Update agent performance metrics
   */
  private updateAgentPerformance(
    agent: AgentInstance, 
    assignment: TaskAssignment, 
    success: boolean
  ): void {
    const performance = agent.performance;
    
    performance.totalTasks++;
    
    if (success) {
      performance.completedTasks++;
      
      // 更新平均响应时间
      if (assignment.actualCompletion) {
        const responseTime = assignment.actualCompletion.getTime() - assignment.assignedAt.getTime();
        performance.averageResponseTime = performance.totalTasks === 1 
          ? responseTime
          : (performance.averageResponseTime * (performance.totalTasks - 1) + responseTime) / performance.totalTasks;
      }
    } else {
      performance.failedTasks++;
    }

    // 更新成功率
    performance.successRate = performance.completedTasks / performance.totalTasks;
    
    // 更新性能评分
    performance.performanceScore = this.calculatePerformanceScore(performance);
    
    // 更新可靠性
    performance.reliability = this.calculateReliability(performance);
    
    performance.lastTaskTime = new Date();
  }

  /**
   * 计算性能评分
   * Calculate performance score
   */
  private calculatePerformanceScore(performance: any): number {
    const successWeight = 0.4;
    const speedWeight = 0.3;
    const consistencyWeight = 0.3;
    
    const successScore = performance.successRate;
    const speedScore = Math.min(1, 30000 / (performance.averageResponseTime || 30000));
    const consistencyScore = performance.totalTasks > 5 ? Math.min(1, performance.successRate * 1.2) : 0.8;
    
    return Math.min(1, successWeight * successScore + speedWeight * speedScore + consistencyWeight * consistencyScore);
  }

  /**
   * 计算可靠性
   * Calculate reliability score
   */
  private calculateReliability(performance: any): number {
    if (performance.totalTasks < 3) return 0.8; // 新代理的初始可靠性
    
    const recentFailureRate = performance.failedTasks / Math.max(1, performance.totalTasks);
    return Math.max(0.1, 1 - recentFailureRate * 2);
  }

  /**
   * 健康检查
   * Perform health checks on all agents
   */
  private async performHealthCheck(): Promise<void> {
    const healthChecks: HealthCheck[] = [];
    
    for (const agent of this.agents.values()) {
      try {
        const healthCheck = await this.checkAgentHealth(agent);
        healthChecks.push(healthCheck);
        
        // 更新代理心跳
        agent.lastHeartbeat = new Date();
        
      } catch (error) {
        logger.warn('Health check failed for agent', { 
          agentId: agent.id, 
          error: String(error)
        });
        
        // 标记代理为错误状态
        if (agent.status !== 'error') {
          agent.status = 'error';
          this.recordLifecycleEvent({
            type: 'error',
            agentId: agent.id,
            timestamp: new Date(),
            details: { error: String(error) }
          });
        }
      }
    }
    
    // 更新集群状态
    this.updateClusterStatus();
    
    logger.debug('Health checks completed', { 
      totalAgents: this.agents.size,
      healthyAgents: healthChecks.filter(hc => hc.status === 'idle' || hc.status === 'busy').length
    });
  }

  /**
   * 检查单个代理健康状态
   * Check individual agent health
   */
  private async checkAgentHealth(agent: AgentInstance): Promise<HealthCheck> {
    const startTime = Date.now();
    
    // 模拟健康检查（实际实现可能包括ping、内存检查等）
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
    
    const responseTime = Date.now() - startTime;
    
    return {
      agentId: agent.id,
      timestamp: new Date(),
      status: agent.status,
      responseTime,
      memoryUsage: Math.random() * 100, // 模拟内存使用率
      taskQueueSize: agent.currentTasks,
      systemMetrics: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkLatency: responseTime,
        uptime: Date.now() - agent.createdAt.getTime()
      }
    };
  }

  /**
   * 更新集群状态
   * Update cluster status based on agent health
   */
  private updateClusterStatus(): void {
    for (const cluster of this.clusters.values()) {
      const healthyAgents = cluster.instances.filter(agent => 
        agent.status === 'idle' || agent.status === 'busy'
      );
      
      const totalLoad = cluster.instances.reduce((sum, agent) => sum + agent.currentTasks, 0);
      cluster.currentLoad = totalLoad;
      
      const avgPerformance = cluster.instances.length > 0
        ? cluster.instances.reduce((sum, agent) => sum + agent.performance.performanceScore, 0) / cluster.instances.length
        : 0;
      cluster.averagePerformance = avgPerformance;
      
      // 确定集群状态
      if (healthyAgents.length === 0) {
        cluster.status = 'offline';
      } else if (healthyAgents.length < cluster.instances.length * 0.5) {
        cluster.status = 'critical';
      } else if (healthyAgents.length < cluster.instances.length * 0.8) {
        cluster.status = 'degraded';
      } else {
        cluster.status = 'healthy';
      }
    }
  }

  /**
   * 启动健康检查定时器
   * Start health check timer
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheckInterval
    );
    
    logger.info('🏥 Health checking started', { 
      interval: this.config.healthCheckInterval 
    });
  }

  /**
   * 记录生命周期事件
   * Record agent lifecycle event
   */
  private recordLifecycleEvent(event: AgentLifecycleEvent): void {
    logger.info(`🔄 Agent lifecycle event: ${event.type}`, {
      agentId: event.agentId,
      details: event.details
    });
  }

  /**
   * 获取所有代理状态
   * Get all agents status
   */
  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * 获取集群状态
   * Get cluster status
   */
  getClusterStatus(): Record<AgentRole, AgentCluster> {
    const status: Record<string, AgentCluster> = {};
    for (const [role, cluster] of this.clusters.entries()) {
      status[role] = { ...cluster };
    }
    return status as Record<AgentRole, AgentCluster>;
  }

  /**
   * 获取系统监控指标
   * Get system monitoring metrics
   */
  getMonitoringMetrics(): MonitoringMetrics {
    const agentMetrics: Record<string, any> = {};
    for (const agent of this.agents.values()) {
      agentMetrics[agent.id] = agent.performance;
    }

    const allTasks = Array.from(this.taskAssignments.values());
    const runningTasks = allTasks.filter(t => t.status === 'running').length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const failedTasks = allTasks.filter(t => t.status === 'failed').length;

    return {
      timestamp: new Date(),
      agentMetrics,
      systemMetrics: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        networkLatency: Math.random() * 100,
        uptime: Date.now()
      },
      taskMetrics: {
        totalTasks: allTasks.length,
        runningTasks,
        completedTasks,
        failedTasks,
        averageTaskDuration: 30000, // 简化值
        taskThroughput: completedTasks / Math.max(1, Date.now() / 3600000) // 每小时完成数
      },
      resourceUtilization: {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        networkUsage: Math.random() * 100,
        storageUsage: Math.random() * 100
      }
    };
  }

  /**
   * 停止代理管理器
   * Shutdown agent manager
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // 停止所有代理
    for (const agent of this.agents.values()) {
      agent.status = 'offline';
      this.recordLifecycleEvent({
        type: 'stopped',
        agentId: agent.id,
        timestamp: new Date()
      });
    }

    logger.info('🛑 CMMI Agent Manager shutdown completed');
  }
}
