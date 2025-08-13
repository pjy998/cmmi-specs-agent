/**
 * Multilingual Document Generator Types
 * 多语言文档生成器类型定义
 */

export type SupportedLanguage = 'zh' | 'en';

export type DocumentType = 
  | 'requirements'    // 需求文档
  | 'design'         // 设计文档  
  | 'tasks'          // 任务文档
  | 'tests'          // 测试文档
  | 'implementation' // 实现文档
  | 'api'            // API文档
  | 'user-guide'     // 用户指南
  | 'technical-spec';// 技术规范

export type DocumentDomain = 
  | 'technical'      // 技术领域
  | 'business'       // 业务领域
  | 'general';       // 通用领域

export interface DocumentGenerationRequest {
  content: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  documentType: DocumentType;
  domain?: DocumentDomain;
  preserveFormatting?: boolean;
  includeMetadata?: boolean;
  customPrompts?: DocumentPrompts;
}

export interface DocumentPrompts {
  systemPrompt?: string;
  contextPrompt?: string;
  formatInstructions?: string;
  domainGuidelines?: string;
}

export interface DocumentGenerationResponse {
  originalContent: string;
  translatedContent: string;
  metadata: DocumentMetadata;
  processingTime: number;
  confidence: number;
}

export interface DocumentMetadata {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  documentType: DocumentType;
  domain: DocumentDomain;
  wordCount: number;
  technicalTermCount: number;
  translationModel: string;
  timestamp: string;
  formatPreserved: boolean;
}

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  mixedLanguage: boolean;
  languageDistribution?: {
    zh: number;
    en: number;
  };
}

export interface DocumentFormatting {
  preserveHeaders: boolean;
  preserveCodeBlocks: boolean;
  preserveLists: boolean;
  preserveTables: boolean;
  preserveLinks: boolean;
  preserveLineBreaks: boolean;
}

export interface TranslationQuality {
  consistency: number;        // 术语一致性
  fluency: number;           // 流畅度
  accuracy: number;          // 准确性
  contextualRelevance: number; // 上下文相关性
  technicalPrecision: number;  // 技术精确度
}

export interface MultilingualEngineConfig {
  defaultDomain: DocumentDomain;
  enableContextAnalysis: boolean;
  enableTerminologyConsistency: boolean;
  enableQualityAssessment: boolean;
  maxRetries: number;
  timeout: number;
  cachingEnabled: boolean;
  formatting: DocumentFormatting;
}

export interface TerminologyEntry {
  source: string;
  target: string;
  domain: DocumentDomain;
  confidence: number;
  frequency: number;
}

export interface TerminologyGlossary {
  [key: string]: TerminologyEntry[];
}

export interface ContextAnalysis {
  documentStructure: {
    sections: number;
    subsections: number;
    codeBlocks: number;
    lists: number;
    tables: number;
  };
  contentDistribution: {
    text: number;
    code: number;
    metadata: number;
  };
  technicalComplexity: 'low' | 'medium' | 'high';
  recommendedStrategy: 'direct' | 'sectioned' | 'contextual';
}
