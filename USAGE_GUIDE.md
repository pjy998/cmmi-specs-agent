# CMMI 多角色 Agent 工作流执行指南

## 🎯 项目概述

完整的 CMMI 多角色 Agent 系统，核心功能：
- ✅ **工作流编排**：`@mcp workflow_execute` 智能协调多代理执行
- ✅ **一次性初始化**：`@mcp cmmi_init` 生成标准 CMMI 配置
- ✅ **直接修改配置**：在 `.copilot/agents/` 下直接编辑 YAML 文件
- ✅ 6 个专业 CMMI 角色的完整流水线
- ✅ 跨模型调用支持 (gpt-4.1, gpt-5, claude-sonnet-4)
- ✅ 智能依赖管理和状态跟踪

## 🚀 快速开始

### 1. 准备 MCP 服务器

```bash
cd mcp-server
npm run build
```

### 2. 配置 VS Code

确保你的 `claude_desktop_config.json` 或 VS Code 配置包含 MCP 服务器：

```json
{
  "mcpServers": {
    "copilot-multi-agent": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/server.js"]
    }
  }
}
```

### 3. 一次性初始化 CMMI 角色

执行一次性初始化命令，生成标准的 6 个 CMMI 专业角色：

```
@mcp cmmi_init
```

### 4. 执行多代理工作流（核心功能）

这是系统的核心价值 - 智能协调多个代理完成复杂任务：

```
@mcp workflow_execute {
  "task_content": "开发一个用户权限管理系统，支持角色管理、权限分配和审计日志",
  "project_path": "./my-project",
  "execution_mode": "smart",
  "context_sharing": true
}
```

**关键参数说明：**
- `task_content`: 要执行的主要任务（必需）
- `execution_mode`: 执行模式
  - `"smart"`: 智能模式，根据依赖关系执行（推荐）
  - `"sequential"`: 顺序执行所有代理
  - `"parallel"`: 并行执行所有代理
- `context_sharing`: 是否在代理间共享上下文（推荐设为 true）
- `selected_agents`: 指定使用的代理（可选，不指定会自动分析）

## 📋 支持的能力 (Capabilities)

基于 `agent.md` 中定义的专业角色能力：

- `readFiles`: 读取工作区文件
- `writeFiles`: 写入/修改文件  
- `searchWorkspace`: 搜索工作区内容
- `runTasks`: 执行预定义任务
- `runTerminal`: 执行终端命令
- `webSearch`: 网络搜索

## 🤖 支持的模型 (Models)

- `gpt-4.1`: OpenAI GPT-4.1
- `gpt-5`: OpenAI GPT-5
- `claude-sonnet-4`: Anthropic Claude Sonnet 4

## 🛠️ 核心功能

### cmmi_init 命令

一次性初始化标准 CMMI 角色配置：

```
@mcp cmmi_init
```

**完整参数示例**：
```
@mcp cmmi_init {
  "output_directory": ".copilot/agents",
  "overwrite_existing": false,
  "default_models": {
    "requirements": "claude-sonnet-4",
    "design": "claude-sonnet-4",
    "coding": "gpt-5",
    "tasks": "gpt-4.1", 
    "test": "gpt-5",
    "spec": "gpt-4.1"
  },
  "create_index": true
}
```

**参数说明：**
- `output_directory`: 输出目录（默认：`.copilot/agents`）
- `overwrite_existing`: 是否覆盖现有文件（默认：`false`）
- `default_models`: 各角色的默认模型配置
- `create_index`: 是否创建索引文件（默认：`true`）

### 智能代理生成

基于任务描述自动生成多个代理配置：

```
@mcp generate_multi_agent_yaml {
  "task_content": "开发一个电商平台，需要前端、后端、支付、推荐系统",
  "auto_save": true
}
```

### 配置验证

验证现有的代理配置文件：

```
@mcp config_validate {
  "config_path": ".copilot/agents"
}
```

### 任务分析

分析任务复杂度并推荐所需代理：

```
@mcp task_analyze {
  "task_content": "开发一个用户权限管理系统",
  "project_path": "./my-project"
}
```

### 创建自定义代理

创建具有特定能力的代理：

```
@mcp agent_create {
  "name": "custom-agent",
  "description": "自定义专用代理",
  "capabilities": ["readFiles", "writeFiles"],
  "model": "gpt-4.1",
  "project_path": "./my-project"
}
```

### 列出现有代理

查看项目中的所有代理：

```
@mcp agent_list {
  "project_path": "./my-project"
}
```

## 🗂️ 文件结构

成功执行 `md2agents` 后，将生成 CMMI 专业角色结构：

