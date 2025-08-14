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
  console.log('  agent <subcommand>  Agent管理功能');
  console.log('    create <name> <description> <capabilities>  创建新agent');
  console.log('    list                                        列出所有agents');
  console.log('');
  console.log('示例:');
  console.log('  npx cmmi-specs-mcp install');
  console.log('  npx cmmi-specs-mcp start');
  console.log('  npx cmmi-specs-mcp init ./my-project');
  console.log('  npx cmmi-specs-mcp agent create debug-helper "调试助手" "debugging,testing"');
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
    // 调用新的项目创建引擎
    await runCommand('node', ['-e', `
      import('./dist/core/projectCreationEngine.js').then(module => {
        const { ProjectCreationEngine } = module;
        const config = {
          projectName: '${targetDir.split('/').pop()}',
          projectType: 'cmmi-standard',
          targetDirectory: '${targetDir}',
          techStack: ['TypeScript', 'Node.js'],
          cmmLevel: 3,
          generateDocs: true
        };
        return ProjectCreationEngine.createProject(config);
      }).then(result => {
        console.log('\\n🎉 项目创建结果:');
        console.log('✅ 成功:', result.success);
        console.log('� 路径:', result.projectPath);
        console.log('📊 创建文件:', result.createdFiles.length);
        console.log('🤖 生成代理:', result.generatedAgents.length);
        console.log('⏱️ 耗时:', result.duration + 'ms');
        if (!result.success) {
          console.error('❌ 错误:', result.errors);
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

// Agent管理功能
async function handleAgentCommand(args) {
  const subCommand = args[0];
  
  if (!subCommand) {
    log('yellow', '📝 Agent管理命令:');
    console.log('  cmmi-specs-mcp agent create <name> <description> <capabilities>');
    console.log('  cmmi-specs-mcp agent list');
    console.log('示例:');
    console.log('  cmmi-specs-mcp agent create debug-assistant "调试助手" "debugging,testing,analysis"');
    return;
  }

  switch (subCommand) {
    case 'create':
      await createAgent(args.slice(1));
      break;
    case 'list':
      await listAgents();
      break;
    default:
      log('red', `❌ 未知的agent子命令: ${subCommand}`);
      console.log('使用 "cmmi-specs-mcp agent" 查看可用命令');
      process.exit(1);
  }
}

async function createAgent(args) {
  const [name, description, capabilities] = args;
  
  if (!name || !description || !capabilities) {
    log('red', '❌ 缺少必要参数');
    console.log('用法: cmmi-specs-mcp agent create <name> <description> <capabilities>');
    console.log('示例: cmmi-specs-mcp agent create debug-assistant "调试助手" "debugging,testing"');
    return;
  }

  log('blue', `🤖 创建CMMI标准Agent: ${name}`);
  
  try {
    const { writeFileSync, mkdirSync } = await import('fs');
    const agentsDir = join(__dirname, 'agents');
    
    // 确保agents目录存在
    if (!existsSync(agentsDir)) {
      mkdirSync(agentsDir, { recursive: true });
      log('yellow', '📁 创建agents目录');
    }
    
    // 检查agent是否已存在
    const agentFile = join(agentsDir, `${name}.yaml`);
    if (existsSync(agentFile)) {
      log('yellow', `⚠️  Agent "${name}" 已存在，将覆盖现有配置`);
    }
    
    log('yellow', '📝 生成CMMI L3标准配置...');
    
    // 生成符合CMMI L3标准的agent配置
    const timestamp = new Date().toISOString();
    const capabilityList = capabilities.split(',').map(cap => cap.trim());
    
    const yamlContent = `# ${name} - ${description}
# CMMI L3 标准Agent配置
# 创建时间: ${timestamp}

name: ${name}
description: ${description}
version: 1.0.0
created_at: ${timestamp}

# CMMI配置
cmmi_level: L3
role: specialist
category: custom

# 核心能力
capabilities:
${capabilityList.map(cap => `  - ${cap}`).join('\n')}

# AI模型配置
model: gpt-4.1
temperature: 0.7
max_tokens: 2000

# CMMI工作流程
workflow:
  phases:
    - name: 需求分析
      description: 分析和理解任务需求
    - name: 方案设计
      description: 设计解决方案和实施计划
    - name: 执行实施
      description: 按计划执行任务
    - name: 质量验证
      description: 验证结果质量和完整性
  
  entry_criteria: "明确的任务描述和目标"
  exit_criteria: "完成任务并通过质量检查"

# 专业提示词模板
prompt_template: |
  你是一个专业的${description}，具备以下核心能力：
  
${capabilityList.map(cap => `  • ${cap} - 提供专业的${cap}服务`).join('\n')}
  
  工作准则：
  1. 严格遵循CMMI L3级别的质量标准
  2. 确保所有工作可追溯和可验证
  3. 提供结构化的分析和建议
  4. 注重文档质量和知识传递
  
  请根据用户的具体需求，提供专业、准确、有价值的服务。

# 输入规范
input_schema:
  type: object
  properties:
    task:
      type: string
      description: 具体的任务或问题描述
      required: true
    context:
      type: string
      description: 相关的背景信息和约束条件
    priority:
      type: string
      enum: [low, medium, high, urgent]
      description: 任务优先级
      default: medium
    
# 输出格式
output_format:
  type: structured
  schema:
    analysis:
      description: 对任务的深入分析
      required: true
    approach:
      description: 推荐的解决方案和方法
      required: true
    deliverables:
      description: 具体的交付物清单
      required: true
    timeline:
      description: 预估的执行时间线
      required: false
    risks:
      description: 潜在风险和缓解措施
      required: false
    next_steps:
      description: 后续行动建议
      required: true

# 质量标准
quality_criteria:
  accuracy: 信息准确性 >= 95%
  completeness: 解决方案完整性 >= 90%
  clarity: 表达清晰度 >= 90%
  traceability: 可追溯性要求
`;

    writeFileSync(agentFile, yamlContent, 'utf8');
    
    log('green', `✅ Agent "${name}" 创建成功！`);
    console.log('');
    console.log('📊 配置摘要:');
    console.log(`   名称: ${name}`);
    console.log(`   描述: ${description}`);
    console.log(`   能力: ${capabilityList.join(', ')}`);
    console.log(`   标准: CMMI L3`);
    console.log(`   文件: ${agentFile}`);
    console.log('');
    console.log('💡 下一步:');
    console.log('   1. 可以编辑YAML文件自定义配置');
    console.log('   2. 在VS Code中通过MCP协议使用agent');
    console.log('   3. 使用 "cmmi-specs-mcp agent list" 查看所有agents');

  } catch (error) {
    log('red', `❌ Agent创建失败: ${error.message}`);
  }
}

async function listAgents() {
  log('blue', '📋 CMMI Agent清单');
  
  try {
    const agentsDir = join(__dirname, 'agents');
    if (!existsSync(agentsDir)) {
      log('yellow', '⚠️  agents目录不存在');
      console.log('💡 使用 "cmmi-specs-mcp agent create" 创建第一个agent');
      return;
    }

    const { readdirSync, readFileSync } = await import('fs');
    const files = readdirSync(agentsDir).filter(f => f.endsWith('.yaml'));
    
    if (files.length === 0) {
      log('yellow', '⚠️  未找到任何agent配置文件');
      console.log('💡 使用 "cmmi-specs-mcp agent create" 创建agent');
      return;
    }

    log('green', `📊 找到 ${files.length} 个Agent:`);
    console.log('');
    
    files.forEach((file, index) => {
      try {
        const filePath = join(agentsDir, file);
        const content = readFileSync(filePath, 'utf8');
        
        // 简单解析YAML获取基本信息
        const descMatch = content.match(/description:\s*(.+)/);
        const capMatch = content.match(/capabilities:\s*\n((?:\s*-\s*.+\n?)*)/);
        
        const agentName = file.replace('.yaml', '');
        const description = descMatch ? descMatch[1].trim() : '无描述';
        const capabilities = capMatch ? 
          capMatch[1].split('\n').filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(1).trim()).join(', ') : 
          '无能力定义';
        
        console.log(`${index + 1}. ${agentName}`);
        console.log(`   描述: ${description}`);
        console.log(`   能力: ${capabilities}`);
        console.log('');
        
      } catch (parseError) {
        console.log(`${index + 1}. ${file.replace('.yaml', '')} (解析失败)`);
      }
    });

  } catch (error) {
    log('red', `❌ 列出agents失败: ${error.message}`);
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

    case 'agent':
      await handleAgentCommand(args.slice(1));
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
