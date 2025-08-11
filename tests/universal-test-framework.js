#!/usr/bin/env node

/**
 * 通用测试框架 - 支持多语言CMMI文档生成测试
 * 基于配置驱动的测试场景执行
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class UniversalTestFramework {
  constructor(config = {}) {
    this.testOutputDir = config.outputDir || './test-output';
    this.scenarios = [];
    this.results = {};
    this.config = config;
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

  /**
   * 加载测试场景配置
   */
  async loadScenarios(scenarioFile) {
    try {
      const scenarioPath = path.resolve(scenarioFile);
      if (!fs.existsSync(scenarioPath)) {
        throw new Error(`Scenario file not found: ${scenarioPath}`);
      }

      const content = fs.readFileSync(scenarioPath, 'utf8');
      const config = JSON.parse(content);
      
      this.scenarios = config.scenarios || [];
      this.log(`Loaded ${this.scenarios.length} test scenarios from ${scenarioFile}`, 'success');
      
      return this.scenarios;
    } catch (error) {
      this.log(`Failed to load scenarios: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 创建测试场景配置（如果不存在）
   */
  createDefaultScenarios() {
    const scenarioPath = './tests/test-scenarios.json';
    
    if (!fs.existsSync(scenarioPath)) {
      const defaultScenarios = {
        "scenarios": [
          {
            "id": "english-jwt-auth",
            "name": "JWT Authentication System (English)",
            "language": "en",
            "task_content": "Implement JWT token-based user authentication system with role management",
            "expected_files": ["requirements.md", "design.md", "tasks.md", "tests.md", "implementation.md"],
            "validation_rules": {
              "content_language": "en",
              "cmmi_headers": true,
              "file_structure": "standard",
              "min_content_length": 100
            }
          },
          {
            "id": "chinese-shopping-cart",
            "name": "电商购物车系统 (中文)",
            "language": "zh",
            "task_content": "开发基于Vue.js的电商购物车系统，支持商品管理、购物车操作和订单处理功能",
            "expected_files": ["requirements.md", "design.md", "tasks.md", "tests.md", "implementation.md"],
            "validation_rules": {
              "content_language": "zh",
              "cmmi_headers": true,
              "file_structure": "standard",
              "min_content_length": 100
            }
          },
          {
            "id": "mixed-task-management",
            "name": "Task Management System (Mixed)",
            "language": "auto",
            "task_content": "Create a task management system 任务管理系统 with user authentication and project collaboration",
            "expected_files": ["requirements.md", "design.md", "tasks.md", "tests.md", "implementation.md"],
            "validation_rules": {
              "content_language": "mixed",
              "cmmi_headers": true,
              "file_structure": "standard",
              "min_content_length": 100
            }
          }
        ]
      };

      // 确保目录存在
      const testsDir = path.dirname(scenarioPath);
      if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir, { recursive: true });
      }

      fs.writeFileSync(scenarioPath, JSON.stringify(defaultScenarios, null, 2));
      this.log(`Created default scenario file: ${scenarioPath}`, 'success');
    }

    return scenarioPath;
  }

  /**
   * 确保测试输出目录存在
   */
  async ensureTestOutputDir() {
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
      this.log(`Created test output directory: ${this.testOutputDir}`, 'success');
    }
  }

  /**
   * 执行MCP命令
   */
  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr
        });
      });
    });
  }

  /**
   * 语言检测
   */
  detectLanguage(text) {
    const chineseRegex = /[\u4e00-\u9fff]/;
    const englishRegex = /[a-zA-Z]/;
    
    const hasChinese = chineseRegex.test(text);
    const hasEnglish = englishRegex.test(text);
    
    if (hasChinese && hasEnglish) return 'mixed';
    if (hasChinese) return 'zh';
    if (hasEnglish) return 'en';
    return 'unknown';
  }

  /**
   * 验证文档内容
   */
  validateDocumentContent(filePath, rules) {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const validationResults = { valid: true, checks: {} };

    // 检查内容长度
    if (rules.min_content_length) {
      const isLongEnough = content.length >= rules.min_content_length;
      validationResults.checks.content_length = {
        passed: isLongEnough,
        actual: content.length,
        expected: rules.min_content_length
      };
      if (!isLongEnough) validationResults.valid = false;
    }

    // 检查CMMI标识
    if (rules.cmmi_headers) {
      const hasCmmiHeader = content.includes('<!-- CMMI:');
      validationResults.checks.cmmi_headers = {
        passed: hasCmmiHeader,
        found: hasCmmiHeader
      };
      if (!hasCmmiHeader) validationResults.valid = false;
    }

    // 检查语言
    if (rules.content_language && rules.content_language !== 'mixed') {
      const detectedLang = this.detectLanguage(content);
      const languageMatch = detectedLang === rules.content_language || 
                           (rules.content_language === 'auto' && detectedLang !== 'unknown');
      validationResults.checks.language = {
        passed: languageMatch,
        expected: rules.content_language,
        detected: detectedLang
      };
      if (!languageMatch) validationResults.valid = false;
    }

    return validationResults;
  }

  /**
   * 执行单个测试场景
   */
  async runScenario(scenario) {
    this.log(`Starting scenario: ${scenario.name}`, 'start');
    
    const scenarioStartTime = Date.now();
    const scenarioOutputDir = path.join(this.testOutputDir, `scenario-${scenario.id}`);
    
    // 确保场景输出目录存在
    if (!fs.existsSync(scenarioOutputDir)) {
      fs.mkdirSync(scenarioOutputDir, { recursive: true });
    }

    try {
      // 使用文档自动生成测试来执行工作流
      this.log(`Executing workflow for task: ${scenario.task_content.substring(0, 50)}...`);
      
      // 调用 test-document-auto-landing.mjs 并传递参数
      const testScript = path.join(__dirname, 'test-document-auto-landing.mjs');
      const result = await this.runCommand('node', [testScript], {
        env: {
          ...process.env,
          TEST_TASK_CONTENT: scenario.task_content,
          TEST_OUTPUT_DIR: scenarioOutputDir,
          TEST_LANGUAGE: scenario.language,
          TEST_SCENARIO_ID: scenario.id
        }
      });

      if (result.code !== 0) {
        throw new Error(`Workflow execution failed: ${result.stderr}`);
      }

      // 验证生成的文档
      const validationResults = {};
      let allValid = true;
      
      // 查找生成的项目目录 - 检查多个可能的位置
      const possibleLocations = [
        scenarioOutputDir,
        path.join(scenarioOutputDir, 'docs'),
        this.testOutputDir,
        path.join(this.testOutputDir, 'docs')
      ];

      let docsFound = false;
      
      for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
          // 查找markdown文件
          const markdownFiles = this.findMarkdownFiles(location);
          
          if (markdownFiles.length > 0) {
            this.log(`Found ${markdownFiles.length} documents in: ${location}`);
            docsFound = true;
            
            // 验证每个期望的文件
            for (const expectedFile of scenario.expected_files) {
              const matchingFiles = markdownFiles.filter(f => f.endsWith(expectedFile));
              
              if (matchingFiles.length > 0) {
                const filePath = matchingFiles[0];
                const validation = this.validateDocumentContent(filePath, scenario.validation_rules);
                
                validationResults[expectedFile] = validation;
                if (!validation.valid) {
                  allValid = false;
                  this.log(`Validation failed for ${expectedFile}: ${validation.error || 'Multiple issues'}`, 'error');
                } else {
                  this.log(`Validation passed for ${expectedFile}`, 'success');
                }
              } else {
                validationResults[expectedFile] = { valid: false, error: 'File not found' };
                allValid = false;
                this.log(`Expected file not found: ${expectedFile}`, 'error');
              }
            }
            break;
          }
        }
      }

      if (!docsFound) {
        this.log('No documents found in any expected location', 'error');
        allValid = false;
      }

      const executionTime = Date.now() - scenarioStartTime;
      
      const scenarioResult = {
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        language: scenario.language,
        task_content: scenario.task_content,
        execution_time: executionTime,
        status: allValid ? 'success' : 'failed',
        validation_results: validationResults,
        output_directory: scenarioOutputDir,
        timestamp: new Date().toISOString()
      };

      this.results[scenario.id] = scenarioResult;
      
      if (allValid) {
        this.log(`Scenario completed successfully: ${scenario.name}`, 'success');
      } else {
        this.log(`Scenario completed with validation errors: ${scenario.name}`, 'warning');
      }

      return scenarioResult;

    } catch (error) {
      const executionTime = Date.now() - scenarioStartTime;
      
      const scenarioResult = {
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        language: scenario.language,
        task_content: scenario.task_content,
        execution_time: executionTime,
        status: 'error',
        error: error.message,
        output_directory: scenarioOutputDir,
        timestamp: new Date().toISOString()
      };

      this.results[scenario.id] = scenarioResult;
      this.log(`Scenario failed: ${scenario.name} - ${error.message}`, 'error');
      
      return scenarioResult;
    }
  }

  /**
   * 查找Markdown文件
   */
  findMarkdownFiles(dir) {
    const files = [];
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...this.findMarkdownFiles(fullPath));
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    return files;
  }

  /**
   * 执行所有测试场景
   */
  async runAllScenarios() {
    this.log('Starting multi-language test execution', 'start');
    
    await this.ensureTestOutputDir();
    
    const startTime = Date.now();
    const results = [];

    for (const scenario of this.scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }

    const totalTime = Date.now() - startTime;
    
    // 生成统一报告
    const report = this.generateUnifiedReport(results, totalTime);
    this.printSummary(report);
    
    return report;
  }

  /**
   * 生成统一测试报告
   */
  generateUnifiedReport(results, totalTime) {
    const report = {
      timestamp: new Date().toISOString(),
      total_execution_time: totalTime,
      test_framework: 'Universal Multi-Language CMMI Test Framework',
      summary: {
        total_scenarios: results.length,
        successful_scenarios: results.filter(r => r.status === 'success').length,
        failed_scenarios: results.filter(r => r.status === 'failed').length,
        error_scenarios: results.filter(r => r.status === 'error').length,
        success_rate: results.length > 0 ? ((results.filter(r => r.status === 'success').length / results.length) * 100).toFixed(1) : 0
      },
      scenarios: results,
      language_breakdown: {
        english: results.filter(r => r.language === 'en').length,
        chinese: results.filter(r => r.language === 'zh').length,
        mixed: results.filter(r => r.language === 'mixed').length,
        auto: results.filter(r => r.language === 'auto').length
      }
    };

    // 保存报告
    const reportPath = path.join(this.testOutputDir, 'universal-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * 打印测试总结
   */
  printSummary(report) {
    console.log('\n============================================================');
    this.log('Universal Test Framework Execution Completed', 'start');
    console.log('============================================================');
    
    console.log(`📊 Total Scenarios: ${report.summary.total_scenarios}`);
    console.log(`✅ Successful: ${report.summary.successful_scenarios}`);
    console.log(`❌ Failed: ${report.summary.failed_scenarios}`);
    console.log(`🚫 Errors: ${report.summary.error_scenarios}`);
    console.log(`📈 Success Rate: ${report.summary.success_rate}%`);
    
    console.log('\n📋 Language Breakdown:');
    console.log(`  🇺🇸 English: ${report.language_breakdown.english}`);
    console.log(`  🇨🇳 Chinese: ${report.language_breakdown.chinese}`);
    console.log(`  🌐 Mixed: ${report.language_breakdown.mixed}`);
    console.log(`  🤖 Auto: ${report.language_breakdown.auto}`);
    
    console.log('\n📋 Scenario Results:');
    report.scenarios.forEach(scenario => {
      const status = scenario.status === 'success' ? '✅' : 
                    scenario.status === 'failed' ? '⚠️' : '❌';
      console.log(`  ${status} ${scenario.scenario_name} (${scenario.language})`);
    });
    
    console.log(`\n📄 Detailed Report: ${path.join(this.testOutputDir, 'universal-test-report.json')}`);
    console.log(`📁 Test Output: ${this.testOutputDir}/`);
  }
}

// 主执行函数
async function main() {
  try {
    const framework = new UniversalTestFramework();
    
    // 创建默认场景配置
    const scenarioFile = framework.createDefaultScenarios();
    
    // 加载测试场景
    await framework.loadScenarios(scenarioFile);
    
    // 执行所有测试场景
    const report = await framework.runAllScenarios();
    
    // 根据成功率设置退出码
    const exitCode = report.summary.success_rate === '100.0' ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Universal test framework failed:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = UniversalTestFramework;
