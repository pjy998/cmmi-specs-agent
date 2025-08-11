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
    const instructions = `你是流程调度代理(CMMI: IPM - 集成项目管理)。
任务内容：${taskContent}
复杂度：${analysis.complexity}
领域：${analysis.domain.join(', ')}

目标：
  - 协调所有代理完成从想法到实现到测试的闭环
  - 确保CMMI标准合规性
  - 集成各代理输出生成完整文档集

要求：
  1. 分析任务内容，确定需要的代理类型和执行顺序
  2. 监督各代理按照CMMI流程执行任务
  3. 确保文档间的一致性和可追溯性
  4. 生成最终的项目概览和交付清单
  5. 所有输出文档必须包含CMMI过程域标识

执行流程：
  1. 任务分析和代理调度规划
  2. 监督需求分析(RD)过程
  3. 监督技术解决方案(TS)设计
  4. 监督产品集成(PI)和验证(VER)
  5. 生成项目整体交付报告`;

    return {
      name: 'spec-agent',
      role: '规格说明协调代理 - 调度所有代理完成从想法到实现到测试的闭环',
      model: this.modelStrategy.coordinator,
      capabilities: ['workflow_orchestration', 'cmmi_compliance_check', 'document_integration', 'quality_assurance'],
      dependencies: [],
      yaml_content: this.generateYamlContent('spec-agent', '规格说明协调代理', this.modelStrategy.coordinator, 
        ['workflow_orchestration', 'cmmi_compliance_check', 'document_integration', 'quality_assurance'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTasks', 'runTerminal'],
        instructions
      ),
      file_path: `.copilot/agents/spec-agent.yaml`
    };
  }

  private createRequirementsAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是负责需求分析的 Agent(CMMI: RD - 需求开发)。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 从用户输入或问题描述生成结构化的 requirements.md，并写入目标 feature 目录

要求：
  1. 读取并参考工作区已有文档或代码来判断现状与复用点
  2. 生成的 requirements.md 必须包含：
     - 文件头部标签：<!-- CMMI: RD -->
     - 背景与目标(含可量化目标)
     - 范围与约束
     - 功能需求(分级编号，例如 1.1 / 1.2)
     - 非功能需求(性能、安全、可维护性)
     - 验收标准(可测试、可度量)
     - 需求可追溯性矩阵
  3. 输出中文 Markdown
  4. 确保需求的完整性、一致性和可验证性

质量标准：
  - 需求覆盖率：100%
  - 需求可测试性：每个需求都有明确的验收标准
  - 需求可追溯性：建立需求与设计的映射关系`;

    return {
      name: 'requirements-agent',
      role: '需求分析代理 - 生成详细的需求说明文档',
      model: this.modelStrategy.requirements,
      capabilities: ['requirements_analysis', 'business_analysis', 'stakeholder_communication', 'documentation'],
      dependencies: [],
      yaml_content: this.generateYamlContent('requirements-agent', '需求分析师，负责收集、分析和管理项目需求', this.modelStrategy.requirements,
        ['需求分析', '利益相关者管理'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'webSearch'],
        instructions
      ),
      file_path: `.copilot/agents/requirements-agent.yaml`
    };
  }

  private createDesignAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是负责系统设计的 Agent(CMMI: TS - 技术解决方案)。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 基于 requirements.md 和代码库结构生成 design.md

要求：
  1. 检索相关模块与接口，分析现有实现约束
  2. design.md 必须包含：
     - 文件头部标签：<!-- CMMI: TS -->
     - 总体架构(可用 ASCII 或 mermaid 图)
     - 模块划分与接口说明
     - 数据结构与示例
     - 关键算法流程
     - 与需求的映射
     - 实现注意事项与边界条件
  3. 为后续实现生成明确的实现清单
  4. 确保设计的可实现性和可测试性

设计原则：
  - 模块化：高内聚、低耦合
  - 可扩展性：支持未来功能扩展
  - 可维护性：清晰的代码结构和文档
  - 性能优化：考虑关键路径性能`;

    return {
      name: 'design-agent',
      role: '系统设计代理 - 生成技术设计文档',
      model: this.modelStrategy.design,
      capabilities: ['system_design', 'architecture_design', 'technical_specification', 'interface_design'],
      dependencies: ['requirements-agent'],
      yaml_content: this.generateYamlContent('design-agent', '系统设计师，负责架构设计和详细设计', this.modelStrategy.design,
        ['系统架构', '详细设计'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'webSearch'],
        instructions
      ),
      file_path: `.copilot/agents/design-agent.yaml`
    };
  }

  private createCodingAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是负责实现的 Agent(TS 的实现子过程)。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 将 design.md 中的实现清单转为具体代码文件骨架与测试文件

