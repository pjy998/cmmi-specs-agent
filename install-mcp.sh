#!/bin/bash

# MCP 工具自动安装脚本
# 适用于 macOS

echo "🚀 MCP 工具安装脚本"
echo "===================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 打印状态
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 打印警告
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📋 检查系统环境..."

# 检查 Homebrew
if command_exists brew; then
    print_status 0 "Homebrew 已安装"
    BREW_INSTALLED=true
else
    print_status 1 "Homebrew 未安装"
    BREW_INSTALLED=false
fi

# 检查 Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js 已安装 ($NODE_VERSION)"
    NODE_INSTALLED=true
else
    print_status 1 "Node.js 未安装"
    NODE_INSTALLED=false
fi

# 检查 npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm 已安装 ($NPM_VERSION)"
    NPM_INSTALLED=true
else
    print_status 1 "npm 未安装"
    NPM_INSTALLED=false
fi

# 检查 VS Code
if command_exists code; then
    CODE_VERSION=$(code --version | head -n 1)
    print_status 0 "VS Code 已安装 ($CODE_VERSION)"
    VSCODE_INSTALLED=true
else
    print_status 1 "VS Code 未安装"
    VSCODE_INSTALLED=false
fi

# 检查 VS Code Insiders
if command_exists code-insiders; then
    print_status 0 "VS Code Insiders 已安装"
    VSCODE_INSIDERS_INSTALLED=true
else
    print_status 1 "VS Code Insiders 未安装"
    VSCODE_INSIDERS_INSTALLED=false
fi

echo ""
echo "🔧 开始安装缺失的组件..."

# 安装 Homebrew
if [ "$BREW_INSTALLED" = false ]; then
    echo "📦 安装 Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 添加 Homebrew 到 PATH (M1 Mac)
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    if command_exists brew; then
        print_status 0 "Homebrew 安装成功"
    else
        print_status 1 "Homebrew 安装失败"
        exit 1
    fi
fi

# 安装 Node.js
if [ "$NODE_INSTALLED" = false ]; then
    echo "📦 安装 Node.js..."
    if [ "$BREW_INSTALLED" = true ] || command_exists brew; then
        brew install node
    else
        print_warning "请手动安装 Node.js: https://nodejs.org/"
        exit 1
    fi
    
    if command_exists node; then
        print_status 0 "Node.js 安装成功"
    else
        print_status 1 "Node.js 安装失败"
        exit 1
    fi
fi

# 检查是否安装了任一版本的 VS Code
if [ "$VSCODE_INSTALLED" = false ] && [ "$VSCODE_INSIDERS_INSTALLED" = false ]; then
    echo "📦 安装 VS Code..."
    if [ "$BREW_INSTALLED" = true ] || command_exists brew; then
        brew install --cask visual-studio-code
    else
        print_warning "请手动安装 VS Code: https://code.visualstudio.com/"
    fi
fi

echo ""
echo "🔨 构建 MCP 服务器..."

# 进入 MCP 服务器目录
cd "$(dirname "$0")/mcp-server" || {
    echo "❌ 无法进入 mcp-server 目录"
    exit 1
}

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ -f "dist/server.js" ]; then
    print_status 0 "MCP 服务器构建成功"
else
    print_status 1 "MCP 服务器构建失败"
    exit 1
fi

echo ""
echo "⚙️  配置 MCP..."

# 获取当前用户路径
CURRENT_USER_PATH=$(pwd | sed 's|/mcp-server||')

# 更新配置文件中的路径
if [ -f "../mcp-config-insiders.json" ]; then
    # 备份原配置
    cp "../mcp-config-insiders.json" "../mcp-config-insiders.json.backup"
    
    # 更新路径
    sed "s|/Users/jieky/mcp/cmmi-specs-agent|$CURRENT_USER_PATH|g" "../mcp-config-insiders.json" > "../mcp-config-insiders-updated.json"
    mv "../mcp-config-insiders-updated.json" "../mcp-config-insiders.json"
    
    print_status 0 "配置文件路径已更新"
fi

# 创建 VS Code 配置目录并复制配置
echo "📋 配置 VS Code..."

# 确定使用哪个 VS Code 版本
if [ "$VSCODE_INSIDERS_INSTALLED" = true ]; then
    VSCODE_CONFIG_DIR="$HOME/Library/Application Support/Code - Insiders/User"
    print_status 0 "使用 VS Code Insiders"
elif [ "$VSCODE_INSTALLED" = true ]; then
    VSCODE_CONFIG_DIR="$HOME/Library/Application Support/Code/User"
    print_status 0 "使用 VS Code"
else
    print_warning "未检测到 VS Code，跳过配置"
    VSCODE_CONFIG_DIR=""
fi

if [ -n "$VSCODE_CONFIG_DIR" ]; then
    # 创建配置目录
    mkdir -p "$VSCODE_CONFIG_DIR"
    
    # 复制 MCP 配置
    cp "../mcp-config-insiders.json" "$VSCODE_CONFIG_DIR/mcp.json"
    print_status 0 "MCP 配置已复制到 VS Code"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📝 下一步操作："
echo "1. 重启 VS Code"
echo "2. 确保安装了以下扩展："
echo "   - GitHub Copilot"
echo "   - GitHub Copilot Chat"
echo "3. 在 Copilot Chat 中测试 MCP 工具："
echo "   输入: cmmi_init"
echo ""
echo "🔧 可用的 MCP 工具："
echo "   - task_analyze: 分析任务复杂度"
echo "   - cmmi_init: 初始化 CMMI 代理"
echo "   - agent_create: 创建新代理"
echo "   - workflow_execute: 执行工作流"
echo "   - agent_list: 列出所有代理"
echo "   - config_validate: 验证配置"
echo ""
print_status 0 "MCP 工具安装完成！"
