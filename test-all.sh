#!/bin/bash

# CMMI Specs Agent - 统一测试启动器
# 运行所有测试并将输出统一到 test-output 目录

echo "🚀 启动 CMMI Specs Agent 完整测试套件"
echo "=================================================="

# 切换到项目根目录
cd "$(dirname "$0")"

# 运行统一测试
node ./tests/run-all-tests.js

echo "=================================================="
echo "📋 测试完成，查看详细结果："
echo "   📄 统一报告: test-output/unified-test-report.json"
echo "   📁 输出目录: test-output/"
echo "   📑 生成文档: test-output/docs/"
echo "   🤖 代理配置: test-output/agents/"
