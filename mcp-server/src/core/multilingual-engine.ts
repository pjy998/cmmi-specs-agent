/**
 * Multilingual Document Generator Engine
 * 多语言文档生成引擎核心实现
 */

import {
  SupportedLanguage,
  DocumentType,
  DocumentGenerationRequest,
  DocumentGenerationResponse,
  DocumentMetadata,
  LanguageDetectionResult,
  TranslationQuality,
  MultilingualEngineConfig,
  TerminologyGlossary,
  ContextAnalysis
} from '../types/multilingual-engine.js';
import { ModelScheduler } from './model-scheduler.js';
import { logger } from '../utils/logger.js';

export class MultilingualDocumentEngine {
  private modelScheduler: ModelScheduler;
  private config: MultilingualEngineConfig;
  private terminologyGlossary: TerminologyGlossary;

  constructor(modelScheduler: ModelScheduler, config?: Partial<MultilingualEngineConfig>) {
    this.modelScheduler = modelScheduler;
    this.config = {
      defaultDomain: 'technical',
      enableContextAnalysis: true,
      enableTerminologyConsistency: true,
      enableQualityAssessment: true,
      maxRetries: 3,
      timeout: 60000,
      cachingEnabled: true,
      formatting: {
        preserveHeaders: true,
        preserveCodeBlocks: true,
        preserveLists: true,
        preserveTables: true,
        preserveLinks: true,
        preserveLineBreaks: true
      },
      ...config
    };
    this.terminologyGlossary = {};
  }

  /**
   * 生成多语言文档
   * Generate multilingual document with intelligent translation
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('🌐 Starting multilingual document generation', {
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        documentType: request.documentType,
        contentLength: request.content.length
      });

      // 1. 语言检测验证
      const languageValidation = this.detectLanguage(request.content);
      if (languageValidation.detectedLanguage !== request.sourceLanguage) {
        logger.warn('Language mismatch detected', {
          declared: request.sourceLanguage,
          detected: languageValidation.detectedLanguage
        });
      }

      // 2. 上下文分析
      const contextAnalysis = this.analyzeContext(request.content, request.documentType);

      // 3. 格式预处理
      const { content: preprocessedContent, formatMarkers } = this.preprocessFormatting(
        request.content, 
        request.preserveFormatting
      );

      // 4. 构建翻译提示
      const translationPrompt = this.buildTranslationPrompt(
        preprocessedContent,
        request,
        contextAnalysis
      );

      // 5. 调用模型进行翻译
      const translationResponse = await this.modelScheduler.invokeModel(
        'spec-agent', // 使用规范代理进行文档翻译
        translationPrompt,
        {
          domain: request.domain || this.config.defaultDomain,
          timeout: this.config.timeout,
          complexity: contextAnalysis.technicalComplexity === 'high' ? 'complex' : 
                     contextAnalysis.technicalComplexity === 'medium' ? 'medium' : 'simple'
        }
      );

      // 6. 格式后处理
      const translatedContent = this.postprocessFormatting(
        translationResponse.content,
        formatMarkers,
        request.preserveFormatting
      );

      // 7. 质量评估
      const qualityMetrics = this.assessTranslationQuality(
        request.content,
        translatedContent,
        request
      );

      // 8. 生成元数据
      const metadata = this.generateMetadata(
        request,
        translationResponse,
        qualityMetrics
      );

      const processingTime = Date.now() - startTime;

      logger.info('✅ Multilingual document generation completed', {
        processingTime,
        qualityScore: qualityMetrics.accuracy
      });

      return {
        originalContent: request.content,
        translatedContent,
        metadata,
        processingTime,
        confidence: qualityMetrics.accuracy
      };

    } catch (error) {
      logger.error('❌ Document generation failed', { error });
      throw new Error(`Multilingual document generation failed: ${error}`);
    }
  }

  /**
   * 检测文档语言
   * Detect document language with confidence scoring
   */
  detectLanguage(content: string): LanguageDetectionResult {
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    const totalChars = content.length;

    const chineseRatio = chineseChars / totalChars;
    const englishRatio = englishWords / totalChars;

    let detectedLanguage: SupportedLanguage;
    let confidence: number;
    
    if (chineseRatio > 0.3) {
      detectedLanguage = 'zh';
      confidence = Math.min(chineseRatio * 2, 1);
    } else if (englishRatio > 0.4) {
      detectedLanguage = 'en';
      confidence = Math.min(englishRatio * 1.5, 1);
    } else {
      // 默认为英文，但置信度较低
      detectedLanguage = 'en';
      confidence = 0.5;
    }

    const mixedLanguage = chineseRatio > 0.1 && englishRatio > 0.1;

    return {
      detectedLanguage,
      confidence,
      mixedLanguage,
      languageDistribution: {
        zh: chineseRatio,
        en: englishRatio
      }
    };
  }