要求：
  1. 解析 design.md 中的实现清单(模块、类、接口、目标路径)
  2. 支持两种工作模式(TDD 或 普通实现)
  3. 每个生成的代码文件头部附注：
     <!-- GENERATED-BY: coding-agent -->
     <!-- CMMI: TS -->
  4. 生成文件清单写入 implementation-manifest.md
  5. 确保代码质量和最佳实践

编码标准：
  - 遵循语言特定的编码规范
  - 编写单元测试覆盖核心功能
  - 添加必要的注释和文档
  - 实现错误处理和边界检查
  - 考虑代码的可读性和可维护性

测试策略：
  - 单元测试：覆盖所有公共方法
  - 集成测试：验证模块间交互
  - 边界测试：测试异常情况和边界值`;

    return {
      name: 'coding-agent',
      role: '代码实现代理 - 生成实现代码和测试',
      model: this.modelStrategy.implementation,
      capabilities: ['code_generation', 'tdd_support', 'unit_testing', 'code_formatting'],
      dependencies: ['design-agent'],
      yaml_content: this.generateYamlContent('coding-agent', '软件开发工程师，负责代码实现和审查', this.modelStrategy.implementation,
        ['代码实现', '代码审查'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTerminal'],
        instructions
      ),
      file_path: `.copilot/agents/coding-agent.yaml`
    };
  }

  private createTestAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是测试执行与报告生成的 Agent(CMMI: VER/VAL - 验证与确认)。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 执行项目测试并生成结构化 test-report.md

要求：
  1. 根据 tasks.md 中的测试任务执行对应命令
  2. 收集输出：
     - 测试通过率
     - 失败用例摘要
     - 性能相关指标
  3. 生成 report：
     - 文件头部标签：<!-- CMMI: VER -->
     - 失败部分包含上下文和修复建议
  4. 执行多层次测试验证

测试层次：
  - 单元测试：验证单个组件功能
  - 集成测试：验证组件间交互
  - 系统测试：验证整体功能
  - 性能测试：验证性能指标
  - 安全测试：验证安全要求

报告内容：
  - 测试执行摘要
  - 测试覆盖率统计
  - 缺陷分析和修复建议
  - 质量评估和风险分析`;

    return {
      name: 'test-agent',
      role: '测试与验证代理 - 执行测试和质量保证',
      model: this.modelStrategy.testing,
      capabilities: ['test_execution', 'test_reporting', 'quality_assurance', 'performance_testing'],
      dependencies: ['coding-agent'],
      yaml_content: this.generateYamlContent('test-agent', '测试工程师，负责测试策略和执行', this.modelStrategy.testing,
        ['测试规划', '测试执行'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTerminal'],
        instructions
      ),
      file_path: `.copilot/agents/test-agent.yaml`
    };
  }

  private createTasksAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是负责任务拆分和执行的 Agent(CMMI: PI/VER/VAL - 产品集成/验证/确认)。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 生成 tasks.md 并在需要时执行构建/测试任务

