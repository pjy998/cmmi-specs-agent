/**
 * 智能代理生成器 - 基于任务分析结果生成对应的代理配置
 */

import { AgentConfig, TaskAnalysisResult, AgentModel } from '../types/agent.js';
import { TaskAnalyzer } from '../utils/task-analyzer.js';

export class AgentGenerator {
  private taskAnalyzer: TaskAnalyzer;

  // 模型分配策略 - 使用正确的模型名称
  private modelStrategy = {
    coordinator: 'gpt-4.1' as AgentModel,      // 需要强逻辑和决策能力
    requirements: 'claude-sonnet-4' as AgentModel, // 需要深度理解和分析
    design: 'claude-sonnet-4' as AgentModel,   // 需要结构化思维
    implementation: 'gpt-4.1' as AgentModel,   // 需要编程和逻辑能力
    testing: 'gpt-4.5' as AgentModel,          // 平衡成本和质量
    documentation: 'claude-sonnet-4' as AgentModel, // 需要清晰表达
    deployment: 'gpt-4.1' as AgentModel        // 需要系统性思维
  };

  constructor() {
    this.taskAnalyzer = new TaskAnalyzer();
  }

  /**
   * 基于任务内容生成完整的代理配置集
   */
  async generateAgentConfigs(taskContent: string, _projectPath?: string): Promise<{
    analysis: TaskAnalysisResult;
    configs: { [agentName: string]: AgentConfig };
    executionPlan: {
      phases: Array<{
        name: string;
        agents: string[];
        execution_mode: 'sequential' | 'parallel';
        dependencies: string[];
      }>;
      total_steps: number;
      estimated_time: string;
    };
  }> {
    // 1. 分析任务
    const analysis = this.taskAnalyzer.analyze(taskContent);
    
    // 2. 生成需要的代理配置
    const configs: { [agentName: string]: AgentConfig } = {};

    // 总是创建协调器代理
    configs['spec-agent'] = this.createSpecAgent(analysis, taskContent);

    // 根据分析结果创建其他代理
    if (analysis.requires_agents.requirements) {
      configs['requirements-agent'] = this.createRequirementsAgent(analysis, taskContent);
    }

    if (analysis.requires_agents.design) {
      configs['design-agent'] = this.createDesignAgent(analysis, taskContent);
    }

    if (analysis.requires_agents.implementation) {
      configs['coding-agent'] = this.createCodingAgent(analysis, taskContent);
    }

    if (analysis.requires_agents.testing) {
      configs['test-agent'] = this.createTestAgent(analysis, taskContent);
    }

    if (analysis.requires_agents.documentation) {
      configs['documentation-agent'] = this.createDocumentationAgent(analysis, taskContent);
    }

    if (analysis.requires_agents.deployment) {
      configs['deployment-agent'] = this.createDeploymentAgent(analysis, taskContent);
    }

    // 创建任务管理代理（如果有实现或测试需求）
    if (analysis.requires_agents.implementation || analysis.requires_agents.testing) {
      configs['tasks-agent'] = this.createTasksAgent(analysis, taskContent);
    }

    // 3. 生成执行计划
    const executionPlan = this.createExecutionPlan(configs, analysis);

    return {
      analysis,
      configs,
      executionPlan
    };
  }

  private createSpecAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    return {
      name: 'spec-agent',
      role: '规格说明协调代理 - 调度所有代理完成从想法到实现到测试的闭环',
      model: this.modelStrategy.coordinator,
      capabilities: ['workflow_orchestration', 'cmmi_compliance_check', 'document_integration', 'quality_assurance'],
      dependencies: [],
      yaml_content: this.generateYamlContent('spec-agent', '规格说明协调代理', this.modelStrategy.coordinator, 
        ['workflow_orchestration', 'cmmi_compliance_check', 'document_integration', 'quality_assurance'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTasks', 'runTerminal'],
        `你是流程调度代理。任务内容：${taskContent}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/spec-agent.yaml`
    };
  }

  private createRequirementsAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'requirements-agent',
      role: '需求分析代理 - 生成详细的需求说明文档',
      model: this.modelStrategy.requirements,
      capabilities: ['requirements_analysis', 'business_analysis', 'stakeholder_communication', 'documentation'],
      dependencies: [],
      yaml_content: this.generateYamlContent('requirements-agent', '需求分析代理', this.modelStrategy.requirements,
        ['requirements_analysis', 'business_analysis', 'stakeholder_communication', 'documentation'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'webSearch'],
        `你是负责需求分析的 Agent（CMMI: RD）。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/requirements-agent.yaml`
    };
  }

