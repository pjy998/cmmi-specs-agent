#!/usr/bin/env node

/**
 * 统一测试启动器
 * 运行所有测试工具并将输出统一到 test-output 目录
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class UnifiedTester {
  constructor() {
    this.testOutputDir = './test-output';
    this.results = {
      environment: null,
      mcp_protocol: null,
      document_auto_landing: null,
      universal_framework: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const symbols = {
      'info': '📋',
      'success': '✅', 
      'error': '❌',
      'warning': '⚠️',
      'start': '🚀'
    };
    console.log(`${symbols[type] || '📋'} [${timestamp}] ${message}`);
  }

  async ensureTestOutputDir() {
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
      this.log(`创建测试输出目录: ${this.testOutputDir}`, 'success');
    }
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });
  }

  async runEnvironmentCheck() {
    this.log('运行环境检查...', 'start');
    
    const result = await this.runCommand('./tests/verify-mcp.sh');
    this.results.environment = {
      passed: result.code === 0,
      exitCode: result.code,
      timestamp: new Date().toISOString()
    };
    
    if (result.code === 0) {
      this.log('环境检查通过', 'success');
    } else {
      this.log('环境检查失败', 'error');
    }
    
    return result.code === 0;
  }

  // validate-tools test removed as JSON Schema default keyword issue is resolved

  async runMcpProtocolTest() {
    this.log('运行MCP协议测试...', 'start');
    
    const result = await this.runCommand('node', ['tests/mcp-client-test.js']);
    this.results.mcp_protocol = {
      passed: result.code === 0,
      exitCode: result.code,
      timestamp: new Date().toISOString()
    };
    
    if (result.code === 0) {
      this.log('MCP协议测试通过', 'success');
    } else {
      this.log('MCP协议测试失败', 'error');
    }
    
    return result.code === 0;
  }

  async runDocumentAutoLandingTest() {
    this.log('运行文档自动生成测试...', 'start');
    
    const result = await this.runCommand('node', ['tests/test-document-auto-landing.mjs']);
    this.results.document_auto_landing = {
      passed: result.code === 0,
      exitCode: result.code,
      timestamp: new Date().toISOString()
    };
    
    if (result.code === 0) {
      this.log('文档自动生成测试通过', 'success');
    } else {
      this.log('文档自动生成测试失败', 'error');
    }
    
    return result.code === 0;
  }

  async runUniversalFrameworkTest() {
    this.log('运行通用多语言测试框架...', 'start');
    
    const result = await this.runCommand('node', ['tests/test-integration.js']);
    this.results.universal_framework = {
      passed: result.code === 0,
      exitCode: result.code,
      timestamp: new Date().toISOString()
    };
    
    if (result.code === 0) {
      this.log('通用测试框架验证通过', 'success');
    } else {
      this.log('通用测试框架验证失败', 'error');
    }
    
    return result.code === 0;
  }

  generateSummaryReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      test_suite: 'CMMI Specs Agent - 完整测试套件',
      results: this.results,
      summary: {
        total_test_categories: Object.keys(this.results).length,
        passed_categories: Object.values(this.results).filter(r => r && r.passed).length,
        failed_categories: Object.values(this.results).filter(r => r && !r.passed).length
      }
    };

    const reportPath = path.join(this.testOutputDir, 'unified-test-report.json');
    
    // 确保目录存在
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    return summary;
  }

  printSummary(summary) {
    console.log('\n' + '='.repeat(60));
    this.log('测试套件完成', 'start');
    console.log('='.repeat(60));
    
    console.log(`📊 测试类别: ${summary.summary.total_test_categories}`);
    console.log(`✅ 通过: ${summary.summary.passed_categories}`);
    console.log(`❌ 失败: ${summary.summary.failed_categories}`);
    
    const successRate = summary.summary.total_test_categories > 0 
      ? ((summary.summary.passed_categories / summary.summary.total_test_categories) * 100).toFixed(1)
      : 0;
    console.log(`📈 成功率: ${successRate}%`);
    
    console.log('\n📋 详细结果:');
    Object.entries(this.results).forEach(([category, result]) => {
      if (result) {
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${category.replace(/_/g, ' ')}`);
      }
    });
    
    console.log(`\n📄 完整报告: ${path.join(this.testOutputDir, 'unified-test-report.json')}`);
    console.log(`📁 测试输出: ${this.testOutputDir}/`);
    
    if (fs.existsSync(path.join(this.testOutputDir, 'docs'))) {
      console.log(`📑 生成的文档: ${this.testOutputDir}/docs/`);
    }
    
    if (fs.existsSync(path.join(this.testOutputDir, 'agents'))) {
      console.log(`🤖 代理配置: ${this.testOutputDir}/agents/`);
    }
  }

  async runAllTests() {
    this.log('启动完整测试套件', 'start');
    
    await this.ensureTestOutputDir();
    
    // 清理旧的输出
    if (fs.existsSync(this.testOutputDir)) {
      const entries = fs.readdirSync(this.testOutputDir);
      for (const entry of entries) {
        if (entry !== '.gitkeep') {
          const fullPath = path.join(this.testOutputDir, entry);
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
    
    let allPassed = true;
    
    // 1. 环境检查
    if (!(await this.runEnvironmentCheck())) {
      allPassed = false;
    }
    
    // 2. MCP协议测试
    if (!(await this.runMcpProtocolTest())) {
      allPassed = false;
    }
    
    // 3. 文档自动生成测试（可选，即使失败也不影响整体结果）
    await this.runDocumentAutoLandingTest();
    
    // 4. 通用测试框架验证
    await this.runUniversalFrameworkTest();
    
    // 生成总结报告
    const summary = this.generateSummaryReport();
    this.printSummary(summary);
    
    return allPassed;
  }
}

// 运行测试
if (require.main === module) {
  const tester = new UnifiedTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}
