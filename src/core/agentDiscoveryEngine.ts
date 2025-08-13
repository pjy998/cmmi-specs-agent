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
      
      // 2. 分析工作流定义
      const workflowDefinition = await this.analyzeWorkflowDefinition(existingAgents);
      
      // 3. 识别缺失的agents
      const missingAgents = await this.identifyMissingAgents(existingAgents, workflowDefinition);
      
      // 4. 生成推荐建议
      const recommendations = await this.generateRecommendations(existingAgents, missingAgents, projectPath);
      
      const result: AgentDiscoveryResult = {
        existing_agents: existingAgents,
        missing_agents: missingAgents,
        workflow_definition: workflowDefinition,
        recommendations: recommendations
      };
      
      logger.info(`✅ Agent发现完成: 现有${existingAgents.length}个, 缺失${missingAgents.length}个`);
      return result;
      
    } catch (error) {
      logger.error('❌ Agent发现失败:', error);
      throw error;
    }
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
   * 生成智能推荐建议
   */
  private static async generateRecommendations(
    existingAgents: AgentConfig[],
    missingAgents: string[],
    projectPath: string
  ): Promise<AgentRecommendation[]> {
    
    const recommendations: AgentRecommendation[] = [];
    
    // 基于项目类型分析推荐优先级
    const projectAnalysis = await this.analyzeProjectContext(projectPath);
    
    for (const missingAgent of missingAgents) {
      const recommendation = this.generateAgentRecommendation(missingAgent, projectAnalysis, existingAgents);
      recommendations.push(recommendation);
    }
    
    // 按优先级排序
    recommendations.sort((a, b) => {
      const priorities = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
    
    return recommendations;
  }
  
  /**
   * 分析项目上下文
   */
  private static async analyzeProjectContext(projectPath: string): Promise<any> {
    const context = {
      has_package_json: fs.existsSync(path.join(projectPath, 'package.json')),
      has_readme: fs.existsSync(path.join(projectPath, 'README.md')),
      has_src_dir: fs.existsSync(path.join(projectPath, 'src')),
      has_test_dir: fs.existsSync(path.join(projectPath, 'test')) || fs.existsSync(path.join(projectPath, 'tests')),
      project_type: 'general'
    };
    
    // 判断项目类型
    if (context.has_package_json) {
      context.project_type = 'javascript';
    } else if (fs.existsSync(path.join(projectPath, 'pom.xml'))) {
      context.project_type = 'java';
    } else if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
      context.project_type = 'python';
    }
    
    return context;
  }
  
  /**
   * 为特定Agent生成推荐
   */
  private static generateAgentRecommendation(
    agentName: string, 
    projectContext: any, 
    existingAgents: AgentConfig[]
  ): AgentRecommendation {
    
    const recommendations: Record<string, AgentRecommendation> = {
      'requirements-agent': {
        agent_name: 'requirements-agent',
        reason: '需求分析是CMMI L3的基础过程域，必须建立完整的需求管理',
        priority: 'high',
        dependencies: []
      },
      'design-agent': {
        agent_name: 'design-agent',
        reason: '技术解决方案设计确保需求可实现性',
        priority: 'high', 
        dependencies: ['requirements-agent']
      },
      'coding-agent': {
        agent_name: 'coding-agent',
        reason: '代码实现是核心交付物',
        priority: 'medium',
        dependencies: ['design-agent']
      },
      'test-agent': {
        agent_name: 'test-agent',
        reason: '验证与确认确保质量符合要求',
        priority: 'high',
        dependencies: ['coding-agent']
      },
      'tasks-agent': {
        agent_name: 'tasks-agent',
        reason: '项目监控和管理确保按计划执行',
        priority: 'medium',
        dependencies: []
      },
      'spec-agent': {
        agent_name: 'spec-agent',
        reason: '流程协调器确保CMMI流程完整执行',
        priority: 'high',
        dependencies: ['requirements-agent', 'design-agent', 'coding-agent', 'test-agent']
      }
    };
    
    return recommendations[agentName] || {
      agent_name: agentName,
      reason: '标准CMMI L3流程建议',
      priority: 'low',
      dependencies: []
    };
  }
}
