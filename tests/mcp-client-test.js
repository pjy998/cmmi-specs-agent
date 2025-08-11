#!/usr/bin/env node

/**
 * 正确的MCP客户端测试脚本
 * 遵循MCP协议标准进行通信
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MCPClientTester {
  constructor() {
    this.requestId = 1;
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // MCP协议握手
  async initializeConnection(server) {
    return new Promise((resolve, reject) => {
      const initMessage = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'mcp-test-client',
            version: '1.0.0'
          }
        }
      };

      let responseReceived = false;
      
      server.stdout.on('data', (data) => {
        if (responseReceived) return;
        
        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === initMessage.id && response.result) {
            responseReceived = true;
            console.log('✅ MCP协议握手成功');
            
            // 发送initialized通知
            const initializedNotification = {
              jsonrpc: '2.0',
              method: 'notifications/initialized'
            };
            server.stdin.write(JSON.stringify(initializedNotification) + '\n');
            resolve();
          }
        } catch (e) {
          // 继续等待有效响应
        }
      });

      server.stdin.write(JSON.stringify(initMessage) + '\n');

      setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('MCP握手超时'));
        }
      }, 5000);
    });
  }

  // 获取可用工具列表
  async listTools(server) {
    return new Promise((resolve, reject) => {
      const listMessage = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/list'
      };

      let responseReceived = false;
      
      const dataHandler = (data) => {
        if (responseReceived) return;
        
        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === listMessage.id) {
            responseReceived = true;
            server.stdout.removeListener('data', dataHandler);
            
            if (response.result && response.result.tools) {
              console.log(`✅ 获取到 ${response.result.tools.length} 个可用工具`);
              resolve(response.result.tools);
            } else {
              reject(new Error('无效的工具列表响应'));
            }
          }
        } catch (e) {
          // 继续等待有效响应
        }
      };

      server.stdout.on('data', dataHandler);
      server.stdin.write(JSON.stringify(listMessage) + '\n');

      setTimeout(() => {
        if (!responseReceived) {
          server.stdout.removeListener('data', dataHandler);
          reject(new Error('获取工具列表超时'));
        }
      }, 5000);
    });
  }

  // 测试单个工具
  async testTool(server, toolName, params, description) {
    console.log(`\n🧪 测试 ${this.totalTests + 1}: ${toolName}`);
    console.log(`📝 ${description}`);
    console.log(`⏳ 执行中...`);
    
    this.totalTests++;
    
    return new Promise((resolve) => {
      const message = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      };

      let responseReceived = false;
      let timeoutId;
      
      const dataHandler = (data) => {
        if (responseReceived) return;
        
        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === message.id) {
            responseReceived = true;
            clearTimeout(timeoutId);
            server.stdout.removeListener('data', dataHandler);
            
            if (response.error) {
              console.log(`❌ 工具执行错误: ${response.error.message || response.error}`);
              this.recordTestResult(toolName, false, response.error.message || response.error, response.error);
              this.failedTests++;
              resolve({ success: false, error: response.error });
            } else if (response.result) {
              console.log(`✅ 工具执行成功`);
              let result = null;
              try {
                if (response.result.content && response.result.content[0]) {
                  result = JSON.parse(response.result.content[0].text);
                } else {
                  result = response.result;
                }
                this.recordTestResult(toolName, true, '测试通过', result);
                this.passedTests++;
                resolve({ success: true, result });
              } catch (parseError) {
                console.log(`❌ 解析结果失败: ${parseError.message}`);
                this.recordTestResult(toolName, false, `解析结果失败: ${parseError.message}`, response.result);
                this.failedTests++;
                resolve({ success: false, error: parseError.message });
              }
            } else {
              console.log(`❌ 无效响应格式`);
              this.recordTestResult(toolName, false, '无效响应格式', response);
              this.failedTests++;
              resolve({ success: false, error: 'Invalid response format' });
            }
          }
        } catch (e) {
          // 继续等待有效响应
        }
      };

      server.stdout.on('data', dataHandler);
      server.stdin.write(JSON.stringify(message) + '\n');

      timeoutId = setTimeout(() => {
        if (!responseReceived) {
          responseReceived = true;
          server.stdout.removeListener('data', dataHandler);
          console.log(`⏰ 测试超时 (15秒)`);
          this.recordTestResult(toolName, false, '测试超时', null);
          this.failedTests++;
          resolve({ success: false, error: 'Timeout' });
        }
      }, 15000);
    });
  }

  // 记录测试结果
  recordTestResult(tool, passed, message, result) {
    this.testResults.push({
      tool,
      passed,
      message,
      result,
      timestamp: new Date().toISOString()
    });
  }

  // 环境检查
  async checkEnvironment() {
    console.log('🔍 检查测试环境...\n');
    
    const checks = [];
    
    // 1. 检查Node.js版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    if (majorVersion >= 18) {
      console.log(`✅ Node.js版本: ${nodeVersion} (支持)`);
      checks.push({ name: 'Node.js版本', status: true, details: nodeVersion });
    } else {
      console.log(`❌ Node.js版本: ${nodeVersion} (需要18+)`);
      checks.push({ name: 'Node.js版本', status: false, details: `${nodeVersion}, 需要18+` });
    }

    // 2. 检查MCP服务器文件
    const serverPath = './mcp-server/dist/server.js';
    if (fs.existsSync(path.join(process.cwd(), serverPath))) {
      console.log(`✅ MCP服务器文件存在: ${serverPath}`);
      checks.push({ name: 'MCP服务器文件', status: true, details: serverPath });
    } else {
      console.log(`❌ MCP服务器文件不存在: ${serverPath}`);
      checks.push({ name: 'MCP服务器文件', status: false, details: `${serverPath} 不存在` });
    }

    // 3. 检查package.json
    const packagePath = './mcp-server/package.json';
    if (fs.existsSync(path.join(process.cwd(), packagePath))) {
      try {
        const packageData = JSON.parse(fs.readFileSync(path.join(process.cwd(), packagePath), 'utf8'));
        console.log(`✅ package.json存在，项目名: ${packageData.name}`);
        checks.push({ name: 'package.json', status: true, details: packageData.name });
      } catch (e) {
        console.log(`❌ package.json格式错误: ${e.message}`);
        checks.push({ name: 'package.json', status: false, details: e.message });
      }
    } else {
      console.log(`❌ package.json不存在: ${packagePath}`);
      checks.push({ name: 'package.json', status: false, details: `${packagePath} 不存在` });
    }

    // 4. 检查node_modules
    const nodeModulesPath = './mcp-server/node_modules';
    if (fs.existsSync(path.join(process.cwd(), nodeModulesPath))) {
      const moduleCount = fs.readdirSync(path.join(process.cwd(), nodeModulesPath)).length;
      console.log(`✅ 依赖包已安装: ${moduleCount} 个模块`);
      checks.push({ name: '依赖包', status: true, details: `${moduleCount} 个模块` });
    } else {
      console.log(`❌ 依赖包未安装: ${nodeModulesPath}`);
      checks.push({ name: '依赖包', status: false, details: '请运行 npm install' });
    }

    // 5. 检查TypeScript编译
    const tsConfigPath = './mcp-server/tsconfig.json';
    if (fs.existsSync(path.join(process.cwd(), tsConfigPath))) {
      console.log(`✅ TypeScript配置存在: ${tsConfigPath}`);
      checks.push({ name: 'TypeScript配置', status: true, details: tsConfigPath });
    } else {
      console.log(`❌ TypeScript配置不存在: ${tsConfigPath}`);
      checks.push({ name: 'TypeScript配置', status: false, details: `${tsConfigPath} 不存在` });
    }

    // 6. 检查输出目录
    const outputDir = './test-output';
    if (!fs.existsSync(path.join(process.cwd(), outputDir))) {
      fs.mkdirSync(path.join(process.cwd(), outputDir), { recursive: true });
      console.log(`✅ 创建输出目录: ${outputDir}`);
    } else {
      console.log(`✅ 输出目录存在: ${outputDir}`);
    }
    checks.push({ name: '输出目录', status: true, details: outputDir });

    const failedChecks = checks.filter(c => !c.status);
    if (failedChecks.length > 0) {
      console.log('\n❌ 环境检查失败，请解决以下问题:');
      failedChecks.forEach(check => {
        console.log(`  • ${check.name}: ${check.details}`);
      });
      console.log('\n💡 建议操作:');
      console.log('  1. 确保Node.js版本 >= 18');
      console.log('  2. cd mcp-server && npm install');
      console.log('  3. cd mcp-server && npm run build');
      return false;
    }

    console.log('\n✅ 环境检查通过，可以开始测试\n');
    return true;
  }

  // 运行完整测试套件
  async runCompleteTest() {
    console.log('🚀 启动MCP工具完整测试...\n');

    // 首先进行环境检查
    if (!(await this.checkEnvironment())) {
      console.log('❌ 环境检查失败，无法继续测试');
      return;
    }

    const serverPath = './mcp-server/dist/server.js';
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      env: { ...process.env, DEBUG_MCP: 'true' }
    });

    // 监听服务器错误
    server.stderr.on('data', (data) => {
      console.log(`📄 服务器错误: ${data.toString()}`);
    });

    server.on('error', (error) => {
      console.log(`❌ 服务器启动失败: ${error.message}`);
      return;
    });

    try {
      // 1. 初始化MCP连接
      console.log('📡 初始化MCP连接...');
      await this.initializeConnection(server);

      // 2. 获取工具列表
      console.log('📋 获取可用工具列表...');
      const tools = await this.listTools(server);
      console.log('� 可用工具:', tools.map(t => t.name).join(', '));

      // 3. 测试各个工具
      console.log('\n🧪 开始工具功能测试...');
      
      await this.testTool(server, 'task_analyze', {
        task_content: '创建一个简单的Python计算器程序',
        complexity_hint: 'simple'
      }, '任务分析测试 - 分析简单Python项目');

      await this.testTool(server, 'agent_list', {
        project_path: './test-output'
      }, '代理列表测试 - 列出已配置的代理');

      await this.testTool(server, 'agent_create', {
        name: 'test-calculator-agent',
        description: '专门处理计算器开发的测试代理',
        capabilities: ['python-coding', 'testing', 'documentation'],
        project_path: './test-output'
      }, '创建代理测试 - 创建计算器开发代理');

      await this.testTool(server, 'config_validate', {
        config_path: './test-output'
      }, '配置验证测试 - 验证代理配置文件');

      await this.testTool(server, 'cmmi_init', {
        project_path: './test-output'
      }, 'CMMI初始化测试 - 初始化标准CMMI代理');

      await this.testTool(server, 'workflow_execute', {
        task_content: '为计算器项目生成测试用例',
        project_path: './test-output',
        execution_mode: 'sequential'
      }, '工作流执行测试 - 执行多代理协作任务');

    } catch (error) {
      console.log(`❌ 测试过程中出错: ${error.message}`);
      console.log(`📄 错误详情: ${error.stack}`);
    } finally {
      console.log('\n🔚 关闭服务器连接...');
      server.kill();
      
      // 等待服务器完全关闭
      await new Promise(resolve => {
        server.on('close', resolve);
        setTimeout(resolve, 1000); // 备用超时
      });
    }

    // 输出测试结果摘要
    this.printSummary();
    this.saveResults();
  }

  // 打印测试摘要
  printSummary() {
    console.log('\n📊 测试结果摘要:');
    console.log(`总测试数: ${this.totalTests}`);
    console.log(`通过: ${this.passedTests}`);
    console.log(`失败: ${this.failedTests}`);
    console.log(`成功率: ${this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  • ${result.tool}: ${result.message}`);
      });
    }
  }

  // 保存测试结果
  saveResults() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.totalTests,
        passed_tests: this.passedTests,
        failed_tests: this.failedTests,
        success_rate: this.totalTests > 0 ? (this.passedTests / this.totalTests) : 0
      },
      detailed_results: this.testResults
    };

    // 确保 test-output 目录存在
    const testOutputDir = './test-output';
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }

    const reportPath = './test-output/mcp-protocol-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }
}

// 运行测试
if (require.main === module) {
  const tester = new MCPClientTester();
  tester.runCompleteTest().catch(console.error);
}
