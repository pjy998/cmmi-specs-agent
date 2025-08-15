#!/bin/bash

# VS Code扩展发布脚本
# 版本: 0.0.1

echo "🚀 开始发布VS Code扩展..."

# 1. 编译扩展
echo "📦 编译扩展..."
npm run compile
if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

# 2. 登录marketplace (需要预先创建发布者)
echo "🔐 登录marketplace..."
echo "请确保已在 https://marketplace.visualstudio.com/manage/publishers/ 创建了发布者 'cmmi-specs'"
npx vsce login cmmi-specs

# 3. 发布扩展
echo "📤 发布扩展..."
npx vsce publish

echo "✅ 发布完成!"
echo "📱 可以在这里查看: https://marketplace.visualstudio.com/items?itemName=cmmi-specs.cmmi-specs-vscode"
