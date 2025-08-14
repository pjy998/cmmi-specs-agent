# 🎯 CMMI MCP工具唤醒词指南

## 🔑 核心唤醒词系统

我们为每个MCP工具添加了简单易记的唤醒词，用方括号标注在工具描述前面，让VS Code Copilot Chat更容易识别和调用。

## 📋 唤醒词速查表

| 工具功能 | 英文工具名 | 中文工具名 | 其他唤醒词 | 超简单测试 |
|---------|-----------|-----------|-----------|------------|
| **代理管理** | `agent_manage` | `代理管理` | `CMMI代理` `创建代理` | "agent_manage 创建前端开发者" |
| **任务分析** | `task_analyze` | `任务分析` | `CMMI分析` `复杂度评估` | "task_analyze 这个项目" |
| **工作流执行** | `workflow_execute` | `工作流执行` | `CMMI工作流` `执行流程` | "workflow_execute 开发流程" |
| **智能翻译** | `intelligent_translate` | `智能翻译` | `CMMI翻译` `文档转换` | "intelligent_translate 文档" |
| **项目配置** | `config_validate` | `配置验证` | `CMMI配置` `项目初始化` | "config_validate 新项目" |
| **质量分析** | `quality_analyze` | `质量分析` | `CMMI质量` `代码审查` | "quality_analyze 代码" |
| **模型调度** | `model_schedule` | `模型调度` | `CMMI调度` `AI资源` | "model_schedule AI资源" |
| **系统诊断** | `system_diagnosis` | `系统诊断` | `CMMI诊断` `系统检查` | "system_diagnosis 状态" |

## 🚀 超简单使用方法

### 方法1：直接使用工具名（最直接）

**英文工具名**:
```
agent_manage 创建一个测试工程师
task_analyze 评估这个电商项目的技术难度
quality_analyze 检查当前代码质量
config_validate 初始化Vue项目
```

**中文工具名**:
```
代理管理，帮我创建一个全栈开发者
任务分析，这个用户管理系统的复杂度
质量分析，审查代码规范
配置验证，设置新项目结构
```

### 方法2：唤醒词 + 自然语言
```
请用agent_manage来建立开发团队
我需要task_analyze来评估项目复杂度  
能否用quality_analyze工具审查代码？
使用workflow_execute来管理开发过程
```

### 方法3：混合中英文
```
agent_manage 代理管理 - 创建前端专家
task_analyze 任务分析 - 用户管理系统
quality_analyze 质量分析 - 当前项目代码
config_validate 配置验证 - React应用
```

## 🎯 实战测试用例

### 快速测试（推荐）

**最直接的测试方式**:
```
agent_manage 创建一个全栈开发者
task_analyze 评估这个API项目
quality_analyze 审查代码规范
config_validate 设置新项目
```

### 功能测试

**完整功能测试**:
```
workflow_execute 协调团队开发
intelligent_translate 转换英文文档
model_schedule 优化AI资源使用
system_diagnosis 检查系统健康
```

## 🔧 使用技巧

1. **唤醒词放在句首**：让AI更容易识别
2. **简短明确**：避免过长的描述
3. **组合使用**：可以混合中英文唤醒词
4. **重试机制**：如果没触发，尝试不同的唤醒词

## ⚡ 更新和测试

重新构建并发布后，这些唤醒词将立即生效：

```bash
npm run build
npm version patch  
npm publish
```

然后在VS Code中重新加载窗口，使用上述唤醒词测试！
