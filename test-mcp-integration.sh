#!/bin/bash

# MCP工具验证测试
echo "🚀 MCP工具验证测试开始"
echo "============================="

# 1. 检查MCP服务器进程
echo "1. 检查MCP服务器进程状态："
if pgrep -f "cmmi-specs-mcp" > /dev/null; then
    echo "✅ MCP服务器正在运行"
    ps aux | grep -E "cmmi-specs" | grep -v grep | head -3
else
    echo "❌ MCP服务器未运行"
    exit 1
fi

echo ""

# 2. 验证VS Code MCP配置
echo "2. 验证VS Code MCP配置："
mcp_config="$HOME/Library/Application Support/Code/User/mcp.json"
if [ -f "$mcp_config" ]; then
    echo "✅ MCP配置文件存在"
    jq '.servers."cmmi-specs-mcp".command' "$mcp_config" 2>/dev/null || echo "配置格式可能有问题"
else
    echo "❌ MCP配置文件不存在"
fi

echo ""

# 3. 检查npm包版本
echo "3. 检查npm包版本："
echo "当前配置的版本：$(jq -r '.servers."cmmi-specs-mcp".args[1]' "$mcp_config" 2>/dev/null)"
echo "最新发布版本："
npm view cmmi-specs-mcp version 2>/dev/null || echo "无法获取版本信息"

echo ""

# 4. VS Code Chat测试提示
echo "4. VS Code Copilot Chat测试建议："
echo "==============================================="
echo "请在VS Code的Chat面板中尝试以下测试："
echo ""
echo "🧪 基础功能测试："
echo "1. 请帮我分析一个任务的复杂度"
echo "2. 请创建一个新的CMMI代理"
echo "3. 请执行质量分析"
echo ""
echo "🔍 期望结果："
echo "- Chat应该能识别CMMI相关请求"
echo "- 应该调用相应的MCP工具"
echo "- 返回结构化的分析结果"
echo ""
echo "❌ 如果没有调用MCP工具："
echo "- 检查VS Code版本是否支持MCP"
echo "- 重新加载VS Code窗口"
echo "- 查看VS Code输出面板的MCP日志"
echo ""
echo "✅ 8个可用的MCP工具："
echo "1. agent_manage - 代理管理"
echo "2. task_analyze - 任务分析"
echo "3. workflow_execute - 工作流执行"
echo "4. intelligent_translate - 智能翻译"
echo "5. config_validate - 配置验证"
echo "6. quality_analyze - 质量分析" 
echo "7. model_schedule - 模型调度"
echo "8. system_diagnosis - 系统诊断"
echo ""
echo "🎯 测试完成！请在VS Code Chat中验证MCP工具调用"
