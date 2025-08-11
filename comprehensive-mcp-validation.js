#!/usr/bin/env node

/**
 * 完整的MCP工具验证脚本
 * 测试所有6个核心MCP工具的完整功能
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveMCPValidator {
  constructor() {
    this.requestId = 1;
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // 测试单个工具
  async testTool(toolName, params, description, expectedFields = []) {
    console.log(`\n🧪 测试 ${this.totalTests + 1}: ${toolName}`);
    console.log(`📝 ${description}`);
    console.log(`⏳ 执行中...`);
    
    this.totalTests++;
    
    return new Promise((resolve) => {
      const server = spawn('node', ['./mcp-server/dist/server.js'], {
        stdio: ['pipe', 'pipe', 'inherit'],
        cwd: '/Users/jieky/mcp/cmmi-specs-agent'
      });

      const message = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      };

      server.stdin.write(JSON.stringify(message) + '\n');

      let output = '';
      let timeoutId;
      
      server.stdout.on('data', (data) => {
        output += data.toString();
      });

      // 设置超时
      timeoutId = setTimeout(() => {
        console.log(`⏰ 测试超时 (60秒)`);
        server.kill();
        this.recordTestResult(toolName, false, '测试超时', null);
        this.failedTests++;
        resolve({ success: false, error: 'Timeout' });
      }, 60000);

      server.on('close', () => {
        clearTimeout(timeoutId);
        
        try {
          if (!output.trim()) {
            console.log(`❌ 无响应输出`);
            this.recordTestResult(toolName, false, '无响应输出', null);
            this.failedTests++;
            resolve({ success: false, error: 'No output' });
            return;
          }

          const lines = output.trim().split('\n');
          let response = null;
          
          // 寻找有效的JSON响应
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.result && parsed.result.content) {
                response = parsed;
                break;
              }
            } catch (e) {
              // 继续寻找
            }
          }

          if (!response) {
            console.log(`❌ 无法解析JSON响应`);
            console.log(`📄 原始输出: ${output.substring(0, 200)}...`);
            this.recordTestResult(toolName, false, '无法解析响应', null);
            this.failedTests++;
            resolve({ success: false, error: 'Invalid JSON response' });
            return;
          }

          const result = JSON.parse(response.result.content[0].text);
          
          // 验证预期字段
          let validationPassed = true;
          const missingFields = [];
          
          for (const field of expectedFields) {
            if (!(field in result)) {
              validationPassed = false;
              missingFields.push(field);
            }
          }

          if (validationPassed && result.success !== false) {
            console.log(`✅ 测试通过`);
            console.log(`📊 结果: ${this.formatResult(result, toolName)}`);
            this.recordTestResult(toolName, true, '测试通过', result);
            this.passedTests++;
            resolve({ success: true, result });
          } else {
            console.log(`❌ 测试失败`);
            if (missingFields.length > 0) {
              console.log(`📋 缺少字段: ${missingFields.join(', ')}`);
            }
            if (result.error) {
              console.log(`🐛 错误信息: ${result.error}`);
            }
            console.log(`📄 完整结果:`, JSON.stringify(result, null, 2).substring(0, 300));
            this.recordTestResult(toolName, false, result.error || '验证失败', result);
            this.failedTests++;
            resolve({ success: false, error: result.error || 'Validation failed', result });
          }
        } catch (e) {
          console.log(`❌ 处理响应时出错: ${e.message}`);
          console.log(`📄 原始输出: ${output}`);
          this.recordTestResult(toolName, false, `处理错误: ${e.message}`, null);
          this.failedTests++;
          resolve({ success: false, error: e.message });
        }
      });

      server.on('error', (error) => {
        clearTimeout(timeoutId);
        console.log(`❌ 进程错误: ${error.message}`);
        this.recordTestResult(toolName, false, `进程错误: ${error.message}`, null);
        this.failedTests++;
        resolve({ success: false, error: error.message });
      });
    });
  }

  // 记录测试结果
  recordTestResult(toolName, passed, message, result) {
    this.testResults.push({
      tool: toolName,
      passed,
      message,
      result,
      timestamp: new Date().toISOString()
    });
  }

  // 格式化结果显示
  formatResult(result, toolName) {
    switch (toolName) {
      case 'task_analyze':
        return `复杂度: ${result.complexity}, 领域: ${result.domain?.join(', ')}, 预计时长: ${result.estimated_duration}`;
      
      case 'cmmi_init':
        return `创建了 ${result.created_agents?.length || 0} 个 CMMI 代理`;
      
      case 'agent_list':
        const totalAgents = (result.agents?.length || 0) + (result.file_agents?.length || 0);
        return `发现 ${totalAgents} 个代理 (内存: ${result.agents?.length || 0}, 文件: ${result.file_agents?.length || 0})`;
      
      case 'agent_create':
        return `创建代理: ${result.agent?.name || result.name || '未知名称'}`;
      
      case 'config_validate':
        return `总文件: ${result.total_files}, 有效: ${result.valid_count}, 无效: ${result.invalid_count}`;
      
      case 'workflow_execute':
        return `工作流状态: ${result.status}, 使用代理: ${result.agents_used?.length || 0} 个, 执行步骤: ${result.results?.length || 0}`;
      
      default:
        return JSON.stringify(result, null, 2).substring(0, 150) + '...';
    }
  }

  // 运行所有测试
  async runComprehensiveValidation() {
    console.log('🚀 开始完整的 MCP 工具验证');
    console.log('=' .repeat(60));
    console.log('📋 将测试以下6个核心工具:');
    console.log('   1. task_analyze - 任务分析');
    console.log('   2. cmmi_init - CMMI代理初始化');
    console.log('   3. agent_list - 代理列表');
    console.log('   4. agent_create - 创建代理');
    console.log('   5. config_validate - 配置验证');
    console.log('   6. workflow_execute - 多代理工作流执行');
    console.log('=' .repeat(60));

    // 准备测试环境
    this.prepareTestEnvironment();

    // 测试 1: 任务分析
    await this.testTool('task_analyze', {
      task_content: '开发一个电商网站的用户注册和登录功能，包括前端表单、后端API、数据库设计和测试用例',
      project_path: './test-project'
    }, '分析复杂任务需求，识别所需代理和复杂度', ['complexity', 'domain', 'estimated_duration', 'requires_agents']);

    // 测试 2: 初始化 CMMI 代理
    await this.testTool('cmmi_init', {
      project_path: './test-project'
    }, '初始化标准的6个CMMI软件开发代理', ['created_agents', 'agents_directory']);

    // 测试 3: 列出所有代理
    await this.testTool('agent_list', {
      project_path: './test-project'
    }, '列出项目中所有可用的代理', ['file_agents', 'total_count']);

    // 测试 4: 创建自定义代理
    await this.testTool('agent_create', {
      name: 'security-agent',
      description: '安全专家代理，负责安全审查和漏洞检测',
      capabilities: ['security_analysis', 'vulnerability_scan', 'penetration_testing'],
      model: 'gpt-4.1',
      project_path: './test-project'
    }, '创建自定义的安全专家代理', ['agent', 'success']);

    // 测试 5: 配置验证
    await this.testTool('config_validate', {
      config_path: './test-project/agents'
    }, '验证代理配置文件的正确性和完整性', ['total_files', 'valid_count', 'invalid_count']);

    // 测试 6: 执行多代理工作流（核心功能）
    await this.testTool('workflow_execute', {
      task_content: '开发一个博客系统，包括文章发布、用户评论、标签分类功能，需要考虑SEO优化和安全性',
      project_path: './test-project',
      execution_mode: 'smart',
      context_sharing: true,
      max_iterations: 5
    }, '执行完整的多代理协作工作流', ['execution_id', 'agents_used', 'results', 'status']);

    // 生成最终报告
    this.generateReport();
  }

  // 准备测试环境
  prepareTestEnvironment() {
    const testProjectDir = './test-project';
    if (fs.existsSync(testProjectDir)) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  }

  // 生成测试报告
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 MCP 工具验证报告');
    console.log('=' .repeat(60));
    
    console.log(`\n📈 总体统计:`);
    console.log(`   总测试数: ${this.totalTests}`);
    console.log(`   通过数: ${this.passedTests} ✅`);
    console.log(`   失败数: ${this.failedTests} ❌`);
    console.log(`   成功率: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    console.log(`\n📋 详细结果:`);
    for (const result of this.testResults) {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${result.tool} - ${result.message}`);
    }

    const overallStatus = this.failedTests === 0 ? '🎉 所有测试通过' : `⚠️ 有 ${this.failedTests} 个测试失败`;
    
    console.log(`\n🏆 验证结果: ${overallStatus}`);
    
    if (this.failedTests === 0) {
      console.log('\n💡 MCP 工具系统完全正常工作！');
      console.log('🔧 可以在 VS Code 中使用以下工具:');
      console.log('   • task_analyze - 智能任务分析');
      console.log('   • cmmi_init - 快速初始化标准代理');
      console.log('   • agent_list - 查看所有可用代理');
      console.log('   • agent_create - 创建自定义代理');
      console.log('   • config_validate - 验证代理配置');
      console.log('   • workflow_execute - 执行多代理协作工作流');
      console.log('\n🎯 系统已准备好用于生产环境！');
    } else {
      console.log('\n🔧 需要修复失败的测试才能投入使用');
    }

    console.log('\n' + '=' .repeat(60));

    // 保存详细报告到文件
    this.saveReportToFile();
  }

  // 保存报告到文件
  saveReportToFile() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.totalTests,
        passed_tests: this.passedTests,
        failed_tests: this.failedTests,
        success_rate: (this.passedTests / this.totalTests) * 100
      },
      detailed_results: this.testResults
    };

    const reportPath = './mcp-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 详细报告已保存到: ${reportPath}`);
  }

  // 清理测试环境
  cleanup() {
    try {
      const testProjectDir = './test-project';
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
        console.log('🧹 测试环境已清理');
      }
    } catch (error) {
      console.log('⚠️ 清理测试环境时出错:', error.message);
    }
  }
}

// 运行完整验证
const validator = new ComprehensiveMCPValidator();

// 捕获中断信号进行清理
process.on('SIGINT', () => {
  console.log('\n🛑 验证被中断');
  validator.cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 验证被终止');
  validator.cleanup();
  process.exit(1);
});

// 开始验证
validator.runComprehensiveValidation()
  .then(() => {
    validator.cleanup();
    process.exit(validator.failedTests === 0 ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ 验证过程中发生严重错误:', error);
    validator.cleanup();
    process.exit(1);
  });
