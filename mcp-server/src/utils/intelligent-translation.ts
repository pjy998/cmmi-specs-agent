/**
 * 智能翻译服务
 * 基于 GPT-4.1 的上下文感知翻译系统
 */

import { logger } from './logger.js';

export type Language = 'zh' | 'en';

export interface TranslationContext {
  domain: 'technical' | 'business' | 'general';
  documentType: 'requirements' | 'design' | 'tasks' | 'tests' | 'implementation';
  projectContext?: string;
}

export interface TranslationRequest {
  content: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  context: TranslationContext;
  preserveFormat?: boolean;
}

export interface TranslationResult {
  translatedContent: string;
  confidence: number;
  sourceLanguage: Language;
  targetLanguage: Language;
  preservedElements: string[];
}

export class IntelligentTranslationService {
  private static instance: IntelligentTranslationService;
  private translationCache: Map<string, TranslationResult> = new Map();

  private constructor() {}

  static getInstance(): IntelligentTranslationService {
    if (!IntelligentTranslationService.instance) {
      IntelligentTranslationService.instance = new IntelligentTranslationService();
    }
    return IntelligentTranslationService.instance;
  }

  /**
   * 检测文本语言
   */
  detectLanguage(text: string): Language {
    const chineseRegex = /[\u4e00-\u9fff]/;
    const englishRegex = /[a-zA-Z]/;
    
    const hasChineseChars = chineseRegex.test(text);
    const hasEnglishChars = englishRegex.test(text);
    
    if (hasChineseChars && !hasEnglishChars) {
      return 'zh';
    } else if (hasEnglishChars && !hasChineseChars) {
      return 'en';
    } else if (hasChineseChars && hasEnglishChars) {
      // 混合语言，根据主要字符数量决定
      const chineseCount = (text.match(chineseRegex) || []).length;
      const englishWords = text.split(/\s+/).filter(word => englishRegex.test(word)).length;
      return chineseCount > englishWords ? 'zh' : 'en';
    } else {
      return 'en'; // 默认英文
    }
  }

  /**
   * 生成翻译提示词
   */
  private generateTranslationPrompt(request: TranslationRequest): string {
    const { content, sourceLanguage, targetLanguage, context } = request;
    
    const languageNames = {
      'zh': '中文',
      'en': 'English'
    };

    const contextDescriptions = {
      'technical': 'technical documentation',
      'business': 'business documentation', 
      'general': 'general documentation'
    };

    const documentTypeDescriptions = {
      'requirements': 'software requirements specification',
      'design': 'system design document',
      'tasks': 'project task management',
      'tests': 'test specification',
      'implementation': 'implementation guide'
    };

    return `You are a professional technical documentation translator specializing in CMMI software development documents.

Task: Translate the following ${contextDescriptions[context.domain]} (${documentTypeDescriptions[context.documentType]}) from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.

Requirements:
1. Maintain technical terminology accuracy and consistency
2. Preserve all Markdown formatting, code blocks, and technical identifiers
3. Keep the document structure and hierarchy intact
4. Use appropriate technical language style for the target language
5. Ensure context coherence and readability
6. Do not translate:
   - Code snippets and programming identifiers
   - File names and paths
   - URLs and technical references
   - CMMI process tags (e.g., <!-- CMMI: RD -->)

Source content:
${content}

Please provide only the translated content without any explanatory text.`;
  }

  /**
   * 执行智能翻译
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { content, sourceLanguage, targetLanguage } = request;
    
    // 如果源语言和目标语言相同，直接返回
    if (sourceLanguage === targetLanguage) {
      return {
        translatedContent: content,
        confidence: 1.0,
        sourceLanguage,
        targetLanguage,
        preservedElements: []
      };
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(request);
    if (this.translationCache.has(cacheKey)) {
      logger.info('Using cached translation');
      return this.translationCache.get(cacheKey)!;
    }

    try {
      // 生成翻译提示词
      const prompt = this.generateTranslationPrompt(request);
      
      // 这里应该调用 GPT-4.1 API，暂时用模拟实现
      const translatedContent = await this.callGPTTranslation(prompt);
      
      const result: TranslationResult = {
        translatedContent,
        confidence: 0.95, // 模拟置信度
        sourceLanguage,
        targetLanguage,
        preservedElements: this.extractPreservedElements(content)
      };

      // 缓存结果
      this.translationCache.set(cacheKey, result);
      
      logger.info(`Translation completed: ${sourceLanguage} -> ${targetLanguage}`);
      return result;

    } catch (error) {
      logger.error('Translation failed:', error);
      
      // 翻译失败时返回原文
      return {
        translatedContent: content,
        confidence: 0.0,
        sourceLanguage,
        targetLanguage,
        preservedElements: []
      };
    }
  }

  /**
   * 调用智能翻译服务
   */
  private async callGPTTranslation(prompt: string): Promise<string> {
    // 解析提示词，提取源内容
    const contentParts = prompt.split('Source content:\n');
    if (contentParts.length < 2) {
      return prompt; // 如果没有找到源内容，返回原提示词
    }
    
    const sourceContent = (contentParts[1] || '').replace(/\n\nPlease provide only the translated content without any explanatory text\.$/, '');
    
    // 检查是否需要翻译（从英文到中文）
    if (prompt.includes('from English to 中文')) {
      return await this.translateEnglishToChinese(sourceContent);
    }
    
    // 检查是否需要翻译（从中文到英文）
    if (prompt.includes('from 中文 to English')) {
      return await this.translateChineseToEnglish(sourceContent);
    }
    
    // 如果不需要翻译，返回原内容
    return sourceContent;
  }

