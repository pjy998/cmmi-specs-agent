#!/usr/bin/env node

/**
 * 测试MCP工具定义，验证是否包含不支持的default关键字
 */

const fs = require('fs');
const path = require('path');

// 直接读取源代码文件检查
const sourceFile = path.join(__dirname, '..', 'mcp-server', 'src', 'tools', 'mcp-tools.ts');

if (!fs.existsSync(sourceFile)) {
  console.log('❌ 找不到源文件');
  process.exit(1);
}

const content = fs.readFileSync(sourceFile, 'utf8');

console.log('🔍 检查MCP工具定义中的default关键字...\n');

// 查找所有default关键字的出现
const defaultMatches = [...content.matchAll(/default\s*:/g)];

if (defaultMatches.length === 0) {
  console.log('✅ 没有发现不支持的 "default" 关键字！');
  console.log('🎉 工具定义应该与VS Code Copilot Chat兼容！');
} else {
  console.log(`❌ 发现 ${defaultMatches.length} 个 "default" 关键字:`);
  
  const lines = content.split('\n');
  defaultMatches.forEach((match, index) => {
    const position = match.index;
    const beforeText = content.substring(0, position);
    const lineNumber = beforeText.split('\n').length;
    const line = lines[lineNumber - 1];
    
    console.log(`   ${index + 1}. 第 ${lineNumber} 行: ${line.trim()}`);
  });
  
  console.log('\n请移除所有的 "default" 关键字以确保与VS Code Copilot Chat兼容。');
}

console.log('\n📋 修复建议:');
console.log('- 移除JSON Schema中的default关键字');
console.log('- 在处理器函数中使用JavaScript默认参数语法');
console.log('- 例如: function handler({ param = "defaultValue" }) { ... }');
