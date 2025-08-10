#!/usr/bin/env node

/**
 * MCP Server Entry Point
 * Copilot Multi-Agent Orchestrator
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpTools } from './tools/mcp-tools.js';
import { ToolHandlers } from './tools/handlers.js';
import { AdvancedToolHandlers } from './tools/advanced-handlers.js';
import { logger } from './utils/logger.js';

/**
 * Main server class for the multi-agent orchestrator
 */
class MultiAgentOrchestratorServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'copilot-multi-agent-orchestrator',
        version: '1.0.0',
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
    // Register all MCP tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: mcpTools
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'agent_create':
            result = await ToolHandlers.createAgent(args);
            break;

          case 'agent_list':
            result = await ToolHandlers.listAgents(args);
            break;

          // Advanced tools
          case 'task_analyze':
            result = await AdvancedToolHandlers.analyzeTask(args);
            break;

          case 'config_validate':
            result = await AdvancedToolHandlers.validateAgentConfigs(args);
            break;

          case 'cmmi_init':
            result = await AdvancedToolHandlers.initCmmiAgents(args);
            break;

          case 'workflow_execute':
            result = await AdvancedToolHandlers.executeMultiAgentWorkflow(args);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Format the response according to MCP protocol
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error) {
        logger.error(`Tool execution error for ${name}:`, error);
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
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    // MCP 服务器启动时不应该向 stdout 输出日志，只记录到文件
    // 这些启动信息仅在调试模式下输出到文件
    if (process.env['DEBUG_MCP']) {
      logger.info('🚀 Starting Copilot Multi-Agent Orchestrator MCP Server');
      logger.info('📋 Available tools:');
      logger.info('  • create_agent - Create a new AI agent with specified capabilities');
      logger.info('  • list_agents - List all available agents and their capabilities'); 
      logger.info('  • create_execution_plan - Create an execution plan for a complex task');
      logger.info('  • execute_plan - Execute a previously created execution plan');
      logger.info('  • get_execution_status - Get the status of a running or completed execution');
      logger.info('  • list_executions - List all executions with their status');
      logger.info('  • cancel_execution - Cancel a running execution');
      logger.info('  • get_agent_metrics - Get performance metrics for agents');
      logger.info('  • configure_orchestrator - Configure orchestrator settings');
    }
    
    await this.server.connect(transport);
    
    if (process.env['DEBUG_MCP']) {
      logger.info('✅ Server connected and ready for requests');
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MultiAgentOrchestratorServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
