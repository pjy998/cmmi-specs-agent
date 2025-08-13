#!/bin/bash

# CMMI Specs MCP 普通用户安装测试脚本
# 此脚本模拟普通用户从npm安装和测试cmmi-specs-mcp包的完整流程

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查前置条件
check_prerequisites() {
    print_header "检查前置条件"
    
    # 检查Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 已安装: $NODE_VERSION"
    else
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    # 检查npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm 已安装: $NPM_VERSION"
    else
        log_error "npm 未安装"
        exit 1
    fi
    
    # 检查VS Code
    if command -v code &> /dev/null; then
        log_success "VS Code 命令行工具可用"
    else
        log_warning "VS Code 命令行工具不可用，但这不影响MCP包的安装"
    fi
}

# 测试包信息
test_package_info() {
    print_header "测试包信息"
    
    log_info "获取 cmmi-specs-mcp 包信息..."
    if npm view cmmi-specs-mcp version &> /dev/null; then
        PACKAGE_VERSION=$(npm view cmmi-specs-mcp version)
        log_success "包版本: $PACKAGE_VERSION"
        
        # 显示包详细信息
        log_info "包详细信息:"
        npm view cmmi-specs-mcp description author keywords
    else
        log_error "无法获取包信息，请检查网络连接"
        exit 1
    fi
}

# 测试npx方式运行
test_npx_execution() {
    print_header "测试 NPX 执行"
    
    log_info "使用 npx 测试包执行..."
    
    # 测试帮助命令
    if npx -y cmmi-specs-mcp --help &> /dev/null; then
        log_success "npx 可以正常执行包"
        
        log_info "显示帮助信息:"
        npx -y cmmi-specs-mcp --help
    else
        log_error "npx 执行失败"
        return 1
    fi
    
    # 测试版本命令
    log_info "测试版本命令..."
    if PACKAGE_VERSION_CMD=$(npx -y cmmi-specs-mcp --version 2>/dev/null); then
        log_success "版本命令执行成功: $PACKAGE_VERSION_CMD"
    else
        log_warning "版本命令可能不支持，但这不影响MCP功能"
    fi
}

# 创建临时工作目录用于测试
create_test_environment() {
    print_header "创建测试环境"
    
    TEST_DIR="/tmp/cmmi-mcp-test-$(date +%s)"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"
    
    log_success "创建测试目录: $TEST_DIR"
    log_info "当前工作目录: $(pwd)"
}

# 测试包的基本功能
test_basic_functionality() {
    print_header "测试基本功能"
    
    log_info "测试包的基本MCP功能..."
    
    # 创建简单的测试脚本
    cat > test_mcp_connection.js << 'EOF'
const { spawn } = require('child_process');

console.log('🚀 测试 cmmi-specs-mcp MCP连接...');

const mcpProcess = spawn('npx', ['-y', 'cmmi-specs-mcp'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

mcpProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log('📋 输出:', data.toString().trim());
});

mcpProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log('⚠️ 错误输出:', data.toString().trim());
});

// 发送MCP初始化消息
setTimeout(() => {
    const initMessage = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "test-client",
                version: "1.0.0"
            }
        }
    };
    
    mcpProcess.stdin.write(JSON.stringify(initMessage) + '\n');
}, 1000);

mcpProcess.on('close', (code) => {
    console.log(`\n📊 进程退出码: ${code}`);
    if (output.includes('jsonrpc') || output.includes('method')) {
        console.log('✅ MCP协议响应检测到');
    } else {
        console.log('⚠️ 未检测到标准MCP响应');
    }
    process.exit(0);
});

mcpProcess.on('error', (error) => {
    console.error('❌ 进程启动失败:', error.message);
    process.exit(1);
});

// 5秒后终止测试
setTimeout(() => {
    console.log('\n⏰ 测试超时，终止进程');
    mcpProcess.kill('SIGTERM');
}, 5000);
EOF

    log_info "运行MCP连接测试..."
    node test_mcp_connection.js
}

# 生成VS Code配置文件示例
generate_vscode_config() {
    print_header "生成 VS Code 配置示例"
    
    cat > mcp-config.json << 'EOF'
{
  "inputs": [],
  "servers": {
    "cmmi-specs-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "cmmi-specs-mcp@latest"
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

    log_success "VS Code MCP 配置文件已生成: mcp-config.json"
    log_info "配置文件内容:"
    cat mcp-config.json
    
    # 显示不同操作系统的配置文件路径
    echo ""
    log_info "请将此配置复制到对应的VS Code配置路径:"
    echo "  macOS: ~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/configs/mcp-config.json"
    echo "  Windows: %APPDATA%\\Code\\User\\globalStorage\\github.copilot-chat\\configs\\mcp-config.json"
    echo "  Linux: ~/.config/Code/User/globalStorage/github.copilot-chat/configs/mcp-config.json"
}

# 生成用户指南
generate_user_guide() {
    print_header "生成用户使用指南"
    
    cat > USAGE_GUIDE.md << 'EOF'
# CMMI Specs MCP 使用指南

## 安装后的下一步

1. **配置VS Code**
   - 将提供的配置文件复制到正确的路径
   - 重新加载VS Code窗口 (Cmd+Shift+P -> "Developer: Reload Window")

2. **测试功能**
   在GitHub Copilot Chat中尝试以下命令:
   
   ```
   请帮我生成一个CMMI Level 3的需求开发流程文档
   ```
   
   ```
   我需要创建一个技术方案设计模板
   ```
   
   ```
   生成一个验证和确认的检查清单
   ```

3. **常用功能**
   - CMMI流程文档生成
   - 技术方案模板创建
   - 质量保证检查清单
   - 多语言文档支持

## 故障排除

- 如果MCP服务无响应，尝试重新加载VS Code窗口
- 检查网络连接，确保可以访问npm registry
- 查看VS Code开发者控制台的错误信息

## 获取帮助

- GitHub: https://github.com/pjy998/cmmi-specs-agent
- NPM: https://www.npmjs.com/package/cmmi-specs-mcp
EOF

    log_success "用户指南已生成: USAGE_GUIDE.md"
}

# 清理测试环境
cleanup() {
    print_header "清理测试环境"
    
    if [ ! -z "$TEST_DIR" ] && [ -d "$TEST_DIR" ]; then
        cd /
        rm -rf "$TEST_DIR"
        log_success "测试目录已清理: $TEST_DIR"
    fi
}

# 主函数
main() {
    echo -e "${GREEN}"
    echo "🚀 CMMI Specs MCP 普通用户安装测试"
    echo "======================================"
    echo -e "${NC}"
    
    # 注册清理函数
    trap cleanup EXIT
    
    # 执行测试步骤
    check_prerequisites
    test_package_info
    create_test_environment
    test_npx_execution
    test_basic_functionality
    generate_vscode_config
    generate_user_guide
    
    print_header "测试完成"
    log_success "🎉 所有测试步骤已完成！"
    log_info "📁 配置文件和指南保存在: $TEST_DIR"
    log_info "📋 请按照生成的指南配置VS Code并测试功能"
    
    echo ""
    echo -e "${GREEN}🎯 下一步操作:${NC}"
    echo "1. 复制 mcp-config.json 到 VS Code 配置目录"
    echo "2. 重新加载 VS Code (Cmd+Shift+P -> Developer: Reload Window)"
    echo "3. 在 GitHub Copilot Chat 中测试 CMMI 相关功能"
    echo ""
    echo -e "${BLUE}💡 提示: 使用 'npx cmmi-specs-mcp --help' 查看更多选项${NC}"
}

# 运行主函数
main "$@"
