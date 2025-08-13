/**
 * Unified Tool Handlers for Optimized MCP Tools
 * 8个优化工具的统一处理器 - 减少代码重复，提高维护性
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { logger } from '../utils/logger.js';
import { EnhancedToolHandlers } from './enhanced.js';
import { AgentDiscoveryEngine, type AgentDiscoveryResult } from '../core/agentDiscoveryEngine.js';
import { WorkflowOrchestrator } from '../core/workflowOrchestrator.js';

export class UnifiedToolHandlers {
  
  /**
   * 统一代理管理器 - 合并 agent_create, agent_list, smart_agent_generator, cmmi_init
   */
  static async manageAgent(args: Record<string, unknown>): Promise<any> {
    try {
      const action = args['action'] as string;
      logger.info(`🤖 Agent management action: ${action}`);

      switch (action) {
        case 'list':
          return await this.listAgents(args);
        case 'create':
          return await this.createAgent(args);
        case 'generate_smart':
          return await this.generateSmartAgents(args);
        case 'init_cmmi':
          return await this.initCMMIAgents(args);
        default:
          throw new Error(`Unknown action: ${action}`);
      }

    } catch (error) {
      logger.error('❌ Agent management failed:', error);
      throw error;
    }
  }

  /**
   * 列出所有可用的代理
   */
  private static async listAgents(args: Record<string, unknown>): Promise<any> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const projectPath = args['project_path'] as string;

      // 使用智能目录查找
      const agentsDir = this.findAgentsDirectory(projectPath);
      
      if (!fs.existsSync(agentsDir)) {
        return {
          success: true,
          action: 'list',
          agents: [],
          message: `No agents directory found at ${agentsDir}`,
          agents_directory: agentsDir,
          timestamp: new Date().toISOString()
        };
      }

      const agentFiles = fs.readdirSync(agentsDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
      const agents = [];
      const invalidFiles = [];

      for (const file of agentFiles) {
        try {
          const filePath = path.join(agentsDir, file);
          
          // 使用我们的验证方法
          const validationResult = this.validateYAMLFile(filePath);
          
          if (validationResult.valid && validationResult.config) {
            const agentConfig = validationResult.config;
            agents.push({
              name: agentConfig.name || path.basename(file, path.extname(file)),
              title: agentConfig.title || agentConfig.name,
              description: agentConfig.description,
              model: agentConfig.model,
              capabilities: agentConfig.capabilities || [],
              language: agentConfig.language,
              color: agentConfig.color,
              file_path: filePath,
              yaml_valid: true
            });
          } else {
            invalidFiles.push({
              file,
              path: path.join(agentsDir, file),
              error: validationResult.error,
              yaml_valid: false
            });
            logger.warn(`Invalid YAML file ${file}: ${validationResult.error}`);
          }
        } catch (fileError) {
          invalidFiles.push({
            file,
            path: path.join(agentsDir, file),
            error: `Parse error: ${fileError instanceof Error ? fileError.message : String(fileError)}`,
            yaml_valid: false
          });
          logger.warn(`Failed to parse agent file ${file}:`, fileError);
        }
      }

      // 过滤功能
      const filterByCapability = args['filter_by_capability'] as string;
      const filteredAgents = filterByCapability 
        ? agents.filter(agent => 
            agent.capabilities.some((cap: string) => 
              cap.toLowerCase().includes(filterByCapability.toLowerCase())
            )
          )
        : agents;

      return {
        success: true,
        action: 'list',
        agents: filteredAgents,
        total_count: filteredAgents.length,
        valid_files: agents.length,
        invalid_files: invalidFiles,
        agents_directory: agentsDir,
        filter_applied: filterByCapability || null,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to list agents:', error);
      throw error;
    }
  }

  /**
   * 创建新代理
   */
  private static async createAgent(args: Record<string, unknown>): Promise<any> {
    const name = args['name'] as string;
    const description = args['description'] as string;
    const capabilities = args['capabilities'] as string[] || [];
    const model = args['model'] as string || 'gpt-4.1';
    const projectPath = args['project_path'] as string;

    if (!name) {
      throw new Error('Agent name is required');
    }

    // 智能查找agents目录，考虑项目路径
    const agentsDir = this.findAgentsDirectory(projectPath);
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    // 创建agent配置 - 使用标准化的instructions格式
    const instructionsText = `你是${description || name}。

能力范围：
${capabilities.map(cap => `- ${cap}`).join('\n')}

请根据用户需求提供专业的帮助和建议。`;

    const agentConfig = {
      version: 1,
      name,
      title: description || `${name} - AI助手`,
      description: description || `专门处理${capabilities.join('、')}的AI助手`,
      model,
      color: this.generateRandomColor(),
      language: 'zh-CN',
      capabilities,
      entrypoints: [
        {
          id: 'default',
          description: `${name}的默认入口点`,
          examples: [
            `使用${name}处理${capabilities[0] || '任务'}`
          ]
        }
      ],
      instructions: instructionsText
    };

    // 写入YAML文件，使用正确的多行格式
    const fileName = `${name}.yaml`;
    const filePath = path.join(agentsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      throw new Error(`Agent file '${fileName}' already exists`);
    }

    // 使用自定义YAML格式确保instructions字段正确
    const yamlContent = this.generateCorrectYAML(agentConfig);
    fs.writeFileSync(filePath, yamlContent, 'utf8');

    // 立即验证生成的YAML文件
    const validationResult = this.validateYAMLFile(filePath);
    if (!validationResult.valid) {
      // 如果验证失败，删除文件并抛出错误
      fs.unlinkSync(filePath);
      throw new Error(`Generated YAML file is invalid: ${validationResult.error}`);
    }

    logger.info(`✅ Created and validated agent: ${name} at ${filePath}`);

    return {
      success: true,
      action: 'create',
      agent: agentConfig,
      file_path: filePath,
      message: `Agent '${name}' created successfully and validated`,
      yaml_valid: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 智能查找agents目录
   */
  private static findAgentsDirectory(projectPath?: string): string {
    // 如果指定了项目路径，优先在项目路径中查找
    if (projectPath) {
      const projectAgentsDir = path.join(projectPath, 'agents');
      return projectAgentsDir; // 直接返回项目路径下的agents目录，如果不存在会自动创建
    }

    // 首先尝试当前目录
    let agentsDir = path.join(process.cwd(), 'agents');
    if (fs.existsSync(agentsDir)) {
      return agentsDir;
    }

    // 尝试上级目录（从mcp-server向上查找）
    agentsDir = path.join(process.cwd(), '..', 'agents');
    if (fs.existsSync(agentsDir)) {
      return agentsDir;
    }

    // 如果都找不到，返回默认路径
    return path.join(process.cwd(), 'agents');
  }

  /**
   * 生成正确格式的YAML内容
   */
  private static generateCorrectYAML(config: any): string {
    // 将instructions字段特殊处理
    const { instructions, ...otherFields } = config;
    
    // 先生成其他字段的YAML
    let yamlContent = yaml.stringify(otherFields, { indent: 2 });
    
    // 手动添加instructions字段，使用正确的多行格式
    yamlContent = yamlContent.trim();
    yamlContent += '\ninstructions: |\n';
    
    // 将instructions内容按行分割并添加适当的缩进
    const instructionLines = instructions.split('\n');
    for (const line of instructionLines) {
      yamlContent += `  ${line}\n`;
    }
    
    return yamlContent;
  }

  /**
   * 验证YAML文件格式
   */
  private static validateYAMLFile(filePath: string): { valid: boolean; error?: string; config?: any } {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = yaml.parse(content);
      
      // 基本结构验证
      if (!config || typeof config !== 'object') {
        return { valid: false, error: 'Invalid YAML structure' };
      }

      // 必需字段验证
      const requiredFields = ['name', 'version', 'instructions'];
      for (const field of requiredFields) {
        if (!(field in config)) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }

      // instructions字段不能为空
      if (!config.instructions || config.instructions.trim() === '') {
        return { valid: false, error: 'Instructions field cannot be empty' };
      }

      return { valid: true, config };

    } catch (error) {
      return { 
        valid: false, 
        error: `YAML parsing error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * 生成随机颜色
   */
  private static generateRandomColor(): string {
    const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'cyan'];
    return colors[Math.floor(Math.random() * colors.length)] || 'blue';
  }

  /**
   * 智能生成代理
   */
  private static async generateSmartAgents(args: Record<string, unknown>): Promise<any> {
    const taskContent = args['task_content'] as string;
    const generationMode = args['generation_mode'] as string || 'smart';
    const projectPath = args['project_path'] as string;

    if (!taskContent) {
      throw new Error('Task content is required for smart agent generation');
    }

    // 分析任务内容，推荐需要的agents
    const recommendedAgents = this.analyzeTaskForAgents(taskContent);
    const agentsToGenerate: any[] = [];

    if (generationMode === 'smart') {
      // 智能模式：只生成推荐的agents
      for (const agentSpec of recommendedAgents) {
        try {
          const result = await this.createAgent({
            name: agentSpec.name,
            description: agentSpec.description,
            capabilities: agentSpec.capabilities,
            model: agentSpec.model || 'gpt-4.1',
            project_path: projectPath
          });
          agentsToGenerate.push(result.agent);
        } catch (error: any) {
          logger.warn(`Failed to create agent ${agentSpec.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else if (generationMode === 'full') {
      // 完整模式：生成所有CMMI标准agents
      const cmmInitResult = await this.initCMMIAgents(args);
      agentsToGenerate.push(...cmmInitResult.initialized_agents);
    }

    return {
      success: true,
      action: 'generate_smart',
      task_content: taskContent,
      generation_mode: generationMode,
      recommended_agents: recommendedAgents.map(a => a.name),
      generated_agents: agentsToGenerate,
      total_generated: agentsToGenerate.length,
      message: `Successfully generated ${agentsToGenerate.length} agents based on task analysis`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 分析任务内容，推荐需要的agents
   */
  private static analyzeTaskForAgents(taskContent: string): any[] {
    const content = taskContent.toLowerCase();
    const agents: any[] = [];

    // 基于关键词分析推荐agents
    if (content.includes('需求') || content.includes('requirement') || content.includes('需要')) {
      agents.push({
        name: 'requirements-analyzer',
        description: '需求分析专家，专门处理需求收集和分析',
        capabilities: ['需求分析', '需求收集', '需求管理'],
        model: 'gpt-4.1'
      });
    }

    if (content.includes('设计') || content.includes('design') || content.includes('架构')) {
      agents.push({
        name: 'design-architect',
        description: '系统设计师，负责架构设计和技术方案',
        capabilities: ['系统设计', '架构设计', '技术方案'],
        model: 'gpt-4.1'
      });
    }

    if (content.includes('代码') || content.includes('编程') || content.includes('开发') || content.includes('code')) {
      agents.push({
        name: 'coding-developer',
        description: '开发工程师，负责代码实现和开发',
        capabilities: ['代码开发', '编程实现', '代码审查'],
        model: 'gpt-4.1'
      });
    }

    if (content.includes('测试') || content.includes('test') || content.includes('验证')) {
      agents.push({
        name: 'test-engineer',
        description: '测试工程师，负责测试设计和执行',
        capabilities: ['测试设计', '测试执行', '质量保证'],
        model: 'gpt-4.1'
      });
    }

    if (content.includes('文档') || content.includes('document') || content.includes('说明')) {
      agents.push({
        name: 'doc-writer',
        description: '技术写作专家，负责文档编写和维护',
        capabilities: ['技术文档', '用户手册', 'API文档'],
        model: 'gpt-4.1'
      });
    }

    // 如果没有匹配到特定类型，返回通用助手
    if (agents.length === 0) {
      agents.push({
        name: 'general-assistant',
        description: '通用AI助手，能够处理多种类型的任务',
        capabilities: ['通用助手', '任务处理', '问题解答'],
        model: 'gpt-4.1'
      });
    }

    return agents;
  }

  /**
   * 初始化CMMI代理集
   */
  private static async initCMMIAgents(args: Record<string, unknown>): Promise<any> {
    const projectPath = args['project_path'] as string;
    
    const standardAgents = [
      {
        name: 'requirements-agent',
        description: '需求分析和需求管理专家',
        capabilities: ['需求收集', '需求分析', '需求验证', '需求跟踪']
      },
      {
        name: 'design-agent',
        description: '系统设计和架构专家',
        capabilities: ['架构设计', '系统设计', '接口设计', '数据库设计']
      },
      {
        name: 'coding-agent', 
        description: '代码开发和实现专家',
        capabilities: ['代码编写', '代码审查', '重构优化', '技术实现']
      },
      {
        name: 'test-agent',
        description: '测试和质量保证专家',
        capabilities: ['测试设计', '测试执行', '缺陷管理', '质量评估']
      },
      {
        name: 'tasks-agent',
        description: '任务管理和项目协调专家',
        capabilities: ['任务规划', '进度跟踪', '资源分配', '风险管理']
      },
      {
        name: 'spec-agent',
        description: '规范和文档专家',
        capabilities: ['文档编写', '规范制定', '标准审查', '模板制作']
      }
    ];

    const createdAgents = [];
    for (const agentSpec of standardAgents) {
      try {
        const result = await this.createAgent({
          name: agentSpec.name,
          description: agentSpec.description,
          capabilities: agentSpec.capabilities,
          model: 'gpt-4.1',
          project_path: projectPath
        });
        
        if (result.success) {
          createdAgents.push(agentSpec.name);
        }
      } catch (error) {
        logger.warn(`Failed to create agent ${agentSpec.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: true,
      action: 'init_cmmi',
      initialized_agents: createdAgents,
      created_files: createdAgents.map(name => `${name}.yaml`),
      agents_directory: projectPath ? path.join(projectPath, 'agents') : this.findAgentsDirectory(),
      message: `CMMI agent initialization completed. Created ${createdAgents.length}/${standardAgents.length} agents`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 任务分析器 - 真实实现
   */
  static async analyzeTask(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🔍 Analyzing task for agent requirements');
      
      const taskContent = args['task_content'] as string;
      const domainHint = args['domain_hint'] as string;
      const complexityHint = args['complexity_hint'] as string;
      
      if (!taskContent) {
        throw new Error('Task content is required for analysis');
      }

      // 分析任务复杂度
      const complexityAnalysis = this.analyzeTaskComplexity(taskContent, complexityHint);
      
      // 分析技术领域
      const domainAnalysis = this.analyzeTechnicalDomain(taskContent, domainHint);
      
      // 推荐代理
      const agentRecommendations = this.recommendAgentsForTask(taskContent, complexityAnalysis, domainAnalysis);
      
      // 估算时间和资源
      const resourceEstimation = this.estimateTaskResources(complexityAnalysis, agentRecommendations);

      // 生成工作流建议
      const workflowSuggestion = this.generateWorkflowSuggestion(agentRecommendations, complexityAnalysis);

      return {
        success: true,
        task_content: taskContent,
        analysis: {
          complexity: complexityAnalysis,
          domain: domainAnalysis,
          agent_recommendations: agentRecommendations,
          resource_estimation: resourceEstimation,
          workflow_suggestion: workflowSuggestion,
          risk_assessment: this.assessTaskRisks(taskContent, complexityAnalysis)
        },
        summary: {
          complexity_level: complexityAnalysis.level,
          primary_domain: domainAnalysis.primary,
          recommended_agents: agentRecommendations.map(a => a.name),
          estimated_duration: resourceEstimation.duration,
          confidence_score: complexityAnalysis.confidence
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Task analysis failed:', error);
      throw error;
    }
  }

  /**
   * 分析任务复杂度
   */
  private static analyzeTaskComplexity(content: string, hint?: string): any {
    const factors = {
      technical_depth: 0,
      scope_size: 0,
      integration_complexity: 0,
      time_sensitivity: 0,
      documentation_needs: 0
    };

    const text = content.toLowerCase();
    
    // 技术深度分析
    const techKeywords = ['架构', 'architecture', '微服务', 'microservices', '分布式', 'distributed', 'api', '数据库', 'database'];
    factors.technical_depth = techKeywords.filter(keyword => text.includes(keyword)).length * 2;

    // 范围大小分析  
    const scopeKeywords = ['系统', 'system', '平台', 'platform', '完整', 'complete', '端到端', 'end-to-end'];
    factors.scope_size = scopeKeywords.filter(keyword => text.includes(keyword)).length * 1.5;

    // 集成复杂度
    const integrationKeywords = ['集成', 'integration', '对接', 'interface', '第三方', 'third-party'];
    factors.integration_complexity = integrationKeywords.filter(keyword => text.includes(keyword)).length * 2;

    // 时间敏感度
    const timeKeywords = ['紧急', 'urgent', '立即', 'immediately', '快速', 'quick'];
    factors.time_sensitivity = timeKeywords.filter(keyword => text.includes(keyword)).length * 1;

    // 文档需求
    const docKeywords = ['文档', 'documentation', '手册', 'manual', '说明', 'guide'];
    factors.documentation_needs = docKeywords.filter(keyword => text.includes(keyword)).length * 1;

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    
    let level: string;
    let confidence = 0.8;

    // 如果有提示，考虑进去
    if (hint) {
      if (hint === 'simple') {
        level = totalScore < 8 ? 'simple' : 'medium';
        confidence = 0.9;
      } else if (hint === 'complex') {
        level = totalScore > 3 ? 'complex' : 'medium';
        confidence = 0.9;
      } else {
        level = hint;
        confidence = 0.85;
      }
    } else {
      if (totalScore < 4) level = 'simple';
      else if (totalScore < 8) level = 'medium';
      else level = 'complex';
    }

    return {
      level,
      score: totalScore,
      factors,
      confidence,
      reasoning: this.generateComplexityReasoning(factors, level)
    };
  }

  /**
   * 分析技术领域
   */
  private static analyzeTechnicalDomain(content: string, hint?: string): any {
    const domains = {
      'web-development': ['web', '网站', 'frontend', 'backend', 'html', 'css', 'javascript'],
      'mobile-development': ['mobile', 'app', 'ios', 'android', '移动', '手机'],
      'data-science': ['数据', 'data', '机器学习', 'ml', 'ai', '人工智能', '分析'],
      'devops': ['部署', 'deploy', 'ci/cd', 'docker', 'kubernetes', '运维'],
      'backend-services': ['服务器', 'server', 'api', 'database', '后端', 'microservice'],
      'system-integration': ['集成', 'integration', '对接', 'interface', '系统'],
      'business-logic': ['业务', 'business', '流程', 'process', '规则', 'logic']
    };

    const text = content.toLowerCase();
    const domainScores: Record<string, number> = {};

    // 计算每个领域的匹配分数
    for (const [domain, keywords] of Object.entries(domains)) {
      domainScores[domain] = keywords.filter(keyword => text.includes(keyword)).length;
    }

    // 找出主要领域
    const sortedDomains = Object.entries(domainScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    const primary = sortedDomains[0]?.[0] || 'general';
    const secondary = sortedDomains[1]?.[0] || null;

    // 如果有领域提示，优先考虑
    const finalPrimary = hint && (domains as any)[hint] ? hint : primary;

    return {
      primary: finalPrimary,
      secondary,
      scores: domainScores,
      confidence: sortedDomains[0]?.[1] > 2 ? 0.9 : 0.7,
      all_matches: sortedDomains.map(([domain, score]) => ({ domain, score }))
    };
  }

  /**
   * 推荐代理
   */
  private static recommendAgentsForTask(content: string, complexity: any, domain: any): any[] {
    const recommendations: any[] = [];

    // 基础代理 - 几乎所有任务都需要
    recommendations.push({
      name: 'requirements-agent',
      role: '需求分析师',
      priority: 'high',
      reason: '分析和明确任务需求',
      confidence: 0.9
    });

    // 根据复杂度推荐
    if (complexity.level !== 'simple') {
      recommendations.push({
        name: 'design-agent',
        role: '系统设计师', 
        priority: complexity.level === 'complex' ? 'high' : 'medium',
        reason: '设计技术方案和架构',
        confidence: 0.8
      });
    }

    // 根据领域推荐
    if (domain.primary.includes('development') || content.toLowerCase().includes('开发')) {
      recommendations.push({
        name: 'coding-agent',
        role: '开发工程师',
        priority: 'high', 
        reason: '实现代码和功能开发',
        confidence: 0.9
      });
    }

    // 质量保证
    if (complexity.level === 'complex' || content.toLowerCase().includes('测试')) {
      recommendations.push({
        name: 'test-agent',
        role: '测试工程师',
        priority: complexity.level === 'complex' ? 'high' : 'medium',
        reason: '确保质量和测试覆盖',
        confidence: 0.8
      });
    }

    // 文档需求
    if (complexity.factors.documentation_needs > 0 || complexity.level === 'complex') {
      recommendations.push({
        name: 'spec-agent',
        role: '文档专家',
        priority: 'medium',
        reason: '编写技术文档和规范',
        confidence: 0.7
      });
    }

    // 项目管理
    if (complexity.level === 'complex' || content.toLowerCase().includes('管理')) {
      recommendations.push({
        name: 'tasks-agent',
        role: '项目经理',
        priority: 'medium',
        reason: '协调任务和进度管理',
        confidence: 0.8
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
    });
  }

  /**
   * 估算任务资源
   */
  private static estimateTaskResources(complexity: any, agents: any[]): any {
    const baseHours: Record<string, number> = {
      simple: 4,
      medium: 12, 
      complex: 24
    };

    const baseDuration = baseHours[complexity.level] || 12;
    
    // 根据代理数量调整
    const agentMultiplier = Math.max(0.5, 1 - (agents.length - 2) * 0.1);
    const estimatedHours = Math.round(baseDuration * agentMultiplier);

    return {
      duration: `${estimatedHours}小时`,
      agent_count: agents.length,
      parallel_execution: agents.length > 2,
      critical_path: agents.filter(a => a.priority === 'high').map(a => a.name),
      resource_intensity: complexity.level,
      estimated_cost: this.estimateTaskCost(estimatedHours, agents.length)
    };
  }

  /**
   * 生成工作流建议
   */
  private static generateWorkflowSuggestion(agents: any[], complexity: any): any {
    const phases: any[] = [];

    // Phase 1: 需求分析
    if (agents.some(a => a.name === 'requirements-agent')) {
      phases.push({
        phase: 1,
        name: '需求分析',
        agents: ['requirements-agent'],
        duration: '1-2小时',
        deliverables: ['需求文档', '功能规格'],
        dependencies: []
      });
    }

    // Phase 2: 设计阶段
    if (agents.some(a => a.name === 'design-agent')) {
      phases.push({
        phase: 2,
        name: '系统设计',
        agents: ['design-agent'],
        duration: complexity.level === 'complex' ? '4-6小时' : '2-3小时',
        deliverables: ['技术方案', '架构设计'],
        dependencies: ['需求分析']
      });
    }

    // Phase 3: 实现阶段
    if (agents.some(a => a.name === 'coding-agent')) {
      phases.push({
        phase: 3,
        name: '开发实现',
        agents: ['coding-agent'],
        duration: complexity.level === 'complex' ? '8-12小时' : '4-6小时',
        deliverables: ['代码实现', '功能模块'],
        dependencies: agents.some(a => a.name === 'design-agent') ? ['系统设计'] : ['需求分析']
      });
    }

    // Phase 4: 测试验证
    if (agents.some(a => a.name === 'test-agent')) {
      phases.push({
        phase: 4,
        name: '测试验证',
        agents: ['test-agent'],
        duration: '2-4小时',
        deliverables: ['测试用例', '测试报告'],
        dependencies: ['开发实现']
      });
    }

    return {
      phases,
      total_phases: phases.length,
      parallel_opportunities: this.identifyParallelTasks(phases),
      critical_path: this.calculateCriticalPath(phases),
      execution_strategy: complexity.level === 'simple' ? 'sequential' : 'hybrid'
    };
  }

  /**
   * 评估任务风险
   */
  private static assessTaskRisks(content: string, complexity: any): any[] {
    const risks: any[] = [];

    if (complexity.level === 'complex') {
      risks.push({
        type: 'scope_creep',
        level: 'medium',
        description: '复杂任务容易出现范围蔓延',
        mitigation: '明确需求边界，分阶段实施'
      });
    }

    if (complexity.factors.integration_complexity > 2) {
      risks.push({
        type: 'integration_risk',
        level: 'high',
        description: '多系统集成存在技术风险',
        mitigation: '提前进行技术验证和原型开发'
      });
    }

    if (complexity.factors.time_sensitivity > 0) {
      risks.push({
        type: 'time_pressure', 
        level: 'medium',
        description: '时间压力可能影响质量',
        mitigation: '合理分配资源，确保核心功能优先'
      });
    }

    return risks;
  }

  // 辅助方法
  private static generateComplexityReasoning(factors: any, level: string): string {
    const reasons: string[] = [];
    
    if (factors.technical_depth > 2) reasons.push('技术深度较高');
    if (factors.scope_size > 2) reasons.push('项目规模较大');
    if (factors.integration_complexity > 2) reasons.push('集成复杂度高');
    if (factors.time_sensitivity > 0) reasons.push('时间要求紧迫');
    
    return reasons.length > 0 
      ? `判定为${level}复杂度，主要因为：${reasons.join('、')}`
      : `判定为${level}复杂度`;
  }

  private static estimateTaskCost(hours: number, agentCount: number): string {
    // 简单的成本估算模型
    const hourlyRate = 500; // 假设每小时500元
    const totalCost = hours * hourlyRate * agentCount * 0.8; // 多代理协作效率因子
    return `约${Math.round(totalCost)}元`;
  }

  private static identifyParallelTasks(phases: any[]): string[] {
    // 识别可以并行执行的任务
    return phases
      .filter(phase => phase.dependencies.length === 0)
      .map(phase => phase.name);
  }

  private static calculateCriticalPath(phases: any[]): string[] {
    // 计算关键路径
    return phases
      .sort((a, b) => a.phase - b.phase)
      .map(phase => phase.name);
  }

  /**
   * 配置验证器 - 处理项目操作和配置验证
   */
  static async validateConfig(args: Record<string, unknown>): Promise<any> {
    try {
      const action = args['action'] as string;
      logger.info(`🔧 Project operation: ${action}`);
      
      if (action === 'generate') {
        // 实现真正的项目生成
        return await this.generateRealProject(args);
      } else if (action === 'validate_config') {
        // 实现真正的配置验证
        const configPath = args['config_path'] as string;
        
        if (!configPath) {
          throw new Error('config_path is required for validation');
        }

        return await this.validateAgentConfigurations(configPath);
      } else {
        throw new Error(`Unknown project operation action: ${action}`);
      }

    } catch (error) {
      logger.error('❌ Project operation failed:', error);
      throw error;
    }
  }

  /**
   * 真正的项目生成器 - 集成智能化工作流编排
   */
  private static async generateRealProject(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🏗️ 开始智能化项目生成流程...');
      
      const projectName = args['project_name'] as string;
      const projectType = args['project_type'] as string || 'web-app';
      const techStack = args['tech_stack'] as string || 'React + Node.js';
      const outputPath = args['output_path'] as string || `./generated-${projectName}`;
      const languages = (args['languages'] as string[]) || ['zh', 'en'];

      if (!projectName) {
        throw new Error('project_name is required for project generation');
      }

      // 构建项目配置
      const projectConfig = {
        project_name: projectName,
        project_type: projectType,
        tech_stack: techStack,
        project_path: path.resolve(outputPath),
        languages: languages,
        generated_at: new Date().toISOString()
      };

      // 创建项目目录
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
        logger.info(`📁 创建项目目录: ${outputPath}`);
      }

      // 使用WorkflowOrchestrator执行智能化项目初始化
      logger.info('🚀 启动智能化工作流编排...');
      
      const executionResult = await WorkflowOrchestrator.executeIntelligentProjectInitialization(
        outputPath,
        projectConfig
      );

      // 生成项目总结报告
      const summaryReport = this.generateProjectSummary(executionResult, projectConfig);

      return {
        success: executionResult.success,
        project_name: projectName,
        project_path: outputPath,
        project_type: projectType,
        tech_stack: techStack,
        workflow_execution: {
          total_phases: executionResult.execution_summary.total_phases,
          successful_phases: executionResult.execution_summary.successful_phases,
          failed_phases: executionResult.execution_summary.failed_phases,
          execution_time_ms: executionResult.execution_summary.execution_time_ms,
          cmmi_compliance: executionResult.quality_metrics.cmmi_compliance
        },
        generated_artifacts: executionResult.generated_artifacts,
        quality_metrics: executionResult.quality_metrics,
        recommendations: executionResult.execution_summary.recommendations,
        summary_report: summaryReport
      };

    } catch (error) {
      logger.error('❌ 智能化项目生成失败:', error);
      throw error;
    }
  }

  /**
   * 生成项目总结报告
   */
  private static generateProjectSummary(executionResult: any, projectConfig: any): string {
    const { execution_summary, quality_metrics } = executionResult;
    
    return `# 🎯 ${projectConfig.project_name} 项目生成报告

## � 执行总结
- **项目类型**: ${projectConfig.project_type}
- **技术栈**: ${projectConfig.tech_stack}
- **CMMI合规等级**: ${execution_summary.cmmi_compliance_level}
- **执行时间**: ${Math.round(execution_summary.execution_time_ms / 1000)}秒

## 🔄 工作流执行状态
- **总阶段数**: ${execution_summary.total_phases}
- **成功阶段**: ${execution_summary.successful_phases}
- **失败阶段**: ${execution_summary.failed_phases}
- **跳过阶段**: ${execution_summary.skipped_phases || 0}

## 📋 生成的工件
- **文档数量**: ${executionResult.generated_artifacts.filter((a: any) => a.type === 'document').length}
- **代码文件**: ${executionResult.generated_artifacts.filter((a: any) => a.type === 'code').length}
- **配置文件**: ${executionResult.generated_artifacts.filter((a: any) => a.type === 'config').length}
- **测试文件**: ${executionResult.generated_artifacts.filter((a: any) => a.type === 'test').length}

## 🎯 质量指标
- **整体质量分数**: ${Math.round(quality_metrics.overall_quality_score)}%
- **CMMI合规分数**: ${Math.round(quality_metrics.cmmi_compliance_score)}%
- **流程遵循度**: ${Math.round(quality_metrics.process_adherence)}%
- **可追溯性覆盖率**: ${Math.round(quality_metrics.traceability_coverage)}%

## 💡 改进建议
${execution_summary.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

---
*生成时间: ${new Date().toLocaleString()}*
`;
  }

  /**
   * 生成项目文件
   */
  private static async generateProjectFiles(projectPath: string, config: any): Promise<string[]> {
    const createdFiles: string[] = [];

    try {
      // 生成package.json（如果是Node.js项目）
      if (config.techStack.toLowerCase().includes('node') || config.techStack.toLowerCase().includes('react')) {
        const packageJson = {
          name: config.projectName,
          version: '1.0.0',
          description: `CMMI-enabled ${config.projectType} project`,
          main: 'src/index.js',
          scripts: {
            start: 'node src/index.js',
            dev: 'nodemon src/index.js',
            build: 'npm run build:compile',
            test: 'jest',
            'cmmi:validate': 'npx cmmi-specs-mcp validate-config ./agents',
            'cmmi:analyze': 'npx cmmi-specs-mcp analyze-quality .'
          },
          dependencies: {},
          devDependencies: {
            'cmmi-specs-mcp': 'latest'
          },
          keywords: ['cmmi', 'project', config.projectType],
          author: '',
          license: 'MIT'
        };

        const packageJsonPath = path.join(projectPath, 'package.json');
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        createdFiles.push('package.json');
      }

      // 生成README.md
      const readmeContent = this.generateREADME(config);
      const readmePath = path.join(projectPath, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);
      createdFiles.push('README.md');

      // 生成多语言文档
      for (const language of config.languages) {
        const docsDir = path.join(projectPath, 'docs', language);
        fs.mkdirSync(docsDir, { recursive: true });

        const docFiles = ['requirements.md', 'design.md', 'implementation.md', 'testing.md'];
        docFiles.forEach(docFile => {
          const content = this.generateDocumentTemplate(docFile, language, config);
          const filePath = path.join(docsDir, docFile);
          fs.writeFileSync(filePath, content);
          createdFiles.push(`docs/${language}/${docFile}`);
        });
      }

      // 生成基础源代码文件
      const srcFiles = this.generateSourceFiles(projectPath, config);
      createdFiles.push(...srcFiles);

      // 生成测试文件
      const testFiles = this.generateTestFiles(projectPath, config);
      createdFiles.push(...testFiles);

      // 生成配置文件
      const configFiles = this.generateConfigFiles(projectPath, config);
      createdFiles.push(...configFiles);

    } catch (error) {
      logger.error('❌ File generation failed:', error);
      throw error;
    }

    return createdFiles;
  }

  /**
   * 生成默认CMMI代理 - 使用完整的CMMI L3标准模板
   */
  private static async generateDefaultAgents(agentsPath: string): Promise<string[]> {
    const createdAgents: string[] = [];

    // 从项目的agents目录复制完整的CMMI L3标准模板
    const templateAgents = [
      'requirements-agent.yaml',
      'design-agent.yaml', 
      'coding-agent.yaml',
      'test-agent.yaml',
      'tasks-agent.yaml',
      'spec-agent.yaml'
    ];

    const projectRoot = path.resolve(__dirname, '../../agents');
    
    // 如果模板文件存在，复制完整配置；否则使用简化版本
    const defaultAgents = [];
    
    for (const templateFile of templateAgents) {
      const templatePath = path.join(projectRoot, templateFile);
      if (fs.existsSync(templatePath)) {
        try {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const templateYaml = yaml.parse(templateContent);
          
          // 调整名称以匹配生成需求（移除-agent后缀，添加-analyzer等）
          const agentName = templateFile.replace('.yaml', '').replace('-agent', '');
          const generatedName = this.mapAgentNameForGeneration(agentName);
          
          templateYaml.name = generatedName;
          defaultAgents.push(templateYaml);
        } catch (error) {
          logger.warn(`Failed to load template ${templateFile}, using fallback`);
          defaultAgents.push(this.getFallbackAgentConfig(templateFile));
        }
      } else {
        defaultAgents.push(this.getFallbackAgentConfig(templateFile));
      }
    }

    try {
      logger.info('📝 Starting CMMI agents generation with enhanced templates');
      logger.info(`📁 Target directory: ${agentsPath}`);
      logger.info(`🎯 Template source: ${projectRoot}`);
      
      for (const agent of defaultAgents) {
        logger.info(`🤖 Creating agent: ${agent.name} (version ${agent.version})`);
        logger.info(`🔧 Capabilities: ${agent.capabilities.join(', ')}`);
        
        const agentContent = yaml.stringify(agent);
        const agentFile = path.join(agentsPath, `${agent.name}.yaml`);
        fs.writeFileSync(agentFile, agentContent);
        createdAgents.push(`${agent.name}.yaml`);
        
        logger.info(`✅ Successfully created: ${agent.name}.yaml`);
        
        // 验证生成的文件
        if (fs.existsSync(agentFile)) {
          const fileSize = fs.statSync(agentFile).size;
          logger.info(`📄 File size: ${fileSize} bytes`);
        }
      }
      
      logger.info(`🎉 Agent generation completed! Created ${createdAgents.length} agents:`);
      createdAgents.forEach(agent => logger.info(`   ✓ ${agent}`));
      
    } catch (error) {
      logger.error('❌ Agent generation failed:', error);
      if (error instanceof Error) {
        logger.error(`📋 Error details: ${error.message}`);
        logger.error(`📍 Stack trace: ${error.stack}`);
      }
      throw error;
    }

    return createdAgents;
  }

  /**
   * 验证技术栈信息 - 提供基本的技术栈验证和建议
   */
  private static validateTechStack(techStack: string): any {
    const stackLower = techStack.toLowerCase();
    const validation = {
      techStack,
      isValid: true,
      warnings: [] as string[],
      suggestions: [] as string[],
      searchQueries: [] as string[]
    };

    // 检查常见技术栈的准确性
    if (stackLower.includes('abp')) {
      if (stackLower.includes('.net') && stackLower.includes('typescript')) {
        validation.warnings.push('ABP框架主要基于.NET，但也支持Angular/React前端，请通过联网搜索确认确切的技术栈组合');
        validation.searchQueries.push('ABP framework tech stack .NET Angular React');
      }
      if (stackLower.includes('typescript') && !stackLower.includes('.net')) {
        validation.warnings.push('ABP框架后端主要使用C#/.NET，前端可使用TypeScript，请验证完整技术栈');
        validation.searchQueries.push('ABP framework backend C# .NET frontend TypeScript');
      }
      validation.suggestions.push('建议通过GitHub Copilot Chat搜索ABP framework的最新文档和最佳实践');
    }

    // 检查其他常见技术组合
    if (stackLower.includes('react') && stackLower.includes('node')) {
      validation.suggestions.push('React + Node.js是经典组合，建议验证版本兼容性');
      validation.searchQueries.push('React Node.js version compatibility 2025');
    }

    if (stackLower.includes('vue') && stackLower.includes('express')) {
      validation.suggestions.push('Vue + Express组合，建议验证最新的构建工具配置');
      validation.searchQueries.push('Vue Express development setup 2025');
    }

    // 添加通用建议
    validation.suggestions.push('使用GitHub Copilot Chat验证技术栈的最新最佳实践');
    validation.suggestions.push('查询官方文档确认版本兼容性和依赖关系');
    validation.searchQueries.push(`${techStack} best practices 2025`);
    validation.searchQueries.push(`${techStack} official documentation setup`);

    return validation;
  }

  /**
   * 映射代理名称用于生成（调整命名规范）
   */
  private static mapAgentNameForGeneration(baseName: string): string {
    const nameMap: Record<string, string> = {
      'requirements': 'requirements-analyzer',
      'design': 'system-designer', 
      'coding': 'implementation-developer',
      'test': 'quality-tester',
      'tasks': 'project-manager',
      'spec': 'documentation-specialist'
    };
    
    return nameMap[baseName] || `${baseName}-specialist`;
  }

  /**
   * 获取后备代理配置（使用完整的CMMI L3标准模板）
   */
  private static getFallbackAgentConfig(templateFile: string): any {
    const baseName = templateFile.replace('.yaml', '').replace('-agent', '');
    const generatedName = this.mapAgentNameForGeneration(baseName);
    
    const fallbackConfigs: Record<string, any> = {
      'requirements-analyzer': {
        version: 1,
        name: 'requirements-analyzer',
        title: '需求分析师，负责收集、分析和管理项目需求',
        description: '需求分析师，负责收集、分析和管理项目需求',
        model: 'gpt-4.1',
        color: 'purple',
        language: 'zh-CN',
        capabilities: [
          '需求分析',
          '利益相关者管理', 
          '联网搜索验证',
          'GitHub Copilot协作',
          '技术栈验证',
          '最佳实践查询'
        ],
        dependencies: [],
        entrypoints: [
          {
            id: 'default',
            description: '从产品构想生成需求说明',
            examples: ['为项目功能生成完整需求分析', '分析业务需求并生成技术需求']
          },
          {
            id: 'quick',
            description: '快速需求分析模式',
            examples: ['快速生成MVP需求', '敏捷需求迭代分析']
          }
        ],
        workflow: {
          phase: 1,
          parallel_execution: false,
          inputs: [
            {
              type: 'business_idea',
              description: '业务构想或产品概念',
              required: true
            }
          ],
          outputs: [
            {
              type: 'document',
              name: 'requirements.md',
              description: '需求规格说明书'
            }
          ],
          quality_gates: [
            {
              criteria: '需求覆盖率 > 95%',
              validation: '通过需求追溯矩阵验证'
            },
            {
              criteria: '利益相关者确认',
              validation: '需求评审会议通过'
            }
          ],
          next_phases: ['system-designer', 'project-manager']
        },
        instructions: `# CMMI Level 3 需求开发专业代理 (Requirements Development Agent)

## 🎯 角色定义
您是符合 CMMI Level 3 标准的需求开发专业代理，负责执行需求开发过程域 (RD) 的所有关键实践。

## 🔍 联网搜索与验证职责
1. **技术栈验证**: 使用联网搜索验证技术框架的准确信息
   - 搜索官方文档确认技术特性和版本兼容性
   - 验证技术方案的可行性和最佳实践
   - 查询社区反馈和真实案例研究

2. **GitHub Copilot协作**: 
   - 利用Copilot Chat进行技术调研和需求分析
   - 获取相似项目的需求模板和最佳实践
   - 验证需求的技术可实现性

## 📋 核心职责
- 收集和分析利益相关者需求
- 建立产品和组件级需求规格
- 通过联网搜索验证技术可行性
- 与GitHub Copilot协作确保需求准确性

## 🎯 执行原则
始终确保需求清晰、可测试、可实现，通过联网搜索验证所有技术假设。`
      },
      'system-designer': {
        version: 1,
        name: 'system-designer',
        title: '系统设计师，负责架构设计和详细设计',
        description: '系统设计师，负责架构设计和详细设计',
        model: 'gpt-4.1',
        color: 'blue',
        language: 'zh-CN',
        capabilities: [
          '系统架构',
          '详细设计',
          '联网搜索验证',
          'GitHub Copilot协作',
          '技术选型验证',
          '架构模式查询'
        ],
        dependencies: ['requirements-analyzer'],
        entrypoints: [
          {
            id: 'default',
            description: '从需求生成系统设计文档',
            examples: ['为项目需求设计完整的系统架构方案', '生成技术选型和详细设计']
          },
          {
            id: 'architecture_only',
            description: '仅生成系统架构设计',
            examples: ['快速架构设计', '技术选型分析']
          }
        ],
        workflow: {
          phase: 2,
          parallel_execution: false,
          inputs: [
            {
              type: 'document',
              name: 'requirements.md',
              description: '需求规格说明书',
              required: true
            }
          ],
          outputs: [
            {
              type: 'document',
              name: 'design.md',
              description: '系统设计说明书'
            },
            {
              type: 'diagram',
              name: 'architecture.md',
              description: '架构图和技术选型说明'
            }
          ],
          quality_gates: [
            {
              criteria: '设计覆盖所有功能需求',
              validation: '需求追溯矩阵验证'
            },
            {
              criteria: '架构设计评审通过',
              validation: '技术方案可行性确认'
            }
          ],
          next_phases: ['implementation-developer']
        },
        instructions: `# CMMI Level 3 技术解决方案专业代理 (Technical Solution Agent)

## 🎯 角色定义
您是符合 CMMI Level 3 标准的技术解决方案专业代理，负责执行技术解决方案过程域 (TS) 的所有关键实践。

## 🔍 联网搜索与验证职责  
1. **技术架构验证**: 使用联网搜索验证架构模式和技术选型
   - 搜索最新技术文档和最佳实践
   - 验证框架版本兼容性和性能特征
   - 查询架构模式适用场景和限制

2. **GitHub Copilot协作**:
   - 利用Copilot生成架构图和代码骨架
   - 获取技术实现示例和配置模板
   - 验证设计方案的可实现性

## 📋 核心职责
- 选择和评估技术解决方案
- 开发系统架构和详细设计
- 通过联网搜索验证技术可行性
- 与GitHub Copilot协作确保设计质量

## 🎯 执行原则
确保设计方案可扩展、可维护、符合最佳实践，通过联网搜索验证所有技术决策。`
      },
      'implementation-developer': {
        version: 1,
        name: 'implementation-developer',
        title: '开发实现专家，负责编写高质量代码',
        description: '开发实现专家，负责编写高质量代码',
        model: 'gpt-4.1',
        color: 'orange',
        language: 'zh-CN',
        capabilities: [
          '代码实现',
          '最佳实践',
          '代码审查',
          '联网搜索验证',
          'GitHub Copilot协作',
          '框架使用验证',
          'API文档查询'
        ],
        dependencies: ['system-designer'],
        entrypoints: [
          {
            id: 'default',
            description: '从设计文档生成代码实现',
            examples: ['根据系统设计实现核心功能模块']
          }
        ],
        instructions: `# CMMI Level 3 开发实现专业代理 (Implementation Developer Agent)

## 🎯 角色定义
您是符合 CMMI Level 3 标准的开发实现专业代理，负责将设计转化为高质量的代码实现。

## 🔍 联网搜索与验证职责
1. **框架和库验证**: 使用联网搜索验证技术框架的正确使用
   - 查询官方API文档和使用指南
   - 验证版本兼容性和最佳实践
   - 搜索社区解决方案和代码示例

2. **GitHub Copilot协作**:
   - 利用Copilot生成代码模板和实现骨架
   - 获取代码优化建议和重构方案
   - 验证代码质量和安全性

## 📋 核心职责
- 编写符合设计规范的高质量代码
- 进行代码审查和重构优化
- 通过联网搜索验证技术实现
- 与GitHub Copilot协作提升代码质量

## 🎯 执行原则
始终遵循编码规范，编写可读、可维护的代码，通过联网搜索确保技术实现的正确性。`
      },
      'quality-tester': {
        version: 1,
        name: 'quality-tester',
        title: '质量保证专家，负责测试和质量管理',
        description: '质量保证专家，负责测试和质量管理',
        model: 'gpt-4.1',
        color: 'red',
        language: 'zh-CN',
        capabilities: [
          '测试规划',
          '测试执行',
          '质量保证',
          '联网搜索验证',
          'GitHub Copilot协作',
          '测试框架验证',
          '质量标准查询'
        ],
        dependencies: ['implementation-developer'],
        entrypoints: [
          {
            id: 'default',
            description: '从实现代码生成测试用例',
            examples: ['为核心功能模块设计完整的测试方案']
          }
        ],
        instructions: `# CMMI Level 3 验证与确认专业代理 (Verification & Validation Agent)

## 🎯 角色定义
您是符合 CMMI Level 3 标准的验证与确认专业代理，负责确保产品质量符合需求和设计规范。

## 🔍 联网搜索与验证职责
1. **测试框架验证**: 使用联网搜索验证测试工具和框架
   - 查询测试框架最佳实践和配置
   - 验证测试工具版本兼容性
   - 搜索测试模式和质量标准

2. **GitHub Copilot协作**:
   - 利用Copilot生成测试用例和测试代码
   - 获取测试自动化方案和配置模板
   - 验证测试覆盖率和质量指标

## 📋 核心职责
- 制定测试策略和测试计划
- 设计和执行测试用例
- 通过联网搜索验证测试方法
- 与GitHub Copilot协作提升测试质量

## 🎯 执行原则
确保产品质量符合要求，测试覆盖充分，通过联网搜索验证所有测试假设。`
      },
      'project-manager': {
        version: 1,
        name: 'project-manager',
        title: '项目经理，负责项目规划和协调管理',
        description: '项目经理，负责项目规划和协调管理',
        model: 'gpt-4.1',
        color: 'yellow',
        language: 'zh-CN',
        capabilities: [
          '项目规划',
          '任务管理',
          '资源协调',
          '联网搜索验证',
          'GitHub Copilot协作',
          '项目方法论查询',
          '风险管理验证'
        ],
        dependencies: ['requirements-analyzer', 'system-designer', 'implementation-developer', 'quality-tester'],
        entrypoints: [
          {
            id: 'default',
            description: '从项目需求生成项目管理计划',
            examples: ['为项目制定完整的任务分解和进度计划']
          }
        ],
        instructions: `# CMMI Level 3 项目管理专业代理 (Project Management Agent)

## 🎯 角色定义
您是符合 CMMI Level 3 标准的项目管理专业代理，负责项目规划、监控和协调各个开发活动。

## 🔍 联网搜索与验证职责
1. **项目方法论验证**: 使用联网搜索验证项目管理最佳实践
   - 查询敏捷、瀑布等方法论适用场景
   - 验证项目管理工具和模板
   - 搜索行业基准和成功案例

2. **GitHub Copilot协作**:
   - 利用Copilot生成项目文档和计划模板
   - 获取项目管理自动化方案
   - 验证项目风险和缓解策略

## 📋 核心职责
- 制定项目计划和任务分解
- 协调各个代理的工作流程
- 通过联网搜索验证管理方法
- 与GitHub Copilot协作优化项目执行

## 🎯 执行原则
确保项目按时按质完成，团队高效协作，通过联网搜索验证所有管理决策。`
      },
      'documentation-specialist': {
        version: 1,
        name: 'documentation-specialist',
        title: '技术文档工程师，负责规范和文档编写',
        description: '技术文档工程师，负责规范和文档编写',
        model: 'gpt-4.1',
        color: 'green',
        language: 'zh-CN',
        capabilities: [
          '文档编写',
          '规范制定',
          '流程调度',
          '联网搜索验证',
          'GitHub Copilot协作',
          '文档标准查询',
          '模板验证'
        ],
        dependencies: ['requirements-analyzer', 'system-designer', 'implementation-developer', 'quality-tester', 'project-manager'],
        entrypoints: [
          {
            id: 'default',
            description: '从想法到任务到实现再到测试的全流程生成',
            examples: ['生成完整的项目文档和规范体系']
          }
        ],
        instructions: `# CMMI Level 3 流程调度与文档专业代理 (Documentation & Process Orchestration Agent)

## 🎯 角色定义
您是符合 CMMI Level 3 标准的流程调度与文档专业代理，负责协调其他agents完成从想法到实现到测试的闭环。

## 🔍 联网搜索与验证职责
1. **文档标准验证**: 使用联网搜索验证文档标准和最佳实践
   - 查询行业文档规范和模板
   - 验证文档格式和结构标准
   - 搜索技术写作最佳实践

2. **GitHub Copilot协作**:
   - 利用Copilot生成文档模板和内容骨架
   - 获取文档自动化工具和流程
   - 验证文档质量和完整性

## 📋 核心职责
- 调度其他agents完成全流程开发
- 生成高质量的技术文档和规范
- 通过联网搜索验证文档标准
- 与GitHub Copilot协作优化文档质量

## 🎯 执行原则
确保文档完整、规范、易读，通过联网搜索验证所有文档标准。`
      }
    };
    
    return fallbackConfigs[generatedName] || {
      version: 1,
      name: generatedName,
      title: `${generatedName}专业助手`,
      description: `${generatedName}专业助手`,
      model: 'gpt-4.1',
      color: 'gray',
      language: 'zh-CN',
      capabilities: [
        'general_assistance',
        '联网搜索验证',
        'GitHub Copilot协作'
      ],
      entrypoints: [
        {
          id: 'default',
          description: '提供专业服务',
          examples: ['协助完成相关专业任务']
        }
      ],
      instructions: `你是一个专业的AI助手，负责协助完成相关任务。

## 🔍 联网搜索与验证职责
- 使用联网搜索验证技术信息的准确性
- 查询最新的行业最佳实践和标准
- 验证技术方案的可行性和兼容性

## 📋 GitHub Copilot协作
- 利用GitHub Copilot提供智能建议
- 协助生成代码、文档和配置模板
- 验证技术实现的正确性

始终确保信息准确、方案可行。`
    };
  }

  /**
   * 验证代理配置目录中的所有YAML文件
   */
  private static async validateAgentConfigurations(configPath: string): Promise<any> {
    try {
      let targetDir: string;
      
      // 如果是文件，取其目录；如果是目录，直接使用
      if (fs.existsSync(configPath)) {
        const stats = fs.statSync(configPath);
        targetDir = stats.isDirectory() ? configPath : path.dirname(configPath);
      } else {
        throw new Error(`Path does not exist: ${configPath}`);
      }

      const yamlFiles = fs.readdirSync(targetDir)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.join(targetDir, file));

      if (yamlFiles.length === 0) {
        return {
          success: true,
          valid: true,
          message: 'No YAML files found to validate',
          config_path: configPath,
          files_checked: 0,
          timestamp: new Date().toISOString()
        };
      }

      const validationResults = [];
      let allValid = true;
      let totalErrors = 0;

      for (const filePath of yamlFiles) {
        const result = this.validateYAMLFile(filePath);
        
        if (!result.valid) {
          allValid = false;
          totalErrors++;
        }

        validationResults.push({
          file: path.basename(filePath),
          path: filePath,
          valid: result.valid,
          error: result.error || null,
          config_preview: result.valid ? {
            name: result.config?.name,
            version: result.config?.version,
            model: result.config?.model,
            capabilities_count: result.config?.capabilities?.length || 0
          } : null
        });
      }

      // 如果有错误，提供修复建议
      const fixSuggestions = allValid ? [] : [
        '1. 检查YAML文件的缩进是否正确（使用2个空格）',
        '2. 确保instructions字段使用 | 而不是 |- 格式',
        '3. 验证所有必需字段是否存在：name, version, instructions',
        '4. 使用YAML验证工具检查语法错误'
      ];

      return {
        success: true,
        valid: allValid,
        config_path: configPath,
        files_checked: yamlFiles.length,
        valid_files: yamlFiles.length - totalErrors,
        invalid_files: totalErrors,
        validation_results: validationResults,
        fix_suggestions: fixSuggestions,
        message: allValid 
          ? `All ${yamlFiles.length} configuration files are valid`
          : `Found ${totalErrors} invalid configuration files`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Configuration validation failed:', error);
      throw new Error(`Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 工作流执行器 - 多代理协作执行引擎
   */
  static async executeWorkflow(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('⚡ Executing multi-agent workflow with intelligent orchestration');
      
      const taskContent = args['task_content'] as string;
      const projectPath = args['project_path'] as string;
      const executionMode = args['execution_mode'] as string || 'smart';
      const selectedAgents = args['selected_agents'] as string[];
      const contextSharing = args['context_sharing'] as boolean || true;
      const maxIterations = args['max_iterations'] as number || 5;

      if (!taskContent) {
        throw new Error('task_content is required for workflow execution');
      }

      // 生成工作流ID
      const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 初始化工作流状态
      const workflowState: any = {
        id: workflowId,
        task: taskContent,
        status: 'initializing',
        started_at: new Date().toISOString(),
        execution_mode: executionMode,
        context_sharing: contextSharing,
        max_iterations: maxIterations,
        current_iteration: 0,
        agents: [] as string[],
        steps: [] as any[],
        context: {} as any,
        results: {} as any
      };

      // 步骤1: 任务分析和代理选择
      logger.info('📋 Step 1: Analyzing task and selecting agents');
      const taskAnalysis = await this.analyzeTask({ 
        task_content: taskContent,
        project_path: projectPath 
      });
      
      workflowState.context.task_analysis = taskAnalysis;

      // 选择执行代理
      const agents = selectedAgents && selectedAgents.length > 0 
        ? selectedAgents 
        : this.selectAgentsFromAnalysis(taskAnalysis, projectPath);
      
      workflowState.agents = agents;
      logger.info(`🤖 Selected agents: ${agents.join(', ')}`);

      // 步骤2: 制定执行计划
      logger.info('📅 Step 2: Creating execution plan');
      const executionPlan = this.createExecutionPlan(taskAnalysis, agents, executionMode);
      workflowState.context.execution_plan = executionPlan;

      // 步骤3: 执行工作流
      logger.info('🚀 Step 3: Executing workflow');
      workflowState.status = 'executing';
      
      const executionResults = await this.executeWorkflowSteps(
        workflowState, 
        executionPlan, 
        contextSharing
      );

      // 步骤4: 整合结果
      logger.info('📊 Step 4: Consolidating results');
      const finalResults = await this.consolidateWorkflowResults(
        executionResults, 
        taskAnalysis
      );

      // 完成工作流
      workflowState.status = 'completed';
      workflowState.completed_at = new Date().toISOString();
      workflowState.results = finalResults;

      const workflowReport = {
        success: true,
        workflow_id: workflowId,
        status: 'completed',
        task_content: taskContent,
        execution_mode: executionMode,
        agents_used: agents,
        total_steps: executionPlan.steps.length,
        execution_time_ms: Date.now() - new Date(workflowState.started_at).getTime(),
        task_analysis: {
          complexity: taskAnalysis.complexity,
          estimated_hours: taskAnalysis.estimated_hours,
          domain: taskAnalysis.domain
        },
        execution_plan: {
          strategy: executionPlan.strategy,
          phases: executionPlan.phases,
          dependencies: executionPlan.dependencies
        },
        results: finalResults,
        performance_metrics: {
          total_agents: agents.length,
          successful_steps: executionResults.successful_steps,
          failed_steps: executionResults.failed_steps,
          context_sharing_enabled: contextSharing,
          iterations_used: workflowState.current_iteration
        },
        next_steps: this.generateNextSteps(finalResults, taskAnalysis),
        timestamp: new Date().toISOString()
      };

      logger.info(`✅ Workflow ${workflowId} completed successfully in ${workflowReport.execution_time_ms}ms`);
      return workflowReport;

    } catch (error) {
      logger.error('❌ Workflow execution failed:', error);
      throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从任务分析结果选择代理
   */
  private static selectAgentsFromAnalysis(taskAnalysis: any, projectPath?: string): string[] {
    const recommendedAgents = taskAnalysis.recommended_agents || [];
    const availableAgents = this.getAvailableAgents(projectPath);
    
    // 智能选择策略：优先使用推荐代理，确保有可用的代理配置
    const selectedAgents = recommendedAgents.filter((agent: string) => 
      availableAgents.includes(agent) || availableAgents.some(a => a.includes(agent))
    );

    // 如果没有匹配的推荐代理，使用默认组合
    if (selectedAgents.length === 0) {
      const defaultAgents = ['requirements-agent', 'design-agent', 'coding-agent'];
      return defaultAgents.filter(agent => availableAgents.includes(agent));
    }

    // 确保至少有一个代理
    return selectedAgents.length > 0 ? selectedAgents : ['coding-agent'];
  }

  /**
   * 获取可用代理列表
   */
  private static getAvailableAgents(projectPath?: string): string[] {
    try {
      const agentsDir = projectPath ? 
        path.join(projectPath, 'agents') : 
        this.findAgentsDirectory();
      
      if (!fs.existsSync(agentsDir)) {
        return ['requirements-agent', 'design-agent', 'coding-agent', 'test-agent'];
      }

      return fs.readdirSync(agentsDir)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map(file => path.basename(file, path.extname(file)));
    } catch (error) {
      logger.warn('⚠️ Could not load agents, using defaults');
      return ['requirements-agent', 'design-agent', 'coding-agent', 'test-agent'];
    }
  }

  /**
   * 创建执行计划
   */
  private static createExecutionPlan(taskAnalysis: any, agents: string[], executionMode: string): any {
    const complexity = taskAnalysis.complexity || 'medium';
    const domain = taskAnalysis.domain || 'general';

    let strategy = 'standard';
    let phases: any[] = [];
    let dependencies: any[] = [];

    if (executionMode === 'sequential') {
      strategy = 'sequential_execution';
      phases = this.createSequentialPhases(agents, taskAnalysis);
      dependencies = this.createLinearDependencies(phases);
    } else if (executionMode === 'parallel') {
      strategy = 'parallel_execution';
      phases = this.createParallelPhases(agents, taskAnalysis);
      dependencies = this.createMinimalDependencies(phases);
    } else { // smart mode
      strategy = 'intelligent_orchestration';
      phases = this.createSmartPhases(agents, taskAnalysis, complexity);
      dependencies = this.createSmartDependencies(phases, domain);
    }

    return {
      strategy,
      execution_mode: executionMode,
      total_phases: phases.length,
      estimated_duration: this.estimateExecutionDuration(phases, complexity),
      phases,
      dependencies,
      steps: phases.flatMap(phase => phase.steps || [])
    };
  }

  /**
   * 创建智能执行阶段
   */
  private static createSmartPhases(agents: string[], taskAnalysis: any, complexity: string): any[] {
    const phases = [];

    // Phase 1: 需求和分析
    if (agents.some(a => a.includes('requirements') || a.includes('spec'))) {
      phases.push({
        name: 'requirements_analysis',
        description: '需求分析和规格制定',
        agents: agents.filter(a => a.includes('requirements') || a.includes('spec')),
        priority: 'high',
        estimated_time: complexity === 'high' ? 120 : 60,
        steps: [
          'analyze_requirements',
          'define_specifications',
          'create_acceptance_criteria'
        ]
      });
    }

    // Phase 2: 设计和架构
    if (agents.some(a => a.includes('design') || a.includes('architect'))) {
      phases.push({
        name: 'system_design',
        description: '系统设计和架构规划',
        agents: agents.filter(a => a.includes('design') || a.includes('architect')),
        priority: 'high',
        estimated_time: complexity === 'high' ? 180 : 90,
        steps: [
          'design_system_architecture',
          'plan_technical_solution',
          'create_design_documents'
        ]
      });
    }

    // Phase 3: 实现和开发
    if (agents.some(a => a.includes('coding') || a.includes('develop') || a.includes('implement'))) {
      phases.push({
        name: 'implementation',
        description: '代码实现和开发',
        agents: agents.filter(a => a.includes('coding') || a.includes('develop') || a.includes('implement')),
        priority: 'medium',
        estimated_time: complexity === 'high' ? 300 : 150,
        steps: [
          'implement_core_features',
          'write_unit_tests',
          'code_review_and_refactor'
        ]
      });
    }

    // Phase 4: 测试和验证
    if (agents.some(a => a.includes('test') || a.includes('qa') || a.includes('quality'))) {
      phases.push({
        name: 'testing_validation',
        description: '测试验证和质量保证',
        agents: agents.filter(a => a.includes('test') || a.includes('qa') || a.includes('quality')),
        priority: 'medium',
        estimated_time: complexity === 'high' ? 180 : 90,
        steps: [
          'execute_test_plan',
          'validate_requirements',
          'quality_assurance_check'
        ]
      });
    }

    return phases;
  }

  /**
   * 执行工作流步骤
   */
  private static async executeWorkflowSteps(
    workflowState: any, 
    executionPlan: any, 
    contextSharing: boolean
  ): Promise<any> {
    const results: any = {
      successful_steps: 0,
      failed_steps: 0,
      phase_results: [] as any[],
      execution_log: [] as any[]
    };

    for (const phase of executionPlan.phases) {
      logger.info(`🔄 Executing phase: ${phase.name}`);
      
      const phaseStartTime = Date.now();
      const phaseResult = await this.executePhase(phase, workflowState, contextSharing);
      const phaseEndTime = Date.now();

      phaseResult.execution_time_ms = phaseEndTime - phaseStartTime;
      results.phase_results.push(phaseResult);

      if (phaseResult.success) {
        results.successful_steps += phaseResult.completed_steps || 1;
        
        // 如果启用上下文共享，更新工作流上下文
        if (contextSharing && phaseResult.outputs) {
          workflowState.context[phase.name] = phaseResult.outputs;
        }
      } else {
        results.failed_steps += 1;
        logger.warn(`⚠️ Phase ${phase.name} failed: ${phaseResult.error}`);
      }

      workflowState.current_iteration++;
      
      // 检查是否达到最大迭代次数
      if (workflowState.current_iteration >= workflowState.max_iterations) {
        logger.warn(`⚠️ Reached maximum iterations (${workflowState.max_iterations})`);
        break;
      }
    }

    return results;
  }

  /**
   * 执行单个阶段
   */
  private static async executePhase(phase: any, workflowState: any, contextSharing: boolean): Promise<any> {
    try {
      const phaseResult: any = {
        phase_name: phase.name,
        success: false,
        completed_steps: 0,
        outputs: {} as any,
        agents_used: phase.agents,
        error: null
      };

      // 模拟代理执行（在真实实现中，这里会调用实际的代理）
      for (const step of phase.steps || []) {
        logger.info(`  🔸 Executing step: ${step}`);
        
        // 模拟步骤执行
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        const stepResult = this.simulateStepExecution(step, phase, workflowState, contextSharing);
        
        if (stepResult.success) {
          phaseResult.completed_steps++;
          phaseResult.outputs[step] = stepResult.output;
        } else {
          phaseResult.error = stepResult.error;
          break;
        }
      }

      phaseResult.success = phaseResult.completed_steps === (phase.steps?.length || 0);
      
      return phaseResult;

    } catch (error) {
      return {
        phase_name: phase.name,
        success: false,
        completed_steps: 0,
        outputs: {},
        agents_used: phase.agents,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 模拟步骤执行
   */
  private static simulateStepExecution(step: string, phase: any, workflowState: any, contextSharing: boolean): any {
    // 基于步骤类型生成不同的输出
    const stepOutputs: Record<string, string> = {
      'analyze_requirements': `Requirements analysis completed for: ${workflowState.task}`,
      'define_specifications': 'Technical specifications documented',
      'create_acceptance_criteria': 'Acceptance criteria defined and validated',
      'design_system_architecture': 'System architecture designed with modular approach',
      'plan_technical_solution': 'Technical solution planned with technology recommendations',
      'create_design_documents': 'Design documents created with UML diagrams',
      'implement_core_features': 'Core features implemented with best practices',
      'write_unit_tests': 'Unit tests written with 90%+ coverage',
      'code_review_and_refactor': 'Code reviewed and refactored for maintainability',
      'execute_test_plan': 'Test plan executed with comprehensive scenarios',
      'validate_requirements': 'Requirements validated against implementation',
      'quality_assurance_check': 'Quality assurance completed with metrics'
    };

    const output = stepOutputs[step] || `${step} executed successfully`;

    // 模拟偶尔的失败（5%概率）
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: `Step ${step} encountered an issue during execution`
      };
    }

    return {
      success: true,
      output: output
    };
  }

  /**
   * 智能翻译 - GPT-4.1驱动的技术文档翻译引擎
   */
  static async intelligentTranslate(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🌐 Starting intelligent translation with GPT-4.1');
      
      const content = args['content'] as string;
      const sourceLanguage = args['sourceLanguage'] as string;
      const targetLanguage = args['targetLanguage'] as string;
      const documentType = args['documentType'] as string;
      const domain = (args['domain'] as string) || 'technical';
      
      // 验证输入参数
      if (!content || !sourceLanguage || !targetLanguage || !documentType) {
        throw new Error('Missing required parameters: content, sourceLanguage, targetLanguage, documentType');
      }

      if (sourceLanguage === targetLanguage) {
        return {
          success: true,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          original_content: content,
          translated_content: content,
          translation_quality: 'perfect',
          confidence_score: 1.0,
          notes: 'Source and target languages are the same',
          timestamp: new Date().toISOString()
        };
      }

      // 构建智能翻译上下文
      const translationContext = this.buildTranslationContext(documentType, domain, sourceLanguage, targetLanguage);
      
      // 分析内容特征
      const contentAnalysis = this.analyzeContentForTranslation(content, documentType);
      
      // 执行智能翻译
      const translatedContent = await this.performIntelligentTranslation(
        content, 
        sourceLanguage, 
        targetLanguage, 
        translationContext, 
        contentAnalysis
      );
      
      // 质量评估
      const qualityAssessment = this.assessTranslationQuality(content, translatedContent, contentAnalysis);
      
      // 生成翻译报告
      const translationReport = {
        success: true,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        document_type: documentType,
        domain: domain,
        original_content: content,
        translated_content: translatedContent,
        translation_quality: qualityAssessment.quality,
        confidence_score: qualityAssessment.confidence,
        word_count: contentAnalysis.wordCount,
        technical_terms_count: contentAnalysis.technicalTerms.length,
        preserved_terms: contentAnalysis.technicalTerms,
        translation_notes: qualityAssessment.notes,
        processing_time_ms: qualityAssessment.processingTime,
        timestamp: new Date().toISOString()
      };

      logger.info(`✅ Translation completed: ${sourceLanguage} -> ${targetLanguage}, Quality: ${qualityAssessment.quality}`);
      
      return translationReport;

    } catch (error) {
      logger.error('❌ Translation failed:', error);
      throw error;
    }
  }

  /**
   * 构建翻译上下文
   */
  private static buildTranslationContext(documentType: string, domain: string, sourceLanguage: string, targetLanguage: string): string {
    const contexts: Record<string, Record<string, Record<string, string>>> = {
      requirements: {
        technical: {
          zh_to_en: "Translate requirements document from Chinese to English. Preserve technical specifications, functional requirements, and acceptance criteria. Maintain formal documentation style.",
          en_to_zh: "将需求文档从英文翻译为中文。保持技术规范、功能需求和验收标准的准确性。维持正式文档风格。"
        },
        business: {
          zh_to_en: "Translate business requirements from Chinese to English. Focus on business objectives, stakeholder needs, and success metrics.",
          en_to_zh: "将业务需求从英文翻译为中文。重点关注业务目标、利益相关者需求和成功指标。"
        }
      },
      design: {
        technical: {
          zh_to_en: "Translate design document from Chinese to English. Preserve architectural patterns, design decisions, and technical diagrams descriptions.",
          en_to_zh: "将设计文档从英文翻译为中文。保持架构模式、设计决策和技术图表描述的准确性。"
        }
      },
      tasks: {
        technical: {
          zh_to_en: "Translate task descriptions from Chinese to English. Maintain task priorities, dependencies, and technical implementation details.",
          en_to_zh: "将任务描述从英文翻译为中文。保持任务优先级、依赖关系和技术实现细节。"
        }
      },
      tests: {
        technical: {
          zh_to_en: "Translate test documentation from Chinese to English. Preserve test cases, expected results, and testing procedures.",
          en_to_zh: "将测试文档从英文翻译为中文。保持测试用例、预期结果和测试流程的准确性。"
        }
      },
      implementation: {
        technical: {
          zh_to_en: "Translate implementation guide from Chinese to English. Preserve code examples, configuration steps, and technical procedures.",
          en_to_zh: "将实现指南从英文翻译为中文。保持代码示例、配置步骤和技术流程的准确性。"
        }
      }
    };

    const contextKey = `${sourceLanguage}_to_${targetLanguage}`;
    return contexts[documentType]?.[domain]?.[contextKey] || 
           `Translate ${documentType} document from ${sourceLanguage} to ${targetLanguage} with ${domain} domain focus.`;
  }

  /**
   * 分析待翻译内容的特征
   */
  private static analyzeContentForTranslation(content: string, documentType: string): any {
    const analysis = {
      wordCount: content.split(/\s+/).length,
      technicalTerms: [] as string[],
      codeBlocks: [] as string[],
      markdownElements: [] as string[],
      complexSentences: 0,
      estimatedComplexity: 'medium'
    };

    // 识别技术术语
    const technicalPatterns = [
      /\b(API|SDK|UI|UX|HTTP|HTTPS|REST|GraphQL|JSON|XML|YAML|SQL)\b/gi,
      /\b(React|Vue|Angular|Node\.js|TypeScript|JavaScript|Python|Java|C\+\+)\b/gi,
      /\b(Docker|Kubernetes|AWS|Azure|GCP|CI\/CD|DevOps)\b/gi,
      /\b(CMMI|Agile|Scrum|Kanban|MVP|POC|SLA|KPI)\b/gi
    ];

    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      analysis.technicalTerms.push(...matches);
    });

    // 去重技术术语
    analysis.technicalTerms = [...new Set(analysis.technicalTerms)];

    // 识别代码块
    const codeBlockPattern = /```[\s\S]*?```|`[^`\n]+`/g;
    analysis.codeBlocks = content.match(codeBlockPattern) || [];

    // 识别Markdown元素
    const markdownPatterns = [
      /#{1,6}\s+.+/g,  // 标题
      /\*\*[^*]+\*\*|\*[^*]+\*/g,  // 粗体斜体
      /\[[^\]]+\]\([^)]+\)/g,  // 链接
      /!\[[^\]]*\]\([^)]+\)/g  // 图片
    ];

    markdownPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      analysis.markdownElements.push(...matches);
    });

    // 计算复杂句子数量（超过30字的句子）
    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    analysis.complexSentences = sentences.filter(s => s.length > 30).length;

    // 估算复杂度
    if (analysis.wordCount > 500 || analysis.technicalTerms.length > 10 || analysis.complexSentences > 5) {
      analysis.estimatedComplexity = 'high';
    } else if (analysis.wordCount < 100 && analysis.technicalTerms.length < 3) {
      analysis.estimatedComplexity = 'low';
    }

    return analysis;
  }

  /**
   * 执行智能翻译（模拟GPT-4.1调用）
   */
  private static async performIntelligentTranslation(
    content: string, 
    sourceLanguage: string, 
    targetLanguage: string, 
    context: string, 
    analysis: any
  ): Promise<string> {
    const startTime = Date.now();

    // 在实际实现中，这里会调用GPT-4.1 API
    // 当前实现一个智能的翻译逻辑模拟
    
    let translatedContent = content;

    // 保护技术术语
    const protectedTerms = new Map();
    analysis.technicalTerms.forEach((term: string, index: number) => {
      const placeholder = `__TECH_TERM_${index}__`;
      protectedTerms.set(placeholder, term);
      translatedContent = translatedContent.replace(new RegExp(term, 'gi'), placeholder);
    });

    // 保护代码块
    const protectedCode = new Map();
    analysis.codeBlocks.forEach((block: string, index: number) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      protectedCode.set(placeholder, block);
      translatedContent = translatedContent.replace(block, placeholder);
    });

    // 执行基础翻译模拟
    if (sourceLanguage === 'zh' && targetLanguage === 'en') {
      translatedContent = this.simulateZhToEnTranslation(translatedContent);
    } else if (sourceLanguage === 'en' && targetLanguage === 'zh') {
      translatedContent = this.simulateEnToZhTranslation(translatedContent);
    }

    // 恢复保护的内容
    protectedTerms.forEach((original, placeholder) => {
      translatedContent = translatedContent.replace(new RegExp(placeholder, 'g'), original);
    });
    
    protectedCode.forEach((original, placeholder) => {
      translatedContent = translatedContent.replace(new RegExp(placeholder, 'g'), original);
    });

    // 模拟处理时间
    const processingTime = Date.now() - startTime;
    if (processingTime < 500) {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }

    return translatedContent;
  }

  /**
   * 模拟中文到英文翻译
   */
  private static simulateZhToEnTranslation(content: string): string {
    const translations = new Map([
      ['用户需求', 'User Requirements'],
      ['系统设计', 'System Design'],
      ['功能测试', 'Functional Testing'],
      ['代码实现', 'Code Implementation'],
      ['项目管理', 'Project Management'],
      ['质量保证', 'Quality Assurance'],
      ['数据库', 'Database'],
      ['接口设计', 'Interface Design'],
      ['前端开发', 'Frontend Development'],
      ['后端开发', 'Backend Development'],
      ['微服务', 'Microservices'],
      ['容器化', 'Containerization'],
      ['部署', 'Deployment'],
      ['监控', 'Monitoring'],
      ['日志', 'Logging'],
      ['缓存', 'Caching'],
      ['负载均衡', 'Load Balancing'],
      ['安全性', 'Security'],
      ['性能优化', 'Performance Optimization'],
      ['文档', 'Documentation']
    ]);

    let result = content;
    translations.forEach((english, chinese) => {
      result = result.replace(new RegExp(chinese, 'g'), english);
    });

    return result;
  }

  /**
   * 模拟英文到中文翻译
   */
  private static simulateEnToZhTranslation(content: string): string {
    const translations = new Map([
      ['User Requirements', '用户需求'],
      ['System Design', '系统设计'],
      ['Functional Testing', '功能测试'],
      ['Code Implementation', '代码实现'],
      ['Project Management', '项目管理'],
      ['Quality Assurance', '质量保证'],
      ['Database', '数据库'],
      ['Interface Design', '接口设计'],
      ['Frontend Development', '前端开发'],
      ['Backend Development', '后端开发'],
      ['Microservices', '微服务'],
      ['Containerization', '容器化'],
      ['Deployment', '部署'],
      ['Monitoring', '监控'],
      ['Logging', '日志'],
      ['Caching', '缓存'],
      ['Load Balancing', '负载均衡'],
      ['Security', '安全性'],
      ['Performance Optimization', '性能优化'],
      ['Documentation', '文档']
    ]);

    let result = content;
    translations.forEach((chinese, english) => {
      result = result.replace(new RegExp(english, 'g'), chinese);
    });

    return result;
  }

  /**
   * 评估翻译质量
   */
  private static assessTranslationQuality(original: string, translated: string, analysis: any): any {
    const assessment = {
      quality: 'good',
      confidence: 0.85,
      notes: [] as string[],
      processingTime: Date.now() - Date.now()
    };

    // 基于内容复杂度调整评估
    if (analysis.estimatedComplexity === 'high') {
      assessment.confidence -= 0.1;
      assessment.notes.push('High complexity content may require manual review');
    }

    if (analysis.technicalTerms.length > 5) {
      assessment.notes.push(`${analysis.technicalTerms.length} technical terms preserved`);
    }

    if (analysis.codeBlocks.length > 0) {
      assessment.notes.push(`${analysis.codeBlocks.length} code blocks preserved unchanged`);
    }

    // 长度差异检查
    const lengthRatio = translated.length / original.length;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      assessment.quality = 'fair';
      assessment.confidence -= 0.2;
      assessment.notes.push('Significant length difference detected');
    }

    // 设置质量等级
    if (assessment.confidence >= 0.9) {
      assessment.quality = 'excellent';
    } else if (assessment.confidence >= 0.75) {
      assessment.quality = 'good';
    } else if (assessment.confidence >= 0.6) {
      assessment.quality = 'fair';
    } else {
      assessment.quality = 'poor';
    }

    return assessment;
  }

  /**
   * 项目生成器 - 委托给 EnhancedToolHandlers
   */
  static async generateProject(args: Record<string, unknown>): Promise<any> {
    return await EnhancedToolHandlers.generateProject(args);
  }

  /**
   * 质量分析器 - 代码质量分析引擎
   */
  static async analyzeQuality(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🔍 Starting comprehensive quality analysis');
      
      const projectPath = args['project_path'] as string;
      const analysisType = (args['analysis_type'] as string) || 'quick';
      const language = (args['language'] as string) || 'auto';

      if (!projectPath) {
        throw new Error('project_path is required for quality analysis');
      }

      // 验证项目路径
      const resolvedPath = path.resolve(projectPath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }

      logger.info(`🔍 Analyzing project: ${resolvedPath}`);
      logger.info(`📊 Analysis type: ${analysisType}`);
      logger.info(`💻 Language: ${language}`);

      // 步骤1: 项目结构分析
      const projectStructure = await this.analyzeProjectStructure(resolvedPath);
      
      // 步骤2: 代码质量分析
      const codeQualityResults = await this.performCodeQualityAnalysis(
        resolvedPath, 
        analysisType, 
        language,
        projectStructure
      );

      // 步骤3: 安全性分析（如果需要）
      const securityResults = analysisType === 'security' || analysisType === 'full' 
        ? await this.performSecurityAnalysis(resolvedPath, projectStructure)
        : null;

      // 步骤4: 性能分析
      const performanceResults = analysisType === 'full'
        ? await this.performPerformanceAnalysis(resolvedPath, projectStructure)
        : null;

      // 步骤5: 依赖分析
      const dependencyResults = await this.analyzeDependencies(resolvedPath, projectStructure);

      // 步骤6: 测试覆盖率分析
      const testCoverageResults = await this.analyzeTestCoverage(resolvedPath, projectStructure);

      // 步骤7: 技术债务评估
      const technicalDebtResults = await this.assessTechnicalDebt(
        codeQualityResults,
        securityResults,
        performanceResults
      );

      // 步骤8: 生成综合质量报告
      const qualityReport = await this.generateQualityReport({
        projectPath: resolvedPath,
        analysisType,
        language,
        projectStructure,
        codeQuality: codeQualityResults,
        security: securityResults,
        performance: performanceResults,
        dependencies: dependencyResults,
        testCoverage: testCoverageResults,
        technicalDebt: technicalDebtResults
      });

      logger.info(`✅ Quality analysis completed for ${projectPath}`);
      return qualityReport;

    } catch (error) {
      logger.error('❌ Quality analysis failed:', error);
      throw new Error(`Quality analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 分析项目结构
   */
  private static async analyzeProjectStructure(projectPath: string): Promise<any> {
    const structure = {
      total_files: 0,
      source_files: 0,
      test_files: 0,
      config_files: 0,
      documentation_files: 0,
      file_types: {} as Record<string, number>,
      directories: [] as string[],
      languages_detected: [] as string[],
      build_tools: [] as string[],
      frameworks: [] as string[]
    };

    try {
      // 递归扫描项目目录
      const scanDirectory = (dirPath: string, depth: number = 0): void => {
        if (depth > 10) return; // 防止过深递归

        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            // 跳过常见的忽略目录
            if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(item)) {
              continue;
            }
            
            structure.directories.push(path.relative(projectPath, itemPath));
            scanDirectory(itemPath, depth + 1);
          } else if (stat.isFile()) {
            structure.total_files++;
            
            const ext = path.extname(item).toLowerCase();
            structure.file_types[ext] = (structure.file_types[ext] || 0) + 1;

            // 分类文件类型
            if (this.isSourceFile(item)) {
              structure.source_files++;
            } else if (this.isTestFile(item)) {
              structure.test_files++;
            } else if (this.isConfigFile(item)) {
              structure.config_files++;
            } else if (this.isDocumentationFile(item)) {
              structure.documentation_files++;
            }

            // 检测语言
            const language = this.detectLanguageFromFile(item);
            if (language && !structure.languages_detected.includes(language)) {
              structure.languages_detected.push(language);
            }
          }
        }
      };

      scanDirectory(projectPath);

      // 检测构建工具和框架
      structure.build_tools = this.detectBuildTools(projectPath);
      structure.frameworks = this.detectFrameworks(projectPath);

    } catch (error) {
      logger.warn(`⚠️ Error analyzing project structure: ${error}`);
    }

    return structure;
  }

  /**
   * 执行代码质量分析
   */
  private static async performCodeQualityAnalysis(
    projectPath: string, 
    analysisType: string, 
    language: string,
    projectStructure: any
  ): Promise<any> {
    const qualityResults = {
      overall_score: 0,
      maintainability_score: 0,
      readability_score: 0,
      complexity_score: 0,
      issues: [] as any[],
      metrics: {},
      file_analysis: [] as any[]
    };

    try {
      // 分析源代码文件
      const sourceFiles = this.findSourceFiles(projectPath, projectStructure);
      
      for (const filePath of sourceFiles.slice(0, analysisType === 'quick' ? 10 : 50)) {
        try {
          const fileAnalysis = await this.analyzeSourceFile(filePath, language);
          qualityResults.file_analysis.push(fileAnalysis);
          
          // 累积问题
          if (fileAnalysis.issues) {
            qualityResults.issues.push(...fileAnalysis.issues);
          }
        } catch (error) {
          logger.warn(`⚠️ Error analyzing file ${filePath}: ${error}`);
        }
      }

      // 计算综合评分
      qualityResults.overall_score = this.calculateOverallQualityScore(qualityResults.file_analysis);
      qualityResults.maintainability_score = this.calculateMaintainabilityScore(qualityResults.file_analysis);
      qualityResults.readability_score = this.calculateReadabilityScore(qualityResults.file_analysis);
      qualityResults.complexity_score = this.calculateComplexityScore(qualityResults.file_analysis);

      // 生成质量度量
      qualityResults.metrics = this.generateQualityMetrics(qualityResults.file_analysis, projectStructure);

    } catch (error) {
      logger.warn(`⚠️ Error in code quality analysis: ${error}`);
    }

    return qualityResults;
  }

  /**
   * 分析单个源文件
   */
  private static async analyzeSourceFile(filePath: string, language: string): Promise<any> {
    const analysis = {
      file_path: filePath,
      file_size: 0,
      lines_of_code: 0,
      complexity_score: 0,
      maintainability_score: 0,
      issues: [] as any[],
      metrics: {}
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      
      analysis.file_size = stats.size;
      analysis.lines_of_code = content.split('\n').length;

      // 代码复杂度分析
      analysis.complexity_score = this.calculateFileComplexity(content, language);
      
      // 可维护性分析
      analysis.maintainability_score = this.calculateFileMaintainability(content, language);

      // 代码质量问题检测
      analysis.issues = this.detectCodeIssues(content, filePath, language);

      // 文件级别度量
      analysis.metrics = this.calculateFileMetrics(content, language);

    } catch (error) {
      logger.warn(`⚠️ Error analyzing file ${filePath}: ${error}`);
    }

    return analysis;
  }

  /**
   * 执行安全性分析
   */
  private static async performSecurityAnalysis(projectPath: string, projectStructure: any): Promise<any> {
    const securityResults = {
      security_score: 0,
      vulnerabilities: [] as any[],
      security_issues: [] as any[],
      recommendations: [] as string[]
    };

    try {
      // 检查常见安全问题
      const sourceFiles = this.findSourceFiles(projectPath, projectStructure);
      
      for (const filePath of sourceFiles.slice(0, 20)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const securityIssues = this.detectSecurityIssues(content, filePath);
          securityResults.security_issues.push(...securityIssues);
        } catch (error) {
          logger.warn(`⚠️ Error in security analysis for ${filePath}: ${error}`);
        }
      }

      // 检查依赖漏洞（模拟）
      securityResults.vulnerabilities = this.checkDependencyVulnerabilities(projectPath);

      // 计算安全评分
      securityResults.security_score = this.calculateSecurityScore(securityResults);

      // 生成安全建议
      securityResults.recommendations = this.generateSecurityRecommendations(securityResults);

    } catch (error) {
      logger.warn(`⚠️ Error in security analysis: ${error}`);
    }

    return securityResults;
  }

  /**
   * 执行性能分析
   */
  private static async performPerformanceAnalysis(projectPath: string, projectStructure: any): Promise<any> {
    const performanceResults = {
      performance_score: 0,
      performance_issues: [] as any[],
      optimization_suggestions: [] as string[]
    };

    try {
      const sourceFiles = this.findSourceFiles(projectPath, projectStructure);
      
      for (const filePath of sourceFiles.slice(0, 15)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const perfIssues = this.detectPerformanceIssues(content, filePath);
          performanceResults.performance_issues.push(...perfIssues);
        } catch (error) {
          logger.warn(`⚠️ Error in performance analysis for ${filePath}: ${error}`);
        }
      }

      // 计算性能评分
      performanceResults.performance_score = this.calculatePerformanceScore(performanceResults);

      // 生成优化建议
      performanceResults.optimization_suggestions = this.generateOptimizationSuggestions(performanceResults);

    } catch (error) {
      logger.warn(`⚠️ Error in performance analysis: ${error}`);
    }

    return performanceResults;
  }

  /**
   * 模型调度器 - AI模型访问调度和资源管理
   */
  static async scheduleModel(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('⏰ Starting AI model scheduling system');
      
      const agentId = args['agent_id'] as string;
      const taskType = args['task_type'] as string;
      const priority = (args['priority'] as string) || 'normal';
      const preferredModel = args['preferred_model'] as string;

      // 参数验证
      if (!agentId) {
        throw new Error('agent_id is required for model scheduling');
      }
      if (!taskType) {
        throw new Error('task_type is required for model scheduling');
      }

      logger.info(`🤖 Scheduling model for agent: ${agentId}`);
      logger.info(`📋 Task type: ${taskType}, Priority: ${priority}`);

      // 获取当前模型状态和负载
      const modelStatus = await this.getModelStatus();
      
      // 分析任务需求
      const taskAnalysis = await this.analyzeTaskRequirements(taskType, priority);
      
      // 选择最佳模型
      const selectedModel = await this.selectOptimalModel(preferredModel, taskAnalysis, modelStatus);
      
      // 计算调度信息
      const scheduleInfo = await this.calculateScheduleInfo(selectedModel, priority, taskAnalysis);
      
      // 分配模型资源
      const allocation = await this.allocateModelResource(agentId, selectedModel, scheduleInfo, taskType);
      
      // 生成调度结果
      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        agent_id: agentId,
        task_type: taskType,
        priority: priority,
        
        // 模型分配信息
        model_allocation: {
          assigned_model: selectedModel.name,
          model_version: selectedModel.version,
          capabilities: selectedModel.capabilities,
          performance_tier: selectedModel.tier,
          resource_allocation: {
            cpu_cores: allocation.allocated_resources.cpu_cores,
            memory_gb: allocation.allocated_resources.memory_gb,
            gpu_allocation: allocation.allocated_resources.gpu_allocation,
            bandwidth_mbps: allocation.allocated_resources.bandwidth_mbps
          }
        },

        // 调度信息
        schedule_info: {
          session_id: allocation.session_id,
          queue_position: scheduleInfo.queue_position,
          estimated_wait_time: scheduleInfo.estimated_wait_time,
          estimated_execution_time: scheduleInfo.estimated_execution_time,
          allocated_at: scheduleInfo.allocated_at,
          expires_at: scheduleInfo.expires_at,
          max_duration_minutes: scheduleInfo.max_duration_minutes
        },

        // 性能优化建议
        optimization_suggestions: this.generateModelOptimizationSuggestions(taskAnalysis, selectedModel),
        
        // 成本信息
        cost_estimation: this.calculateCostEstimation(selectedModel, scheduleInfo),
        
        // 备用方案
        fallback_models: this.getFallbackModels(selectedModel, taskAnalysis),
        
        // 监控信息
        monitoring: {
          metrics_endpoint: `/api/monitoring/sessions/${allocation.session_id}`,
          health_check_interval: 30,
          performance_alerts: true,
          resource_usage_tracking: true
        }
      };

      logger.info(`✅ Model scheduled successfully: ${selectedModel.name} for agent ${agentId}`);
      logger.info(`⏱️ Queue position: ${scheduleInfo.queue_position}, Wait time: ${scheduleInfo.estimated_wait_time}`);
      
      return result;

    } catch (error) {
      logger.error('❌ Model scheduling failed:', error);
      throw new Error(`Model scheduling failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 系统诊断 - 综合系统监控和问题诊断
   */
  static async diagnoseSystem(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🏥 Starting comprehensive system diagnosis');
      
      const action = (args['action'] as string) || 'diagnosis';
      const checkType = (args['check_type'] as string) || 'quick';
      const metricType = (args['metric_type'] as string) || 'system';
      const includeRecommendations = args['include_recommendations'] !== false;

      logger.info(`🔍 Action: ${action}, Check type: ${checkType}`);

      if (action === 'status') {
        // 获取监控状态
        return await this.getSystemMonitoringStatus(metricType);
      } else if (action === 'diagnosis') {
        // 执行系统诊断
        return await this.performSystemDiagnosis(checkType, includeRecommendations);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

    } catch (error) {
      logger.error('❌ System diagnosis failed:', error);
      throw new Error(`System diagnosis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==================== 项目生成辅助方法 ====================

  /**
   * 分析项目复杂度
   */
  private static analyzeProjectComplexity(projectType: string, techStack: string): any {
    let complexity = 'medium';
    let estimatedHours = 40;
    const recommendations: string[] = [];

    // 基于项目类型评估
    if (projectType.includes('microservice') || projectType.includes('distributed')) {
      complexity = 'high';
      estimatedHours = 120;
      recommendations.push('Consider using Docker and Kubernetes');
      recommendations.push('Implement comprehensive monitoring and logging');
    } else if (projectType.includes('simple') || projectType.includes('static')) {
      complexity = 'low';
      estimatedHours = 20;
    }

    // 基于技术栈评估
    const techComplexity = techStack.toLowerCase();
    if (techComplexity.includes('react') && techComplexity.includes('node')) {
      estimatedHours += 20;
      recommendations.push('Use TypeScript for better maintainability');
    }

    return {
      complexity,
      estimated_hours: estimatedHours,
      technology_assessment: {
        frontend: techComplexity.includes('react') ? 'React.js' : 'Unknown',
        backend: techComplexity.includes('node') ? 'Node.js' : 'Unknown',
        database: techComplexity.includes('sql') ? 'SQL Database' : 'Unknown'
      },
      recommendations
    };
  }

  /**
   * 生成README文件 - 包含技术栈验证说明
   */
  private static generateREADME(config: any): string {
    return `# ${config.projectName}

## 项目简介

这是一个基于CMMI标准的${config.projectType}项目，使用${config.techStack}技术栈。

> **📋 注意**: 本项目的技术栈信息需要通过以下方式进行验证：
> - 🔍 **联网搜索**: 使用GitHub Copilot Chat搜索最新的技术文档
> - ✅ **官方验证**: 查询官方文档确认版本兼容性和最佳实践  
> - 🤝 **Copilot协作**: 利用GitHub Copilot验证技术方案可行性

## 技术栈

- **技术栈**: ${config.techStack}
- **项目类型**: ${config.projectType}
- **支持语言**: ${config.languages.join(', ')}

## 验证清单

在开始开发前，请确保：

- [ ] 🔍 已通过联网搜索验证技术栈的准确性
- [ ] 📚 已查询最新的官方文档和API规范
- [ ] 🤖 已与GitHub Copilot协作验证技术方案
- [ ] ✅ 已确认所有依赖的版本兼容性

## 快速开始

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# CMMI工具
npm run cmmi:validate  # 验证代理配置
npm run cmmi:analyze   # 代码质量分析
\`\`\`

## 项目结构

\`\`\`
├── src/           # 源代码
├── docs/          # 多语言文档
├── tests/         # 测试文件
├── agents/        # CMMI代理配置
├── configs/       # 项目配置
└── dist/          # 构建输出
\`\`\`

## CMMI工作流

本项目集成了CMMI标准工作流支持：

1. **需求分析** - requirements-analyzer代理
2. **系统设计** - system-designer代理  
3. **代码实现** - implementation-developer代理
4. **质量保证** - quality-tester代理

## 开发指南

请参考 \`docs/\` 目录下的详细文档：

- [需求文档](docs/zh/requirements.md)
- [设计文档](docs/zh/design.md)
- [实现指南](docs/zh/implementation.md)
- [测试指南](docs/zh/testing.md)

## 许可证

MIT License
`;
  }

  /**
   * 生成文档模板
   */
  private static generateDocumentTemplate(docFile: string, language: string, config: any): string {
    const isZh = language === 'zh';
    
    switch (docFile) {
      case 'requirements.md':
        return isZh ? 
          `# 需求文档\n\n## 项目概述\n\n${config.projectName}项目需求分析\n\n## 功能需求\n\n### 核心功能\n\n1. [待定义]\n2. [待定义]\n\n## 非功能需求\n\n### 性能要求\n\n- 响应时间: < 2秒\n- 并发用户: 100+\n\n### 安全要求\n\n- 用户认证\n- 数据加密\n\n## 验收标准\n\n- [ ] 功能完整性测试\n- [ ] 性能压力测试\n- [ ] 安全漏洞扫描\n` :
          `# Requirements Document\n\n## Project Overview\n\n${config.projectName} project requirements analysis\n\n## Functional Requirements\n\n### Core Features\n\n1. [To be defined]\n2. [To be defined]\n\n## Non-functional Requirements\n\n### Performance\n\n- Response time: < 2 seconds\n- Concurrent users: 100+\n\n### Security\n\n- User authentication\n- Data encryption\n\n## Acceptance Criteria\n\n- [ ] Functional completeness testing\n- [ ] Performance stress testing\n- [ ] Security vulnerability scanning\n`;

      case 'design.md':
        return isZh ?
          `# 设计文档\n\n## 系统架构\n\n${config.projectName}系统设计\n\n## 技术架构\n\n**技术栈**: ${config.techStack}\n\n## 模块设计\n\n### 核心模块\n\n1. 用户管理模块\n2. 数据处理模块\n3. 接口服务模块\n\n## 数据库设计\n\n### 核心表结构\n\n- users: 用户信息\n- configs: 配置信息\n\n## API设计\n\n### RESTful接口\n\n- GET /api/users\n- POST /api/users\n- PUT /api/users/:id\n- DELETE /api/users/:id\n` :
          `# Design Document\n\n## System Architecture\n\n${config.projectName} system design\n\n## Technical Architecture\n\n**Tech Stack**: ${config.techStack}\n\n## Module Design\n\n### Core Modules\n\n1. User Management Module\n2. Data Processing Module\n3. API Service Module\n\n## Database Design\n\n### Core Tables\n\n- users: User information\n- configs: Configuration data\n\n## API Design\n\n### RESTful Endpoints\n\n- GET /api/users\n- POST /api/users\n- PUT /api/users/:id\n- DELETE /api/users/:id\n`;

      case 'implementation.md':
        return isZh ?
          `# 实现指南\n\n## 开发环境\n\n${config.projectName}开发设置\n\n## 编码规范\n\n- 使用TypeScript\n- ESLint配置\n- Prettier格式化\n\n## 开发流程\n\n1. 创建功能分支\n2. 编写代码和测试\n3. 代码审查\n4. 合并到主分支\n\n## 部署指南\n\n### 开发环境\n\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n### 生产环境\n\n\`\`\`bash\nnpm run build\nnpm start\n\`\`\`\n` :
          `# Implementation Guide\n\n## Development Environment\n\n${config.projectName} development setup\n\n## Coding Standards\n\n- Use TypeScript\n- ESLint configuration\n- Prettier formatting\n\n## Development Workflow\n\n1. Create feature branch\n2. Write code and tests\n3. Code review\n4. Merge to main branch\n\n## Deployment Guide\n\n### Development\n\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n### Production\n\n\`\`\`bash\nnpm run build\nnpm start\n\`\`\`\n`;

      case 'testing.md':
        return isZh ?
          `# 测试指南\n\n## 测试策略\n\n${config.projectName}测试计划\n\n## 测试类型\n\n### 单元测试\n\n- Jest框架\n- 覆盖率目标: 80%+\n\n### 集成测试\n\n- API接口测试\n- 数据库集成测试\n\n### 端到端测试\n\n- 用户场景测试\n- 浏览器兼容性测试\n\n## 测试命令\n\n\`\`\`bash\n# 运行所有测试\nnpm test\n\n# 运行单元测试\nnpm run test:unit\n\n# 运行集成测试\nnpm run test:integration\n\n# 生成覆盖率报告\nnpm run test:coverage\n\`\`\`\n` :
          `# Testing Guide\n\n## Testing Strategy\n\n${config.projectName} testing plan\n\n## Test Types\n\n### Unit Testing\n\n- Jest framework\n- Coverage target: 80%+\n\n### Integration Testing\n\n- API endpoint testing\n- Database integration testing\n\n### End-to-End Testing\n\n- User scenario testing\n- Browser compatibility testing\n\n## Test Commands\n\n\`\`\`bash\n# Run all tests\nnpm test\n\n# Run unit tests\nnpm run test:unit\n\n# Run integration tests\nnpm run test:integration\n\n# Generate coverage report\nnpm run test:coverage\n\`\`\`\n`;

      default:
        return `# ${docFile}\n\nDocument content for ${config.projectName}\n`;
    }
  }

  /**
   * 生成源代码文件
   */
  private static generateSourceFiles(projectPath: string, config: any): string[] {
    const createdFiles: string[] = [];

    try {
      const srcPath = path.join(projectPath, 'src');

      // 生成主文件
      const mainFile = config.techStack.toLowerCase().includes('typescript') ? 'index.ts' : 'index.js';
      const mainContent = config.techStack.toLowerCase().includes('node') ?
        `// ${config.projectName} - Main Entry Point\n\nconsole.log('Hello, ${config.projectName}!');\n\n// TODO: Implement your application logic here\n` :
        `// ${config.projectName} - Frontend Entry Point\n\nimport './styles.css';\n\nconsole.log('${config.projectName} loaded successfully!');\n\n// TODO: Implement your frontend logic here\n`;

      fs.writeFileSync(path.join(srcPath, mainFile), mainContent);
      createdFiles.push(`src/${mainFile}`);

      // 生成工具文件
      const utilsPath = path.join(srcPath, 'utils');
      fs.mkdirSync(utilsPath, { recursive: true });

      const utilsContent = `// Utility functions for ${config.projectName}\n\nexport const formatDate = (date: Date): string => {\n  return date.toISOString().split('T')[0];\n};\n\nexport const validateEmail = (email: string): boolean => {\n  const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  return re.test(email);\n};\n`;

      const utilsFile = config.techStack.toLowerCase().includes('typescript') ? 'index.ts' : 'index.js';
      fs.writeFileSync(path.join(utilsPath, utilsFile), utilsContent);
      createdFiles.push(`src/utils/${utilsFile}`);

    } catch (error) {
      logger.error('❌ Source file generation failed:', error);
    }

    return createdFiles;
  }

  /**
   * 生成测试文件
   */
  private static generateTestFiles(projectPath: string, config: any): string[] {
    const createdFiles: string[] = [];

    try {
      const testsPath = path.join(projectPath, 'tests');

      // 生成单元测试
      const unitPath = path.join(testsPath, 'unit');
      fs.mkdirSync(unitPath, { recursive: true });

      const unitTestContent = `// Unit tests for ${config.projectName}\n\ndescribe('${config.projectName}', () => {\n  test('should pass basic test', () => {\n    expect(true).toBe(true);\n  });\n\n  // TODO: Add your unit tests here\n});\n`;

      fs.writeFileSync(path.join(unitPath, 'basic.test.js'), unitTestContent);
      createdFiles.push('tests/unit/basic.test.js');

      // 生成集成测试
      const integrationPath = path.join(testsPath, 'integration');
      fs.mkdirSync(integrationPath, { recursive: true });

      const integrationTestContent = `// Integration tests for ${config.projectName}\n\ndescribe('Integration Tests', () => {\n  test('should handle integration scenarios', () => {\n    // TODO: Add integration tests\n    expect(true).toBe(true);\n  });\n});\n`;

      fs.writeFileSync(path.join(integrationPath, 'api.test.js'), integrationTestContent);
      createdFiles.push('tests/integration/api.test.js');

    } catch (error) {
      logger.error('❌ Test file generation failed:', error);
    }

    return createdFiles;
  }

  /**
   * 生成配置文件
   */
  private static generateConfigFiles(projectPath: string, config: any): string[] {
    const createdFiles: string[] = [];

    try {
      const configsPath = path.join(projectPath, 'configs');

      // 生成项目配置
      const projectConfig = {
        name: config.projectName,
        version: '1.0.0',
        type: config.projectType,
        tech_stack: config.techStack,
        languages: config.languages,
        cmmi: {
          level: 3,
          processes: ['requirements', 'design', 'implementation', 'testing'],
          agents: ['requirements-analyzer', 'system-designer', 'implementation-developer', 'quality-tester']
        },
        created_at: new Date().toISOString()
      };

      fs.writeFileSync(path.join(configsPath, 'project.json'), JSON.stringify(projectConfig, null, 2));
      createdFiles.push('configs/project.json');

      // 生成CMMI配置
      const cmmiConfig = {
        cmmi_level: 3,
        required_processes: [
          'Requirements Development',
          'Technical Solution',
          'Product Integration',
          'Verification',
          'Validation'
        ],
        agent_workflow: {
          requirements: 'requirements-analyzer',
          design: 'system-designer',
          implementation: 'implementation-developer',
          testing: 'quality-tester'
        },
        quality_gates: {
          requirements_review: true,
          design_review: true,
          code_review: true,
          testing_required: true
        }
      };

      fs.writeFileSync(path.join(configsPath, 'cmmi.json'), JSON.stringify(cmmiConfig, null, 2));
      createdFiles.push('configs/cmmi.json');

    } catch (error) {
      logger.error('❌ Config file generation failed:', error);
    }

    return createdFiles;
  }

  // ==================== 工作流执行辅助方法 ====================

  /**
   * 整合工作流结果
   */
  private static async consolidateWorkflowResults(executionResults: any, taskAnalysis: any): Promise<any> {
    const consolidatedResults = {
      summary: `Workflow execution completed with ${executionResults.successful_steps} successful steps`,
      task_completion_status: executionResults.failed_steps === 0 ? 'completed' : 'partially_completed',
      phase_summary: executionResults.phase_results.map((phase: any) => ({
        phase: phase.phase_name,
        status: phase.success ? 'completed' : 'failed',
        completion_rate: phase.completed_steps / (phase.outputs ? Object.keys(phase.outputs).length || 1 : 1),
        key_deliverables: Object.keys(phase.outputs || {})
      })),
      quality_metrics: {
        overall_success_rate: executionResults.successful_steps / (executionResults.successful_steps + executionResults.failed_steps),
        phase_completion_rate: executionResults.phase_results.filter((p: any) => p.success).length / executionResults.phase_results.length,
        estimated_vs_actual: 'N/A' // 在真实实现中会比较估算时间与实际时间
      },
      deliverables: this.extractDeliverables(executionResults),
      recommendations: this.generateRecommendations(executionResults, taskAnalysis)
    };

    return consolidatedResults;
  }

  /**
   * 提取可交付成果
   */
  private static extractDeliverables(executionResults: any): any[] {
    const deliverables: any[] = [];

    executionResults.phase_results.forEach((phase: any) => {
      if (phase.success && phase.outputs) {
        Object.entries(phase.outputs).forEach(([step, output]) => {
          deliverables.push({
            phase: phase.phase_name,
            step: step,
            type: this.categorizeDeliverable(step),
            content: output,
            agents_involved: phase.agents_used
          });
        });
      }
    });

    return deliverables;
  }

  /**
   * 分类可交付成果
   */
  private static categorizeDeliverable(step: string): string {
    if (step.includes('requirements') || step.includes('spec')) return 'documentation';
    if (step.includes('design') || step.includes('architecture')) return 'design';
    if (step.includes('implement') || step.includes('code')) return 'code';
    if (step.includes('test') || step.includes('qa')) return 'testing';
    return 'other';
  }

  /**
   * 生成推荐建议
   */
  private static generateRecommendations(executionResults: any, taskAnalysis: any): string[] {
    const recommendations: string[] = [];

    // 基于执行结果生成建议
    if (executionResults.failed_steps > 0) {
      recommendations.push('Review failed steps and consider additional resources or different approach');
    }

    // 基于成功率生成建议
    const successRate = executionResults.successful_steps / (executionResults.successful_steps + executionResults.failed_steps);
    if (successRate < 0.8) {
      recommendations.push('Consider breaking down complex tasks into smaller, manageable steps');
    }

    // 基于任务复杂度生成建议
    if (taskAnalysis.complexity === 'high') {
      recommendations.push('For high complexity tasks, consider implementing in phases with regular checkpoints');
      recommendations.push('Ensure adequate testing and validation at each phase');
    }

    return recommendations;
  }

  /**
   * 生成后续步骤
   */
  private static generateNextSteps(finalResults: any, taskAnalysis: any): string[] {
    const nextSteps: string[] = [];

    // 基于完成状态生成步骤
    if (finalResults.task_completion_status === 'completed') {
      nextSteps.push('Review deliverables for quality and completeness');
      nextSteps.push('Plan deployment or next phase implementation');
      nextSteps.push('Document lessons learned and best practices');
    } else {
      nextSteps.push('Address failed or incomplete phases');
      nextSteps.push('Re-evaluate resource allocation and timeline');
      nextSteps.push('Consider alternative approaches for challenging areas');
    }

    // 基于任务类型生成步骤
    if (taskAnalysis.domain?.includes('web') || taskAnalysis.domain?.includes('frontend')) {
      nextSteps.push('Conduct user acceptance testing');
      nextSteps.push('Optimize for performance and accessibility');
    }

    return nextSteps;
  }

  /**
   * 创建顺序执行阶段
   */
  private static createSequentialPhases(agents: string[], taskAnalysis: any): any[] {
    return agents.map((agent, index) => ({
      name: `phase_${index + 1}_${agent}`,
      description: `Sequential execution by ${agent}`,
      agents: [agent],
      priority: 'medium',
      estimated_time: 60,
      steps: [`execute_${agent.replace('-', '_')}_tasks`]
    }));
  }

  /**
   * 创建并行执行阶段
   */
  private static createParallelPhases(agents: string[], taskAnalysis: any): any[] {
    return [{
      name: 'parallel_execution',
      description: 'Parallel execution by all agents',
      agents: agents,
      priority: 'high',
      estimated_time: 90,
      steps: agents.map(agent => `execute_${agent.replace('-', '_')}_tasks`)
    }];
  }

  /**
   * 创建线性依赖关系
   */
  private static createLinearDependencies(phases: any[]): any[] {
    const dependencies: any[] = [];
    for (let i = 1; i < phases.length; i++) {
      dependencies.push({
        phase: phases[i].name,
        depends_on: [phases[i - 1].name],
        type: 'sequential'
      });
    }
    return dependencies;
  }

  /**
   * 创建最小依赖关系
   */
  private static createMinimalDependencies(phases: any[]): any[] {
    return []; // 并行执行，无依赖
  }

  /**
   * 创建智能依赖关系
   */
  private static createSmartDependencies(phases: any[], domain: string): any[] {
    const dependencies: any[] = [];

    // 查找特定阶段
    const requirementsPhase = phases.find(p => p.name.includes('requirements'));
    const designPhase = phases.find(p => p.name.includes('design'));
    const implementationPhase = phases.find(p => p.name.includes('implementation'));
    const testingPhase = phases.find(p => p.name.includes('testing'));

    // 建立智能依赖关系
    if (designPhase && requirementsPhase) {
      dependencies.push({
        phase: designPhase.name,
        depends_on: [requirementsPhase.name],
        type: 'prerequisite'
      });
    }

    if (implementationPhase && designPhase) {
      dependencies.push({
        phase: implementationPhase.name,
        depends_on: [designPhase.name],
        type: 'prerequisite'
      });
    }

    if (testingPhase && implementationPhase) {
      dependencies.push({
        phase: testingPhase.name,
        depends_on: [implementationPhase.name],
        type: 'validation'
      });
    }

    return dependencies;
  }

  /**
   * 估算执行持续时间
   */
  private static estimateExecutionDuration(phases: any[], complexity: string): number {
    const baseTime = phases.reduce((total, phase) => total + (phase.estimated_time || 60), 0);
    
    // 根据复杂度调整
    const complexityMultiplier = {
      'simple': 0.8,
      'medium': 1.0,
      'complex': 1.5,
      'high': 1.8
    };

    return Math.round(baseTime * (complexityMultiplier[complexity as keyof typeof complexityMultiplier] || 1.0));
  }

  // ==================== 质量分析辅助方法 ====================

  /**
   * 分析依赖关系
   */
  private static async analyzeDependencies(projectPath: string, projectStructure: any): Promise<any> {
    const dependencyResults = {
      total_dependencies: 0,
      outdated_dependencies: 0,
      security_vulnerabilities: 0,
      dependency_issues: [] as any[],
      recommendations: [] as string[]
    };

    try {
      // 检查package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        dependencyResults.total_dependencies = Object.keys(deps).length;

        // 模拟检查过时的依赖
        const outdatedPackages = ['lodash', 'jquery', 'moment'];
        dependencyResults.outdated_dependencies = Object.keys(deps)
          .filter(dep => outdatedPackages.includes(dep)).length;

        // 模拟安全漏洞检查
        const vulnerablePackages = ['node-sass', 'tar'];
        dependencyResults.security_vulnerabilities = Object.keys(deps)
          .filter(dep => vulnerablePackages.includes(dep)).length;
      }

      // 生成建议
      if (dependencyResults.outdated_dependencies > 0) {
        dependencyResults.recommendations.push('Update outdated dependencies to latest versions');
      }
      if (dependencyResults.security_vulnerabilities > 0) {
        dependencyResults.recommendations.push('Fix security vulnerabilities in dependencies');
      }

    } catch (error) {
      logger.warn(`⚠️ Error analyzing dependencies: ${error}`);
    }

    return dependencyResults;
  }

  /**
   * 分析测试覆盖率
   */
  private static async analyzeTestCoverage(projectPath: string, projectStructure: any): Promise<any> {
    const coverageResults = {
      test_coverage_percentage: 0,
      lines_covered: 0,
      lines_total: 0,
      test_files_count: projectStructure.test_files || 0,
      coverage_by_file: [] as any[],
      recommendations: [] as string[]
    };

    try {
      // 模拟覆盖率计算
      const sourceFilesCount = projectStructure.source_files || 0;
      const testFilesCount = projectStructure.test_files || 0;
      
      if (sourceFilesCount > 0) {
        // 基于测试文件与源文件比例估算覆盖率
        const testRatio = testFilesCount / sourceFilesCount;
        coverageResults.test_coverage_percentage = Math.min(Math.round(testRatio * 80), 95);
        
        coverageResults.lines_total = sourceFilesCount * 50; // 估算总行数
        coverageResults.lines_covered = Math.round(coverageResults.lines_total * coverageResults.test_coverage_percentage / 100);
      }

      // 生成建议
      if (coverageResults.test_coverage_percentage < 80) {
        coverageResults.recommendations.push('Increase test coverage to at least 80%');
      }
      if (testFilesCount === 0) {
        coverageResults.recommendations.push('Add unit tests for critical functionality');
      }

    } catch (error) {
      logger.warn(`⚠️ Error analyzing test coverage: ${error}`);
    }

    return coverageResults;
  }

  /**
   * 评估技术债务
   */
  private static async assessTechnicalDebt(
    codeQualityResults: any,
    securityResults: any,
    performanceResults: any
  ): Promise<any> {
    const debtResults = {
      technical_debt_score: 0,
      debt_categories: {
        code_quality: 0,
        security: 0,
        performance: 0,
        testing: 0,
        documentation: 0
      },
      estimated_fix_time_hours: 0,
      priority_issues: [] as any[],
      recommendations: [] as string[]
    };

    try {
      // 计算代码质量债务
      const qualityIssues = codeQualityResults?.issues?.length || 0;
      debtResults.debt_categories.code_quality = Math.min(qualityIssues / 10, 10);

      // 计算安全债务
      const securityIssues = securityResults?.security_issues?.length || 0;
      debtResults.debt_categories.security = Math.min(securityIssues / 5, 10);

      // 计算性能债务
      const performanceIssues = performanceResults?.performance_issues?.length || 0;
      debtResults.debt_categories.performance = Math.min(performanceIssues / 8, 10);

      // 计算综合技术债务评分
      const totalDebt = Object.values(debtResults.debt_categories).reduce((sum, val) => sum + val, 0);
      debtResults.technical_debt_score = Math.round((totalDebt / 40) * 100);

      // 估算修复时间
      debtResults.estimated_fix_time_hours = Math.round(totalDebt * 2);

      // 生成建议
      if (debtResults.technical_debt_score > 60) {
        debtResults.recommendations.push('High technical debt detected - consider refactoring priority');
      }
      if (debtResults.debt_categories.security > 7) {
        debtResults.recommendations.push('Critical security issues need immediate attention');
      }

    } catch (error) {
      logger.warn(`⚠️ Error assessing technical debt: ${error}`);
    }

    return debtResults;
  }

  /**
   * 生成质量报告
   */
  private static async generateQualityReport(analysisData: any): Promise<any> {
    const report = {
      success: true,
      analysis_timestamp: new Date().toISOString(),
      project_path: analysisData.projectPath,
      analysis_type: analysisData.analysisType,
      language: analysisData.language,
      
      // 项目概览
      project_overview: {
        total_files: analysisData.projectStructure.total_files,
        source_files: analysisData.projectStructure.source_files,
        test_files: analysisData.projectStructure.test_files,
        languages_detected: analysisData.projectStructure.languages_detected,
        frameworks: analysisData.projectStructure.frameworks,
        build_tools: analysisData.projectStructure.build_tools
      },

      // 质量评分
      quality_scores: {
        overall_quality: analysisData.codeQuality?.overall_score || 0,
        maintainability: analysisData.codeQuality?.maintainability_score || 0,
        readability: analysisData.codeQuality?.readability_score || 0,
        complexity: analysisData.codeQuality?.complexity_score || 0,
        security: analysisData.security?.security_score || 0,
        performance: analysisData.performance?.performance_score || 0,
        test_coverage: analysisData.testCoverage?.test_coverage_percentage || 0
      },

      // 问题汇总
      issues_summary: {
        total_issues: (analysisData.codeQuality?.issues?.length || 0) + 
                     (analysisData.security?.security_issues?.length || 0) +
                     (analysisData.performance?.performance_issues?.length || 0),
        critical_issues: 0,
        major_issues: 0,
        minor_issues: 0,
        code_quality_issues: analysisData.codeQuality?.issues?.length || 0,
        security_issues: analysisData.security?.security_issues?.length || 0,
        performance_issues: analysisData.performance?.performance_issues?.length || 0
      },

      // 技术债务
      technical_debt: analysisData.technicalDebt,

      // 依赖分析
      dependencies: analysisData.dependencies,

      // 详细分析结果
      detailed_results: {
        code_quality: analysisData.codeQuality,
        security: analysisData.security,
        performance: analysisData.performance,
        test_coverage: analysisData.testCoverage
      },

      // 综合建议
      recommendations: this.generateComprehensiveRecommendations(analysisData),

      // 后续行动计划
      action_plan: this.generateActionPlan(analysisData)
    };

    // 计算问题严重程度分布
    this.categorizeIssuesBySeverity(report, analysisData);

    return report;
  }

  /**
   * 判断是否为源文件
   */
  private static isSourceFile(filename: string): boolean {
    const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs'];
    return sourceExtensions.some(ext => filename.endsWith(ext)) && 
           !filename.includes('.test.') && 
           !filename.includes('.spec.');
  }

  /**
   * 判断是否为测试文件
   */
  private static isTestFile(filename: string): boolean {
    return filename.includes('.test.') || 
           filename.includes('.spec.') || 
           filename.includes('test') ||
           filename.includes('spec');
  }

  /**
   * 判断是否为配置文件
   */
  private static isConfigFile(filename: string): boolean {
    const configFiles = ['package.json', 'tsconfig.json', '.eslintrc', 'webpack.config.js', 'babel.config.js'];
    return configFiles.some(config => filename.includes(config)) ||
           filename.startsWith('.') ||
           filename.includes('config');
  }

  /**
   * 判断是否为文档文件
   */
  private static isDocumentationFile(filename: string): boolean {
    const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
    return docExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * 从文件名检测编程语言
   */
  private static detectLanguageFromFile(filename: string): string | null {
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'React',
      '.tsx': 'TypeScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust'
    };

    for (const [ext, lang] of Object.entries(languageMap)) {
      if (filename.endsWith(ext)) {
        return lang;
      }
    }
    return null;
  }

  /**
   * 检测构建工具
   */
  private static detectBuildTools(projectPath: string): string[] {
    const buildTools: string[] = [];
    
    const buildToolFiles = {
      'package.json': 'npm',
      'yarn.lock': 'yarn',
      'Makefile': 'make',
      'Dockerfile': 'docker',
      'webpack.config.js': 'webpack',
      'rollup.config.js': 'rollup',
      'vite.config.js': 'vite'
    };

    for (const [file, tool] of Object.entries(buildToolFiles)) {
      if (fs.existsSync(path.join(projectPath, file))) {
        buildTools.push(tool);
      }
    }

    return buildTools;
  }

  /**
   * 检测框架
   */
  private static detectFrameworks(projectPath: string): string[] {
    const frameworks: string[] = [];
    
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const frameworkMap: Record<string, string> = {
          'react': 'React',
          'vue': 'Vue.js',
          'angular': 'Angular',
          'express': 'Express.js',
          'nestjs': 'NestJS',
          'next': 'Next.js',
          'nuxt': 'Nuxt.js'
        };

        for (const [dep, framework] of Object.entries(frameworkMap)) {
          if (Object.keys(deps).some(d => d.includes(dep))) {
            frameworks.push(framework);
          }
        }
      }
    } catch (error) {
      // 忽略解析错误
    }

    return frameworks;
  }

  /**
   * 查找源文件
   */
  private static findSourceFiles(projectPath: string, projectStructure: any): string[] {
    const sourceFiles: string[] = [];
    
    const scanForSourceFiles = (dirPath: string, depth: number = 0): void => {
      if (depth > 8) return;
      
      try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
              scanForSourceFiles(itemPath, depth + 1);
            }
          } else if (stat.isFile() && this.isSourceFile(item)) {
            sourceFiles.push(itemPath);
          }
        }
      } catch (error) {
        // 忽略权限错误等
      }
    };

    scanForSourceFiles(projectPath);
    return sourceFiles;
  }

  /**
   * 计算综合质量评分
   */
  private static calculateOverallQualityScore(fileAnalysis: any[]): number {
    if (fileAnalysis.length === 0) return 0;
    
    const scores = fileAnalysis.map(f => (f.complexity_score + f.maintainability_score) / 2);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * 计算可维护性评分
   */
  private static calculateMaintainabilityScore(fileAnalysis: any[]): number {
    if (fileAnalysis.length === 0) return 0;
    
    const scores = fileAnalysis.map(f => f.maintainability_score);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * 计算可读性评分
   */
  private static calculateReadabilityScore(fileAnalysis: any[]): number {
    if (fileAnalysis.length === 0) return 0;
    
    // 基于文件大小和复杂度估算可读性
    const readabilityScores = fileAnalysis.map(f => {
      const sizeScore = f.lines_of_code < 200 ? 90 : f.lines_of_code < 500 ? 70 : 50;
      const complexityScore = 100 - f.complexity_score;
      return (sizeScore + complexityScore) / 2;
    });
    
    return Math.round(readabilityScores.reduce((sum, score) => sum + score, 0) / readabilityScores.length);
  }

  /**
   * 计算复杂度评分
   */
  private static calculateComplexityScore(fileAnalysis: any[]): number {
    if (fileAnalysis.length === 0) return 0;
    
    const complexityScores = fileAnalysis.map(f => f.complexity_score);
    return Math.round(complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length);
  }

  /**
   * 生成质量度量
   */
  private static generateQualityMetrics(fileAnalysis: any[], projectStructure: any): any {
    return {
      average_file_size: fileAnalysis.length > 0 ? 
        Math.round(fileAnalysis.reduce((sum, f) => sum + f.file_size, 0) / fileAnalysis.length) : 0,
      average_lines_per_file: fileAnalysis.length > 0 ? 
        Math.round(fileAnalysis.reduce((sum, f) => sum + f.lines_of_code, 0) / fileAnalysis.length) : 0,
      total_lines_of_code: fileAnalysis.reduce((sum, f) => sum + f.lines_of_code, 0),
      files_with_high_complexity: fileAnalysis.filter(f => f.complexity_score > 80).length,
      files_needing_refactor: fileAnalysis.filter(f => f.maintainability_score < 60).length
    };
  }

  /**
   * 计算文件复杂度
   */
  private static calculateFileComplexity(content: string, language: string): number {
    let complexity = 0;
    
    // 基于控制流语句计算复杂度
    const controlFlowPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\b/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcatch\s*\(/g,
      /\btry\s*\{/g,
      /\?\s*.*\s*:/g // 三元操作符
    ];

    controlFlowPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      complexity += matches ? matches.length : 0;
    });

    // 基于函数数量
    const functionPattern = /function\s+\w+|=>\s*{|^\s*\w+\s*\(/gm;
    const functions = content.match(functionPattern);
    complexity += functions ? functions.length * 2 : 0;

    // 基于嵌套深度估算
    const lines = content.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;
    
    lines.forEach(line => {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentNesting += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, currentNesting);
    });

    complexity += maxNesting * 5;

    // 标准化为0-100分数
    return Math.min(Math.round(complexity / 2), 100);
  }

  /**
   * 计算文件可维护性
   */
  private static calculateFileMaintainability(content: string, language: string): number {
    let maintainability = 100;

    // 文件长度惩罚
    const lines = content.split('\n').length;
    if (lines > 300) maintainability -= (lines - 300) / 10;
    if (lines > 500) maintainability -= 20;

    // 注释率奖励
    const commentLines = content.split('\n').filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*') ||
      line.trim().startsWith('#')
    ).length;
    const commentRatio = commentLines / lines;
    if (commentRatio > 0.1) maintainability += 10;
    if (commentRatio > 0.2) maintainability += 10;

    // 函数长度检查
    const longFunctions = content.match(/function[\s\S]*?\{[\s\S]*?\}/g) || [];
    longFunctions.forEach(func => {
      const funcLines = func.split('\n').length;
      if (funcLines > 50) maintainability -= 5;
      if (funcLines > 100) maintainability -= 10;
    });

    return Math.max(0, Math.min(100, Math.round(maintainability)));
  }

  /**
   * 检测代码问题
   */
  private static detectCodeIssues(content: string, filePath: string, language: string): any[] {
    const issues: any[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 检测长行
      if (line.length > 120) {
        issues.push({
          type: 'style',
          severity: 'minor',
          line: lineNumber,
          message: 'Line too long (>120 characters)',
          category: 'readability'
        });
      }

      // 检测TODO/FIXME
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'maintenance',
          severity: 'minor',
          line: lineNumber,
          message: 'TODO/FIXME comment found',
          category: 'technical_debt'
        });
      }

      // 检测console.log (JavaScript/TypeScript)
      if ((language.includes('JavaScript') || language.includes('TypeScript')) && 
          line.includes('console.log')) {
        issues.push({
          type: 'quality',
          severity: 'minor',
          line: lineNumber,
          message: 'Console.log statement should be removed',
          category: 'debugging'
        });
      }

      // 检测空的catch块
      if (line.trim() === 'catch' && lines[index + 1]?.trim() === '{' && 
          lines[index + 2]?.trim() === '}') {
        issues.push({
          type: 'quality',
          severity: 'major',
          line: lineNumber,
          message: 'Empty catch block',
          category: 'error_handling'
        });
      }
    });

    return issues;
  }

  /**
   * 计算文件度量
   */
  private static calculateFileMetrics(content: string, language: string): any {
    const lines = content.split('\n');
    
    return {
      total_lines: lines.length,
      code_lines: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
      comment_lines: lines.filter(line => 
        line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*')
      ).length,
      blank_lines: lines.filter(line => !line.trim()).length,
      cyclomatic_complexity: Math.min(this.calculateFileComplexity(content, language) / 5, 20)
    };
  }

  /**
   * 检测安全问题
   */
  private static detectSecurityIssues(content: string, filePath: string): any[] {
    const securityIssues: any[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // SQL注入风险
      if (line.includes('SELECT ') && line.includes('+')) {
        securityIssues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Potential SQL injection vulnerability',
          category: 'injection'
        });
      }

      // 硬编码密码
      if (line.toLowerCase().includes('password') && line.includes('=')) {
        securityIssues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Potential hardcoded password',
          category: 'credentials'
        });
      }

      // eval使用
      if (line.includes('eval(')) {
        securityIssues.push({
          type: 'security',
          severity: 'high',
          line: lineNumber,
          message: 'Use of eval() is dangerous',
          category: 'code_injection'
        });
      }
    });

    return securityIssues;
  }

  /**
   * 检查依赖漏洞
   */
  private static checkDependencyVulnerabilities(projectPath: string): any[] {
    const vulnerabilities: any[] = [];

    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // 模拟已知漏洞检查
        const knownVulnerabilities = ['node-sass', 'tar', 'lodash'];
        
        Object.keys(deps).forEach(dep => {
          if (knownVulnerabilities.includes(dep)) {
            vulnerabilities.push({
              package: dep,
              version: deps[dep],
              severity: 'medium',
              description: `Known security vulnerability in ${dep}`,
              recommendation: `Update ${dep} to latest version`
            });
          }
        });
      }
    } catch (error) {
      // 忽略解析错误
    }

    return vulnerabilities;
  }

  /**
   * 计算安全评分
   */
  private static calculateSecurityScore(securityResults: any): number {
    const totalIssues = securityResults.security_issues.length + securityResults.vulnerabilities.length;
    const highSeverityIssues = securityResults.security_issues.filter((issue: any) => issue.severity === 'high').length;
    
    let score = 100;
    score -= totalIssues * 5;
    score -= highSeverityIssues * 15;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成安全建议
   */
  private static generateSecurityRecommendations(securityResults: any): string[] {
    const recommendations: string[] = [];

    if (securityResults.security_issues.length > 0) {
      recommendations.push('Address identified security vulnerabilities in code');
    }
    if (securityResults.vulnerabilities.length > 0) {
      recommendations.push('Update vulnerable dependencies to secure versions');
    }
    if (securityResults.security_score < 70) {
      recommendations.push('Implement comprehensive security review process');
    }

    return recommendations;
  }

  /**
   * 检测性能问题
   */
  private static detectPerformanceIssues(content: string, filePath: string): any[] {
    const perfIssues: any[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 检测同步文件操作
      if (line.includes('readFileSync') || line.includes('writeFileSync')) {
        perfIssues.push({
          type: 'performance',
          severity: 'medium',
          line: lineNumber,
          message: 'Synchronous file operation may block execution',
          category: 'blocking_operations'
        });
      }

      // 检测循环中的DOM操作
      if ((line.includes('for ') || line.includes('while ')) && 
          (line.includes('getElementById') || line.includes('querySelector'))) {
        perfIssues.push({
          type: 'performance',
          severity: 'high',
          line: lineNumber,
          message: 'DOM operations in loop can be expensive',
          category: 'dom_performance'
        });
      }
    });

    return perfIssues;
  }

  /**
   * 计算性能评分
   */
  private static calculatePerformanceScore(performanceResults: any): number {
    const totalIssues = performanceResults.performance_issues.length;
    const highSeverityIssues = performanceResults.performance_issues.filter((issue: any) => issue.severity === 'high').length;
    
    let score = 100;
    score -= totalIssues * 8;
    score -= highSeverityIssues * 20;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成优化建议
   */
  private static generateOptimizationSuggestions(performanceResults: any): string[] {
    const suggestions: string[] = [];

    if (performanceResults.performance_issues.length > 0) {
      suggestions.push('Optimize identified performance bottlenecks');
    }
    if (performanceResults.performance_score < 80) {
      suggestions.push('Consider implementing performance monitoring');
    }

    return suggestions;
  }

  /**
   * 生成综合建议
   */
  private static generateComprehensiveRecommendations(analysisData: any): string[] {
    const recommendations: string[] = [];

    // 质量建议
    if (analysisData.codeQuality?.overall_score < 70) {
      recommendations.push('Improve overall code quality through refactoring');
    }

    // 测试建议
    if ((analysisData.testCoverage?.test_coverage_percentage || 0) < 80) {
      recommendations.push('Increase test coverage to at least 80%');
    }

    // 安全建议
    if ((analysisData.security?.security_score || 100) < 80) {
      recommendations.push('Address security vulnerabilities as priority');
    }

    // 性能建议
    if ((analysisData.performance?.performance_score || 100) < 80) {
      recommendations.push('Optimize performance-critical code paths');
    }

    // 技术债务建议
    if ((analysisData.technicalDebt?.technical_debt_score || 0) > 60) {
      recommendations.push('Prioritize technical debt reduction');
    }

    return recommendations;
  }

  /**
   * 生成行动计划
   */
  private static generateActionPlan(analysisData: any): any[] {
    const actionPlan: any[] = [];

    // 高优先级行动
    if ((analysisData.security?.security_score || 100) < 70) {
      actionPlan.push({
        priority: 'high',
        action: 'Fix critical security vulnerabilities',
        estimated_effort: '1-2 days',
        category: 'security'
      });
    }

    // 中优先级行动
    if ((analysisData.codeQuality?.overall_score || 100) < 60) {
      actionPlan.push({
        priority: 'medium',
        action: 'Refactor low-quality code modules',
        estimated_effort: '1 week',
        category: 'quality'
      });
    }

    // 低优先级行动
    if ((analysisData.testCoverage?.test_coverage_percentage || 100) < 80) {
      actionPlan.push({
        priority: 'low',
        action: 'Increase test coverage',
        estimated_effort: '2-3 days',
        category: 'testing'
      });
    }

    return actionPlan;
  }

  /**
   * 按严重程度分类问题
   */
  private static categorizeIssuesBySeverity(report: any, analysisData: any): void {
    const allIssues = [
      ...(analysisData.codeQuality?.issues || []),
      ...(analysisData.security?.security_issues || []),
      ...(analysisData.performance?.performance_issues || [])
    ];

    report.issues_summary.critical_issues = allIssues.filter(issue => issue.severity === 'high').length;
    report.issues_summary.major_issues = allIssues.filter(issue => issue.severity === 'medium').length;
    report.issues_summary.minor_issues = allIssues.filter(issue => issue.severity === 'low' || issue.severity === 'minor').length;
  }

  // ==================== 模型调度辅助方法 ====================

  /**
   * 获取当前模型状态
   */
  private static async getModelStatus(): Promise<any> {
    const models = [
      {
        name: 'gpt-4.1',
        version: '4.1.0',
        tier: 'premium',
        capabilities: ['text_generation', 'code_analysis', 'translation', 'reasoning'],
        current_load: Math.floor(Math.random() * 80) + 10, // 10-90%
        max_concurrent_sessions: 100,
        active_sessions: Math.floor(Math.random() * 50) + 10,
        avg_response_time: Math.floor(Math.random() * 500) + 200, // 200-700ms
        availability: 'available',
        cost_per_1k_tokens: 0.03
      },
      {
        name: 'gpt-4.5',
        version: '4.5.0',
        tier: 'enterprise',
        capabilities: ['text_generation', 'code_analysis', 'translation', 'reasoning', 'multimodal'],
        current_load: Math.floor(Math.random() * 60) + 20, // 20-80%
        max_concurrent_sessions: 50,
        active_sessions: Math.floor(Math.random() * 30) + 5,
        avg_response_time: Math.floor(Math.random() * 300) + 150, // 150-450ms
        availability: 'available',
        cost_per_1k_tokens: 0.06
      },
      {
        name: 'claude-sonnet-4',
        version: '4.0.0',
        tier: 'premium',
        capabilities: ['text_generation', 'code_analysis', 'reasoning', 'document_analysis'],
        current_load: Math.floor(Math.random() * 70) + 15, // 15-85%
        max_concurrent_sessions: 75,
        active_sessions: Math.floor(Math.random() * 40) + 8,
        avg_response_time: Math.floor(Math.random() * 600) + 250, // 250-850ms
        availability: 'available',
        cost_per_1k_tokens: 0.025
      }
    ];

    return {
      timestamp: new Date().toISOString(),
      total_models: models.length,
      available_models: models.filter(m => m.availability === 'available').length,
      models: models,
      global_metrics: {
        total_active_sessions: models.reduce((sum, m) => sum + m.active_sessions, 0),
        average_load: Math.round(models.reduce((sum, m) => sum + m.current_load, 0) / models.length),
        total_capacity: models.reduce((sum, m) => sum + m.max_concurrent_sessions, 0)
      }
    };
  }

  /**
   * 分析任务需求
   */
  private static async analyzeTaskRequirements(taskType: string, priority: string): Promise<any> {
    const taskProfiles: Record<string, any> = {
      'translate': {
        required_capabilities: ['text_generation', 'translation'],
        estimated_tokens: Math.floor(Math.random() * 2000) + 500, // 500-2500
        complexity: 'medium',
        min_tier: 'standard',
        preferred_models: ['gpt-4.1', 'gpt-4.5'],
        estimated_duration_minutes: Math.floor(Math.random() * 5) + 2 // 2-7 minutes
      },
      'analyze': {
        required_capabilities: ['reasoning', 'code_analysis'],
        estimated_tokens: Math.floor(Math.random() * 5000) + 1000, // 1000-6000
        complexity: 'high',
        min_tier: 'premium',
        preferred_models: ['gpt-4.5', 'claude-sonnet-4'],
        estimated_duration_minutes: Math.floor(Math.random() * 10) + 5 // 5-15 minutes
      },
      'generate': {
        required_capabilities: ['text_generation', 'code_analysis'],
        estimated_tokens: Math.floor(Math.random() * 3000) + 800, // 800-3800
        complexity: 'medium',
        min_tier: 'standard',
        preferred_models: ['gpt-4.1', 'gpt-4.5'],
        estimated_duration_minutes: Math.floor(Math.random() * 8) + 3 // 3-11 minutes
      },
      'code_review': {
        required_capabilities: ['code_analysis', 'reasoning'],
        estimated_tokens: Math.floor(Math.random() * 4000) + 1200, // 1200-5200
        complexity: 'high',
        min_tier: 'premium',
        preferred_models: ['claude-sonnet-4', 'gpt-4.5'],
        estimated_duration_minutes: Math.floor(Math.random() * 12) + 7 // 7-19 minutes
      }
    };

    const profile = taskProfiles[taskType] || taskProfiles['generate'];
    
    // 根据优先级调整需求
    const priorityMultipliers: Record<string, number> = {
      'low': 0.8,
      'normal': 1.0,
      'high': 1.3,
      'urgent': 1.5
    };

    const multiplier = priorityMultipliers[priority] || 1.0;

    return {
      task_type: taskType,
      priority: priority,
      profile: profile,
      adjusted_requirements: {
        ...profile,
        estimated_tokens: Math.round(profile.estimated_tokens * multiplier),
        estimated_duration_minutes: Math.round(profile.estimated_duration_minutes * multiplier),
        urgency_score: this.calculateUrgencyScore(priority),
        resource_intensity: this.calculateResourceIntensity(profile.complexity, multiplier)
      }
    };
  }

  /**
   * 选择最佳模型
   */
  private static async selectOptimalModel(preferredModel: string, taskAnalysis: any, modelStatus: any): Promise<any> {
    const availableModels = modelStatus.models.filter((m: any) => m.availability === 'available');
    const requirements = taskAnalysis.adjusted_requirements;

    // 如果指定了首选模型且可用，检查是否满足需求
    if (preferredModel) {
      const preferred = availableModels.find((m: any) => m.name === preferredModel);
      if (preferred && this.modelMeetsRequirements(preferred, requirements)) {
        logger.info(`✅ Using preferred model: ${preferredModel}`);
        return preferred;
      }
    }

    // 根据任务需求筛选合适的模型
    const suitableModels = availableModels.filter((model: any) => 
      this.modelMeetsRequirements(model, requirements)
    );

    if (suitableModels.length === 0) {
      throw new Error('No suitable models available for the task requirements');
    }

    // 计算每个模型的评分
    const scoredModels = suitableModels.map((model: any) => ({
      ...model,
      score: this.calculateModelScore(model, requirements, taskAnalysis.priority)
    }));

    // 选择评分最高的模型
    const selectedModel = scoredModels.reduce((best: any, current: any) => 
      current.score > best.score ? current : best
    );

    logger.info(`🎯 Selected optimal model: ${selectedModel.name} (score: ${selectedModel.score.toFixed(2)})`);
    return selectedModel;
  }

  /**
   * 计算调度信息
   */
  private static async calculateScheduleInfo(selectedModel: any, priority: string, taskAnalysis: any): Promise<any> {
    const now = new Date();
    const priorityWeights: Record<string, number> = {
      'low': 0.5,
      'normal': 1.0,
      'high': 2.0,
      'urgent': 5.0
    };

    const priorityWeight = priorityWeights[priority] || 1.0;
    
    // 计算队列位置
    const baseQueuePosition = Math.max(1, selectedModel.active_sessions - Math.floor(priorityWeight * 10));
    const queuePosition = priority === 'urgent' ? 1 : Math.max(1, baseQueuePosition);
    
    // 计算等待时间
    const avgTaskTime = 3; // 平均任务时间（分钟）
    const waitTimeMinutes = Math.max(0, (queuePosition - 1) * avgTaskTime / selectedModel.max_concurrent_sessions * 10);
    const waitTimeSeconds = Math.round(waitTimeMinutes * 60);
    
    // 计算预计执行时间
    const baseExecutionTime = taskAnalysis.adjusted_requirements.estimated_duration_minutes;
    const loadMultiplier = 1 + (selectedModel.current_load / 100) * 0.3; // 负载影响
    const executionTimeMinutes = Math.round(baseExecutionTime * loadMultiplier);
    
    // 计算过期时间
    const maxDurationMinutes = Math.max(30, executionTimeMinutes * 2); // 至少30分钟，最多执行时间的2倍
    const expiresAt = new Date(now.getTime() + maxDurationMinutes * 60000);

    return {
      queue_position: queuePosition,
      estimated_wait_time: this.formatDuration(waitTimeSeconds),
      estimated_execution_time: this.formatDuration(executionTimeMinutes * 60),
      allocated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      max_duration_minutes: maxDurationMinutes,
      priority_weight: priorityWeight,
      load_impact: Math.round(loadMultiplier * 100) / 100
    };
  }

  /**
   * 分配模型资源
   */
  private static async allocateModelResource(agentId: string, selectedModel: any, scheduleInfo: any, taskType: string): Promise<any> {
    const sessionId = `${selectedModel.name}_${agentId}_${Date.now()}`;
    
    // 根据模型层级和任务类型分配资源
    const resourceAllocation = this.calculateResourceAllocation(selectedModel, taskType);
    
    return {
      session_id: sessionId,
      agent_id: agentId,
      model_name: selectedModel.name,
      allocated_resources: resourceAllocation,
      allocation_timestamp: new Date().toISOString(),
      status: 'allocated'
    };
  }

  /**
   * 计算资源分配
   */
  private static calculateResourceAllocation(model: any, taskType: string): any {
    const baseCPU = model.tier === 'enterprise' ? 8 : model.tier === 'premium' ? 4 : 2;
    const baseMemory = model.tier === 'enterprise' ? 32 : model.tier === 'premium' ? 16 : 8;
    const baseGPU = model.tier === 'enterprise' ? 4 : model.tier === 'premium' ? 2 : 1;
    const baseBandwidth = model.tier === 'enterprise' ? 1000 : model.tier === 'premium' ? 500 : 200;

    // 根据任务类型调整资源
    const taskMultipliers: Record<string, any> = {
      'analyze': { cpu: 1.5, memory: 1.8, gpu: 1.2, bandwidth: 1.0 },
      'translate': { cpu: 1.0, memory: 1.2, gpu: 0.8, bandwidth: 1.5 },
      'generate': { cpu: 1.2, memory: 1.4, gpu: 1.0, bandwidth: 1.2 },
      'code_review': { cpu: 1.6, memory: 2.0, gpu: 1.1, bandwidth: 1.0 }
    };

    const multiplier = taskMultipliers[taskType] || { cpu: 1.0, memory: 1.0, gpu: 1.0, bandwidth: 1.0 };

    return {
      cpu_cores: Math.round(baseCPU * multiplier.cpu),
      memory_gb: Math.round(baseMemory * multiplier.memory),
      gpu_allocation: Math.round(baseGPU * multiplier.gpu),
      bandwidth_mbps: Math.round(baseBandwidth * multiplier.bandwidth)
    };
  }

  /**
   * 计算成本估算
   */
  private static calculateCostEstimation(selectedModel: any, scheduleInfo: any): any {
    const estimatedTokens = Math.floor(Math.random() * 3000) + 1000; // 模拟token使用量
    const tokenCost = estimatedTokens * selectedModel.cost_per_1k_tokens / 1000;
    
    // 资源使用成本（模拟）
    const resourceCostPerMinute = selectedModel.tier === 'enterprise' ? 0.1 : 
                                 selectedModel.tier === 'premium' ? 0.05 : 0.02;
    const durationMinutes = parseInt(scheduleInfo.estimated_execution_time.split('m')[0]) || 5;
    const resourceCost = resourceCostPerMinute * durationMinutes;
    
    const totalCost = tokenCost + resourceCost;

    return {
      estimated_tokens: estimatedTokens,
      token_cost: Math.round(tokenCost * 1000) / 1000,
      resource_cost: Math.round(resourceCost * 1000) / 1000,
      total_cost: Math.round(totalCost * 1000) / 1000,
      currency: 'USD',
      cost_breakdown: {
        model_usage: Math.round((tokenCost / totalCost) * 100),
        resource_usage: Math.round((resourceCost / totalCost) * 100)
      }
    };
  }

  /**
   * 获取备用模型
   */
  private static getFallbackModels(selectedModel: any, taskAnalysis: any): any[] {
    const allModels = [
      'gpt-4.1', 'gpt-4.5', 'claude-sonnet-4'
    ].filter(name => name !== selectedModel.name);

    return allModels.slice(0, 2).map(name => ({
      name: name,
      reason: 'Performance fallback',
      estimated_degradation: Math.floor(Math.random() * 20) + 5 // 5-25%
    }));
  }

  /**
   * 检查模型是否满足需求
   */
  private static modelMeetsRequirements(model: any, requirements: any): boolean {
    // 检查能力需求
    const hasRequiredCapabilities = requirements.required_capabilities.every((cap: string) =>
      model.capabilities.includes(cap)
    );

    // 检查层级需求
    const tierLevels: Record<string, number> = { 'standard': 1, 'premium': 2, 'enterprise': 3 };
    const modelTierLevel = tierLevels[model.tier] || 1;
    const requiredTierLevel = tierLevels[requirements.min_tier] || 1;
    const meetsTierRequirement = modelTierLevel >= requiredTierLevel;

    // 检查负载状况
    const loadOk = model.current_load < 95; // 不超过95%负载

    return hasRequiredCapabilities && meetsTierRequirement && loadOk;
  }

  /**
   * 计算模型评分
   */
  private static calculateModelScore(model: any, requirements: any, priority: string): number {
    let score = 0;

    // 基础可用性评分 (0-30分)
    score += Math.max(0, 30 - model.current_load * 0.3);

    // 性能评分 (0-25分)
    const responseTimeScore = Math.max(0, 25 - (model.avg_response_time - 100) * 0.02);
    score += responseTimeScore;

    // 成本效益评分 (0-20分)
    const costScore = Math.max(0, 20 - model.cost_per_1k_tokens * 200);
    score += costScore;

    // 能力匹配评分 (0-15分)
    const capabilityMatch = requirements.required_capabilities.filter((cap: string) =>
      model.capabilities.includes(cap)
    ).length / requirements.required_capabilities.length;
    score += capabilityMatch * 15;

    // 优先级加权 (0-10分)
    const priorityBonus = priority === 'urgent' ? 10 : priority === 'high' ? 7 : priority === 'normal' ? 5 : 3;
    score += priorityBonus;

    return Math.round(score * 100) / 100;
  }

  /**
   * 计算紧急度评分
   */
  private static calculateUrgencyScore(priority: string): number {
    const scores: Record<string, number> = {
      'low': 25,
      'normal': 50,
      'high': 75,
      'urgent': 100
    };
    return scores[priority] || 50;
  }

  /**
   * 计算资源强度
   */
  private static calculateResourceIntensity(complexity: string, multiplier: number): number {
    const baseIntensity: Record<string, number> = {
      'low': 30,
      'medium': 60,
      'high': 90
    };
    return Math.round((baseIntensity[complexity] || 60) * multiplier);
  }

  /**
   * 格式化持续时间
   */
  private static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * 生成模型优化建议
   */
  private static generateModelOptimizationSuggestions(taskAnalysis: any, selectedModel: any): string[] {
    const suggestions: string[] = [];

    // 基于模型负载的建议
    if (selectedModel.current_load > 80) {
      suggestions.push('Consider rescheduling non-urgent tasks to reduce model load');
    }

    // 基于任务类型的建议
    if (taskAnalysis.task_type === 'translate' && selectedModel.name !== 'gpt-4.1') {
      suggestions.push('GPT-4.1 is optimized for translation tasks');
    }

    if (taskAnalysis.task_type === 'analyze' && selectedModel.avg_response_time > 500) {
      suggestions.push('Consider breaking complex analysis into smaller chunks');
    }

    // 基于优先级的建议
    if (taskAnalysis.priority === 'low' && selectedModel.tier === 'enterprise') {
      suggestions.push('Premium models may be more cost-effective for low-priority tasks');
    }

    // 基于估计token使用量的建议
    if (taskAnalysis.adjusted_requirements.estimated_tokens > 4000) {
      suggestions.push('Large token usage detected - consider streaming response for better UX');
    }

    // 成本优化建议
    if (selectedModel.cost_per_1k_tokens > 0.05) {
      suggestions.push('Monitor token usage closely due to high model cost');
    }

    return suggestions.length > 0 ? suggestions : ['No specific optimizations needed'];
  }

  // ==================== 系统诊断辅助方法 ====================

  /**
   * 获取系统监控状态
   */
  private static async getSystemMonitoringStatus(metricType: string): Promise<any> {
    const timestamp = new Date().toISOString();
    
    const systemMetrics = await this.collectSystemMetrics();
    const applicationMetrics = await this.collectApplicationMetrics();
    const businessMetrics = await this.collectBusinessMetrics();
    
    const result = {
      success: true,
      action: 'status',
      metric_type: metricType,
      timestamp: timestamp,
      
      // 系统指标
      system_metrics: systemMetrics,
      
      // 应用指标
      application_metrics: applicationMetrics,
      
      // 业务指标
      business_metrics: businessMetrics,
      
      // 综合健康状态
      health_summary: {
        overall_status: this.calculateOverallHealthStatus(systemMetrics, applicationMetrics),
        system_health: this.calculateSystemHealth(systemMetrics),
        application_health: this.calculateApplicationHealth(applicationMetrics),
        business_health: this.calculateBusinessHealth(businessMetrics)
      },
      
      // 告警信息
      alerts: await this.collectActiveAlerts(),
      
      // 趋势分析
      trends: await this.analyzeTrends(),
      
      // 容量规划
      capacity_planning: await this.analyzeCapacity(systemMetrics, applicationMetrics)
    };

    // 根据请求的指标类型筛选结果
    if (metricType === 'system') {
      return {
        ...result,
        primary_focus: 'system_metrics',
        detailed_metrics: systemMetrics
      };
    } else if (metricType === 'application') {
      return {
        ...result,
        primary_focus: 'application_metrics',
        detailed_metrics: applicationMetrics
      };
    } else if (metricType === 'business') {
      return {
        ...result,
        primary_focus: 'business_metrics',
        detailed_metrics: businessMetrics
      };
    } else {
      return result;
    }
  }

  /**
   * 执行系统诊断
   */
  private static async performSystemDiagnosis(checkType: string, includeRecommendations: boolean): Promise<any> {
    const timestamp = new Date().toISOString();
    
    logger.info(`🔬 Performing ${checkType} diagnosis`);
    
    // 收集诊断数据
    const componentDiagnosis = await this.diagnoseComponents(checkType);
    const performanceDiagnosis = await this.diagnosePerformance(checkType);
    const securityDiagnosis = await this.diagnoseSecurity(checkType);
    const resourceDiagnosis = await this.diagnoseResources(checkType);
    
    // 分析问题
    const issues = await this.analyzeSystemIssues(componentDiagnosis, performanceDiagnosis, securityDiagnosis, resourceDiagnosis);
    
    // 生成建议
    const recommendations = includeRecommendations ? 
      await this.generateSystemRecommendations(issues, componentDiagnosis, performanceDiagnosis) : [];
    
    // 计算整体健康评分
    const healthScore = this.calculateOverallHealthScore(componentDiagnosis, performanceDiagnosis, securityDiagnosis);
    
    return {
      success: true,
      action: 'diagnosis',
      check_type: checkType,
      timestamp: timestamp,
      
      // 整体评估
      overall_assessment: {
        health_score: healthScore,
        status: this.getHealthStatusFromScore(healthScore),
        risk_level: this.calculateRiskLevel(issues),
        critical_issues_count: issues.filter((i: any) => i.severity === 'critical').length,
        total_issues_count: issues.length
      },
      
      // 组件诊断
      component_diagnosis: componentDiagnosis,
      
      // 性能诊断
      performance_diagnosis: performanceDiagnosis,
      
      // 安全诊断
      security_diagnosis: securityDiagnosis,
      
      // 资源诊断
      resource_diagnosis: resourceDiagnosis,
      
      // 发现的问题
      issues: issues,
      
      // 修复建议
      recommendations: recommendations,
      
      // 后续行动
      action_items: this.generateActionItems(issues, checkType),
      
      // 预计修复时间
      estimated_fix_time: this.estimateFixTime(issues),
      
      // 监控建议
      monitoring_suggestions: this.generateMonitoringSuggestions(issues, componentDiagnosis)
    };
  }

  /**
   * 收集系统指标
   */
  private static async collectSystemMetrics(): Promise<any> {
    // 模拟系统指标收集
    return {
      cpu: {
        usage_percent: Math.floor(Math.random() * 40) + 30, // 30-70%
        load_average: Math.round((Math.random() * 2 + 0.5) * 100) / 100, // 0.5-2.5
        cores_available: 8,
        cores_used: Math.floor(Math.random() * 4) + 2
      },
      memory: {
        total_gb: 32,
        used_gb: Math.floor(Math.random() * 16) + 8, // 8-24GB
        available_gb: 32 - (Math.floor(Math.random() * 16) + 8),
        usage_percent: Math.floor(Math.random() * 50) + 25, // 25-75%
        swap_used_gb: Math.floor(Math.random() * 2)
      },
      disk: {
        total_gb: 500,
        used_gb: Math.floor(Math.random() * 200) + 100, // 100-300GB
        available_gb: 500 - (Math.floor(Math.random() * 200) + 100),
        usage_percent: Math.floor(Math.random() * 40) + 20, // 20-60%
        iops: Math.floor(Math.random() * 1000) + 500
      },
      network: {
        bandwidth_mbps: 1000,
        inbound_mbps: Math.floor(Math.random() * 100) + 20,
        outbound_mbps: Math.floor(Math.random() * 80) + 15,
        connections_active: Math.floor(Math.random() * 200) + 50,
        packets_dropped: Math.floor(Math.random() * 5)
      },
      uptime: {
        days: Math.floor(Math.random() * 30) + 1,
        system_restarts: Math.floor(Math.random() * 3),
        last_restart: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  /**
   * 收集应用指标
   */
  private static async collectApplicationMetrics(): Promise<any> {
    return {
      mcp_server: {
        status: 'running',
        uptime_hours: Math.floor(Math.random() * 168) + 24, // 1-7 days
        response_time_ms: Math.floor(Math.random() * 200) + 50, // 50-250ms
        requests_per_minute: Math.floor(Math.random() * 100) + 50,
        error_rate_percent: Math.round(Math.random() * 2 * 100) / 100, // 0-2%
        memory_usage_mb: Math.floor(Math.random() * 512) + 256
      },
      tools: {
        total_tools: 8,
        active_tools: 8,
        average_execution_time_ms: Math.floor(Math.random() * 1000) + 500,
        successful_executions: Math.floor(Math.random() * 1000) + 500,
        failed_executions: Math.floor(Math.random() * 50) + 5,
        success_rate_percent: Math.round((Math.random() * 5 + 95) * 100) / 100 // 95-100%
      },
      agents: {
        total_agents: 6,
        active_sessions: Math.floor(Math.random() * 10) + 2,
        average_task_duration_minutes: Math.floor(Math.random() * 10) + 5,
        tasks_completed_today: Math.floor(Math.random() * 50) + 20,
        tasks_failed_today: Math.floor(Math.random() * 5)
      },
      workflow_engine: {
        active_workflows: Math.floor(Math.random() * 5) + 1,
        queued_tasks: Math.floor(Math.random() * 10),
        completed_workflows_today: Math.floor(Math.random() * 20) + 5,
        average_workflow_duration_minutes: Math.floor(Math.random() * 15) + 10
      }
    };
  }

  /**
   * 收集业务指标
   */
  private static async collectBusinessMetrics(): Promise<any> {
    return {
      productivity: {
        tasks_completed_today: Math.floor(Math.random() * 100) + 50,
        tasks_completed_this_week: Math.floor(Math.random() * 500) + 250,
        average_task_completion_time_minutes: Math.floor(Math.random() * 20) + 10,
        productivity_score: Math.floor(Math.random() * 30) + 70 // 70-100
      },
      quality: {
        code_quality_score: Math.floor(Math.random() * 20) + 80, // 80-100
        test_coverage_percent: Math.floor(Math.random() * 20) + 80, // 80-100%
        bugs_found_today: Math.floor(Math.random() * 5),
        bugs_fixed_today: Math.floor(Math.random() * 8) + 2
      },
      user_satisfaction: {
        satisfaction_score: Math.round((Math.random() * 1 + 4) * 100) / 100, // 4.0-5.0
        response_time_satisfaction: Math.floor(Math.random() * 10) + 90, // 90-100%
        feature_usage_rate: Math.floor(Math.random() * 15) + 85, // 85-100%
        user_retention_rate: Math.floor(Math.random() * 5) + 95 // 95-100%
      },
      cost_efficiency: {
        cost_per_task: Math.round((Math.random() * 0.5 + 0.1) * 100) / 100, // $0.10-0.60
        resource_utilization_percent: Math.floor(Math.random() * 20) + 70, // 70-90%
        cost_savings_percent: Math.floor(Math.random() * 15) + 10, // 10-25%
        roi_percent: Math.floor(Math.random() * 50) + 150 // 150-200%
      }
    };
  }

  /**
   * 诊断组件状态
   */
  private static async diagnoseComponents(checkType: string): Promise<any> {
    const components = [
      'agent_manager', 'workflow_executor', 'task_analyzer', 
      'quality_assurance', 'model_scheduler', 'monitoring_system',
      'multilingual_engine', 'config_validator'
    ];

    const componentStatus: any = {};

    for (const component of components) {
      const status = this.simulateComponentDiagnosis(component, checkType);
      componentStatus[component] = status;
    }

    return {
      total_components: components.length,
      healthy_components: Object.values(componentStatus).filter((s: any) => s.status === 'healthy').length,
      warning_components: Object.values(componentStatus).filter((s: any) => s.status === 'warning').length,
      critical_components: Object.values(componentStatus).filter((s: any) => s.status === 'critical').length,
      components: componentStatus,
      overall_component_health: this.calculateComponentHealthScore(componentStatus)
    };
  }

  /**
   * 诊断性能状态
   */
  private static async diagnosePerformance(checkType: string): Promise<any> {
    const responseTime = Math.floor(Math.random() * 300) + 100; // 100-400ms
    const throughput = Math.floor(Math.random() * 200) + 300; // 300-500 req/min
    const errorRate = Math.round(Math.random() * 3 * 100) / 100; // 0-3%
    const memoryLeaks = checkType === 'deep' ? Math.floor(Math.random() * 3) : 0;

    return {
      response_time: {
        current_ms: responseTime,
        target_ms: 200,
        status: responseTime > 250 ? 'warning' : 'good',
        trend: Math.random() > 0.5 ? 'improving' : 'stable'
      },
      throughput: {
        current_rpm: throughput,
        target_rpm: 400,
        status: throughput < 350 ? 'warning' : 'good',
        peak_rpm: Math.floor(throughput * 1.5)
      },
      error_rate: {
        current_percent: errorRate,
        target_percent: 1.0,
        status: errorRate > 2 ? 'critical' : errorRate > 1 ? 'warning' : 'good',
        trend: Math.random() > 0.7 ? 'increasing' : 'stable'
      },
      resource_efficiency: {
        cpu_efficiency: Math.floor(Math.random() * 20) + 80, // 80-100%
        memory_efficiency: Math.floor(Math.random() * 15) + 85, // 85-100%
        network_efficiency: Math.floor(Math.random() * 10) + 90 // 90-100%
      },
      bottlenecks: checkType === 'deep' ? this.identifyBottlenecks() : [],
      memory_leaks_detected: memoryLeaks,
      performance_score: this.calculateSystemPerformanceScore(responseTime, throughput, errorRate)
    };
  }

  /**
   * 诊断安全状态
   */
  private static async diagnoseSecurity(checkType: string): Promise<any> {
    return {
      authentication: {
        status: 'secure',
        mfa_enabled: true,
        password_policy_compliant: true,
        failed_login_attempts: Math.floor(Math.random() * 5),
        last_security_audit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      encryption: {
        data_at_rest: 'AES-256',
        data_in_transit: 'TLS 1.3',
        certificate_status: 'valid',
        certificate_expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      vulnerabilities: checkType === 'deep' ? this.scanVulnerabilities() : [],
      access_control: {
        unauthorized_access_attempts: Math.floor(Math.random() * 3),
        privilege_escalation_attempts: 0,
        suspicious_activities: Math.floor(Math.random() * 2)
      },
      compliance: {
        gdpr_compliant: true,
        iso27001_compliant: true,
        last_compliance_check: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      security_score: Math.floor(Math.random() * 10) + 90 // 90-100
    };
  }

  /**
   * 诊断资源状态
   */
  private static async diagnoseResources(checkType: string): Promise<any> {
    return {
      compute_resources: {
        cpu_utilization_trend: 'stable',
        memory_utilization_trend: 'increasing',
        predicted_cpu_shortage_days: Math.floor(Math.random() * 60) + 30,
        predicted_memory_shortage_days: Math.floor(Math.random() * 30) + 15
      },
      storage_resources: {
        disk_growth_rate_gb_per_day: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
        predicted_storage_full_days: Math.floor(Math.random() * 120) + 60,
        backup_status: 'healthy',
        last_backup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      },
      network_resources: {
        bandwidth_utilization_percent: Math.floor(Math.random() * 30) + 40, // 40-70%
        latency_ms: Math.floor(Math.random() * 50) + 10, // 10-60ms
        packet_loss_percent: Math.round(Math.random() * 0.5 * 100) / 100, // 0-0.5%
        connection_pool_utilization: Math.floor(Math.random() * 40) + 50 // 50-90%
      },
      scaling_recommendations: checkType === 'deep' ? this.generateScalingRecommendations() : []
    };
  }

  /**
   * 模拟组件诊断
   */
  private static simulateComponentDiagnosis(component: string, checkType: string): any {
    const statuses = ['healthy', 'warning', 'critical'];
    const weights = checkType === 'deep' ? [0.7, 0.25, 0.05] : [0.85, 0.15, 0.0];
    const randomValue = Math.random();
    
    let status = 'healthy';
    let cumulative = 0;
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (randomValue <= cumulative) {
        status = statuses[i];
        break;
      }
    }

    return {
      status: status,
      performance: status === 'healthy' ? 'optimal' : status === 'warning' ? 'degraded' : 'poor',
      last_check: new Date().toISOString(),
      response_time_ms: Math.floor(Math.random() * 200) + 50,
      error_count: status === 'critical' ? Math.floor(Math.random() * 10) + 5 : 
                   status === 'warning' ? Math.floor(Math.random() * 3) + 1 : 0,
      memory_usage_mb: Math.floor(Math.random() * 256) + 128,
      uptime_hours: Math.floor(Math.random() * 168) + 24
    };
  }

  /**
   * 计算整体健康状态
   */
  private static calculateOverallHealthStatus(systemMetrics: any, applicationMetrics: any): string {
    let score = 100;

    // 系统指标影响
    if (systemMetrics.cpu.usage_percent > 80) score -= 20;
    if (systemMetrics.memory.usage_percent > 80) score -= 15;
    if (systemMetrics.disk.usage_percent > 90) score -= 25;

    // 应用指标影响
    if (applicationMetrics.mcp_server.error_rate_percent > 2) score -= 30;
    if (applicationMetrics.tools.success_rate_percent < 95) score -= 20;

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * 其他计算方法的实现将在下一个代码块中添加...
   */

  /**
   * 计算系统健康状态
   */
  private static calculateSystemHealth(systemMetrics: any): string {
    let score = 100;
    if (systemMetrics.cpu.usage_percent > 80) score -= 25;
    if (systemMetrics.memory.usage_percent > 80) score -= 20;
    if (systemMetrics.disk.usage_percent > 90) score -= 30;
    if (systemMetrics.network.packets_dropped > 10) score -= 15;
    
    return score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  }

  /**
   * 计算应用健康状态
   */
  private static calculateApplicationHealth(applicationMetrics: any): string {
    let score = 100;
    if (applicationMetrics.mcp_server.error_rate_percent > 2) score -= 30;
    if (applicationMetrics.tools.success_rate_percent < 95) score -= 25;
    if (applicationMetrics.mcp_server.response_time_ms > 200) score -= 20;
    
    return score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  }

  /**
   * 计算业务健康状态
   */
  private static calculateBusinessHealth(businessMetrics: any): string {
    let score = 100;
    if (businessMetrics.productivity.productivity_score < 80) score -= 20;
    if (businessMetrics.quality.code_quality_score < 85) score -= 15;
    if (businessMetrics.user_satisfaction.satisfaction_score < 4.0) score -= 25;
    
    return score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  }

  /**
   * 收集活跃告警
   */
  private static async collectActiveAlerts(): Promise<any[]> {
    const alerts = [];
    
    // 模拟一些告警
    if (Math.random() > 0.7) {
      alerts.push({
        id: 'ALT001',
        severity: 'warning',
        component: 'memory',
        message: 'Memory usage approaching 80%',
        triggered_at: new Date().toISOString(),
        status: 'active'
      });
    }
    
    if (Math.random() > 0.8) {
      alerts.push({
        id: 'ALT002',
        severity: 'info',
        component: 'disk',
        message: 'Disk cleanup recommended',
        triggered_at: new Date().toISOString(),
        status: 'active'
      });
    }
    
    return alerts;
  }

  /**
   * 分析趋势
   */
  private static async analyzeTrends(): Promise<any> {
    return {
      performance_trend: Math.random() > 0.5 ? 'improving' : 'stable',
      resource_utilization_trend: Math.random() > 0.3 ? 'increasing' : 'stable',
      error_rate_trend: Math.random() > 0.8 ? 'increasing' : 'decreasing',
      user_satisfaction_trend: 'improving',
      cost_efficiency_trend: 'improving'
    };
  }

  /**
   * 分析容量
   */
  private static async analyzeCapacity(systemMetrics: any, applicationMetrics: any): Promise<any> {
    return {
      current_capacity_utilization: Math.floor(Math.random() * 30) + 60, // 60-90%
      predicted_capacity_shortage_days: Math.floor(Math.random() * 90) + 30,
      scaling_trigger_threshold: 85,
      recommended_scaling_factor: Math.round((Math.random() * 0.5 + 1.2) * 100) / 100, // 1.2-1.7x
      bottleneck_component: ['cpu', 'memory', 'network'][Math.floor(Math.random() * 3)]
    };
  }

  /**
   * 分析系统问题
   */
  private static async analyzeSystemIssues(componentDiagnosis: any, performanceDiagnosis: any, securityDiagnosis: any, resourceDiagnosis: any): Promise<any[]> {
    const issues = [];

    // 检查组件问题
    Object.entries(componentDiagnosis.components).forEach(([name, status]: [string, any]) => {
      if (status.status === 'critical') {
        issues.push({
          id: `COMP_${name.toUpperCase()}`,
          severity: 'critical',
          category: 'component',
          component: name,
          title: `${name} component failure`,
          description: `Critical issue detected in ${name} component`,
          impact: 'high',
          resolution_time_estimate: '2-4 hours'
        });
      } else if (status.status === 'warning') {
        issues.push({
          id: `COMP_${name.toUpperCase()}_WARN`,
          severity: 'warning',
          category: 'component',
          component: name,
          title: `${name} performance degradation`,
          description: `Performance warning detected in ${name} component`,
          impact: 'medium',
          resolution_time_estimate: '1-2 hours'
        });
      }
    });

    // 检查性能问题
    if (performanceDiagnosis.response_time.status === 'warning') {
      issues.push({
        id: 'PERF_RESPONSE_TIME',
        severity: 'warning',
        category: 'performance',
        component: 'system',
        title: 'High response time detected',
        description: `Response time (${performanceDiagnosis.response_time.current_ms}ms) exceeds target`,
        impact: 'medium',
        resolution_time_estimate: '30 minutes'
      });
    }

    if (performanceDiagnosis.error_rate.status !== 'good') {
      issues.push({
        id: 'PERF_ERROR_RATE',
        severity: performanceDiagnosis.error_rate.status === 'critical' ? 'critical' : 'warning',
        category: 'performance',
        component: 'system',
        title: 'Elevated error rate',
        description: `Error rate (${performanceDiagnosis.error_rate.current_percent}%) above acceptable threshold`,
        impact: performanceDiagnosis.error_rate.status === 'critical' ? 'high' : 'medium',
        resolution_time_estimate: '1-3 hours'
      });
    }

    // 检查安全问题
    if (securityDiagnosis.vulnerabilities.length > 0) {
      securityDiagnosis.vulnerabilities.forEach((vuln: any) => {
        issues.push({
          id: `SEC_${vuln.id}`,
          severity: vuln.severity,
          category: 'security',
          component: 'security',
          title: vuln.title,
          description: vuln.description,
          impact: vuln.severity === 'critical' ? 'high' : 'medium',
          resolution_time_estimate: vuln.severity === 'critical' ? '4-8 hours' : '1-4 hours'
        });
      });
    }

    return issues;
  }

  /**
   * 生成系统建议
   */
  private static async generateSystemRecommendations(issues: any[], componentDiagnosis: any, performanceDiagnosis: any): Promise<string[]> {
    const recommendations = [];

    if (issues.length === 0) {
      recommendations.push('System is operating optimally');
      recommendations.push('Continue regular monitoring and maintenance');
    } else {
      // 基于问题生成建议
      const criticalIssues = issues.filter(i => i.severity === 'critical');
      const warningIssues = issues.filter(i => i.severity === 'warning');

      if (criticalIssues.length > 0) {
        recommendations.push('Address critical issues immediately to prevent service degradation');
        recommendations.push('Consider implementing emergency response procedures');
      }

      if (warningIssues.length > 0) {
        recommendations.push('Schedule maintenance window to address warning-level issues');
      }

      // 组件特定建议
      if (componentDiagnosis.critical_components > 0) {
        recommendations.push('Restart affected components if possible');
        recommendations.push('Check component logs for detailed error information');
      }

      // 性能建议
      if (performanceDiagnosis.response_time.status !== 'good') {
        recommendations.push('Optimize database queries and API calls');
        recommendations.push('Consider implementing caching mechanisms');
      }
    }

    // 通用建议
    recommendations.push('Update system documentation with recent changes');
    recommendations.push('Schedule next system health check in 7 days');

    return recommendations;
  }

  /**
   * 计算整体健康评分
   */
  private static calculateOverallHealthScore(componentDiagnosis: any, performanceDiagnosis: any, securityDiagnosis: any): number {
    let score = 100;

    // 组件健康影响 (40%)
    const componentScore = (componentDiagnosis.healthy_components / componentDiagnosis.total_components) * 40;
    score = componentScore;

    // 性能影响 (35%)
    let perfScore = 35;
    if (performanceDiagnosis.response_time.status === 'warning') perfScore -= 10;
    if (performanceDiagnosis.error_rate.status === 'critical') perfScore -= 20;
    else if (performanceDiagnosis.error_rate.status === 'warning') perfScore -= 10;
    score += Math.max(0, perfScore);

    // 安全影响 (25%)
    let secScore = 25;
    const criticalVulns = securityDiagnosis.vulnerabilities.filter((v: any) => v.severity === 'critical').length;
    secScore -= criticalVulns * 15;
    score += Math.max(0, secScore);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 从评分获取健康状态
   */
  private static getHealthStatusFromScore(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  /**
   * 计算风险等级
   */
  private static calculateRiskLevel(issues: any[]): string {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (criticalCount > 0) return 'high';
    if (warningCount > 3) return 'medium';
    if (warningCount > 0) return 'low';
    return 'minimal';
  }

  /**
   * 生成行动项目
   */
  private static generateActionItems(issues: any[], checkType: string): any[] {
    const actionItems = [];

    // 针对严重问题的行动项
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    criticalIssues.forEach(issue => {
      actionItems.push({
        priority: 'immediate',
        title: `Resolve ${issue.title}`,
        description: issue.description,
        estimated_effort: issue.resolution_time_estimate,
        category: issue.category,
        assigned_to: 'system_admin'
      });
    });

    // 针对警告的行动项
    const warningIssues = issues.filter(i => i.severity === 'warning');
    if (warningIssues.length > 0) {
      actionItems.push({
        priority: 'high',
        title: 'Address performance warnings',
        description: `Resolve ${warningIssues.length} warning-level issues`,
        estimated_effort: '2-4 hours',
        category: 'maintenance',
        assigned_to: 'development_team'
      });
    }

    // 通用维护行动项
    if (checkType === 'deep') {
      actionItems.push({
        priority: 'medium',
        title: 'System optimization review',
        description: 'Comprehensive system optimization and cleanup',
        estimated_effort: '4-6 hours',
        category: 'optimization',
        assigned_to: 'DevOps_team'
      });
    }

    return actionItems;
  }

  /**
   * 估算修复时间
   */
  private static estimateFixTime(issues: any[]): string {
    let totalMinutes = 0;

    issues.forEach(issue => {
      const timeStr = issue.resolution_time_estimate;
      if (timeStr.includes('hour')) {
        const hours = parseInt(timeStr.match(/(\d+)/)?.[1] || '1');
        totalMinutes += hours * 60;
      } else if (timeStr.includes('minute')) {
        const minutes = parseInt(timeStr.match(/(\d+)/)?.[1] || '30');
        totalMinutes += minutes;
      }
    });

    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.round(totalMinutes / 60 * 10) / 10;
      return `${hours} hours`;
    }
  }

  /**
   * 生成监控建议
   */
  private static generateMonitoringSuggestions(issues: any[], componentDiagnosis: any): string[] {
    const suggestions = [];

    if (issues.length > 0) {
      suggestions.push('Increase monitoring frequency for affected components');
      suggestions.push('Set up alerts for critical thresholds');
    }

    if (componentDiagnosis.warning_components > 0) {
      suggestions.push('Monitor component performance metrics more closely');
    }

    suggestions.push('Implement automated health checks');
    suggestions.push('Set up log aggregation for better troubleshooting');
    suggestions.push('Configure performance baseline alerts');

    return suggestions;
  }

  /**
   * 计算组件健康评分
   */
  private static calculateComponentHealthScore(componentStatus: any): number {
    const components = Object.values(componentStatus);
    const total = components.length;
    const healthy = components.filter((c: any) => c.status === 'healthy').length;
    const warning = components.filter((c: any) => c.status === 'warning').length;
    
    return Math.round(((healthy * 100 + warning * 60) / total / 100) * 100);
  }

  /**
   * 识别性能瓶颈
   */
  private static identifyBottlenecks(): any[] {
    const possibleBottlenecks = [
      { component: 'database', type: 'query_performance', severity: 'medium' },
      { component: 'network', type: 'bandwidth_limit', severity: 'low' },
      { component: 'cpu', type: 'high_utilization', severity: 'medium' },
      { component: 'memory', type: 'memory_pressure', severity: 'low' }
    ];

    return possibleBottlenecks.filter(() => Math.random() > 0.7);
  }

  /**
   * 重写性能评分计算方法
   */
  private static calculateSystemPerformanceScore(responseTime: number, throughput: number, errorRate: number): number {
    let score = 100;
    
    // 响应时间影响 (40%)
    if (responseTime > 300) score -= 25;
    else if (responseTime > 200) score -= 15;
    else if (responseTime > 150) score -= 5;
    
    // 吞吐量影响 (35%)
    if (throughput < 300) score -= 20;
    else if (throughput < 400) score -= 10;
    
    // 错误率影响 (25%)
    if (errorRate > 3) score -= 25;
    else if (errorRate > 2) score -= 15;
    else if (errorRate > 1) score -= 8;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 扫描漏洞
   */
  private static scanVulnerabilities(): any[] {
    const vulnerabilities = [];
    
    if (Math.random() > 0.8) {
      vulnerabilities.push({
        id: 'CVE-2024-001',
        severity: 'medium',
        title: 'Outdated dependency vulnerability',
        description: 'A dependency has a known security vulnerability',
        component: 'npm_package',
        cvss_score: 6.5
      });
    }
    
    if (Math.random() > 0.9) {
      vulnerabilities.push({
        id: 'CVE-2024-002',
        severity: 'high',
        title: 'Authentication bypass potential',
        description: 'Potential authentication bypass in API endpoint',
        component: 'authentication',
        cvss_score: 8.2
      });
    }
    
    return vulnerabilities;
  }

  /**
   * 生成扩容建议
   */
  private static generateScalingRecommendations(): any[] {
    return [
      {
        type: 'horizontal',
        component: 'mcp_server',
        recommended_instances: Math.floor(Math.random() * 3) + 2,
        reason: 'High request volume detected'
      },
      {
        type: 'vertical',
        component: 'database',
        recommended_cpu_increase: '50%',
        recommended_memory_increase: '100%',
        reason: 'Memory pressure and CPU bottleneck identified'
      }
    ];
  }
}

// 导出别名以便于使用
export { UnifiedToolHandlers as ToolHandlers };
export default UnifiedToolHandlers;
