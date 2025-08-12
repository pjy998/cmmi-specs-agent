// 质量保证系统类型定义
// 提供代码质量检查、测试覆盖率分析、性能监控、安全扫描等功能

export interface QualityMetrics {
  overall: number; // 0-100 overall quality score
  codeQuality: number; // 0-100
  testCoverage: number; // 0-100  
  performance: number; // 0-100
  security: number; // 0-100
  maintainability: number; // 0-100
  reliability: number; // 0-100
}

export interface CodeQualityReport {
  id: string;
  projectPath: string;
  timestamp: Date;
  language: string;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  suggestions: QualitySuggestion[];
  trend: QualityTrend;
  compliance: ComplianceStatus;
}

export interface QualityIssue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'suggestion';
  category: 'code' | 'test' | 'performance' | 'security' | 'style' | 'architecture';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  line?: number;
  column?: number;
  rule: string;
  solution?: string;
  effort: 'low' | 'medium' | 'high'; // fix effort
  impact: number; // 1-10
}

export interface QualitySuggestion {
  id: string;
  type: 'refactor' | 'optimize' | 'enhance' | 'modernize';
  priority: number; // 1-10
  title: string;
  description: string;
  reasoning: string;
  estimatedImpact: string;
  files: string[];
  effort: number; // hours
}

export interface QualityTrend {
  period: 'daily' | 'weekly' | 'monthly';
  dataPoints: QualityDataPoint[];
  direction: 'improving' | 'declining' | 'stable';
  velocity: number; // change rate
}

export interface QualityDataPoint {
  timestamp: Date;
  metrics: QualityMetrics;
  changeReason?: string;
}

export interface ComplianceStatus {
  standard: 'CMMI' | 'ISO9001' | 'SOC2' | 'PCI-DSS' | 'custom';
  level: string;
  score: number; // 0-100
  requirements: ComplianceRequirement[];
  gaps: ComplianceGap[];
  certification: boolean;
}

export interface ComplianceRequirement {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  evidence: string[];
  lastChecked: Date;
}

export interface ComplianceGap {
  requirementId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation: string;
  estimatedEffort: number; // hours
  deadline?: Date;
}

export interface TestSuite {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  framework: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: TestCoverage;
  duration: number; // ms
  environment: string;
}

export interface TestCoverage {
  lines: number; // 0-100
  functions: number; // 0-100
  branches: number; // 0-100
  statements: number; // 0-100
  files: FileCoverage[];
  thresholds: CoverageThresholds;
}

export interface FileCoverage {
  path: string;
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  uncoveredLines: number[];
}

export interface CoverageThresholds {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  global: number;
}

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  environment: string;
  metrics: PerformanceMetrics;
  benchmarks: Benchmark[];
  bottlenecks: Bottleneck[];
  recommendations: PerformanceRecommendation[];
}

export interface PerformanceMetrics {
  responseTime: number; // ms
  throughput: number; // requests/sec
  errorRate: number; // 0-100
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  diskIO: number; // MB/s
  networkIO: number; // MB/s
  availability: number; // 0-100
}

export interface Benchmark {
  name: string;
  metric: string;
  current: number;
  baseline: number;
  target: number;
  status: 'passed' | 'failed' | 'warning';
  variance: number; // percentage
}

export interface Bottleneck {
  component: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database' | 'external';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  resolution: string;
  estimatedGain: number; // performance improvement %
}

export interface PerformanceRecommendation {
  id: string;
  type: 'optimization' | 'scaling' | 'caching' | 'architecture';
  priority: number; // 1-10
  title: string;
  description: string;
  implementation: string;
  estimatedGain: number; // % improvement
  effort: number; // hours
  risk: 'low' | 'medium' | 'high';
}

export interface SecurityScan {
  id: string;
  timestamp: Date;
  scanner: string;
  scope: string[];
  vulnerabilities: Vulnerability[];
  riskScore: number; // 0-100
  compliance: SecurityCompliance[];
  recommendations: SecurityRecommendation[];
}

