/**
 * Multi-Agent Workflow Executor Implementation
 * 多代理工作流执行器核心实现
 */

import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepExecution,
  WorkflowMetrics,
  WorkflowExecutorConfig,
  ExecutionPlan,
  ExecutionPhase,
  WorkflowContext,
  WorkflowValidationResult
} from '../types/workflowExecutor.js';
import { CMMIAgentManager } from './agentManager.js';
import { ModelScheduler } from './modelScheduler.js';
import { logger } from '../utils/logger.js';

export class MultiAgentWorkflowExecutor {
  private agentManager: CMMIAgentManager;
  // private modelScheduler: ModelScheduler; // 暂时不使用
  private config: WorkflowExecutorConfig;
  private activeExecutions: Map<string, WorkflowExecution>;
  private executionPlans: Map<string, ExecutionPlan>;

  constructor(
    agentManager: CMMIAgentManager,
    _modelScheduler: ModelScheduler,
    config?: Partial<WorkflowExecutorConfig>
  ) {
    this.agentManager = agentManager;
    // this.modelScheduler = modelScheduler; // 暂时不使用
    this.activeExecutions = new Map();
    this.executionPlans = new Map();

    this.config = {
      maxConcurrentWorkflows: 5,
      defaultTimeout: 3600000, // 1小时
      enableDetailedLogging: true,
      contextSharingEnabled: true,
      retryEnabled: true,
      errorRecoveryEnabled: true,
      metricsCollectionEnabled: true,
      performanceOptimization: {
        enableCaching: true,
        cacheTimeout: 300000,
        enablePipelining: true,
        batchSize: 3,
        loadBalancing: true,
        resourcePoolSize: 10
      },
      ...config
    };
  }

  /**
   * 执行工作流
   * Execute workflow with intelligent orchestration
   */
  async executeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowExecution> {
    logger.info('🚀 Starting workflow execution', {
      workflowId: workflow.id,
      name: workflow.name,
      executionMode: workflow.executionMode,
      stepCount: workflow.steps.length
    });

    // 1. 验证工作流定义
    const validation = this.validateWorkflow(workflow);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    // 2. 创建执行实例
    const execution = this.createExecution(workflow);
    this.activeExecutions.set(execution.id, execution);

    // 3. 生成执行计划
    const executionPlan = await this.generateExecutionPlan(workflow);
    this.executionPlans.set(execution.id, executionPlan);

    try {
      // 4. 根据执行模式选择执行策略
      switch (workflow.executionMode) {
        case 'sequential':
          await this.executeSequential(execution, workflow);
          break;
        case 'parallel':
          await this.executeParallel(execution, workflow);
          break;
        case 'smart':
          await this.executeSmart(execution, workflow, executionPlan);
          break;
        default:
          throw new Error(`Unsupported execution mode: ${workflow.executionMode}`);
      }

      // 5. 完成执行
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.metrics = this.calculateMetrics(execution);

      logger.info('✅ Workflow execution completed', {
        executionId: execution.id,
        duration: execution.endTime.getTime() - execution.startTime.getTime(),
        completedSteps: execution.metrics.completedSteps,
        failedSteps: execution.metrics.failedSteps
      });

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors.push({
        stepId: 'workflow',
        timestamp: new Date(),
        error: String(error),
        severity: 'critical',
        recovered: false
      });

      logger.error('❌ Workflow execution failed', {
        executionId: execution.id,
        error: String(error)
      });

      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);
      this.executionPlans.delete(execution.id);
    }

