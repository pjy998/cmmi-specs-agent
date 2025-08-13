import { 
  ITaskAnalyzer, 
  TaskAnalysisRequest, 
  TaskAnalysisResult,
  TaskComplexity,
  ComplexityFactor,
  TaskCategory,
  AgentRecommendation,
  ExecutionPlan,
  ExecutionPhase,
  ParsedRequirement,
  CostEstimate,
  TaskAnalyzerConfig,
  TaskAnalyzerState,
  TaskSimilarity,
  LearningFeedback,
  ProjectContext,
  RiskFactor,
  Milestone,
  AnalysisMetrics
} from '../types/taskAnalyzer.js';

/**
 * 智能任务分析器
 * 提供任务复杂度分析、代理推荐、执行计划生成等核心功能
 */
export class TaskAnalyzer implements ITaskAnalyzer {
  private config: TaskAnalyzerConfig;
  private state: TaskAnalyzerState;
  private readonly patterns: Map<string, RegExp[]>;

  constructor(config?: Partial<TaskAnalyzerConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.updateConfig(config);
    }

    this.state = {
      isAnalyzing: false,
      analysisQueue: [],
      completedAnalyses: [],
      learningData: [],
      performanceMetrics: []
    };

    this.patterns = this.initializePatterns();
  }

  /**
   * 分析任务并生成完整分析结果
   */
  async analyzeTask(request: TaskAnalysisRequest): Promise<TaskAnalysisResult> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    this.state.isAnalyzing = true;
    this.state.currentTaskId = taskId;

    try {
      console.log(`🔍 开始分析任务: ${taskId}`);

      // 1. 解析需求
      const parsedRequirements = await this.parseRequirements(request.content);
      console.log(`📋 解析到 ${parsedRequirements.length} 个需求`);

      // 2. 评估复杂度
      const complexity = await this.assessComplexity(request.content, request.projectContext);
      console.log(`🎯 复杂度评估: ${complexity.level} (${complexity.score})`);

      // 3. 分类任务
      const category = this.categorizeTask(request.content, request.domain);
      console.log(`📂 任务分类: ${category.primary} (${category.domain})`);

      // 4. 推荐代理
      const recommendedAgents = await this.recommendAgents(parsedRequirements, category.domain);
      console.log(`🤖 推荐 ${recommendedAgents.length} 个代理`);

      // 5. 生成执行计划
      const executionPlan = await this.generateExecutionPlan(parsedRequirements, recommendedAgents);
      console.log(`📅 生成执行计划: ${executionPlan.phases.length} 个阶段`);

      // 6. 成本估算
      const estimatedCost = this.estimateCost(executionPlan, recommendedAgents);

      // 7. 可行性评分
      const feasibilityScore = this.calculateFeasibilityScore(
        complexity,
        recommendedAgents,
        request.timeConstraint,
        request.availableAgents
      );

      // 8. 生成建议和警告
      const recommendations = this.generateRecommendations(complexity, category, executionPlan);
      const warnings = this.generateWarnings(complexity, feasibilityScore, request);

      const result: TaskAnalysisResult = {
        taskId,
        originalRequest: request.content,
        parsedRequirements,
        complexity,
        category,
        recommendedAgents,
        executionPlan,
        estimatedCost,
        feasibilityScore,
        recommendations,
        warnings
      };

      // 记录性能指标
      const metrics: AnalysisMetrics = {
        processingTime: Date.now() - startTime,
        confidenceScore: this.calculateConfidenceScore(result),
        patternsMatched: this.getMatchedPatterns(request.content),
        fallbacksUsed: [],
        modelUsed: 'task-analyzer-v1',
        tokenUsage: request.content.length * 1.2 // 估算
      };

      this.state.performanceMetrics.push(metrics);
      this.state.completedAnalyses.push(result);

      console.log(`✅ 任务分析完成: ${taskId} (${metrics.processingTime}ms)`);
      return result;

    } catch (error) {
      console.error(`❌ 任务分析失败: ${taskId}`, error);
      throw error;
    } finally {
      this.state.isAnalyzing = false;
      this.state.currentTaskId = undefined;
    }
  }

  /**
   * 评估任务复杂度
   */
  async assessComplexity(content: string, context?: ProjectContext): Promise<TaskComplexity> {
    const factors: ComplexityFactor[] = [];
    let totalScore = 0;

    // 范围复杂度
    const scopeScore = this.analyzeScopeComplexity(content);
    factors.push({
      name: '任务范围',
      impact: scopeScore,
      description: `任务涉及 ${this.countRequirements(content)} 个功能点`,
      category: 'scope'
    });
    totalScore += scopeScore;

    // 技术复杂度
    const techScore = this.analyzeTechnicalComplexity(content, context);
    factors.push({
      name: '技术复杂度',
      impact: techScore,
      description: this.getTechnicalComplexityDescription(content),
      category: 'technical'
    });
    totalScore += techScore;

    // 依赖复杂度
    const depScore = this.analyzeDependencyComplexity(content, context);
    factors.push({
      name: '依赖关系',
      impact: depScore,
      description: this.getDependencyDescription(content),
      category: 'dependencies'
    });
    totalScore += depScore;

    // 时间复杂度
    const timeScore = this.analyzeTimeComplexity(content);
    factors.push({
      name: '时间约束',
      impact: timeScore,
      description: this.getTimeComplexityDescription(content),
      category: 'timeline'
    });
    totalScore += timeScore;

    // 资源复杂度
    const resourceScore = this.analyzeResourceComplexity(content, context);
    factors.push({
      name: '资源需求',
      impact: resourceScore,
      description: this.getResourceComplexityDescription(content),
      category: 'resources'
    });
    totalScore += resourceScore;

    // 标准化评分
    const normalizedScore = Math.max(0, Math.min(100, totalScore));
    
    let level: TaskComplexity['level'];
    if (normalizedScore <= this.config.defaultComplexityThresholds.simple) {
      level = 'simple';
    } else if (normalizedScore <= this.config.defaultComplexityThresholds.medium) {
      level = 'medium';
    } else if (normalizedScore <= this.config.defaultComplexityThresholds.complex) {
      level = 'complex';
    } else {
      level = 'enterprise';
    }

    return {
      level,
      score: normalizedScore,
      factors,
      reasoning: this.generateComplexityReasoning(factors, level)
    };
  }

  /**
   * 推荐合适的代理
   */
  async recommendAgents(requirements: ParsedRequirement[], domain: string): Promise<AgentRecommendation[]> {
    const recommendations: AgentRecommendation[] = [];
    const agentTypes = Object.keys(this.config.agentCapabilities);

    for (const agentType of agentTypes) {
      const capabilities = this.config.agentCapabilities[agentType];
      if (capabilities) {
        const relevance = this.calculateAgentRelevance(requirements, capabilities, domain);
        
        if (relevance.confidence > 0.3) {
          recommendations.push({
            agentId: agentType,
            agentType,
            confidence: relevance.confidence,
            role: relevance.role,
            reasoning: relevance.reasoning,
            priority: relevance.priority,
            estimatedWorkload: relevance.workload
          });
        }
      }
    }

    // 按优先级和置信度排序
    return recommendations.sort((a, b) => 
      (b.priority * b.confidence) - (a.priority * a.confidence)
    );
  }

  /**
   * 生成执行计划
   */
  async generateExecutionPlan(
    requirements: ParsedRequirement[], 
    agents: AgentRecommendation[]
  ): Promise<ExecutionPlan> {
    const phases: ExecutionPhase[] = [];
    const riskFactors: RiskFactor[] = [];
    const milestones: Milestone[] = [];

    // 生成标准开发阶段
    const standardPhases = this.getStandardPhases(requirements, agents);
    phases.push(...standardPhases);

    // 分析风险因素
    riskFactors.push(...this.identifyRiskFactors(requirements, agents));

    // 创建里程碑
    milestones.push(...this.createMilestones(phases));

    // 计算关键路径和并行任务
    const { criticalPath, parallelizable } = this.analyzeDependencies(phases);

    // 计算总时间
    const totalEstimatedTime = this.calculateTotalTime(phases, criticalPath);

    return {
      phases,
      totalEstimatedTime,
      criticalPath,
      parallelizable,
      riskFactors,
      milestones
    };
  }

  /**
   * 解析需求
   */
  async parseRequirements(content: string): Promise<ParsedRequirement[]> {
    const requirements: ParsedRequirement[] = [];
    
    // 按行分割并分析
    const lines = content.split('\n').filter(line => line.trim());
    let reqId = 1;

    for (const line of lines) {
      if (this.isRequirementLine(line)) {
        const requirement = this.parseRequirementLine(line, reqId++);
        if (requirement) {
          requirements.push(requirement);
        }
      }
    }

    // 如果没有明确的需求行，将整个内容作为一个功能性需求
    if (requirements.length === 0) {
      requirements.push({
        id: 'req-1',
        type: 'functional',
        priority: 'must',
        description: content.trim(),
        acceptance_criteria: this.extractAcceptanceCriteria(content),
        dependencies: [],
        complexity: this.estimateRequirementComplexity(content)
      });
    }

    return requirements;
  }

  /**
   * 查找相似任务
   */
  async findSimilarTasks(content: string, limit = 5): Promise<TaskSimilarity[]> {
    const similarities: TaskSimilarity[] = [];
    
    for (const analysis of this.state.completedAnalyses) {
      const similarity = this.calculateTaskSimilarity(content, analysis.originalRequest);
      if (similarity.similarity > 0.3) {
        similarities.push({
          taskId: analysis.taskId,
          ...similarity
        });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 提供学习反馈
   */
  async provideFeedback(feedback: LearningFeedback): Promise<void> {
    this.state.learningData.push(feedback);
    
    // 基于反馈调整配置
    if (feedback.actualComplexity && feedback.actualDuration) {
      this.adjustEstimationFactors(feedback);
    }

    console.log(`📚 收到任务 ${feedback.taskId} 的学习反馈`);
  }

  /**
   * 批量分析任务
   */
  async analyzeBatch(requests: TaskAnalysisRequest[]): Promise<TaskAnalysisResult[]> {
    const results: TaskAnalysisResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.analyzeTask(request);
        results.push(result);
      } catch (error) {
        console.error('批量分析中的任务失败:', error);
      }
    }

    return results;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TaskAnalyzerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): TaskAnalyzerConfig {
    return { ...this.config };
  }

  /**
   * 获取状态
   */
  getState(): TaskAnalyzerState {
    return { ...this.state };
  }

  /**
   * 重置状态
   */
  resetState(): void {
    this.state = {
      isAnalyzing: false,
      analysisQueue: [],
      completedAnalyses: [],
      learningData: [],
      performanceMetrics: []
    };
  }

  // 私有方法实现...

  private getDefaultConfig(): TaskAnalyzerConfig {
    return {
      defaultComplexityThresholds: {
        simple: 30,
        medium: 60,
        complex: 85
      },
      agentCapabilities: {
        'requirements-agent': ['需求分析', '用户故事', '验收标准', '业务流程'],
        'design-agent': ['系统设计', '架构设计', '数据库设计', 'UI设计'],
        'coding-agent': ['编程实现', '代码审查', '单元测试', '重构'],
        'test-agent': ['测试计划', '测试用例', '自动化测试', '质量保证'],
        'spec-agent': ['技术规范', '文档编写', '标准制定', '流程规范'],
        'tasks-agent': ['任务分解', '项目管理', '进度跟踪', '资源调度']
      },
      domainPatterns: {
        webDevelopment: [/web|网站|前端|后端|API|RESTful/i],
        dataScience: [/数据|分析|机器学习|AI|算法|模型/i],
        mobile: [/移动|手机|APP|iOS|Android/i],
        infrastructure: [/基础设施|部署|运维|容器|云/i],
        research: [/研究|调研|分析|评估|报告/i],
        testing: [/测试|质量|验证|自动化/i],
        documentation: [/文档|说明|手册|规范/i]
      },
      riskWeights: {
        technical: 0.3,
        timeline: 0.25,
        resource: 0.2,
        scope: 0.15,
        dependency: 0.1
      },
      estimationFactors: {
        simple: 1.0,
        medium: 1.5,
        complex: 2.5,
        enterprise: 4.0
      }
    };
  }

  private initializePatterns(): Map<string, RegExp[]> {
    const patterns = new Map();
    patterns.set('webDevelopment', this.config.domainPatterns.webDevelopment);
    patterns.set('dataScience', this.config.domainPatterns.dataScience);
    patterns.set('mobile', this.config.domainPatterns.mobile);
    patterns.set('infrastructure', this.config.domainPatterns.infrastructure);
    patterns.set('research', this.config.domainPatterns.research);
    patterns.set('testing', this.config.domainPatterns.testing);
    patterns.set('documentation', this.config.domainPatterns.documentation);
    return patterns;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeTask(content: string, domainHint?: string): TaskCategory {
    const scores: Record<string, number> = {};
    
    // 基于模式匹配评分
    for (const [domain, patterns] of this.patterns) {
      scores[domain] = 0;
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          scores[domain] += 1;
        }
      }
    }

    // 找到最高分的领域
    const sortedDomains = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryDomain = domainHint || (sortedDomains[0]?.[0] || 'general');
    const secondaryDomains = sortedDomains.slice(1, 3).map(([domain]) => domain);

    return {
      primary: primaryDomain,
      secondary: secondaryDomains,
      domain: primaryDomain,
      skills: this.extractRequiredSkills(content, primaryDomain)
    };
  }

  private extractRequiredSkills(_content: string, domain: string): string[] {
    const skillPatterns: Record<string, string[]> = {
      webDevelopment: ['JavaScript', 'React', 'Node.js', 'CSS', 'HTML'],
      dataScience: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
      mobile: ['Swift', 'Kotlin', 'React Native', 'Flutter'],
      infrastructure: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'DevOps'],
      research: ['Analysis', 'Documentation', 'Presentation'],
      testing: ['Automation', 'QA', 'Testing Frameworks'],
      documentation: ['Technical Writing', 'Markdown', 'Documentation Tools']
    };

    return skillPatterns[domain] || [];
  }

  private analyzeScopeComplexity(content: string): number {
    const requirementCount = this.countRequirements(content);
    return Math.min(25, requirementCount * 3);
  }

  private countRequirements(content: string): number {
    const keywords = ['需要', '要求', '实现', '功能', '特性', '模块'];
    let count = 0;
    for (const keyword of keywords) {
      const matches = content.match(new RegExp(keyword, 'g'));
      if (matches) count += matches.length;
    }
    return Math.max(1, Math.floor(count / 2));
  }

  private analyzeTechnicalComplexity(content: string, context?: ProjectContext): number {
    let score = 0;
    
    // 技术关键词复杂度
    const complexKeywords = ['AI', '机器学习', '区块链', '微服务', '分布式', '实时', '高并发'];
    for (const keyword of complexKeywords) {
      if (content.includes(keyword)) score += 5;
    }

    // 技术栈复杂度
    if (context?.technologies) {
      score += Math.min(15, context.technologies.length * 2);
    }

    return Math.min(25, score);
  }

  private getTechnicalComplexityDescription(content: string): string {
    const complexTerms = ['AI', '机器学习', '分布式', '微服务', '高并发'];
    const foundTerms = complexTerms.filter(term => content.includes(term));
    
    if (foundTerms.length > 0) {
      return `涉及高级技术: ${foundTerms.join(', ')}`;
    }
    return '技术复杂度适中';
  }

  private analyzeDependencyComplexity(content: string, context?: ProjectContext): number {
    let score = 0;
    
    const depKeywords = ['集成', '对接', '依赖', '第三方', '外部系统'];
    for (const keyword of depKeywords) {
      if (content.includes(keyword)) score += 3;
    }

    if (context?.existingComponents) {
      score += Math.min(10, context.existingComponents.length * 2);
    }

    return Math.min(20, score);
  }

  private getDependencyDescription(content: string): string {
    const depKeywords = ['集成', '对接', '第三方'];
    const foundDeps = depKeywords.filter(dep => content.includes(dep));
    
    if (foundDeps.length > 0) {
      return `需要外部依赖: ${foundDeps.join(', ')}`;
    }
    return '依赖关系较少';
  }

  private analyzeTimeComplexity(content: string): number {
    const urgentKeywords = ['紧急', '立即', '尽快', '马上'];
    for (const keyword of urgentKeywords) {
      if (content.includes(keyword)) return 15;
    }
    return 5;
  }

  private getTimeComplexityDescription(content: string): string {
    const urgentKeywords = ['紧急', '立即', '尽快'];
    const hasUrgent = urgentKeywords.some(keyword => content.includes(keyword));
    
    return hasUrgent ? '时间要求紧急' : '时间要求适中';
  }

  private analyzeResourceComplexity(content: string, context?: ProjectContext): number {
    let score = 0;
    
    if (context?.teamSize) {
      if (context.teamSize < 3) score += 10; // 小团队复杂度高
      else if (context.teamSize > 10) score += 5; // 大团队协调复杂
    }

    const resourceKeywords = ['大型', '企业级', '高性能', '可扩展'];
    for (const keyword of resourceKeywords) {
      if (content.includes(keyword)) score += 5;
    }

    return Math.min(15, score);
  }

  private getResourceComplexityDescription(content: string): string {
    const resourceKeywords = ['大型', '企业级', '高性能'];
    const foundKeywords = resourceKeywords.filter(keyword => content.includes(keyword));
    
    if (foundKeywords.length > 0) {
      return `高资源需求: ${foundKeywords.join(', ')}`;
    }
    return '资源需求适中';
  }

  private generateComplexityReasoning(factors: ComplexityFactor[], level: string): string {
    const highImpactFactors = factors.filter(f => f.impact >= 8);
    if (highImpactFactors.length > 0) {
      return `复杂度为${level}，主要因为${highImpactFactors.map(f => f.name).join('、')}较高`;
    }
    return `基于各项因素综合评估，复杂度为${level}`;
  }

  private calculateAgentRelevance(
    requirements: ParsedRequirement[], 
    capabilities: string[], 
    _domain: string
  ) {
    let relevanceScore = 0;
    let matchedCapabilities: string[] = [];
    
    for (const req of requirements) {
      for (const capability of capabilities) {
        if (req.description.toLowerCase().includes(capability.toLowerCase())) {
          relevanceScore += req.complexity * 0.1;
          matchedCapabilities.push(capability);
        }
      }
    }

    const confidence = Math.min(1.0, relevanceScore / 5);
    const priority = Math.ceil(confidence * 10);
    const workload = requirements.length * confidence * 2;

    return {
      confidence,
      role: this.determineAgentRole(matchedCapabilities),
      reasoning: `匹配能力: ${matchedCapabilities.join(', ')}`,
      priority,
      workload
    };
  }

  private determineAgentRole(capabilities: string[]): string {
    if (capabilities.some(c => c.includes('需求'))) return '需求分析';
    if (capabilities.some(c => c.includes('设计'))) return '方案设计';
    if (capabilities.some(c => c.includes('编程'))) return '代码实现';
    if (capabilities.some(c => c.includes('测试'))) return '质量保证';
    if (capabilities.some(c => c.includes('文档'))) return '文档输出';
    if (capabilities.some(c => c.includes('任务'))) return '项目管理';
    return '协助支持';
  }

  private getStandardPhases(
    _requirements: ParsedRequirement[], 
    agents: AgentRecommendation[]
  ): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];

    // 需求分析阶段
    if (agents.some(a => a.agentId === 'requirements-agent')) {
      phases.push({
        id: 'phase-requirements',
        name: '需求分析',
        description: '分析和整理项目需求',
        estimatedDuration: 2,
        requiredAgents: ['requirements-agent'],
        dependencies: [],
        deliverables: ['需求文档', '用户故事', '验收标准'],
        riskLevel: 'low'
      });
    }

    // 设计阶段
    if (agents.some(a => a.agentId === 'design-agent')) {
      phases.push({
        id: 'phase-design',
        name: '方案设计',
        description: '设计系统架构和详细方案',
        estimatedDuration: 3,
        requiredAgents: ['design-agent'],
        dependencies: phases.length > 0 ? ['phase-requirements'] : [],
        deliverables: ['设计文档', '架构图', '数据库设计'],
        riskLevel: 'medium'
      });
    }

    // 开发阶段
    if (agents.some(a => a.agentId === 'coding-agent')) {
      phases.push({
        id: 'phase-development',
        name: '开发实现',
        description: '编码实现设计方案',
        estimatedDuration: 8,
        requiredAgents: ['coding-agent'],
        dependencies: phases.length > 0 ? ['phase-design'] : [],
        deliverables: ['源代码', '单元测试', '技术文档'],
        riskLevel: 'high'
      });
    }

    // 测试阶段
    if (agents.some(a => a.agentId === 'test-agent')) {
      phases.push({
        id: 'phase-testing',
        name: '测试验证',
        description: '全面测试和质量保证',
        estimatedDuration: 3,
        requiredAgents: ['test-agent'],
        dependencies: phases.length > 0 ? ['phase-development'] : [],
        deliverables: ['测试报告', '缺陷列表', '测试用例'],
        riskLevel: 'medium'
      });
    }

    return phases;
  }

  private identifyRiskFactors(
    requirements: ParsedRequirement[], 
    agents: AgentRecommendation[]
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // 技术风险
    if (requirements.some(r => r.complexity > 7)) {
      risks.push({
        type: 'technical',
        severity: 'high',
        description: '存在高复杂度技术需求',
        mitigation: '增加技术调研和原型验证',
        probability: 0.7,
        impact: 8
      });
    }

    // 时间风险
    const totalWorkload = agents.reduce((sum, a) => sum + a.estimatedWorkload, 0);
    if (totalWorkload > 40) {
      risks.push({
        type: 'timeline',
        severity: 'medium',
        description: '工作量较大，可能影响进度',
        mitigation: '合理分配任务，增加并行开发',
        probability: 0.6,
        impact: 6
      });
    }

    // 依赖风险
    if (requirements.some(r => r.dependencies.length > 0)) {
      risks.push({
        type: 'dependency',
        severity: 'medium',
        description: '存在外部依赖，可能影响进度',
        mitigation: '提前确认依赖可用性',
        probability: 0.5,
        impact: 5
      });
    }

    return risks;
  }

  private createMilestones(phases: ExecutionPhase[]): Milestone[] {
    return phases.map((phase, index) => ({
      id: `milestone-${index + 1}`,
      name: `${phase.name}完成`,
      description: `完成${phase.name}阶段的所有交付物`,
      phase: phase.id,
      estimatedDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000),
      dependencies: phase.dependencies,
      criteria: phase.deliverables
    }));
  }

  private analyzeDependencies(phases: ExecutionPhase[]) {
    const criticalPath: string[] = [];
    const parallelizable: string[] = [];

    for (const phase of phases) {
      if (phase.dependencies.length === 0) {
        parallelizable.push(phase.id);
      } else {
        criticalPath.push(phase.id);
      }
    }

    return { criticalPath, parallelizable };
  }

  private calculateTotalTime(phases: ExecutionPhase[], criticalPath: string[]): number {
    return phases
      .filter(p => criticalPath.includes(p.id))
      .reduce((total, phase) => total + phase.estimatedDuration, 0);
  }

  private estimateCost(plan: ExecutionPlan, _agents: AgentRecommendation[]): CostEstimate {
    const breakdown: any[] = [];
    let totalHours = 0;

    for (const phase of plan.phases) {
      const phaseHours = phase.estimatedDuration;
      totalHours += phaseHours;
      
      breakdown.push({
        phase: phase.name,
        hours: phaseHours,
        agents: phase.requiredAgents,
        reasoning: `基于${phase.name}的复杂度估算`
      });
    }

    return {
      totalHours,
      breakdown,
      confidence: 0.75,
      factors: ['历史数据', '复杂度分析', '代理工作量']
    };
  }

  private calculateFeasibilityScore(
    complexity: TaskComplexity,
    agents: AgentRecommendation[],
    timeConstraint?: number,
    availableAgents?: string[]
  ): number {
    let score = 1.0;

    // 复杂度影响
    if (complexity.level === 'enterprise') score -= 0.3;
    else if (complexity.level === 'complex') score -= 0.2;
    else if (complexity.level === 'medium') score -= 0.1;

    // 代理可用性影响
    if (availableAgents) {
      const requiredAgents = agents.map(a => a.agentId);
      const missingAgents = requiredAgents.filter(id => !availableAgents.includes(id));
      score -= missingAgents.length * 0.15;
    }

    // 时间约束影响
    if (timeConstraint) {
      const estimatedTime = agents.reduce((sum, a) => sum + a.estimatedWorkload, 0);
      if (estimatedTime > timeConstraint) {
        score -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateRecommendations(
    complexity: TaskComplexity,
    category: TaskCategory,
    plan: ExecutionPlan
  ): string[] {
    const recommendations: string[] = [];

    if (complexity.level === 'complex' || complexity.level === 'enterprise') {
      recommendations.push('建议分阶段实施，先完成核心功能');
      recommendations.push('增加技术调研和风险评估');
    }

    if (plan.riskFactors.some(r => r.severity === 'high')) {
      recommendations.push('重点关注高风险项，制定应对措施');
    }

    if (category.domain === 'webDevelopment') {
      recommendations.push('考虑使用现有框架和组件库');
    }

    recommendations.push('定期进行进度回顾和计划调整');

    return recommendations;
  }

  private generateWarnings(
    complexity: TaskComplexity,
    feasibilityScore: number,
    request: TaskAnalysisRequest
  ): string[] {
    const warnings: string[] = [];

    if (feasibilityScore < 0.5) {
      warnings.push('可行性较低，建议重新评估需求和资源');
    }

    if (complexity.level === 'enterprise') {
      warnings.push('任务复杂度极高，需要充分的准备和规划');
    }

    if (request.timeConstraint && complexity.score > 70) {
      warnings.push('时间约束较紧，高复杂度任务可能需要更多时间');
    }

    return warnings;
  }

  private calculateConfidenceScore(result: TaskAnalysisResult): number {
    let confidence = 0.8; // 基础置信度

    // 基于推荐代理的置信度
    const avgAgentConfidence = result.recommendedAgents.reduce(
      (sum, agent) => sum + agent.confidence, 0
    ) / result.recommendedAgents.length;
    
    confidence = (confidence + avgAgentConfidence) / 2;

    // 基于可行性评分
    confidence = (confidence + result.feasibilityScore) / 2;

    return confidence;
  }

  private getMatchedPatterns(content: string): string[] {
    const matched: string[] = [];
    
    for (const [domain, patterns] of this.patterns) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matched.push(domain);
          break;
        }
      }
    }

    return matched;
  }

  private isRequirementLine(line: string): boolean {
    const reqPatterns = [
      /^\d+[\.\)]/,  // 数字开头
      /^[•\-\*]/,    // 列表符号
      /需要|要求|实现|功能/,  // 需求关键词
    ];
    
    return reqPatterns.some(pattern => pattern.test(line.trim()));
  }

  private parseRequirementLine(line: string, id: number): ParsedRequirement | null {
    const trimmed = line.trim();
    if (trimmed.length < 5) return null;

    // 提取优先级
    let priority: ParsedRequirement['priority'] = 'should';
    if (trimmed.includes('必须') || trimmed.includes('must')) priority = 'must';
    else if (trimmed.includes('应该') || trimmed.includes('should')) priority = 'should';
    else if (trimmed.includes('可以') || trimmed.includes('could')) priority = 'could';

    // 判断类型
    let type: ParsedRequirement['type'] = 'functional';
    if (trimmed.includes('性能') || trimmed.includes('安全') || trimmed.includes('可用性')) {
      type = 'non-functional';
    }

    return {
      id: `req-${id}`,
      type,
      priority,
      description: trimmed,
      acceptance_criteria: this.extractAcceptanceCriteria(trimmed),
      dependencies: [],
      complexity: this.estimateRequirementComplexity(trimmed)
    };
  }

  private extractAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];
    
    // 简单的验收标准提取
    if (content.includes('用户可以')) {
      criteria.push('用户界面友好易用');
    }
    if (content.includes('系统应该')) {
      criteria.push('系统功能正常运行');
    }
    if (content.includes('数据')) {
      criteria.push('数据准确性和完整性');
    }

    return criteria.length > 0 ? criteria : ['功能按预期工作'];
  }

  private estimateRequirementComplexity(content: string): number {
    let complexity = 3; // 基础复杂度

    const complexKeywords = ['集成', '实时', '算法', '优化', '安全'];
    for (const keyword of complexKeywords) {
      if (content.includes(keyword)) complexity += 2;
    }

    return Math.min(10, complexity);
  }

  private calculateTaskSimilarity(content1: string, content2: string) {
    // 简单的相似度计算
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = intersection.size / union.size;
    
    return {
      similarity,
      commonPatterns: Array.from(intersection).slice(0, 5),
      differences: Array.from(union).filter(w => !intersection.has(w)).slice(0, 5),
      lessons: ['基于历史经验优化估算']
    };
  }

  private adjustEstimationFactors(feedback: LearningFeedback): void {
    // 基于反馈调整估算因子
    if (feedback.actualDuration && feedback.actualComplexity) {
      const actualLevel = feedback.actualComplexity.level;
      const factor = this.config.estimationFactors[actualLevel];
      
      // 简单的学习调整
      if (factor && feedback.actualDuration > feedback.actualDuration * factor) {
        const currentFactor = this.config.estimationFactors[actualLevel];
        if (currentFactor) {
          this.config.estimationFactors[actualLevel] = currentFactor * 1.1;
        }
      } else if (factor) {
        const currentFactor = this.config.estimationFactors[actualLevel];
        if (currentFactor) {
          this.config.estimationFactors[actualLevel] = currentFactor * 0.95;
        }
      }
    }
  }
}
