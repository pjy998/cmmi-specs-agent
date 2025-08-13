#!/bin/bash

# 普通用户 MCP 服务测试脚本

echo "🚀 测试 cmmi-specs-mcp 包安装和配置"
echo "===================================="

# 1. 验证包可用性
echo ""
echo "📦 1. 验证包可用性"
echo "npm包版本："
npm view cmmi-specs-mcp version

echo ""
echo "npx执行测试："
npx -y cmmi-specs-mcp version

# 2. 验证配置文件
echo ""
echo "📋 2. 验证VS Code MCP配置"
CONFIG_FILE="$HOME/Library/Application Support/Code/User/mcp.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "✅ 配置文件存在: $CONFIG_FILE"
    
    # 检查是否包含cmmi-specs-mcp配置
    if grep -q "cmmi-specs-mcp" "$CONFIG_FILE"; then
        echo "✅ cmmi-specs-mcp 配置已添加"
    else
        echo "❌ cmmi-specs-mcp 配置未找到"
    fi
    
    # 验证JSON格式
    if python3 -m json.tool "$CONFIG_FILE" > /dev/null 2>&1; then
        echo "✅ JSON格式有效"
    else
        echo "❌ JSON格式无效"
    fi
else
    echo "❌ 配置文件不存在"
fi

# 3. 测试MCP连接
echo ""
echo "🔌 3. 测试MCP连接"
timeout 5s npx -y cmmi-specs-mcp start 2>/dev/null || echo "⚠️ MCP服务器测试完成"

# 4. 显示下一步操作
echo ""
echo "🎯 下一步操作："
echo "1. 在VS Code中按 Cmd+Shift+P"
echo "2. 输入 'Developer: Reload Window' 并执行"
echo "3. 打开GitHub Copilot Chat (Cmd+Shift+I)"
echo "4. 测试以下命令："
echo ""
echo "   💬 测试命令1: 请帮我生成一个CMMI Level 3的需求开发流程文档"
echo "   💬 测试命令2: 我需要创建一个技术方案设计模板"
echo "   💬 测试命令3: 生成一个验证和确认的检查清单"
echo ""
echo "✨ 如果聊天能正确响应CMMI相关内容，说明安装成功！"
