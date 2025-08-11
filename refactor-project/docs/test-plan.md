# CMMI Specs Agent 项目重构测试计划文档

<!-- CMMI: VER -->

## 1. 测试概述

### 1.1 测试目标

基于需求文档和设计方案，制定全面的测试策略，确保重构后的系统满足功能、性能、可靠性和质量要求。

**主要测试目标**:
- 验证所有功能需求的正确实现
- 确保性能指标达到预期目标
- 保证系统稳定性和可靠性
- 验证代码质量和可维护性

**量化测试目标**:
- 代码覆盖率 >90%
- 单元测试通过率 100%
- 集成测试通过率 >95%
- 性能测试达标率 >95%
- 回归测试零失败

### 1.2 测试原则

**左移测试原则**: 在开发早期引入测试，TDD/BDD开发模式
**自动化优先**: 所有可重复测试实现自动化
**分层测试策略**: 单元→集成→系统→验收的完整测试金字塔
**持续测试**: 集成到CI/CD流水线，持续验证质量

## 2. 测试策略

### 2.1 测试分层策略

```
                    手工测试
                  ┌─────────────┐
                  │  验收测试   │ (5%)
                  └─────────────┘
                ┌───────────────────┐
                │   系统测试       │ (15%)
                └───────────────────┘
            ┌─────────────────────────────┐
            │      集成测试              │ (30%)
            └─────────────────────────────┘
        ┌───────────────────────────────────────┐
        │              单元测试                │ (50%)
        └───────────────────────────────────────┘
```

**测试金字塔说明**:
- **单元测试 (50%)**: 专注于单个组件功能验证
- **集成测试 (30%)**: 验证组件间交互和数据流
- **系统测试 (15%)**: 端到端功能和性能验证  
- **验收测试 (5%)**: 用户场景和业务流程验证

### 2.2 测试类型矩阵

| 测试类型 | 覆盖范围 | 自动化程度 | 执行频率 | 负责团队 |
|----------|----------|------------|----------|----------|
| 单元测试 | 类/方法级 | 100% | 每次提交 | 开发团队 |
| 集成测试 | 模块间 | 90% | 每日构建 | 开发团队 |
| 系统测试 | 端到端 | 80% | 每个迭代 | 测试团队 |
| 性能测试 | 系统级 | 95% | 每周执行 | 测试团队 |
| 安全测试 | 全系统 | 70% | 发布前 | 安全团队 |
| 兼容性测试 | 环境级 | 60% | 发布前 | 测试团队 |

## 3. 单元测试策略

### 3.1 单元测试框架选择

**技术栈**:
- **测试框架**: Jest 29.x
- **断言库**: Jest内置断言
- **模拟库**: Jest Mock + sinon.js
- **覆盖率工具**: Jest Coverage + nyc

### 3.2 单元测试设计原则

**FIRST原则**:
- **Fast**: 单个测试执行时间 <100ms
- **Independent**: 测试间无依赖关系
- **Repeatable**: 任何环境都能稳定执行
- **Self-Validating**: 明确的通过/失败结果
- **Timely**: 与代码同步编写

### 3.3 核心组件单元测试计划

#### 3.3.1 基础设施层测试 (T-1.x)

**ConfigManager 测试 (T-1.1)**:
```typescript
describe('ConfigManager', () => {
  let configManager: ConfigManager;
  
  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('load', () => {
    it('应该成功加载YAML配置文件', async () => {
      const configPath = './test-fixtures/config.yaml';
      await configManager.load(configPath);
      
      expect(configManager.get('server.port')).toBe(3000);
      expect(configManager.get('agents')).toHaveLength(6);
    });

    it('应该在配置文件不存在时抛出错误', async () => {
      await expect(configManager.load('./non-existent.yaml'))
        .rejects.toThrow('Config file not found');
    });

    it('应该验证配置格式', async () => {
      const invalidConfig = './test-fixtures/invalid-config.yaml';
      await expect(configManager.load(invalidConfig))
        .rejects.toThrow('Invalid configuration format');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await configManager.load('./test-fixtures/valid-config.yaml');
    });

    it('应该返回嵌套配置值', () => {
      expect(configManager.get('server.host')).toBe('localhost');
      expect(configManager.get('logging.level')).toBe('info');
    });

    it('应该在路径不存在时返回undefined', () => {
      expect(configManager.get('non.existent.path')).toBeUndefined();
    });
  });
});
```