```
.copilot/
└── agents/
    ├── requirements-agent.yaml  # 需求分析代理 (CMMI: RD)
    ├── design-agent.yaml        # 系统设计代理 (CMMI: TS)
    ├── coding-agent.yaml        # 代码实现代理 (TDD支持)
    ├── tasks-agent.yaml         # 任务管理代理 (CMMI: PI/VER/VAL)
    ├── test-agent.yaml          # 测试验证代理 (CMMI: VER/VAL)
    ├── spec-agent.yaml          # 流程协调代理 (核心)
    └── agents.json              # 索引文件
```

## 📝 Agent YAML 格式

完整的代理配置格式：

```yaml
version: 1
name: agent-name
title: 代理显示名称
description: 代理功能描述
model: gpt-4.1
color: blue
language: zh-CN
capabilities:
  - capability1
  - capability2
tools:
  - readFiles
  - writeFiles
entrypoints:
  - id: default
    description: 默认入口
instructions: |-
  代理的详细指令说明
```

## 🎮 使用示例

## 🎮 使用示例

### 1. 快速开始

```bash
# 一次性初始化标准 CMMI 角色
@mcp cmmi_init

# 调用核心协调代理 (quickMode 一键流程)
@spec-agent "实现用户权限缓存优化" {quickMode: true}

# 单独调用专业角色
@requirements-agent "为权限缓存生成需求文档"
@design-agent "基于需求生成系统设计"  
@coding-agent "实现权限缓存模块" {mode: tdd}
```

### 2. 自定义模型配置

```bash
# 初始化时指定不同的模型
@mcp cmmi_init {
  "default_models": {
    "requirements": "gpt-5",
    "design": "claude-sonnet-4",
    "coding": "gpt-5", 
    "tasks": "gpt-4.1",
    "test": "gpt-5",
    "spec": "claude-sonnet-4"
  }
}
```

### 3. 版本控制工作流

```bash
# 1. 初始化配置
@mcp cmmi_init

# 2. 将配置加入版本控制
git add .copilot/agents/
git commit -m "Add CMMI agent configurations"

# 3. 团队成员直接编辑 YAML 文件进行定制
# 4. 提交修改
git commit -am "Customize agent models and instructions"
```

## 🔧 配置选项详解

### 模型分配策略

推荐的模型配置：

- **requirements-agent**: `claude-sonnet-4` - 擅长需求分析和结构化文档
- **design-agent**: `claude-sonnet-4` - 适合架构设计和系统建模
- **coding-agent**: `gpt-5` - 强大的代码生成和 TDD 支持
- **tasks-agent**: `gpt-4.1` - 任务管理和流程协调
- **test-agent**: `gpt-5` - 测试用例生成和报告分析  
- **spec-agent**: `gpt-4.1` - 流程协调和项目管理

### 配置文件结构

初始化后的标准结构：

```yaml
version: 1
name: agent-name
title: Agent 显示名称
description: Agent 功能描述
model: gpt-5
color: blue
language: zh-CN
capabilities: [readFiles, writeFiles, searchWorkspace]
entrypoints:
  - id: default
    description: 默认入口点
    examples: ["示例用法"]
dependencies: [其他依赖的 agent]
instructions: |
  详细的角色指令和工作流程
```

## 🐛 故障排除

### 常见问题

**1. YAML 解析失败**
- 检查 YAML 语法是否正确
- 确保必需字段 (name, description) 存在

**2. 工具验证失败**
- 确保使用的工具在支持列表中
- 检查工具名称拼写是否正确

**3. 文件权限问题**
- 确保有写入输出目录的权限
- 检查目录是否存在

### 调试模式

启用调试模式以获取详细日志：

```bash
DEBUG_MCP=true node dist/server.js
```

## 📈 性能优化

- 使用合适的模型：简单任务用 GPT-4.1，复杂分析用 GPT-5，代码生成用 Claude Sonnet 4
- 合理设置并发执行以平衡性能和资源使用
- 定期清理不使用的代理配置

## 🔒 最佳实践

1. **一次初始化**：使用 `@mcp cmmi_init` 一次性生成标准配置
2. **直接编辑**：在 `.copilot/agents/` 目录下直接修改 YAML 文件
3. **版本控制**：将整个 `.copilot/agents/` 目录加入 Git 管理
4. **模型优化**：根据任务特性选择合适的模型
5. **团队协作**：共享标准配置，个性化调整通过直接编辑实现

## 🚀 优势总结

- **简化工作流**：无需复杂的 Markdown 转换，一次初始化即可
- **直接编辑**：YAML 配置文件可直接修改，即时生效
- **版本控制友好**：配置文件直接管理，便于团队协作
- **标准化**：基于 CMMI 的专业角色定义，确保软件工程质量
- **灵活性**：支持个性化模型配置和指令调整

---
*🎯 一次性初始化，直接编辑配置，专业的 CMMI 多角色流水线就绪！*
