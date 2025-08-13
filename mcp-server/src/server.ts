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
} from '@modelcontextprotocol/sdk/types.js';
import { mcpTools } from './tools/tools.js';
import { UnifiedToolHandlers } from './tools/handlers.js';
import { logger } from './utils/logger.js';

/**
 * Optimized server class for the multi-agent orchestrator with 8 tools
 */
class OptimizedMultiAgentOrchestratorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'copilot-multi-agent-orchestrator-optimized',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandler();
  }

  private setupToolHandlers(): void {
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
