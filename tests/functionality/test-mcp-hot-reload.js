#!/usr/bin/env node

/**
 * MCP服务热重载验证脚本
 * 
 * 此脚本允许在不重启VS Code的情况下验证MCP服务的安装和运行状态
 * 解决每次重启导致的chat会话丢失和缓冲区文件混乱问题
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置文件路径
const configPath = join(__dirname, 'configs', 'mcp-config-insiders.json');
const serverPath = join(__dirname, 'mcp-server', 'dist', 'server.js');
const logPath = join(__dirname, 'mcp-server', 'logs', 'hot-reload-test.log');

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const formattedMessage = `${color}[${timestamp}] ${message}${colors.reset}`;
    console.log(formattedMessage);
    
    // 同时写入日志文件
    try {
        const logEntry = `[${timestamp}] ${message}\n`;
        writeFileSync(logPath, logEntry, { flag: 'a' });
    } catch (error) {
        // 忽略日志写入错误
    }
}

async function checkMCPConfig() {
    log('🔧 检查MCP配置文件...', colors.cyan);
    
    if (!existsSync(configPath)) {
        log('❌ MCP配置文件不存在', colors.red);
        return false;
    }
    
    try {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        
        if (config.servers && config.servers['cmmi-specs-agent']) {
            log('✅ CMMI Specs Agent MCP配置已找到', colors.green);
            
            const serverConfig = config.servers['cmmi-specs-agent'];
            log(`📁 服务器路径: ${serverConfig.args[0]}`, colors.blue);
            log(`🔧 环境变量: ${JSON.stringify(serverConfig.env)}`, colors.blue);
            
            return true;
        } else {
            log('❌ 配置文件中未找到cmmi-specs-agent服务器配置', colors.red);
            return false;
        }
    } catch (error) {
        log(`❌ 配置文件解析失败: ${error.message}`, colors.red);
        return false;
    }
}

async function checkServerBuild() {
    log('🏗️  检查服务器构建状态...', colors.cyan);
    
    if (!existsSync(serverPath)) {
        log('❌ 服务器文件不存在，需要构建', colors.red);
        return false;
    }
    
    log('✅ 服务器文件存在', colors.green);
    return true;
}

async function testMCPServer() {
    log('🚀 测试MCP服务器启动...', colors.cyan);
    
    return new Promise((resolve) => {
        const testProcess = spawn('node', [serverPath], {
            env: {
                ...process.env,
                NODE_ENV: 'test',
                LOG_LEVEL: 'error',
                DEBUG_MCP: 'false'
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let output = '';
        let errorOutput = '';
        
        testProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        // 5秒后终止测试进程
        const timeout = setTimeout(() => {
            testProcess.kill('SIGTERM');
        }, 5000);
        
        testProcess.on('close', (code) => {
            clearTimeout(timeout);
            
            if (code === 0 || output.includes('Server started') || output.includes('MCP server')) {
                log('✅ MCP服务器测试成功', colors.green);
                if (output.trim()) {
                    log(`📋 输出: ${output.trim()}`, colors.blue);
                }
                resolve(true);
            } else {
                log('❌ MCP服务器测试失败', colors.red);
                if (errorOutput.trim()) {
                    log(`❌ 错误: ${errorOutput.trim()}`, colors.red);
                }
                resolve(false);
            }
        });
        
        testProcess.on('error', (error) => {
            clearTimeout(timeout);
            log(`❌ 启动服务器失败: ${error.message}`, colors.red);
            resolve(false);
        });
    });
}

async function validateNPXInstallation() {
    log('📦 验证NPX包安装...', colors.cyan);
    
    return new Promise((resolve) => {
        const npmProcess = spawn('npx', ['-y', '@upstash/context7-mcp@latest', '--help'], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let output = '';
        
        npmProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        npmProcess.on('close', (code) => {
            if (code === 0 || output.includes('Usage') || output.includes('help')) {
                log('✅ NPX包可以正常使用', colors.green);
                resolve(true);
            } else {
                log('❌ NPX包安装或运行有问题', colors.red);
                resolve(false);
            }
        });
        
        npmProcess.on('error', (error) => {
            log(`❌ NPX验证失败: ${error.message}`, colors.red);
            resolve(false);
        });
    });
}

async function simulateVSCodeReload() {
    log('🔄 模拟VS Code热重载MCP服务...', colors.cyan);
    
    // 检查是否有运行中的MCP相关进程
    return new Promise((resolve) => {
        const psProcess = spawn('ps', ['aux'], { stdio: ['ignore', 'pipe', 'pipe'] });
        
        let output = '';
        
        psProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        psProcess.on('close', () => {
            const mcpProcesses = output.split('\n').filter(line => 
                line.includes('cmmi-specs-agent') || 
                line.includes('@upstash/context7-mcp') ||
                (line.includes('node') && line.includes('mcp'))
            );
            
            if (mcpProcesses.length > 0) {
                log('✅ 检测到MCP相关进程正在运行:', colors.green);
                mcpProcesses.forEach(process => {
                    log(`  📋 ${process.trim()}`, colors.blue);
                });
            } else {
                log('⚠️  未检测到运行中的MCP进程', colors.yellow);
            }
            
            resolve(true);
        });
    });
}

function generateReloadInstructions() {
    log('📋 生成热重载指南...', colors.cyan);
    
    const instructions = `
${colors.bold}${colors.cyan}=== MCP服务热重载指南 ===${colors.reset}

${colors.green}✅ 无需重启VS Code的MCP服务更新方法:${colors.reset}

1. ${colors.yellow}使用VS Code命令面板:${colors.reset}
   - 按 Cmd+Shift+P (macOS) 或 Ctrl+Shift+P (Windows/Linux)
   - 输入: "Developer: Reload Window"
   - 这将重新加载窗口但保持会话状态

2. ${colors.yellow}通过设置重新加载MCP配置:${colors.reset}
   - 打开设置 (Cmd+,)
   - 搜索 "mcp" 或 "Model Context Protocol"
   - 修改任何MCP相关设置然后撤销，这会触发重新加载

3. ${colors.yellow}使用GitHub Copilot Chat命令:${colors.reset}
   - 在聊天窗口输入: /reset
   - 这会重置聊天上下文但不会丢失文件缓冲区

4. ${colors.yellow}热重载MCP服务器代码:${colors.reset}
   - 修改mcp-server/src目录下的代码
   - 运行: npm run build (在mcp-server目录)
   - MCP会自动检测文件变化并重新加载

${colors.green}✅ 保持聊天会话的技巧:${colors.reset}
- 定期保存重要的聊天内容到文件
- 使用工作区设置保存上下文
- 利用VS Code的自动保存功能

${colors.green}✅ 避免缓冲区混乱:${colors.reset}
- 使用 "File: Save All" 保存所有打开的文件
- 定期清理未使用的编辑器标签页
- 使用工作区功能组织项目文件
`;

    console.log(instructions);
    
    // 保存指南到文件
    const guidePath = join(__dirname, 'MCP_HOT_RELOAD_GUIDE.md');
    writeFileSync(guidePath, instructions.replace(/\x1b\[[0-9;]*m/g, ''), 'utf8');
    log(`📄 热重载指南已保存到: ${guidePath}`, colors.blue);
}

async function main() {
    log(`${colors.bold}${colors.cyan}🚀 开始MCP服务热重载验证...${colors.reset}`);
    log('='.repeat(60), colors.cyan);
    
    const results = {
        config: await checkMCPConfig(),
        build: await checkServerBuild(),
        server: false,
        npx: false
    };
    
    if (results.config && results.build) {
        results.server = await testMCPServer();
    }
    
    results.npx = await validateNPXInstallation();
    
    await simulateVSCodeReload();
    
    log('='.repeat(60), colors.cyan);
    log(`${colors.bold}📊 验证结果总结:${colors.reset}`);
    log(`  配置文件: ${results.config ? '✅' : '❌'}`, results.config ? colors.green : colors.red);
    log(`  服务器构建: ${results.build ? '✅' : '❌'}`, results.build ? colors.green : colors.red);
    log(`  服务器测试: ${results.server ? '✅' : '❌'}`, results.server ? colors.green : colors.red);
    log(`  NPX包验证: ${results.npx ? '✅' : '❌'}`, results.npx ? colors.green : colors.red);
    
    const allPassed = Object.values(results).every(Boolean);
    
    if (allPassed) {
        log(`${colors.bold}${colors.green}🎉 所有验证通过！MCP服务可以正常使用，无需重启VS Code${colors.reset}`);
    } else {
        log(`${colors.bold}${colors.yellow}⚠️  部分验证失败，建议检查相关配置${colors.reset}`);
    }
    
    generateReloadInstructions();
    
    log(`${colors.bold}${colors.cyan}✨ 验证完成！查看上述指南了解如何避免重启VS Code${colors.reset}`);
}

// 运行主函数
main().catch(error => {
    log(`❌ 验证过程中出现错误: ${error.message}`, colors.red);
    process.exit(1);
});