**Logger 测试 (T-1.2)**:
```typescript
describe('Logger', () => {
  let logger: Logger;
  let mockTransport: jest.MockedObject<Transport>;

  beforeEach(() => {
    mockTransport = createMockTransport();
    logger = LoggerFactory.createLogger('test', [mockTransport]);
  });

  it('应该记录不同级别的日志', () => {
    logger.info('Info message', { key: 'value' });
    logger.error('Error message', new Error('Test error'));
    
    expect(mockTransport.log).toHaveBeenCalledTimes(2);
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        message: 'Info message',
        meta: { key: 'value' }
      })
    );
  });

  it('应该正确格式化错误日志', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);
    
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        error: expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String)
        })
      })
    );
  });
});
```

#### 3.3.2 核心层测试 (T-2.x)

**AgentEngine 测试 (T-2.1)**:
```typescript
describe('AgentEngine', () => {
  let agentEngine: AgentEngine;
  let mockAgent: Agent;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    agentEngine = new AgentEngine();
    mockAgent = createMockAgent();
    mockContext = createMockExecutionContext();
  });

  describe('execute', () => {
    it('应该成功执行代理任务', async () => {
      const expectedResult = { content: 'Generated content' };
      jest.spyOn(agentEngine as any, 'executeAgent')
          .mockResolvedValue(expectedResult);

      const result = await agentEngine.execute(mockAgent, mockContext);
      
      expect(result).toEqual(expectedResult);
      expect(mockAgent.state).toBe(AgentState.COMPLETED);
    });

    it('应该处理代理执行异常', async () => {
      const error = new Error('Execution failed');
      jest.spyOn(agentEngine as any, 'executeAgent')
          .mockRejectedValue(error);

      await expect(agentEngine.execute(mockAgent, mockContext))
        .rejects.toThrow('Execution failed');
      expect(mockAgent.state).toBe(AgentState.ERROR);
    });

    it('应该记录性能指标', async () => {
      const performanceSpy = jest.spyOn(PerformanceMonitor.prototype, 'startMonitoring');
      
      await agentEngine.execute(mockAgent, mockContext);
      
      expect(performanceSpy).toHaveBeenCalledWith(`agent.${mockAgent.name}`);
    });
  });
});
```

**DocumentGenerator 测试 (T-2.2)**:
```typescript
describe('DocumentGenerator', () => {
  let documentGenerator: DocumentGenerator;
  let mockTemplateEngine: jest.MockedObject<TemplateEngine>;

  beforeEach(() => {
    mockTemplateEngine = createMockTemplateEngine();
    documentGenerator = new DocumentGenerator(mockTemplateEngine);
  });

  describe('generate', () => {
    it('应该生成有效文档', async () => {
      const template = createMockTemplate();
      const data = { title: 'Test Document', content: 'Test content' };
      
      mockTemplateEngine.loadTemplate.mockResolvedValue(template);
      mockTemplateEngine.render.mockResolvedValue('Rendered content');

      const result = await documentGenerator.generate('test-template', data);
      
      expect(result.content).toBe('Rendered content');
      expect(mockTemplateEngine.loadTemplate).toHaveBeenCalledWith('test-template');
      expect(mockTemplateEngine.render).toHaveBeenCalledWith(template, data);
    });

    it('应该验证输入数据', async () => {
      const invalidData = { missing: 'required fields' };
      
      await expect(documentGenerator.generate('test-template', invalidData))
        .rejects.toThrow('Data validation failed');
    });
  });
});
```

### 3.4 单元测试覆盖率要求

**覆盖率目标**:
- **行覆盖率**: >90%
- **分支覆盖率**: >85%
- **函数覆盖率**: >95%
- **语句覆盖率**: >90%

**覆盖率排除**:
- 第三方库代码
- 测试文件本身
- 配置文件和常量定义
- 类型定义文件

## 4. 集成测试策略

### 4.1 集成测试范围

**垂直集成测试**: 测试完整的调用链路
**水平集成测试**: 测试同层组件间的交互
**API集成测试**: 测试外部接口集成

### 4.2 关键集成测试用例

