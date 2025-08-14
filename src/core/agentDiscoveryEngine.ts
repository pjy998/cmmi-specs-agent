/**
 * 智能Agent发现引擎
 * 负责检测、分析和生成项目所需的Agent配置
 */

import { logger } from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface AgentDiscoveryResult {
  existing_agents: AgentConfig[];
  missing_agents: string[];
  workflow_definition?: WorkflowDefinition;
  recommendations: AgentRecommendation[];
}

export interface AgentConfig {
  name: string;
  title: string;
  capabilities: string[];
  dependencies?: string[];
  workflow?: WorkflowPhase;
  file_path: string;
}

export interface WorkflowDefinition {
  phases: WorkflowPhase[];
  orchestrator?: string;
  parallel_execution: boolean;
}

export interface WorkflowPhase {
  phase: number;
  agent: string;
  inputs: string[];
  outputs: string[];
  parallel_execution?: boolean;
  quality_gates: string[];
  next_phases?: string[];
}

export interface AgentRecommendation {
  agent_name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

export class AgentDiscoveryEngine {
  
  /**
   * 智能发现和分析项目中的Agent配置
   */
  static async discoverAgents(projectPath: string): Promise<AgentDiscoveryResult> {
    logger.info('🔍 开始智能Agent发现分析...');
    
    try {
      // 1. 检测现有agents
      const existingAgents = await this.detectExistingAgents(projectPath);
      
      // 2. 分析agent间依赖关系
      const dependencyGraph = await this.analyzeDependencyRelationships(existingAgents);
      
      // 3. 分析工作流定义
      const workflowDefinition = await this.analyzeWorkflowDefinition(existingAgents);
      
      // 4. 识别缺失的agents
      const missingAgents = await this.identifyMissingAgents(existingAgents, workflowDefinition);
      
      // 5. 生成智能推荐建议
      const recommendations = await this.generateIntelligentRecommendations(
        existingAgents, 
        missingAgents, 
        projectPath,
        dependencyGraph
      );
      
      const result: AgentDiscoveryResult = {
        existing_agents: existingAgents,
        missing_agents: missingAgents,
        workflow_definition: workflowDefinition,
        recommendations: recommendations
      };
      
      logger.info(`✅ Agent发现完成: 现有${existingAgents.length}个, 缺失${missingAgents.length}个, 推荐${recommendations.length}个`);
      return result;
      
    } catch (error) {
      logger.error('❌ Agent发现失败:', error);
      throw error;
    }
  }

  /**
   * 分析Agent间依赖关系 - 新增功能
   */
  private static async analyzeDependencyRelationships(agents: AgentConfig[]): Promise<Map<string, string[]>> {
    logger.info('🔗 分析Agent依赖关系...');
    
    const dependencyGraph = new Map<string, string[]>();
    
    for (const agent of agents) {
      const dependencies: string[] = [];
      
      // 从agent配置中解析依赖关系
      if (agent.dependencies) {
        for (const dep of agent.dependencies) {
          if (typeof dep === 'string') {
            dependencies.push(dep);
          } else if (dep && typeof dep === 'object' && 'agent' in dep) {
            // 处理复杂依赖关系对象
            dependencies.push((dep as any).agent);
          }
        }
      }
      
      // 从工作流配置中解析依赖
      if (agent.workflow && 'prerequisites' in agent.workflow) {
        const prerequisites = (agent.workflow as any).prerequisites;
        if (Array.isArray(prerequisites)) {
          dependencies.push(...prerequisites);
        }
      }
      
      // 基于CMMI标准的隐式依赖关系
      const implicitDeps = this.inferImplicitDependencies(agent);
      dependencies.push(...implicitDeps);
      
      dependencyGraph.set(agent.name, [...new Set(dependencies)]);
      
      if (dependencies.length > 0) {
        logger.info(`📊 ${agent.name} 依赖: ${dependencies.join(', ')}`);
      }
    }
    
    return dependencyGraph;
  }

