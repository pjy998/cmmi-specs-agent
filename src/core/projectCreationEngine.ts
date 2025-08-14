/**
 * 项目创建引擎 - Project Creation Engine
 * 实现基于CMMI L3标准的智能化项目初始化
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';
import { AgentDiscoveryEngine } from './agentDiscoveryEngine.js';
import { WorkflowOrchestrator } from './workflowOrchestrator.js';

/**
 * 项目创建配置接口
 */
export interface ProjectCreationConfig {
  projectName: string;
  projectType: string;
  targetDirectory: string;
  techStack?: string[];
  cmmLevel?: number;
  includeTemplates?: boolean;
  generateDocs?: boolean;
}

/**
 * 项目创建结果接口
 */
export interface ProjectCreationResult {
  success: boolean;
  projectPath: string;
  createdFiles: string[];
  generatedAgents: string[];
  workflowDefinition?: any;
  cmmTraceabilityMatrix?: any;
  errors?: string[];
  duration: number;
}

/**
 * CMMI追溯矩阵接口
 */
export interface CMMTraceabilityMatrix {
  requirements: Array<{
    id: string;
    description: string;
    agent: string;
    artifacts: string[];
    verification: string[];
  }>;
  processes: Array<{
    processArea: string;
    goals: string[];
    practices: string[];
    artifacts: string[];
  }>;
}

/**
 * 项目创建引擎类
 */
export class ProjectCreationEngine {
  