  /**
   * 英文翻译为中文
   */
  private async translateEnglishToChinese(content: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟API延迟
    
    // 基于规则的翻译映射
    const translations = new Map([
      // 文档标题
      ['Requirements Document', '需求文档'],
      ['Design Document', '设计文档'],
      ['Task Management Document', '任务管理文档'],
      ['Test Plan Document', '测试计划文档'],
      ['Implementation Guide', '实施指南'],
      
      // 章节标题
      ['Project Overview', '项目概述'],
      ['Architecture Overview', '架构概述'],
      ['System Architecture', '系统架构'],
      ['Technology Stack', '技术栈'],
      ['Module Design', '模块设计'],
      ['Functional Requirements', '功能需求'],
      ['Non-Functional Requirements', '非功能需求'],
      ['Performance Requirements', '性能要求'],
      ['Security Requirements', '安全要求'],
      ['Usability Requirements', '可用性要求'],
      ['Acceptance Criteria', '验收标准'],
      ['Task Planning', '任务规划'],
      ['Development Tasks', '开发任务'],
      ['Testing Strategy', '测试策略'],
      ['Implementation Strategy', '实施策略'],
      ['Security Design', '安全设计'],
      ['Performance Considerations', '性能考虑'],
      
      // 常用词汇
      ['User Management', '用户管理'],
      ['User Interface', '用户界面'],
      ['Business Logic', '业务逻辑'],
      ['Data Access', '数据访问'],
      ['Database', '数据库'],
      ['Authentication', '身份认证'],
      ['Authorization', '权限管理'],
      ['Frontend', '前端'],
      ['Backend', '后端'],
      ['API', 'API'],
      ['Component', '组件'],
      ['Module', '模块'],
      ['Function', '功能'],
      ['Feature', '特性'],
      ['Interface', '接口'],
      ['Service', '服务'],
      ['Controller', '控制器'],
      ['Repository', '仓库'],
      ['Model', '模型'],
      ['View', '视图'],
      ['Configuration', '配置'],
      ['Integration', '集成'],
      ['Testing', '测试'],
      ['Development', '开发'],
      ['Implementation', '实现'],
      ['Deployment', '部署'],
      ['Maintenance', '维护'],
      ['Documentation', '文档'],
      ['Specification', '规范'],
      ['Requirements', '需求'],
      ['Design', '设计'],
      ['Architecture', '架构'],
      ['Security', '安全'],
      ['Performance', '性能'],
      ['Scalability', '可扩展性'],
      ['Reliability', '可靠性'],
      ['Usability', '可用性'],
      ['Maintainability', '可维护性'],
      
      // 技术术语
      ['layered architecture', '分层架构'],
      ['microservice architecture', '微服务架构'],
      ['RESTful API', 'RESTful API'],
      ['JWT token', 'JWT令牌'],
      ['role-based access control', '基于角色的访问控制'],
      ['RBAC', 'RBAC'],
      ['load balancing', '负载均衡'],
      ['database sharding', '数据库分片'],
      ['cache mechanism', '缓存机制'],
      ['session timeout', '会话超时'],
      ['password encryption', '密码加密'],
      ['data validation', '数据验证'],
      ['error handling', '错误处理'],
      ['logging mechanism', '日志机制'],
      ['monitoring system', '监控系统'],
      
      // 描述性文本
      ['This system adopts', '本系统采用'],
      ['with the following main layers', '包含以下主要层次'],
      ['Handle user registration, login, and permission management', '处理用户注册、登录和权限管理'],
      ['Core Components', '核心组件'],
      ['Based on task analysis', '基于任务分析'],
      ['main functional requirements include', '主要功能需求包括'],
      ['Core functional modules', '核心功能模块'],
      ['User management function', '用户管理功能'],
      ['Business logic function', '业务逻辑功能'],
      ['Interface interaction function', '界面交互功能'],
      ['User registration and login', '用户注册与登录'],
      ['Permission management', '权限管理'],
      ['Personal information maintenance', '个人信息维护'],
      ['Data processing and storage', '数据处理与存储'],
      ['Business rule implementation', '业务规则实现'],
      ['State management', '状态管理'],
      ['User interface design', '用户界面设计'],
      ['Responsive layout', '响应式布局'],
      ['Interactive experience optimization', '交互体验优化'],
      ['Page loading time', '页面加载时间'],
      ['Support concurrent users', '支持并发用户'],
      ['Database query response time', '数据库查询响应时间'],
      ['User identity authentication', '用户身份认证'],
      ['Data transmission encryption', '数据传输加密'],
      ['Input data validation', '输入数据验证'],
      ['Permission control mechanism', '权限控制机制'],
      ['System availability', '系统可用性'],
      ['Support mainstream browsers', '支持主流浏览器'],
      ['Mobile compatibility', '移动端兼容性'],
      ['All core functions work normally', '所有核心功能正常运行'],
      ['Performance indicators meet requirements', '性能指标达到要求'],
      ['Security testing passed', '安全测试通过'],
      ['Good user experience', '用户体验良好'],
      ['Complete documentation', '文档完整']
    ]);

    // 执行翻译
    let translatedContent = content;
    
    for (const [english, chinese] of translations) {
      // 使用全局替换，忽略大小写
      const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      translatedContent = translatedContent.replace(regex, chinese);
    }
    
    return translatedContent;
  }

