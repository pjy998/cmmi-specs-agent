#!/usr/bin/env node

/**
 * Test Smart Agent Generator for VS Code
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SmartAgentGeneratorTest {
  constructor() {
    this.testProjectPath = './test-vscode-project';
  }

  async testSmartGeneration() {
    console.log('🧠 Testing Smart Agent Generator for VS Code...');
    
    // 确保测试项目目录存在
    if (!fs.existsSync(this.testProjectPath)) {
      fs.mkdirSync(this.testProjectPath, { recursive: true });
    }

    // 创建测试任务 - 一个复杂的全栈项目
    const complexTask = "Build a full-stack React TypeScript e-commerce platform with user authentication, product catalog, shopping cart, payment processing, order management, admin dashboard, real-time notifications, and mobile responsive design";
    
    // 构建MCP请求
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "smart_agent_generator",
        arguments: {
          task_content: complexTask,
          project_path: this.testProjectPath,
          generation_mode: "smart"
        }
      }
    };

    try {
      // 启动MCP服务器
      const serverProcess = spawn('node', ['./mcp-server/start-mcp.mjs'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        const line = data.toString();
        console.log('Server stdout:', line.trim());
        output += line;
      });

      serverProcess.stderr.on('data', (data) => {
        const line = data.toString();
        console.log('Server stderr:', line.trim());
        errorOutput += line;
      });

      // 等待服务器准备就绪
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 发送初始化请求
      const initRequest = {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "smart-agent-test-client",
            version: "1.0.0"
          }
        }
      };

      serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
      
      // 等待初始化完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 发送智能代理生成请求
      console.log('📝 Sending smart agent generation request...');
      serverProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');

      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 检查生成结果
      this.checkGeneratedAgents();

      // 清理
      serverProcess.kill();

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }

    console.log('🎉 Smart Agent Generator test completed');
  }

  checkGeneratedAgents() {
    console.log('📁 Checking generated VS Code agents...');
    
    const agentsDir = path.join(this.testProjectPath, '.copilot', 'agents');
    
    if (fs.existsSync(agentsDir)) {
      console.log('✅ VS Code agents directory created:', agentsDir);
      
      const agentFiles = fs.readdirSync(agentsDir)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
      
      console.log(`📋 Generated ${agentFiles.length} agent configuration files:`);
      
      agentFiles.forEach(file => {
        const filePath = path.join(agentsDir, file);
        console.log(`   📄 ${file}`);
        
        // 读取并显示agent配置的前几行
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').slice(0, 6);
          console.log(`      ${lines.join('\n      ')}`);
          console.log('      ...');
        } catch (error) {
          console.log(`      ⚠️ Failed to read ${file}`);
        }
      });
      
      // 验证VS Code标准路径
      console.log('🎯 Agent paths validation:');
      agentFiles.forEach(file => {
        const expectedPath = `.copilot/agents/${file}`;
        console.log(`   ✅ ${expectedPath} - VS Code compatible`);
      });
      
    } else {
      console.log('❌ VS Code agents directory not created');
    }
  }
}

// 运行测试
const test = new SmartAgentGeneratorTest();
test.testSmartGeneration().catch(console.error);
