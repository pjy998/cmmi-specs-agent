#!/usr/bin/env node

/**
 * 运行通用测试框架
 * 支持通过命令行参数指定测试场景
 */

const UniversalTestFramework = require('./universal-test-framework');
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    console.log('🚀 Starting Universal Test Framework...\n');
    
    const framework = new UniversalTestFramework();
    
    // 检查是否有自定义场景文件
    const customScenariosFile = process.argv[2] || path.join(__dirname, 'test-scenarios.json');
    
    if (!fs.existsSync(customScenariosFile)) {
      console.log('📋 Creating default test scenarios...');
      customScenariosFile = framework.createDefaultScenarios();
    }
    
    console.log(`📝 Loading scenarios from: ${customScenariosFile}`);
    
    // 加载测试场景
    await framework.loadScenarios(customScenariosFile);
    
    console.log(`🎯 Loaded ${framework.scenarios.length} test scenarios\n`);
    
    // 执行所有测试场景
    const report = await framework.runAllScenarios();
    
    console.log('\n🎉 Universal Test Framework completed!');
    console.log(`📊 Success Rate: ${report.summary.success_rate}`);
    console.log(`⏱️  Total Time: ${(report.summary.total_execution_time / 1000).toFixed(2)}s`);
    
    // 根据成功率设置退出码
    const successRate = parseFloat(report.summary.success_rate.replace('%', ''));
    const exitCode = successRate === 100 ? 0 : 1;
    
    if (exitCode === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check the detailed report for more information.');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Universal test framework failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
使用方法: node run-universal-tests.js [scenarios-file]

参数:
  scenarios-file    测试场景配置文件 (默认: test-scenarios.json)

选项:
  -h, --help        显示此帮助信息

示例:
  node run-universal-tests.js
  node run-universal-tests.js custom-scenarios.json

环境变量:
  TEST_OUTPUT_DIR   测试输出目录 (默认: universal-test-output)
  `);
  process.exit(0);
}

// 运行测试
main();
