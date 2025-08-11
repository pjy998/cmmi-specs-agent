# 文档自动落地功能使用指南

## 概述

文档自动落地功能是CMMI多代理系统的核心特性，能够根据任务描述自动生成完整的CMMI标准软件开发文档集。

## 功能特点

✅ **完整的CMMI文档生成**
- 需求文档 (Requirements Document - RD)
- 设计文档 (Technical Solution - TS)  
- 任务管理文档 (Product Integration - PI)
- 测试计划文档 (Verification - VER)
- 实现指南文档 (Technical Solution - TS)

✅ **CMMI标准合规**
- 自动注入CMMI过程域标识
- 符合CMMI成熟度模型要求
- 生成时间戳和可追溯性

✅ **智能目录结构**
- 自动创建项目目录
- 分离文档、源码、测试目录
- 特征驱动的组织结构

## 使用方法

### 1. 基本用法

```bash
# 运行完整测试验证功能
cd /path/to/cmmi-specs-agent
node tests/test-document-auto-landing.mjs
```

### 2. 直接使用MCP工具

```javascript
// 导入MCP工具处理器
import { AdvancedToolHandlers } from './mcp-server/dist/tools/advanced-handlers.js';

// 执行多代理工作流
const result = await AdvancedToolHandlers.executeMultiAgentWorkflow({
  task_content: "实现用户认证系统", 
  project_path: "./my-project",
  execution_mode: 'smart',
  context_sharing: true,
  max_iterations: 5
});
```

### 3. 配置代理

代理配置文件格式 (`agents/agent-name.yaml`):

```yaml
name: requirements-agent
role: Requirements Analyst
capabilities:
  - requirements-analysis
  - stakeholder-management
  - specification-writing
responsibilities: Analyze and document software requirements
model: gpt-4.1
systemPrompt: |
  You are a Requirements Analyst focused on analyzing and documenting software requirements.
  Generate professional documentation following CMMI standards.
tools:
  - file-operations
  - documentation
```

## 生成的文档结构

```
project-name/
├── docs/                     # 文档目录
│   ├── requirements.md       # 需求文档 (CMMI: RD)
│   ├── design.md            # 设计文档 (CMMI: TS)
│   ├── tasks.md             # 任务管理 (CMMI: PI)
│   ├── tests.md             # 测试计划 (CMMI: VER)
│   └── implementation.md    # 实现指南 (CMMI: TS)
├── src/                      # 源代码目录
└── tests/                    # 测试目录
```

## 文档内容示例

### 需求文档 (requirements.md)
```markdown
<!-- CMMI: RD -->
<!-- Generated: 2025-08-11T10:50:56.162Z -->

# Requirements Document: feature-name

## Overview
[任务描述和背景]

## Functional Requirements
### FR-1: Core Functionality
- Description: [功能描述]
- Priority: High
- Acceptance Criteria:
  - [ ] 验收标准1
  - [ ] 验收标准2
```

### 设计文档 (design.md)
```markdown
<!-- CMMI: TS -->
<!-- Generated: 2025-08-11T10:50:56.163Z -->

# Design Document: feature-name

## Architecture Overview
### System Context
- Purpose: [设计目的]
- Scope: [功能范围]
- Stakeholders: [利益相关者]

## High-Level Design
### Component Architecture
[架构设计详细描述]
```

## 高级功能

### 1. 智能代理选择
系统会根据任务内容自动选择适当的代理组合，确保生成完整的文档集。

### 2. 上下文共享
代理之间可以共享上下文信息，确保文档之间的一致性和连贯性。

### 3. 迭代优化
支持多轮迭代优化，逐步完善文档质量。

## 测试验证

### 运行测试套件
```bash
# 运行完整的端到端测试
node tests/test-document-auto-landing.mjs

# 测试包括：
# ✅ MCP服务器状态检查
# ✅ 文件操作功能验证
# ✅ CMMI目录结构创建
# ✅ 工作流执行和文档生成
# ✅ 生成文档的CMMI合规性检查
```

### 预期输出
```
🎉 All tests passed! Document auto-landing feature is working correctly.

Generated 5/5 documents:
✅ requirements.md (CMMI: RD)
✅ design.md (CMMI: TS)  
✅ tasks.md (CMMI: PI)
✅ tests.md (CMMI: VER)
✅ implementation.md (CMMI: TS)
```

## 故障排除

### 常见问题

1. **代理配置缺失**
   ```
   Error: No valid agent configurations found
   ```
   **解决方案**: 确保在项目目录下创建 `agents/` 文件夹并放置代理配置文件

2. **权限错误**
   ```
   Error: EACCES permission denied
   ```
   **解决方案**: 检查项目目录的写入权限

3. **TypeScript编译错误**
   ```
   Error: Cannot find module
   ```
   **解决方案**: 运行 `cd mcp-server && npm run build` 重新编译

### 调试技巧

1. **启用详细日志**
   - 检查 `mcp-server/logs/` 目录下的日志文件
   - 增加logger.debug输出

2. **检查生成的文件**
   - 测试会在 `test-backup/` 目录保留生成的文件
   - 可以手动检查文档内容和结构

## 扩展开发

### 添加新的代理类型
1. 在 `mcp-server/src/tools/advanced-handlers.ts` 中添加新的case
2. 在 `mcp-server/src/utils/file-operations.ts` 中添加对应的文档模板
3. 创建相应的代理配置文件

### 自定义文档模板
可以在 `DocumentTemplates` 类中修改或添加新的文档模板，支持自定义CMMI标签和内容结构。

## 总结

文档自动落地功能提供了从任务描述到完整CMMI文档集的端到端自动化解决方案，大大提高了软件开发文档的生成效率和质量标准化程度。通过智能多代理协作，确保了文档的完整性、一致性和CMMI合规性。
