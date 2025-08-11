# 通用测试框架设计文档

## 概述

将现有的测试套件重构为通用的多语言测试框架，支持通过传入不同的任务内容和语言参数来生成不同语言的CMMI文档，确保测试一致性并避免代码重复。

## 现状分析

### 当前问题
1. **代码重复**：`test-chinese-language.js` 与主测试套件有大量重复代码
2. **测试不一致**：中文测试使用低级MCP协议通信，而主测试使用高级封装
3. **维护困难**：多个独立的测试文件，修改时需要同步更新
4. **目录混乱**：中文测试创建独立目录结构，与主测试输出不统一

### 现有架构
```
tests/
├── run-all-tests.js           # 主测试套件
├── test-chinese-language.js   # 独立中文测试
├── mcp-client-test.js         # MCP协议测试
├── test-document-auto-landing.mjs  # 文档生成测试
└── validate-tools.js          # 工具验证（已废弃）
```

## 设计目标

### 功能目标
1. **统一测试入口**：一个通用的测试框架处理所有语言测试
2. **参数化测试**：通过配置文件或参数指定不同的测试场景
3. **一致性保证**：所有语言测试使用相同的底层机制
4. **可扩展性**：易于添加新的语言或测试场景

### 技术目标
1. **代码复用**：最大化共享测试逻辑
2. **配置驱动**：测试场景通过配置定义
3. **结果统一**：所有测试结果统一格式和存储位置
4. **报告整合**：生成包含所有语言测试的综合报告

## 架构设计

### 新架构
```
tests/
├── universal-test-framework.js  # 通用测试框架核心
├── test-scenarios.json         # 测试场景配置文件
├── legacy/                     # 遗留测试文件
│   ├── run-all-tests.js
│   ├── test-chinese-language.js
│   └── ...
├── scenarios/                  # 测试场景定义
│   ├── english-scenarios.json
│   ├── chinese-scenarios.json
│   └── mixed-scenarios.json
└── utils/                     # 测试工具函数
    ├── test-runner.js
    ├── report-generator.js
    └── file-validator.js
```

### 核心组件

#### 1. UniversalTestFramework 类
```javascript
class UniversalTestFramework {
  constructor(config) {
    this.config = config;
    this.testOutputDir = config.outputDir || './test-output';
    this.scenarios = [];
    this.results = {};
  }

  async loadScenarios(scenarioFile) {
    // 加载测试场景配置
  }

  async runScenario(scenario) {
    // 执行单个测试场景
  }

  async runAllScenarios() {
    // 执行所有测试场景
  }

  generateUnifiedReport() {
    // 生成统一的测试报告
  }
}
```

#### 2. 测试场景配置格式
```json
{
  "scenarios": [
    {
      "id": "english-jwt-auth",
      "name": "JWT Authentication System (English)",
      "language": "en",
      "task_content": "Implement JWT token-based user authentication system",
      "expected_files": ["requirements.md", "design.md", "tasks.md", "tests.md", "implementation.md"],
      "validation_rules": {
        "content_language": "en",
        "cmmi_headers": true,
        "file_structure": "standard"
      }
    },
    {
      "id": "chinese-shopping-cart",
      "name": "购物车系统 (中文)",
      "language": "zh",
      "task_content": "开发基于Vue.js的电商购物车系统，支持商品管理和订单处理",
      "expected_files": ["requirements.md", "design.md", "tasks.md", "tests.md", "implementation.md"],
      "validation_rules": {
        "content_language": "zh",
        "cmmi_headers": true,
        "file_structure": "standard"
      }
    }
  ]
}
```

## 实现计划

### Phase 1: 核心框架开发
1. **创建 UniversalTestFramework 类**
   - 基于现有 `run-all-tests.js` 重构
   - 抽象出通用的测试执行逻辑
   - 添加参数化支持

2. **设计测试场景配置**
   - 定义JSON Schema用于验证配置
   - 创建基础的英文和中文测试场景
   - 支持自定义验证规则

3. **实现测试执行器**
   - 复用现有的MCP客户端测试逻辑
   - 添加语言检测和验证
   - 统一输出目录结构

### Phase 2: 验证和报告
1. **文档内容验证器**
   - 语言检测算法
   - CMMI标识验证
   - 文件结构检查

2. **统一报告生成器**
   - 多语言测试结果汇总
   - 对比分析功能
   - HTML/JSON多格式输出

3. **测试场景管理**
   - 场景导入/导出功能
   - 批量执行控制
   - 失败重试机制

### Phase 3: 集成和优化
1. **向后兼容**
   - 保持现有测试脚本接口
   - 渐进式迁移策略
   - 遗留测试标记

2. **性能优化**
   - 并行测试执行
   - 增量测试支持
   - 缓存机制

3. **扩展性增强**
   - 插件化验证器
   - 自定义报告模板
   - 第三方集成接口

## 预期收益

### 开发效率
- **减少70%的重复代码**：统一测试逻辑
- **降低维护成本**：单一维护点
- **提高测试覆盖率**：系统化测试场景

### 质量保证
- **一致的测试标准**：所有语言使用相同验证逻辑
- **全面的验证机制**：语言、格式、结构多维度检查
- **可靠的回归测试**：自动化场景执行

### 可扩展性
- **快速添加新语言**：通过配置文件即可支持
- **灵活的测试定制**：场景驱动的测试设计
- **易于集成CI/CD**：标准化的接口和报告

## 风险评估

### 技术风险
- **迁移复杂性**：现有测试逻辑重构风险 - 通过渐进式迁移降低
- **性能影响**：多场景执行可能增加测试时间 - 通过并行化优化
- **配置复杂性**：场景配置可能过于复杂 - 提供模板和文档

### 业务风险
- **向后兼容性**：可能影响现有工作流 - 保持接口兼容
- **学习成本**：新框架需要学习时间 - 提供详细文档和示例

## 成功标准

### 功能标准
- [ ] 支持英文和中文文档生成测试
- [ ] 测试结果100%一致性
- [ ] 配置驱动的场景执行
- [ ] 统一的测试报告格式

### 性能标准
- [ ] 测试执行时间不超过当前的150%
- [ ] 内存使用优化
- [ ] 支持并行测试执行

### 质量标准
- [ ] 代码重复率降低到30%以下
- [ ] 测试覆盖率达到95%以上
- [ ] 文档完整性100%

---

*文档版本: v1.0*  
*创建日期: 2025-08-11*  
*负责人: 系统架构师*