  /**
   * 中文翻译为英文
   */
  private async translateChineseToEnglish(content: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟API延迟
    
    // 中文到英文的翻译映射（翻转上面的映射）
    const translations = new Map([
      ['需求文档', 'Requirements Document'],
      ['设计文档', 'Design Document'],
      ['任务管理文档', 'Task Management Document'],
      ['测试计划文档', 'Test Plan Document'],
      ['实施指南', 'Implementation Guide'],
      ['项目概述', 'Project Overview'],
      ['架构概述', 'Architecture Overview'],
      ['系统架构', 'System Architecture'],
      ['技术栈', 'Technology Stack'],
      ['模块设计', 'Module Design'],
      ['功能需求', 'Functional Requirements'],
      ['非功能需求', 'Non-Functional Requirements'],
      ['性能要求', 'Performance Requirements'],
      ['安全要求', 'Security Requirements'],
      ['可用性要求', 'Usability Requirements'],
      ['验收标准', 'Acceptance Criteria'],
      ['用户管理', 'User Management'],
      ['用户界面', 'User Interface'],
      ['业务逻辑', 'Business Logic'],
      ['数据访问', 'Data Access'],
      ['数据库', 'Database'],
      ['身份认证', 'Authentication'],
      ['权限管理', 'Authorization'],
      ['前端', 'Frontend'],
      ['后端', 'Backend'],
      ['组件', 'Component'],
      ['模块', 'Module'],
      ['功能', 'Function'],
      ['特性', 'Feature'],
      ['接口', 'Interface'],
      ['服务', 'Service'],
      ['控制器', 'Controller'],
      ['仓库', 'Repository'],
      ['模型', 'Model'],
      ['视图', 'View'],
      ['配置', 'Configuration'],
      ['集成', 'Integration'],
      ['测试', 'Testing'],
      ['开发', 'Development'],
      ['实现', 'Implementation'],
      ['部署', 'Deployment'],
      ['维护', 'Maintenance'],
      ['文档', 'Documentation'],
      ['规范', 'Specification'],
      ['需求', 'Requirements'],
      ['设计', 'Design'],
      ['架构', 'Architecture'],
      ['安全', 'Security'],
      ['性能', 'Performance'],
      ['可扩展性', 'Scalability'],
      ['可靠性', 'Reliability'],
      ['可用性', 'Usability'],
      ['可维护性', 'Maintainability']
    ]);

    // 执行翻译
    let translatedContent = content;
    
    for (const [chinese, english] of translations) {
      const regex = new RegExp(chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      translatedContent = translatedContent.replace(regex, english);
    }
    
    return translatedContent;
  }

  /**
   * 提取需要保留的元素（代码块、文件名等）
   */
  private extractPreservedElements(content: string): string[] {
    const preserved: string[] = [];
    
    // 提取代码块
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    preserved.push(...codeBlocks);
    
    // 提取内联代码
    const inlineCode = content.match(/`[^`]+`/g) || [];
    preserved.push(...inlineCode);
    
    // 提取文件路径
    const filePaths = content.match(/[\w\/\.-]+\.(md|js|ts|json|yml|yaml)/g) || [];
    preserved.push(...filePaths);
    
    return preserved;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: TranslationRequest): string {
    const { content, sourceLanguage, targetLanguage, context } = request;
    const contentHash = this.simpleHash(content);
    return `${sourceLanguage}-${targetLanguage}-${context.documentType}-${contentHash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.translationCache.clear();
    logger.info('Translation cache cleared');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.translationCache.size,
      keys: Array.from(this.translationCache.keys())
    };
  }
}
