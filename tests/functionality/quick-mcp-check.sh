#!/bin/bash

# MCP服务快速验证脚本
# 用于检查MCP服务状态，无需重启VS Code

echo "🚀 快速检查MCP服务状态..."
echo "=================================="

# 检查配置文件
echo "📋 检查MCP配置..."
if [ -f "configs/mcp-config-insiders.json" ]; then
    echo "✅ MCP配置文件存在"
    # 检查配置中是否包含我们的服务
    if grep -q "cmmi-specs-agent" configs/mcp-config-insiders.json; then
        echo "✅ CMMI Specs Agent 配置已找到"
    else
        echo "❌ CMMI Specs Agent 配置未找到"
    fi
else
    echo "❌ MCP配置文件不存在"
fi

# 检查服务器构建
echo ""
echo "🏗️ 检查服务器构建..."
if [ -f "mcp-server/dist/server.js" ]; then
    echo "✅ 服务器已构建"
else
    echo "❌ 服务器未构建，运行: cd mcp-server && npm run build"
fi

# 检查Node.js进程
echo ""
echo "🔍 检查运行中的MCP相关进程..."
MCP_PROCESSES=$(ps aux | grep -E "(mcp|cmmi)" | grep -v grep | grep -v "test-mcp")
if [ ! -z "$MCP_PROCESSES" ]; then
    echo "✅ 发现MCP相关进程:"
    echo "$MCP_PROCESSES"
else
    echo "⚠️ 未发现运行中的MCP进程"
fi

# 测试NPX包
echo ""
echo "📦 测试NPX包可用性..."
if npx -y @upstash/context7-mcp@latest --help >/dev/null 2>&1; then
    echo "✅ NPX包可以正常使用"
else
    echo "❌ NPX包有问题"
fi

echo ""
echo "=================================="
echo "🎯 VS Code MCP热重载建议:"
echo ""
echo "1. 使用命令面板 (Cmd+Shift+P):"
echo "   - 搜索并执行 'Developer: Reload Window'"
echo "   - 这会重新加载窗口但保持大部分状态"
echo ""
echo "2. 重新加载MCP配置:"
echo "   - 在VS Code中按 Cmd+, 打开设置"
echo "   - 搜索 'mcp' 找到MCP相关设置"
echo "   - 任意修改一个设置然后撤销，触发重新加载"
echo ""
echo "3. 保持聊天会话:"
echo "   - 使用 /reset 命令重置聊天但保持上下文"
echo "   - 定期保存重要对话内容"
echo ""
echo "4. 避免缓冲区混乱:"
echo "   - 使用 Cmd+K S 保存所有文件"
echo "   - 关闭不需要的编辑器标签页"
echo ""
echo "✨ 完成！现在您可以在不完全重启VS Code的情况下验证MCP服务"
