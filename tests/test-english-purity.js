#!/usr/bin/env node

/**
 * 纯英文文档生成验证测试
 * 确保生成的所有文档内容都是英文，无中文混入
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnglishDocumentTester {
  constructor() {
    this.testOutputDir = './english-test-output';
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

  async generateEnglishDocuments() {
    this.log('Starting English document generation test...', 'start');
    
    // 使用完全英文的任务描述
    const englishTask = "Create a REST API service for book management with user authentication and CRUD operations";
    
    this.log(`Task: ${englishTask}`, 'info');
    
    // 运行文档自动生成测试，指定英文任务和输出目录
    const result = await this.runCommand('node', ['test-document-auto-landing.mjs'], {
      env: {
        ...process.env,
        TEST_TASK_CONTENT: englishTask,
        TEST_OUTPUT_DIR: this.testOutputDir,
        TEST_LANGUAGE: 'en'
      }
    });
    
    this.results.generation = {
      passed: result.code === 0,
      exitCode: result.code,
      task: englishTask,
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
   * 检查文本是否包含中文字符
   */
  containsChinese(text) {
    const chineseRegex = /[\u4e00-\u9fff]+/;
    return chineseRegex.test(text);
  }

  /**
   * 验证单个文档文件
   */
  validateDocumentFile(filePath) {
    const fileName = path.basename(filePath);
    this.log(`Validating ${fileName}...`, 'info');
    
    if (!fs.existsSync(filePath)) {
      this.log(`File not found: ${fileName}`, 'error');
      return {
        file: fileName,
        exists: false,
        valid: false,
        issues: ['File not found']
      };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // 检查是否包含中文
    if (this.containsChinese(content)) {
      issues.push('Contains Chinese characters');
      
      // 找出具体的中文内容
      const lines = content.split('\n');
      const chineseLines = lines
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        .filter(item => this.containsChinese(item.line))
        .slice(0, 5); // 只显示前5行
      
      chineseLines.forEach(item => {
        this.log(`  Line ${item.number}: ${item.line.substring(0, 100)}...`, 'warning');
      });
    }
    
    // 检查基本结构
    if (content.length < 100) {
      issues.push('Content too short (less than 100 characters)');
    }
    
    if (!content.includes('#')) {
      issues.push('No markdown headers found');
    }
    
    const isValid = issues.length === 0;
    
    if (isValid) {
      this.log(`${fileName} validation PASSED`, 'success');
    } else {
      this.log(`${fileName} validation FAILED: ${issues.join(', ')}`, 'error');
    }
    
    return {
      file: fileName,
      exists: true,
      valid: isValid,
      issues: issues,
      contentLength: content.length,
      containsChinese: this.containsChinese(content)
    };
  }

  async validateGeneratedDocuments() {
    this.log('Starting document validation...', 'start');
    
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
      this.log('No documentation directory with all expected files found', 'error');
      this.log('Available files:', 'info');
      
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
        this.log(`  Found: ${file}`, 'info');
      });
      
      this.results.validation = {
        passed: false,
        issues: ['No documentation directory with all expected files found'],
        availableFiles: allMdFiles,
        timestamp: new Date().toISOString()
      };
      return false;
    }
    
    this.log(`Found documents in: ${docsPath}`, 'info');
    
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
      this.log('All documents validation PASSED - No Chinese content found!', 'success');
    } else {
      this.log('Document validation FAILED - Found issues with language purity', 'error');
    }
    
    return allValid;
  }

  generateReport() {
    const summary = {
      timestamp: new Date().toISOString(),
      test_type: 'English Document Purity Test',
      task_description: this.results.generation?.task || 'Unknown',
      output_directory: this.testOutputDir,
      results: this.results,
      summary: {
        generation_success: this.results.generation?.passed || false,
        validation_success: this.results.validation?.passed || false,
        overall_success: (this.results.generation?.passed && this.results.validation?.passed) || false
      }
    };

    const reportPath = path.join(this.testOutputDir, 'english-purity-report.json');
    
    // 确保目录存在
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    
    this.log(`Report saved to: ${reportPath}`, 'info');
    
    return summary;
  }

  async run() {
    this.log('🇺🇸 Starting English Document Purity Test', 'start');
    
    try {
      // 清理之前的测试
      await this.cleanup();
      
      // 生成文档
      const generationSuccess = await this.generateEnglishDocuments();
      
      if (!generationSuccess) {
        this.log('Skipping validation due to generation failure', 'warning');
        this.generateReport();
        return false;
      }
      
      // 验证文档
      const validationSuccess = await this.validateGeneratedDocuments();
      
      // 生成报告
      const report = this.generateReport();
      
      // 输出总结
      console.log('\n============================================================');
      this.log('English Document Purity Test Completed', 'start');
      console.log('============================================================');
      this.log(`Generation: ${report.summary.generation_success ? 'PASSED' : 'FAILED'}`, 
                 report.summary.generation_success ? 'success' : 'error');
      this.log(`Validation: ${report.summary.validation_success ? 'PASSED' : 'FAILED'}`, 
                 report.summary.validation_success ? 'success' : 'error');
      this.log(`Overall: ${report.summary.overall_success ? 'PASSED' : 'FAILED'}`, 
                 report.summary.overall_success ? 'success' : 'error');
      
      if (report.summary.overall_success) {
        this.log('✅ All generated documents are pure English!', 'success');
      } else {
        this.log('❌ Found language purity issues. Check the report for details.', 'error');
      }
      
      return report.summary.overall_success;
      
    } catch (error) {
      this.log(`Test failed with error: ${error.message}`, 'error');
      return false;
    }
  }
}

// 运行测试
async function main() {
  const tester = new EnglishDocumentTester();
  const success = await tester.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = EnglishDocumentTester;