  /**
   * 推断基于CMMI标准的隐式依赖关系
   */
  private static inferImplicitDependencies(agent: AgentConfig): string[] {
    const dependencies: string[] = [];
    
    // 基于CMMI L3标准的典型依赖关系
    switch (agent.name) {
      case 'design-agent':
        dependencies.push('requirements-agent');
        break;
      case 'coding-agent':
        dependencies.push('design-agent', 'requirements-agent');
        break;
      case 'test-agent':
        dependencies.push('coding-agent', 'design-agent', 'requirements-agent');
        break;
      case 'spec-agent':
        // 流程协调器通常依赖所有其他agent的输出
        dependencies.push('requirements-agent', 'design-agent', 'coding-agent', 'test-agent', 'tasks-agent');
        break;
    }
    
    return dependencies;
  }

  /**
   * 增强的智能推荐生成 - 替代原有方法
   */
  private static async generateIntelligentRecommendations(
    existingAgents: AgentConfig[],
    missingAgents: string[],
    projectPath: string,
    dependencyGraph: Map<string, string[]>
  ): Promise<AgentRecommendation[]> {
    logger.info('🧠 生成智能推荐建议...');
    
    const recommendations: AgentRecommendation[] = [];
    
    // 分析项目类型和技术栈
    const projectType = await this.analyzeProjectType(projectPath);
    const techStack = await this.analyzeTechStack(projectPath);
    
    // 为缺失的agents生成推荐
    for (const missingAgent of missingAgents) {
      const recommendation = this.generateAgentRecommendation(
        missingAgent,
        existingAgents,
        projectType,
        techStack,
        dependencyGraph
      );
      
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    
    // 分析现有agents的配置完整性
    for (const agent of existingAgents) {
      const completenessIssues = this.analyzeAgentCompleteness(agent);
      
      if (completenessIssues.length > 0) {
        recommendations.push({
          agent_name: `${agent.name}-enhancement`,
          reason: `改进${agent.title}: ${completenessIssues.join(', ')}`,
          priority: 'medium',
          dependencies: []
        });
      }
    }
    
    // 基于依赖关系推荐优化
    const optimizationRecs = this.analyzeOptimizationOpportunities(dependencyGraph, existingAgents);
    recommendations.push(...optimizationRecs);
    
    return recommendations;
  }

  /**
   * 分析项目类型
   */
  private static async analyzeProjectType(projectPath: string): Promise<string> {
    // 检查package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageContent.dependencies) {
          if (packageContent.dependencies.react) return 'react-app';
          if (packageContent.dependencies.vue) return 'vue-app';
          if (packageContent.dependencies.express) return 'nodejs-api';
          if (packageContent.dependencies['@types/node']) return 'nodejs-app';
        }
      } catch (error) {
        logger.warn('解析package.json失败:', error);
      }
    }
    
