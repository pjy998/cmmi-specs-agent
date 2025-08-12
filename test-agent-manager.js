/**
 * CMMI Agent Manager Test
 * CMMI代理管理系统测试文件
 */

import { CMMIAgentManager } from './mcp-server/dist/core/agent-manager.js';
import { ModelScheduler } from './mcp-server/dist/core/model-scheduler.js';

class AgentManagerTest {
  constructor() {
    this.modelScheduler = new ModelScheduler();
    this.agentManager = new CMMIAgentManager(this.modelScheduler);
  }

  /**
   * 测试代理创建功能
   */
  async testAgentCreation() {
    console.log('\n=== 测试代理创建功能 ===');
    
    const roles = [
      'requirements-agent',
      'design-agent', 
      'coding-agent',
      'test-agent',
      'tasks-agent',
      'spec-agent'
    ];

    const createdAgents = [];

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      try {
        const agent = await this.agentManager.createAgent(role);
        createdAgents.push(agent);
        
        console.log(`✅ ${role} 创建成功`);
        console.log(`   代理ID: ${agent.id}`);
        console.log(`   状态: ${agent.status}`);
        console.log(`   首选模型: ${agent.preferredModel}`);
        console.log(`   能力: ${agent.capabilities.join(', ')}`);
        console.log(`   最大并发任务: ${agent.maxConcurrentTasks}`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${role} 创建失败: ${error}`);
      }
    }

    console.log(`总计创建代理数量: ${createdAgents.length}`);
    return createdAgents;
  }

  /**
   * 测试集群状态
   */
  testClusterStatus() {
    console.log('\n=== 测试集群状态 ===');
    
    const clusterStatus = this.agentManager.getClusterStatus();
    
    for (const [role, cluster] of Object.entries(clusterStatus)) {
      console.log(`📊 ${role} 集群状态:`);
      console.log(`   实例数量: ${cluster.instances.length}`);
      console.log(`   总容量: ${cluster.totalCapacity}`);
      console.log(`   当前负载: ${cluster.currentLoad}`);
      console.log(`   平均性能: ${cluster.averagePerformance.toFixed(2)}`);
      console.log(`   集群状态: ${cluster.status}`);
      console.log('');
    }
  }

  /**
   * 测试任务路由功能
   */
  async testTaskRouting() {
    console.log('\n=== 测试任务路由功能 ===');
    
    const testTasks = [
      {
        id: 'task-1',
        type: 'requirement-analysis',
        content: '分析用户注册功能需求',
        priority: 'high',
        requiredCapabilities: ['requirement-analysis'],
        estimatedDuration: 300000
      },
      {
        id: 'task-2',
        type: 'system-design',
        content: '设计用户认证系统架构',
        priority: 'medium',
        requiredCapabilities: ['system-design'],
        estimatedDuration: 600000
      },
      {
        id: 'task-3',
        type: 'code-generation',
        content: '生成用户注册接口代码',
        priority: 'low',
        requiredCapabilities: ['code-generation'],
        estimatedDuration: 450000
      },
      {
        id: 'task-4',
        type: 'test-planning',
        content: '制定测试计划',
        priority: 'critical',
        requiredCapabilities: ['test-planning'],
        estimatedDuration: 400000
      }
    ];

    for (let i = 0; i < testTasks.length; i++) {
      const task = testTasks[i];
      try {
        console.log(`\n🎯 任务路由 - ${task.id}`);
        console.log(`任务类型: ${task.type}`);
        console.log(`优先级: ${task.priority}`);
        console.log(`所需能力: ${task.requiredCapabilities.join(', ')}`);
        
        const routingResult = await this.agentManager.routeTask(task);
        
        console.log(`✅ 路由成功`);
        console.log(`   选中代理: ${routingResult.selectedAgent.id} (${routingResult.selectedAgent.role})`);
        console.log(`   路由原因: ${routingResult.routingReason}`);
        console.log(`   预估等待时间: ${routingResult.estimatedWaitTime}ms`);
        console.log(`   备选代理数量: ${routingResult.alternativeAgents.length}`);
        console.log(`   负载均衡指标:`);
        console.log(`     - 总代理数: ${routingResult.loadBalanceMetrics.totalAgents}`);
        console.log(`     - 可用代理数: ${routingResult.loadBalanceMetrics.availableAgents}`);
        console.log(`     - 平均负载: ${routingResult.loadBalanceMetrics.averageLoad}`);
        
        // 分配任务
        const assignment = await this.agentManager.assignTask(routingResult.selectedAgent, task);
        console.log(`   任务已分配: ${assignment.taskId} -> ${assignment.agentId}`);
        
      } catch (error) {
        console.log(`❌ 任务路由失败: ${error}`);
      }
    }
  }

  /**
   * 测试任务完成功能
   */
  async testTaskCompletion() {
    console.log('\n=== 测试任务完成功能 ===');
    
    // 模拟完成一些任务
    const taskIds = ['task-1', 'task-2', 'task-3'];
    
    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      try {
        if (i === 2) {
          // 模拟任务失败
          await this.agentManager.failTask(taskId, 'Simulated task failure for testing');
          console.log(`❌ 任务 ${taskId} 模拟失败`);
        } else {
          // 模拟任务成功
          const result = {
            status: 'completed',
            output: `Task ${taskId} completed successfully`,
            timestamp: new Date()
          };
          
          await this.agentManager.completeTask(taskId, result);
          console.log(`✅ 任务 ${taskId} 完成成功`);
        }
      } catch (error) {
        console.log(`❌ 任务 ${taskId} 处理失败: ${error}`);
      }
    }
  }

  /**
   * 测试代理性能监控
   */
  testPerformanceMonitoring() {
    console.log('\n=== 测试代理性能监控 ===');
    
    const agents = this.agentManager.getAllAgents();
    
    console.log(`📈 代理性能概览 (共 ${agents.length} 个代理):`);
    
    agents.forEach((agent, index) => {
      const perf = agent.performance;
      console.log(`\n${index + 1}. 代理 ${agent.id.split('-').slice(-1)[0]} (${agent.role}):`);
      console.log(`   状态: ${agent.status}`);
      console.log(`   当前任务数: ${agent.currentTasks}/${agent.maxConcurrentTasks}`);
      console.log(`   总任务数: ${perf.totalTasks}`);
      console.log(`   完成任务数: ${perf.completedTasks}`);
      console.log(`   失败任务数: ${perf.failedTasks}`);
      console.log(`   成功率: ${(perf.successRate * 100).toFixed(1)}%`);
      console.log(`   平均响应时间: ${perf.averageResponseTime}ms`);
      console.log(`   性能评分: ${perf.performanceScore.toFixed(2)}`);
      console.log(`   可靠性: ${perf.reliability.toFixed(2)}`);
    });
  }

  /**
   * 测试系统监控指标
   */
  testSystemMetrics() {
    console.log('\n=== 测试系统监控指标 ===');
    
    const metrics = this.agentManager.getMonitoringMetrics();
    
    console.log(`🔍 系统监控指标 (${metrics.timestamp.toISOString()}):`);
    
    console.log('\n📊 任务指标:');
    console.log(`   总任务数: ${metrics.taskMetrics.totalTasks}`);
    console.log(`   运行中任务: ${metrics.taskMetrics.runningTasks}`);
    console.log(`   已完成任务: ${metrics.taskMetrics.completedTasks}`);
    console.log(`   失败任务: ${metrics.taskMetrics.failedTasks}`);
    console.log(`   平均任务持续时间: ${metrics.taskMetrics.averageTaskDuration}ms`);
    console.log(`   任务吞吐量: ${metrics.taskMetrics.taskThroughput.toFixed(2)} tasks/hour`);
    
    console.log('\n💻 系统指标:');
    console.log(`   CPU使用率: ${metrics.systemMetrics.cpuUsage.toFixed(1)}%`);
    console.log(`   内存使用率: ${metrics.systemMetrics.memoryUsage.toFixed(1)}%`);
    console.log(`   磁盘使用率: ${metrics.systemMetrics.diskUsage.toFixed(1)}%`);
    console.log(`   网络延迟: ${metrics.systemMetrics.networkLatency.toFixed(1)}ms`);
    console.log(`   系统运行时间: ${Math.floor(metrics.systemMetrics.uptime / 1000)}s`);
    
    console.log('\n📈 资源利用率:');
    console.log(`   CPU: ${metrics.resourceUtilization.cpuUsage.toFixed(1)}%`);
    console.log(`   内存: ${metrics.resourceUtilization.memoryUsage.toFixed(1)}%`);
    console.log(`   网络: ${metrics.resourceUtilization.networkUsage.toFixed(1)}%`);
    console.log(`   存储: ${metrics.resourceUtilization.storageUsage.toFixed(1)}%`);
    
    console.log(`\n🤖 代理性能指标: ${Object.keys(metrics.agentMetrics).length} 个代理`);
  }

  /**
   * 测试健康检查
   */
  async testHealthCheck() {
    console.log('\n=== 测试健康检查 ===');
    
    console.log('⏳ 等待健康检查执行...');
    
    // 等待一个健康检查周期
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const agents = this.agentManager.getAllAgents();
    const clusterStatus = this.agentManager.getClusterStatus();
    
    console.log('🏥 健康检查结果:');
    
    // 显示代理健康状态
    agents.forEach(agent => {
      const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
      console.log(`   ${agent.id.split('-').slice(-1)[0]} (${agent.role}): ${agent.status} - ${timeSinceHeartbeat}ms ago`);
    });
    
    // 显示集群健康状态
    console.log('\n🏗️ 集群健康状态:');
    for (const [role, cluster] of Object.entries(clusterStatus)) {
      console.log(`   ${role}: ${cluster.status} (${cluster.instances.length} 实例)`);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🤖 开始CMMI代理管理系统测试\n');
    
    try {
      // 1. 创建代理
      await this.testAgentCreation();
      
      // 2. 检查集群状态
      this.testClusterStatus();
      
      // 3. 测试任务路由
      await this.testTaskRouting();
      
      // 4. 测试任务完成
      await this.testTaskCompletion();
      
      // 5. 测试性能监控
      this.testPerformanceMonitoring();
      
      // 6. 测试系统指标
      this.testSystemMetrics();
      
      // 7. 测试健康检查
      await this.testHealthCheck();
      
      // 8. 清理资源
      await this.agentManager.shutdown();
      
      console.log('\n✅ 所有测试完成');
    } catch (error) {
      console.log('\n❌ 测试过程中出现错误:', error);
    }
  }
}

// 运行测试
const test = new AgentManagerTest();
test.runAllTests().catch(console.error);
