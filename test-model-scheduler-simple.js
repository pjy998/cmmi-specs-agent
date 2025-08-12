/**
 * Model Scheduler Test (CommonJS version)
 * 模型调度器测试文件
 */

const { ModelScheduler } = require('./mcp-server/dist/core/model-scheduler.js');

class ModelSchedulerTest {
  constructor() {
    this.scheduler = new ModelScheduler();
  }

  /**
   * 测试模型选择逻辑
   */
  testModelSelection() {
    console.log('\n=== 测试模型选择逻辑 ===');
    
    const testCases = [
      { role: 'requirements-agent', expected: 'gpt-4.1' },
      { role: 'design-agent', expected: 'claude-sonnet-4' },
      { role: 'coding-agent', expected: 'claude-sonnet-4' },
      { role: 'test-agent', expected: 'gpt-4.1' },
      { role: 'coding-agent', complexity: 'simple', expected: 'gpt-4.1' },
      { role: 'requirements-agent', complexity: 'complex', expected: 'claude-sonnet-4' }
    ];

    testCases.forEach((testCase, index) => {
      const result = this.scheduler.selectModel(testCase.role, testCase.complexity);
      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${testCase.role} (${testCase.complexity || 'default'}) -> ${result}`);
    });
  }

  /**
   * 测试复杂度分析
   */
  testComplexityAnalysis() {
    console.log('\n=== 测试复杂度分析 ===');
    
    const testTexts = [
      {
        name: '简单文本',
        content: '创建一个简单的用户类',
        expectedComplexity: 'simple'
      },
      {
        name: '中等复杂度文本',
        content: `实现一个用户认证系统，包含以下功能：
        1. 用户注册和登录
        2. JWT token管理
        3. 密码加密和验证
        4. 用户权限管理`,
        expectedComplexity: 'medium'
      },
      {
        name: '复杂技术文本',
        content: `设计并实现一个分布式微服务架构系统，包含以下组件：
        1. API Gateway with load balancing and rate limiting
        2. Service discovery and configuration management
        3. Database sharding and replication strategy
        4. Message queue with dead letter queue handling
        5. Monitoring and logging with distributed tracing
        6. CI/CD pipeline with automated testing and deployment
        7. Security implementation with OAuth2 and RBAC
        8. Cache layer with Redis cluster configuration`,
        expectedComplexity: 'complex'
      }
    ];

    testTexts.forEach((test, index) => {
      const analysis = this.scheduler.analyzeComplexity(test.content);
      const status = analysis.complexity === test.expectedComplexity ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${test.name}`);
      console.log(`   复杂度: ${analysis.complexity} (期望: ${test.expectedComplexity})`);
      console.log(`   推荐超时: ${analysis.recommendedTimeout}ms`);
      console.log(`   因素分析: 内容长度=${analysis.factors.contentLength}, 技术术语=${analysis.factors.technicalTermCount}`);
      console.log('');
    });
  }

  /**
   * 测试超时计算
   */
  testTimeoutCalculation() {
    console.log('\n=== 测试超时计算 ===');
    
    const testCases = [
      { role: 'requirements-agent', complexity: 'simple' },
      { role: 'design-agent', complexity: 'medium' },
      { role: 'coding-agent', complexity: 'complex' },
      { role: 'test-agent', complexity: 'simple' }
    ];

    testCases.forEach((testCase, index) => {
      const timeout = this.scheduler.calculateTimeout(testCase.role, testCase.complexity);
      console.log(`✅ Test ${index + 1}: ${testCase.role} (${testCase.complexity}) -> ${timeout}ms`);
    });
  }

  /**
   * 测试模型调用（模拟）
   */
  async testModelInvocation() {
    console.log('\n=== 测试模型调用 ===');
    
    const testPrompts = [
      {
        role: 'requirements-agent',
        prompt: '分析用户注册功能的需求',
        options: { domain: 'business' }
      },
      {
        role: 'coding-agent',
        prompt: '实现一个高性能的分布式缓存系统，需要支持数据分片、故障转移和一致性保证',
        options: { complexity: 'complex' }
      }
    ];

    for (let i = 0; i < testPrompts.length; i++) {
      const test = testPrompts[i];
      try {
        console.log(`\n📝 Test ${i + 1}: ${test.role}`);
        console.log(`输入: ${test.prompt.substring(0, 50)}...`);
        
        const startTime = Date.now();
        const response = await this.scheduler.invokeModel(test.role, test.prompt, test.options);
        const endTime = Date.now();
        
        console.log(`✅ 调用成功 (${endTime - startTime}ms)`);
        console.log(`使用模型: ${response.model}`);
        console.log(`复杂度: ${response.metadata?.complexity}`);
        console.log(`响应时间: ${response.metadata?.responseTime}ms`);
        console.log(`响应内容: ${response.content.substring(0, 100)}...`);
        
      } catch (error) {
        console.log(`❌ 调用失败: ${error}`);
      }
    }
  }

  /**
   * 测试性能统计
   */
  testPerformanceStats() {
    console.log('\n=== 测试性能统计 ===');
    
    const stats = this.scheduler.getPerformanceStats();
    console.log('✅ 性能统计获取成功');
    console.log(`默认超时: ${stats.defaultTimeout}ms`);
    console.log('代理模型映射:', stats.agentModelMappings);
    console.log('复杂度乘数:', stats.complexityMultipliers);
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始模型调度器测试\n');
    
    try {
      this.testModelSelection();
      this.testComplexityAnalysis();
      this.testTimeoutCalculation();
      await this.testModelInvocation();
      this.testPerformanceStats();
      
      console.log('\n✅ 所有测试完成');
    } catch (error) {
      console.log('\n❌ 测试过程中出现错误:', error);
    }
  }
}

// 运行测试
const test = new ModelSchedulerTest();
test.runAllTests().catch(console.error);
