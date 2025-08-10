# Copilot Multi-Agent Orchestrator

基于MCP的简化多代理系统，专为GitHub Copilot设计，专注于核心功能和CMMI标准代理。

## 🚀 功能特性

### 核心功能
- **代理创建和管理**: 创建和列出AI代理
- **任务智能分析**: 分析任务复杂度和所需代理
- **配置验证**: 验证代理配置文件的正确性
- **CMMI标准代理**: 提供标准化的软件开发流程代理

### MCP工具集（优化命名）
- `agent_create` - 创建具有特定能力的AI代理
- `agent_list` - 列出所有可用代理及其能力
- `task_analyze` - 智能分析任务并推荐所需代理
- `config_validate` - 验证代理配置文件
- `cmmi_init` - 初始化标准CMMI代理集合
- `workflow_execute` - 执行多代理工作流编排

## 📋 系统要求

- Node.js >= 18.0.0
- TypeScript >= 5.6.2
- MCP SDK >= 0.5.0

## 🛠 安装和配置

### 1. 安装依赖
```bash
npm install
```

### 2. 构建项目
```bash
npm run build
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 运行生产服务器
```bash
npm start
```

## Architecture

\`\`\`
src/
├── server.ts                    # MCP server entry point
├── tools/                      # MCP tool implementations  
│   ├── mcp-tools.ts           # 5 core tool definitions
│   ├── handlers.ts            # Basic tool handlers
│   └── advanced-handlers.ts   # Advanced tool handlers
├── types/                      # TypeScript type definitions
│   ├── agent.ts               # Core agent types
│   ├── execution.ts           # Simplified execution types  
│   └── mcp.ts                 # MCP protocol types
├── utils/                      # Utilities and helpers
│   ├── logger.ts              # Logging system
│   └── task-analyzer.ts       # Task analysis logic
└── config/                     # Configuration management
    └── agent-generator.ts      # Agent generation logic
```

## 🎯 CMMI标准代理

系统提供6个标准CMMI代理角色：

1. **需求代理** (requirements-agent) - 需求分析和管理
2. **设计代理** (design-agent) - 架构和详细设计
3. **编码代理** (coding-agent) - 代码实现和开发
4. **任务代理** (tasks-agent) - 项目管理和任务分解
5. **测试代理** (test-agent) - 测试策略和执行
6. **规范代理** (spec-agent) - 技术规范和文档

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run simplified tests
npm run test

# Format code
npm run format
```

## License

MIT
\`\`\`

## Development

\`\`\`bash
# Development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Format code
npm run format
\`\`\`

## License

MIT
