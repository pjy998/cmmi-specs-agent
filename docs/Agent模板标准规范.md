# CMMI L3 标准Agent模板规范

## 1. Agent配置文件结构标准

### 1.1 基本字段（必需）
```yaml
version: 1                    # 配置版本
name: agent-name             # Agent唯一标识
title: Agent角色标题          # 显示标题
description: Agent角色描述    # 详细描述
model: gpt-4.1               # 使用的AI模型
color: purple                # UI显示颜色
language: zh-CN              # 主要语言
```

### 1.2 能力定义（必需）
```yaml
capabilities:
  - 核心能力1
  - 核心能力2
  - 联网搜索验证           # 标准能力
  - GitHub Copilot协作     # 标准能力
  - 技术栈验证            # 标准能力
  - 最佳实践查询          # 标准能力
```

### 1.3 依赖关系（可选）
```yaml
dependencies:
  - predecessor-agent      # 前置依赖
  - collaborator-agent     # 协作依赖
```

### 1.4 入口点定义（必需）
```yaml
entrypoints:
  - id: default
    description: 主要功能描述
    examples:
      - "示例任务描述1"
      - "示例任务描述2"
  - id: quick
    description: 快速模式功能
    examples:
      - "快速执行示例"
```

### 1.5 工作流程定义（新增核心字段）
```yaml
workflow:
  phase: 1                   # 在CMMI流程中的阶段
  parallel_execution: false  # 是否可并行执行
  inputs:                    # 输入要求
    - type: requirements
      description: 需求文档
      required: true
  outputs:                   # 输出产物
    - type: document
      name: requirements.md
      description: 需求规格说明书
  quality_gates:             # 质量门禁
    - criteria: 需求覆盖率 > 95%
      validation: 通过工具验证
  next_phases:               # 后续阶段
    - design-agent
    - tasks-agent
```

### 1.6 指导说明（必需）
```yaml
instructions: |
  # CMMI Level 3 [角色名称] 专业代理
  
  ## 🎯 角色定义
  [详细的角色定义和职责]
  
  ## 🔍 联网搜索与验证职责
  1. **技术验证**: 使用联网搜索验证相关技术信息
  2. **GitHub Copilot协作**: 利用Copilot提升工作质量
  
  ## 📋 核心职责
  [具体的工作职责]
  
  ## 🎯 执行原则
  [工作原则和质量标准]
```

## 2. 标准Agent角色定义

### 2.1 需求分析师 (requirements-agent)
- **阶段**: Phase 1 - 需求开发
- **核心职责**: 需求收集、分析、验证
- **输出**: requirements.md, 需求追溯矩阵
- **质量门禁**: 需求覆盖率 > 95%, 利益相关者确认

### 2.2 系统设计师 (design-agent)  
- **阶段**: Phase 2 - 技术解决方案
- **核心职责**: 架构设计、技术选型
- **输入**: requirements.md
- **输出**: design.md, 架构图, 接口规范
- **质量门禁**: 设计评审通过, 需求覆盖完整

### 2.3 开发实现专家 (coding-agent)
- **阶段**: Phase 3 - 产品集成
- **核心职责**: 代码实现、代码审查
- **输入**: design.md
- **输出**: 源代码、单元测试、API文档
- **质量门禁**: 代码覆盖率 > 80%, 代码审查通过

### 2.4 质量保证专家 (test-agent)
- **阶段**: Phase 4 - 验证与确认  
- **核心职责**: 测试规划、测试执行
- **输入**: 代码实现、需求文档
- **输出**: 测试计划、测试用例、测试报告
- **质量门禁**: 测试覆盖率 > 90%, 缺陷密度 < 1/KLOC

### 2.5 任务管理专家 (tasks-agent)
- **阶段**: 跨阶段 - 项目监控
- **核心职责**: 任务分解、进度跟踪、协调管理
- **输出**: tasks.md, 项目计划、风险登记册
- **质量门禁**: 任务完成率 > 95%, 时间偏差 < 10%

### 2.6 流程协调器 (spec-agent)
- **阶段**: 跨阶段 - 过程管理
- **核心职责**: 流程编排、质量保证、文档整合
- **输出**: spec-all.md, cmmi-checklist.md
- **质量门禁**: CMMI合规性检查通过

## 3. 工作流程编排规则

### 3.1 标准流程序列
```
requirements-agent → design-agent → coding-agent → test-agent
                                      ↓
    spec-agent (监控) ← tasks-agent (协调)
```

### 3.2 并行执行规则
- tasks-agent 可与其他agent并行运行
- spec-agent 在每个阶段完成后进行质量检查
- coding-agent 和 test-agent 可以迭代执行

### 3.3 质量门禁检查
每个阶段完成后必须通过定义的质量门禁才能进入下一阶段。
