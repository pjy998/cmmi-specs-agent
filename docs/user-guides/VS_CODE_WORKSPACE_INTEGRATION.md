# 🎯 MCP工具与VS Code工作区路径集成指南

## 📋 功能概述

我们的MCP服务器现在支持**自动检测和使用VS Code工作区路径**，让您在Copilot Chat中使用MCP工具时无需手动指定`project_path`参数。

## 🔧 技术实现

### MCP Roots协议支持

我们实现了MCP协议的**Roots**功能，这是一个标准化的机制，允许：
- 客户端（VS Code）向服务器暴露文件系统根路径
- 服务器自动获取当前工作区的路径信息
- 工具调用时自动使用正确的项目路径

### 自动路径检测逻辑

```typescript
// 工具调用时的路径解析优先级：
1. 明确指定的project_path参数 （最高优先级）
2. VS Code工作区根路径 （自动检测）
3. 当前工作目录 （默认回退）
```

## 💡 使用方式

### 方式1：自动检测（推荐）
在VS Code中直接使用MCP工具，无需指定路径：

```text
@cmmi 创建一个需求分析代理
```

系统将自动：
- 检测当前VS Code打开的工作区路径
- 在工作区的`agents/`目录中创建代理文件
- 所有相关操作都在正确的项目上下文中执行

### 方式2：明确指定路径
如果需要在特定路径工作：

```text
@cmmi 创建一个需求分析代理，项目路径：/Users/username/my-project
```

## 🎯 支持的工具

所有主要的MCP工具都支持工作区路径自动检测：

| 工具名称 | 自动路径检测 | 作用 |
|---------|-------------|------|
| `agent_manage` | ✅ | 代理管理（创建/列表/初始化） |
| `workflow_execute` | ✅ | 多代理工作流执行 |
| `task_analyze` | ✅ | 任务分析和代理推荐 |
| `config_validate` | ✅ | 配置和YAML文件验证 |
| `quality_analyze` | ✅ | 项目质量分析 |
| `intelligent_translate` | ✅ | 智能文档翻译 |

## 🔍 实际效果演示

### 场景1：多项目工作
```bash
# 项目A：/Users/jieky/project-a
VS Code打开项目A → @cmmi 创建代理 → agents存储在 /Users/jieky/project-a/agents/

# 项目B：/Users/jieky/project-b  
VS Code打开项目B → @cmmi 创建代理 → agents存储在 /Users/jieky/project-b/agents/
```

### 场景2：代理隔离
```bash
# 不同项目的代理完全隔离
项目A的代理 ≠ 项目B的代理
每个项目维护自己的代理配置
```

## 🛠️ 技术细节

### MCP协议实现
```typescript
// 服务器声明roots能力
capabilities: {
  roots: {
    listChanged: true
  }
}

// 自动处理roots/list请求
this.server.setRequestHandler(ListRootsRequestSchema, async () => {
  return {
    roots: this.clientRoots.map(rootPath => ({
      uri: `file://${rootPath}`,
      name: `Workspace: ${rootPath.split('/').pop()}`
    }))
  };
});
```

### 自动路径注入
```typescript
// 工具调用时自动注入workspace路径
if (!safeArgs.project_path) {
  const defaultPath = this.getDefaultProjectPath();
  if (defaultPath !== process.cwd()) {
    safeArgs.project_path = defaultPath;
    logger.info(`🎯 Auto-detected project path: ${safeArgs.project_path}`);
  }
}
```

## 📊 兼容性

### VS Code版本支持
- ✅ VS Code 1.80+ （MCP扩展支持）
- ✅ VS Code Insiders
- ✅ 支持Multi-root Workspaces（多根工作区）

### 客户端支持
- ✅ VS Code + Copilot Chat
- ✅ Claude Desktop（通过MCP配置）
- ✅ 其他支持MCP Roots协议的客户端

## 🚀 优势

### 用户体验
- **零配置**：无需手动指定路径
- **智能感知**：自动识别工作区上下文
- **项目隔离**：不同项目的代理互不干扰

### 开发效率
- **快速启动**：立即在正确的项目中工作
- **避免错误**：消除路径配置错误
- **上下文感知**：工具始终在正确的项目范围内执行

### 企业级特性
- **多项目支持**：同时处理多个项目
- **权限控制**：通过VS Code的workspace权限控制文件访问
- **审计跟踪**：所有操作都有明确的项目上下文

## 🔧 故障排除

### 常见问题

#### 1. 工作区路径未自动检测
**症状**：工具仍在默认目录创建文件
**解决**：
- 确保VS Code已正确打开工作区文件夹
- 检查MCP服务器版本是否为v0.1.3+
- 重启VS Code和MCP连接

#### 2. 多根工作区支持
**症状**：多个根目录时选择错误
**解决**：使用第一个根目录作为默认，或明确指定`project_path`

#### 3. 权限问题
**症状**：无法在检测到的路径创建文件
**解决**：确保VS Code对工作区目录有写权限

### 调试信息
启用调试日志查看路径检测过程：
```bash
DEBUG_MCP=1 npx cmmi-specs-mcp start
```

## 📈 未来规划

- [ ] 支持VS Code的多光标和分割窗口上下文
- [ ] 集成Git分支信息到项目上下文
- [ ] 支持项目特定的代理模板和配置
- [ ] 与VS Code的任务系统集成

---

**结论**：通过MCP Roots协议，我们实现了VS Code工作区与MCP工具的无缝集成，为用户提供了更智能、更便捷的开发体验。