export interface Vulnerability {
  id: string;
  cve?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'injection' | 'auth' | 'crypto' | 'access' | 'config' | 'dependency';
  title: string;
  description: string;
  file?: string;
  line?: number;
  evidence: string;
  impact: string;
  solution: string;
  references: string[];
  cvssScore?: number;
}

export interface SecurityCompliance {
  standard: 'OWASP' | 'NIST' | 'ISO27001' | 'SOC2' | 'PCI-DSS';
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number; // 0-100
  checkedControls: number;
  passedControls: number;
  gaps: string[];
}

export interface SecurityRecommendation {
  id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string;
  effort: number; // hours
  impact: string;
}

export interface QualityGate {
  id: string;
  name: string;
  conditions: QualityCondition[];
  status: 'passed' | 'failed' | 'warning';
  mandatory: boolean;
  blocksDeployment: boolean;
}

export interface QualityCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  threshold: number;
  actualValue: number;
  status: 'passed' | 'failed' | 'warning';
  errorMessage?: string;
}

export interface QualityProfile {
  id: string;
  name: string;
  language: string;
  rules: QualityRule[];
  isDefault: boolean;
  parent?: string;
  customizations: RuleCustomization[];
}

export interface QualityRule {
  id: string;
  key: string;
  name: string;
  category: string;
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  type: 'bug' | 'vulnerability' | 'code_smell' | 'security_hotspot';
  description: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface RuleCustomization {
  ruleKey: string;
  severity?: string;
  enabled?: boolean;
  parameters?: Record<string, any>;
  reason: string;
}

export interface QualityDashboard {
  projectId: string;
  overview: QualityOverview;
  trends: QualityTrend[];
  gates: QualityGate[];
  issues: QualityIssue[];
  coverage: TestCoverage;
  duplication: DuplicationMetrics;
  complexity: ComplexityMetrics;
}

export interface QualityOverview {
  linesOfCode: number;
  technicalDebt: number; // hours
  maintainabilityRating: string; // A-E
  reliabilityRating: string; // A-E
  securityRating: string; // A-E
  coverage: number; // 0-100
  duplicatedLines: number;
  cognitiveComplexity: number;
}

export interface DuplicationMetrics {
  duplicatedLines: number;
  duplicatedBlocks: number;
  duplicatedFiles: number;
  duplicatedLinesDensity: number; // 0-100
  duplications: Duplication[];
}

export interface Duplication {
  id: string;
  lines: number;
  blocks: number;
  files: DuplicatedFile[];
}

export interface DuplicatedFile {
  file: string;
  startLine: number;
  endLine: number;
}

export interface ComplexityMetrics {
  cognitiveComplexity: number;
  cyclomaticComplexity: number;
  averageComplexityPerFunction: number;
  mostComplexFunctions: ComplexFunction[];
}

export interface ComplexFunction {
  name: string;
  file: string;
  line: number;
  complexity: number;
  recommendation: string;
}

export interface QualityAnalysisRequest {
  projectPath: string;
  language?: string;
  includeTests?: boolean;
  includeDependencies?: boolean;
  customRules?: string[];
  exclusions?: string[];
  qualityGates?: string[];
  reportFormat?: 'json' | 'xml' | 'html' | 'pdf';
}

export interface QualityAnalysisResult {
  reportId: string;
  request: QualityAnalysisRequest;
  timestamp: Date;
  duration: number; // ms
  status: 'completed' | 'failed' | 'partial';
  report: CodeQualityReport;
  testResults: TestSuite[];
  performanceReport?: PerformanceReport | undefined;
  securityScan?: SecurityScan | undefined;
  dashboard: QualityDashboard;
  artifacts: QualityArtifact[];
  errors: string[];
  warnings: string[];
}

export interface QualityArtifact {
  type: 'report' | 'coverage' | 'logs' | 'screenshots';
  format: string;
  path: string;
  size: number;
  checksum: string;
}

export interface QualitySystemConfig {
  thresholds: QualityThresholds;
  rules: QualityProfileConfig;
  tools: QualityToolsConfig;
  notifications: NotificationConfig;
  integrations: IntegrationConfig;
}

export interface QualityThresholds {
  codeQuality: number;
  testCoverage: number;
  performance: number;
  security: number;
  maintainability: number;
  reliability: number;
  overallQuality: number;
}

export interface QualityProfileConfig {
  defaultProfiles: Record<string, string>;
  customRules: QualityRule[];
  rulesets: Record<string, string[]>;
}

export interface QualityToolsConfig {
  staticAnalysis: StaticAnalysisConfig;
  testing: TestingConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
}

export interface StaticAnalysisConfig {
  enabled: boolean;
  tools: string[];
  rules: string[];
  exclusions: string[];
  timeout: number;
}

export interface TestingConfig {
  enabled: boolean;
  frameworks: string[];
  coverageThresholds: CoverageThresholds;
  parallel: boolean;
  timeout: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  tools: string[];
  benchmarks: string[];
  thresholds: PerformanceThresholds;
}

export interface PerformanceThresholds {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface SecurityConfig {
  enabled: boolean;
  scanners: string[];
  standards: string[];
  severityThreshold: string;
  ignoredVulnerabilities: string[];
}

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  triggers: NotificationTrigger[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'dashboard';
  config: Record<string, any>;
  enabled: boolean;
}

export interface NotificationTrigger {
  event: 'quality_gate_failed' | 'coverage_threshold_breached' | 'security_vulnerability' | 'performance_degradation';
  conditions: Record<string, any>;
  channels: string[];
}

export interface IntegrationConfig {
  ci: CIIntegrationConfig;
  vcs: VCSIntegrationConfig;
  monitoring: MonitoringIntegrationConfig;
}

export interface CIIntegrationConfig {
  enabled: boolean;
  provider: 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci';
  webhooks: boolean;
  qualityGates: boolean;
  reportArtifacts: boolean;
}

export interface VCSIntegrationConfig {
  enabled: boolean;
  provider: 'github' | 'gitlab' | 'bitbucket';
  prComments: boolean;
  statusChecks: boolean;
  branchProtection: boolean;
}

export interface MonitoringIntegrationConfig {
  enabled: boolean;
  provider: 'prometheus' | 'grafana' | 'datadog' | 'newrelic';
  metrics: string[];
  alerts: boolean;
}

// 质量保证系统主接口
export interface IQualityAssuranceSystem {
  // 核心分析功能
  analyzeQuality(request: QualityAnalysisRequest): Promise<QualityAnalysisResult>;
  
