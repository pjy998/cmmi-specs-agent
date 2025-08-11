# 📚 CMMI Specs Agent 文档概览

## 🎯 项目简介

CMMI Specs Agent 是一个智能化的多代理工作流系统，基于 MCP (Model Context Protocol) 实现，集成了GPT-4.1智能翻译和动态代理生成功能，能够自动生成完整的CMMI标准软件开发文档集，支持中英文双语言文档生成。

## 📖 核心文档

### 1. 📋 需求和规划

- **[REQUIREMENTS_PLANNING.md](./REQUIREMENTS_PLANNING.md)** - 系统需求规划和功能规格文档
- **[SYSTEM_CAPABILITIES.md](./SYSTEM_CAPABILITIES.md)** - 系统核心能力和技术特性说明

### 2. 🚀 快速开始和使用

- **[DOCUMENT_AUTO_LANDING_GUIDE.md](./DOCUMENT_AUTO_LANDING_GUIDE.md)** - 文档自动生成功能详细指南
- **[HOW_TO_USE_IN_OTHER_PROJECTS.md](./HOW_TO_USE_IN_OTHER_PROJECTS.md)** - 在其他项目中使用本工具的完整指南
- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - 详细的工作流执行和配置指南

### 3. 🔧 安装配置

- **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - VS Code和MCP服务器的完整安装指南

### 4. 🏗️ 架构和技术

