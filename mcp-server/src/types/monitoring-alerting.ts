// 监控报警系统类型定义
// 提供系统监控、性能指标收集、异常检测、智能报警等功能

export interface MonitoringMetrics {
  timestamp: Date;
  system: SystemMetrics;
  application: ApplicationMetrics;
  business: BusinessMetrics;
  custom: CustomMetrics;
}

export interface SystemMetrics {
  cpu: {
    usage: number; // 0-100
    cores: number;
    load: number[];
    temperature?: number;
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    available: number; // bytes
    usage: number; // 0-100
    swap?: {
      used: number;
      total: number;
    };
  };
  disk: {
    usage: number; // 0-100
    free: number; // bytes
    total: number; // bytes
    io: {
      read: number; // bytes/sec
      write: number; // bytes/sec
      iops: number;
    };
  };
  network: {
    bytesIn: number; // bytes/sec
    bytesOut: number; // bytes/sec
    packetsIn: number;
    packetsOut: number;
    errors: number;
    latency?: number; // ms
  };
  processes: ProcessInfo[];
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number; // 0-100
  memory: number; // bytes
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  uptime: number; // seconds
}

export interface ApplicationMetrics {
  response: {
    time: number; // ms
    timeP50: number;
    timeP90: number;
    timeP99: number;
  };
  throughput: {
    requests: number; // per second
    errors: number; // per second
    success: number; // per second
  };
  errors: {
    rate: number; // 0-100
    total: number;
    types: Record<string, number>;
  };
  database: {
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    queries: {
      slow: number;
      failed: number;
      total: number;
      avgTime: number; // ms
    };
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number; // 0-100
    memory: number; // bytes
  };
  queue: {
    pending: number;
    processed: number;
    failed: number;
    avgWaitTime: number; // ms
  };
}

export interface BusinessMetrics {
  users: {
    active: number;
    new: number;
    retention: number; // 0-100
    churn: number; // 0-100
  };
  transactions: {
    count: number;
    volume: number; // currency
    success: number;
    failed: number;
    avgValue: number;
  };
  features: {
    usage: Record<string, number>;
    adoption: Record<string, number>;
  };
  conversion: {
    funnel: Record<string, number>;
    rates: Record<string, number>;
  };
}

export interface CustomMetrics {
  [key: string]: {
    value: number;
    unit?: string;
    tags?: Record<string, string>;
    timestamp?: Date;
  };
}

export interface Alert {
  id: string;
  name: string;
  type: 'threshold' | 'anomaly' | 'composite' | 'forecast';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'active' | 'resolved' | 'suppressed' | 'acknowledged';
  source: string;
  condition: AlertCondition;
  message: string;
  details: string;
  metadata: Record<string, any>;
  timestamps: {
    created: Date;
    triggered: Date;
    acknowledged?: Date;
    resolved?: Date;
  };
  escalation?: EscalationLevel;
  actions: AlertAction[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'contains' | 'regex';
  threshold: number | string;
  duration?: number; // seconds
  window?: number; // seconds for rolling window
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
  expression?: string; // for complex conditions
}

export interface EscalationLevel {
  level: number;
  delay: number; // seconds
  recipients: string[];
  channels: string[];
  autoResolve?: boolean;
}

export interface AlertAction {
  id: string;
  type: 'notification' | 'webhook' | 'script' | 'escalation' | 'auto-resolve';
  config: Record<string, any>;
  status: 'pending' | 'executed' | 'failed';
  error?: string;
  executedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  tags: string[];
  conditions: AlertCondition[];
  logic: 'AND' | 'OR'; // for multiple conditions
  suppression: AlertSuppression;
  escalation: EscalationPolicy;
  actions: AlertActionConfig[];
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
  };
}

export interface AlertSuppression {
  enabled: boolean;
  duration: number; // seconds
  conditions?: string[]; // conditions under which to suppress
}

export interface EscalationPolicy {
  enabled: boolean;
  levels: EscalationLevel[];
  autoResolve: boolean;
  autoResolveDelay: number; // seconds
}

export interface AlertActionConfig {
  type: string;
  config: Record<string, any>;
  conditions?: string[]; // when to trigger this action
}

export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: LayoutConfig;
  filters: DashboardFilter[];
  refreshInterval: number; // seconds
  timeRange: TimeRange;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'status' | 'custom';
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: DataSourceConfig;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfig {
  displayType: 'line' | 'bar' | 'pie' | 'gauge' | 'number' | 'status';
  aggregation?: string;
  colors?: string[];
  thresholds?: ThresholdConfig[];
  legend?: boolean;
  gridLines?: boolean;
  animation?: boolean;
  [key: string]: any;
}

export interface ThresholdConfig {
  value: number;
  color: string;
  label?: string;
  operator?: 'gt' | 'gte' | 'lt' | 'lte';
}