    return execution;
  }

  /**
   * 验证工作流定义
   * Validate workflow definition
   */
  validateWorkflow(workflow: WorkflowDefinition): WorkflowValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 基本验证
    if (!workflow.id || !workflow.name) {
      errors.push('Workflow must have valid id and name');
    }

    if (workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // 步骤验证
    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (!step.id || !step.name) {
        errors.push(`Step must have valid id and name: ${step.id}`);
      }

      if (stepIds.has(step.id)) {
        errors.push(`Duplicate step id: ${step.id}`);
      }
      stepIds.add(step.id);

      // 依赖验证
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep.stepId) && !workflow.steps.find(s => s.id === dep.stepId)) {
          errors.push(`Step ${step.id} depends on non-existent step: ${dep.stepId}`);
        }
      }
    }

    // 循环依赖检查
    if (this.hasCyclicDependencies(workflow.steps)) {
      errors.push('Workflow contains cyclic dependencies');
    }

    // 性能建议
    if (workflow.steps.length > 10) {
      suggestions.push('Consider breaking large workflows into smaller sub-workflows');
    }

    const hasParallelizable = workflow.steps.some(step => step.dependencies.length === 0);
    if (!hasParallelizable && workflow.executionMode === 'parallel') {
      warnings.push('No parallelizable steps found for parallel execution mode');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * 检查循环依赖
   * Check for cyclic dependencies
   */
  private hasCyclicDependencies(steps: WorkflowStep[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const stepMap = new Map(steps.map(step => [step.id, step]));

    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = stepMap.get(stepId);
      if (step) {
        for (const dep of step.dependencies) {
          if (hasCycle(dep.stepId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    return steps.some(step => hasCycle(step.id));
  }

  /**
   * 创建执行实例
   * Create workflow execution instance
   */
  private createExecution(workflow: WorkflowDefinition): WorkflowExecution {
    const executionId = `exec-${workflow.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      executionMode: workflow.executionMode,
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
        input: {},
        retryCount: 0,
        logs: []
      })),
      globalContext: { ...workflow.globalContext },
      results: {},
      errors: [],
      metrics: {
        totalSteps: workflow.steps.length,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        totalDuration: 0,
        averageStepDuration: 0,
        parallelEfficiency: 0,
        resourceUtilization: 0,
        successRate: 0
      }
    };
  }

  /**
   * 生成执行计划
   * Generate execution plan based on dependencies and resource availability
   */
  private async generateExecutionPlan(workflow: WorkflowDefinition): Promise<ExecutionPlan> {
    const phases: ExecutionPhase[] = [];
    const processed = new Set<string>();
    let phaseId = 0;

    // 构建依赖图
    const dependencyMap = new Map<string, string[]>();
    for (const step of workflow.steps) {
      dependencyMap.set(step.id, step.dependencies.map(dep => dep.stepId));
    }

    // 按依赖层次分组
    while (processed.size < workflow.steps.length) {
      const currentPhaseSteps: string[] = [];
      
      for (const step of workflow.steps) {
        if (processed.has(step.id)) continue;
        
        const dependencies = dependencyMap.get(step.id) || [];
        const dependenciesMet = dependencies.every(dep => processed.has(dep));
        
        if (dependenciesMet) {
          currentPhaseSteps.push(step.id);
        }
      }

      if (currentPhaseSteps.length === 0) {
        throw new Error('Unable to resolve workflow dependencies');
      }

      // 创建执行阶段
      phases.push({
        id: `phase-${phaseId++}`,
        name: `Phase ${phaseId}`,
        steps: currentPhaseSteps,
        parallelizable: currentPhaseSteps.length > 1,
        estimatedDuration: Math.max(
          ...currentPhaseSteps.map(stepId => 
            workflow.steps.find(s => s.id === stepId)?.estimatedDuration || 30000
          )
        ),
        dependencies: phases.length > 0 ? [phases[phases.length - 1]?.id || ''] : []
      });

      currentPhaseSteps.forEach(stepId => processed.add(stepId));
    }

    return {
      workflowId: workflow.id,
      executionMode: workflow.executionMode,
      phases,
      estimatedDuration: phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0),
      resourceRequirements: this.calculateResourceRequirements(workflow),
      riskAssessment: {
        overallRisk: 'medium',
        riskFactors: [],
        mitigationStrategies: []
      }
    };
  }

  /**
   * 计算资源需求
   * Calculate resource requirements for workflow
   */
  private calculateResourceRequirements(workflow: WorkflowDefinition) {
    const requirements = new Map();
    
    for (const step of workflow.steps) {
      const existing = requirements.get(step.agentRole) || {
        agentRole: step.agentRole,
        instanceCount: 0,
        estimatedUsage: 0,
        priority: step.priority
      };
      
      existing.instanceCount++;
      existing.estimatedUsage += step.estimatedDuration;
      
      requirements.set(step.agentRole, existing);
    }
    
    return Array.from(requirements.values());
  }

  /**
   * 串行执行模式
   * Sequential execution mode
   */
  private async executeSequential(execution: WorkflowExecution, workflow: WorkflowDefinition): Promise<void> {
    logger.info('📋 Executing workflow in sequential mode', { executionId: execution.id });

    const context = this.createWorkflowContext(workflow.globalContext, true);

    for (const step of workflow.steps) {
      const stepExecution = execution.steps.find(s => s.stepId === step.id)!;
      
      try {
        await this.executeStep(step, stepExecution, execution, context, workflow);
      } catch (error) {
        if (step.failureHandling?.onFailure === 'continue') {
          logger.warn(`Step ${step.id} failed but continuing execution`, { error });
          continue;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * 并行执行模式
   * Parallel execution mode
   */
  private async executeParallel(execution: WorkflowExecution, workflow: WorkflowDefinition): Promise<void> {
    logger.info('🔀 Executing workflow in parallel mode', { executionId: execution.id });

    const context = this.createWorkflowContext(workflow.globalContext, true);
    const maxConcurrent = workflow.maxConcurrentSteps || this.config.performanceOptimization.batchSize;

    // 分批并行执行
    const stepPromises = workflow.steps.map(async (step) => {
      const stepExecution = execution.steps.find(s => s.stepId === step.id)!;
      return this.executeStep(step, stepExecution, execution, context, workflow);
    });

    // 使用信号量控制并发数
    const semaphore = new Semaphore(maxConcurrent);
    const controlledPromises = stepPromises.map(promise => 
      semaphore.acquire().then(() => promise.finally(() => semaphore.release()))
    );

    await Promise.allSettled(controlledPromises);
  }

  /**
   * 智能执行模式
   * Smart execution mode with dependency resolution
   */
  private async executeSmart(
    execution: WorkflowExecution, 
    workflow: WorkflowDefinition, 
    executionPlan: ExecutionPlan
  ): Promise<void> {
    logger.info('🧠 Executing workflow in smart mode', { 
      executionId: execution.id,
      phases: executionPlan.phases.length 
    });

    const context = this.createWorkflowContext(workflow.globalContext, true);

    // 按阶段执行
    for (const phase of executionPlan.phases) {
      logger.info(`🔄 Executing phase: ${phase.name}`, { 
        stepCount: phase.steps.length,
        parallelizable: phase.parallelizable 
      });

      if (phase.parallelizable && phase.steps.length > 1) {
        // 并行执行阶段内的步骤
        const phasePromises = phase.steps.map(async (stepId) => {
          const step = workflow.steps.find(s => s.id === stepId)!;
          const stepExecution = execution.steps.find(s => s.stepId === stepId)!;
          return this.executeStep(step, stepExecution, execution, context, workflow);
        });

        await Promise.all(phasePromises);
      } else {
        // 串行执行阶段内的步骤
        for (const stepId of phase.steps) {
          const step = workflow.steps.find(s => s.id === stepId)!;
          const stepExecution = execution.steps.find(s => s.stepId === stepId)!;
          await this.executeStep(step, stepExecution, execution, context, workflow);
        }
      }
    }
  }

  /**
   * 执行单个步骤
   * Execute individual workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    stepExecution: WorkflowStepExecution,
    execution: WorkflowExecution,
    context: WorkflowContext,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const startTime = Date.now();
    stepExecution.status = 'running';
    stepExecution.startTime = new Date();

    logger.info(`🔧 Executing step: ${step.name}`, { 
      stepId: step.id, 
      agentRole: step.agentRole 
    });

    try {
      // 1. 检查依赖是否满足
      await this.checkDependencies(step, execution, context);

      // 2. 准备输入数据
      const input = await this.prepareStepInput(step, context);
      stepExecution.input = input;

      // 3. 路由任务到合适的代理
      const taskRequest = {
        id: `task-${step.id}-${Date.now()}`,
        type: step.name,
        content: this.resolvePromptTemplate(step.prompt, input, context),
        priority: step.priority,
        requiredCapabilities: this.getRequiredCapabilities(step.agentRole),
        estimatedDuration: step.estimatedDuration,
        context: input
      };

      const routingResult = await this.agentManager.routeTask(taskRequest);
      stepExecution.agentId = routingResult.selectedAgent.id;

      // 4. 分配并执行任务
      await this.agentManager.assignTask(routingResult.selectedAgent, taskRequest);

      // 模拟任务执行
      const result = await this.simulateTaskExecution(taskRequest, step);

      // 5. 处理执行结果
      stepExecution.output = result;
      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.duration = Date.now() - startTime;

      // 6. 更新上下文
      this.updateContext(context, step, result);

      // 7. 完成任务
      await this.agentManager.completeTask(taskRequest.id, result);

      logger.info(`✅ Step completed: ${step.name}`, { 
        stepId: step.id,
        duration: stepExecution.duration
      });

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = String(error);
      stepExecution.endTime = new Date();
      stepExecution.duration = Date.now() - startTime;

      execution.errors.push({
        stepId: step.id,
        timestamp: new Date(),
        error: String(error),
        severity: 'high',
        recovered: false
      });

      logger.error(`❌ Step failed: ${step.name}`, { 
        stepId: step.id, 
        error: String(error) 
      });

      // 失败处理
      if (step.retryPolicy?.enabled && stepExecution.retryCount < step.retryPolicy.maxRetries) {
        stepExecution.retryCount++;
        logger.info(`🔄 Retrying step: ${step.name}`, { 
          stepId: step.id, 
          retryCount: stepExecution.retryCount 
        });
        await this.executeStep(step, stepExecution, execution, context, workflow);
      } else {
        throw error;
      }
    }
  }

  /**
   * 模拟任务执行
   * Simulate task execution (in real implementation, this would call the actual agent)
   */
  private async simulateTaskExecution(taskRequest: any, step: WorkflowStep): Promise<any> {
    // 模拟执行时间
    const delay = Math.min(step.estimatedDuration * 0.1, 2000);
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      status: 'success',
      data: `Result from ${step.name}`,
      timestamp: new Date(),
      metadata: {
        stepId: step.id,
        agentRole: step.agentRole,
        taskId: taskRequest.id
      }
    };
  }

  /**
   * 其他辅助方法的简化实现
   */
  private createWorkflowContext(_globalContext: Record<string, any>, shared: boolean): WorkflowContext {
    return {
      values: {},
      shared,
      isolated: {}
    };
  }

  private async checkDependencies(step: WorkflowStep, execution: WorkflowExecution, _context: WorkflowContext): Promise<void> {
    // 检查依赖步骤是否完成
    for (const dependency of step.dependencies) {
      const depExecution = execution.steps.find(s => s.stepId === dependency.stepId);
      if (!depExecution || depExecution.status !== 'completed') {
        throw new Error(`Dependency not met: ${dependency.stepId}`);
      }
    }
  }

  private async prepareStepInput(step: WorkflowStep, context: WorkflowContext): Promise<Record<string, any>> {
    const input: Record<string, any> = { ...step.context };
    
    // 从依赖步骤获取数据
    for (const dependency of step.dependencies) {
      if (dependency.dataMapping) {
        const sourceValue = context.values[dependency.dataMapping.sourceField];
        if (sourceValue) {
          input[dependency.dataMapping.targetField] = sourceValue.value;
        }
      }
    }
    
    return input;
  }

  private resolvePromptTemplate(template: string, input: Record<string, any>, _context: WorkflowContext): string {
    let resolved = template;
    
    // 简单的模板变量替换
    for (const [key, value] of Object.entries(input)) {
      resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
    
    return resolved;
  }

  private getRequiredCapabilities(agentRole: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'requirements-agent': ['requirement-analysis'],
      'design-agent': ['system-design'],
      'coding-agent': ['code-generation'],
      'test-agent': ['test-planning'],
      'tasks-agent': ['task-breakdown'],
      'spec-agent': ['specification-writing']
    };
    
    return capabilityMap[agentRole] || [];
  }

  private updateContext(context: WorkflowContext, step: WorkflowStep, result: any): void {
    for (const outputKey of step.outputs) {
      context.values[outputKey] = {
        value: result.data || result,
        type: typeof result,
        timestamp: new Date(),
        sourceStep: step.id
      };
    }
  }

  private calculateMetrics(execution: WorkflowExecution): WorkflowMetrics {
    const completedSteps = execution.steps.filter(s => s.status === 'completed').length;
    const failedSteps = execution.steps.filter(s => s.status === 'failed').length;
    const skippedSteps = execution.steps.filter(s => s.status === 'skipped').length;
    
    const totalDuration = execution.endTime && execution.startTime 
      ? execution.endTime.getTime() - execution.startTime.getTime() 
      : 0;
    
    const stepDurations = execution.steps
      .filter(s => s.duration !== undefined)
      .map(s => s.duration!);
    
    const averageStepDuration = stepDurations.length > 0 
      ? stepDurations.reduce((sum, duration) => sum + duration, 0) / stepDurations.length 
      : 0;

    return {
      totalSteps: execution.steps.length,
      completedSteps,
      failedSteps,
      skippedSteps,
      totalDuration,
      averageStepDuration,
      parallelEfficiency: 0.8, // 简化值
      resourceUtilization: 0.7, // 简化值
      successRate: completedSteps / execution.steps.length
    };
  }

  /**
   * 获取执行状态
   * Get execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * 取消执行
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      this.activeExecutions.delete(executionId);
      
      logger.info('🛑 Workflow execution cancelled', { executionId });
    }
  }

  /**
   * 获取配置信息
   * Get executor configuration
   */
  getConfig(): WorkflowExecutorConfig {
    return { ...this.config };
  }
}

/**
 * 信号量实现
 * Semaphore implementation for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      this.permits--;
      const resolve = this.waitQueue.shift()!;
      resolve();
    }
  }
}
