# CMMI Specs MCP - 快速安装指南 (普通用户版)

## 🎯 5分钟完成安装

### 步骤1: 验证前置条件 (1分钟)

确保您已安装：
- ✅ VS Code 
- ✅ GitHub Copilot 扩展
- ✅ Node.js 18+

### 步骤2: 验证包可用性 (1分钟)

```bash
# 检查包信息
npm view cmmi-specs-mcp

# 测试运行
npx -y cmmi-specs-mcp version
```

### 步骤3: 配置VS Code MCP (2分钟)

找到您的VS Code MCP配置文件：
- **macOS**: `~/Library/Application Support/Code/User/mcp.json`
- **Windows**: `%APPDATA%\Code\User\mcp.json` 
- **Linux**: `~/.config/Code/User/mcp.json`

在 `servers` 部分添加：

```json
"cmmi-specs-mcp": {
  "command": "npx",
  "args": ["-y", "cmmi-specs-mcp@latest"],
  "type": "stdio",
  "env": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "info"
  }
}
```

### 步骤4: 重新加载VS Code (30秒)

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入: `Developer: Reload Window`
3. 按回车

### 步骤5: 测试功能 (30秒)

打开GitHub Copilot Chat (`Cmd+Shift+I`) 并测试：

```
请帮我生成一个CMMI Level 3的需求开发流程文档
```

## ✅ 安装成功标志

如果Chat能够：
- 理解CMMI相关概念
- 生成CMMI流程文档
- 提供技术方案模板
- 创建质量检查清单

说明安装成功！🎉

## 🆘 遇到问题？

1. **包找不到**: 检查网络连接，稍后重试
2. **配置无效**: 验证JSON格式是否正确
3. **服务无响应**: 重新加载VS Code窗口
4. **权限错误**: 使用npx而非全局安装

## 📞 获取支持

- 包信息: https://www.npmjs.com/package/cmmi-specs-mcp
- 源码: https://github.com/pjy998/cmmi-specs-agent

---

**🚀 现在您可以享受智能CMMI文档生成功能了！**