- **[PROJECT_DETAILS.md](./PROJECT_DETAILS.md)** - 详细的项目说明和技术规格
- **[ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** - 项目架构和技术实施指南
- **[INTELLIGENT_TRANSLATION_DESIGN.md](./INTELLIGENT_TRANSLATION_DESIGN.md)** - 智能翻译系统设计和实现
- **[ITERATION_COMPLETION_REPORT.md](./ITERATION_COMPLETION_REPORT.md)** - 功能迭代完成报告和成果总结

## 🏗️ 项目架构

```text
cmmi-specs-agent/
├── docs/                          # 📚 项目文档
│   ├── REQUIREMENTS_PLANNING.md         # 系统需求规划
│   ├── SYSTEM_CAPABILITIES.md          # 系统核心能力
│   ├── INTELLIGENT_TRANSLATION_DESIGN.md # 智能翻译系统设计
│   ├── DOCUMENT_AUTO_LANDING_GUIDE.md  # 文档自动生成指南
│   ├── ARCHITECTURE_GUIDE.md           # 项目架构指南
│   └── ...
├── mcp-server/                    # 🖥️ MCP服务器核心
│   ├── src/
│   │   ├── server.ts                    # MCP服务器主程序
│   │   ├── config/agent-generator.ts    # 智能代理生成器
│   │   ├── utils/intelligent-translation.ts # 智能翻译服务
│   │   ├── tools/                       # MCP工具集合
│   │   └── types/                       # TypeScript类型定义
│   └── package.json
├── agents/                        # 🤖 静态代理配置
│   ├── requirements-agent.yaml         # 需求分析代理
│   ├── design-agent.yaml              # 设计架构代理
│   └── ...
└── tests/                         # 🧪 测试套件
    ├── test-smart-agents.js           # 智能代理测试
    ├── run-all-tests.js              # 完整测试套件
    └── ...
```

## 🛠️ 核心功能特性

### 1. 智能翻译系统
- **GPT-4.1驱动**: 基于最新AI模型的上下文感知翻译
- **技术术语映射**: 100+专业术语的中英文对照
- **文档结构保持**: 翻译过程中保持Markdown格式完整性
- **双向翻译**: 支持中英文互译和自动语言检测

### 2. 智能代理生成器
- **动态配置生成**: 根据任务自动创建专业代理配置
- **VS Code集成**: 生成 `.copilot/agents` 兼容的配置文件
- **智能模型分配**: 自动选择最适合的AI模型(GPT-4.1/Claude-Sonnet-4)
- **复杂度分析**: 自动评估任务复杂度和工期估算

### 3. CMMI文档生成
- **5种标准文档**: 需求、设计、任务、测试、实现指南
- **CMMI过程域标识**: 每个文档包含正确的过程域标记
- **多代理协作**: 5个专业代理分工协作生成文档
- **标准项目结构**: 自动创建符合软件工程规范的目录结构

## 🔧 MCP工具集
│   ├── HOW_TO_USE_IN_OTHER_PROJECTS.md     # 跨项目使用指南  
│   ├── USAGE_GUIDE.md                      # 详细使用指南
│   ├── INSTALLATION_GUIDE.md               # 安装配置指南
│   ├── ARCHITECTURE_GUIDE.md               # 架构设计指南
│   ├── PROJECT_DETAILS.md                  # 项目详细说明
│   ├── ITERATION_COMPLETION_REPORT.md      # 功能完成报告
│   └── DOCUMENTATION_OVERVIEW.md           # 本文档概览
├── configs/                       # ⚙️ 配置文件  
│   └── mcp-config-insiders.json            # VS Code MCP配置
├── mcp-server/                    # 🖥️ MCP服务器核心
│   ├── src/
│   │   ├── server.ts                       # MCP服务器入口
│   │   ├── tools/                          # MCP工具实现
│   │   │   ├── mcp-tools.ts                # 工具定义
│   │   │   └── advanced-handlers.ts        # 高级工作流处理器
│   │   ├── utils/                          # 🛠️ 工具模块
│   │   │   ├── file-operations.ts          # 文件操作系统
│   │   │   ├── logger.ts                   # 日志系统
│   │   │   └── task-analyzer.ts            # 任务分析器
│   │   └── types/                          # 📝 TypeScript类型定义
│   └── package.json
├── tests/                         # 🧪 测试套件
│   └── test-document-auto-landing.mjs      # 端到端功能测试
└── vscode-test-project/           # 🧪 VS Code测试项目
    └── agents/                             # 代理配置示例
        ├── requirements-agent.yaml
        ├── design-agent.yaml  
        ├── coding-agent.yaml
        ├── tasks-agent.yaml
        ├── test-agent.yaml
        └── spec-agent.yaml
```
├── install-mcp.sh                 # MCP安装脚本
└── install-vscode.sh              # VS Code安装脚本
```

## 🔧 可用的MCP工具

| 工具名称 | 功能描述 | 对应CMMI过程 |
|---------|----------|-------------|
| `task_analyze` | 分析任务复杂度并推荐所需代理 | 项目规划(PP) |
| `cmmi_init` | 初始化标准CMMI代理配置 | 过程定义(OPD) |
| `agent_create` | 创建具有特定能力的AI代理 | 过程管理(OPF) |
| `workflow_execute` | 执行多代理工作流智能编排 | 集成管理(IPM) |
| `agent_list` | 列出所有可用代理及其能力 | 过程监控(PMC) |
| `config_validate` | 验证代理配置文件正确性 | 质量保证(PPQA) |

## 🎯 CMMI过程域映射

### 项目管理类

- **PP (Project Planning)** - `task_analyze` 工具
- **PMC (Project Monitoring and Control)** - `agent_list` 工具

### 过程管理类

- **OPD (Organizational Process Definition)** - `cmmi_init` 工具
- **OPF (Organizational Process Focus)** - `agent_create` 工具

### 工程类

- **RD (Requirements Development)** - requirements-agent
- **TS (Technical Solution)** - design-agent + coding-agent
- **PI (Product Integration)** - tasks-agent
- **VER (Verification)** - test-agent
- **VAL (Validation)** - test-agent

### 支撑类

- **PPQA (Process and Product Quality Assurance)** - `config_validate` 工具
- **IPM (Integrated Project Management)** - `workflow_execute` 工具

## 🚀 快速开始

1. **安装配置**

   ```bash
   # 参考 MCP_INSTALLATION_GUIDE.md 完成安装
   cd mcp-server
   npm install
   npm run build
   ```

2. **启动服务**

   ```bash
   # VS Code中的MCP配置会自动启动服务
   # 确保在settings.json中正确配置了MCP路径
   ```

3. **测试功能**

   ```bash
   # 在VS Code Copilot Chat中运行
   cmmi_init
   task_analyze "开发用户权限管理系统"
   workflow_execute "实现缓存优化功能"
   ```

## 📊 项目状态

- ✅ **MCP服务器**: 已完成，支持6个核心工具
- ✅ **代理配置**: 已完成，包含6个CMMI标准代理
- ✅ **VS Code集成**: 已完成，支持Copilot Chat调用
- 🚧 **文档自动落地**: 正在实施中，参考实施指南
- 🚧 **目录结构标准化**: 正在实施中，参考目录结构分析

## 📝 贡献指南

1. **文档更新**: 按照目录结构分析中的标准组织文档
2. **代码提交**: 遵循MCP协议规范，确保工具定义正确
3. **测试验证**: 在VS Code环境中验证所有MCP工具功能

## 🔗 相关链接

- [MCP官方文档](https://modelcontextprotocol.io/)
- [CMMI官方网站](https://cmmiinstitute.com/)
- [VS Code MCP扩展](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-copilot)

---

*最后更新: 2025年8月11日*
*版本: 1.0*
