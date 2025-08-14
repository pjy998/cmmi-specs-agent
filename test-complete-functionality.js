/**
 * CMMI Specs Agent 完整功能测试
 * 在demo02目录中测试所有核心功能
 */

import { WorkflowOrchestrator } from './dist/core/workflowOrchestrator.js';
import { AgentDiscoveryEngine } from './dist/core/agentDiscoveryEngine.js';
import * as fs from 'fs';
import * as path from 'path';

const DEMO_PATH = './test-demos/demo02';

async function runCompleteTest() {
  console.log('🚀 开始CMMI Specs Agent完整功能测试\n');
  console.log(`测试目录: ${DEMO_PATH}`);
  console.log('=' * 60);

  let allTestsPassed = true;
  const testResults = [];

  try {
    // 测试1: Agent发现引擎
    console.log('\n📋 测试1: Agent发现引擎功能');
    console.log('-'.repeat(40));
    
    const discoveryResult = await AgentDiscoveryEngine.discoverAgents(process.cwd());
    
    console.log(`✅ 发现现有agents: ${discoveryResult.existing_agents.length}个`);
    discoveryResult.existing_agents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name} - ${agent.title}`);
    });
    
    console.log(`📊 缺失agents: ${discoveryResult.missing_agents.length}个`);
    if (discoveryResult.missing_agents.length > 0) {
      discoveryResult.missing_agents.forEach((missing, index) => {
        console.log(`  ${index + 1}. ${missing}`);
      });
    }
    
    console.log(`💡 推荐建议: ${discoveryResult.recommendations.length}条`);
    discoveryResult.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.agent_name} (${rec.priority}) - ${rec.reason}`);
    });
    
    testResults.push({
      name: 'Agent发现引擎',
      passed: discoveryResult.existing_agents.length > 0,
      details: `发现${discoveryResult.existing_agents.length}个agents`
    });

    // 测试2: 工作流编排器
    console.log('\n📋 测试2: 工作流编排器功能');
    console.log('-'.repeat(40));
    
    const orchestrator = new WorkflowOrchestrator();
    const workflows = await orchestrator.discoverWorkflows(process.cwd());
    
    console.log(`✅ 发现工作流: ${workflows.length}个`);
    workflows.forEach((workflow, index) => {
      console.log(`  ${index + 1}. ${workflow.name}`);
      console.log(`     - ID: ${workflow.id}`);
      console.log(`     - 代理: ${workflow.agents.join(', ')}`);
      console.log(`     - 步骤数: ${workflow.steps.length}`);
    });
    
    testResults.push({
      name: '工作流编排器',
      passed: workflows.length > 0,
      details: `发现${workflows.length}个工作流`
    });

    // 测试3: 创建demo项目结构
    console.log('\n📋 测试3: 创建demo项目结构');
    console.log('-'.repeat(40));
    
    // 创建基础目录结构
    const demoDirectories = [
      'src',
      'src/components',
      'src/services',
      'docs',
      'tests'
    ];
    
    for (const dir of demoDirectories) {
      const dirPath = path.join(DEMO_PATH, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ 创建目录: ${dir}`);
      }
    }
    
    // 创建package.json
    const packageJson = {
      name: "demo02-user-management",
      version: "1.0.0",
      description: "用户管理系统演示项目",
      main: "src/index.js",
      scripts: {
        "start": "node src/index.js",
        "test": "jest",
        "build": "webpack"
      },
      dependencies: {
        "react": "^18.0.0",
        "typescript": "^5.0.0"
      }
    };
    
    fs.writeFileSync(
      path.join(DEMO_PATH, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ 创建package.json');
    
    testResults.push({
      name: '项目结构创建',
      passed: true,
      details: `创建${demoDirectories.length}个目录和配置文件`
    });

    // 测试4: 智能项目初始化
    console.log('\n📋 测试4: 智能项目初始化');
    console.log('-'.repeat(40));
    
    const initResult = await WorkflowOrchestrator.executeIntelligentProjectInitialization(
      DEMO_PATH,
      {
        projectName: 'demo02-user-management',
        projectType: 'web-app',
        techStack: ['typescript', 'react', 'node.js'],
        features: ['用户管理', '权限控制', 'API接口']
      }
    );
    
    console.log(`结果: ${initResult.success ? '成功' : '失败'}`);
    console.log(`消息: ${initResult.message}`);
    console.log(`执行的工作流: ${initResult.workflows_executed.join(', ')}`);
    console.log(`耗时: ${initResult.duration}ms`);
    
    testResults.push({
      name: '智能项目初始化',
      passed: initResult.success,
      details: `执行${initResult.workflows_executed.length}个工作流`
    });

    // 测试5: 工作流执行
    console.log('\n📋 测试5: 单个工作流执行测试');
    console.log('-'.repeat(40));
    
    if (workflows.length > 0) {
      // 尝试执行第一个工作流，但使用模拟模式
      const testWorkflow = workflows[0];
      console.log(`测试工作流: ${testWorkflow.name}`);
      
      const executionResult = await orchestrator.executeWorkflow(testWorkflow.id, {
        projectPath: DEMO_PATH,
        simulationMode: true,
        testMode: true
      });
      
      console.log(`执行结果: ${executionResult.success ? '成功' : '失败'}`);
      console.log(`执行步骤: ${executionResult.executedSteps.length}个`);
      console.log(`耗时: ${executionResult.duration}ms`);
      
      if (executionResult.errors && executionResult.errors.length > 0) {
        console.log(`错误信息:`);
        executionResult.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      testResults.push({
        name: '工作流执行',
        passed: executionResult.executedSteps.length > 0,
        details: `执行${executionResult.executedSteps.length}个步骤`
      });
    }

    // 测试6: 文件系统验证
    console.log('\n📋 测试6: demo项目文件验证');
    console.log('-'.repeat(40));
    
    const expectedFiles = [
      'README.md',
      'package.json'
    ];
    
    const expectedDirs = [
      'src',
      'docs',
      'tests'
    ];
    
    let filesOk = true;
    for (const file of expectedFiles) {
      const filePath = path.join(DEMO_PATH, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ 文件存在: ${file}`);
      } else {
        console.log(`❌ 文件缺失: ${file}`);
        filesOk = false;
      }
    }
    
    for (const dir of expectedDirs) {
      const dirPath = path.join(DEMO_PATH, dir);
      if (fs.existsSync(dirPath)) {
        console.log(`✅ 目录存在: ${dir}`);
      } else {
        console.log(`❌ 目录缺失: ${dir}`);
        filesOk = false;
      }
    }
    
    testResults.push({
      name: '文件系统验证',
      passed: filesOk,
      details: `验证${expectedFiles.length}个文件和${expectedDirs.length}个目录`
    });

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    allTestsPassed = false;
    testResults.push({
      name: '错误处理',
      passed: false,
      details: error.message
    });
  }

  // 汇总测试结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(test => test.passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${test.name}: ${test.details}`);
  });
  
  console.log(`\n总体结果: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！系统功能正常，可以提交代码。');
    return true;
  } else {
    console.log('⚠️  部分测试失败，需要修复后再提交。');
    return false;
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}
