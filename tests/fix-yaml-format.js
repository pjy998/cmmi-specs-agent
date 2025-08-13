#!/usr/bin/env node

/**
 * YAML格式自动修复工具
 * 修复agents/*.yaml文件中的格式问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始修复YAML格式问题...');

const projectRoot = path.join(__dirname, '..');
const agentsDir = path.join(projectRoot, 'agents');

/**
 * 修复单个YAML文件
 */
function fixYamlFile(filePath) {
    console.log(`🔸 修复: ${path.basename(filePath)}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // 1. 将 instructions: |- 改为 instructions: |
        if (content.includes('instructions: |-')) {
            content = content.replace(/instructions: \|-/g, 'instructions: |');
            modified = true;
            console.log('  ✅ 修复了 instructions 字段的格式');
        }
        
        // 2. 其他可能的格式问题修复
        // 确保换行符一致
        content = content.replace(/\r\n/g, '\n');
        
        // 确保文件以换行符结尾
        if (!content.endsWith('\n')) {
            content += '\n';
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('  📁 文件已保存');
            return true;
        } else {
            console.log('  ℹ️  无需修改');
            return false;
        }
        
    } catch (error) {
        console.log(`  ❌ 修复失败: ${error.message}`);
        return false;
    }
}

/**
 * 批量修复所有YAML文件
 */
function fixAllYamlFiles() {
    if (!fs.existsSync(agentsDir)) {
        console.log('❌ agents目录不存在');
        return false;
    }

    const yamlFiles = fs.readdirSync(agentsDir).filter(file => 
        file.endsWith('.yaml') || file.endsWith('.yml')
    );

    console.log(`找到 ${yamlFiles.length} 个YAML文件`);

    let fixedCount = 0;
    yamlFiles.forEach(file => {
        const filePath = path.join(agentsDir, file);
        if (fixYamlFile(filePath)) {
            fixedCount++;
        }
    });

    console.log(`\n📊 修复完成: ${fixedCount}/${yamlFiles.length} 个文件被修改`);
    return true;
}

/**
 * 验证修复结果
 */
async function validateFixes() {
    console.log('\n🔍 验证修复结果...');
    
    try {
        // 动态导入验证函数
        const { validateExistingYamlFiles } = await import('./yaml-validation-test.js');
        const result = validateExistingYamlFiles();
        
        if (result.allValid) {
            console.log('✅ 所有文件格式正确！');
            return true;
        } else {
            console.log('⚠️  仍有问题需要手动处理:');
            result.results.forEach(file => {
                if (!file.valid) {
                    console.log(`  - ${file.file}: ${file.issues.join(', ')}`);
                }
            });
            return false;
        }
    } catch (error) {
        console.log(`❌ 验证过程出错: ${error.message}`);
        return false;
    }
}

// 主修复流程
async function main() {
    try {
        console.log('==================================================');
        
        // 1. 执行修复
        const fixSuccess = fixAllYamlFiles();
        
        if (!fixSuccess) {
            process.exit(1);
        }
        
        // 2. 验证修复结果
        const validationSuccess = await validateFixes();
        
        // 3. 总结
        console.log('\n🎯 修复总结:');
        if (validationSuccess) {
            console.log('✅ 所有YAML文件格式已修复，可以正常使用MCP工具');
            console.log('\n📝 接下来可以测试:');
            console.log('1. 自动创建新的agent');
            console.log('2. 手动调整现有agent配置');
            console.log('3. 使用MCP工具分析和管理agents');
        } else {
            console.log('⚠️  部分问题需要手动解决');
        }
        
        process.exit(validationSuccess ? 0 : 1);
        
    } catch (error) {
        console.error('❌ 修复过程中发生错误:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { fixYamlFile, fixAllYamlFiles };
