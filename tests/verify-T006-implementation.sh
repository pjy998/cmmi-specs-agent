#!/bin/bash

# T006: 项目创建引擎实现验证脚本
# 验证项目创建功能的完整性

echo "🧪 开始验证 T006: 项目创建引擎实现"
echo "========================================"

# 设置测试目录
TEST_DIR="/tmp/cmmi-test-project-$(date +%s)"
echo "📁 测试目录: $TEST_DIR"

# 清理函数
cleanup() {
    if [ -d "$TEST_DIR" ]; then
        rm -rf "$TEST_DIR"
        echo "🧹 已清理测试目录"
    fi
}

# 设置清理钩子
trap cleanup EXIT

# 构建项目
echo "🔧 构建项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 创建测试项目
echo "🚀 创建测试项目..."
cat > /tmp/test-creation.mjs << EOF
import { ProjectCreationEngine } from '$(pwd)/dist/core/projectCreationEngine.js';

const config = {
    projectName: 'test-cmmi-project',
    projectType: 'software-development',
    targetDirectory: process.argv[2],
    techStack: ['TypeScript', 'Node.js'],
    cmmLevel: 3,
    generateDocs: true
};

try {
    const result = await ProjectCreationEngine.createProject(config);
    if (result.success) {
        console.log('✅ 项目创建成功');
        console.log('📊 创建文件数量:', result.createdFiles.length);
        console.log('🤖 生成代理数量:', result.generatedAgents.length);
        console.log('⏱️ 创建耗时:', result.duration + 'ms');
        process.exit(0);
    } else {
        console.log('❌ 项目创建失败');
        console.log('错误:', result.errors);
        process.exit(1);
    }
} catch (error) {
    console.log('❌ 项目创建异常:', error.message);
    console.log(error.stack);
    process.exit(1);
}
EOF

node /tmp/test-creation.mjs "$TEST_DIR"

# 检查创建结果
if [ $? -eq 0 ]; then
    echo ""
    echo "🔍 验证创建的项目结构..."
    
    # 验证目录结构
    EXPECTED_DIRS=(
        "agents"
        "docs"
        "docs/requirements"
        "docs/design" 
        "docs/cmmi"
        "src"
        "tests"
        "config"
    )
    
    MISSING_DIRS=()
    for dir in "${EXPECTED_DIRS[@]}"; do
        if [ ! -d "$TEST_DIR/$dir" ]; then
            MISSING_DIRS+=("$dir")
        fi
    done
    
    if [ ${#MISSING_DIRS[@]} -eq 0 ]; then
        echo "✅ 目录结构验证通过"
    else
        echo "❌ 缺少目录: ${MISSING_DIRS[*]}"
        exit 1
    fi
    
    # 验证关键文件
    EXPECTED_FILES=(
        "package.json"
        "README.md"
        "tsconfig.json"
        ".eslintrc.json"
        "jest.config.js"
        "src/index.ts"
        "tests/index.test.ts"
    )
    
    MISSING_FILES=()
    for file in "${EXPECTED_FILES[@]}"; do
        if [ ! -f "$TEST_DIR/$file" ]; then
            MISSING_FILES+=("$file")
        fi
    done
    
    if [ ${#MISSING_FILES[@]} -eq 0 ]; then
        echo "✅ 关键文件验证通过"
    else
        echo "❌ 缺少文件: ${MISSING_FILES[*]}"
        exit 1
    fi
    
    # 验证代理文件
    EXPECTED_AGENTS=(
        "requirements-agent.yaml"
        "design-agent.yaml"
        "coding-agent.yaml"
        "test-agent.yaml"
        "tasks-agent.yaml"
        "spec-agent.yaml"
    )
    
    MISSING_AGENTS=()
    for agent in "${EXPECTED_AGENTS[@]}"; do
        if [ ! -f "$TEST_DIR/agents/$agent" ]; then
            MISSING_AGENTS+=("$agent")
        fi
    done
    
    if [ ${#MISSING_AGENTS[@]} -eq 0 ]; then
        echo "✅ 代理文件验证通过"
    else
        echo "❌ 缺少代理: ${MISSING_AGENTS[*]}"
        exit 1
    fi
    
    # 验证package.json内容
    if [ -f "$TEST_DIR/package.json" ]; then
        if grep -q "CMMI L3 compliant project" "$TEST_DIR/package.json"; then
            echo "✅ package.json内容验证通过"
        else
            echo "❌ package.json内容不正确"
            exit 1
        fi
    fi
    
    echo ""
    echo "🎉 T006: 项目创建引擎实现验证完成"
    echo "========================================"
    echo "✅ 所有验证项目通过"
    echo "📊 验证统计:"
    echo "  - 目录结构: ${#EXPECTED_DIRS[@]}个目录"
    echo "  - 关键文件: ${#EXPECTED_FILES[@]}个文件"  
    echo "  - 代理配置: ${#EXPECTED_AGENTS[@]}个代理"
    echo "  - 配置验证: package.json内容正确"
    
else
    echo "❌ 项目创建失败，验证终止"
    exit 1
fi
