#!/bin/bash

# MCP工具测试运行脚本
# 快速检查和运行MCP工具测试

echo "🚀 MCP工具测试启动器"
echo "===================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查当前目录
if [ ! -f "mcp-server/package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    echo "   当前目录应包含 mcp-server/ 文件夹"
    exit 1
fi

echo -e "${YELLOW}📁 工作目录: $(pwd)${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js版本: $NODE_VERSION${NC}"

# 检查依赖
echo -e "${YELLOW}🔍 检查MCP服务器依赖...${NC}"
if [ ! -d "mcp-server/node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖包...${NC}"
    cd mcp-server
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${GREEN}✅ 依赖包已安装${NC}"
fi

# 检查构建
echo -e "${YELLOW}🔧 检查MCP服务器构建...${NC}"
if [ ! -f "mcp-server/dist/server.js" ]; then
    echo -e "${YELLOW}🏗️  构建MCP服务器...${NC}"
    cd mcp-server
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "${GREEN}✅ MCP服务器已构建${NC}"
fi

# 创建输出目录
if [ ! -d "test-output" ]; then
    mkdir -p test-output
    echo -e "${GREEN}✅ 创建输出目录: test-output${NC}"
fi

# 运行测试
echo -e "\n${YELLOW}🧪 运行MCP工具测试...${NC}"
echo "================================"

node tests/mcp-client-test.js

TEST_EXIT_CODE=$?

echo -e "\n================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试完成！${NC}"
    
    # 显示报告位置
    if [ -f "test-output/mcp-protocol-test-report.json" ]; then
        echo -e "${GREEN}📄 详细报告: test-output/mcp-protocol-test-report.json${NC}"
        
        # 显示简要统计
        TOTAL=$(grep '"total_tests"' test-output/mcp-protocol-test-report.json | grep -o '[0-9]*')
        PASSED=$(grep '"passed_tests"' test-output/mcp-protocol-test-report.json | grep -o '[0-9]*')
        FAILED=$(grep '"failed_tests"' test-output/mcp-protocol-test-report.json | grep -o '[0-9]*')
        
        echo -e "${GREEN}📊 测试统计: $PASSED/$TOTAL 通过，$FAILED 失败${NC}"
    fi
else
    echo -e "${RED}❌ 测试过程中出现错误${NC}"
    exit 1
fi

echo -e "\n${YELLOW}💡 提示:${NC}"
echo "• 如需重新构建: cd mcp-server && npm run build"
echo "• 如需重新安装依赖: cd mcp-server && npm install"
echo "• 查看详细日志: 检查 test-output/mcp-protocol-test-report.json"
echo "• 查看生成的文档: ls -la test-output/docs/feature/"