    // 检查其他项目标识
    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) return 'python-app';
    if (fs.existsSync(path.join(projectPath, 'pom.xml'))) return 'java-app';
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'go-app';
    
    return 'unknown';
  }

  /**
   * 分析技术栈
   */
  private static async analyzeTechStack(projectPath: string): Promise<string[]> {
    const techStack: string[] = [];
    
    // 从文件类型推断
    try {
      const files = fs.readdirSync(projectPath);
      if (files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) techStack.push('typescript');
      if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) techStack.push('javascript');
      if (files.some(f => f.endsWith('.py'))) techStack.push('python');
      if (files.some(f => f.endsWith('.java'))) techStack.push('java');
      if (files.some(f => f.endsWith('.go'))) techStack.push('golang');
      if (files.some(f => f.endsWith('.yaml') || f.endsWith('.yml'))) techStack.push('yaml');
    } catch (error) {
      logger.warn('分析技术栈失败:', error);
    }
    
    return techStack;
  }

  /**
   * 为特定Agent生成推荐 - 统一版本
   */
  private static generateAgentRecommendation(
    agentName: string,
    existingAgents: AgentConfig[],
    projectType: string,
    techStack: string[],
    dependencyGraph: Map<string, string[]>
  ): AgentRecommendation | null {
    const standardAgents = {
      'requirements-agent': {
        reason: '需求分析是CMMI L3的必需过程，缺少需求管理会影响项目质量',
        priority: 'high' as const,
        dependencies: []
      },
      'design-agent': {
        reason: '系统设计确保技术方案满足需求，是架构设计的核心',
        priority: 'high' as const,
        dependencies: ['requirements-agent']
      },
      'coding-agent': {
        reason: '代码实现和审查确保编码质量和标准符合性',
        priority: 'medium' as const,
        dependencies: ['design-agent', 'requirements-agent']
      },
      'test-agent': {
        reason: '测试策略和执行确保产品质量，验证需求满足情况',
        priority: 'high' as const,
        dependencies: ['coding-agent', 'design-agent']
      },
      'tasks-agent': {
        reason: '项目管理和任务分解确保项目按计划进行',
        priority: 'medium' as const,
        dependencies: []
      },
      'spec-agent': {
        reason: '流程协调确保所有agents按CMMI标准协作',
        priority: 'low' as const,
        dependencies: ['requirements-agent', 'design-agent', 'coding-agent', 'test-agent']
      }
    };
    
    return standardAgents[agentName as keyof typeof standardAgents] ? {
      agent_name: agentName,
      ...standardAgents[agentName as keyof typeof standardAgents]
    } : null;
  }

  /**
   * 分析agent配置完整性
   */
  private static analyzeAgentCompleteness(agent: AgentConfig): string[] {
    const issues: string[] = [];
    
    if (!agent.capabilities || agent.capabilities.length === 0) {
      issues.push('缺少能力定义');
    }
    
    if (!agent.workflow) {
      issues.push('缺少工作流配置');
    }
    
    if (!agent.dependencies || agent.dependencies.length === 0) {
      issues.push('缺少依赖关系定义');
    }
    
    return issues;
  }

  /**
   * 分析优化机会
   */
  private static analyzeOptimizationOpportunities(
    dependencyGraph: Map<string, string[]>,
    existingAgents: AgentConfig[]
  ): AgentRecommendation[] {
    const recommendations: AgentRecommendation[] = [];
    
    // 检查循环依赖
    const cyclicDeps = this.detectCyclicDependencies(dependencyGraph);
    if (cyclicDeps.length > 0) {
      recommendations.push({
        agent_name: 'dependency-optimization',
        reason: `检测到循环依赖: ${cyclicDeps.join(' -> ')}，建议重构依赖关系`,
        priority: 'high',
        dependencies: []
      });
    }
    
    // 检查孤立的agents
    const isolatedAgents = this.findIsolatedAgents(dependencyGraph, existingAgents);
    for (const isolated of isolatedAgents) {
      recommendations.push({
        agent_name: `${isolated}-integration`,
        reason: `${isolated} 缺少与其他agents的协作关系，建议增加集成`,
        priority: 'low',
        dependencies: []
      });
    }
    
    return recommendations;
  }

  /**
   * 检测循环依赖
   */
  private static detectCyclicDependencies(dependencyGraph: Map<string, string[]>): string[] {
    // 简化的循环依赖检测
    for (const [agent, deps] of dependencyGraph) {
      for (const dep of deps) {
        const depDeps = dependencyGraph.get(dep);
        if (depDeps && depDeps.includes(agent)) {
          return [agent, dep, agent];
        }
      }
    }
    return [];
  }

  /**
   * 找到孤立的agents
   */
  private static findIsolatedAgents(
    dependencyGraph: Map<string, string[]>,
    existingAgents: AgentConfig[]
  ): string[] {
    const connected = new Set<string>();
    
    // 收集所有有连接的agents
    for (const [agent, deps] of dependencyGraph) {
      if (deps.length > 0) {
        connected.add(agent);
        deps.forEach(dep => connected.add(dep));
      }
    }
    
    // 找到没有连接的agents
    return existingAgents
      .map(agent => agent.name)
      .filter(name => !connected.has(name));
  }
  
  /**
   * 检测现有的Agent配置文件
   */
  private static async detectExistingAgents(projectPath: string): Promise<AgentConfig[]> {
    const agentsDir = path.join(projectPath, 'agents');
    const existingAgents: AgentConfig[] = [];
    
    if (!fs.existsSync(agentsDir)) {
      logger.info('📁 未发现agents目录，将创建新的agent配置');
      return existingAgents;
    }
    
    const agentFiles = fs.readdirSync(agentsDir)
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
    
    for (const file of agentFiles) {
      try {
        const filePath = path.join(agentsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const agentConfig = yaml.load(content) as any;
        
        if (agentConfig && agentConfig.name) {
          existingAgents.push({
            name: agentConfig.name,
            title: agentConfig.title || agentConfig.name,
            capabilities: agentConfig.capabilities || [],
            dependencies: agentConfig.dependencies || [],
            workflow: agentConfig.workflow,
            file_path: filePath
          });
          
          logger.info(`📋 发现Agent: ${agentConfig.name}`);
        }
        
      } catch (error) {
        logger.warn(`⚠️  解析Agent文件失败: ${file}`, error);
      }
    }
    
    return existingAgents;
  }
  
  /**
   * 分析工作流定义
   */
  private static async analyzeWorkflowDefinition(existingAgents: AgentConfig[]): Promise<WorkflowDefinition | undefined> {
    // 寻找流程协调器（如spec-agent）
    const orchestrator = existingAgents.find(agent => 
      agent.dependencies && agent.dependencies.length > 2 ||
      agent.name.includes('spec') || 
      agent.name.includes('orchestrat') ||
      agent.capabilities.includes('流程调度')
    );
    
    if (orchestrator) {
      logger.info(`🎭 发现流程协调器: ${orchestrator.name}`);
      
      // 从协调器的依赖关系构建工作流
      const phases: WorkflowPhase[] = [];
      let phaseNumber = 1;
      
      if (orchestrator.dependencies) {
        for (const depName of orchestrator.dependencies) {
          const depAgent = existingAgents.find(a => a.name === depName);
          if (depAgent) {
            phases.push({
              phase: phaseNumber++,
              agent: depName,
              inputs: [],
              outputs: [],
              quality_gates: []
            });
          }
        }
      }
      
      return {
        phases,
        orchestrator: orchestrator.name,
        parallel_execution: false
      };
    }
    
    return undefined;
  }
  
  /**
   * 识别缺失的标准CMMI Agents
   */
  private static async identifyMissingAgents(
    existingAgents: AgentConfig[], 
    workflowDef?: WorkflowDefinition
  ): Promise<string[]> {
    
    // 标准CMMI L3 Agent角色
    const standardAgents = [
      'requirements-agent',
      'design-agent', 
      'coding-agent',
      'test-agent',
      'tasks-agent',
      'spec-agent'
    ];
    
    const existingNames = existingAgents.map(a => a.name);
    const missing = standardAgents.filter(stdName => {
      // 检查是否有类似名称的agent（容忍命名差异）
      return !existingNames.some(existing => 
        existing.includes(stdName.replace('-agent', '')) ||
        stdName.includes(existing.replace('-agent', ''))
      );
    });
    
    logger.info(`🔍 识别到缺失的标准Agent: ${missing.join(', ')}`);
    return missing;
  }
  
  /**
  /**
   * 生成智能推荐建议 (已弃用 - 由generateIntelligentRecommendations替代)
   */
  private static async generateRecommendations(
    existingAgents: AgentConfig[],
    missingAgents: string[],
    projectPath: string
  ): Promise<AgentRecommendation[]> {
    
    // 使用新的智能推荐生成方法
    return this.generateIntelligentRecommendations(existingAgents, missingAgents, projectPath, new Map());
  }
}
