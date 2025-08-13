# 🚀 CMMI Specs MCP - 普通用户使用指南

## 问题分析与解决方案

### 原始问题
之前用户遇到的错误：
```
Error: Cannot find module '/Users/jieky/.npm/_npx/fd4140e675a329db/node_modules/cmmi-specs-mcp/dist/dist/server.js'
```

### 问题根源
1. **路径配置错误**：CLI中存在`dist/dist/server.js`的双重路径问题
2. **NPX包结构不完整**：包的发布配置导致路径解析错误
3. **用户环境依赖**：配置文件指向了开发者的本地路径

### 解决方案
✅ **已修复的问题**：
- 修复了CLI中的双重dist路径问题
- 更新了package.json的发布配置
- 创建了针对普通用户的MCP配置模板
- 确保NPX包的完整性和可用性

## 📦 安装和配置

### 方式一：自动安装（推荐）
```bash
# 一键安装配置
npx cmmi-specs-mcp@latest install-vscode
```

### 方式二：手动配置
1. 将以下配置添加到你的VS Code MCP配置文件中：

**Windows**: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`
**macOS**: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
**Linux**: `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["cmmi-specs-mcp", "start"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

2. 重启VS Code

## 🎯 使用方法

### 基本命令
```bash
# 查看版本
npx cmmi-specs-mcp version

# 查看帮助
npx cmmi-specs-mcp help

# 查看配置信息
npx cmmi-specs-mcp config

# 验证安装
npx cmmi-specs-mcp validate
```

### 在VS Code中使用
重启VS Code后，在Copilot Chat中使用：
```
@cmmi 创建一个新的需求分析代理
@cmmi 分析这个任务的复杂度
@cmmi 生成CMMI Level 3的设计文档
```

## ⚡ 优势

### ✅ 真正的NPX即用
- **无需本地安装**：直接通过npx运行，无需git clone
- **自动版本更新**：每次运行都使用最新版本
- **跨平台支持**：Windows、macOS、Linux通用
- **零配置启动**：一个命令完成所有配置

### 🔧 智能错误处理
- 自动检测和修复配置问题
- 详细的错误提示和解决建议
- 完善的日志记录和调试支持

### 🚀 专业CMMI工具集
- 8个专业MCP工具
- 6个智能代理角色
- 多语言文档生成
- 端到端工作流自动化

## 🔍 故障排除

### 常见问题

#### 1. 模块找不到错误
**症状**：`Error: Cannot find module`
**解决**：确保使用最新版本 `npx cmmi-specs-mcp@latest`

#### 2. 权限问题
**症状**：Permission denied
**解决**：
```bash
# macOS/Linux
sudo npx cmmi-specs-mcp install-vscode

# Windows (以管理员身份运行)
npx cmmi-specs-mcp install-vscode
```

#### 3. VS Code无法识别MCP服务器
**症状**：在Copilot Chat中无法使用@cmmi
**解决**：
1. 检查MCP配置文件路径是否正确
2. 重启VS Code
3. 运行 `npx cmmi-specs-mcp validate` 检查配置

### 验证安装
```bash
# 验证NPX包是否正常
npx cmmi-specs-mcp version

# 验证MCP配置是否正确
npx cmmi-specs-mcp validate

# 查看详细配置信息
npx cmmi-specs-mcp config
```

## 📞 获取支持

- **GitHub Issues**: [提交问题](https://github.com/pjy998/cmmi-specs-agent/issues)
- **文档**: [完整文档](https://github.com/pjy998/cmmi-specs-agent/blob/main/README.md)
- **NPM包**: [cmmi-specs-mcp](https://www.npmjs.com/package/cmmi-specs-mcp)

---

🎉 **现在可以放心地分享给任何用户使用了！无需源码，真正的"npx即用"体验！**
