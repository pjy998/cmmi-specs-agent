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
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取版本信息
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

// 调试模式检查
const DEBUG_MODE = process.env['DEBUG_MCP'] === 'true' || process.env['LOG_LEVEL'] === 'debug';
const PACKAGE_VERSION = getPackageVersion();

/**
 * Optimized server class for the multi-agent orchestrator with 8 tools
 */
class OptimizedMultiAgentOrchestratorServer {
  private server: Server;
  private clientRoots: string[] = []; // 存储客户端提供的根路径

  constructor() {
    // 启动时显示版本信息
    this.logStartupInfo();

    this.server = new Server(
      {
        name: 'copilot-multi-agent-orchestrator-optimized',
        version: PACKAGE_VERSION,
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

  private logStartupInfo(): void {
    console.error(`🚀 CMMI Specs MCP Server v${PACKAGE_VERSION}`);
    console.error(`📅 Started at: ${new Date().toISOString()}`);
    console.error(`🛠️  Tools available: ${mcpTools.length}`);
    console.error(`🐛 Debug mode: ${DEBUG_MODE ? 'ON' : 'OFF'}`);
    console.error(`📋 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    
    if (DEBUG_MODE) {
      console.error(`🔍 Debug logging enabled`);
      console.error(`📋 Available tools:`);
      mcpTools.forEach((tool, index) => {
        console.error(`   ${index + 1}. ${tool.name} - ${tool.description.split(':')[0]}`);
      });
    }
    console.error(`${'='.repeat(60)}`);
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
      
      // Log every tool call request with debug info
      if (DEBUG_MODE) {
        console.error(`🔧 [DEBUG] Tool call: ${name}`);
        console.error(`📊 [DEBUG] Arguments:`, JSON.stringify(args, null, 2));
        console.error(`⏰ [DEBUG] Timestamp: ${new Date().toISOString()}`);
      }
      logger.info(`🔧 Optimized tool call received: ${name}`, { args });

      // Ensure args is always an object
      const safeArgs = args || {};

      // 如果工具调用没有提供project_path，尝试使用客户端根路径
      if (!safeArgs.project_path) {
        const defaultPath = this.getDefaultProjectPath();
        if (defaultPath !== process.cwd()) {
          safeArgs.project_path = defaultPath;
          if (DEBUG_MODE) {
            console.error(`🎯 [DEBUG] Auto-detected project path: ${safeArgs.project_path}`);
          }
          logger.info(`🎯 Auto-detected project path from client workspace: ${safeArgs.project_path}`);
        }
      }

      const startTime = Date.now();
      
      try {
        let result: any;

        if (DEBUG_MODE) {
          console.error(`⚡ [DEBUG] Executing tool: ${name}`);
        }

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
        const executionTime = Date.now() - startTime;
        
        if (DEBUG_MODE) {
          console.error(`✅ [DEBUG] Tool ${name} completed in ${executionTime}ms`);
          console.error(`📊 [DEBUG] Result size: ${JSON.stringify(result).length} characters`);
          console.error(`📄 [DEBUG] Result preview:`, JSON.stringify(result, null, 2).substring(0, 200) + '...');
        }

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
          executionTime: `${executionTime}ms`,
          resultSize: JSON.stringify(result).length 
        });
        
        return response;

      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        if (DEBUG_MODE) {
          console.error(`❌ [DEBUG] Tool ${name} failed after ${executionTime}ms`);
          console.error(`💥 [DEBUG] Error details:`, error);
        }
        
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
      // 如果是file:// URI，提取路径
      let rootPath = this.clientRoots[0];
      if (rootPath.startsWith('file://')) {
        rootPath = rootPath.replace('file://', '');
      }
      return rootPath;
    }

    // 检查环境变量中是否有VS Code工作区路径
    const vscodeWorkspace = process.env['VSCODE_WORKSPACE'] || process.env['PWD'];
    if (vscodeWorkspace && !vscodeWorkspace.includes('/_npx/') && !vscodeWorkspace.includes('/.npm/')) {
      return vscodeWorkspace;
    }

    // 检查当前工作目录是否是npm临时目录
    const currentDir = process.cwd();
    const isNpmTempDir = currentDir.includes('/_npx/') || currentDir.includes('/.npm/');
    
    if (isNpmTempDir) {
      // 如果在npm临时目录中，尝试使用用户主目录
      const os = require('os');
      return os.homedir();
    }

    return currentDir;
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
    
    // 连接到客户端
    await this.server.connect(transport);
    
    // Send ready notification to client (MCP protocol requirement)
    this.server.notification({
      method: 'notifications/ready'
    });
    
    // 连接成功日志
    console.error(`✅ CMMI Specs MCP Server v${PACKAGE_VERSION} connected and ready!`);
    if (DEBUG_MODE) {
      console.error(`🔗 [DEBUG] Transport: StdioServerTransport`);
      console.error(`📡 [DEBUG] Ready notification sent to client`);
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
