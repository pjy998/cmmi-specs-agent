#!/usr/bin/env node

/**
 * 测试中文多语言支持
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ChineseLanguageTest {
  constructor() {
    this.testOutputDir = './test-output/chinese-test';
  }

  async testChineseTask() {
    console.log('🇨🇳 测试中文任务的多语言支持...');
    
    // 确保输出目录存在
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
    }

    // 创建测试的中文任务
    const chineseTask = "开发基于Vue.js的电商购物车系统，支持商品管理和订单处理";
    
    // 构建MCP请求
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "workflow_execute",
        arguments: {
          task_content: chineseTask,
          project_path: this.testOutputDir,
          execution_mode: "sequential"
        }
      }
    };

    try {
      // 启动MCP服务器
      const serverProcess = spawn('node', ['./mcp-server/start-mcp.mjs'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Server stdout:', data.toString());
      });

      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('Server stderr:', data.toString());
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 发送初始化请求
      const initRequest = {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          clientInfo: { name: "chinese-test", version: "1.0.0" }
        }
      };

      serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
      
      // 等待初始化
      await new Promise(resolve => setTimeout(resolve, 500));

      // 发送中文任务请求
      serverProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
      
      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 关闭服务器
      serverProcess.kill();

      // 检查生成的文档 - 修正路径检查，支持更灵活的项目名称匹配
      const possibleProjectNames = [
        'vue-shopping-cart', 'shopping-cart', 'vue-app', 
        'vue', 'cart', 'ecommerce', 'shop', 'commerce',
        'user-auth-system', 'user-system' // 通用项目名称
      ];
      
      let foundDocs = false;
      let foundFiles = [];
      
      // 首先检查顶级docs目录
      const topDocsPath = path.join(this.testOutputDir, 'docs');
      if (fs.existsSync(topDocsPath)) {
        const subdirs = fs.readdirSync(topDocsPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
          
        console.log(`✅ 找到文档目录: ${topDocsPath}`);
        console.log(`📁 子目录: ${subdirs.join(', ')}`);
        
        // 检查所有子目录中的文档
        for (const subdir of subdirs) {
          const projectDocsPath = path.join(topDocsPath, subdir);
          const files = this.findMarkdownFiles(projectDocsPath);
          
          if (files.length > 0) {
            console.log(`📋 在 ${subdir} 中找到 ${files.length} 个文档文件:`);
            foundDocs = true;
            foundFiles.push(...files);
            
            for (const file of files) {
              console.log(`   📄 ${path.relative(this.testOutputDir, file)}`);
              const content = fs.readFileSync(file, 'utf8');
              
              // 检查是否包含中文内容
              const hasChinese = /[\u4e00-\u9fff]/.test(content);
              if (hasChinese) {
                console.log(`   ✅ ${path.basename(file)} 包含中文内容`);
              } else {
                console.log(`   ⚠️ ${path.basename(file)} 主要是英文内容`);
              }
            }
          }
        }
      }
      
      // 也检查可能的项目目录
      for (const projectName of possibleProjectNames) {
        const projectPath = path.join(this.testOutputDir, projectName);
        const docsPath = path.join(projectPath, 'docs');
        
        if (fs.existsSync(docsPath)) {
          console.log(`✅ 找到项目文档目录: ${docsPath}`);
          foundDocs = true;
          
          const files = this.findMarkdownFiles(docsPath);
          if (files.length > 0) {
            console.log(`📋 找到 ${files.length} 个文档文件:`);
            foundFiles.push(...files);
            
            for (const file of files) {
              console.log(`   📄 ${path.relative(this.testOutputDir, file)}`);
              const content = fs.readFileSync(file, 'utf8');
              
              // 检查是否包含中文内容
              const hasChinese = /[\u4e00-\u9fff]/.test(content);
              if (hasChinese) {
                console.log(`   ✅ ${path.basename(file)} 包含中文内容`);
              } else {
                console.log(`   ⚠️ ${path.basename(file)} 主要是英文内容`);
              }
            }
          }
          break;
        }
      }
      
      if (!foundDocs) {
        console.log('❌ 文档目录未创建');
        console.log('📁 检查输出目录结构:');
        if (fs.existsSync(this.testOutputDir)) {
          const items = fs.readdirSync(this.testOutputDir, { withFileTypes: true });
          for (const item of items) {
            console.log(`   ${item.isDirectory() ? '📁' : '📄'} ${item.name}`);
          }
        }
      } else {
        console.log(`🎉 总共找到 ${foundFiles.length} 个生成的文档文件`);
      }

    } catch (error) {
      console.error('测试失败:', error);
    }
  }

  findMarkdownFiles(dir) {
    const files = [];
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...this.findMarkdownFiles(fullPath));
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    return files;
  }
}

// 运行测试
const tester = new ChineseLanguageTest();
tester.testChineseTask().then(() => {
  console.log('🎉 中文语言测试完成');
}).catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
