/**
 * Simplified Advanced Tool Handlers with i18n support
 * Core functionality for the multi-agent orchestrator
 */

import { TaskAnalyzer } from '../utils/task-analyzer.js';
import { I18n } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
import { FileOperations, DocumentTemplates } from '../utils/file-operations.js';
import { IntelligentTranslationService, TranslationRequest, Language } from '../utils/intelligent-translation.js';
import { AgentGenerator } from '../config/agent-generator.js';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class AdvancedToolHandlers {
  /**
   * Smart Agent Generator - 智能生成VS Code代理配置
   */
  static async smartAgentGenerator(args: any): Promise<any> {
    try {
      const { 
        task_content, 
        project_path = process.cwd(),
        generation_mode = 'smart'
      } = args;

      if (!task_content) {
        throw new Error('task_content is required');
      }

      // 自动检测语言
      I18n.autoSetLanguage(task_content);
      logger.info(`Language detected: ${I18n.getLanguage()}`);

      const generator = new AgentGenerator();
      const result = await generator.generateAgentConfigs(task_content, project_path);

      // 确保.copilot/agents目录存在
      const agentsDir = path.join(project_path, '.copilot', 'agents');
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
        logger.info(`Created VS Code agents directory: ${agentsDir}`);
      }

      // 生成agent配置文件
      const createdAgents = [];
      for (const [agentName, config] of Object.entries(result.configs)) {
        const agentPath = path.join(agentsDir, `${agentName}.yaml`);
        
        try {
          fs.writeFileSync(agentPath, config.yaml_content, 'utf8');
          createdAgents.push({
            name: agentName,
            path: agentPath,
            role: config.role,
            model: config.model,
            capabilities: config.capabilities
          });
          logger.info(`Created agent: ${agentPath}`);
        } catch (error) {
          logger.error(`Failed to create agent ${agentName}:`, error);
        }
      }

      return {
        success: true,
        message: I18n.getLanguage() === 'zh' 
          ? `智能代理生成成功: ${createdAgents.length} 个代理已创建`
          : `Smart agents generated successfully: ${createdAgents.length} agents created`,
        task_analysis: result.analysis,
        execution_plan: result.executionPlan,
        created_agents: createdAgents,
        agents_directory: agentsDir,
        generation_mode,
        language: I18n.getLanguage()
      };

    } catch (error) {
      logger.error('Smart agent generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        language: I18n.getLanguage()
      };
    }
  }

  /**
   * 分析任务复杂度和推荐代理 (支持国际化)
   */
  static async analyzeTask(args: any): Promise<any> {
    try {
      const { task, task_content, language = 'auto' } = args;
      const content = task || task_content;
      
      if (!content) {
        // 自动检测语言或使用参数设置
        if (language === 'auto') {
          I18n.autoSetLanguage('');
        } else {
          I18n.setLanguage(language);
        }
        throw new Error(I18n.getError('task_content_required'));
      }

      // 自动检测语言
      if (language === 'auto') {
        I18n.autoSetLanguage(content);
      } else {
        I18n.setLanguage(language);
      }

      const analyzer = new TaskAnalyzer();
      const analysis = analyzer.analyze(content);
      
      logger.info(I18n.getSuccess('task_analyzed'), { 
        complexity: analysis.complexity,
        language: I18n.getLanguage()
      });
      
      return {
        success: true,
        required_agents: analysis.requires_agents,
        complexity: analysis.complexity,
        estimated_duration: analysis.estimated_duration,
        domain: analysis.domain,
        keywords: analysis.keywords,
        message: I18n.getSuccess('task_analyzed')
      };
    } catch (error) {
      logger.error('Error analyzing task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : I18n.getError('execution_failed')
      };
    }
  }

  /**
   * 验证代理配置文件
   */
  static async validateAgentConfigs(args: any): Promise<any> {
    try {
      const { config_path } = args;
      
      if (!config_path) {
        throw new Error('config_path is required');
      }

      if (!fs.existsSync(config_path)) {
        return {
          success: false,
          error: 'Config path does not exist',
          total_files: 0,
          valid_count: 0,
          invalid_count: 0
        };
      }

      const files = fs.readdirSync(config_path)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
      
      let validCount = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(config_path, file), 'utf8');
          if (content.includes('name:') && content.includes('model:')) {
            validCount++;
          } else {
            errors.push(`${file}: Missing required fields`);
          }
        } catch (error) {
          errors.push(`${file}: ${error}`);
        }
      }

      logger.info('Config validation completed', { 
        total: files.length, 
        valid: validCount 
      });

      return {
        success: true,
        total_files: files.length,
        valid_count: validCount,
        invalid_count: files.length - validCount,
        errors: errors
      };
    } catch (error) {
      logger.error('Error validating configs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 初始化标准CMMI代理 (支持国际化)
   */
  static async initCmmiAgents(args: any): Promise<any> {
    try {
      const { project_path = './project', language = 'auto' } = args;
      
      // 设置语言
      if (language === 'auto') {
        I18n.autoSetLanguage('');
      } else {
        I18n.setLanguage(language);
      }
      
      // 确保项目目录存在
      if (!fs.existsSync(project_path)) {
        fs.mkdirSync(project_path, { recursive: true });
      }

      const agentsDir = path.join(project_path, 'agents');
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
      }

      const cmmiAgents = [
        {
          name: 'requirements-agent',
          role: 'Requirements Analyst',
          model: 'gpt-4.1',
          capabilities: ['requirement_analysis', 'stakeholder_management'],
          description: I18n.getDescription('requirements_agent'),
          instructions: I18n.getLanguage() === 'zh' ? 
            `你是负责需求分析的 Agent(CMMI: RD).
目标:
  - 从用户输入或问题描述生成结构化的 requirements.md,并写入目标 feature 目录.
要求:
  1. 读取并参考工作区已有文档或代码来判断现状与复用点.
  2. 生成的 requirements.md 必须包含:
     - 文件头部标签:<!-- CMMI: RD -->
     - 背景与目标(含可量化目标)
     - 范围与约束
     - 功能需求(分级编号,例如 1.1 / 1.2)
     - 非功能需求(性能、安全、可维护性)
     - 验收标准(可测试、可度量)
     - 需求可追溯性矩阵
  3. 输出中文 Markdown` : 
            `You are a Requirements Analysis Agent (CMMI: RD).
Goal:
  - Generate structured requirements.md from user input or problem description.
Requirements:
  1. Read and reference existing workspace documents or code to determine status and reuse points.
  2. Generated requirements.md must include:
     - File header tag: <!-- CMMI: RD -->
     - Background and objectives (including quantifiable goals)
     - Scope and constraints  
     - Functional requirements (hierarchical numbering, e.g. 1.1 / 1.2)
     - Non-functional requirements (performance, security, maintainability)
     - Acceptance criteria (testable, measurable)
     - Requirements traceability matrix
  3. Output in English Markdown`
        },
        {
          name: 'design-agent', 
          role: 'System Designer',
          model: 'gpt-4.1',
          capabilities: ['system_architecture', 'detailed_design'],
          description: I18n.getDescription('design_agent'),
          instructions: I18n.getLanguage() === 'zh' ?
            `你是负责系统设计的 Agent(CMMI: TS).
目标:
  - 基于 requirements.md 和代码库结构生成 design.md.
要求:
  1. 检索相关模块与接口,分析现有实现约束.
  2. design.md 必须包含:
     - 文件头部标签:<!-- CMMI: TS -->
     - 总体架构(可用 ASCII 或 mermaid 图)
     - 模块划分与接口说明
     - 数据结构与示例
     - 关键算法流程
     - 与需求的映射
     - 实现注意事项与边界条件
  3. 为后续实现生成明确的实现清单` :
            `You are a System Design Agent (CMMI: TS).
Goal:
  - Generate design.md based on requirements.md and codebase structure.
Requirements:
  1. Search for relevant modules and interfaces, analyze existing implementation constraints.
  2. design.md must include:
     - File header tag: <!-- CMMI: TS -->
     - Overall architecture (ASCII or mermaid diagrams)
     - Module division and interface descriptions
     - Data structures and examples
     - Key algorithm flows
     - Mapping to requirements
     - Implementation considerations and boundary conditions
  3. Generate clear implementation checklist for subsequent implementation`
        },
        {
          name: 'coding-agent',
          role: 'Software Developer', 
          model: 'gpt-4.1',
          capabilities: ['code_implementation', 'code_review'],
          description: I18n.getDescription('coding_agent'),
          instructions: I18n.getLanguage() === 'zh' ?
            `你是负责实现的 Agent(TS 的实现子过程).
目标:
  - 将 design.md 中的实现清单转为具体代码文件骨架与测试文件.
要求:
  1. 解析 design.md 中的实现清单(模块、类、接口、目标路径).
  2. 支持两种工作模式(TDD 或 普通实现).
  3. 每个生成的代码文件头部附注:
     <!-- GENERATED-BY: coding-agent -->
     <!-- CMMI: TS -->
  4. 生成文件清单写入 implementation-manifest.md` :
            `You are an Implementation Agent (TS implementation subprocess).
Goal:
  - Convert implementation checklist from design.md into specific code file skeletons and test files.
Requirements:
  1. Parse implementation checklist from design.md (modules, classes, interfaces, target paths).
  2. Support two working modes (TDD or normal implementation).
  3. Each generated code file header annotation:
     <!-- GENERATED-BY: coding-agent -->
     <!-- CMMI: TS -->
  4. Generate file manifest written to implementation-manifest.md`
        },
        {
          name: 'tasks-agent',
          role: 'Project Manager',
          model: 'gpt-4.1', 
          capabilities: ['task_management', 'project_planning'],
          description: I18n.getDescription('tasks_agent'),
          instructions: I18n.getLanguage() === 'zh' ?
            `你是负责任务拆分和执行的 Agent(CMMI: PI / VER / VAL).
目标:
  - 生成 tasks.md 并在需要时执行构建/测试任务.
要求:
  1. 基于 design.md 与 implementation-manifest.md 生成 tasks.md.
  2. 将任务按 CMMI 域分组:
     - <!-- CMMI: PI --> 产品集成任务
     - <!-- CMMI: VER --> 验证任务  
     - <!-- CMMI: VAL --> 确认任务
  3. 支持自动执行选定任务并收集输出.
  4. 若测试失败,生成失败摘要供修复使用` :
            `You are a Task Breakdown and Execution Agent (CMMI: PI / VER / VAL).
Goal:
  - Generate tasks.md and execute build/test tasks when needed.
Requirements:
  1. Generate tasks.md based on design.md and implementation-manifest.md.
  2. Group tasks by CMMI domains:
     - <!-- CMMI: PI --> Product integration tasks
     - <!-- CMMI: VER --> Verification tasks
     - <!-- CMMI: VAL --> Validation tasks
  3. Support automatic execution of selected tasks and collect output.
  4. If tests fail, generate failure summary for repair use`
        },
        {
          name: 'test-agent',
          role: 'Test Engineer',
          model: 'gpt-4.1',
          capabilities: ['test_planning', 'test_execution'],
          description: I18n.getDescription('test_agent'),
          instructions: I18n.getLanguage() === 'zh' ?
            `你是测试执行与报告生成的 Agent(CMMI: VER / VAL).
目标:
  - 执行项目测试并生成结构化 test-report.md.
要求:
  1. 根据 tasks.md 中的测试任务执行对应命令.
  2. 收集输出:
     - 测试通过率
     - 失败用例摘要
     - 性能相关指标
  3. 生成 report:
     - 文件头部标签:<!-- CMMI: VER -->
     - 失败部分包含上下文和修复建议` :
            `You are a Test Execution and Report Generation Agent (CMMI: VER / VAL).
Goal:
  - Execute project tests and generate structured test-report.md.
Requirements:
  1. Execute corresponding commands based on test tasks in tasks.md.
  2. Collect output:
     - Test pass rate
     - Failed case summary
     - Performance-related metrics
  3. Generate report:
     - File header tag: <!-- CMMI: VER -->
     - Failed sections include context and repair suggestions`
        },
        {
          name: 'spec-agent',
          role: 'Technical Writer',
          model: 'gpt-4.1',
          capabilities: ['documentation', 'specification'],
          description: I18n.getDescription('spec_agent'),
          instructions: I18n.getLanguage() === 'zh' ?
            `你是流程调度代理(全流程协调器).
目标:
  - 调度其他 agents 完成从想法到实现到测试的闭环.
流程:
  1. 调用 requirements-agent 生成 requirements.md
  2. 调用 design-agent 生成 design.md  
  3. 调用 coding-agent 生成实现骨架
  4. 调用 tasks-agent 生成 tasks.md
  5. 调用 test-agent 执行测试
  6. 生成 cmmi-checklist.md 检查表
  7. 生成合并产物 spec-all.md
支持 quickMode 一键快速完成所有步骤` :
            `You are a Process Orchestration Agent (full-process coordinator).
Goal:
  - Schedule other agents to complete the closed loop from idea to implementation to testing.
Process:
  1. Call requirements-agent to generate requirements.md
  2. Call design-agent to generate design.md
  3. Call coding-agent to generate implementation skeleton
  4. Call tasks-agent to generate tasks.md
  5. Call test-agent to execute tests
  6. Generate cmmi-checklist.md checklist
  7. Generate merged artifact spec-all.md
Support quickMode for one-click completion of all steps`
        }
      ];

      const createdAgents = [];

      for (const agent of cmmiAgents) {
        const agentConfig = `version: 1
name: ${agent.name}
title: ${I18n.getLanguage() === 'zh' ? agent.description : agent.role}
description: ${agent.description}
model: ${agent.model}
color: ${this.getAgentColor(agent.name)}
language: ${I18n.getLanguage() === 'zh' ? 'zh-CN' : 'en'}
capabilities:
${I18n.getLanguage() === 'zh' ? 
  agent.capabilities.map(cap => `  - ${I18n.getCapability(cap as any)}`).join('\n') :
  agent.capabilities.map(cap => `  - ${cap}`).join('\n')
}${agent.name === 'spec-agent' ? `
dependencies:
${['requirements-agent', 'design-agent', 'coding-agent', 'tasks-agent', 'test-agent']
  .filter(dep => dep !== agent.name)
  .map(dep => `  - ${dep}`).join('\n')}` : ''}
entrypoints:
  - id: default
    description: ${I18n.getLanguage() === 'zh' ? 
      this.getAgentEntryDescription(agent.name, 'zh') : 
      this.getAgentEntryDescription(agent.name, 'en')}
    examples:
      - "${I18n.getLanguage() === 'zh' ? 
          this.getAgentExample(agent.name, 'zh') : 
          this.getAgentExample(agent.name, 'en')}"
instructions: |-
  ${agent.instructions}
`;

        const agentPath = path.join(agentsDir, `${agent.name}.yaml`);
        fs.writeFileSync(agentPath, agentConfig);
        createdAgents.push({
          name: agent.name,
          path: agentPath,
          role: agent.role,
          description: agent.description
        });
      }

      logger.info(I18n.getSuccess('agents_initialized'), { 
        count: createdAgents.length,
        language: I18n.getLanguage()
      });

      return {
        success: true,
        created_agents: createdAgents,
        agents_directory: agentsDir,
        language: I18n.getLanguage(),
        message: I18n.formatSuccess('agents_initialized', `${createdAgents.length} CMMI ${I18n.getLabel('agents')}`)
      };
    } catch (error) {
      logger.error('Error initializing CMMI agents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : I18n.getError('execution_failed')
      };
    }
  }

  /**
   * 智能翻译文档内容
   */
  private static async translateDocumentContent(
    content: string, 
    documentType: 'requirements' | 'design' | 'tasks' | 'tests' | 'implementation',
    taskLanguage: Language
  ): Promise<string> {
    try {
      // 如果任务语言是中文，则将英文模板翻译为中文
      if (taskLanguage === 'zh') {
        const translationService = IntelligentTranslationService.getInstance();
        
        const request: TranslationRequest = {
          content,
          sourceLanguage: 'en' as Language,
          targetLanguage: 'zh' as Language,
          context: {
            domain: 'technical',
            documentType: documentType
          }
        };

        const result = await translationService.translate(request);
        logger.info(`Document translated: ${documentType} (EN -> ZH)`);
        return result.translatedContent;
      }
      
      // 如果任务语言是英文，保持原文
      return content;
    } catch (error) {
      logger.error(`Translation failed for ${documentType}:`, error);
      // 翻译失败时返回原文
      return content;
    }
  }

  /**
   * 执行多代理工作流 - 系统核心功能
   */
  static async executeMultiAgentWorkflow(args: any): Promise<any> {
    try {
      const {
        task_content,
        project_path = './project',
        execution_mode = 'smart',
        selected_agents,
        context_sharing = true,
        max_iterations = 10
      } = args;

      if (!task_content) {
        throw new Error('task_content is required');
      }

      // 自动检测并设置语言
      I18n.autoSetLanguage(task_content);
      logger.info(`Language detected and set to: ${I18n.getLanguage()}`);

      const executionId = uuidv4();
      
      // 从任务内容中提取特征名称
      const featureName = this.extractFeatureName(task_content);
      
      logger.info('Starting multi-agent workflow execution', { 
        executionId, 
        task: task_content.substring(0, 100),
        projectPath: project_path,
        featureName 
      });

      // 1. 分析任务并确定需要的代理
      let requiredAgents = selected_agents;
      if (!requiredAgents || requiredAgents.length === 0) {
        // 确保完整的CMMI文档生成 - 始终包含所有核心代理
        requiredAgents = [
          'requirements-agent',  // 需求分析 (RD)
          'design-agent',        // 设计文档 (TS) 
          'tasks-agent',         // 任务管理 (PI)
          'test-agent',          // 测试计划 (VER)
          'coding-agent'         // 实现指南 (TS)
        ];
        
        logger.info('Using complete CMMI agent set for full documentation generation');
      }

      // 2. 检查代理配置是否存在
      // 代理配置在项目根目录，而不是在任务输出目录
      const projectRoot = process.cwd();
      const agentsDir = path.join(projectRoot, 'agents');
      const availableAgents = [];
      
      if (fs.existsSync(agentsDir)) {
        for (const agentName of requiredAgents) {
          const agentPath = path.join(agentsDir, `${agentName}.yaml`);
          if (fs.existsSync(agentPath)) {
            availableAgents.push({
              name: agentName,
              path: agentPath,
              config: this.loadAgentConfig(agentPath)
            });
          }
        }
      }

      if (availableAgents.length === 0) {
        return {
          success: false,
          error: 'No valid agent configurations found. Please run init_cmmi_agents first.',
          execution_id: executionId
        };
      }

      // 3. 创建执行计划
      const executionPlan = this.createExecutionPlan(
        availableAgents, 
        task_content, 
        execution_mode
      );

      // 4. 执行工作流
      const results = await this.executeWorkflowSteps(
        executionPlan,
        context_sharing,
        max_iterations,
        executionId,
        project_path,
        featureName
      );

      logger.info('Multi-agent workflow completed', { 
        executionId, 
        totalSteps: results.steps.length 
      });

      return {
        success: true,
        execution_id: executionId,
        task_content,
        execution_mode,
        agents_used: availableAgents.map(a => a.name),
        execution_plan: executionPlan,
        results: results.steps,
        consolidated_output: results.consolidatedOutput,
        total_execution_time: results.totalTime,
        status: results.status
      };

    } catch (error) {
      logger.error('Error executing multi-agent workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 从任务内容中提取特征名称 - 支持中文
   */
  private static extractFeatureName(taskContent: string): string {
    // 优先提取英文关键词
    const englishWords = taskContent.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    if (englishWords.length > 0) {
      return englishWords.slice(0, 3).join('-');
    }
    
    // 如果没有英文词，则处理中文
    // 移除标点符号，保留中文字符
    const cleanText = taskContent.replace(/[^\u4e00-\u9fff\w\s]/g, '');
    
    // 中文任务的简化处理
    if (/[\u4e00-\u9fff]/.test(cleanText)) {
      // 提取关键词：认证、系统、JWT等
      const keywords = [];
      if (cleanText.includes('认证') || cleanText.includes('登录') || cleanText.includes('用户')) {
        keywords.push('user-auth');
      }
      if (cleanText.includes('JWT') || cleanText.includes('jwt')) {
        keywords.push('jwt');
      }
      if (cleanText.includes('系统')) {
        keywords.push('system');
      }
      
      return keywords.length > 0 ? keywords.join('-') : 'feature';
    }
    
    return 'feature';
  }

  /**
   * 加载代理配置
   */
  private static loadAgentConfig(configPath: string): any {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      // 简单的YAML解析（生产环境应使用yaml库）
      const lines = content.split('\n');
      const config: any = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, ...valueParts] = line.split(':');
          const value = valueParts.join(':').trim();
          if (value && key && !line.startsWith(' ') && !line.startsWith('#')) {
            config[key.trim()] = value;
          }
        }
      }
      
      return config;
    } catch (error) {
      logger.error(`Error loading agent config ${configPath}:`, error);
      return {};
    }
  }

  /**
   * 创建执行计划
   */
  private static createExecutionPlan(agents: any[], task: string, mode: string): any {
    const steps = [];
    
    if (mode === 'sequential' || mode === 'smart') {
      // CMMI标准流程：需求 -> 设计 -> 编码 -> 测试 -> 文档
      const orderMap = {
        'tasks-agent': 0,        // 首先进行任务分解
        'requirements-agent': 1,  // 需求分析
        'design-agent': 2,       // 系统设计
        'coding-agent': 3,       // 代码实现
        'test-agent': 4,         // 测试验证
        'spec-agent': 5          // 文档规范
      };

      agents.sort((a, b) => (orderMap[a.name as keyof typeof orderMap] || 99) - (orderMap[b.name as keyof typeof orderMap] || 99));
      
      for (let i = 0; i < agents.length; i++) {
        steps.push({
          step: i + 1,
          agent: agents[i].name,
          role: agents[i].config.title || agents[i].name,
          dependencies: i > 0 ? [agents[i-1].name] : [],
          input_context: i === 0 ? task : `Previous step output + ${task}`
        });
      }
    } else if (mode === 'parallel') {
      // 并行执行所有代理
      for (let i = 0; i < agents.length; i++) {
        steps.push({
          step: i + 1,
          agent: agents[i].name,
          role: agents[i].config.title || agents[i].name,
          dependencies: [],
          input_context: task
        });
      }
    }

    return {
      total_steps: steps.length,
      execution_mode: mode,
      steps
    };
  }

  /**
   * 执行工作流步骤
   */
  private static async executeWorkflowSteps(
    plan: any, 
    contextSharing: boolean, 
    _maxIterations: number, 
    executionId: string,
    projectPath?: string,
    featureName?: string
  ): Promise<any> {
    const startTime = Date.now();
    const results = [];
    let sharedContext = '';

    for (const step of plan.steps) {
      try {
        logger.info(`Executing step ${step.step}: ${step.agent}`, { executionId });
        
        // 构建输入上下文
        let inputContext = step.input_context;
        if (contextSharing && sharedContext) {
          inputContext = `${sharedContext}\n\nCurrent Task: ${step.input_context}`;
        }

        // 执行代理（支持真实文档生成）
        const stepResult = await this.simulateAgentExecution(
          step.agent,
          inputContext,
          step.role,
          projectPath,
          featureName
        );

        results.push({
          step: step.step,
          agent: step.agent,
          role: step.role,
          input: inputContext,
          output: stepResult.output,
          execution_time: stepResult.executionTime,
          status: stepResult.status,
          timestamp: new Date().toISOString()
        });

        // 更新共享上下文
        if (contextSharing && stepResult.status === 'success') {
          sharedContext += `\n\n[${step.agent} Output]:\n${stepResult.output}`;
        }

      } catch (error) {
        logger.error(`Error in step ${step.step}:`, error);
        results.push({
          step: step.step,
          agent: step.agent,
          role: step.role,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successfulSteps = results.filter(r => r.status === 'success').length;
    
    return {
      steps: results,
      consolidatedOutput: this.consolidateResults(results),
      totalTime,
      status: successfulSteps === results.length ? 'completed' : 'partial'
    };
  }

  /**
   * 模拟代理执行（实际实现中会调用真实的代理）
   */
  private static async simulateAgentExecution(
    agentName: string, 
    input: string, 
    role: string,
    projectPath?: string,
    featureName?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // If projectPath and featureName are provided, generate actual documents
      if (projectPath && featureName) {
        return await this.executeAgentWithFileGeneration(agentName, input, role, projectPath, featureName);
      }
      
      // Fallback to simulation for compatibility
      return await this.executeAgentSimulation(agentName, input, role);
      
    } catch (error) {
      logger.error(`Error in agent execution for ${agentName}:`, error);
      const executionTime = Date.now() - startTime;
      
      return {
        output: `Error in ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime,
        status: 'failed'
      };
    }
  }

  /**
   * Execute agent with actual file generation
   */
  private static async executeAgentWithFileGeneration(
    agentName: string,
    input: string,
    role: string,
    projectPath: string,
    featureName: string
  ): Promise<any> {
    const startTime = Date.now();
    
    // Create feature directory structure
    await FileOperations.createCmmiStructure({
      projectPath,
      featureName,
      createDocs: true,
      createSrc: true,
      createTests: true
    });

    // 修正文档路径：docs/feature/ 而不是 feature/docs/
    const docsPath = path.join(projectPath, 'docs', featureName);
    let outputMessage = '';
    let filePath = '';
    
    // 获取当前任务语言，用于智能翻译
    const taskLanguage = I18n.getLanguage() as Language;

    switch (agentName) {
      case 'requirements-agent':
        filePath = path.join(docsPath, 'requirements.md');
        let reqContent = DocumentTemplates.requirements(featureName, input);
        
        // 根据任务语言翻译文档内容
        reqContent = await this.translateDocumentContent(reqContent, 'requirements', taskLanguage);
        
        await FileOperations.createCmmiDocument(filePath, reqContent, 'RD');
        outputMessage = `Requirements document generated: ${filePath}`;
        break;

      case 'design-agent':
        filePath = path.join(docsPath, 'design.md');
        const reqPath = path.join(docsPath, 'requirements.md');
        let designContent = DocumentTemplates.design(featureName, reqPath);
        
        // 根据任务语言翻译文档内容
        designContent = await this.translateDocumentContent(designContent, 'design', taskLanguage);
        
        await FileOperations.createCmmiDocument(filePath, designContent, 'TS');
        outputMessage = `Design document generated: ${filePath}`;
        break;

      case 'tasks-agent':
        filePath = path.join(docsPath, 'tasks.md');
        const designPath = path.join(docsPath, 'design.md');
        let tasksContent = DocumentTemplates.tasks(featureName, designPath);
        
        // 根据任务语言翻译文档内容
        tasksContent = await this.translateDocumentContent(tasksContent, 'tasks', taskLanguage);
        
        await FileOperations.createCmmiDocument(filePath, tasksContent, 'PI');
        outputMessage = `Task management document generated: ${filePath}`;
        break;

      case 'test-agent':
        filePath = path.join(docsPath, 'tests.md');
        const tasksPath = path.join(docsPath, 'tasks.md');
        let testsContent = DocumentTemplates.tests(featureName, tasksPath);
        
        // 根据任务语言翻译文档内容
        testsContent = await this.translateDocumentContent(testsContent, 'tests', taskLanguage);
        
        await FileOperations.createCmmiDocument(filePath, testsContent, 'VER');
        outputMessage = `Test plan document generated: ${filePath}`;
        break;

      case 'coding-agent':
        filePath = path.join(docsPath, 'implementation.md');
        const implDesignPath = path.join(docsPath, 'design.md');
        let implContent = DocumentTemplates.implementation(featureName, implDesignPath);
        
        // 根据任务语言翻译文档内容
        implContent = await this.translateDocumentContent(implContent, 'implementation', taskLanguage);
        
        await FileOperations.createCmmiDocument(filePath, implContent, 'TS');
        outputMessage = `Implementation guide generated: ${filePath}`;
        break;

      case 'spec-agent':
        // Generate all documents in sequence with translation support
        const allPaths = [];
        
        // Requirements
        const specReqPath = path.join(docsPath, 'requirements.md');
        let specReqContent = DocumentTemplates.requirements(featureName, input);
        specReqContent = await this.translateDocumentContent(specReqContent, 'requirements', taskLanguage);
        await FileOperations.createCmmiDocument(specReqPath, specReqContent, 'RD');
        allPaths.push(specReqPath);
        
        // Design
        const specDesignPath = path.join(docsPath, 'design.md');
        let specDesignContent = DocumentTemplates.design(featureName, specReqPath);
        specDesignContent = await this.translateDocumentContent(specDesignContent, 'design', taskLanguage);
        await FileOperations.createCmmiDocument(specDesignPath, specDesignContent, 'TS');
        allPaths.push(specDesignPath);
        
        // Tasks
        const specTasksPath = path.join(docsPath, 'tasks.md');
        let specTasksContent = DocumentTemplates.tasks(featureName, specDesignPath);
        specTasksContent = await this.translateDocumentContent(specTasksContent, 'tasks', taskLanguage);
        await FileOperations.createCmmiDocument(specTasksPath, specTasksContent, 'PI');
        allPaths.push(specTasksPath);
        
        // Tests
        const specTestsPath = path.join(docsPath, 'tests.md');
        let specTestsContent = DocumentTemplates.tests(featureName, specTasksPath);
        specTestsContent = await this.translateDocumentContent(specTestsContent, 'tests', taskLanguage);
        await FileOperations.createCmmiDocument(specTestsPath, specTestsContent, 'VER');
        allPaths.push(specTestsPath);
        
        // Implementation
        const specImplPath = path.join(docsPath, 'implementation.md');
        let specImplContent = DocumentTemplates.implementation(featureName, specDesignPath);
        specImplContent = await this.translateDocumentContent(specImplContent, 'implementation', taskLanguage);
        await FileOperations.createCmmiDocument(specImplPath, specImplContent, 'TS');
        allPaths.push(specImplPath);
        
        outputMessage = `Complete CMMI documentation generated:\n${allPaths.map(p => `- ${p}`).join('\n')}`;
        filePath = docsPath;
        break;

      default:
        outputMessage = `Agent ${agentName} not configured for file generation. Using simulation.`;
        return await this.executeAgentSimulation(agentName, input, role);
    }

    const executionTime = Date.now() - startTime;
    logger.info(`Generated document for ${agentName}: ${filePath}`);

    return {
      output: outputMessage,
      executionTime,
      status: 'success',
      filePath,
      featureName
    };
  }

  /**
   * Fallback simulation for backward compatibility
   */
  private static async executeAgentSimulation(
    agentName: string,
    input: string,
    role: string
  ): Promise<any> {
    const startTime = Date.now();
    
    // 模拟不同代理的处理时间和输出
    const agentResponses = {
      'tasks-agent': `Task Breakdown by ${role}:\n1. Analysis Phase\n2. Design Phase\n3. Implementation Phase\n4. Testing Phase\n5. Documentation Phase\n\nTask: ${input.substring(0, 100)}...`,
      'requirements-agent': `Requirements Analysis by ${role}:\n- Functional Requirements\n- Non-functional Requirements\n- Constraints and Assumptions\n\nBased on: ${input.substring(0, 100)}...`,
      'design-agent': `System Design by ${role}:\n- Architecture Overview\n- Component Design\n- Data Flow\n- Interface Design\n\nFor requirements: ${input.substring(0, 100)}...`,
      'coding-agent': `Implementation by ${role}:\n- Code Structure\n- Key Functions\n- Error Handling\n- Unit Tests\n\nImplementing design: ${input.substring(0, 100)}...`,
      'test-agent': `Test Plan by ${role}:\n- Test Strategy\n- Test Cases\n- Expected Results\n- Quality Metrics\n\nTesting: ${input.substring(0, 100)}...`,
      'spec-agent': `Documentation by ${role}:\n- Technical Specification\n- User Guide\n- API Documentation\n- Deployment Guide\n\nDocumenting: ${input.substring(0, 100)}...`
    };

    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const executionTime = Date.now() - startTime;
    
    return {
      output: (agentResponses as any)[agentName] || `Output from ${role}: Processed task - ${input.substring(0, 50)}...`,
      executionTime,
      status: 'success'
    };
  }

  /**
   * 获取代理颜色配置
   */
  private static getAgentColor(agentName: string): string {
    const colors = {
      'requirements-agent': 'purple',
      'design-agent': 'blue',
      'coding-agent': 'teal',
      'tasks-agent': 'red',
      'test-agent': 'orange',
      'spec-agent': 'green'
    };
    return (colors as any)[agentName] || 'gray';
  }

  /**
   * 获取代理入口点描述
   */
  private static getAgentEntryDescription(agentName: string, lang: string): string {
    const descriptions = {
      'requirements-agent': {
        zh: '从产品构想生成需求说明',
        en: 'Generate requirements specification from product concept'
      },
      'design-agent': {
        zh: '从需求生成设计文档',
        en: 'Generate design documentation from requirements'
      },
      'coding-agent': {
        zh: '从设计生成实现骨架与测试',
        en: 'Generate implementation skeleton and tests from design'
      },
      'tasks-agent': {
        zh: '从设计与实现清单生成任务清单并执行相关任务',
        en: 'Generate task list from design and implementation manifest and execute related tasks'
      },
      'test-agent': {
        zh: '运行测试并生成报告',
        en: 'Run tests and generate reports'
      },
      'spec-agent': {
        zh: '从想法到任务到实现再到测试的全流程生成，支持 quickMode',
        en: 'Full process generation from idea to task to implementation to testing, supporting quickMode'
      }
    };
    return (descriptions as any)[agentName]?.[lang] || 'Agent entry point';
  }

  /**
   * 获取代理示例
   */
  private static getAgentExample(agentName: string, lang: string): string {
    const examples = {
      'requirements-agent': {
        zh: '为权限缓存优化生成需求说明',
        en: 'Generate requirements specification for permission cache optimization'
      },
      'design-agent': {
        zh: '为权限缓存优化生成系统设计',
        en: 'Generate system design for permission cache optimization'
      },
      'coding-agent': {
        zh: '为 design.md 生成缓存模块骨架并创建单元测试',
        en: 'Generate cache module skeleton and create unit tests for design.md'
      },
      'tasks-agent': {
        zh: '为权限缓存优化生成任务清单并运行构建',
        en: 'Generate task list for permission cache optimization and run build'
      },
      'test-agent': {
        zh: '为权限缓存 feature 运行测试并生成报告',
        en: 'Run tests and generate reports for permission cache feature'
      },
      'spec-agent': {
        zh: '为权限缓存优化生成全流程并自动运行测试 (quickMode: true)',
        en: 'Generate full process for permission cache optimization and auto run tests (quickMode: true)'
      }
    };
    return (examples as any)[agentName]?.[lang] || 'Example usage';
  }

  /**
   * 整合结果
   */
  private static consolidateResults(results: any[]): string {
    const successfulResults = results.filter(r => r.status === 'success');
    
    if (successfulResults.length === 0) {
      return 'No successful results to consolidate.';
    }

    let consolidated = 'Multi-Agent Workflow Results:\n';
    consolidated += '=' .repeat(40) + '\n\n';

    for (const result of successfulResults) {
      consolidated += `${result.role} (${result.agent}):\n`;
      consolidated += '-' .repeat(30) + '\n';
      consolidated += result.output + '\n\n';
    }

    consolidated += `\nWorkflow Summary:\n`;
    consolidated += `- Total Agents: ${results.length}\n`;
    consolidated += `- Successful: ${successfulResults.length}\n`;
    consolidated += `- Failed: ${results.length - successfulResults.length}\n`;

    return consolidated;
  }
}
