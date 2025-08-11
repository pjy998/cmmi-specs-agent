import { ToolRouter } from '../core/tool-registry.js';
import { AdvancedToolHandlers } from '../tools/advanced-handlers.js';
import { logger } from '../utils/logger.js';

/**
 * Advanced Tools Router - Handles CMMI workflow and complex operations
 */
export class AdvancedToolRouter implements ToolRouter {
  private readonly advancedTools = [
    'task_analyze',
    'smart_agent_generator',
    'config_validate',
    'cmmi_init',
    'workflow_execute'
  ];

  canHandle(toolName: string): boolean {
    return this.advancedTools.includes(toolName);
  }

  async handle(toolName: string, args: any): Promise<any> {
    logger.info(`🚀 AdvancedToolRouter handling: ${toolName}`, { args });

    switch (toolName) {
      case 'task_analyze':
        return await AdvancedToolHandlers.analyzeTask(args);

      case 'smart_agent_generator':
        return await AdvancedToolHandlers.smartAgentGenerator(args);

      case 'config_validate':
        return await AdvancedToolHandlers.validateAgentConfigs(args);

      case 'cmmi_init':
        return await AdvancedToolHandlers.initCmmiAgents(args);

      case 'workflow_execute':
        return await AdvancedToolHandlers.executeMultiAgentWorkflow(args);

      default:
        throw new Error(`AdvancedToolRouter: Unknown tool ${toolName}`);
    }
  }

  getToolNames(): string[] {
    return [...this.advancedTools];
  }
}
