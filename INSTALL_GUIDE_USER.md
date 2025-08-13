# CMMI Specs MCP - 普通用户安装和测试指南

## 概述

`cmmi-specs-mcp` 是一个基于Model Context Protocol (MCP)的CMMI规范智能代理系统，可以与VS Code GitHub Copilot Chat集成，提供多语言文档生成和智能工作流支持。

## 前置条件

- ✅ Node.js 18+ 已安装
- ✅ VS Code 已安装
- ✅ GitHub Copilot 扩展已安装并登录

## 步骤1：安装MCP包

### 方法1：全局安装（推荐）

```bash
npm install -g cmmi-specs-mcp
```

### 方法2：使用npx（无需安装）

```bash
npx cmmi-specs-mcp --help
```

## 步骤2：验证安装

运行以下命令验证安装是否成功：

```bash
# 检查版本
cmmi-specs-mcp --version

# 查看帮助信息
cmmi-specs-mcp --help

# 或使用npx
npx cmmi-specs-mcp --version
```

## 步骤3：配置VS Code MCP

### 3.1 找到VS Code配置文件

根据您的操作系统，MCP配置文件位于：

**macOS:**
```
~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/configs/mcp-config.json
```

**Windows:**
```
%APPDATA%\\Code\\User\\globalStorage\\github.copilot-chat\\configs\\mcp-config.json
```

**Linux:**
```
~/.config/Code/User/globalStorage/github.copilot-chat/configs/mcp-config.json
```

### 3.2 创建或编辑配置文件

如果文件不存在，创建目录和文件：

```bash
# macOS示例
mkdir -p "~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/configs"
```

在配置文件中添加以下内容：

```json
{
  "inputs": [],
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "cmmi-specs-mcp@latest"
      ],
      "type": "stdio",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 步骤4：重新加载VS Code

### 方法1：热重载（推荐）

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入：`Developer: Reload Window`
3. 按回车执行

### 方法2：完全重启

关闭并重新打开VS Code

## 步骤5：测试MCP服务

### 5.1 打开GitHub Copilot Chat

1. 按 `Cmd+Shift+I` (macOS) 或 `Ctrl+Shift+I` (Windows/Linux)
2. 或点击侧边栏的聊天图标

### 5.2 测试基本功能

在聊天窗口中输入以下命令进行测试：

```
请帮我生成一个CMMI Level 3的需求开发流程文档
```

```
我需要创建一个技术方案设计模板
```

```
生成一个验证和确认的检查清单
```

## 步骤6：验证安装是否成功

### 6.1 检查MCP连接状态

运行测试脚本验证连接：

```bash
# 使用npx测试连接
npx cmmi-specs-mcp --test-connection

# 或者如果全局安装了
cmmi-specs-mcp --test-connection
```

### 6.2 查看日志

如果遇到问题，可以查看详细日志：

```bash
# 启用调试模式
DEBUG=cmmi:* npx cmmi-specs-mcp
```

## 故障排除

### 问题1：找不到命令

**解决方案：**
```bash
# 确保npm全局目录在PATH中
npm config get prefix

# 或者直接使用npx
npx cmmi-specs-mcp --help
```

### 问题2：VS Code中无法识别MCP服务

**解决方案：**
1. 检查配置文件路径是否正确
2. 验证JSON格式是否有效
3. 使用 `Developer: Reload Window` 重新加载

### 问题3：权限错误

**解决方案：**
```bash
# macOS/Linux
sudo npm install -g cmmi-specs-mcp

# 或者使用npx避免权限问题
npx cmmi-specs-mcp
```

### 问题4：网络连接问题

**解决方案：**
```bash
# 使用国内镜像
npm install -g cmmi-specs-mcp --registry https://registry.npmmirror.com
```

## 高级配置

### 自定义环境变量

在MCP配置中添加更多环境变量：

```json
{
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["-y", "cmmi-specs-mcp@latest"],
      "type": "stdio",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug",
        "CMMI_LEVEL": "3",
        "OUTPUT_FORMAT": "markdown",
        "LANGUAGE": "zh-CN"
      }
    }
  }
}
```

### 使用特定版本

```json
{
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["-y", "cmmi-specs-mcp@0.0.1"],
      "type": "stdio"
    }
  }
}
```

## 验证清单

完成安装后，请检查以下项目：

- [ ] `cmmi-specs-mcp --version` 返回版本号
- [ ] VS Code配置文件已正确创建
- [ ] VS Code已重新加载
- [ ] GitHub Copilot Chat可以正常响应CMMI相关查询
- [ ] 可以生成CMMI文档和模板

## 支持和反馈

如果遇到问题：

1. 查看GitHub仓库：https://github.com/pjy998/cmmi-specs-agent
2. 提交Issue或Pull Request
3. 查看包文档：https://www.npmjs.com/package/cmmi-specs-mcp

## 更新包

保持包更新到最新版本：

```bash
# 全局更新
npm update -g cmmi-specs-mcp

# 或者使用npx总是获取最新版本
npx cmmi-specs-mcp@latest
```

---

🎉 **恭喜！您已成功安装和配置了cmmi-specs-mcp。现在可以在VS Code中享受智能CMMI文档生成功能了！**
