/**
 * T006: 项目创建引擎测试
 * 验证项目创建功能的完整性
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectCreationEngine, ProjectCreationConfig } from '../src/core/projectCreationEngine.js';

describe('T006: 项目创建引擎实现测试', () => {
  const testDir = '/tmp/cmmi-test-project';
  
  beforeEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('应该创建标准CMMI项目结构', async () => {
    const config: ProjectCreationConfig = {
      projectName: 'test-cmmi-project',
      projectType: 'software-development',
      targetDirectory: testDir,
      techStack: ['TypeScript', 'Node.js'],
      cmmLevel: 3,
      generateDocs: true
    };

    const result = await ProjectCreationEngine.createProject(config);

    // 验证创建成功
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);

    // 验证基础目录结构
    const expectedDirs = [
      'agents',
      'docs',
      'docs/requirements',
      'docs/design',
      'docs/implementation',
      'docs/testing',
      'docs/cmmi',
      'src',
      'tests',
      'config',
      'workflows',
      'templates',
      'artifacts'
    ];

    expectedDirs.forEach(dir => {
      const dirPath = path.join(testDir, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    // 验证基础文件存在
    const expectedFiles = [
      'package.json',
      'README.md',
      '.gitignore',
      'tsconfig.json',
      '.eslintrc.json',
      'jest.config.js',
      'src/index.ts',
      'tests/index.test.ts'
    ];

    expectedFiles.forEach(file => {
      const filePath = path.join(testDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('应该生成6个标准CMMI代理', async () => {
    const config: ProjectCreationConfig = {
      projectName: 'test-agents-project',
      projectType: 'software-development',
      targetDirectory: testDir,
      cmmLevel: 3
    };

    const result = await ProjectCreationEngine.createProject(config);

    expect(result.success).toBe(true);

    // 验证6个标准代理文件存在
    const expectedAgents = [
      'requirements-agent.yaml',
      'design-agent.yaml',
      'coding-agent.yaml',
      'test-agent.yaml',
      'tasks-agent.yaml',
      'spec-agent.yaml'
    ];

    expectedAgents.forEach(agent => {
      const agentPath = path.join(testDir, 'agents', agent);
      expect(fs.existsSync(agentPath)).toBe(true);
    });

    expect(result.generatedAgents.length).toBeGreaterThanOrEqual(6);
  });

  test('应该生成正确的package.json配置', async () => {
    const config: ProjectCreationConfig = {
      projectName: 'test-package-project',
      projectType: 'web-application',
      targetDirectory: testDir,
      techStack: ['TypeScript', 'React'],
      cmmLevel: 3
    };

    const result = await ProjectCreationEngine.createProject(config);

    expect(result.success).toBe(true);

    const packageJsonPath = path.join(testDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 验证基础信息
    expect(packageJson.name).toBe('test-package-project');
    expect(packageJson.description).toContain('CMMI L3 compliant project');
    expect(packageJson.type).toBe('module');

    // 验证构建脚本
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts).toHaveProperty('lint');
    expect(packageJson.scripts).toHaveProperty('cmmi:analyze');
    expect(packageJson.scripts).toHaveProperty('cmmi:validate');

    // 验证开发依赖
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.devDependencies).toHaveProperty('jest');
    expect(packageJson.devDependencies).toHaveProperty('eslint');
  });

  test('应该生成构建配置文件', async () => {
    const config: ProjectCreationConfig = {
      projectName: 'test-build-project',
      projectType: 'library',
      targetDirectory: testDir,
      cmmLevel: 3
    };

    const result = await ProjectCreationEngine.createProject(config);

    expect(result.success).toBe(true);

    // 验证TypeScript配置
    const tsConfigPath = path.join(testDir, 'tsconfig.json');
    expect(fs.existsSync(tsConfigPath)).toBe(true);
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    expect(tsConfig.compilerOptions.target).toBe('ES2020');

    // 验证ESLint配置
    const eslintConfigPath = path.join(testDir, '.eslintrc.json');
    expect(fs.existsSync(eslintConfigPath)).toBe(true);

    // 验证Jest配置
    const jestConfigPath = path.join(testDir, 'jest.config.js');
    expect(fs.existsSync(jestConfigPath)).toBe(true);

    // 验证CI/CD配置
    const ciConfigPath = path.join(testDir, '.github/workflows/ci.yml');
    expect(fs.existsSync(ciConfigPath)).toBe(true);
  });

  test('应该生成CMMI文档', async () => {
    const config: ProjectCreationConfig = {
      projectName: 'test-docs-project',
      projectType: 'enterprise-software',
      targetDirectory: testDir,
      cmmLevel: 3,
      generateDocs: true
    };

    const result = await ProjectCreationEngine.createProject(config);

    expect(result.success).toBe(true);

    // 验证CMMI合规性文档
    const complianceDocPath = path.join(testDir, 'docs/cmmi/CMMI_COMPLIANCE.md');
    expect(fs.existsSync(complianceDocPath)).toBe(true);

    // 验证工作流指南
    const workflowGuidePath = path.join(testDir, 'docs/WORKFLOW_GUIDE.md');
    expect(fs.existsSync(workflowGuidePath)).toBe(true);

    // 验证追溯矩阵
    const traceabilityMatrixPath = path.join(testDir, 'docs/cmmi/TRACEABILITY_MATRIX.json');
    expect(fs.existsSync(traceabilityMatrixPath)).toBe(true);
  });

  test('应该在合理时间内完成项目创建', async () => {
    const config: ProjectCreationConfig = {
      projectName: 'test-performance-project',
      projectType: 'microservice',
      targetDirectory: testDir,
      cmmLevel: 3
    };

    const startTime = Date.now();
    const result = await ProjectCreationEngine.createProject(config);
    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    expect(result.duration).toBeLessThan(10000);
  });
});
