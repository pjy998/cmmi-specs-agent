# VS Code MCP 配置修正

## 问题诊断

从您提供的日志可以看出，`cmmi-specs-mcp` 包在没有参数时显示帮助信息，而不是启动MCP服务器。

## 解决方案

您需要修改 VS Code 的 MCP 配置文件，在 `args` 数组中添加 `"start"` 参数。

### 正确的配置

请将您的 `~/Library/Application Support/Code/User/mcp.json` 文件中的 `cmmi-specs-mcp` 部分修改为：

```json
{
  "inputs": [],
  "servers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "type": "http",
      "version": "0.0.1"
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp@latest"
      ],
      "type": "stdio"
    },
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "cmmi-specs-mcp@latest",
        "start"
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

## 关键修改

在 `cmmi-specs-mcp` 的 `args` 数组中添加了 `"start"` 参数：

```json
"args": [
  "-y",
  "cmmi-specs-mcp@latest",
  "start"  ← 新增这个参数
]
```

## 验证步骤

1. **修改配置文件** - 添加 `"start"` 参数
2. **重新加载VS Code** - `Cmd+Shift+P` → `Developer: Reload Window`
3. **检查MCP日志** - 应该看到 `{"method":"notifications/ready","jsonrpc":"2.0"}` 而不是帮助信息
4. **测试功能** - 在GitHub Copilot Chat中测试CMMI相关功能

## 预期的正确日志

修改后，MCP日志应该显示：

```
2025-08-13 XX:XX:XX.XXX [info] Starting server cmmi-specs-mcp
2025-08-13 XX:XX:XX.XXX [info] Connection state: Starting
2025-08-13 XX:XX:XX.XXX [info] Connection state: Running
2025-08-13 XX:XX:XX.XXX [info] Server initialized successfully
```

而不是之前的帮助信息和解析错误。