  /**
   * 分析文档上下文
   * Analyze document context and structure
   */
  analyzeContext(content: string, _documentType: DocumentType): ContextAnalysis {
    
    // 分析文档结构
    const sections = (content.match(/^#{1,6}\s/gm) || []).length;
    const subsections = (content.match(/^#{2,6}\s/gm) || []).length;
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
    const lists = (content.match(/^[\s]*[-*+]\s/gm) || []).length;
    const tables = (content.match(/\|.*\|/g) || []).length;

    // 分析内容分布
    const codeContent = (content.match(/```[\s\S]*?```/g) || []).join('').length;
    const textContent = content.length - codeContent;
    
    // 技术复杂度评估
    const technicalTerms = [
      'API', 'interface', 'class', 'function', 'algorithm', 'architecture',
      'protocol', 'framework', 'database', 'implementation', 'configuration'
    ];
    const technicalTermCount = technicalTerms.reduce((count, term) => {
      return count + (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
    }, 0);

    let technicalComplexity: 'low' | 'medium' | 'high';
    if (technicalTermCount > 20 || codeBlocks > 10) {
      technicalComplexity = 'high';
    } else if (technicalTermCount > 5 || codeBlocks > 3) {
      technicalComplexity = 'medium';
    } else {
      technicalComplexity = 'low';
    }

    // 推荐翻译策略
    let recommendedStrategy: 'direct' | 'sectioned' | 'contextual';
    if (content.length < 1000 && sections < 3) {
      recommendedStrategy = 'direct';
    } else if (sections > 5 || codeBlocks > 5) {
      recommendedStrategy = 'sectioned';
    } else {
      recommendedStrategy = 'contextual';
    }

    return {
      documentStructure: {
        sections,
        subsections,
        codeBlocks,
        lists,
        tables
      },
      contentDistribution: {
        text: textContent,
        code: codeContent,
        metadata: content.length - textContent - codeContent
      },
      technicalComplexity,
      recommendedStrategy
    };
  }

  /**
   * 格式预处理
   * Preprocess formatting markers for preservation
   */
  preprocessFormatting(
    content: string, 
    preserveFormatting: boolean = true
  ): { content: string; formatMarkers: any[] } {
    if (!preserveFormatting) {
      return { content, formatMarkers: [] };
    }

    const formatMarkers: any[] = [];
    let processedContent = content;

    // 保护代码块
    if (this.config.formatting.preserveCodeBlocks) {
      const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
      codeBlocks.forEach((block, index) => {
        const marker = `__CODE_BLOCK_${index}__`;
        formatMarkers.push({ type: 'code', marker, content: block });
        processedContent = processedContent.replace(block, marker);
      });
    }

    // 保护链接
    if (this.config.formatting.preserveLinks) {
      const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      links.forEach((link, index) => {
        const marker = `__LINK_${index}__`;
        formatMarkers.push({ type: 'link', marker, content: link });
        processedContent = processedContent.replace(link, marker);
      });
    }

    return { content: processedContent, formatMarkers };
  }

  /**
   * 构建翻译提示
   * Build translation prompt with context awareness
   */
  buildTranslationPrompt(
    content: string,
    request: DocumentGenerationRequest,
    contextAnalysis: ContextAnalysis
  ): string {
    const { sourceLanguage, targetLanguage, documentType, domain } = request;

    let systemPrompt = `You are a professional technical document translator specializing in ${documentType} documents. `;
    systemPrompt += `Translate from ${sourceLanguage} to ${targetLanguage} with high accuracy and context awareness.`;

    let contextPrompt = '';
    if (domain === 'technical') {
      contextPrompt = 'Maintain technical terminology consistency and preserve technical accuracy. ';
    } else if (domain === 'business') {
      contextPrompt = 'Use business-appropriate language and maintain professional tone. ';
    }

    let formatInstructions = '';
    if (request.preserveFormatting) {
      formatInstructions = 'Preserve all formatting markers, code blocks, and document structure. ';
    }

    const translationGuidelines = this.getDocumentTypeGuidelines(documentType);

    return `${systemPrompt}

${contextPrompt}${formatInstructions}

Document Type: ${documentType}
Domain: ${domain || 'technical'}
Technical Complexity: ${contextAnalysis.technicalComplexity}

Translation Guidelines:
${translationGuidelines}

Content to translate:
${content}

Please provide a high-quality translation that maintains the original meaning, technical accuracy, and document structure.`;
  }

  /**
   * 获取文档类型翻译指南
   * Get document type specific translation guidelines
   */
  getDocumentTypeGuidelines(documentType: DocumentType): string {
    const guidelines = {
      'requirements': 'Focus on precise requirement statements, use cases, and acceptance criteria. Maintain clarity and testability.',
      'design': 'Preserve technical architecture details, component relationships, and design rationale.',
      'tasks': 'Keep task descriptions clear and actionable. Maintain priority levels and dependencies.',
      'tests': 'Preserve test case structure, expected results, and verification criteria.',
      'implementation': 'Maintain code comments, technical details, and implementation notes.',
      'api': 'Preserve endpoint definitions, parameter descriptions, and response formats.',
      'user-guide': 'Use user-friendly language while maintaining technical accuracy.',
      'technical-spec': 'Maintain technical precision, specifications, and standards compliance.'
    };

    return guidelines[documentType] || 'Maintain document structure and technical accuracy.';
  }

  /**
   * 格式后处理
   * Postprocess formatting restoration
   */
  postprocessFormatting(
    content: string,
    formatMarkers: any[],
    preserveFormatting: boolean = true
  ): string {
    if (!preserveFormatting || formatMarkers.length === 0) {
      return content;
    }

    let processedContent = content;

    // 恢复格式标记
    formatMarkers.forEach(marker => {
      processedContent = processedContent.replace(marker.marker, marker.content);
    });

    return processedContent;
  }

  /**
   * 评估翻译质量
   * Assess translation quality with multiple metrics
   */
  assessTranslationQuality(
    originalContent: string,
    translatedContent: string,
    _request: DocumentGenerationRequest
  ): TranslationQuality {
    // 简化的质量评估算法
    const originalLength = originalContent.length;
    const translatedLength = translatedContent.length;
    
    // 长度一致性检查（翻译后长度变化应该合理）
    const lengthRatio = translatedLength / originalLength;
    const lengthConsistency = lengthRatio > 0.5 && lengthRatio < 2.0 ? 0.9 : 0.7;

    // 格式保持检查
    const originalHeaders = (originalContent.match(/^#{1,6}\s/gm) || []).length;
    const translatedHeaders = (translatedContent.match(/^#{1,6}\s/gm) || []).length;
    const formatConsistency = originalHeaders === translatedHeaders ? 1.0 : 0.8;

    // 技术术语保持检查
    const technicalTerms = ['API', 'interface', 'class', 'function'];
    let termPreservation = 1.0;
    technicalTerms.forEach(term => {
      const originalCount = (originalContent.match(new RegExp(term, 'gi')) || []).length;
      const translatedCount = (translatedContent.match(new RegExp(term, 'gi')) || []).length;
      if (originalCount > 0 && Math.abs(originalCount - translatedCount) > 1) {
        termPreservation -= 0.1;
      }
    });

    return {
      consistency: Math.max(0.6, termPreservation),
      fluency: 0.85, // 基于模型质量的假设值
      accuracy: Math.max(0.7, (lengthConsistency + formatConsistency) / 2),
      contextualRelevance: 0.8,
      technicalPrecision: Math.max(0.7, termPreservation)
    };
  }

  /**
   * 生成文档元数据
   * Generate document metadata
   */
  generateMetadata(
    request: DocumentGenerationRequest,
    translationResponse: any,
    _qualityMetrics: TranslationQuality
  ): DocumentMetadata {
    return {
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      documentType: request.documentType,
      domain: request.domain || this.config.defaultDomain,
      wordCount: request.content.split(/\s+/).length,
      technicalTermCount: this.countTechnicalTerms(request.content),
      translationModel: translationResponse.model,
      timestamp: new Date().toISOString(),
      formatPreserved: request.preserveFormatting || false
    };
  }

  /**
   * 统计技术术语数量
   * Count technical terms in content
   */
  private countTechnicalTerms(content: string): number {
    const technicalTerms = [
      'API', 'interface', 'class', 'function', 'algorithm', 'architecture',
      'protocol', 'framework', 'database', 'optimization', 'implementation',
      'configuration', 'deployment', 'integration', 'middleware', 'component'
    ];
    
    return technicalTerms.reduce((count, term) => {
      return count + (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
    }, 0);
  }

  /**
   * 更新引擎配置
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<MultilingualEngineConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取引擎统计信息
   * Get engine statistics
   */
  getEngineStats() {
    return {
      configuration: this.config,
      supportedLanguages: ['zh', 'en'] as SupportedLanguage[],
      supportedDocumentTypes: [
        'requirements', 'design', 'tasks', 'tests', 'implementation',
        'api', 'user-guide', 'technical-spec'
      ] as DocumentType[],
      terminologyEntries: Object.keys(this.terminologyGlossary).length
    };
  }
}
