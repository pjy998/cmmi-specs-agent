#!/usr/bin/env node

/**
 * Test English task to verify content stays in English
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnglishTaskTest {
  constructor() {
    this.testOutputDir = './test-output/english-test';
  }

  async testEnglishTask() {
    console.log('🇺🇸 Testing English task language support...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.testOutputDir)) {
      fs.mkdirSync(this.testOutputDir, { recursive: true });
    }

    // Create test English task
    const englishTask = "Develop a React-based e-commerce shopping cart system with product management and order processing";
    
    // Build MCP request
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "workflow_execute",
        arguments: {
          task_content: englishTask,
          project_path: this.testOutputDir,
          execution_mode: "sequential"
        }
      }
    };

    try {
      // Start MCP server
      const serverProcess = spawn('node', ['./mcp-server/start-mcp.mjs'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        const line = data.toString();
        console.log('Server stdout:', line.trim());
        output += line;
      });

      serverProcess.stderr.on('data', (data) => {
        const line = data.toString();
        console.log('Server stderr:', line.trim());
        errorOutput += line;
      });

      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send initialize request
      const initRequest = {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "english-test-client",
            version: "1.0.0"
          }
        }
      };

      serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
      
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send the actual request
      serverProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if documents were created
      const docsDir = path.join(this.testOutputDir, 'docs');
      if (fs.existsSync(docsDir)) {
        console.log('✅ Documentation directory created:', docsDir);
        this.checkLanguageContent(docsDir);
      } else {
        console.log('❌ Documentation directory not created');
      }

      // Cleanup
      serverProcess.kill();

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }

    console.log('🎉 English language test completed');
  }

  checkLanguageContent(docsDir) {
    console.log('📁 Checking output directory structure:');
    
    const checkDirectory = (dir, indent = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          console.log(`${indent}📁 ${item}/`);
          checkDirectory(fullPath, indent + '  ');
        } else if (item.endsWith('.md')) {
          console.log(`${indent}📄 ${item}`);
          
          // Check if file contains English content
          const content = fs.readFileSync(fullPath, 'utf8');
          const hasEnglish = /[a-zA-Z]{3,}/.test(content);
          const hasChinese = /[\u4e00-\u9fa5]{2,}/.test(content);
          
          if (hasEnglish && !hasChinese) {
            console.log(`${indent}   ✅ ${item} is properly in English`);
          } else if (hasEnglish && hasChinese) {
            console.log(`${indent}   ⚠️ ${item} contains mixed content`);
          } else if (hasChinese) {
            console.log(`${indent}   ❌ ${item} incorrectly translated to Chinese`);
          }
        }
      });
    };

    checkDirectory(docsDir);
  }
}

// Run the test
const test = new EnglishTaskTest();
test.testEnglishTask().catch(console.error);
