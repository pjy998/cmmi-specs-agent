# MCP 安装完成指南

## 🎉 安装状态
✅ **MCP SDK 已安装**: @modelcontextprotocol/sdk@0.5.0
✅ **MCP 服务器已构建**: dist/server.js 
✅ **VS Code Insiders 配置已更新**: ~/Library/Application Support/Code - Insiders/User/mcp.json
✅ **工作区配置已创建**: .vscode/settings.json
✅ **连接测试通过**: 6个工具全部可用

**注意**: 检测到您使用的是 VS Code Insiders，已为其正确配置 MCP 服务。

## 🔧 可用的 MCP 工具

1. **task_analyze** - 分析任务并推荐所需代理和复杂度
2. **cmmi_init** - 初始化标准 CMMI 软件开发代理
3. **agent_create** - 创建具有特定能力的新 AI 代理
4. **workflow_execute** - 执行多代理工作流智能编排
5. **agent_list** - 列出所有可用代理及其能力
6. **config_validate** - 验证代理配置文件的正确性

## 🚀 如何在 VS Code Insiders 中使用

### 1. 重启 VS Code Insiders
确保新配置生效

### 2. 确保扩展已安装
- ✅ GitHub Copilot
- ✅ GitHub Copilot Chat

### 3. 检查 MCP 状态
打开 VS Code Insiders 后，在底部状态栏查看 MCP 连接状态

### 4. 在 Copilot Chat 中使用
打开 Copilot Chat 面板，直接使用工具名称：
```
cmmi_init
```

### 5. 示例命令

#### 初始化 CMMI 代理
```
cmmi_init
```

#### 分析开发任务
```
task_analyze "开发一个用户认证系统"
```

#### 创建自定义代理
```
agent_create "database-designer" "数据库设计专家"
```

#### 执行完整工作流
```
workflow_execute "为电商网站添加购物车功能"
```

## 🔍 配置验证

### VS Code 用户设置 (~/.vscode/settings.json)
```json
{
  "mcp.servers": {
    "cmmi-specs-agent": {
      "command": "node",
      "args": [
        "/Users/jieky/mcp/cmmi-specs-agent/mcp-server/dist/server.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 项目工作区设置 (.vscode/settings.json)
```json
{
  "mcp.servers": {
    "cmmi-specs-agent": {
      "command": "node",
      "args": [
        "${workspaceFolder}/mcp-server/dist/server.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 🧪 测试命令

```bash
# 快速验证 MCP 工具
cd tests && node quick-mcp-validation.js

# 完整的国际化测试
cd tests && node mcp-validation-i18n.js

# MCP 连接测试
cd tests && node test-mcp-connection.mjs

# VS Code Insiders MCP 配置验证
cd tests && node validate-vscode-insiders-mcp.mjs
```

## 🎯 接下来的步骤

1. **重启 VS Code** - 让配置生效
2. **打开此项目** - 在 VS Code 中
3. **测试 Copilot Chat** - 输入 `@cmmi-specs-agent` 
4. **开始使用** - 尝试上述示例命令

## 🆘 故障排除

如果遇到问题：

1. **检查构建状态**:
   ```bash
   cd mcp-server && npm run build
   ```

2. **检查服务器状态**:
   ```bash
   cd tests && node quick-mcp-validation.js
   ```

3. **重新安装** (如有需要):
   ```bash
   ./install-vscode.sh
   ```

## 📚 更多信息

- 详细使用指南: `USAGE_GUIDE.md`
- 代理映射文档: `AGENT_MAPPING.md`
- 项目 README: `README.md`

---
🎉 **恭喜！你的 CMMI Specs Agent MCP 系统已完全安装并准备就绪！**