  private createDesignAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'design-agent',
      role: '系统设计代理 - 生成技术设计文档',
      model: this.modelStrategy.design,
      capabilities: ['system_design', 'architecture_design', 'technical_specification', 'interface_design'],
      dependencies: ['requirements-agent'],
      yaml_content: this.generateYamlContent('design-agent', '系统设计代理', this.modelStrategy.design,
        ['system_design', 'architecture_design', 'technical_specification', 'interface_design'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'webSearch'],
        `你是负责系统设计的 Agent（CMMI: TS）。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/design-agent.yaml`
    };
  }

  private createCodingAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'coding-agent',
      role: '代码实现代理 - 生成实现代码和测试',
      model: this.modelStrategy.implementation,
      capabilities: ['code_generation', 'tdd_support', 'unit_testing', 'code_formatting'],
      dependencies: ['design-agent'],
      yaml_content: this.generateYamlContent('coding-agent', '代码实现代理', this.modelStrategy.implementation,
        ['code_generation', 'tdd_support', 'unit_testing', 'code_formatting'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTerminal'],
        `你是负责代码实现的 Agent。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/coding-agent.yaml`
    };
  }

  private createTestAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'test-agent',
      role: '测试与验证代理 - 执行测试和质量保证',
      model: this.modelStrategy.testing,
      capabilities: ['test_execution', 'test_reporting', 'quality_assurance', 'performance_testing'],
      dependencies: ['coding-agent'],
      yaml_content: this.generateYamlContent('test-agent', '测试与验证代理', this.modelStrategy.testing,
        ['test_execution', 'test_reporting', 'quality_assurance', 'performance_testing'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTerminal'],
        `你是负责测试与验证的 Agent（CMMI: VER/VAL）。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/test-agent.yaml`
    };
  }

  private createTasksAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'tasks-agent',
      role: '任务管理代理 - 生成和执行任务清单',
      model: this.modelStrategy.implementation,
      capabilities: ['task_planning', 'execution_management', 'build_automation', 'process_coordination'],
      dependencies: ['coding-agent'],
      yaml_content: this.generateYamlContent('tasks-agent', '任务管理代理', this.modelStrategy.implementation,
        ['task_planning', 'execution_management', 'build_automation', 'process_coordination'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTasks', 'runTerminal'],
        `你是负责任务管理的 Agent（CMMI: PI）。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/tasks-agent.yaml`
    };
  }

  private createDocumentationAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'documentation-agent',
      role: '文档代理 - 生成项目文档',
      model: this.modelStrategy.documentation,
      capabilities: ['documentation', 'technical_writing', 'user_guide_creation', 'api_documentation'],
      dependencies: ['design-agent', 'coding-agent'],
      yaml_content: this.generateYamlContent('documentation-agent', '文档代理', this.modelStrategy.documentation,
        ['documentation', 'technical_writing', 'user_guide_creation', 'api_documentation'],
        ['readFiles', 'writeFiles', 'searchWorkspace'],
        `你是负责文档编写的 Agent。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/documentation-agent.yaml`
    };
  }

  private createDeploymentAgent(analysis: TaskAnalysisResult, _taskContent: string): AgentConfig {
    return {
      name: 'deployment-agent',
      role: '部署代理 - 处理部署和运维',
      model: this.modelStrategy.deployment,
      capabilities: ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
      dependencies: ['coding-agent', 'test-agent'],
      yaml_content: this.generateYamlContent('deployment-agent', '部署代理', this.modelStrategy.deployment,
        ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTerminal'],
        `你是负责部署和运维的 Agent。任务领域：${analysis.domain.join(', ')}。复杂度：${analysis.complexity}。`
      ),
      file_path: `.copilot/agents/deployment-agent.yaml`
    };
  }

  private generateYamlContent(name: string, title: string, model: AgentModel, capabilities: string[], tools: string[], instructions: string): string {
    return `version: 1
name: ${name}
title: ${title}
description: ${title}
model: ${model}
color: blue
language: zh-CN
capabilities:${capabilities.map(cap => `\n  - ${cap}`).join('')}
tools:${tools.map(tool => `\n  - ${tool}`).join('')}
entrypoints:
  - id: default
    description: ${title}
instructions: |-
  ${instructions}`;
  }

  private createExecutionPlan(configs: { [agentName: string]: AgentConfig }, analysis: TaskAnalysisResult) {
    const phases = [];
    const agentNames = Object.keys(configs);

    // Phase 1: 分析阶段
    if (configs['requirements-agent']) {
      phases.push({
        name: '需求分析阶段',
        agents: ['requirements-agent'],
        execution_mode: 'sequential' as const,
        dependencies: []
      });
    }

    // Phase 2: 设计阶段
    if (configs['design-agent']) {
      phases.push({
        name: '系统设计阶段',
        agents: ['design-agent'],
        execution_mode: 'sequential' as const,
        dependencies: configs['requirements-agent'] ? ['requirements-agent'] : []
      });
    }

    // Phase 3: 实现阶段
    const implementationAgents = [];
    if (configs['coding-agent']) implementationAgents.push('coding-agent');
    if (configs['documentation-agent']) implementationAgents.push('documentation-agent');
    
    if (implementationAgents.length > 0) {
      phases.push({
        name: '实现阶段',
        agents: implementationAgents,
        execution_mode: implementationAgents.length > 1 ? 'parallel' as const : 'sequential' as const,
        dependencies: configs['design-agent'] ? ['design-agent'] : []
      });
    }

    // Phase 4: 验证阶段
    const verificationAgents = [];
    if (configs['test-agent']) verificationAgents.push('test-agent');
    if (configs['tasks-agent']) verificationAgents.push('tasks-agent');

    if (verificationAgents.length > 0) {
      phases.push({
        name: '验证阶段',
        agents: verificationAgents,
        execution_mode: 'sequential' as const,
        dependencies: implementationAgents
      });
    }

    // Phase 5: 部署阶段
    if (configs['deployment-agent']) {
      phases.push({
        name: '部署阶段',
        agents: ['deployment-agent'],
        execution_mode: 'sequential' as const,
        dependencies: verificationAgents.length > 0 ? verificationAgents : implementationAgents
      });
    }

    // Phase 6: 协调整合阶段
    phases.push({
      name: '协调整合阶段',
      agents: ['spec-agent'],
      execution_mode: 'sequential' as const,
      dependencies: agentNames.filter(name => name !== 'spec-agent')
    });

    return {
      phases,
      total_steps: phases.reduce((sum, phase) => sum + phase.agents.length, 0),
      estimated_time: analysis.estimated_duration
    };
  }
}
