/**
 * Agent发现引擎测试
 * 验证增强的智能发现和分析功能
 */

import { AgentDiscoveryEngine } from './dist/core/agentDiscoveryEngine.js';
import * as path from 'path';

async function testAgentDiscoveryEngine() {
  console.log('🧪 开始测试Agent发现引擎...\n');
  
  try {
    // 测试项目路径
    const projectPath = process.cwd();
    console.log(`项目路径: ${projectPath}`);
    
    // 执行Agent发现分析
    console.log('📋 执行Agent发现分析...');
    const result = await AgentDiscoveryEngine.discoverAgents(projectPath);
    
    // 显示发现结果
    console.log('\n🔍 Agent发现结果:');
    console.log(`✅ 现有Agents: ${result.existing_agents.length}个`);
    
    result.existing_agents.forEach((agent, index) => {
      console.log(`  ${index + 1}. ${agent.name} (${agent.title})`);
      console.log(`     能力: ${agent.capabilities.join(', ')}`);
      console.log(`     文件: ${path.basename(agent.file_path)}`);
      
      if (agent.workflow) {
        console.log(`     工作流阶段: ${agent.workflow.phase}`);
        if (agent.workflow.outputs) {
          console.log(`     输出: ${agent.workflow.outputs.join(', ')}`);
        }
      }
      console.log('');
    });
    
    console.log(`❌ 缺失Agents: ${result.missing_agents.length}个`);
    if (result.missing_agents.length > 0) {
      console.log(`   ${result.missing_agents.join(', ')}`);
    }
    
    console.log(`\n💡 智能推荐: ${result.recommendations.length}个`);
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.agent_name} (优先级: ${rec.priority})`);
      console.log(`     原因: ${rec.reason}`);
      if (rec.dependencies.length > 0) {
        console.log(`     依赖: ${rec.dependencies.join(', ')}`);
      }
      console.log('');
    });
    
    // 分析工作流定义
    if (result.workflow_definition) {
      console.log('📋 工作流定义:');
      console.log(`   并行执行: ${result.workflow_definition.parallel_execution}`);
      console.log(`   阶段数: ${result.workflow_definition.phases.length}`);
      
      result.workflow_definition.phases.forEach((phase, index) => {
        console.log(`   阶段${phase.phase}: ${phase.agent}`);
        if (phase.inputs.length > 0) {
          console.log(`     输入: ${phase.inputs.join(', ')}`);
        }
        if (phase.outputs.length > 0) {
          console.log(`     输出: ${phase.outputs.join(', ')}`);
        }
      });
    }
    
    console.log('\n✅ Agent发现引擎测试完成！');
    
    // 测试性能
    console.log('\n⚡ 性能测试...');
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await AgentDiscoveryEngine.discoverAgents(projectPath);
    }
    
    const avgTime = (Date.now() - startTime) / 5;
    console.log(`平均执行时间: ${avgTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAgentDiscoveryEngine();
}
