/**
 * Unified Tool Handlers for Optimized MCP Tools
 * 8个优化工具的统一处理器 - 减少代码重复，提高维护性
 */

import { logger } from '../utils/logger.js';
import { ToolHandlers } from './handlers.js';
import { AdvancedToolHandlers } from './advanced-handlers.js';
import { EnhancedToolHandlers } from './enhanced-handlers.js';

export class UnifiedToolHandlers {
  
  /**
   * 统一代理管理器 - 合并 agent_create, agent_list, smart_agent_generator, cmmi_init
   */
  static async manageAgent(args: Record<string, unknown>): Promise<any> {
    try {
      const action = args['action'] as string;
      logger.info(`🤖 Agent management action: ${action}`);

      switch (action) {
        case 'create':
          // 单个代理创建
          return await ToolHandlers.createAgent(args);

        case 'list':
          // 列出代理
          return await ToolHandlers.listAgents(args);

        case 'generate_smart':
          // 智能代理生成
          return await AdvancedToolHandlers.smartAgentGenerator(args);

        case 'init_cmmi':
          // CMMI标准代理初始化
          return await AdvancedToolHandlers.initCmmiAgents(args);

        default:
          throw new Error(`Unknown agent management action: ${action}`);
      }

    } catch (error) {
      logger.error('❌ Agent management failed:', error);
      throw new Error(`Agent management failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 项目操作管理器 - 合并 project_generate, config_validate
   */
  static async manageProjectOps(args: Record<string, unknown>): Promise<any> {
    try {
      const action = args['action'] as string;
      logger.info(`🏗️ Project operations action: ${action}`);

      switch (action) {
        case 'generate':
          // 项目生成
          return await EnhancedToolHandlers.generateProject(args);

        case 'validate_config':
          // 配置验证
          return await AdvancedToolHandlers.validateAgentConfigs(args);

        default:
          throw new Error(`Unknown project operation: ${action}`);
      }

    } catch (error) {
      logger.error('❌ Project operations failed:', error);
      throw new Error(`Project operations failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 系统监控管理器 - 合并 monitoring_status, system_diagnosis
   */
  static async manageSystemMonitor(args: Record<string, unknown>): Promise<any> {
    try {
      const action = args['action'] as string;
      logger.info(`📊 System monitoring action: ${action}`);

      switch (action) {
        case 'status':
          // 监控状态
          return await EnhancedToolHandlers.getMonitoringStatus(args);

        case 'diagnosis':
          // 系统诊断
          return await EnhancedToolHandlers.diagnoseSystem(args);

        default:
          throw new Error(`Unknown system monitoring action: ${action}`);
      }

    } catch (error) {
      logger.error('❌ System monitoring failed:', error);
      throw new Error(`System monitoring failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 任务分析 - 保持原有功能
   */
  static async analyzeTask(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🔍 Task analysis started');
      return await AdvancedToolHandlers.analyzeTask(args);
    } catch (error) {
      logger.error('❌ Task analysis failed:', error);
      throw new Error(`Task analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 工作流执行 - 保持原有功能
   */
  static async executeWorkflow(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('⚡ Workflow execution started');
      return await AdvancedToolHandlers.executeMultiAgentWorkflow(args);
    } catch (error) {
      logger.error('❌ Workflow execution failed:', error);
      throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 智能翻译 - 保持原有功能
   */
  static async intelligentTranslate(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🌐 Intelligent translation started');
      return await ToolHandlers.intelligentTranslate(args);
    } catch (error) {
      logger.error('❌ Intelligent translation failed:', error);
      throw new Error(`Intelligent translation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 质量分析 - 保持原有功能
   */
  static async analyzeQuality(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('🔍 Quality analysis started');
      return await EnhancedToolHandlers.analyzeQuality(args);
    } catch (error) {
      logger.error('❌ Quality analysis failed:', error);
      throw new Error(`Quality analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 模型调度 - 保持原有功能
   */
  static async scheduleModel(args: Record<string, unknown>): Promise<any> {
    try {
      logger.info('⏰ Model scheduling started');
      return await EnhancedToolHandlers.scheduleModel(args);
    } catch (error) {
      logger.error('❌ Model scheduling failed:', error);
      throw new Error(`Model scheduling failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取工具使用统计
   */
  static async getToolUsageStats(): Promise<any> {
    try {
      logger.info('📈 Generating tool usage statistics');
      
      const stats = {
        total_tools: 8,
        optimized_from: 13,
        reduction_percentage: 38.5,
        tool_categories: {
          unified_tools: ['agent_manage', 'project_ops', 'system_monitor'],
          standalone_tools: ['task_analyze', 'workflow_execute', 'intelligent_translate', 'quality_analyze', 'model_schedule']
        },
        functionality_mapping: {
          'agent_manage': {
            replaces: ['agent_create', 'agent_list', 'smart_agent_generator', 'cmmi_init'],
            actions: ['create', 'list', 'generate_smart', 'init_cmmi']
          },
          'project_ops': {
            replaces: ['project_generate', 'config_validate'],
            actions: ['generate', 'validate_config']
          },
          'system_monitor': {
            replaces: ['monitoring_status', 'system_diagnosis'],
            actions: ['status', 'diagnosis']
          }
        },
        benefits: {
          reduced_complexity: '38.5% fewer tools',
          improved_usability: 'Unified interfaces for related functions',
          better_maintenance: 'Less code duplication',
          enhanced_discovery: 'Clearer tool categorization'
        }
      };

      return stats;

    } catch (error) {
      logger.error('❌ Failed to generate tool usage stats:', error);
      throw new Error(`Tool usage stats failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
