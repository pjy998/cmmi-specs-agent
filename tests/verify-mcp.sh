#!/bin/bash

# MCP 配置验证脚本
echo "🔧 MCP工具配置验证"
echo "==================="

# 检查Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js 未安装"
    exit 1
fi

# 检查npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm 未安装"
    exit 1
fi

# 检查MCP服务器构建
MCP_SERVER_PATH="/Users/pengjiebin/Documents/GitHub/cmmi-specs-agent/mcp-server/dist/server.js"
if [ -f "$MCP_SERVER_PATH" ]; then
    echo "✅ MCP服务器已构建: $MCP_SERVER_PATH"
else
    echo "❌ MCP服务器未构建"
    exit 1
fi

# 检查VS Code配置
VSCODE_CONFIG_PATH="$HOME/Library/Application Support/Code/User/mcp.json"
if [ -f "$VSCODE_CONFIG_PATH" ]; then
    echo "✅ VS Code MCP配置已创建: $VSCODE_CONFIG_PATH"
    
    # 验证配置文件内容
    if grep -q "pengjiebin" "$VSCODE_CONFIG_PATH"; then
        echo "✅ 配置文件路径已更新为当前用户"
    else
        echo "⚠️  配置文件路径可能需要更新"
    fi
else
    echo "❌ VS Code MCP配置未创建"
    exit 1
fi

# 检查VS Code应用
if [ -d "/Applications/Visual Studio Code.app" ]; then
    echo "✅ VS Code 已安装"
else
    echo "❌ VS Code 未安装"
fi

echo ""
echo "🎉 配置验证完成！"
echo ""
echo "📋 下一步操作："
echo "1. 在VS Code中安装以下扩展："
echo "   - GitHub Copilot"
echo "   - GitHub Copilot Chat"
echo ""
echo "2. 重启VS Code"
echo ""
echo "3. 在Copilot Chat中测试："
echo "   输入: cmmi_init"
echo ""
echo "🔧 可用的MCP工具："
echo "   - task_analyze: 分析任务复杂度"
echo "   - cmmi_init: 初始化CMMI代理"
echo "   - agent_create: 创建新代理"
echo "   - workflow_execute: 执行工作流"
echo "   - agent_list: 列出所有代理"
echo "   - config_validate: 验证配置"
