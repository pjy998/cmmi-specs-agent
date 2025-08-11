# 🚀 CMMI Specs Agent

> 智能化CMMI多代理文档自动生成系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)

基于 **MCP (Model Context Protocol)** 的多智能体系统，能够自动生成符合 CMMI 标准的完整软件开发文档集。

## ✨ 核心特性

🎯 **完整的CMMI文档自动生成**
- 需求文档 (Requirements Document - RD)
- 设计文档 (Technical Solution - TS)  
- 任务管理文档 (Product Integration - PI)
- 测试计划文档 (Verification - VER)
- 实现指南文档 (Technical Solution - TS)

🤖 **智能多代理协作**
- 5个专业化代理分工协作
- 智能任务分析和代理选择
- 上下文共享和迭代优化

⚡ **即用即享**
- VS Code一键配置，全局可用
- 任何项目都可直接使用
- 无需重复安装和配置

## 🚀 快速开始

### 1. 安装配置
```bash
# 克隆项目
git clone https://github.com/pjy998/cmmi-specs-agent.git
cd cmmi-specs-agent

# 安装和配置
./install-mcp.sh
```

### 2. 在任何项目中使用
在VS Code中打开任何项目，使用Copilot Chat：

```
@cmmi-specs-agent 为"用户认证系统"生成完整CMMI文档
```

或使用具体工具：
```
使用mcp_cmmi-specs-ag_workflow_execute工具为"订单管理系统"生成文档
```

## 📁 生成的文档结构

```
your-project/
├── feature-name/
│   ├── docs/
│   │   ├── requirements.md      # 📋 需求文档 (CMMI: RD)
│   │   ├── design.md           # 🏗️ 设计文档 (CMMI: TS)
│   │   ├── tasks.md            # 📅 任务管理 (CMMI: PI)
│   │   ├── tests.md            # 🧪 测试计划 (CMMI: VER)
│   │   └── implementation.md   # 💻 实现指南 (CMMI: TS)
│   ├── src/                    # 源代码目录
│   └── tests/                  # 测试目录
```

## 🎯 使用场景

- 🆕 **新功能开发**：从需求到实现的完整文档化
- 🔄 **项目重构**：更新和标准化项目文档  
- 👥 **团队协作**：统一文档格式和开发流程
- 📊 **代码审查**：准备标准化的审查材料

## 📚 文档

详细文档请查看 [docs/](./docs/) 目录：

- 📖 [文档概览](./docs/DOCUMENTATION_OVERVIEW.md) - 所有文档的导航指南
- 🚀 [文档自动生成指南](./docs/DOCUMENT_AUTO_LANDING_GUIDE.md) - 核心功能详细说明
- 🔧 [其他项目使用指南](./docs/HOW_TO_USE_IN_OTHER_PROJECTS.md) - 跨项目使用方法
- ⚙️ [安装配置指南](./docs/INSTALLATION_GUIDE.md) - 完整的安装流程

## 🧪 测试验证

```bash
# 运行端到端测试
node tests/test-document-auto-landing.mjs

# 预期结果：🎉 All tests passed! (5/5 documents generated)
```

## 🛠️ 技术栈

- **MCP Protocol** - Model Context Protocol 标准
- **TypeScript** - 类型安全的开发语言
- **VS Code** - 主要的集成开发环境
- **Node.js** - 运行时环境
- **YAML** - 代理配置格式

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⭐ 如果这个项目对你有帮助，请给个星标支持！
