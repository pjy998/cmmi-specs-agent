#!/usr/bin/env node

/**
 * 纯中文文档生成验证测试
 * 确保生成的所有文档内容都是中文，无英文混入（除了技术术语）
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ChineseDocumentTester {
  constructor() {
    this.testOutputDir = './chinese-test-output';
    this.results = {
      generation: null,
      validation: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const symbols = {
      'info': '📋',
      'success': '✅', 
      'error': '❌',
      'warning': '⚠️',
      'start': '🚀'
    };
    console.log(`${symbols[type] || '📋'} [${timestamp}] ${message}`);
  }

  async cleanup() {
    if (fs.existsSync(this.testOutputDir)) {
      fs.rmSync(this.testOutputDir, { recursive: true, force: true });
      this.log('Cleaned previous test output', 'info');
    }
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });
  }

  async generateChineseDocuments() {
    this.log('Starting Chinese document generation test...', 'start');
    
    // 使用完全中文的任务描述
    const chineseTask = "开发基于微服务架构的在线购物平台，包含用户管理、商品管理、订单处理和支付系统";
    
    this.log(`任务: ${chineseTask}`, 'info');
    
    // 运行文档自动生成测试，指定中文任务和输出目录
    const result = await this.runCommand('node', ['test-document-auto-landing.mjs'], {
      env: {
        ...process.env,
        TEST_TASK_CONTENT: chineseTask,
        TEST_OUTPUT_DIR: this.testOutputDir,
        TEST_LANGUAGE: 'zh'
      }
    });
    
    this.results.generation = {
      passed: result.code === 0,
      exitCode: result.code,
      task: chineseTask,
      timestamp: new Date().toISOString()
    };
    
    if (result.code === 0) {
      this.log('Document generation completed successfully', 'success');
      return true;
    } else {
      this.log('Document generation failed', 'error');
      return false;
    }
  }

  /**
   * 检查文本是否包含过多英文内容（排除技术术语）
   */
  containsExcessiveEnglish(text) {
    // 技术术语白名单（这些英文术语在中文技术文档中是合理的）
    const technicalTerms = [
      'API', 'REST', 'HTTP', 'HTTPS', 'JSON', 'XML', 'JWT', 'SQL',
      'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Node.js', 'Express',
      'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'Git', 'GitHub',
      'CRUD', 'MVC', 'RBAC', 'OAuth', 'CORS', 'SPA', 'PWA', 'CI/CD',
      'Interface', 'Service', 'Controller', 'Model', 'Repository',
      'Database', 'Cache', 'Session', 'Token', 'Hash', 'Encryption'
    ];
    
    // 移除技术术语
    let filteredText = text;
    technicalTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '');
    });
    
    // 移除代码块
    filteredText = filteredText.replace(/```[\s\S]*?```/g, '');
    filteredText = filteredText.replace(/`[^`]+`/g, '');
    
    // 移除 Markdown 语法
    filteredText = filteredText.replace(/#{1,6}\s/g, '');
    filteredText = filteredText.replace(/\*\*([^*]+)\*\*/g, '$1');
    filteredText = filteredText.replace(/\*([^*]+)\*/g, '$1');
    
    // 检查剩余英文单词
    const englishWords = filteredText.match(/\b[a-zA-Z]{3,}\b/g) || [];
    const chineseChars = (filteredText.match(/[\u4e00-\u9fff]/g) || []).length;
    
    // 如果英文单词数量超过中文字符的10%，认为包含过多英文
    return englishWords.length > chineseChars * 0.1;
  }

  /**
   * 验证单个文档文件
   */
  validateDocumentFile(filePath) {
    const fileName = path.basename(filePath);
    this.log(`验证 ${fileName}...`, 'info');
    
    if (!fs.existsSync(filePath)) {
      this.log(`文件未找到: ${fileName}`, 'error');
      return {
        file: fileName,
        exists: false,
        valid: false,
        issues: ['文件未找到']
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 检查是否包含过多英文
    if (this.containsExcessiveEnglish(content)) {
      issues.push('包含过多英文内容');
      
      // 找出具体的英文内容
      const lines = content.split('\n');
      const englishLines = lines
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        .filter(item => this.containsExcessiveEnglish(item.line))
        .slice(0, 5); // 只显示前5行
      
      englishLines.forEach(item => {
        this.log(`  第 ${item.number} 行: ${item.line.substring(0, 100)}...`, 'warning');
      });
    }
    
    // 检查基本结构
    if (content.length < 100) {
      issues.push('内容过短（少于100字符）');
    }
    
    if (!content.includes('#')) {
      issues.push('未找到 Markdown 标题');
    }
    
    // 检查是否包含基本的中文内容
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    if (chineseChars < 50) {
      issues.push('中文内容过少');
    }
    
    const isValid = issues.length === 0;
    
    if (isValid) {
      this.log(`${fileName} 验证通过`, 'success');
    } else {
      this.log(`${fileName} 验证失败: ${issues.join(', ')}`, 'error');
    }
    
    return {
      file: fileName,
      exists: true,
      valid: isValid,
      issues: issues,
      contentLength: content.length,
      chineseCharCount: chineseChars,
      containsExcessiveEnglish: this.containsExcessiveEnglish(content)
    };
  }

  async validateGeneratedDocuments() {
    this.log('开始文档验证...', 'start');
    
    const expectedFiles = [
      'requirements.md',
      'design.md', 
      'tasks.md',
      'tests.md',
      'implementation.md'
    ];
    
    // 查找生成的文档目录
    let docsPath = null;
    
    if (fs.existsSync(this.testOutputDir)) {
      // 使用更智能的查找方式，查找包含所有5个预期文件的目录
      const findDocsWithAllFiles = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // 检查当前目录是否包含所有预期文件
            const filesInDir = fs.readdirSync(fullPath, { withFileTypes: true })
              .filter(e => e.isFile() && e.name.endsWith('.md'))
              .map(e => e.name);
            
            const hasAllFiles = expectedFiles.every(file => filesInDir.includes(file));
            
            if (hasAllFiles) {
              return fullPath;
            }
            
            // 递归搜索子目录
            const result = findDocsWithAllFiles(fullPath);
            if (result) return result;
          }
        }
        return null;
      };
      
      docsPath = findDocsWithAllFiles(this.testOutputDir);
    }
    
    if (!docsPath) {
      this.log('未找到包含所有预期文件的文档目录', 'error');
      this.log('可用文件:', 'info');
      
      // 列出所有找到的md文件
      const findAllMdFiles = (dir) => {
        const files = [];
        if (fs.existsSync(dir)) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              files.push(...findAllMdFiles(fullPath));
            } else if (entry.name.endsWith('.md')) {
              files.push(fullPath);
            }
          }
        }
        return files;
      };
      
      const allMdFiles = findAllMdFiles(this.testOutputDir);
      allMdFiles.forEach(file => {
        this.log(`  找到: ${file}`, 'info');
      });
      
      this.results.validation = {
        passed: false,
        issues: ['未找到包含所有预期文件的文档目录'],
        availableFiles: allMdFiles,
        timestamp: new Date().toISOString()
      };
      return false;
    }
    
    this.log(`在以下位置找到文档: ${docsPath}`, 'info');
    
    const validationResults = [];
    let allValid = true;
    
    for (const fileName of expectedFiles) {
      const filePath = path.join(docsPath, fileName);
      const result = this.validateDocumentFile(filePath);
      validationResults.push(result);
      
      if (!result.valid) {
        allValid = false;
      }
    }
    
    this.results.validation = {
      passed: allValid,
      results: validationResults,
      docsPath: docsPath,
      timestamp: new Date().toISOString()
    };
    
    if (allValid) {
      this.log('所有文档验证通过 - 中文内容质量良好！', 'success');
    } else {
      this.log('文档验证失败 - 发现语言纯度问题', 'error');
    }
    
    return allValid;
  }

  generateReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      test_type: 'Chinese Document Purity Test',
      task_description: this.results.generation?.task || 'Unknown',
      output_directory: this.testOutputDir,
      results: this.results,
      summary: {
        generation_success: this.results.generation?.passed || false,
        validation_success: this.results.validation?.passed || false,
        overall_success: (this.results.generation?.passed && this.results.validation?.passed) || false
      }
    };

    const reportPath = path.join(this.testOutputDir, 'chinese-purity-report.json');
    
    // 确保目录存在
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    this.log(`报告保存至: ${reportPath}`, 'info');
    
    return summary;
  }

  async run() {
    this.log('🇨🇳 开始中文文档纯度测试', 'start');
    
    try {
      // 清理之前的测试
      await this.cleanup();
      
      // 生成文档
      const generationSuccess = await this.generateChineseDocuments();
      
      if (!generationSuccess) {
        this.log('因生成失败跳过验证', 'warning');
        this.generateReport();
        return false;
      }
      
      // 验证文档
      const validationSuccess = await this.validateGeneratedDocuments();
      
      // 生成报告
      const report = this.generateReport();
      
      // 输出总结
      console.log('\n============================================================');
      this.log('中文文档纯度测试完成', 'start');
      console.log('============================================================');
      this.log(`生成: ${report.summary.generation_success ? '通过' : '失败'}`, 
                 report.summary.generation_success ? 'success' : 'error');
      this.log(`验证: ${report.summary.validation_success ? '通过' : '失败'}`, 
                 report.summary.validation_success ? 'success' : 'error');
      this.log(`总体: ${report.summary.overall_success ? '通过' : '失败'}`, 
                 report.summary.overall_success ? 'success' : 'error');
      
      if (report.summary.overall_success) {
        this.log('✅ 所有生成的文档都是优质中文内容！', 'success');
      } else {
        this.log('❌ 发现语言纯度问题。请查看报告了解详情。', 'error');
      }
      
      return report.summary.overall_success;
      
    } catch (error) {
      this.log(`测试失败: ${error.message}`, 'error');
      return false;
    }
  }
}

// 运行测试
async function main() {
  const tester = new ChineseDocumentTester();
  const success = await tester.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = ChineseDocumentTester;
