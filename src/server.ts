#!/usr/bin/env node

/**
 * MCP Server Entry Point - Optimized Version
 * Copilot Multi-Agent Orchestrator - 8 Optimized Tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListRootsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpTools } from './tools/tools.js';
import { UnifiedToolHandlers } from './tools/handlers.js';
import { logger } from './utils/logger.js';

/**
 * Optimized server class for the multi-agent orchestrator with 8 tools
 */
class OptimizedMultiAgentOrchestratorServer {
  private server: Server;
  private clientRoots: string[] = []; // 存储客户端提供的根路径

  constructor() {
    this.server = new Server(
      {
        name: 'copilot-multi-agent-orchestrator-optimized',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          roots: {
            listChanged: true
          }
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandler();
  }

  private setupToolHandlers(): void {
    // Handle roots/list requests
    this.server.setRequestHandler(ListRootsRequestSchema, async () => {
      try {
        // 如果有缓存的roots，返回它们
        if (this.clientRoots.length > 0) {
          return {
            roots: this.clientRoots.map(rootPath => ({
              uri: `file://${rootPath}`,
              name: `Workspace: ${rootPath.split('/').pop() || rootPath}`
            }))
          };
        }

        // 如果没有缓存的roots，尝试获取当前工作目录
        const currentDir = process.cwd();
        return {
          roots: [
            {
              uri: `file://${currentDir}`,
              name: `Current Directory: ${currentDir.split('/').pop() || currentDir}`
            }
          ]
        };
      } catch (error) {
        logger.error('Error handling roots/list request:', error);
        return { roots: [] };
      }
    });

    // Register all optimized MCP tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: mcpTools
      };
    });

    // Handle tool calls with optimized handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Log every tool call request
      logger.info(`🔧 Optimized tool call received: ${name}`, { args });

      // Ensure args is always an object
      const safeArgs = args || {};

      // 如果工具调用没有提供project_path，尝试使用客户端根路径
      if (!safeArgs.project_path) {
        const defaultPath = this.getDefaultProjectPath();
        if (defaultPath !== process.cwd()) {
          safeArgs.project_path = defaultPath;
          logger.info(`🎯 Auto-detected project path from client workspace: ${safeArgs.project_path}`);
        }
      }

      try {
        let result: any;

        switch (name) {
          // Unified agent management
          case 'agent_manage':
            result = await UnifiedToolHandlers.manageAgent(safeArgs);
            break;

          // Task analysis (standalone)
          case 'task_analyze':
            result = await UnifiedToolHandlers.analyzeTask(safeArgs);
            break;

          // Workflow execution (standalone)
          case 'workflow_execute':
            result = await UnifiedToolHandlers.executeWorkflow(safeArgs);
            break;

          // Intelligent translation (standalone)
          case 'intelligent_translate':
            result = await UnifiedToolHandlers.intelligentTranslate(safeArgs);
            break;

          // Unified project operations
          case 'config_validate':
            result = await UnifiedToolHandlers.validateConfig(safeArgs);
            break;

          case 'model_schedule':
            result = await UnifiedToolHandlers.scheduleModel(safeArgs);
            break;

          // Quality analysis (standalone)
          case 'quality_analyze':
            result = await UnifiedToolHandlers.analyzeQuality(safeArgs);
            break;

          // System diagnosis
          case 'system_diagnosis':
            result = await UnifiedToolHandlers.diagnoseSystem(safeArgs);
            break;

          // Special tool to set workspace roots (for testing)
          case '_set_roots':
            if (safeArgs.roots && Array.isArray(safeArgs.roots)) {
              this.updateClientRoots(safeArgs.roots);
              result = {
                success: true,
                message: `Updated client roots to: ${safeArgs.roots.join(', ')}`,
                roots: safeArgs.roots
              };
            } else {
              throw new Error('Invalid roots parameter');
            }
            break;

          default:
            throw new Error(`Unknown optimized tool: ${name}`);
        }

        // Format the response according to MCP protocol
        const response = {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
        
        // Log successful tool execution
        logger.info(`✅ Optimized tool executed successfully: ${name}`, { 
          success: true,
          resultSize: JSON.stringify(result).length 
        });
        
        return response;

      } catch (error) {
        logger.error(`Optimized tool execution error for ${name}:`, error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private setupErrorHandler(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in optimized server:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in optimized server at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * 获取默认的项目路径，优先使用客户端根路径
   */
  private getDefaultProjectPath(): string {
    if (this.clientRoots.length > 0) {
      return this.clientRoots[0];
    }
    return process.cwd();
  }

  /**
   * 更新客户端根路径（可以在将来从roots/list_changed通知中调用）
   */
  public updateClientRoots(roots: string[]): void {
    this.clientRoots = roots;
    logger.info(`🎯 Updated client roots: ${roots.join(', ')}`);
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    // 优化版服务器启动信息（仅在调试模式下输出到文件）
    if (process.env['DEBUG_MCP']) {
      logger.info('🚀 Starting Copilot Multi-Agent Orchestrator MCP Server (Optimized v2.0)');
      logger.info('🎯 Optimized from 13 tools to 8 tools (38% reduction)');
      logger.info('📋 Available optimized tools:');
      logger.info('  Unified Tools (3):');
      logger.info('  • agent_manage - Unified agent management (create/list/generate/init)');
      logger.info('  • project_ops - Unified project operations (generate/validate)');
      logger.info('  • system_monitor - Unified system monitoring (status/diagnosis)');
      logger.info('  Standalone Tools (5):');
      logger.info('  • task_analyze - Analyze tasks and recommend agents');
      logger.info('  • workflow_execute - Execute multi-agent workflows');
      logger.info('  • intelligent_translate - Smart translation with context');
      logger.info('  • quality_analyze - Project quality analysis');
      logger.info('  • model_schedule - AI model access scheduling');
    }
    
    await this.server.connect(transport);
    
    // Send ready notification to client (MCP protocol requirement)
    this.server.notification({
      method: 'notifications/ready'
    });
    
    if (process.env['DEBUG_MCP']) {
      logger.info('✅ Optimized server connected and ready for requests');
    }
  }
}

// Start the optimized server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new OptimizedMultiAgentOrchestratorServer();
  server.start().catch((error) => {
    console.error('Failed to start optimized server:', error);
    process.exit(1);
  });
}
