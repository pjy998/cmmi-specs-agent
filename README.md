# 🚀 CMMI Specs Agent

> 基于MCP协议的优化版智能代理系统，实现Copilot Chat集成与多语言CMMI文档生成

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)

基于 **MCP (Model Context Protocol)** 的优化版智能代理系统，通过VS Code Copilot Chat集成，提供符合CMMI Level 3标准的文档生成和工作流自动化。

## ✨ 核心特性

🎯 **8个优化MCP工具**

- 统一代理管理 (agent_manage)
- 智能任务分析 (task_analyze)
- 工作流执行 (workflow_execute)
- 智能翻译 (intelligent_translate)
- 项目配置 (config_validate)
- 质量分析 (quality_analyze)
- 模型调度 (model_schedule)
- 系统诊断 (system_diagnosis)

🌐 **智能多语言文档生成**

- 通过MCP协议调用GPT-4.1模型
- 中英双语文档生成，技术文档专用优化
- 内置上下文感知翻译引擎

🤖 **专业CMMI代理系统**

- 6个专业代理角色：requirements/design/coding/test/tasks/spec
- 智能任务分析和代理推荐
- 端到端工作流自动化

⚡ **轻量级MCP架构**

- 基于MCP 1.0协议标准
- 完整的VS Code Copilot Chat集成
- 统一错误处理和日志监控

## 🛠️ 项目结构

```text
cmmi-specs-agent/
├── mcp-server/                    # MCP服务器核心
│   ├── src/
│   │   ├── server.ts             # 主服务器入口 
│   │   ├── tools/                # 8个优化MCP工具
│   │   │   ├── tools.ts          # 工具定义和Schema
│   │   │   ├── handlers.ts       # 统一工具处理器
│   │   │   └── enhanced.ts       # 增强功能处理器
│   │   ├── core/                 # 核心业务逻辑
│   │   │   ├── agentManager.ts   # 代理管理器
│   │   │   ├── taskAnalyzer.ts   # 任务分析器
│   │   │   ├── workflowExecutor.ts # 工作流执行器
│   │   │   └── multilingualEngine.ts # 多语言引擎
│   │   ├── types/                # TypeScript类型定义
│   │   └── utils/                # 工具函数
│   └── package.json              # 依赖配置
├── agents/                       # 6个CMMI代理配置
├── docs/                         # 项目文档集
├── tests/                        # 测试套件
└── configs/                      # MCP配置文件
```

## 🚀 快速开始

### 方式一：NPX 安装（推荐）

最简单的使用方式，无需克隆代码库

```bash
# 直接安装 MCP 服务器
npx cmmi-specs-agent install

# 配置 VS Code
npx cmmi-specs-agent install-vscode

# 查看所有可用命令
npx cmmi-specs-agent help
```

NPX 可用命令：

```bash
# 基础命令
npx cmmi-specs-agent version        # 显示版本信息
npx cmmi-specs-agent help           # 显示帮助信息
npx cmmi-specs-agent config         # 显示配置信息

# 安装配置
npx cmmi-specs-agent install        # 安装 MCP 服务器
npx cmmi-specs-agent install-vscode # 配置 VS Code

# 运行管理
npx cmmi-specs-agent start          # 启动 MCP 服务器
npx cmmi-specs-agent build          # 构建项目
npx cmmi-specs-agent test           # 运行测试
npx cmmi-specs-agent validate       # 验证安装

# 代理管理
npx cmmi-specs-agent agent list     # 列出所有代理
npx cmmi-specs-agent agent create   # 创建新代理（开发中）
npx cmmi-specs-agent agent validate # 验证代理配置
```

### 方式二：本地安装

```bash
# 克隆项目
git clone https://github.com/pjy998/cmmi-specs-agent.git
cd cmmi-specs-agent

# 安装 MCP 服务器
./install-mcp.sh

# 配置 VS Code
./install-vscode.sh
```

### 使用代理系统

在VS Code中使用Copilot Chat调用智能代理：

```text
# 代理管理
@workspace 使用 agent_manage 创建新的需求分析代理

# 任务分析
@workspace 使用 task_analyze 分析"用户认证系统"的开发任务

# 智能翻译
@workspace 使用 intelligent_translate 将技术文档翻译为英文

# 工作流执行
@workspace 使用 workflow_execute 为"支付系统"生成完整文档集
```

