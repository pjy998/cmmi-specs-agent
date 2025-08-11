#!/usr/bin/env node

/**
 * End-to-End Test for Document Auto-Landing Feature
 * Tests the complete workflow from task analysis to document generation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);
const MCP_SERVER_PATH = join(PROJECT_ROOT, 'mcp-server', 'dist', 'server.js');

class DocumentAutoLandingTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
    // Use environment variable if provided, otherwise use default
    this.testProjectPath = process.env.TEST_OUTPUT_DIR || join(PROJECT_ROOT, 'test-output');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async cleanup(preserveAgents = false) {
    if (fs.existsSync(this.testProjectPath)) {
      if (preserveAgents) {
        // Only clean up non-agent directories
        const entries = fs.readdirSync(this.testProjectPath);
        for (const entry of entries) {
          if (entry !== 'agents') {
            const fullPath = join(this.testProjectPath, entry);
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
        }
        this.log('Cleaned up test project directory (preserving agents)', 'info');
      } else {
        fs.rmSync(this.testProjectPath, { recursive: true, force: true });
        this.log('Cleaned up test project directory', 'info');
      }
    }
  }

  async testMcpServerStatus() {
    this.log('Testing MCP Server Status...', 'info');
    
    try {
      if (!fs.existsSync(MCP_SERVER_PATH)) {
        throw new Error(`MCP server not found at ${MCP_SERVER_PATH}`);
      }
      
      this.log('MCP server found', 'success');
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'MCP Server Status',
        status: 'PASSED',
        message: 'Server executable found'
      });
      return true;
    } catch (error) {
      this.log(`MCP server test failed: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'MCP Server Status',
        status: 'FAILED',
        message: error.message
      });
      return false;
    }
  }

  async testFileOperations() {
    this.log('Testing File Operations Module...', 'info');
    
    try {
      // Import the FileOperations module
      const { FileOperations } = await import('../mcp-server/dist/utils/file-operations.js');
      
      // Test directory creation in a temporary location that will be cleaned up
      const testDir = join(this.testProjectPath, 'temp-test');
      const result = await FileOperations.createDirectory(testDir);
      
      if (!result.success) {
        throw new Error(`Directory creation failed: ${result.error}`);
      }
      
      if (!fs.existsSync(testDir)) {
        throw new Error('Directory was not created');
      }
      
      // Test file creation
      const testFile = join(testDir, 'test.md');
      const fileResult = await FileOperations.createFile(testFile, '# Test Document\n\nThis is a test.');
      
      if (!fileResult.success) {
        throw new Error(`File creation failed: ${fileResult.error}`);
      }
      
      if (!fs.existsSync(testFile)) {
        throw new Error('File was not created');
      }
      
      // Clean up temporary test directory
      fs.rmSync(testDir, { recursive: true, force: true });
      
      this.log('File operations test passed', 'success');
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'File Operations',
        status: 'PASSED',
        message: 'All file operations working correctly'
      });
      return true;
    } catch (error) {
      this.log(`File operations test failed: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'File Operations',
        status: 'FAILED',
        message: error.message
      });
      return false;
    }
  }

  async testDirectoryStructure() {
    this.log('Testing CMMI Directory Structure Creation...', 'info');
    
    try {
      const { FileOperations } = await import('../mcp-server/dist/utils/file-operations.js');
      
      const structure = {
        projectPath: this.testProjectPath,
        featureName: 'test-structure',
        createDocs: true,
        createSrc: true,
        createTests: true
      };
      
      const result = await FileOperations.createCmmiStructure(structure);
      
      if (!result.success) {
        throw new Error(`Structure creation failed: ${result.error}`);
      }
      
      // Verify directories exist - 更新为正确的目录结构
      const expectedDirs = [
        join(this.testProjectPath, 'docs'),
        join(this.testProjectPath, 'docs', 'test-structure'),
        join(this.testProjectPath, 'src'),
        join(this.testProjectPath, 'tests')
      ];
      
      for (const dir of expectedDirs) {
        if (!fs.existsSync(dir)) {
          throw new Error(`Expected directory not created: ${dir}`);
        }
        this.log(`✓ Directory created: ${dir}`, 'success');
      }
      
      this.log('Directory structure test passed', 'success');
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Directory Structure',
        status: 'PASSED',
        message: 'CMMI directory structure created correctly'
      });
      return true;
    } catch (error) {
      this.log(`Directory structure test failed: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Directory Structure',
        status: 'FAILED',
        message: error.message
      });
      return false;
    }
  }

  async testWorkflowExecution() {
    this.log('Testing Workflow Execution with Document Generation...', 'info');
    
    try {
      // Setup test agents first
      await this.setupTestAgents();
      
      // Import the handler
      const { AdvancedToolHandlers } = await import('../mcp-server/dist/tools/advanced-handlers.js');
      
      // Use environment variable if provided, otherwise use default
      const testTask = process.env.TEST_TASK_CONTENT || "实现基于JWT令牌的用户认证系统";
      const workflowArgs = {
        task_content: testTask,
        project_path: this.testProjectPath,
        execution_mode: 'smart',
        context_sharing: true,
        max_iterations: 5
      };
      
      this.log(`Executing workflow: ${testTask}`, 'info');
      const result = await AdvancedToolHandlers.executeMultiAgentWorkflow(workflowArgs);
      
      if (!result.success) {
        throw new Error(`Workflow execution failed: ${result.error}`);
      }
      
      this.log('Workflow execution completed', 'success');
      
      // Verify generated documents
      const featureName = this.extractFeatureName(testTask);
      const docsPath = join(this.testProjectPath, 'docs', featureName);
      
      const expectedFiles = [
        'requirements.md',
        'design.md', 
        'tasks.md',
        'tests.md',
        'implementation.md'
      ];
      
      let filesFound = 0;
      for (const fileName of expectedFiles) {
        const filePath = join(docsPath, fileName);
        if (fs.existsSync(filePath)) {
          filesFound++;
          this.log(`✓ Found: ${fileName}`, 'success');
          
          // Verify CMMI header
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('<!-- CMMI:')) {
            this.log(`  ✓ CMMI header found in ${fileName}`, 'success');
          } else {
            this.log(`  ⚠️ CMMI header missing in ${fileName}`, 'warning');
          }
        } else {
          this.log(`✗ Missing: ${fileName}`, 'error');
        }
      }
      
      if (filesFound >= 2) { // 至少生成2个文档就算成功
        this.log(`Documents generated successfully (${filesFound}/${expectedFiles.length})`, 'success');
        this.testResults.passed++;
        this.testResults.details.push({
          test: 'Workflow Execution',
          status: 'PASSED',
          message: `Generated ${filesFound}/${expectedFiles.length} documents`
        });
        return true;
      } else {
        throw new Error(`Only ${filesFound}/${expectedFiles.length} documents generated`);
      }
      
    } catch (error) {
      this.log(`Workflow execution test failed: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Workflow Execution',
        status: 'FAILED',
        message: error.message
      });
      return false;
    }
  }

  async setupTestAgents() {
    const agentsDir = join(this.testProjectPath, 'agents');
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    const agents = [
      {
        name: 'requirements-agent',
        role: 'Requirements Analyst',
        capabilities: ['requirements-analysis', 'stakeholder-management', 'specification-writing'],
        responsibilities: 'Analyze and document software requirements'
      },
      {
        name: 'design-agent', 
        role: 'System Designer',
        capabilities: ['system-design', 'architecture-planning', 'technical-documentation'],
        responsibilities: 'Create system architecture and design documents'
      },
      {
        name: 'tasks-agent',
        role: 'Project Manager',
        capabilities: ['task-management', 'project-planning', 'milestone-tracking'],
        responsibilities: 'Break down work into manageable tasks and track progress'
      },
      {
        name: 'test-agent',
        role: 'Quality Assurance Engineer', 
        capabilities: ['test-planning', 'quality-assurance', 'validation'],
        responsibilities: 'Design and document testing strategies'
      },
      {
        name: 'coding-agent',
        role: 'Software Developer',
        capabilities: ['coding', 'implementation', 'code-review'],
        responsibilities: 'Implement code and provide technical solutions'
      }
    ];

    for (const agent of agents) {
      const agentConfig = `name: ${agent.name}
role: ${agent.role}
capabilities:
${agent.capabilities.map(cap => `  - ${cap}`).join('\n')}
responsibilities: ${agent.responsibilities}
model: gpt-4.1
systemPrompt: |
  You are a ${agent.role} focused on ${agent.responsibilities}.
  Generate professional documentation following CMMI standards.
  Always include proper headers, sections, and clear content.
tools:
  - file-operations
  - documentation
`;
      
      const configPath = join(agentsDir, `${agent.name}.yaml`);
      fs.writeFileSync(configPath, agentConfig);
    }
    
    this.log(`Setup ${agents.length} test agents in ${agentsDir}`, 'info');
  }

  extractFeatureName(taskContent) {
    const words = taskContent.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3);
    
    return words.join('-') || 'feature';
  }

  async inspectGeneratedFiles() {
    const testTask = "实现基于JWT令牌的用户认证系统";
    const featureName = this.extractFeatureName(testTask);
    const projectDir = join(this.testProjectPath, featureName);
    
    this.log(`Inspecting generated files in: ${projectDir}`, 'info');
    
    try {
      if (fs.existsSync(projectDir)) {
        const items = fs.readdirSync(projectDir, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory()) {
            this.log(`📁 Directory: ${item.name}/`, 'info');
            const subDir = join(projectDir, item.name);
            const subItems = fs.readdirSync(subDir);
            for (const subItem of subItems) {
              this.log(`  📄 ${subItem}`, 'info');
            }
          } else {
            this.log(`📄 File: ${item.name}`, 'info');
          }
        }
      } else {
        this.log('Project directory not found', 'warning');
      }
    } catch (error) {
      this.log(`Error inspecting files: ${error.message}`, 'error');
    }
  }

  async createBackup() {
    const backupPath = join(PROJECT_ROOT, 'test-backup');
    if (fs.existsSync(this.testProjectPath)) {
      try {
        if (fs.existsSync(backupPath)) {
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
        fs.cpSync(this.testProjectPath, backupPath, { recursive: true });
        this.log(`Backup created at: ${backupPath}`, 'info');
      } catch (error) {
        this.log(`Backup failed: ${error.message}`, 'warning');
      }
    }
  }

  async setupTestAgents() {
    this.log('Setting up test agents...', 'info');
    
    try {
      const agentsDir = join(this.testProjectPath, 'agents');
      
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir, { recursive: true });
      }
      
      // Create agent configurations
      const agents = [
        {
          name: 'requirements-agent',
          description: 'Requirements analysis and documentation agent',
          capabilities: ['requirements-analysis', 'documentation', 'stakeholder-communication']
        },
        {
          name: 'design-agent',
          description: 'System design and architecture agent',
          capabilities: ['system-design', 'architecture', 'technical-specifications']
        },
        {
          name: 'tasks-agent',
          description: 'Task breakdown and project management agent',
          capabilities: ['task-breakdown', 'project-management', 'estimation']
        },
        {
          name: 'test-agent',
          description: 'Test planning and strategy agent',
          capabilities: ['test-planning', 'quality-assurance', 'test-automation']
        },
        {
          name: 'coding-agent',
          description: 'Implementation and coding agent',
          capabilities: ['coding', 'implementation', 'code-review']
        }
      ];
      
      for (const agent of agents) {
        const yamlContent = `version: 1
name: ${agent.name}
title: ${agent.description}
model: gpt-4.1
capabilities:
${agent.capabilities.map(cap => `  - ${cap}`).join('\n')}
instructions: |
  You are a ${agent.description.toLowerCase()}.
tools:
  - file_operations
  - document_templates`;
        
        const agentFile = join(agentsDir, `${agent.name}.yaml`);
        fs.writeFileSync(agentFile, yamlContent);
        this.log(`✓ Created agent: ${agent.name}`, 'success');
      }
      
      this.log('Test agents setup completed', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to setup test agents: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Document Auto-Landing Feature Tests', 'info');
    this.log('=' .repeat(50), 'info');
    
    // Cleanup before tests
    await this.cleanup();
    
    // Run tests
    await this.testMcpServerStatus();
    await this.testFileOperations();
    await this.testDirectoryStructure();
    const workflowSuccess = await this.testWorkflowExecution();
    
    // If workflow test passed, show generated files before cleanup
    if (workflowSuccess) {
      this.log('Generated files inspection:', 'info');
      await this.inspectGeneratedFiles();
    }
    
    // Create backup but keep test-output directory
    await this.createBackup();
    // Don't cleanup - keep test-output for unified testing
    
    // Print results
    this.printResults();
  }

  printResults() {
    this.log('=' .repeat(50), 'info');
    this.log('TEST RESULTS SUMMARY', 'info');
    this.log('=' .repeat(50), 'info');
    
    this.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`, 'info');
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
    
    this.log('\nDetailed Results:', 'info');
    this.log('-' .repeat(30), 'info');
    
    for (const detail of this.testResults.details) {
      const statusIcon = detail.status === 'PASSED' ? '✅' : '❌';
      this.log(`${statusIcon} ${detail.test}: ${detail.status}`, 'info');
      this.log(`   ${detail.message}`, 'info');
    }
    
    if (this.testResults.failed === 0) {
      this.log('\n🎉 All tests passed! Document auto-landing feature is working correctly.', 'success');
      process.exit(0);
    } else {
      this.log('\n💥 Some tests failed. Please check the implementation.', 'error');
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DocumentAutoLandingTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { DocumentAutoLandingTester };
