
=== MCP服务热重载指南 ===

✅ 无需重启VS Code的MCP服务更新方法:

1. 使用VS Code命令面板:
   - 按 Cmd+Shift+P (macOS) 或 Ctrl+Shift+P (Windows/Linux)
   - 输入: "Developer: Reload Window"
   - 这将重新加载窗口但保持会话状态

2. 通过设置重新加载MCP配置:
   - 打开设置 (Cmd+,)
   - 搜索 "mcp" 或 "Model Context Protocol"
   - 修改任何MCP相关设置然后撤销，这会触发重新加载

3. 使用GitHub Copilot Chat命令:
   - 在聊天窗口输入: /reset
   - 这会重置聊天上下文但不会丢失文件缓冲区

4. 热重载MCP服务器代码:
   - 修改mcp-server/src目录下的代码
   - 运行: npm run build (在mcp-server目录)
   - MCP会自动检测文件变化并重新加载

✅ 保持聊天会话的技巧:
- 定期保存重要的聊天内容到文件
- 使用工作区设置保存上下文
- 利用VS Code的自动保存功能

✅ 避免缓冲区混乱:
- 使用 "File: Save All" 保存所有打开的文件
- 定期清理未使用的编辑器标签页
- 使用工作区功能组织项目文件
