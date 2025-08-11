import { ToolRouter } from '../core/tool-registry.js';
import { ToolHandlers } from '../tools/handlers.js';
import { logger } from '../utils/logger.js';

/**
 * Basic Tools Router - Handles core agent management tools
 */
export class BasicToolRouter implements ToolRouter {
  private readonly basicTools = [
    'agent_create',
    'agent_list',
    'intelligent_translate'
  ];

  canHandle(toolName: string): boolean {
    return this.basicTools.includes(toolName);
  }

  async handle(toolName: string, args: any): Promise<any> {
    logger.info(`🔧 BasicToolRouter handling: ${toolName}`, { args });

    switch (toolName) {
      case 'agent_create':
        return await ToolHandlers.createAgent(args);

      case 'agent_list':
        return await ToolHandlers.listAgents(args);

      case 'intelligent_translate':
        return await ToolHandlers.intelligentTranslate(args);

      default:
        throw new Error(`BasicToolRouter: Unknown tool ${toolName}`);
    }
  }

  getToolNames(): string[] {
    return [...this.basicTools];
  }
}