#### 4.2.1 工作流执行集成测试 (T-3.1)
```typescript
describe('Workflow Integration', () => {
  let workflowOrchestrator: WorkflowOrchestrator;
  let agentCoordinator: AgentCoordinator;

  beforeEach(async () => {
    // 设置测试环境
    workflowOrchestrator = new WorkflowOrchestrator();
    agentCoordinator = new AgentCoordinator();
  });

  it('应该成功执行完整的多代理工作流', async () => {
    const workflowDefinition = {
      id: 'test-workflow',
      steps: [
        { agent: 'requirements-agent', dependencies: [] },
        { agent: 'design-agent', dependencies: ['requirements-agent'] },
        { agent: 'coding-agent', dependencies: ['design-agent'] }
      ]
    };

    const result = await workflowOrchestrator.executeWorkflow(workflowDefinition);
    
    expect(result.status).toBe('completed');
    expect(result.steps).toHaveLength(3);
    expect(result.output).toBeDefined();
  });

  it('应该处理工作流执行失败', async () => {
    const faultyWorkflow = {
      id: 'faulty-workflow',
      steps: [
        { agent: 'non-existent-agent', dependencies: [] }
      ]
    };

    await expect(workflowOrchestrator.executeWorkflow(faultyWorkflow))
      .rejects.toThrow('Agent not found');
  });
});
```

#### 4.2.2 文档生成流程测试 (T-3.2)
```typescript
describe('Document Generation Pipeline', () => {
  let documentGenerator: DocumentGenerator;
  let templateEngine: TemplateEngine;
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
    templateEngine = new TemplateEngine(cacheManager);
    documentGenerator = new DocumentGenerator(templateEngine);
  });

  it('应该完成端到端文档生成', async () => {
    const templateData = {
      templateId: 'requirements-template',
      data: {
        projectName: 'Test Project',
        requirements: [
          { id: 'FR-1', description: 'Test requirement' }
        ]
      }
    };

    const document = await documentGenerator.generate(
      templateData.templateId,
      templateData.data
    );

    expect(document).toBeDefined();
    expect(document.content).toContain('Test Project');
    expect(document.content).toContain('FR-1');
  });
});
```

### 4.3 MCP协议集成测试

```typescript
describe('MCP Protocol Integration', () => {
  let mcpServer: MCPServer;
  let mcpClient: MCPClient;

  beforeEach(async () => {
    mcpServer = await MCPServer.start();
    mcpClient = new MCPClient();
    await mcpClient.connect(mcpServer.getEndpoint());
  });

  afterEach(async () => {
    await mcpClient.disconnect();
    await mcpServer.stop();
  });

  it('应该正确处理工具调用请求', async () => {
    const toolCall = {
      name: 'workflow_execute',
      arguments: {
        task_content: 'Create a simple project structure'
      }
    };

    const response = await mcpClient.callTool(toolCall);
    
    expect(response.isError).toBeFalsy();
    expect(response.content).toBeDefined();
  });
});
```

## 5. 系统测试策略

### 5.1 功能测试

**端到端功能测试**: 验证完整业务流程
**用户场景测试**: 模拟真实用户操作
**边界条件测试**: 验证系统边界处理

### 5.2 性能测试

#### 5.2.1 性能测试指标

| 测试类型 | 测试指标 | 目标值 | 测试工具 |
|----------|----------|--------|----------|
| 响应时间测试 | 平均响应时间 | <2秒 | Artillery.js |
| 吞吐量测试 | 每秒处理请求数 | >10 RPS | k6 |
| 并发测试 | 最大并发用户数 | 50用户 | JMeter |
| 负载测试 | 系统稳定运行时间 | 24小时 | Gatling |
| 压力测试 | 系统崩溃点 | >100 RPS | Artillery.js |

#### 5.2.2 性能测试脚本示例

```javascript
// Artillery.js 性能测试脚本
module.exports = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      { duration: 60, arrivalRate: 5, name: 'Warm up' },
      { duration: 300, arrivalRate: 10, name: 'Ramp up load' },
      { duration: 600, arrivalRate: 10, name: 'Sustained load' }
    ]
  },
  scenarios: [
    {
      name: 'Workflow Execution Performance',
      weight: 100,
      flow: [
        {
          post: {
            url: '/api/workflow/execute',
            json: {
              task_content: 'Generate requirements document for web application',
              execution_mode: 'smart'
            }
          }
        }
      ]
    }
  ]
};
```

### 5.3 可靠性测试

