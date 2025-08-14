# MCP工具测试指南

## 当前状态
✅ MCP服务器已启动 (进程ID: 40010)
✅ 发现了8个工具
✅ VS Code配置正确

## 测试步骤

### 1. 在VS Code Copilot Chat中测试MCP工具

请在VS Code的Chat面板中尝试以下命令来测试MCP功能：

**测试代理管理工具：**
```
请帮我创建一个新的CMMI代理
```

**测试项目分析工具：**
```
请分析这个任务的复杂度和所需代理
```

**测试工作流执行：**
```
请执行一个多代理工作流来分析项目需求
```

### 2. 预期的8个MCP工具

根据我们的实现，应该包含以下工具：
1. `mcp_cmmi-specs-mc_agent_manage` - 代理管理
2. `mcp_cmmi-specs-mc_config_validate` - 配置验证  
3. `mcp_cmmi-specs-mc_intelligent_translate` - 智能翻译
4. `mcp_cmmi-specs-mc_model_schedule` - 模型调度
5. `mcp_cmmi-specs-mc_quality_analyze` - 质量分析
6. `mcp_cmmi-specs-mc_system_diagnosis` - 系统诊断
7. `mcp_cmmi-specs-mc_task_analyze` - 任务分析
8. `mcp_cmmi-specs-mc_workflow_execute` - 工作流执行

### 3. 故障排除

如果Chat不能调用MCP工具，请检查：
- 重新加载VS Code窗口 (Cmd+Shift+P -> "Developer: Reload Window")
- 检查VS Code版本是否支持MCP
- 查看VS Code输出面板的MCP日志

### 4. 验证方法

如果MCP工具正常工作，Chat应该能够：
- 识别CMMI相关的请求
- 调用相应的MCP工具
- 返回结构化的响应
- 显示工具调用的结果
