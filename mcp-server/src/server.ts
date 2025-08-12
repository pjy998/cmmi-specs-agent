#!/usr/bin/env node

/**
 * MCP Server Entry Point
 * Copilot Multi-Agent Orchestrator - Refactored Architecture
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
import { EnhancedToolHandlers } from './tools/enhanced-handlers.js';
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
      
      // Log every tool call request
      logger.info(`🔧 Tool call received: ${name}`, { args });

      // Ensure args is always an object
      const safeArgs = args || {};

      try {
        let result: any;

        switch (name) {
          case 'agent_create':
            result = await ToolHandlers.createAgent(safeArgs);
            break;

          case 'agent_list':
            result = await ToolHandlers.listAgents(safeArgs);
            break;

          // Advanced tools
          case 'task_analyze':
            result = await AdvancedToolHandlers.analyzeTask(safeArgs);
            break;

          case 'smart_agent_generator':
            result = await AdvancedToolHandlers.smartAgentGenerator(safeArgs);
            break;

          case 'config_validate':
            result = await AdvancedToolHandlers.validateAgentConfigs(safeArgs);
            break;

          case 'cmmi_init':
            result = await AdvancedToolHandlers.initCmmiAgents(safeArgs);
            break;

          case 'workflow_execute':
            result = await AdvancedToolHandlers.executeMultiAgentWorkflow(safeArgs);
            break;

          case 'intelligent_translate':
            result = await ToolHandlers.intelligentTranslate(safeArgs);
            break;

          // Enhanced tools
          case 'project_generate':
            result = await EnhancedToolHandlers.generateProject(safeArgs);
            break;

          case 'quality_analyze':
            result = await EnhancedToolHandlers.analyzeQuality(safeArgs);
            break;

          case 'model_schedule':
            result = await EnhancedToolHandlers.scheduleModel(safeArgs);
            break;

          case 'monitoring_status':
            result = await EnhancedToolHandlers.getMonitoringStatus(safeArgs);
            break;

          case 'system_diagnosis':
            result = await EnhancedToolHandlers.diagnoseSystem(safeArgs);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
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
        logger.info(`✅ Tool executed successfully: ${name}`, { 
          success: true,
          resultSize: JSON.stringify(result).length 
        });
        
        return response;

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
      logger.info('  Basic Tools:');
      logger.info('  • agent_create - Create a new AI agent with specific capabilities');
      logger.info('  • agent_list - List all available agents and their capabilities'); 
      logger.info('  • intelligent_translate - Translate content using GPT-4.1 with context awareness');
      logger.info('  Advanced Tools:');
      logger.info('  • task_analyze - Analyze a task and recommend required agents and complexity');
      logger.info('  • smart_agent_generator - Intelligently generate VS Code agents based on task analysis');
      logger.info('  • config_validate - Validate agent configuration files for correctness');
      logger.info('  • cmmi_init - Initialize standard CMMI agents for software development');
      logger.info('  • workflow_execute - Execute a multi-agent workflow with intelligent orchestration');
      logger.info('  Enhanced Tools:');
      logger.info('  • project_generate - Generate a new project structure with documentation and code');
      logger.info('  • quality_analyze - Perform quality analysis on project code and documentation');
      logger.info('  • model_schedule - Schedule and manage AI model access for agents');
      logger.info('  • monitoring_status - Get system monitoring status and metrics');
      logger.info('  • system_diagnosis - Perform comprehensive system diagnosis and health checks');
    }
    
    await this.server.connect(transport);
    
    // Send ready notification to client (MCP protocol requirement)
    this.server.notification({
      method: 'notifications/ready'
    });
    
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
