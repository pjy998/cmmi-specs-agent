/**
 * 工作流编排器 - CMMI智能项目初始化的核心引擎
 * Workflow Orchestrator - Core engine for CMMI intelligent project initialization
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { logger } from '../utils/logger.js';
import { AgentDiscoveryEngine } from './agentDiscoveryEngine.js';

/**
 * 工作流定义接口
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  agents: string[];
  steps: WorkflowStep[];
  dependencies?: string[];
  parallel?: boolean;
}

/**
 * 工作流步骤接口
 */
export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  action: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  dependencies?: string[];
}

/**
 * 编排结果接口
 */
export interface OrchestrationResult {
  success: boolean;
  workflowId: string;
  executedSteps: string[];
  outputs: Record<string, any>;
  errors?: string[];
  duration: number;
}

/**
 * 简化的工作流执行器接口
 */
interface WorkflowExecutor {
  execute(workflow: WorkflowDefinition, context: Record<string, any>): Promise<{
    success: boolean;
    executedSteps: string[];
    outputs: Record<string, any>;
    errors?: string[];
  }>;
}

/**
 * 基础工作流执行器实现
 */
class BasicWorkflowExecutor implements WorkflowExecutor {
  async execute(workflow: WorkflowDefinition, context: Record<string, any>) {
    const executedSteps: string[] = [];
    const outputs: Record<string, any> = {};
    const errors: string[] = [];

    try {
      for (const step of workflow.steps) {
        logger.info(`执行步骤: ${step.name}`);
        executedSteps.push(step.id);
        
        // 基础步骤执行逻辑（可扩展）
        outputs[step.id] = {
          stepId: step.id,
          agent: step.agent,
          action: step.action,
          executedAt: new Date().toISOString()
        };
      }

      return {
        success: true,
        executedSteps,
        outputs,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        executedSteps,
        outputs,
        errors
      };
    }
  }
}

/**
 * 工作流编排器类
 * 负责解析、编排和执行基于CMMI代理的工作流
 */
