#!/bin/bash

# CMMI Specs Agent VS Code MCP 安装脚本
# 统一使用NPX模式

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "🚀 CMMI Specs Agent VS Code MCP 安装程序"
echo "========================================="

# 检测VS Code版本
detect_vscode_version() {
    if command -v code-insiders >/dev/null 2>&1; then
        echo "insiders"
    elif command -v code >/dev/null 2>&1; then
        echo "stable"
    else
        echo "none"
    fi
}

VSCODE_VERSION=$(detect_vscode_version)

if [ "$VSCODE_VERSION" = "none" ]; then
    print_error "未检测到 VS Code 或 VS Code Insiders"
    print_info "请安装 VS Code: https://code.visualstudio.com/"
    exit 1
fi

print_info "检测到 VS Code $VSCODE_VERSION 版本"

print_info "准备配置 NPX 模式的 MCP 服务器..."

# 设置配置目录
if [ "$VSCODE_VERSION" = "insiders" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CONFIG_DIR="$HOME/Library/Application Support/Code - Insiders/User"
    else
        CONFIG_DIR="$HOME/.config/Code - Insiders/User"
    fi
else
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CONFIG_DIR="$HOME/Library/Application Support/Code/User"
    else
        CONFIG_DIR="$HOME/.config/Code/User"
    fi
fi

# 确保配置目录存在
mkdir -p "$CONFIG_DIR"

# 创建或更新settings.json
SETTINGS_FILE="$CONFIG_DIR/settings.json"

# MCP配置 - 使用NPX模式
MCP_CONFIG='{
  "mcpServers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": ["cmmi-specs-mcp@latest", "start"],
      "env": {}
    }
  }
}'

if [ -f "$SETTINGS_FILE" ]; then
    print_info "更新现有的 settings.json"
    
    # 使用Node.js来合并JSON配置
    node -e "
    const fs = require('fs');
    const path = '$SETTINGS_FILE';
    
    let settings = {};
    try {
        const content = fs.readFileSync(path, 'utf8');
        settings = JSON.parse(content);
    } catch (e) {
        console.log('创建新的settings.json');
    }
    
    const mcpConfig = $MCP_CONFIG;
    settings.mcpServers = { ...settings.mcpServers, ...mcpConfig.mcpServers };
    
    fs.writeFileSync(path, JSON.stringify(settings, null, 2));
    console.log('配置已更新');
    "
else
    print_info "创建新的 settings.json"
    echo "$MCP_CONFIG" | node -e "
    const fs = require('fs');
    const input = require('fs').readFileSync(0, 'utf8');
    const config = JSON.parse(input);
    fs.writeFileSync('$SETTINGS_FILE', JSON.stringify(config, null, 2));
    "
fi

print_success "VS Code MCP 配置已完成！"
print_info "配置文件: $SETTINGS_FILE"
print_info "MCP服务器: NPX模式 (cmmi-specs-mcp@latest)"

echo ""
print_info "使用说明："
echo "1. 重启 VS Code"
echo "2. 打开 Copilot Chat"
echo "3. 输入 @cmmi 开始使用 CMMI 工具"
echo ""
print_info "可用命令："
echo "   npx cmmi-specs-mcp start      # 启动 MCP 服务器"
echo "   npx cmmi-specs-mcp validate   # 验证配置"
echo "   npx cmmi-specs-mcp help       # 查看所有命令"

print_success "安装完成！🎉"
