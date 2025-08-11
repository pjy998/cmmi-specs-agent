# CMMI 多代理工作流系统

基于 MCP (Model Context Protocol) 的 CMMI 标准多代理工作流系统。

## 📁 项目结构

```
├── mcp-server/           # MCP 服务器源码
│   ├── src/             # TypeScript 源码
│   ├── dist/            # 编译后的 JavaScript
│   ├── package.json     # Node.js 依赖
│   └── README.md        # 服务器详细说明
├── tests/               # 测试脚本
│   ├── test-mcp.js      # 基础服务器测试
│   ├── test-advanced-tools.cjs  # 完整功能测试
│   └── README.md        # 测试说明
├── USAGE_GUIDE.md       # 详细使用指南
├── agent.md             # CMMI 代理规范
└── example-agents.md    # 代理示例配置
```

## 🚀 快速开始

### 1. 构建 MCP 服务器
```bash
cd mcp-server
npm install
npm run build
```

### 2. 运行测试
```bash
cd tests
node test-mcp.js          # 基础测试
node test-advanced-tools.cjs  # 完整测试
```

### 3. 配置 VS Code
参考 `USAGE_GUIDE.md` 中的详细配置说明。

## 🔧 核心工具

- `agent_create` - 创建 AI 代理
- `agent_list` - 列出所有代理  
- `task_analyze` - 分析任务复杂度
- `config_validate` - 验证代理配置
- `cmmi_init` - 初始化 CMMI 代理
- `workflow_execute` - 执行多代理工作流 ⭐

## 📖 文档

- [使用指南](USAGE_GUIDE.md) - 详细的使用说明和示例
- [代理规范](agent.md) - CMMI 标准代理角色定义
- [示例配置](example-agents.md) - 代理配置示例

## 🏗️ CMMI 标准代理

系统提供6个标准的 CMMI 软件开发角色：

1. **requirements-agent** - 需求分析 (RD)
2. **design-agent** - 系统设计 (TS) 
3. **coding-agent** - 代码实现 (PI)
4. **tasks-agent** - 项目管理 (PP/PMC)
5. **test-agent** - 测试验证 (VER/VAL)
6. **spec-agent** - 技术规范 (PPQA)

## 💡 特性

- ✅ 智能多代理工作流编排
- ✅ CMMI 标准化流程
- ✅ 支持多种 AI 模型 (GPT-4.1, GPT-5, Claude Sonnet 4)
- ✅ 配置文件版本控制友好
- ✅ TypeScript + Node.js 实现
- ✅ 完整的测试覆盖

---
*基于 CMMI 标准的专业多代理软件工程流水线* 🎯
