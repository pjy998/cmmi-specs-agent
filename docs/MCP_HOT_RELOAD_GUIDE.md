# VS Code MCP服务热重载指南

## 问题描述

当使用`npx`安装MCP服务到VS Code时，传统方法需要重启VS Code才能验证服务是否正常工作。这会导致：

- Chat会话丢失
- 缓冲区文件混乱
- 工作状态中断

## 解决方案：热重载方法

### 1. 使用VS Code窗口重新加载

这是最推荐的方法，可以重新加载MCP配置而不丢失大部分工作状态：

```text
1. 按 Cmd+Shift+P (macOS) 或 Ctrl+Shift+P (Windows/Linux)
2. 输入：Developer: Reload Window
3. 按回车执行
```

**优点：**

- 保持文件缓冲区状态
- 重新加载MCP配置
- 相对快速

**注意：** 某些扩展状态可能会重置，但文件内容和基本工作区状态会保持。

### 2. 通过设置触发MCP重新加载

如果只需要重新加载MCP配置：

```text
1. 按 Cmd+, 打开设置
2. 在搜索框输入：mcp
3. 找到任何MCP相关设置
4. 修改设置值，然后立即撤销（Cmd+Z）
```

这会触发VS Code重新读取MCP配置文件。

### 3. 使用GitHub Copilot Chat命令

保持聊天会话但重置上下文：

```text
在聊天窗口输入：/reset
```

这不会重启MCP服务，但会清理聊天上下文，避免混乱。

### 4. MCP服务器代码热重载

如果您修改了MCP服务器代码：

```bash
# 在mcp-server目录下
cd mcp-server
npm run build

# VS Code会自动检测文件变化
```

## 验证MCP服务状态

使用我们提供的验证脚本：

### 快速验证
```bash
./quick-mcp-check.sh
```

### 详细验证
```bash
node test-mcp-hot-reload.js
```

## 最佳实践

### 保持聊天会话
1. **定期保存对话**：将重要的聊天内容复制到文档文件
2. **使用工作区**：利用VS Code工作区功能保存项目上下文
3. **记录重要命令**：将常用的聊天命令保存到代码片段

### 避免缓冲区混乱
1. **保存所有文件**：使用 `Cmd+K S` (macOS) 或 `Ctrl+K S` (Windows/Linux)
2. **关闭无用标签**：定期清理不需要的编辑器标签页
3. **使用分组**：通过标签页分组组织文件

### MCP服务管理
1. **监控日志**：查看 `mcp-server/logs/` 目录下的日志文件
2. **验证配置**：定期检查 `configs/mcp-config-insiders.json`
3. **测试连通性**：使用验证脚本确保服务正常

## 故障排除

### MCP服务无响应
```bash
# 检查进程
ps aux | grep -E "(mcp|cmmi)" | grep -v grep

# 检查日志
tail -f mcp-server/logs/combined.log

# 重新构建服务器
cd mcp-server && npm run build
```

### 配置文件问题
```bash
# 验证JSON格式
cat configs/mcp-config-insiders.json | jq .

# 检查文件权限
ls -la configs/mcp-config-insiders.json
```

### NPX包问题
```bash
# 清理NPX缓存
npx clear-npx-cache

# 强制重新安装
npx -y @upstash/context7-mcp@latest --help
```

## 自动化脚本

项目包含以下辅助脚本：

1. **quick-mcp-check.sh** - 快速状态检查
2. **test-mcp-hot-reload.js** - 详细验证和测试
3. **install-vscode.sh** - 初始安装配置

## 总结

通过使用这些热重载方法，您可以：
- ✅ 避免完全重启VS Code
- ✅ 保持聊天会话和工作状态
- ✅ 快速验证MCP服务状态
- ✅ 维护稳定的开发环境

记住：**Developer: Reload Window** 是您的最佳朋友！