  // 代码质量分析
  analyzeCodeQuality(projectPath: string, language?: string): Promise<CodeQualityReport>;
  
  // 测试分析
  runTests(projectPath: string, testType?: string): Promise<TestSuite[]>;
  analyzeCoverage(projectPath: string): Promise<TestCoverage>;
  
  // 性能分析
  analyzePerformance(projectPath: string, environment?: string): Promise<PerformanceReport>;
  runBenchmarks(projectPath: string): Promise<Benchmark[]>;
  
  // 安全分析
  scanSecurity(projectPath: string, scope?: string[]): Promise<SecurityScan>;
  checkCompliance(standard: string, projectPath: string): Promise<ComplianceStatus>;
  
  // 质量门控
  evaluateQualityGates(projectPath: string, gates?: string[]): Promise<QualityGate[]>;
  setQualityThresholds(thresholds: QualityThresholds): Promise<void>;
  
  // 报告和仪表板
  generateReport(reportId: string, format?: string): Promise<QualityArtifact>;
  getDashboard(projectId: string): Promise<QualityDashboard>;
  getTrends(projectId: string, period: string): Promise<QualityTrend[]>;
  
  // 配置管理
  updateConfig(config: Partial<QualitySystemConfig>): Promise<void>;
  getConfig(): QualitySystemConfig;
  
  // 规则管理
  createProfile(profile: QualityProfile): Promise<void>;
  updateProfile(profileId: string, changes: Partial<QualityProfile>): Promise<void>;
  applyProfile(projectPath: string, profileId: string): Promise<void>;
  
  // 集成功能
  setupCIIntegration(config: CIIntegrationConfig): Promise<void>;
  setupVCSIntegration(config: VCSIntegrationConfig): Promise<void>;
  
  // 通知和监控
  sendNotification(trigger: string, data: any): Promise<void>;
  getHealthStatus(): Promise<Record<string, any>>;
}
