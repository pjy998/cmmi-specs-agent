/**
 * Multilingual Document Engine Test
 * 多语言文档引擎测试文件
 */

import { MultilingualDocumentEngine } from './mcp-server/dist/core/multilingual-engine.js';
import { ModelScheduler } from './mcp-server/dist/core/model-scheduler.js';

class MultilingualEngineTest {
  constructor() {
    this.modelScheduler = new ModelScheduler();
    this.engine = new MultilingualDocumentEngine(this.modelScheduler);
  }

  /**
   * 测试语言检测功能
   */
  testLanguageDetection() {
    console.log('\n=== 测试语言检测功能 ===');
    
    const testTexts = [
      {
        name: '纯中文文本',
        content: '这是一个用户认证系统的需求文档，包含登录、注册、权限管理等功能。',
        expected: 'zh'
      },
      {
        name: '纯英文文本',
        content: 'This is a user authentication system requirements document including login, registration, and permission management features.',
        expected: 'en'
      },
      {
        name: '中英混合文本',
        content: '实现一个API Gateway系统，支持load balancing和rate limiting功能。',
        expected: 'zh'
      },
      {
        name: '技术文档',
        content: '# API Documentation\n\n## Authentication\n\nUse JWT tokens for authentication.',
        expected: 'en'
      }
    ];

    testTexts.forEach((test, index) => {
      const result = this.engine.detectLanguage(test.content);
      const status = result.detectedLanguage === test.expected ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${test.name}`);
      console.log(`   检测语言: ${result.detectedLanguage} (期望: ${test.expected})`);
      console.log(`   置信度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   混合语言: ${result.mixedLanguage ? '是' : '否'}`);
      if (result.languageDistribution) {
        console.log(`   语言分布: 中文=${(result.languageDistribution.zh * 100).toFixed(1)}%, 英文=${(result.languageDistribution.en * 100).toFixed(1)}%`);
      }
      console.log('');
    });
  }

  /**
   * 测试上下文分析功能
   */
  testContextAnalysis() {
    console.log('\n=== 测试上下文分析功能 ===');
    
    const testDocuments = [
      {
        name: '简单需求文档',
        content: `# 用户注册功能需求

## 功能描述
用户可以通过邮箱注册账户。

## 验收标准
- 邮箱格式验证
- 密码强度检查`,
        type: 'requirements'
      },
      {
        name: '复杂技术文档',
        content: `# 分布式缓存系统设计

## 架构概览
系统采用Redis cluster架构，支持数据分片和故障转移。

## 核心组件

### Cache Manager
\`\`\`typescript
interface CacheManager {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}
\`\`\`

### Shard Router
负责数据分片路由：
- 一致性哈希算法
- 故障检测与转移
- 负载均衡策略

## API接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /cache/{key} | 获取缓存 |
| POST | /cache | 设置缓存 |
| DELETE | /cache/{key} | 删除缓存 |`,
        type: 'design'
      }
    ];

    testDocuments.forEach((doc, index) => {
      const analysis = this.engine.analyzeContext(doc.content, doc.type);
      console.log(`📊 Test ${index + 1}: ${doc.name}`);
      console.log(`   文档结构:`);
      console.log(`     - 章节数: ${analysis.documentStructure.sections}`);
      console.log(`     - 子章节数: ${analysis.documentStructure.subsections}`);
      console.log(`     - 代码块数: ${analysis.documentStructure.codeBlocks}`);
      console.log(`     - 列表数: ${analysis.documentStructure.lists}`);
      console.log(`     - 表格数: ${analysis.documentStructure.tables}`);
      console.log(`   内容分布:`);
      console.log(`     - 文本内容: ${analysis.contentDistribution.text} 字符`);
      console.log(`     - 代码内容: ${analysis.contentDistribution.code} 字符`);
      console.log(`   技术复杂度: ${analysis.technicalComplexity}`);
      console.log(`   推荐策略: ${analysis.recommendedStrategy}`);
      console.log('');
    });
  }