要求：
  1. 基于 design.md 与 implementation-manifest.md 生成 tasks.md
  2. 将任务按 CMMI 域分组：
     - <!-- CMMI: PI --> 产品集成任务
     - <!-- CMMI: VER --> 验证任务  
     - <!-- CMMI: VAL --> 确认任务
  3. 支持自动执行选定任务并收集输出
  4. 若测试失败，生成失败摘要供修复使用

任务管理策略：
  - 任务分解：将复杂任务分解为可执行的小任务
  - 依赖管理：确保任务执行顺序和依赖关系
  - 进度跟踪：监控任务执行状态和完成度
  - 风险管理：识别和缓解项目风险

执行管理：
  - 构建自动化：配置构建流水线
  - 测试自动化：执行自动化测试套件
  - 部署管理：管理部署流程和环境
  - 质量监控：监控代码质量和性能指标`;

    return {
      name: 'tasks-agent',
      role: '任务管理代理 - 生成和执行任务清单',
      model: this.modelStrategy.implementation,
      capabilities: ['task_planning', 'execution_management', 'build_automation', 'process_coordination'],
      dependencies: ['coding-agent'],
      yaml_content: this.generateYamlContent('tasks-agent', '项目经理，负责任务分解和项目管理', this.modelStrategy.implementation,
        ['任务管理', '项目规划'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTasks', 'runTerminal'],
        instructions
      ),
      file_path: `.copilot/agents/tasks-agent.yaml`
    };
  }

  private createDocumentationAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是负责文档编写的 Agent。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 生成完整的项目文档套件，包括用户手册、开发文档和API文档

要求：
  1. 基于项目代码和设计文档生成用户友好的文档
  2. 创建以下文档类型：
     - README.md：项目概述和快速开始指南
     - 用户手册：详细的使用说明和教程
     - 开发文档：开发环境配置和贡献指南
     - API文档：接口说明和示例代码
  3. 确保文档的准确性和完整性
  4. 使用清晰的结构和格式

文档标准：
  - 结构清晰：合理的章节组织和导航
  - 内容准确：与实际代码保持同步
  - 示例丰富：提供充足的代码示例
  - 格式规范：使用标准的Markdown格式

用户体验：
  - 易于理解：使用简洁明了的语言
  - 循序渐进：从基础到高级的学习路径
  - 问题解决：常见问题和故障排除
  - 更新维护：保持文档的时效性`;

    return {
      name: 'documentation-agent',
      role: '文档代理 - 生成项目文档',
      model: this.modelStrategy.documentation,
      capabilities: ['documentation', 'technical_writing', 'user_guide_creation', 'api_documentation'],
      dependencies: ['design-agent', 'coding-agent'],
      yaml_content: this.generateYamlContent('documentation-agent', '技术文档专家，负责编写用户手册和开发文档', this.modelStrategy.documentation,
        ['documentation', 'technical_writing', 'user_guide_creation', 'api_documentation'],
        ['readFiles', 'writeFiles', 'searchWorkspace'],
        instructions
      ),
      file_path: `.copilot/agents/documentation-agent.yaml`
    };
  }

  private createDeploymentAgent(analysis: TaskAnalysisResult, taskContent: string): AgentConfig {
    const instructions = `你是负责部署和运维的 Agent。
任务内容：${taskContent}
任务领域：${analysis.domain.join(', ')}
复杂度：${analysis.complexity}

目标：
  - 设计和实施完整的部署和运维解决方案

要求：
  1. 分析项目的部署需求和约束
  2. 设计部署架构和流程：
     - CI/CD流水线配置
     - 容器化和编排
     - 环境管理和配置
     - 监控和日志系统
  3. 创建部署文档和操作手册
  4. 实施自动化部署和运维策略

部署策略：
  - 环境隔离：开发、测试、生产环境分离
  - 自动化部署：减少人工干预和错误
  - 滚动更新：确保服务连续性
  - 回滚机制：快速恢复到稳定版本

运维管理：
  - 监控告警：实时监控系统状态
  - 日志管理：集中化日志收集和分析
  - 性能优化：系统性能调优
  - 安全管理：安全策略和漏洞修复

基础设施：
  - 容器化：Docker容器打包和部署
  - 编排调度：Kubernetes集群管理
  - 服务网格：微服务通信和治理
  - 云原生：充分利用云平台能力`;

    return {
      name: 'deployment-agent',
      role: '部署代理 - 处理部署和运维',
      model: this.modelStrategy.deployment,
      capabilities: ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
      dependencies: ['coding-agent', 'test-agent'],
      yaml_content: this.generateYamlContent('deployment-agent', '运维工程师，负责系统部署和运维管理', this.modelStrategy.deployment,
        ['deployment', 'ci_cd', 'infrastructure', 'monitoring'],
        ['readFiles', 'writeFiles', 'searchWorkspace', 'runTerminal'],
        instructions
      ),
      file_path: `.copilot/agents/deployment-agent.yaml`
    };
  }

  private generateYamlContent(name: string, title: string, model: AgentModel, capabilities: string[], tools: string[], instructions: string): string {
    const colors = {
      'spec-agent': 'green',
      'requirements-agent': 'purple', 
      'design-agent': 'blue',
      'coding-agent': 'teal',
      'test-agent': 'orange',
      'documentation-agent': 'indigo',
      'deployment-agent': 'gray',
      'tasks-agent': 'red'
    };
    
    const color = colors[name as keyof typeof colors] || 'blue';
    
    const examples = this.generateExamples(name);
    
    return `version: 1
name: ${name}
title: ${title}
description: ${title}
model: ${model}
color: ${color}
language: zh-CN
capabilities:${capabilities.map(cap => `\n  - ${cap}`).join('')}
tools:${tools.map(tool => `\n  - ${tool}`).join('')}
entrypoints:
  - id: default
    description: ${this.getEntrypointDescription(name)}
    examples:${examples.map(example => `\n      - "${example}"`).join('')}
instructions: |-
  ${instructions}`;
  }

  private generateExamples(agentName: string): string[] {
    const exampleMap: { [key: string]: string[] } = {
      'spec-agent': [
        "为用户权限管理系统生成完整的CMMI文档集",
        "分析电商平台需求并协调各代理完成文档生成"
      ],
      'requirements-agent': [
        "为权限缓存优化生成需求说明",
        "分析用户认证系统的功能和非功能需求"
      ],
      'design-agent': [
        "为权限缓存优化生成系统设计",
        "设计微服务架构的API网关方案"
      ],
      'coding-agent': [
        "为 design.md 生成缓存模块骨架并创建单元测试",
        "实现用户认证服务的核心功能模块"
      ],
      'test-agent': [
        "为权限缓存 feature 运行测试并生成报告",
        "执行API接口的集成测试和性能测试"
      ],
      'documentation-agent': [
        "为项目生成完整的用户手册和开发文档",
        "编写API文档和部署指南"
      ],
      'deployment-agent': [
        "为微服务项目配置CI/CD流水线",
        "设计容器化部署和监控方案"
      ],
      'tasks-agent': [
        "为权限缓存优化生成任务清单并运行构建",
        "管理项目里程碑和交付计划"
      ]
    };
    
    return exampleMap[agentName] || ["完成相关任务"];
  }

  private getEntrypointDescription(agentName: string): string {
    const descriptionMap: { [key: string]: string } = {
      'spec-agent': '协调多代理完成完整的CMMI文档生成流程',
      'requirements-agent': '从产品构想生成需求说明',
      'design-agent': '从需求生成设计文档',
      'coding-agent': '从设计生成实现骨架与测试',
      'test-agent': '运行测试并生成报告',
      'documentation-agent': '生成项目文档和用户指南',
      'deployment-agent': '配置部署和运维方案',
      'tasks-agent': '从设计与实现清单生成任务清单并执行相关任务'
    };
    
    return descriptionMap[agentName] || '执行相关任务';
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
