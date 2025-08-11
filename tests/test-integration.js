#!/usr/bin/env node

/**
 * 简单的通用测试框架集成测试
 * 验证基本功能是否正常工作
 */

const UniversalTestFramework = require('./universal-test-framework');
const path = require('path');
const fs = require('fs');

async function testBasicFunctionality() {
  console.log('🧪 Testing Universal Test Framework Basic Functionality\n');
  
  try {
    const framework = new UniversalTestFramework();
    
    // 创建一个简单的测试场景
    const testScenario = {
      "scenarios": [
        {
          "id": "simple-test",
          "name": "Simple System Test",
          "language": "auto",
          "task_content": "Create a simple user management system with basic CRUD operations",
          "expected_files": [
            "requirements.md",
            "design.md",
            "tasks.md"
          ],
          "validation_rules": {
            "min_content_length": 50,
            "required_sections": ["# "],
            "api_placeholder_check": false
          }
        }
      ]
    };
    
    const testDir = path.join(__dirname, 'simple-test-output');
    
    // 清理之前的测试输出
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // 写入测试配置
    const configPath = path.join(__dirname, 'simple-test-config.json');
    fs.writeFileSync(configPath, JSON.stringify(testScenario, null, 2));
    
    console.log('📝 Created simple test configuration');
    
    // 设置自定义输出目录
    framework.testOutputDir = testDir;
    
    // 加载测试场景
    await framework.loadScenarios(configPath);
    
    console.log(`✅ Loaded ${framework.scenarios.length} test scenario`);
    
    // 执行测试
    const report = await framework.runAllScenarios();
    
    console.log('\n📊 Test Results:');
    console.log(`Success Rate: ${report.summary.success_rate}`);
    
    if (report.summary.success_rate === '100.0') {
      console.log('✅ Basic functionality test PASSED!');
    } else {
      console.log('⚠️ Basic functionality test had issues');
      console.log('Generated documents:');
      
      // 列出生成的文件
      const scenarioDir = path.join(testDir, 'scenario-simple-test');
      if (fs.existsSync(scenarioDir)) {
        const files = fs.readdirSync(scenarioDir, { recursive: true });
        files.forEach(file => {
          console.log(`  📄 ${file}`);
        });
      }
    }
    
    // 清理
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    return report.summary.success_rate === '100.0';
    
  } catch (error) {
    console.error('❌ Basic functionality test FAILED:', error.message);
    return false;
  }
}

// 运行测试
testBasicFunctionality().then(success => {
  console.log('\n🏁 Integration test completed');
  process.exit(success ? 0 : 1);
});
