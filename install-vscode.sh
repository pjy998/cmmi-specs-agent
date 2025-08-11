#!/bin/bash

# CMMI Specs Agen# VS Code设置文件路径
VSCODE_SETTINGS="$HOME/.vscode/settings.json"
VSCODE_INSIDERS_MCP="$HOME/Library/Application Support/Code - Insiders/User/mcp.json"

# 检查是否使用VS Code Insiders
USING_INSIDERS=false
if [ -d "$HOME/Library/Application Support/Code - Insiders" ]; then
    echo "📱 检测到VS Code Insiders，将配置MCP服务器"
    USING_INSIDERS=true
fi

# 备份现有设置
if [ "$USING_INSIDERS" = true ] && [ -f "$VSCODE_INSIDERS_MCP" ]; then
    BACKUP_FILE="$VSCODE_INSIDERS_MCP.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 备份现有VS Code Insiders MCP配置到: $BACKUP_FILE"
    cp "$VSCODE_INSIDERS_MCP" "$BACKUP_FILE"
elif [ -f "$VSCODE_SETTINGS" ]; then
    BACKUP_FILE="$VSCODE_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 备份现有VS Code设置到: $BACKUP_FILE"
    cp "$VSCODE_SETTINGS" "$BACKUP_FILE"
else
    echo "📝 VS Code设置文件不存在，将创建新文件"
    mkdir -p "$HOME/.vscode"
fiP 安装脚本
# 此脚本会卸载旧版本并安装新版本

echo "🚀 CMMI Specs Agent VS Code MCP 安装程序"
echo "========================================="

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
MCP_SERVER_PATH="$PROJECT_ROOT/mcp-server/dist/server.js"

echo "📁 项目根目录: $PROJECT_ROOT"
echo "🔧 MCP服务器路径: $MCP_SERVER_PATH"

# 检查MCP服务器是否已构建
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "🔨 MCP服务器未构建，正在构建..."
    cd "$PROJECT_ROOT/mcp-server"
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 构建失败！请检查错误信息。"
        exit 1
    fi
    echo "✅ MCP服务器构建成功"
else
    echo "✅ MCP服务器已存在"
fi

# VS Code设置文件路径
VSCODE_SETTINGS="$HOME/.vscode/settings.json"

# 备份现有设置
if [ -f "$VSCODE_SETTINGS" ]; then
    BACKUP_FILE="$VSCODE_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
    echo "� 备份现有VS Code设置到: $BACKUP_FILE"
    cp "$VSCODE_SETTINGS" "$BACKUP_FILE"
else
    echo "� VS Code设置文件不存在，将创建新文件"
    mkdir -p "$HOME/.vscode"
fi

# 创建新的VS Code配置
echo "🔧 配置VS Code MCP设置..."

if [ "$USING_INSIDERS" = true ]; then
    # 为VS Code Insiders创建mcp.json配置
    cat > "$VSCODE_INSIDERS_MCP" << EOF
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
                "cmmi-specs-agent": {
                        "command": "node",
                        "args": [
                                "$MCP_SERVER_PATH"
                        ],
                        "type": "stdio",
                        "env": {
                                "NODE_ENV": "production",
                                "LOG_LEVEL": "info"
                        }
                }
        }
}
EOF
    echo "✅ VS Code Insiders MCP配置已更新"
else
    # 为普通VS Code创建settings.json配置
    cat > "$VSCODE_SETTINGS" << EOF
{
  "mcp.servers": {
    "cmmi-specs-agent": {
      "command": "node",
      "args": [
        "$MCP_SERVER_PATH"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  },
  "github.copilot.chat.experimental.codeGeneration.instructions": [
    {
      "text": "When working with CMMI software development workflows, use the cmmi-specs-agent MCP server to create requirements analysis, system design, coding, testing, and documentation agents following CMMI best practices."
    }
  ],
  "github.copilot.chat.experimental.agentSettings": {
    "cmmi-specs-agent": {
      "enabled": true,
      "description": "CMMI规格代理系统 - 支持需求分析、系统设计、代码实现、测试和文档生成的完整软件开发流程"
    }
  }
}
EOF
    echo "✅ VS Code配置已更新"
fi

# 创建工作区配置文件
WORKSPACE_SETTINGS="$PROJECT_ROOT/.vscode/settings.json"
mkdir -p "$PROJECT_ROOT/.vscode"

cat > "$WORKSPACE_SETTINGS" << EOF
{
  "mcp.servers": {
    "cmmi-specs-agent": {
      "command": "node",
      "args": [
        "\${workspaceFolder}/mcp-server/dist/server.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true
}
EOF

echo "✅ 工作区配置已创建"

# 测试MCP服务器
echo "🧪 测试MCP服务器..."
cd "$PROJECT_ROOT/tests"
if [ -f "quick-mcp-validation.js" ]; then
    node quick-mcp-validation.js
    if [ $? -eq 0 ]; then
        echo "✅ MCP服务器测试通过"
    else
        echo "⚠️  MCP服务器测试失败，但安装仍可继续"
    fi
else
    echo "⚠️  测试脚本不存在，跳过测试"
fi

echo ""
echo "🎉 安装完成！"
echo "========================================="
if [ "$USING_INSIDERS" = true ]; then
    echo "📋 VS Code Insiders 接下来的步骤："
    echo "1. 重启VS Code Insiders"
    echo "2. 确保已安装GitHub Copilot扩展"
    echo "3. 在VS Code Insiders中打开此项目"
    echo "4. 打开Copilot Chat，查看MCP服务器状态"
    echo "5. 使用MCP工具: 在Chat中输入工具名称如 'cmmi_init'"
else
    echo "📋 VS Code 接下来的步骤："
    echo "1. 重启VS Code"
    echo "2. 确保已安装GitHub Copilot扩展"
    echo "3. 在VS Code中打开此项目"
    echo "4. 在Copilot Chat中输入 @cmmi-specs-agent 来使用CMMI工具"
fi
echo ""
echo "🔧 可用的MCP工具："
echo "   - task_analyze: 任务分析"
echo "   - cmmi_init: 初始化CMMI代理"
echo "   - agent_create: 创建自定义代理"
echo "   - workflow_execute: 执行多代理工作流"
echo "   - agent_list: 列出所有代理"
echo "   - config_validate: 验证配置"
echo ""
echo "📖 详细使用说明请参考: README.md 和 USAGE_GUIDE.md"
echo ""