### 验证安装

```bash
# NPX 方式验证
npx cmmi-specs-agent validate

# 本地方式验证
npm run validate
```

## � 8个MCP工具详情

| 工具名称 | 功能描述 | 主要用途 |
|----------|----------|----------|
| agent_manage | 统一代理管理 | 创建、列表、智能生成、初始化CMMI代理 |
| task_analyze | 任务分析 | 分析任务复杂度，推荐所需代理 |
| workflow_execute | 工作流执行 | 多代理协作执行复杂工作流 |
| intelligent_translate | 智能翻译 | 技术文档专用翻译，支持中英双语 |
| config_validate | 项目配置 | 生成新项目或验证配置文件 |
| quality_analyze | 质量分析 | 代码和文档质量分析 |
| model_schedule | 模型调度 | AI模型访问调度和管理 |
| system_diagnosis | 系统诊断 | 系统状态监控和诊断 |

## 🎯 使用场景

- 🆕 **新功能开发**：智能代理协作生成完整技术文档
- 🌐 **多语言项目**：中英双语文档自动生成和翻译
- 👥 **团队协作**：标准化CMMI Level 3开发流程
- � **模型优化**：根据任务类型智能选择最适合的AI模型

## 📚 系统文档

详细的系统设计文档请查看 [docs/cmmi-standard/](./docs/cmmi-standard/) 目录：

- � [需求规格说明书](./docs/cmmi-standard/requirements.md) - 完整的功能需求和性能指标
- 🏗️ [系统架构设计](./docs/cmmi-standard/design.md) - 智能代理系统详细设计
- � [实施任务计划](./docs/cmmi-standard/tasks.md) - 分阶段开发计划和验收标准
- 📖 [文档集概览](./docs/cmmi-standard/README.md) - 完整文档导航

## 🧪 系统验证

### NPX 方式验证

```bash
# 验证 NPX 安装
npx cmmi-specs-agent version

# 运行集成测试
npx cmmi-specs-agent test

# 验证配置
npx cmmi-specs-agent validate

# 预期结果：✅ All tests passed!
```

### 本地方式验证

```bash
# 构建MCP服务器
cd mcp-server && npm run build

# 验证MCP工具加载
node -e "import('./dist/tools/tools.js').then(m => console.log('✅', m.mcpTools.length, 'tools loaded'))"

# 运行综合测试
cd tests && node run-all-tests.js

# 预期结果：✅ All tests passed!
```

## 🛠️ 技术架构

- **MCP 1.0 Protocol** - Model Context Protocol标准
- **TypeScript** - 类型安全的系统开发，camelCase命名规范
- **VS Code Copilot Chat** - AI模型调用接口
- **GPT-4.1 & Claude-Sonnet-4** - 双模型智能调度
- **Node.js** - 轻量级运行环境
- **YAML** - 代理配置管理
- **统一日志系统** - 完整的错误处理和监控

## 🚀 性能指标

- **工具数量**: 8个优化MCP工具（合并重叠功能）
- **代理配置**: 6个专业CMMI代理
- **文档准确率**: >95%（技术文档专用优化）
- **多语言覆盖**: 100%（中英双语）
- **系统可用性**: >99.5%
- **TypeScript编译**: 零错误，完整类型安全

## � 发布信息

### NPM 包信息

- **包名**: `cmmi-specs-agent`
- **版本**: 1.0.0
- **主页**: [GitHub](https://github.com/pjy998/cmmi-specs-agent)
- **命令**: `npx cmmi-specs-agent`

### 发布到 NPM

```bash
# 构建项目
npm run build

# 发布到 npm（需要登录）
npm publish

# 验证发布
npx cmmi-specs-agent@latest version
```

### 安装方式对比

| 方式 | 优点 | 适用场景 |
|------|------|----------|
| NPX | 无需安装，即用即走 | 快速试用，CI/CD |
| 本地克隆 | 可自定义修改 | 开发贡献，深度定制 |
| 全局安装 | 命令简短 | 频繁使用 |

## �📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⭐ 如果这个项目对你有帮助，请给个星标支持！