export interface DataSourceConfig {
  type: 'metrics' | 'logs' | 'traces' | 'alerts' | 'external';
  query: string;
  interval?: number; // seconds
  timeout?: number; // ms
  cache?: boolean;
  transform?: string; // transformation expression
}

export interface LayoutConfig {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
  responsive?: boolean;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'text' | 'date' | 'range';
  values: any[];
  defaultValue?: any;
  query?: string;
}

export interface TimeRange {
  start: Date | string;
  end: Date | string;
  preset?: 'last5m' | 'last15m' | 'last1h' | 'last6h' | 'last24h' | 'last7d' | 'last30d';
  timezone?: string;
}

export interface AnomalyDetection {
  id: string;
  metric: string;
  algorithm: 'statistical' | 'ml' | 'seasonality' | 'threshold';
  config: AnomalyConfig;
  status: 'active' | 'inactive' | 'training';
  sensitivity: 'low' | 'medium' | 'high';
  results: AnomalyResult[];
}

export interface AnomalyConfig {
  window: number; // time window in seconds
  threshold: number; // sensitivity threshold
  minDataPoints: number;
  seasonality?: 'daily' | 'weekly' | 'monthly';
  features?: string[]; // for ML algorithms
  parameters: Record<string, any>;
}

export interface AnomalyResult {
  timestamp: Date;
  value: number;
  expected: number;
  score: number; // anomaly score 0-1
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  explanation?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  source: string;
  message: string;
  service?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata: Record<string, any>;
  tags: string[];
}

export interface LogQuery {
  query: string;
  timeRange: TimeRange;
  filters?: LogFilter[];
  aggregation?: LogAggregation;
  sort?: LogSort;
  limit?: number;
  offset?: number;
}

export interface LogFilter {
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'regex' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

export interface LogAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'max' | 'min' | 'distinct';
  interval?: string; // for time-based aggregation
}

export interface LogSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  startTime: Date;
  endTime: Date;
  duration: number; // ms
  status: 'ok' | 'error' | 'timeout';
  tags: Record<string, any>;
  logs: TraceLog[];
  baggage?: Record<string, string>;
}

export interface TraceLog {
  timestamp: Date;
  fields: Record<string, any>;
}

export interface Trace {
  id: string;
  rootSpan: TraceSpan;
  spans: TraceSpan[];
  duration: number; // ms
  services: string[];
  depth: number;
  errors: number;
}

export interface MonitoringTarget {
  id: string;
  name: string;
  type: 'host' | 'service' | 'container' | 'database' | 'external';
  endpoint: string;
  config: TargetConfig;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unreachable';
  lastCheck: Date;
  metadata: Record<string, any>;
}

export interface TargetConfig {
  interval: number; // seconds
  timeout: number; // ms
  retries: number;
  healthCheck: HealthCheckConfig;
  authentication?: AuthConfig;
  headers?: Record<string, string>;
  proxy?: ProxyConfig;
}

export interface HealthCheckConfig {
  type: 'http' | 'tcp' | 'ping' | 'custom';
  path?: string;
  method?: string;
  expectedStatus?: number[];
  expectedContent?: string;
  script?: string; // for custom checks
}

export interface AuthConfig {
  type: 'basic' | 'bearer' | 'api-key' | 'oauth';
  credentials: Record<string, string>;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface MonitoringReport {
  id: string;
  name: string;
  type: 'scheduled' | 'on-demand';
  format: 'pdf' | 'html' | 'json' | 'csv';
  schedule?: ScheduleConfig;
  content: ReportContent;
  recipients: string[];
  generated: Date;
  data: any;
}

export interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  hour?: number; // 0-23
  minute?: number; // 0-59
  timezone?: string;
}

export interface ReportContent {
  sections: ReportSection[];
  template?: string;
  styling?: Record<string, any>;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'metrics' | 'chart' | 'table' | 'text' | 'alerts';
  content: any;
  config?: Record<string, any>;
}

export interface MonitoringSystemConfig {
  collection: CollectionConfig;
  alerting: AlertingConfig;
  dashboards: DashboardConfig;
  integrations: IntegrationConfig;
  security: SecurityConfig;
}

export interface CollectionConfig {
  interval: number; // seconds
  retention: RetentionConfig;
  aggregation: AggregationConfig;
  filters: string[];
  sampling?: SamplingConfig;
}

export interface RetentionConfig {
  raw: string; // e.g., "7d"
  hourly: string; // e.g., "30d"
  daily: string; // e.g., "1y"
  weekly: string; // e.g., "5y"
}

export interface AggregationConfig {
  enabled: boolean;
  functions: string[];
  intervals: string[];
  dimensions: string[];
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number; // 0-1
  strategy: 'random' | 'adaptive' | 'priority';
}

