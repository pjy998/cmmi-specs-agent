# 🐛 CMMI MCP 调试日志指南

## 📋 版本信息显示

每次启动MCP服务器时，都会显示当前版本信息：

```
🚀 CMMI Specs MCP Server v0.1.6
📅 Started at: 2025-08-14T02:45:30.123Z
🛠️  Tools available: 8
🐛 Debug mode: OFF
📋 Environment: production
============================================================
```

## 🔧 启用调试日志

### 方法1：在VS Code MCP配置中启用

编辑 `~/Library/Application Support/Code/User/mcp.json`：

```json
{
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["-y", "cmmi-specs-mcp@0.1.6", "start"],
      "type": "stdio",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug",
        "DEBUG_MCP": "true"
      }
    }
  }
}
```

### 方法2：命令行启用调试

```bash
DEBUG_MCP=true npx cmmi-specs-mcp@0.1.6 start
# 或者
LOG_LEVEL=debug npx cmmi-specs-mcp@0.1.6 start
```

## 📊 调试模式输出内容

启用调试模式后，将显示：

### 启动信息
```
🚀 CMMI Specs MCP Server v0.1.6
📅 Started at: 2025-08-14T02:45:30.123Z
🛠️  Tools available: 8
🐛 Debug mode: ON
📋 Environment: production
🔍 Debug logging enabled
📋 Available tools:
   1. agent_manage - [agent_manage] [代理管理] [CMMI代理] [创建代理] [团队管理]
   2. task_analyze - [task_analyze] [任务分析] [CMMI分析] [复杂度评估] [项目分析]
   3. workflow_execute - [workflow_execute] [工作流执行] [CMMI工作流] [执行流程] [多代理协作]
   4. intelligent_translate - [intelligent_translate] [智能翻译] [CMMI翻译] [文档转换] [翻译工具]
   5. config_validate - [config_validate] [配置验证] [CMMI配置] [项目初始化] [环境设置]
   6. quality_analyze - [quality_analyze] [质量分析] [CMMI质量] [代码审查] [质量检查]
   7. model_schedule - [model_schedule] [模型调度] [CMMI调度] [AI资源] [模型管理]
   8. system_diagnosis - [system_diagnosis] [系统诊断] [CMMI诊断] [系统检查] [健康监控]
============================================================
✅ CMMI Specs MCP Server v0.1.6 connected and ready!
🔗 [DEBUG] Transport: StdioServerTransport
📡 [DEBUG] Ready notification sent to client
```

### 工具调用详情
```
🔧 [DEBUG] Tool call: agent_manage
📊 [DEBUG] Arguments: {
  "action": "create",
  "name": "frontend-developer",
  "description": "Create a frontend developer agent",
  "capabilities": ["react", "typescript", "css"]
}
⏰ [DEBUG] Timestamp: 2025-08-14T02:46:15.456Z
🎯 [DEBUG] Auto-detected project path: /Users/username/project
⚡ [DEBUG] Executing tool: agent_manage
✅ [DEBUG] Tool agent_manage completed in 245ms
📊 [DEBUG] Result size: 1532 characters
📄 [DEBUG] Result preview: {
  "success": true,
  "agent": {
    "name": "frontend-developer",
    "description": "Create a frontend developer agent",
    "capabilities": ["react", "typescript", "css"]
  }
}...
```

### 错误调试信息
```
❌ [DEBUG] Tool task_analyze failed after 123ms
💥 [DEBUG] Error details: Error: Invalid project path specified
```

## 📂 日志文件位置

调试日志会输出到：
- **控制台**: 实时显示（stderr）
- **日志文件**: `logs/combined.log` 和 `logs/error.log`
- **VS Code输出面板**: MCP服务器日志

## 🎯 使用建议

### 开发调试时
```json
"env": {
  "NODE_ENV": "development",
  "LOG_LEVEL": "debug", 
  "DEBUG_MCP": "true"
}
```

### 生产环境
```json
"env": {
  "NODE_ENV": "production",
  "LOG_LEVEL": "info"
}
```

### 性能分析
启用调试模式可以看到每个工具的执行时间，帮助优化性能。

## 🔍 常见调试场景

### 1. 工具不被触发
检查唤醒词是否匹配，查看调试日志中的工具列表。

### 2. 工具执行错误
查看详细的错误信息和参数传递。

### 3. 性能问题
监控工具执行时间，识别慢速操作。

### 4. 路径问题
查看自动检测的项目路径是否正确。

## ⚡ 快速调试命令

重新启动带调试的MCP服务器：
```bash
# 停止当前服务器
pkill -f "cmmi-specs-mcp"

# 启动调试模式
DEBUG_MCP=true npx cmmi-specs-mcp@0.1.6 start
```
