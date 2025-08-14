#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getVersion() {
  try {
    const packagePath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '0.0.1';
  }
}

function showHelp() {
  log('blue', '🚀 CMMI Specs MCP CLI');
  console.log('');
  console.log('用法:');
  console.log('  npx cmmi-specs-mcp <command> [options]');
  console.log('');
  console.log('命令:');
  console.log('  help                显示帮助信息');
  console.log('  version             显示版本信息');
  console.log('  config              显示配置信息');
  console.log('  install             安装MCP服务器');
  console.log('  install-vscode      安装VS Code配置');
  console.log('  start               启动MCP服务器');
  console.log('  build               构建项目');
  console.log('  test                运行测试');
  console.log('  validate            验证配置');
  console.log('  init <directory>    在指定目录初始化CMMI项目');
  console.log('  analyze <directory> 分析指定目录的agent配置');
  console.log('');
  console.log('示例:');
  console.log('  npx cmmi-specs-mcp install');
  console.log('  npx cmmi-specs-mcp start');
  console.log('  npx cmmi-specs-mcp init ./my-project');
  console.log('  npx cmmi-specs-mcp analyze ./existing-project');
}

function showConfig() {
  log('blue', '📋 配置信息');
  console.log(`  项目根目录: ${projectRoot}`);
  console.log(`  版本: ${getVersion()}`);
  console.log(`  MCP服务器: ${join(projectRoot, 'mcp-server')}`);
  console.log(`  配置目录: ${join(projectRoot, 'configs')}`);
  console.log(`  代理目录: ${join(projectRoot, 'agents')}`);
  console.log(`  文档目录: ${join(projectRoot, 'docs')}`);
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: options.cwd || projectRoot,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function installMCP() {
  log('blue', '🔧 安装MCP服务器...');
  try {
    await runCommand('bash', [join(projectRoot, 'install-mcp.sh')]);
    log('green', '✅ MCP服务器安装完成');
  } catch (error) {
    log('red', `❌ MCP服务器安装失败: ${error.message}`);
    process.exit(1);
  }
}

async function installVSCode() {
  log('blue', '🔧 安装VS Code配置...');
  try {
    await runCommand('bash', [join(projectRoot, 'install-vscode.sh')]);
    log('green', '✅ VS Code配置安装完成');
  } catch (error) {
    log('red', `❌ VS Code配置安装失败: ${error.message}`);
    process.exit(1);
  }
}

async function startServer() {
  // 在MCP模式下不输出任何日志，避免干扰VS Code的MCP协议解析
  // log('blue', '🚀 启动MCP服务器...');
  try {
    // 直接启动内置的server.js，不依赖mcp-server子目录
    await runCommand('node', [join(__dirname, 'server.js')]);
  } catch (error) {
    // 只在错误时输出到stderr，不影响stdout的MCP协议通信
    console.error(`❌ 服务器启动失败: ${error.message}`);
    process.exit(1);
  }
}

async function buildProject() {
  log('blue', '🔨 构建项目...');
  try {
    await runCommand('npm', ['run', 'build']);
    log('green', '✅ 项目构建完成');
  } catch (error) {
    log('red', `❌ 项目构建失败: ${error.message}`);
    process.exit(1);
  }
}

async function runTests() {
  log('blue', '🧪 运行测试...');
  try {
    await runCommand('bash', [join(projectRoot, 'tests/verify-mcp.sh')]);
    log('green', '✅ 测试完成');
  } catch (error) {
    log('red', `❌ 测试失败: ${error.message}`);
    process.exit(1);
  }
}

async function validate() {
  log('blue', '✅ 验证配置...');
  try {
    await runCommand('bash', [join(projectRoot, 'tests/verify-mcp.sh')]);
    log('green', '✅ 配置验证完成');
  } catch (error) {
    log('red', `❌ 配置验证失败: ${error.message}`);
    process.exit(1);
  }
}

async function initProject(targetDir) {
  if (!targetDir) {
    log('red', '❌ 请指定目标目录');
    console.log('用法: npx cmmi-specs-mcp init <directory>');
    process.exit(1);
  }

  log('blue', `🚀 在目录 ${targetDir} 初始化CMMI项目...`);
  try {
    // 调用内置的项目初始化功能
    await runCommand('node', ['-e', `
      import('./dist/core/workflowOrchestrator.js').then(module => {
        const { WorkflowOrchestrator } = module;
        return WorkflowOrchestrator.executeIntelligentProjectInitialization('${targetDir}', {
          projectName: '${targetDir.split('/').pop()}',
          projectType: 'cmmi-standard',
          initMode: 'cli'
        });
      }).then(result => {
        console.log('\\n🎉 项目初始化结果:');
        console.log('✅ 成功:', result.success);
        console.log('📝 消息:', result.message);
        console.log('📁 路径:', result.project_path);
        console.log('⏱️ 耗时:', result.duration + 'ms');
        if (!result.success) {
          process.exit(1);
        }
      }).catch(error => {
        console.error('❌ 初始化失败:', error.message);
        process.exit(1);
      });
    `]);
    log('green', '✅ 项目初始化完成');
  } catch (error) {
    log('red', `❌ 项目初始化失败: ${error.message}`);
    process.exit(1);
  }
}

async function analyzeProject(targetDir) {
  if (!targetDir) {
    log('red', '❌ 请指定要分析的目录');
    console.log('用法: npx cmmi-specs-mcp analyze <directory>');
    process.exit(1);
  }

  log('blue', `🔍 分析目录 ${targetDir} 的agent配置...`);
  try {
    // 调用Agent发现引擎
    await runCommand('node', ['-e', `
      import('./dist/core/agentDiscoveryEngine.js').then(module => {
        const { AgentDiscoveryEngine } = module;
        return AgentDiscoveryEngine.discoverAgents('${targetDir}');
      }).then(result => {
        console.log('\\n📊 Agent发现分析结果:');
        console.log('✅ 现有Agents:', result.existing_agents.length + '个');
        
        result.existing_agents.forEach((agent, index) => {
          console.log('  ' + (index + 1) + '. ' + agent.name + ' (' + agent.title + ')');
          console.log('     能力: ' + agent.capabilities.join(', '));
        });
        
        console.log('\\n❌ 缺失Agents:', result.missing_agents.length + '个');
        if (result.missing_agents.length > 0) {
          console.log('   ' + result.missing_agents.join(', '));
        }
        
        console.log('\\n💡 推荐建议:', result.recommendations.length + '个');
        result.recommendations.forEach((rec, index) => {
          console.log('  ' + (index + 1) + '. ' + rec.agent_name + ' (优先级: ' + rec.priority + ')');
          console.log('     原因: ' + rec.reason);
        });
      }).catch(error => {
        console.error('❌ 分析失败:', error.message);
        process.exit(1);
      });
    `]);
    log('green', '✅ 分析完成');
  } catch (error) {
    log('red', `❌ 分析失败: ${error.message}`);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetDir = args[1];

  if (!command || command === 'help' || command === '-h' || command === '--help') {
    showHelp();
    return;
  }

  switch (command) {
    case 'version':
    case '-v':
    case '--version':
      console.log(`cmmi-specs-mcp v${getVersion()}`);
      break;

    case 'install':
      await installMCP();
      break;

    case 'install-vscode':
      await installVSCode();
      break;

    case 'start':
      await startServer();
      break;

    case 'build':
      await buildProject();
      break;

    case 'test':
      await runTests();
      break;

    case 'validate':
      await validate();
      break;

    case 'config':
      showConfig();
      break;

    case 'init':
      await initProject(targetDir);
      break;

    case 'analyze':
      await analyzeProject(targetDir);
      break;

    default:
      log('red', `❌ 未知命令: ${command}`);
      console.log('使用 "npx cmmi-specs-mcp help" 查看帮助');
      process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  log('red', `❌ 未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('red', `❌ 未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

// 执行主函数
main().catch((error) => {
  log('red', `❌ 执行失败: ${error.message}`);
  process.exit(1);
});
