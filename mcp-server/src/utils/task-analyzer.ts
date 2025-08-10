/**
 * 任务分析工具 - 智能分析用户任务并决定需要的代理类型
 */

import { TaskAnalysisResult, ComplexityLevel } from '../types/agent.js';

export class TaskAnalyzer {
  private designKeywords = [
    'architecture', '架构', 'design', '设计', 'api', '接口',
    'database', '数据库', 'schema', '模式', 'uml', '流程图',
    'system', '系统', 'module', '模块', 'component', '组件'
  ];

  private implementationKeywords = [
    'code', '代码', 'programming', '编程', 'implementation', '实现',
    'develop', '开发', 'build', '构建', 'function', '函数',
    'class', '类', 'method', '方法', 'algorithm', '算法'
  ];

  private testingKeywords = [
    'test', '测试', 'testing', '测试', 'unit test', '单元测试',
    'integration test', '集成测试', 'qa', 'quality', '质量',
    'verification', '验证', 'validation', '确认'
  ];

  private documentationKeywords = [
    'document', '文档', 'documentation', '文档化', 'manual', '手册',
    'guide', '指南', 'readme', 'spec', '规格', 'specification', '规范'
  ];

  private deploymentKeywords = [
    'deploy', '部署', 'deployment', '部署', 'ci/cd', 'pipeline', '流水线',
    'docker', 'kubernetes', 'cloud', '云', 'server', '服务器'
  ];

  private domainKeywords = {
    web: ['web', 'website', '网站', 'frontend', '前端', 'backend', '后端', 'html', 'css', 'javascript'],
    mobile: ['mobile', '移动', 'app', '应用', 'ios', 'android', 'react native', 'flutter'],
    ai: ['ai', '人工智能', 'machine learning', '机器学习', 'deep learning', '深度学习', 'nlp', 'cv'],
    data: ['data', '数据', 'database', '数据库', 'analytics', '分析', 'etl', 'pipeline'],
    enterprise: ['enterprise', '企业', 'crm', 'erp', 'workflow', '工作流', 'business', '业务']
  };

  /**
   * 分析任务内容并返回分析结果
   */
  analyze(taskContent: string): TaskAnalysisResult {
    const keywords = this.extractKeywords(taskContent);
    const complexity = this.assessComplexity(taskContent, keywords);
    const domain = this.identifyDomain(keywords);

    return {
      complexity,
      domain,
      keywords,
      estimated_duration: this.estimateDuration(complexity, keywords),
      requires_agents: {
        coordinator: true, // 总是需要协调器
        requirements: taskContent.length > 100 || complexity !== 'simple',
        design: this.hasDesignKeywords(keywords) || complexity === 'complex',
        implementation: this.hasImplementationKeywords(keywords),
        testing: this.hasTestingKeywords(keywords) || complexity === 'complex',
        documentation: this.hasDocumentationKeywords(keywords) || complexity === 'complex',
        deployment: this.hasDeploymentKeywords(keywords)
      }
    };
  }

  private extractKeywords(content: string): string[] {
    const text = content.toLowerCase();
    const allKeywords = [
      ...this.designKeywords,
      ...this.implementationKeywords,
      ...this.testingKeywords,
      ...this.documentationKeywords,
      ...this.deploymentKeywords,
      ...Object.values(this.domainKeywords).flat()
    ];

    return allKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private assessComplexity(content: string, keywords: string[]): ComplexityLevel {
    let score = 0;

    // 基于内容长度
    if (content.length > 500) score += 2;
    else if (content.length > 200) score += 1;

    // 基于关键词数量和复杂性
    if (keywords.length > 15) score += 2;
    else if (keywords.length > 8) score += 1;

    // 基于特定复杂性指标
    const complexityIndicators = [
      'microservice', '微服务', 'distributed', '分布式',
      'scalable', '可扩展', 'high-performance', '高性能',
      'real-time', '实时', 'concurrent', '并发'
    ];

    const hasComplexityIndicators = complexityIndicators.some(indicator =>
      content.toLowerCase().includes(indicator)
    );

    if (hasComplexityIndicators) score += 2;

    // 基于多领域涉及
    const domains = this.identifyDomain(keywords);
    if (domains.length > 2) score += 1;

    if (score >= 4) return 'complex';
    if (score >= 2) return 'medium';
    return 'simple';
  }

  private identifyDomain(keywords: string[]): string[] {
    const domains = [];

    for (const [domain, domainKeywords] of Object.entries(this.domainKeywords)) {
      const hasKeywords = domainKeywords.some(keyword =>
        keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (hasKeywords) {
        domains.push(domain);
      }
    }

    return domains.length > 0 ? domains : ['general'];
  }

  private hasDesignKeywords(keywords: string[]): boolean {
    return keywords.some(k =>
      this.designKeywords.some(dk => k.toLowerCase().includes(dk.toLowerCase()))
    );
  }

  private hasImplementationKeywords(keywords: string[]): boolean {
    return keywords.some(k =>
      this.implementationKeywords.some(ik => k.toLowerCase().includes(ik.toLowerCase()))
    );
  }

  private hasTestingKeywords(keywords: string[]): boolean {
    return keywords.some(k =>
      this.testingKeywords.some(tk => k.toLowerCase().includes(tk.toLowerCase()))
    );
  }

  private hasDocumentationKeywords(keywords: string[]): boolean {
    return keywords.some(k =>
      this.documentationKeywords.some(dk => k.toLowerCase().includes(dk.toLowerCase()))
    );
  }

  private hasDeploymentKeywords(keywords: string[]): boolean {
    return keywords.some(k =>
      this.deploymentKeywords.some(dk => k.toLowerCase().includes(dk.toLowerCase()))
    );
  }

  private estimateDuration(complexity: ComplexityLevel, keywords: string[]): string {
    const baseHours = {
      simple: 4,
      medium: 16,
      complex: 40
    };

    const agentCount = [
      this.hasDesignKeywords(keywords),
      this.hasImplementationKeywords(keywords),
      this.hasTestingKeywords(keywords),
      this.hasDocumentationKeywords(keywords),
      this.hasDeploymentKeywords(keywords)
    ].filter(Boolean).length;

    const totalHours = baseHours[complexity] + (agentCount * 2);

    if (totalHours < 8) return `${totalHours} 小时`;
    if (totalHours < 40) return `${Math.ceil(totalHours / 8)} 天`;
    return `${Math.ceil(totalHours / 40)} 周`;
  }
}
