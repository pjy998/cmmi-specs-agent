// 智能任务分析器类型定义
// 提供任务复杂度分析、所需代理推荐、执行计划生成等功能

export interface TaskComplexity {
  level: 'simple' | 'medium' | 'complex' | 'enterprise';
  score: number; // 0-100
  factors: ComplexityFactor[];
  reasoning: string;
}

export interface ComplexityFactor {
  name: string;
  impact: number; // -10 to +10
  description: string;
  category: 'scope' | 'technical' | 'dependencies' | 'timeline' | 'resources';
}

export interface TaskCategory {
  primary: string;
  secondary: string[];
  domain: string;
  skills: string[];
}

export interface AgentRecommendation {
  agentId: string;
  agentType: string;
  confidence: number; // 0-1
  role: string;
  reasoning: string;
  priority: number; // 1-10
  estimatedWorkload: number; // hours
}

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  totalEstimatedTime: number; // hours
  criticalPath: string[];
  parallelizable: string[];
  riskFactors: RiskFactor[];
  milestones: Milestone[];
}

export interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // hours
  requiredAgents: string[];
  dependencies: string[];
  deliverables: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RiskFactor {
  type: 'technical' | 'timeline' | 'resource' | 'scope' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  probability: number; // 0-1
  impact: number; // 0-10
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  phase: string;
  estimatedDate: Date;
  dependencies: string[];
  criteria: string[];
}

export interface TaskAnalysisRequest {
  content: string;
  domain?: string;
  complexityHint?: 'simple' | 'medium' | 'complex';
  timeConstraint?: number; // hours
  availableAgents?: string[];
  projectContext?: ProjectContext;
}

export interface ProjectContext {
  type: 'web' | 'mobile' | 'desktop' | 'ai' | 'data' | 'infrastructure' | 'research';
  technologies: string[];
  constraints: string[];
  existingComponents: string[];
  teamSize: number;
  timeline: number; // days
}

export interface TaskAnalysisResult {
  taskId: string;
  originalRequest: string;
  parsedRequirements: ParsedRequirement[];
  complexity: TaskComplexity;
  category: TaskCategory;
  recommendedAgents: AgentRecommendation[];
  executionPlan: ExecutionPlan;
  estimatedCost: CostEstimate;
  feasibilityScore: number; // 0-1
  recommendations: string[];
  warnings: string[];
}

export interface ParsedRequirement {
  id: string;
  type: 'functional' | 'non-functional' | 'constraint' | 'assumption';
  priority: 'must' | 'should' | 'could' | 'wont';
  description: string;
  acceptance_criteria: string[];
  dependencies: string[];
  complexity: number; // 1-10
}

export interface CostEstimate {
  totalHours: number;
  breakdown: CostBreakdown[];
  confidence: number; // 0-1
  factors: string[];
}

export interface CostBreakdown {
  phase: string;
  hours: number;
  agents: string[];
  reasoning: string;
}

export interface TaskPatterns {
  webDevelopment: RegExp[];
  dataScience: RegExp[];
  mobile: RegExp[];
  infrastructure: RegExp[];
  research: RegExp[];
  testing: RegExp[];
  documentation: RegExp[];
}

export interface AnalysisMetrics {
  processingTime: number; // ms
  confidenceScore: number; // 0-1
  patternsMatched: string[];
  fallbacksUsed: string[];
  modelUsed: string;
  tokenUsage: number;
}

export interface TaskAnalyzerConfig {
  defaultComplexityThresholds: {
    simple: number;
    medium: number;
    complex: number;
  };
  agentCapabilities: Record<string, string[]>;
  domainPatterns: TaskPatterns;
  riskWeights: Record<string, number>;
  estimationFactors: Record<string, number>;
}

export interface LearningFeedback {
  taskId: string;
  actualComplexity?: TaskComplexity;
  actualDuration?: number;
  actualAgents?: string[];
  userSatisfaction?: number; // 1-5
  notes?: string;
}

export interface TaskSimilarity {
  taskId: string;
  similarity: number; // 0-1
  commonPatterns: string[];
  differences: string[];
  lessons: string[];
}

export interface TaskAnalyzerState {
  isAnalyzing: boolean;
  currentTaskId?: string | undefined;
  analysisQueue: TaskAnalysisRequest[];
  completedAnalyses: TaskAnalysisResult[];
  learningData: LearningFeedback[];
  performanceMetrics: AnalysisMetrics[];
}

// 智能任务分析器主类接口
export interface ITaskAnalyzer {
  // 核心分析功能
  analyzeTask(request: TaskAnalysisRequest): Promise<TaskAnalysisResult>;
  
  // 复杂度分析
  assessComplexity(content: string, context?: ProjectContext): Promise<TaskComplexity>;
  
  // 代理推荐
  recommendAgents(requirements: ParsedRequirement[], domain: string): Promise<AgentRecommendation[]>;
  
  // 执行计划生成
  generateExecutionPlan(requirements: ParsedRequirement[], agents: AgentRecommendation[]): Promise<ExecutionPlan>;
  
  // 需求解析
  parseRequirements(content: string): Promise<ParsedRequirement[]>;
  
  // 相似任务查找
  findSimilarTasks(content: string, limit?: number): Promise<TaskSimilarity[]>;
  
  // 学习和改进
  provideFeedback(feedback: LearningFeedback): Promise<void>;
  
  // 批量分析
  analyzeBatch(requests: TaskAnalysisRequest[]): Promise<TaskAnalysisResult[]>;
  
  // 配置管理
  updateConfig(config: Partial<TaskAnalyzerConfig>): void;
  getConfig(): TaskAnalyzerConfig;
  
  // 状态管理
  getState(): TaskAnalyzerState;
  resetState(): void;
}