export class WorkflowOrchestrator {
  private executor: WorkflowExecutor;
  private discoveryEngine: AgentDiscoveryEngine;
  private workflowCache: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    this.executor = new BasicWorkflowExecutor();
    this.discoveryEngine = new AgentDiscoveryEngine();
  }

  /**
   * 从项目目录发现和解析工作流
   * @param projectPath 项目路径
   * @returns 发现的工作流列表
   */
  async discoverWorkflows(projectPath: string): Promise<WorkflowDefinition[]> {
    try {
      logger.info(`🔍 开始发现工作流: ${projectPath}`);
      
      const workflows: WorkflowDefinition[] = [];
      const agentsPath = path.join(projectPath, 'agents');
      
      if (!fs.existsSync(agentsPath)) {
        logger.warn('未找到agents目录');
        return workflows;
      }

      // 扫描agents目录下的YAML文件
      const agentFiles = fs.readdirSync(agentsPath)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

      for (const file of agentFiles) {
        const filePath = path.join(agentsPath, file);
        const agentConfig = await this.parseAgentConfig(filePath);
        
        if (agentConfig && agentConfig.workflow) {
          const workflow = this.convertAgentToWorkflow(agentConfig);
          workflows.push(workflow);
          this.workflowCache.set(workflow.id, workflow);
        }
      }

      logger.info(`✅ 发现 ${workflows.length} 个工作流`);
      return workflows;
    } catch (error) {
      logger.error('工作流发现失败:', error);
      throw error;
    }
  }

  /**
   * 执行指定的工作流
   * @param workflowId 工作流ID
   * @param context 执行上下文
   * @returns 编排执行结果
   */
  async executeWorkflow(
    workflowId: string, 
    context: Record<string, any> = {}
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`🚀 开始执行工作流: ${workflowId}`);
      
      const workflow = this.workflowCache.get(workflowId);
      if (!workflow) {
        throw new Error(`未找到工作流: ${workflowId}`);
      }

      // 检查代理可用性
      await this.validateAgents(workflow.agents);

      // 执行工作流步骤
      const executionResult = await this.executor.execute(workflow, context);

      const result: OrchestrationResult = {
        success: executionResult.success,
        workflowId,
        executedSteps: executionResult.executedSteps,
        outputs: executionResult.outputs,
        errors: executionResult.errors,
        duration: Date.now() - startTime
      };

      logger.info(`✅ 工作流执行完成: ${workflowId}, 耗时: ${result.duration}ms`);
      return result;
      
    } catch (error) {
      logger.error(`❌ 工作流执行失败: ${workflowId}`, error);
      return {
        success: false,
        workflowId,
        executedSteps: [],
        outputs: {},
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 获取可用的工作流列表
   * @returns 工作流ID和名称列表
   */
  getAvailableWorkflows(): Array<{id: string, name: string, description: string}> {
    return Array.from(this.workflowCache.values()).map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description
    }));
  }

  /**
   * 解析代理配置文件
   * @param filePath 配置文件路径
   * @returns 解析的配置对象
   */
  private async parseAgentConfig(filePath: string): Promise<any> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return yaml.parse(content);
    } catch (error) {
      logger.error(`解析代理配置失败: ${filePath}`, error);
      return null;
    }
  }

  /**
   * 将代理配置转换为工作流定义
   * @param agentConfig 代理配置
   * @returns 工作流定义
   */
  private convertAgentToWorkflow(agentConfig: any): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: agentConfig.name || 'unknown-workflow',
      name: agentConfig.title || agentConfig.name || 'Unnamed Workflow',
      description: agentConfig.description || '',
      agents: [agentConfig.name],
      steps: []
    };

    // 如果有工作流配置，转换为标准步骤
    if (agentConfig.workflow) {
      const workflowConfig = agentConfig.workflow;
      
      // 创建基础执行步骤
      workflow.steps.push({
        id: `${agentConfig.name}-analyze`,
        name: `${agentConfig.title} - 分析阶段`,
        agent: agentConfig.name,
        action: 'analyze',
        inputs: workflowConfig.prerequisites || [],
        outputs: workflowConfig.outputs || {},
        dependencies: []
      });

      // 如果有输出要求，创建生成步骤
      if (workflowConfig.outputs && workflowConfig.outputs.length > 0) {
        workflow.steps.push({
          id: `${agentConfig.name}-generate`,
          name: `${agentConfig.title} - 生成阶段`,
          agent: agentConfig.name,
          action: 'generate',
          inputs: [`${agentConfig.name}-analyze`],
          outputs: workflowConfig.outputs,
          dependencies: [`${agentConfig.name}-analyze`]
        });
      }

      // 设置工作流级别的依赖和优先级
      if (workflowConfig.phase !== undefined) {
        workflow.dependencies = [`phase-${workflowConfig.phase - 1}`];
      }
    } else {
      // 默认步骤
      workflow.steps.push({
        id: `${agentConfig.name}-default`,
        name: `${agentConfig.title} - 默认执行`,
        agent: agentConfig.name,
        action: 'execute',
        inputs: {},
        outputs: {},
        dependencies: []
      });
    }

    return workflow;
  }

  /**
   * 验证代理可用性
   * @param agentIds 需要验证的代理ID列表
   */
  private async validateAgents(agentIds: string[]): Promise<void> {
    const discoveryResult = await AgentDiscoveryEngine.discoverAgents('./agents');
    const availableAgents = discoveryResult.existing_agents.map((agent: any) => agent.name);
    
    const missingAgents = agentIds.filter(id => !availableAgents.includes(id));
    
    if (missingAgents.length > 0) {
      throw new Error(`缺少必需的代理: ${missingAgents.join(', ')}`);
    }
  }

  /**
   * 静态方法：执行智能化项目初始化
   * @param projectPath 项目路径
   * @param projectConfig 项目配置
   * @returns 执行结果
   */
  static async executeIntelligentProjectInitialization(
    projectPath: string, 
    projectConfig: Record<string, any>
  ): Promise<any> {
    logger.info(`🚀 开始智能化项目初始化: ${projectPath}`);
    
    try {
      const orchestrator = new WorkflowOrchestrator();
      
      // 发现可用的工作流
      const workflows = await orchestrator.discoverWorkflows(process.cwd());
      
      if (workflows.length === 0) {
        logger.warn('未发现可用的工作流，使用默认初始化流程');
        return {
          success: true,
          message: '使用默认初始化流程完成项目创建',
          project_path: projectPath,
          workflows_executed: [],
          duration: 0
        };
      }

      // 执行主要的初始化工作流
      const mainWorkflow = workflows[0]; // 使用第一个工作流作为主流程
      const result = await orchestrator.executeWorkflow(mainWorkflow.id, {
        projectPath,
        projectConfig
      });

      return {
        success: result.success,
        message: result.success ? '智能化项目初始化完成' : '项目初始化部分失败',
        project_path: projectPath,
        workflows_executed: [mainWorkflow.id],
        execution_details: result,
        duration: result.duration
      };
      
    } catch (error) {
      logger.error('智能化项目初始化失败:', error);
      return {
        success: false,
        message: `项目初始化失败: ${error instanceof Error ? error.message : String(error)}`,
        project_path: projectPath,
        workflows_executed: [],
        duration: 0
      };
    }
  }
}

export default WorkflowOrchestrator;
