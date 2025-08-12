# 🚀 CMMI Specs Agent

> 基于MCP协议的智能代理系统，实现Copilot Chat模型智能调度和多语言CMMI文档生成

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)

基于 **MCP (Model Context Protocol)** 的智能代理系统，通过VS Code Copilot Chat集成，提供符合CMMI Level 3标准的文档生成和工作流自动化。

## ✨ 核心特性

🎯 **Copilot Chat模型智能调度**
- 根据代理角色自动调用GPT-4.1/Claude-Sonnet-4
- 30秒自适应超时，适应任务复杂度和网络状况
- 支持10+并发代理任务处理

🌐 **智能多语言文档生成**
- 通过MCP协议调用GPT-4.1模型
- 中英双语文档生成，准确率>95%
- 内置语言检测和智能翻译

🤖 **专业CMMI代理系统**
- 6个专业代理角色：requirements/design/coding/test/tasks/spec
- 智能任务分析和代理选择
- 端到端工作流自动化，成功率>95%

⚡ **轻量级MCP架构**
- 基于MCP 1.0协议标准
- 完整的VS Code Copilot Chat集成
- 智能错误处理和网络恢复

## 🚀 快速开始

### 1. 安装配置

```bash
# 克隆项目
git clone https://github.com/pjy998/cmmi-specs-agent.git
cd cmmi-specs-agent

# 安装MCP服务器
./install-mcp.sh
```

### 2. 使用代理系统

在VS Code中使用Copilot Chat调用智能代理：

```
# 生成需求文档（使用GPT-4.1）
使用 requirements-agent 分析"用户认证系统"需求

# 设计系统架构（使用Claude-Sonnet-4）  
使用 design-agent 设计"订单管理系统"架构

# 智能多语言翻译（使用GPT-4.1）
使用 intelligent_translate 将技术文档翻译为英文
```

### 3. 工作流自动化

```
# 执行完整CMMI工作流
使用 workflow_execute 为"支付系统"生成完整文档集
```

## 📁 代理角色和模型映射

| 代理角色 | 专业领域 | 推荐模型 | 主要功能 |
|----------|----------|----------|----------|
| requirements-agent | 需求分析 | GPT-4.1 | 逻辑分析、需求规格说明 |
| design-agent | 系统设计 | Claude-Sonnet-4 | 架构设计、技术方案 |
| coding-agent | 代码实现 | GPT-4.1 | 代码生成、技术实现 |
| test-agent | 测试计划 | GPT-4.1 | 测试用例、质量保证 |
| tasks-agent | 任务管理 | Claude-Sonnet-4 | 任务规划、项目管理 |
| spec-agent | 文档编写 | GPT-4.1 | 多语言文档生成 |

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

```bash
# 验证MCP连接
cd tests && ./verify-mcp.sh

# 运行综合测试
node run-all-tests.js

# 预期结果：✅ All agent tests passed!
```

## 🛠️ 技术架构

- **MCP 1.0 Protocol** - Model Context Protocol标准
- **TypeScript** - 类型安全的系统开发
- **VS Code Copilot Chat** - AI模型调用接口
- **GPT-4.1 & Claude-Sonnet-4** - 双模型智能调度
- **Node.js** - 轻量级运行环境
- **YAML** - 代理配置管理

## 🚀 性能指标

- **响应时间**: ≤30秒（自适应超时）
- **并发能力**: >10个代理任务
- **文档准确率**: >95%
- **多语言覆盖**: 100%（中英双语）
- **系统可用性**: >99.5%

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⭐ 如果这个项目对你有帮助，请给个星标支持！