#### 5.3.1 故障注入测试
```typescript
describe('Chaos Engineering Tests', () => {
  it('应该在单个代理失败时继续工作', async () => {
    // 模拟代理失败
    const chaosScenario = new ChaosScenario()
      .killAgent('design-agent')
      .after(30000); // 30秒后杀死代理

    const workflowResult = await executeWithChaos(
      testWorkflow,
      chaosScenario
    );

    expect(workflowResult.partialSuccess).toBeTruthy();
    expect(workflowResult.completedSteps.length).toBeGreaterThan(0);
  });

  it('应该在网络中断时优雅降级', async () => {
    const networkFailure = new ChaosScenario()
      .simulateNetworkPartition(5000); // 5秒网络中断

    const result = await executeWithChaos(testWorkflow, networkFailure);
    
    expect(result.status).toBe('degraded');
    expect(result.error).toContain('network timeout');
  });
});
```

## 6. 测试数据管理

### 6.1 测试数据策略

**测试数据分类**:
- **静态测试数据**: 预定义的配置和模板
- **动态测试数据**: 运行时生成的数据
- **边界测试数据**: 极限值和异常数据
- **性能测试数据**: 大量数据集

### 6.2 测试数据工厂

```typescript
class TestDataFactory {
  static createAgentConfig(overrides?: Partial<AgentConfig>): AgentConfig {
    return {
      name: 'test-agent',
      title: 'Test Agent',
      description: 'Agent for testing purposes',
      model: 'gpt-4.1',
      language: 'zh-CN',
      capabilities: ['test-capability'],
      dependencies: [],
      entrypoints: [],
      instructions: 'Test instructions',
      ...overrides
    };
  }

  static createWorkflowDefinition(stepCount: number = 3): WorkflowDefinition {
    const steps = Array.from({ length: stepCount }, (_, i) => ({
      id: `step-${i}`,
      agent: `test-agent-${i}`,
      dependencies: i > 0 ? [`step-${i-1}`] : []
    }));

    return {
      id: 'test-workflow',
      steps,
      executionMode: 'sequential',
      timeout: 300000
    };
  }
}
```

## 7. 测试环境管理

### 7.1 测试环境配置

**环境类型**:
- **开发环境**: 开发人员本地测试
- **集成环境**: 持续集成测试
- **测试环境**: 专门的测试环境
- **预生产环境**: 生产前验证

### 7.2 环境自动化部署

```yaml
# Docker Compose 测试环境
version: '3.8'
services:
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - LOG_LEVEL=debug
    volumes:
      - ./test-data:/app/test-data
    ports:
      - "3000:3000"
  
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test-runner
    depends_on:
      - mcp-server
    volumes:
      - ./tests:/app/tests
      - ./coverage:/app/coverage
    command: npm run test:integration
```

## 8. 测试自动化流水线

### 8.1 CI/CD集成

```yaml
# GitHub Actions 测试流水线
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run integration tests
        run: npm run test:integration

  performance-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Run performance tests
        run: npm run test:performance
```

### 8.2 测试报告生成

```typescript
// Jest 测试报告配置
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },
  reporters: [
    'default',
    ['jest-html-reporters', {
      pageTitle: 'CMMI Specs Agent Test Report',
      outputPath: './test-results/test-report.html',
      includeFailureMsg: true
    }]
  ]
};
```

## 9. 测试验收标准

### 9.1 功能验收标准

**单元测试**:
- [ ] 所有单元测试通过率 100%
- [ ] 代码覆盖率 >90%
- [ ] 无关键缺陷

**集成测试**:
- [ ] 集成测试通过率 >95%
- [ ] 主要工作流验证通过
- [ ] API契约测试通过

**系统测试**:
- [ ] 端到端测试通过率 >90%
- [ ] 性能指标达到目标值
- [ ] 可靠性测试通过

### 9.2 质量门禁设置

**代码质量门禁**:
- 代码覆盖率必须 >90%
- 不允许有严重级别缺陷
- 性能测试必须通过

**发布质量门禁**:
- 所有自动化测试通过
- 手工验证测试完成
- 性能基准回归测试通过

---

*文档版本: v1.0*  
*创建时间: 2025-08-12*  
*创建者: test-agent*  
*基于需求: requirements.md v1.0*  
*基于设计: design.md v1.1*  
*审核状态: 待审核*