  /**
   * 测试格式预处理功能
   */
  testFormatPreprocessing() {
    console.log('\n=== 测试格式预处理功能 ===');
    
    const testContent = `# API 文档

## 认证接口

使用JWT token进行认证：

\`\`\`typescript
interface AuthRequest {
  username: string;
  password: string;
}
\`\`\`

详细信息请参考[官方文档](https://example.com/docs)。

### 响应格式

| 字段 | 类型 | 描述 |
|------|------|------|
| token | string | JWT token |
| expires | number | 过期时间 |

\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": 3600
}
\`\`\``;

    const result = this.engine.preprocessFormatting(testContent, true);
    
    console.log('✅ 格式预处理测试');
    console.log(`原始内容长度: ${testContent.length} 字符`);
    console.log(`处理后内容长度: ${result.content.length} 字符`);
    console.log(`格式标记数量: ${result.formatMarkers.length}`);
    
    result.formatMarkers.forEach((marker, index) => {
      console.log(`   标记 ${index + 1}: ${marker.type} -> ${marker.marker}`);
    });
    
    console.log('\n处理后内容预览:');
    console.log(result.content.substring(0, 200) + '...');
    console.log('');
  }

  /**
   * 测试文档生成功能
   */
  async testDocumentGeneration() {
    console.log('\n=== 测试文档生成功能 ===');
    
    const testRequests = [
      {
        name: '中译英技术文档',
        request: {
          content: `# 用户认证系统需求

## 功能概述
系统需要支持用户注册、登录和权限管理功能。

## 核心特性
- JWT token认证
- 角色权限控制  
- 密码安全策略
- 会话管理`,
          sourceLanguage: 'zh',
          targetLanguage: 'en',
          documentType: 'requirements',
          domain: 'technical',
          preserveFormatting: true
        }
      },
      {
        name: '英译中API文档',
        request: {
          content: `# Authentication API

## Overview
This API provides user authentication services including login, registration, and token management.

## Endpoints

### POST /auth/login
Authenticate user credentials and return JWT token.

**Request Body:**
\`\`\`json
{
  "username": "string",
  "password": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "string",
  "expires": "number"
}
\`\`\``,
          sourceLanguage: 'en',
          targetLanguage: 'zh',
          documentType: 'api',
          domain: 'technical',
          preserveFormatting: true
        }
      }
    ];

    for (let i = 0; i < testRequests.length; i++) {
      const test = testRequests[i];
      try {
        console.log(`\n📝 Test ${i + 1}: ${test.name}`);
        console.log(`源语言: ${test.request.sourceLanguage} -> 目标语言: ${test.request.targetLanguage}`);
        console.log(`文档类型: ${test.request.documentType}`);
        console.log(`领域: ${test.request.domain}`);
        
        const startTime = Date.now();
        const response = await this.engine.generateDocument(test.request);
        const endTime = Date.now();
        
        console.log(`✅ 生成成功 (${endTime - startTime}ms)`);
        console.log(`处理时间: ${response.processingTime}ms`);
        console.log(`置信度: ${(response.confidence * 100).toFixed(1)}%`);
        console.log(`使用模型: ${response.metadata.translationModel}`);
        console.log(`技术术语数: ${response.metadata.technicalTermCount}`);
        
        console.log('\n原始内容预览:');
        console.log(response.originalContent.substring(0, 150) + '...');
        
        console.log('\n翻译结果预览:');
        console.log(response.translatedContent.substring(0, 150) + '...');
        
      } catch (error) {
        console.log(`❌ 生成失败: ${error}`);
      }
    }
  }

  /**
   * 测试引擎统计信息
   */
  testEngineStats() {
    console.log('\n=== 测试引擎统计信息 ===');
    
    const stats = this.engine.getEngineStats();
    console.log('✅ 引擎统计获取成功');
    console.log(`支持的语言: ${stats.supportedLanguages.join(', ')}`);
    console.log(`支持的文档类型: ${stats.supportedDocumentTypes.join(', ')}`);
    console.log(`术语词典条目: ${stats.terminologyEntries}`);
    console.log('配置信息:', {
      defaultDomain: stats.configuration.defaultDomain,
      enableContextAnalysis: stats.configuration.enableContextAnalysis,
      enableTerminologyConsistency: stats.configuration.enableTerminologyConsistency,
      timeout: stats.configuration.timeout
    });
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🌐 开始多语言文档引擎测试\n');
    
    try {
      this.testLanguageDetection();
      this.testContextAnalysis();
      this.testFormatPreprocessing();
      await this.testDocumentGeneration();
      this.testEngineStats();
      
      console.log('\n✅ 所有测试完成');
    } catch (error) {
      console.log('\n❌ 测试过程中出现错误:', error);
    }
  }
}

// 运行测试
const test = new MultilingualEngineTest();
test.runAllTests().catch(console.error);
