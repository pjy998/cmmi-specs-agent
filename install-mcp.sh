#!/bin/bash

# MCP 工具自动安装脚本
# 适用于 macOS - 支持 npx 安装方式

echo "🚀 MCP 工具安装脚本 (支持 npx)"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 打印信息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检测是否通过 npx 运行
detect_npx_mode() {
    if [[ "$0" == *"npx"* ]] || [[ "$NPX_MODE" == "true" ]] || [[ ! -d "mcp-server" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

# 获取项目根目录
get_project_root() {
    if [[ "$(detect_npx_mode)" == "true" ]]; then
        # npx 模式：使用临时目录
        echo "$(npm config get cache)/_npx/$(npm list -g cmmi-specs-agent 2>/dev/null | head -1 | cut -d' ' -f1 || echo 'cmmi-specs-agent')"
    else
        # 本地模式：使用当前目录
        echo "$(pwd)"
    fi
}

PROJECT_ROOT=$(get_project_root)
NPX_MODE=$(detect_npx_mode)

print_info "项目根目录: $PROJECT_ROOT"
print_info "NPX 模式: $NPX_MODE"

echo ""
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

# 根据模式选择构建方式
if [ "$NPX_MODE" = "true" ]; then
    print_info "NPX 模式：使用预构建包"
    
    # 检查是否已经通过 npm 全局安装
    if npm list -g cmmi-specs-mcp >/dev/null 2>&1; then
        print_status 0 "cmmi-specs-mcp 已全局安装"
    else
        print_info "正在安装 cmmi-specs-mcp..."
        npm install -g cmmi-specs-mcp
        if [ $? -eq 0 ]; then
            print_status 0 "cmmi-specs-mcp 安装成功"
        else
            print_status 1 "cmmi-specs-mcp 安装失败"
            exit 1
        fi
    fi
    
    # 获取全局安装路径
    GLOBAL_PATH=$(npm root -g)/cmmi-specs-mcp
    if [ -d "$GLOBAL_PATH" ]; then
        PROJECT_ROOT="$GLOBAL_PATH"
        print_info "使用全局安装路径: $PROJECT_ROOT"
    fi
else
    print_info "本地模式：构建 MCP 服务器"
    
    # 进入 mcp-server 目录
    cd mcp-server
    
    # 安装依赖
    echo "📦 安装 MCP 服务器依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        print_status 1 "依赖安装失败"
        exit 1
    fi
    
    print_status 0 "依赖安装成功"
    
    # 构建项目
    echo "🔨 构建 MCP 服务器..."
    npm run build
    
    if [ $? -ne 0 ]; then
        print_status 1 "构建失败"
        exit 1
    fi
    
    if [ -f "dist/server.js" ]; then
        print_status 0 "MCP 服务器构建成功"
    else
        print_status 1 "MCP 服务器构建失败"
        exit 1
    fi
    
    # 返回上级目录
    cd ..
fi

echo ""
echo "⚙️  配置 MCP..."

# 获取配置路径
if [ "$NPX_MODE" = "true" ]; then
    CONFIG_SOURCE="$PROJECT_ROOT/configs"
    MCP_SERVER_PATH="$PROJECT_ROOT/mcp-server"
else
    CONFIG_SOURCE="configs"
    MCP_SERVER_PATH="$(pwd)/mcp-server"
fi

print_info "配置源目录: $CONFIG_SOURCE"
print_info "MCP 服务器路径: $MCP_SERVER_PATH"

# 更新配置文件中的路径
if [ -f "$CONFIG_SOURCE/mcp-config-insiders.json" ]; then
    # 备份原配置
    cp "$CONFIG_SOURCE/mcp-config-insiders.json" "$CONFIG_SOURCE/mcp-config-insiders.json.backup"
    
    # 创建更新后的配置
    cat "$CONFIG_SOURCE/mcp-config-insiders.json" | \
    sed "s|/Users/jieky/mcp/cmmi-specs-agent|$PROJECT_ROOT|g" | \
    sed "s|\"command\": \"node\"|\"command\": \"node\"|g" | \
    sed "s|\"args\": \[\"dist/server.js\"\]|\"args\": [\"$MCP_SERVER_PATH/dist/server.js\"]|g" > "$CONFIG_SOURCE/mcp-config-insiders-updated.json"
    
    mv "$CONFIG_SOURCE/mcp-config-insiders-updated.json" "$CONFIG_SOURCE/mcp-config-insiders.json"
    print_status 0 "配置文件路径已更新"
else
    print_warning "配置文件 mcp-config-insiders.json 未找到"
fi

# 创建 VS Code 配置目录并复制配置
echo "📋 配置 VS Code..."

# 确定使用哪个 VS Code 版本
if [ "$VSCODE_INSIDERS_INSTALLED" = true ]; then
    VSCODE_CONFIG_DIR="$HOME/Library/Application Support/Code - Insiders/User"
    CONFIG_FILE="mcp-config-insiders.json"
    print_status 0 "使用 VS Code Insiders"
elif [ "$VSCODE_INSTALLED" = true ]; then
    VSCODE_CONFIG_DIR="$HOME/Library/Application Support/Code/User"
    CONFIG_FILE="mcp-config-optimized.json"
    print_status 0 "使用 VS Code"
else
    print_warning "未检测到 VS Code，跳过配置"
    VSCODE_CONFIG_DIR=""
fi

if [ -n "$VSCODE_CONFIG_DIR" ]; then
    # 创建配置目录
    mkdir -p "$VSCODE_CONFIG_DIR"
    
    # 复制 MCP 配置
    if [ -f "$CONFIG_SOURCE/$CONFIG_FILE" ]; then
        cp "$CONFIG_SOURCE/$CONFIG_FILE" "$VSCODE_CONFIG_DIR/mcp.json"
        print_status 0 "MCP 配置已复制到 VS Code ($CONFIG_FILE)"
    else
        print_warning "配置文件 $CONFIG_FILE 未找到"
    fi
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
if [ "$NPX_MODE" = "true" ]; then
    echo "� NPX 使用方式："
    echo "   npx cmmi-specs-mcp start      # 启动 MCP 服务器"
    echo "   npx cmmi-specs-mcp test       # 运行测试"
    echo "   npx cmmi-specs-mcp validate   # 验证配置"
    echo "   npx cmmi-specs-mcp help       # 查看帮助"
    echo ""
fi
echo "�🔧 可用的 MCP 工具："
echo "   - task_analyze: 分析任务复杂度"
echo "   - cmmi_init: 初始化 CMMI 代理"
echo "   - agent_create: 创建新代理"
echo "   - workflow_execute: 执行工作流"
echo "   - agent_list: 列出所有代理"
echo "   - config_validate: 验证配置"
echo "   - intelligent_translate: 智能翻译"
echo "   - smart_agent_generator: 智能代理生成"
echo ""
print_status 0 "MCP 工具安装完成！"