export interface AlertingConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  escalation: GlobalEscalationConfig;
  suppression: GlobalSuppressionConfig;
  templates: AlertTemplate[];
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  filters?: string[];
}

export interface GlobalEscalationConfig {
  maxLevels: number;
  defaultDelay: number; // seconds
  autoResolve: boolean;
  autoResolveDelay: number; // seconds
}

export interface GlobalSuppressionConfig {
  enabled: boolean;
  defaultDuration: number; // seconds
  rules: SuppressionRule[];
}

export interface SuppressionRule {
  id: string;
  name: string;
  conditions: string[];
  duration: number; // seconds
  priority: number;
}

export interface AlertTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface DashboardConfig {
  enabled: boolean;
  defaultRefresh: number; // seconds
  maxWidgets: number;
  themes: string[];
  sharing: SharingConfig;
}

export interface SharingConfig {
  enabled: boolean;
  publicDashboards: boolean;
  embedSupport: boolean;
  exportFormats: string[];
}

export interface IntegrationConfig {
  prometheus?: PrometheusConfig;
  grafana?: GrafanaConfig;
  elk?: ELKConfig;
  jaeger?: JaegerConfig;
  external: ExternalIntegration[];
}

export interface PrometheusConfig {
  enabled: boolean;
  endpoint: string;
  pushGateway?: string;
  scrapeConfigs: ScrapeConfig[];
}

export interface ScrapeConfig {
  jobName: string;
  targets: string[];
  interval: string;
  path?: string;
  scheme?: string;
}

export interface GrafanaConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  defaultDatasource: string;
}

export interface ELKConfig {
  enabled: boolean;
  elasticsearch: {
    endpoint: string;
    index: string;
  };
  logstash?: {
    endpoint: string;
  };
  kibana?: {
    endpoint: string;
  };
}

export interface JaegerConfig {
  enabled: boolean;
  endpoint: string;
  sampler: {
    type: string;
    param: number;
  };
}

export interface ExternalIntegration {
  id: string;
  type: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface SecurityConfig {
  authentication: {
    enabled: boolean;
    methods: string[];
    sessionTimeout: number; // seconds
  };
  authorization: {
    enabled: boolean;
    rbac: boolean;
    permissions: string[];
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotation: number; // seconds
  };
  audit: {
    enabled: boolean;
    events: string[];
    retention: string;
  };
}

// 监控报警系统主接口
export interface IMonitoringAlertingSystem {
  // 指标收集
  collectMetrics(targets?: string[]): Promise<MonitoringMetrics>;
  getMetrics(query: string, timeRange: TimeRange): Promise<any[]>;
  
  // 报警管理
  createAlertRule(rule: AlertRule): Promise<void>;
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void>;
  deleteAlertRule(ruleId: string): Promise<void>;
  getActiveAlerts(filters?: any): Promise<Alert[]>;
  acknowledgeAlert(alertId: string, user: string): Promise<void>;
  resolveAlert(alertId: string, user: string): Promise<void>;
  
  // 异常检测
  setupAnomalyDetection(config: AnomalyDetection): Promise<void>;
  detectAnomalies(metric: string, timeRange: TimeRange): Promise<AnomalyResult[]>;
  
  // 仪表板
  createDashboard(dashboard: MonitoringDashboard): Promise<void>;
  updateDashboard(dashboardId: string, updates: Partial<MonitoringDashboard>): Promise<void>;
  getDashboard(dashboardId: string): Promise<MonitoringDashboard>;
  
  // 日志管理
  queryLogs(query: LogQuery): Promise<LogEntry[]>;
  streamLogs(query: LogQuery, callback: (log: LogEntry) => void): Promise<void>;
  
  // 链路追踪
  getTrace(traceId: string): Promise<Trace>;
  queryTraces(query: any, timeRange: TimeRange): Promise<Trace[]>;
  
  // 健康检查
  addTarget(target: MonitoringTarget): Promise<void>;
  removeTarget(targetId: string): Promise<void>;
  checkTargetHealth(targetId: string): Promise<boolean>;
  
  // 报告生成
  generateReport(reportId: string): Promise<MonitoringReport>;
  scheduleReport(report: MonitoringReport): Promise<void>;
  
  // 配置管理
  updateConfig(config: Partial<MonitoringSystemConfig>): Promise<void>;
  getConfig(): MonitoringSystemConfig;
  
  // 集成管理
  setupPrometheusIntegration(config: PrometheusConfig): Promise<void>;
  setupGrafanaIntegration(config: GrafanaConfig): Promise<void>;
  
  // 系统管理
  getSystemStatus(): Promise<Record<string, any>>;
  exportData(query: any, format: string): Promise<any>;
  importData(data: any, format: string): Promise<void>;
}