  /**
   * 执行智能化项目创建
   */
  static async createProject(config: ProjectCreationConfig): Promise<ProjectCreationResult> {
    const startTime = Date.now();
    logger.info(`🚀 开始创建项目: ${config.projectName}`);
    
    try {
      const result: ProjectCreationResult = {
        success: false,
        projectPath: config.targetDirectory,
        createdFiles: [],
        generatedAgents: [],
        errors: [],
        duration: 0
      };

      // 1. 创建项目目录结构
      await this.createDirectoryStructure(config);
      result.createdFiles.push(...await this.getCreatedFiles(config.targetDirectory));

      // 2. 分析现有agents或生成标准agents
      const agentDiscovery = await AgentDiscoveryEngine.discoverAgents(config.targetDirectory);
      
      // 3. 生成缺失的agent模板
      if (agentDiscovery.missing_agents.length > 0) {
        const generatedAgents = await this.generateMissingAgents(
          config.targetDirectory, 
          agentDiscovery.missing_agents,
          config
        );
        result.generatedAgents.push(...generatedAgents);
      }

      // 4. 创建工作流定义
      const orchestrator = new WorkflowOrchestrator();
      const workflows = await orchestrator.discoverWorkflows(config.targetDirectory);
      result.workflowDefinition = {
        totalWorkflows: workflows.length,
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          agents: w.agents,
          steps: w.steps.length
        }))
      };

      // 5. 生成项目文档
      if (config.generateDocs !== false) {
        await this.generateProjectDocumentation(config, agentDiscovery);
        result.createdFiles.push('README.md', 'CMMI_COMPLIANCE.md', 'WORKFLOW_GUIDE.md');
      }

      // 6. 生成构建配置文件
      await this.generateBuildConfiguration(config);
      result.createdFiles.push('tsconfig.json', '.eslintrc.json', 'jest.config.js', '.github/workflows/ci.yml');

      // 7. 生成CMMI追溯矩阵
      result.cmmTraceabilityMatrix = await this.generateTraceabilityMatrix(
        config, 
        agentDiscovery,
        workflows
      );

      result.success = true;
      result.duration = Date.now() - startTime;
      
      logger.info(`✅ 项目创建完成: ${config.projectName}, 耗时: ${result.duration}ms`);
      return result;

    } catch (error) {
      logger.error('❌ 项目创建失败:', error);
      return {
        success: false,
        projectPath: config.targetDirectory,
        createdFiles: [],
        generatedAgents: [],
        errors: [error instanceof Error ? error.message : String(error)],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 创建标准的CMMI项目目录结构
   */
  private static async createDirectoryStructure(config: ProjectCreationConfig): Promise<void> {
    logger.info('📁 创建项目目录结构...');
    
    const baseDir = config.targetDirectory;
    const directories = [
      'agents',           // Agent配置文件
      'docs',            // 项目文档
      'docs/requirements', // 需求文档
      'docs/design',     // 设计文档  
      'docs/implementation', // 实现文档
      'docs/testing',    // 测试文档
      'docs/cmmi',       // CMMI过程文档
      'src',             // 源代码
      'tests',           // 测试代码
      'config',          // 配置文件
      'workflows',       // 工作流定义
      'templates',       // 模板文件
      'artifacts',       // 工作产物
    ];

    // 创建根目录
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    // 创建子目录
    for (const dir of directories) {
      const fullPath = path.join(baseDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info(`📂 创建目录: ${dir}`);
      }
    }

    // 创建基础文件
    await this.createBaseFiles(config);
  }

  /**
   * 创建基础项目文件
   */
  private static async createBaseFiles(config: ProjectCreationConfig): Promise<void> {
    const baseDir = config.targetDirectory;
    
    // package.json
    const packageJson = {
      name: config.projectName,
      version: "1.0.0",
      description: `CMMI L${config.cmmLevel || 3} compliant project: ${config.projectName}`,
      type: "module",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      scripts: {
        "start": "node dist/index.js",
        "dev": "ts-node-esm src/index.ts",
        "build": "tsc",
        "clean": "rm -rf dist",
        "prebuild": "npm run clean",
        "test": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
        "lint": "eslint src/**/*.ts",
        "lint:fix": "eslint src/**/*.ts --fix",
        "cmmi:analyze": "npx cmmi-specs-mcp analyze .",
        "cmmi:validate": "npx cmmi-specs-mcp validate",
        "cmmi:start": "npx cmmi-specs-mcp start"
      },
      keywords: ["cmmi", "project", config.projectType, `cmmi-l${config.cmmLevel || 3}`],
      devDependencies: {
        "cmmi-specs-mcp": "latest",
        "@types/node": "^20.0.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0",
        "eslint": "^8.0.0",
        "jest": "^29.0.0",
        "ts-jest": "^29.0.0",
        "ts-node": "^10.0.0",
        "typescript": "^5.0.0"
      },
      engines: {
        "node": ">=18.0.0"
      }
    };

    fs.writeFileSync(
      path.join(baseDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );

    // .gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# CMMI artifacts (keep source)
artifacts/*.generated
`;
    fs.writeFileSync(path.join(baseDir, '.gitignore'), gitignore);

    // 基础 README.md
    const readme = `# ${config.projectName}

> CMMI Level ${config.cmmLevel || 3} 标准项目

## 项目概述

本项目遵循 CMMI Level ${config.cmmLevel || 3} 标准，采用智能化多代理协作模式进行开发。

## 技术栈

${config.techStack ? config.techStack.map(tech => `- ${tech}`).join('\n') : '- 待定义'}

## CMMI 代理角色

项目采用以下智能代理进行协作：

- 📋 **requirements-agent**: 需求分析师
- 🏗️ **design-agent**: 系统设计师  
- 💻 **coding-agent**: 软件开发工程师
- 🧪 **test-agent**: 测试工程师
- 📊 **tasks-agent**: 项目经理
- 🎭 **spec-agent**: 流程协调器

## 快速开始

\`\`\`bash
# 安装依赖
npm install

# 分析CMMI配置
npm run cmmi:analyze

# 验证项目配置
npm run cmmi:validate

# 启动开发
npm start
\`\`\`

## CMMI 合规性

本项目严格遵循CMMI标准，详见：
- [CMMI合规性文档](./docs/cmmi/CMMI_COMPLIANCE.md)
- [工作流指南](./docs/WORKFLOW_GUIDE.md)
- [追溯矩阵](./docs/cmmi/TRACEABILITY_MATRIX.md)

---
*项目由 [CMMI Specs Agent](https://github.com/pjy998/cmmi-specs-agent) 智能生成*
`;
    fs.writeFileSync(path.join(baseDir, 'README.md'), readme);

    // 创建基础 src/index.ts
    const srcDir = path.join(baseDir, 'src');
    const indexTs = `/**
 * ${config.projectName} - CMMI L${config.cmmLevel || 3} 项目入口
 * 
 * 本文件是项目的主入口点，遵循 CMMI Level ${config.cmmLevel || 3} 标准。
 */

export function main(): void {
  console.log('🚀 ${config.projectName} 项目启动');
  console.log('📋 CMMI Level ${config.cmmLevel || 3} 标准项目');
  
  // TODO: 实现项目核心逻辑
}

// 如果直接运行此文件，则执行main函数
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main();
}

export default main;
`;
    fs.writeFileSync(path.join(srcDir, 'index.ts'), indexTs);

    // 创建基础测试文件
    const testsDir = path.join(baseDir, 'tests');
    const indexTest = `/**
 * ${config.projectName} - 基础测试文件
 * 遵循 CMMI Level ${config.cmmLevel || 3} 测试标准
 */

import { main } from '../src/index';

describe('${config.projectName} 基础功能测试', () => {
  it('应该能够正常启动', () => {
    // 测试主函数不抛出异常
    expect(() => main()).not.toThrow();
  });

  it('应该符合 CMMI L${config.cmmLevel || 3} 标准', () => {
    // TODO: 添加CMMI合规性检查
    expect(true).toBe(true);
  });
});
`;
    fs.writeFileSync(path.join(testsDir, 'index.test.ts'), indexTest);
  }

  /**
   * 生成缺失的agent模板
   */
  private static async generateMissingAgents(
    targetDir: string, 
    missingAgents: string[],
    config: ProjectCreationConfig
  ): Promise<string[]> {
    logger.info(`🤖 生成 ${missingAgents.length} 个缺失的agent模板...`);
    
    const generatedAgents: string[] = [];
    const agentsDir = path.join(targetDir, 'agents');

    for (const agentName of missingAgents) {
      const agentTemplate = this.generateAgentTemplate(agentName, config);
      const agentFile = path.join(agentsDir, `${agentName}.yaml`);
      
      fs.writeFileSync(agentFile, agentTemplate);
      generatedAgents.push(agentName);
      logger.info(`📝 生成agent: ${agentName}`);
    }

    return generatedAgents;
  }

  /**
   * 生成标准的agent模板
   */
  private static generateAgentTemplate(agentName: string, config: ProjectCreationConfig): string {
    const agentTemplates = {
      'requirements-agent': {
        title: '需求分析师，负责收集、分析和管理项目需求',
        capabilities: ['需求分析', '利益相关者管理', '联网搜索验证', 'GitHub Copilot协作'],
        phase: 0,
        outputs: ['requirements-document', 'acceptance-criteria', 'stakeholder-matrix']
      },
      'design-agent': {
        title: '系统设计师，负责架构设计和详细设计',
        capabilities: ['系统架构', '详细设计', '联网搜索验证', 'GitHub Copilot协作'],
        phase: 1,
        outputs: ['system-design', 'architecture-document', 'component-specification']
      },
      'coding-agent': {
        title: '软件开发工程师，负责代码实现和审查',
        capabilities: ['代码实现', '代码审查', '单元测试', '联网搜索验证'],
        phase: 2,
        outputs: ['source-code', 'unit-tests', 'code-review-report']
      },
      'test-agent': {
        title: '测试工程师，负责测试策略和执行',
        capabilities: ['测试规划', '测试执行', '验证确认', '联网搜索验证'],
        phase: 3,
        outputs: ['test-plan', 'test-results', 'verification-report']
      },
      'tasks-agent': {
        title: '项目经理，负责任务分解和项目管理',
        capabilities: ['任务管理', '项目规划', '进度跟踪', '风险管理'],
        phase: 0,
        outputs: ['project-plan', 'task-breakdown', 'progress-report']
      },
      'spec-agent': {
        title: '流程协调器，负责全流程调度和质量保证',
        capabilities: ['流程协调', '质量保证', 'CMMI合规检查', '工作流编排'],
        phase: 4,
        outputs: ['process-report', 'quality-metrics', 'cmmi-compliance']
      }
    };

    const template = agentTemplates[agentName as keyof typeof agentTemplates] || {
      title: `${agentName}代理`,
      capabilities: ['待定义'],
      phase: 0,
      outputs: ['output-document']
    };

    return `version: 1
name: ${agentName}
title: ${template.title}
description: ${template.title}
model: gpt-4.1
color: blue
language: zh-CN
capabilities:
${template.capabilities.map(cap => `  - ${cap}`).join('\n')}
workflow:
  phase: ${template.phase}
  prerequisites: []
  outputs: 
${template.outputs.map(output => `    - ${output}`).join('\n')}
  nextPhase: "next-phase"
dependencies: []
entrypoints:
  - id: default
    description: 执行${template.title}的核心任务
    examples:
      - "为${config.projectName}项目执行${template.title}任务"
instructions: |
  # CMMI Level ${config.cmmLevel || 3} ${template.title}

  ## 🎯 角色定义
  您是符合 CMMI Level ${config.cmmLevel || 3} 标准的${template.title}，负责${config.projectName}项目的相关工作。

  ## 📋 核心职责
  - 确保工作符合CMMI标准
  - 与其他代理协作完成项目目标
  - 生成高质量的工作产物
  - 持续改进和优化流程

  ## 🔧 工作流程
  1. 分析输入需求和前置条件
  2. 执行核心任务
  3. 生成标准化输出
  4. 进行质量检查和验证
  5. 传递给下一阶段

  ## 📝 输出标准
  ${template.outputs.map(output => `  - ${output}: 详细的工作产物文档`).join('\n')}

  请确保所有输出都符合CMMI Level ${config.cmmLevel || 3}的质量标准。
`;
  }

  /**
   * 生成项目文档
   */
  private static async generateProjectDocumentation(
    config: ProjectCreationConfig,
    agentDiscovery: any
  ): Promise<void> {
    logger.info('📚 生成项目文档...');
    
    const docsDir = path.join(config.targetDirectory, 'docs');
    
    // CMMI合规性文档
    const cmmComplianceDoc = `# CMMI Level ${config.cmmLevel || 3} 合规性文档

## 项目概述
项目名称: ${config.projectName}
CMMI等级: Level ${config.cmmLevel || 3}
项目类型: ${config.projectType}

## 过程域覆盖

### 工程过程域
- **RD (Requirements Development)**: 需求开发 - requirements-agent
- **TS (Technical Solution)**: 技术解决方案 - design-agent  
- **PI (Product Integration)**: 产品集成 - coding-agent
- **VER (Verification)**: 验证 - test-agent
- **VAL (Validation)**: 确认 - test-agent

### 项目管理过程域
- **PP (Project Planning)**: 项目规划 - tasks-agent
- **PMC (Project Monitoring and Control)**: 项目监控 - tasks-agent
- **RSKM (Risk Management)**: 风险管理 - tasks-agent

### 过程管理过程域
- **OPD (Organizational Process Definition)**: 组织过程定义 - spec-agent
- **OPF (Organizational Process Focus)**: 组织过程焦点 - spec-agent

## 代理角色映射

${agentDiscovery.existing_agents.map((agent: any) => 
  `### ${agent.name}\n- **角色**: ${agent.title}\n- **能力**: ${agent.capabilities.join(', ')}\n- **CMMI过程域**: 对应的CMMI过程域`
).join('\n\n')}

## 质量保证
- 所有工作产物都有明确的质量标准
- 实施同行评审和检查
- 持续改进过程定义
- 度量和分析过程性能

---
*文档生成时间: ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(docsDir, 'CMMI_COMPLIANCE.md'), cmmComplianceDoc);

    // 工作流指南
    const workflowGuide = `# 工作流执行指南

## 概述
本指南描述了${config.projectName}项目的标准工作流程。

## 代理协作流程

### 阶段1: 需求分析 (requirements-agent)
1. 收集利益相关者需求
2. 分析和梳理需求
3. 生成需求文档和验收标准

### 阶段2: 系统设计 (design-agent)  
1. 基于需求进行架构设计
2. 详细设计系统组件
3. 生成设计文档和规格说明

### 阶段3: 代码实现 (coding-agent)
1. 基于设计实现代码
2. 进行代码审查
3. 编写单元测试

### 阶段4: 测试验证 (test-agent)
1. 制定测试策略和计划
2. 执行各级测试
3. 验证需求满足情况

### 阶段5: 项目管理 (tasks-agent)
1. 制定项目计划
2. 监控项目进度
3. 管理风险和问题

### 阶段6: 流程协调 (spec-agent)
1. 协调各代理工作
2. 确保CMMI合规性
3. 生成过程报告

## 使用方法

\`\`\`bash
# 分析现有配置
npm run cmmi:analyze

# 验证项目配置  
npm run cmmi:validate

# 手动执行工作流
npx cmmi-specs-mcp init .
\`\`\`

---
*更新时间: ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(docsDir, 'WORKFLOW_GUIDE.md'), workflowGuide);
  }

  /**
   * 生成CMMI追溯矩阵
   */
  private static async generateTraceabilityMatrix(
    config: ProjectCreationConfig,
    agentDiscovery: any,
    workflows: any[]
  ): Promise<CMMTraceabilityMatrix> {
    logger.info('📊 生成CMMI追溯矩阵...');

    const matrix: CMMTraceabilityMatrix = {
      requirements: [],
      processes: []
    };

    // 基于代理生成需求追溯
    agentDiscovery.existing_agents.forEach((agent: any) => {
      matrix.requirements.push({
        id: `REQ-${agent.name.toUpperCase()}`,
        description: `${agent.title}相关需求`,
        agent: agent.name,
        artifacts: agent.workflow?.outputs || [],
        verification: [`${agent.name}-verification`]
      });
    });

    // 生成过程追溯
    const cmmProcesses = [
      {
        processArea: 'Requirements Development (RD)',
        goals: ['开发客户需求', '开发产品需求'],
        practices: ['收集利益相关者需求', '建立客户需求', '建立产品需求'],
        artifacts: ['requirements-document', 'acceptance-criteria']
      },
      {
        processArea: 'Technical Solution (TS)',
        goals: ['选择产品组件解决方案', '开发设计'],
        practices: ['开发替代解决方案', '建立详细设计'],
        artifacts: ['system-design', 'architecture-document']
      },
      {
        processArea: 'Verification (VER)',
        goals: ['准备验证', '执行同行评审', '验证选定的工作产品'],
        practices: ['选择验证的工作产品', '建立验证环境', '执行验证'],
        artifacts: ['verification-report', 'test-results']
      }
    ];

    matrix.processes = cmmProcesses;

    // 保存追溯矩阵文件
    const matrixFile = path.join(config.targetDirectory, 'docs', 'cmmi', 'TRACEABILITY_MATRIX.json');
    fs.mkdirSync(path.dirname(matrixFile), { recursive: true });
    fs.writeFileSync(matrixFile, JSON.stringify(matrix, null, 2));

    return matrix;
  }

  /**
   * 获取已创建的文件列表
   */
  private static async getCreatedFiles(targetDir: string): Promise<string[]> {
    const files: string[] = [];
    
    function walkDir(dir: string) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else {
          files.push(path.relative(targetDir, fullPath));
        }
      }
    }
    
    if (fs.existsSync(targetDir)) {
      walkDir(targetDir);
    }
    
    return files;
  }

  /**
   * 生成构建配置文件
   */
  private static async generateBuildConfiguration(config: ProjectCreationConfig): Promise<void> {
    logger.info('🔧 生成构建配置文件...');
    
    const baseDir = config.targetDirectory;

    // TypeScript配置
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "node",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist", "tests"]
    };

    fs.writeFileSync(
      path.join(baseDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // ESLint配置
    const eslintConfig = {
      env: {
        es2021: true,
        node: true
      },
      extends: [
        "eslint:recommended",
        "@typescript-eslint/recommended"
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 12,
        sourceType: "module"
      },
      plugins: ["@typescript-eslint"],
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "prefer-const": "error",
        "no-var": "error"
      }
    };

    fs.writeFileSync(
      path.join(baseDir, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );

    // Jest测试配置
    const jestConfig = {
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src", "<rootDir>/tests"],
      testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
      collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
      coverageDirectory: "coverage",
      coverageReporters: ["text", "lcov", "html"],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    };

    fs.writeFileSync(
      path.join(baseDir, 'jest.config.js'),
      `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
    );

    // GitHub Actions CI/CD配置
    const ciDir = path.join(baseDir, '.github', 'workflows');
    fs.mkdirSync(ciDir, { recursive: true });

    const ciConfig = `name: CMMI Project CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint code
      run: npm run lint
    
    - name: Run tests
      run: npm run test
    
    - name: CMMI compliance check
      run: npm run cmmi:validate
    
    - name: Build project
      run: npm run build
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      if: matrix.node-version == '20.x'
`;

    fs.writeFileSync(path.join(ciDir, 'ci.yml'), ciConfig);

    logger.info('✅ 构建配置文件生成完成');
  }
}

export default ProjectCreationEngine;
