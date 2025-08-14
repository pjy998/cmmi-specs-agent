# 🎉 CMMI MCP 工具完整使用指南 v0.1.7

## ✅ 最新功能

### 🆕 v0.1.7 新增功能
- **版本信息显示**: 启动时自动显示当前版本
- **增强调试日志**: 支持 `DEBUG_MCP=true` 和 `LOG_LEVEL=debug`
- **执行时间追踪**: 显示每个工具的执行耗时
- **详细错误日志**: 更详细的错误信息和调试数据

## 🔧 VS Code 配置更新

更新你的 `~/Library/Application Support/Code/User/mcp.json`：

### 生产环境配置（推荐）
```json
{
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["-y", "cmmi-specs-mcp@0.1.7", "start"],
      "type": "stdio",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 调试环境配置
```json
{
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["-y", "cmmi-specs-mcp@0.1.7", "start"],
      "type": "stdio",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug",
        "DEBUG_MCP": "true"
      }
    }
  }
}
```

## 🚀 快速开始

### 1. 更新配置
更新 VS Code MCP 配置文件到 v0.1.7

### 2. 重新加载 VS Code
- 按 `Cmd+Shift+P`
- 输入 "Developer: Reload Window"
- 回车重新加载

### 3. 查看启动信息
在 VS Code 输出面板中查看：
```
🚀 CMMI Specs MCP Server v0.1.7
📅 Started at: 2025-08-14T02:46:19.850Z
🛠️  Tools available: 8
🐛 Debug mode: OFF
📋 Environment: production
============================================================
✅ CMMI Specs MCP Server v0.1.7 connected and ready!
```

## 🎯 超简单测试用例

### ✅ 工具调用成功！
如果你看到类似这样的回复：
```
CMMI agent initialization has been completed, but no agents were created. 
If you need to create specific agents or encounter issues, please specify 
the agent type or provide more details about your requirements.
```
**这表明MCP工具已经成功调用！** 只是需要更具体的参数。

### 🎯 更具体的测试用例

**代理创建（具体参数）：**
```
agent_manage 创建一个名为"frontend-dev"的React前端开发者代理，具备React、TypeScript、CSS技能
使用agent_manage工具创建一个后端工程师，名字叫"backend-dev"，技能包括Node.js和数据库
代理管理，请创建一个全栈开发者，包含前端和后端开发能力
```

**任务分析（具体项目）：**
```
task_analyze 分析一个电商网站项目，包含用户认证、商品管理、订单处理功能
使用task_analyze评估一个React Native移动应用的开发复杂度
任务分析，评估一个包含微服务架构的后端API系统
```

**质量检查（具体目标）：**
```
quality_analyze 检查当前TypeScript项目的代码质量和最佳实践
使用quality_analyze分析Node.js项目的性能和安全性
质量分析，审查React组件的代码规范和可维护性
```

**项目配置（具体技术栈）：**
```
config_validate 为新的Next.js项目生成完整的开发环境配置
使用config_validate初始化一个Vue3 + TypeScript + Vite的前端项目
配置验证，设置一个包含ESLint、Prettier、Jest的React项目
```

### 中文工具名

```
代理管理 - 创建一个后端工程师
任务分析 - 评估移动应用复杂度
质量分析 - 审查项目代码
配置验证 - 设置开发环境
工作流执行 - 协调团队任务
智能翻译 - 转换文档格式
模型调度 - 优化资源分配
系统诊断 - 监控项目健康
```

## 🐛 调试功能

### 启用调试模式
在 VS Code MCP 配置中添加：
```json
"env": {
  "DEBUG_MCP": "true",
  "LOG_LEVEL": "debug"
}
```

### 调试信息包含
- 🔧 工具调用详情和参数
- ⏰ 执行时间统计
- 📊 结果大小和预览
- 🎯 自动路径检测
- ❌ 详细错误信息

### 调试输出示例
```
🔧 [DEBUG] Tool call: agent_manage
📊 [DEBUG] Arguments: {"action": "create", "name": "frontend-dev"}
⏰ [DEBUG] Timestamp: 2025-08-14T02:46:15.456Z
⚡ [DEBUG] Executing tool: agent_manage
✅ [DEBUG] Tool agent_manage completed in 245ms
📊 [DEBUG] Result size: 1532 characters
```

## 🛠️ 工具功能概览

| 工具 | 英文名 | 中文名 | 主要功能 |
|------|--------|--------|----------|
| 🤖 | `agent_manage` | `代理管理` | 创建、管理、生成智能代理 |
| 📊 | `task_analyze` | `任务分析` | 分析任务复杂度和技术要求 |
| 🔄 | `workflow_execute` | `工作流执行` | 执行多代理协作流程 |
| 🌐 | `intelligent_translate` | `智能翻译` | 技术文档智能翻译 |
| ⚙️ | `config_validate` | `配置验证` | 项目配置和初始化 |
| 🔍 | `quality_analyze` | `质量分析` | 代码质量和最佳实践检查 |
| 🎛️ | `model_schedule` | `模型调度` | AI资源管理和调度 |
| 🩺 | `system_diagnosis` | `系统诊断` | 系统健康监控和诊断 |

## ⚡ 性能特性

- **快速响应**: 大多数工具在 100-500ms 内完成
- **内存优化**: 智能缓存和资源管理
- **错误恢复**: 自动重试和错误处理
- **路径检测**: 自动识别项目根目录

## 🎯 成功标志

工具正常工作时你会看到：
- ✅ Chat 明确提到调用了具体工具
- ✅ 返回结构化的 CMMI 标准响应
- ✅ 显示执行时间和结果统计
- ✅ VS Code 输出面板显示详细日志

## 🔧 故障排除

### ✅ 成功调用但结果不理想
如果看到：
```
CMMI agent initialization has been completed, but no agents were created...
```
**解决方案**：
1. 使用更具体的参数描述
2. 明确指定代理名称和技能
3. 尝试更详细的需求描述

**改进示例**：
- ❌ 不够具体：`agent_manage 创建代理`
- ✅ 具体明确：`agent_manage 创建一个名为"react-dev"的前端开发者，技能包括React、TypeScript、CSS`

### 工具不被触发
1. 检查唤醒词是否正确
2. 重新加载 VS Code 窗口
3. 启用调试模式查看详细日志
4. 确认版本为 v0.1.7

### 配置错误
如果看到 `npm ERR! notarget No matching version found for cmmi-specs-mcp@lastest`：
1. 检查拼写：`lastest` → `latest`
2. 或使用具体版本：`cmmi-specs-mcp@0.1.7`

### 性能问题
1. 查看执行时间统计
2. 检查项目路径是否正确
3. 启用调试模式分析瓶颈

### 连接问题
1. 检查 MCP 配置语法
2. 查看 VS Code 输出面板
3. 重启 VS Code

## 🎉 立即测试

保存配置后，在 VS Code Copilot Chat 中试试以下**具体的测试用例**：

### 🔥 推荐测试（复制粘贴即可）：

```
agent_manage 创建一个名为"frontend-expert"的React前端专家，技能包括React、TypeScript、Next.js、Tailwind CSS
```

```
task_analyze 评估一个包含用户认证、商品管理、购物车、支付系统的电商网站项目复杂度
```

```
quality_analyze 对当前的TypeScript React项目进行代码质量检查，包括性能、安全性、可维护性分析
```

### 预期结果：
- ✅ 看到详细的代理配置信息
- ✅ 获得具体的任务分析报告  
- ✅ 收到完整的质量评估结果
- ✅ VS Code输出面板显示执行时间和日志

如果仍然收到通用回复，请尝试更具体的描述或启用调试模式查看详细日志！
