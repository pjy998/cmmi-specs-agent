#!/bin/bash

# CMMI Specs Agent VS Code MCP 安装脚本
# 支持本地和NPX两种安装模式

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

# 检测安装模式和获取项目路径
if [[ "$0" == *"npx"* ]] || [[ "$0" == *"_npx"* ]] || [[ ! -d "$(dirname "${BASH_SOURCE[0]}")/mcp-server" ]]; then
    print_info "NPX 模式安装"
    
    # 在临时目录中安装包以获取完整文件结构
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    print_info "正在下载完整包..."
    if ! npm install cmmi-specs-mcp --no-save >/dev/null 2>&1; then
        print_error "无法下载 cmmi-specs-mcp 包"
        exit 1
    fi
    
    PROJECT_ROOT="$TEMP_DIR/node_modules/cmmi-specs-mcp"
    print_info "包路径: $PROJECT_ROOT"
    
    # 确保MCP服务器构建
    print_info "正在构建 MCP 服务器..."
    cd "$PROJECT_ROOT/mcp-server"
    
    # 安装依赖并构建
    if ! npm install >/dev/null 2>&1; then
        print_error "安装MCP服务器依赖失败"
        exit 1
    fi
    
    if ! npm run build >/dev/null 2>&1; then
        print_error "构建MCP服务器失败"
        exit 1
    fi
    
else
    print_info "本地模式安装"
    PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    print_info "项目根目录: $PROJECT_ROOT"
    
    # 确保本地构建是最新的
    if [ ! -d "$PROJECT_ROOT/mcp-server/dist" ]; then
        print_info "正在构建 MCP 服务器..."
        cd "$PROJECT_ROOT"
        npm run build >/dev/null 2>&1 || {
            print_error "构建失败，请运行: npm run build"
            exit 1
        }
    fi
fi

MCP_SERVER_PATH="$PROJECT_ROOT/mcp-server/dist/server.js"

# 验证MCP服务器文件存在
if [ ! -f "$MCP_SERVER_PATH" ]; then
    print_error "MCP服务器文件不存在: $MCP_SERVER_PATH"
    exit 1
fi

print_success "MCP服务器准备就绪: $MCP_SERVER_PATH"

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

# MCP配置
MCP_CONFIG='{
  "mcpServers": {
    "cmmi-specs-mcp": {
      "command": "node",
      "args": ["'$MCP_SERVER_PATH'"],
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
print_info "MCP服务器: $MCP_SERVER_PATH"

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

# 清理临时目录 (NPX模式)
if [[ "$0" == *"npx"* ]] || [[ "$0" == *"_npx"* ]]; then
    cd /
    rm -rf "$TEMP_DIR" 2>/dev/null || true
fi

print_success "安装完成！🎉"
