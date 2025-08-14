/**
 * 工作流编排器测试
 * 验证CMMI智能项目初始化功能
 */

import { WorkflowOrchestrator } from './dist/core/workflowOrchestrator.js';
import * as path from 'path';

async function testWorkflowOrchestrator() {
  console.log('🧪 开始测试工作流编排器...\n');
  
  try {
    // 创建编排器实例
    const orchestrator = new WorkflowOrchestrator();
    
    // 测试1: 发现现有的工作流
    console.log('📋 测试1: 发现项目工作流');
    const projectPath = process.cwd();
    console.log(`项目路径: ${projectPath}`);
    
    const workflows = await orchestrator.discoverWorkflows(projectPath);
    console.log(`✅ 发现 ${workflows.length} 个工作流:`);
    
    workflows.forEach((workflow, index) => {
      console.log(`  ${index + 1}. ${workflow.name} (${workflow.id})`);
      console.log(`     描述: ${workflow.description}`);
      console.log(`     代理: ${workflow.agents.join(', ')}`);
      console.log(`     步骤数: ${workflow.steps.length}`);
      
      workflow.steps.forEach((step, stepIndex) => {
        console.log(`       ${stepIndex + 1}. ${step.name} (${step.action})`);
      });
      console.log('');
    });
    
    // 测试2: 获取可用工作流列表
    console.log('📋 测试2: 获取可用工作流列表');
    const availableWorkflows = orchestrator.getAvailableWorkflows();
    console.log('可用工作流:');
    availableWorkflows.forEach((wf, index) => {
      console.log(`  ${index + 1}. ${wf.name}: ${wf.description}`);
    });
    console.log('');
    
    // 测试3: 执行工作流（如果有的话）
    if (workflows.length > 0) {
      console.log('📋 测试3: 执行第一个工作流');
      const testWorkflow = workflows[0];
      console.log(`执行工作流: ${testWorkflow.name}`);
      
      const executionResult = await orchestrator.executeWorkflow(testWorkflow.id, {
        projectPath: './test-project',
        projectType: 'test',
        testMode: true
      });
      
      console.log('执行结果:');
      console.log(`  成功: ${executionResult.success}`);
      console.log(`  执行步骤数: ${executionResult.executedSteps.length}`);
      console.log(`  耗时: ${executionResult.duration}ms`);
      
      if (executionResult.errors && executionResult.errors.length > 0) {
        console.log(`  错误: ${executionResult.errors.join(', ')}`);
      }
      
      console.log('  输出:', JSON.stringify(executionResult.outputs, null, 2));
    }
    
    // 测试4: 测试静态方法
    console.log('📋 测试4: 测试智能项目初始化');
    const initResult = await WorkflowOrchestrator.executeIntelligentProjectInitialization(
      './test-output',
      {
        projectName: 'test-project',
        projectType: 'web-app',
        techStack: ['typescript', 'react']
      }
    );
    
    console.log('智能初始化结果:');
    console.log(`  成功: ${initResult.success}`);
    console.log(`  消息: ${initResult.message}`);
    console.log(`  执行的工作流: ${initResult.workflows_executed.join(', ')}`);
    console.log(`  耗时: ${initResult.duration}ms`);
    
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testWorkflowOrchestrator();
}
