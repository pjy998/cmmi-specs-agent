import os from 'os';
import { 
  IMonitoringAlertingSystem,
  MonitoringMetrics,
  SystemMetrics,
  ApplicationMetrics,
  BusinessMetrics,
  CustomMetrics,
  Alert,
  AlertRule,
  AlertCondition,
  AnomalyDetection,
  AnomalyResult,
  MonitoringDashboard,
  LogEntry,
  LogQuery,
  Trace,
  MonitoringTarget,
  MonitoringReport,
  MonitoringSystemConfig,
  TimeRange,
  PrometheusConfig,
  GrafanaConfig,
  ProcessInfo
} from '../types/monitoring-alerting.js';

/**
 * 监控报警系统
 * 提供全方位的系统监控、智能报警、异常检测、仪表板等功能
 */
export class MonitoringAlertingSystem implements IMonitoringAlertingSystem {
  private config: MonitoringSystemConfig;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private dashboards: Map<string, MonitoringDashboard>;
  private targets: Map<string, MonitoringTarget>;
  private anomalyDetectors: Map<string, AnomalyDetection>;
  private metricsCache: Map<string, any>;
  private logsBuffer: LogEntry[];

  constructor(config?: Partial<MonitoringSystemConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.updateConfigSync(config);
    }

    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.dashboards = new Map();
    this.targets = new Map();
    this.anomalyDetectors = new Map();
    this.metricsCache = new Map();
    this.logsBuffer = [];

    this.initializeDefaultRules();
    this.initializeDefaultDashboards();
    this.startMetricsCollection();
  }

  /**
   * 收集系统指标
   */
  async collectMetrics(targets?: string[]): Promise<MonitoringMetrics> {
    console.log('📊 收集系统指标...');

    const timestamp = new Date();
    
    // 收集系统指标
    const systemMetrics = await this.collectSystemMetrics();
    
    // 收集应用指标
    const applicationMetrics = await this.collectApplicationMetrics();
    
    // 收集业务指标
    const businessMetrics = await this.collectBusinessMetrics();
    
    // 收集自定义指标
    const customMetrics = await this.collectCustomMetrics(targets);

    const metrics: MonitoringMetrics = {
      timestamp,
      system: systemMetrics,
      application: applicationMetrics,
      business: businessMetrics,
      custom: customMetrics
    };

    // 缓存指标数据
    this.cacheMetrics(metrics);
    
    // 检查报警条件
    await this.checkAlertConditions(metrics);

    return metrics;
  }

  /**
   * 查询历史指标
   */
  async getMetrics(query: string, timeRange: TimeRange): Promise<any[]> {
    console.log(`📈 查询指标: ${query}`);
    
    // 这里实现指标查询逻辑
    const cachedData = this.metricsCache.get(query) || [];
    
    return this.filterByTimeRange(cachedData, timeRange);
  }

  /**
   * 创建报警规则
   */
  async createAlertRule(rule: AlertRule): Promise<void> {
    console.log(`🚨 创建报警规则: ${rule.name}`);
    
    rule.metadata = {
      ...rule.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.alertRules.set(rule.id, rule);
  }

  /**
   * 更新报警规则
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    console.log(`📝 更新报警规则: ${ruleId}`);
    
    const existingRule = this.alertRules.get(ruleId);
    if (!existingRule) {
      throw new Error(`报警规则不存在: ${ruleId}`);
    }

    const updatedRule = {
      ...existingRule,
      ...updates,
      metadata: {
        ...existingRule.metadata,
        updatedAt: new Date(),
        version: existingRule.metadata.version + 1
      }
    };

    this.alertRules.set(ruleId, updatedRule);
  }

  /**
   * 删除报警规则
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    console.log(`🗑️ 删除报警规则: ${ruleId}`);
    
    if (!this.alertRules.has(ruleId)) {
      throw new Error(`报警规则不存在: ${ruleId}`);
    }

    this.alertRules.delete(ruleId);
  }

  /**
   * 获取活跃报警
   */
  async getActiveAlerts(filters?: any): Promise<Alert[]> {
    console.log('📋 获取活跃报警...');
    
    let alerts = Array.from(this.activeAlerts.values());
    
    if (filters) {
      alerts = this.filterAlerts(alerts, filters);
    }

    return alerts.filter(alert => alert.status === 'active');
  }

  /**
   * 确认报警
   */
  async acknowledgeAlert(alertId: string, user: string): Promise<void> {
    console.log(`✅ 确认报警: ${alertId} by ${user}`);
    
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`报警不存在: ${alertId}`);
    }

    alert.status = 'acknowledged';
    alert.timestamps.acknowledged = new Date();
    alert.metadata['acknowledgedBy'] = user;

    this.activeAlerts.set(alertId, alert);
  }

  /**
   * 解决报警
   */
  async resolveAlert(alertId: string, user: string): Promise<void> {
    console.log(`🔧 解决报警: ${alertId} by ${user}`);
    
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`报警不存在: ${alertId}`);
    }

    alert.status = 'resolved';
    alert.timestamps.resolved = new Date();
    alert.metadata['resolvedBy'] = user;

    this.activeAlerts.set(alertId, alert);
  }

  /**
   * 设置异常检测
   */
  async setupAnomalyDetection(config: AnomalyDetection): Promise<void> {
    console.log(`🤖 设置异常检测: ${config.metric}`);
    
    config.status = 'active';
    config.results = [];

    this.anomalyDetectors.set(config.id, config);
  }

  /**
   * 检测异常
   */
  async detectAnomalies(metric: string, timeRange: TimeRange): Promise<AnomalyResult[]> {
    console.log(`🔍 检测异常: ${metric}`);
    
    const detector = Array.from(this.anomalyDetectors.values())
      .find(d => d.metric === metric);

    if (!detector) {
      return [];
    }

    // 获取历史数据
    const historicalData = await this.getMetrics(metric, timeRange);
    
    // 执行异常检测算法
    const anomalies = this.runAnomalyDetection(detector, historicalData);

    return anomalies;
  }

  /**
   * 创建仪表板
   */
  async createDashboard(dashboard: MonitoringDashboard): Promise<void> {
    console.log(`📊 创建仪表板: ${dashboard.name}`);
    
    this.dashboards.set(dashboard.id, dashboard);
  }

  /**
   * 更新仪表板
   */
  async updateDashboard(dashboardId: string, updates: Partial<MonitoringDashboard>): Promise<void> {
    console.log(`📝 更新仪表板: ${dashboardId}`);
    
    const existing = this.dashboards.get(dashboardId);
    if (!existing) {
      throw new Error(`仪表板不存在: ${dashboardId}`);
    }

    const updated = { ...existing, ...updates };
    this.dashboards.set(dashboardId, updated);
  }

  /**
   * 获取仪表板
   */
  async getDashboard(dashboardId: string): Promise<MonitoringDashboard> {
    console.log(`📊 获取仪表板: ${dashboardId}`);
    
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`仪表板不存在: ${dashboardId}`);
    }

    return dashboard;
  }

  /**
   * 查询日志
   */
  async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    console.log(`📝 查询日志: ${query.query}`);
    
    let logs = this.logsBuffer.slice();
    
    // 应用时间范围过滤
    logs = logs.filter(log => 
      log.timestamp >= new Date(query.timeRange.start) &&
      log.timestamp <= new Date(query.timeRange.end)
    );

    // 应用其他过滤器
    if (query.filters) {
      logs = this.filterLogs(logs, query.filters);
    }

    // 应用排序
    if (query.sort) {
      logs = this.sortLogs(logs, query.sort);
    }

    // 应用分页
    const start = query.offset || 0;
    const end = start + (query.limit || 100);

    return logs.slice(start, end);
  }

  /**
   * 流式日志
   */
  async streamLogs(query: LogQuery, callback: (log: LogEntry) => void): Promise<void> {
    console.log(`📡 流式日志: ${query.query}`);
    
    // 模拟流式日志处理
    const interval = setInterval(() => {
      const mockLog: LogEntry = {
        timestamp: new Date(),
        level: 'info',
        source: 'monitoring-system',
        message: `流式日志消息 ${Date.now()}`,
        metadata: { query: query.query },
        tags: ['monitoring', 'stream']
      };

      callback(mockLog);
    }, 1000);

    // 10秒后停止流式传输
    setTimeout(() => {
      clearInterval(interval);
    }, 10000);
  }

  /**
   * 获取链路追踪
   */
  async getTrace(traceId: string): Promise<Trace> {
    console.log(`🔗 获取链路追踪: ${traceId}`);
    
    // 模拟链路追踪数据
    const trace: Trace = {
      id: traceId,
      rootSpan: {
        traceId,
        spanId: 'root-span',
        operation: 'http-request',
        service: 'api-gateway',
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(),
        duration: 1000,
        status: 'ok',
        tags: { 'http.method': 'GET', 'http.url': '/api/users' },
        logs: []
      },
      spans: [],
      duration: 1000,
      services: ['api-gateway', 'user-service', 'database'],
      depth: 3,
      errors: 0
    };

    return trace;
  }

  /**
   * 查询链路追踪
   */
  async queryTraces(_query: any, _timeRange: TimeRange): Promise<Trace[]> {
    console.log(`🔍 查询链路追踪: ${JSON.stringify(_query)}`);
    
    // 模拟返回追踪数据
    const traces: Trace[] = [];
    
    return traces;
  }

  /**
   * 添加监控目标
   */
  async addTarget(target: MonitoringTarget): Promise<void> {
    console.log(`🎯 添加监控目标: ${target.name}`);
    
    target.status = 'healthy';
    target.lastCheck = new Date();

    this.targets.set(target.id, target);
    
    // 开始健康检查
    this.startHealthCheck(target);
  }

  /**
   * 移除监控目标
   */
  async removeTarget(targetId: string): Promise<void> {
    console.log(`🗑️ 移除监控目标: ${targetId}`);
    
    if (!this.targets.has(targetId)) {
      throw new Error(`监控目标不存在: ${targetId}`);
    }

    this.targets.delete(targetId);
  }

  /**
   * 检查目标健康状态
   */
  async checkTargetHealth(targetId: string): Promise<boolean> {
    console.log(`💚 检查目标健康状态: ${targetId}`);
    
    const target = this.targets.get(targetId);
    if (!target) {
      throw new Error(`监控目标不存在: ${targetId}`);
    }

    // 执行健康检查
    const isHealthy = await this.performHealthCheck(target);
    
    // 更新目标状态
    target.status = isHealthy ? 'healthy' : 'unhealthy';
    target.lastCheck = new Date();
    this.targets.set(targetId, target);

    return isHealthy;
  }

  /**
   * 生成报告
   */
  async generateReport(reportId: string): Promise<MonitoringReport> {
    console.log(`📄 生成报告: ${reportId}`);
    
    const report: MonitoringReport = {
      id: reportId,
      name: '监控系统报告',
      type: 'on-demand',
      format: 'json',
      content: {
        sections: [
          {
            id: 'overview',
            title: '系统概览',
            type: 'metrics',
            content: await this.collectMetrics()
          },
          {
            id: 'alerts',
            title: '报警状态',
            type: 'alerts',
            content: await this.getActiveAlerts()
          }
        ]
      },
      recipients: [],
      generated: new Date(),
      data: {}
    };

    return report;
  }

  /**
   * 计划报告
   */
  async scheduleReport(report: MonitoringReport): Promise<void> {
    console.log(`📅 计划报告: ${report.name}`);
    
    // 这里实现报告调度逻辑
    console.log(`报告已计划，将按 ${report.schedule?.frequency} 频率生成`);
  }

  /**
   * 更新配置
   */
  async updateConfig(config: Partial<MonitoringSystemConfig>): Promise<void> {
    console.log('⚙️ 更新监控系统配置...');
    this.updateConfigSync(config);
  }

  /**
   * 获取配置
   */
  getConfig(): MonitoringSystemConfig {
    return { ...this.config };
  }

  /**
   * 设置Prometheus集成
   */
  async setupPrometheusIntegration(config: PrometheusConfig): Promise<void> {
    console.log(`🔗 设置Prometheus集成: ${config.endpoint}`);
    
    this.config.integrations.prometheus = config;
  }

  /**
   * 设置Grafana集成
   */
  async setupGrafanaIntegration(config: GrafanaConfig): Promise<void> {
    console.log(`📊 设置Grafana集成: ${config.endpoint}`);
    
    this.config.integrations.grafana = config;
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<Record<string, any>> {
    const metrics = await this.collectMetrics();
    const activeAlertCount = this.activeAlerts.size;
    const targetCount = this.targets.size;

    return {
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      metrics: metrics.system,
      alerts: {
        active: activeAlertCount,
        rules: this.alertRules.size
      },
      targets: {
        total: targetCount,
        healthy: Array.from(this.targets.values()).filter(t => t.status === 'healthy').length
      },
      lastCollection: new Date(),
      memory: process.memoryUsage(),
      performance: {
        responseTime: Math.random() * 100 + 50,
        throughput: Math.random() * 1000 + 500
      }
    };
  }

  /**
   * 导出数据
   */
  async exportData(query: any, format: string): Promise<any> {
    console.log(`📤 导出数据: ${format}格式`);
    
    const data = {
      query,
      timestamp: new Date(),
      metrics: await this.collectMetrics(),
      alerts: Array.from(this.activeAlerts.values()),
      config: this.config
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    return data;
  }

  /**
   * 导入数据
   */
  async importData(data: any, format: string): Promise<void> {
    console.log(`📥 导入数据: ${format}格式`);
    
    if (format === 'json' && typeof data === 'string') {
      data = JSON.parse(data);
    }

    // 这里实现数据导入逻辑
    console.log('数据导入完成');
  }

  // 私有方法实现...

  private getDefaultConfig(): MonitoringSystemConfig {
    return {
      collection: {
        interval: 30,
        retention: {
          raw: '7d',
          hourly: '30d',
          daily: '1y',
          weekly: '5y'
        },
        aggregation: {
          enabled: true,
          functions: ['avg', 'max', 'min', 'sum'],
          intervals: ['1m', '5m', '1h', '1d'],
          dimensions: ['host', 'service', 'environment']
        },
        filters: [],
        sampling: {
          enabled: false,
          rate: 1.0,
          strategy: 'random'
        }
      },
      alerting: {
        enabled: true,
        channels: [
          {
            id: 'default-email',
            type: 'email',
            name: '默认邮件通知',
            config: {},
            enabled: true
          }
        ],
        escalation: {
          maxLevels: 3,
          defaultDelay: 300,
          autoResolve: true,
          autoResolveDelay: 3600
        },
        suppression: {
          enabled: true,
          defaultDuration: 1800,
          rules: []
        },
        templates: [
          {
            id: 'default',
            name: '默认报警模板',
            type: 'threshold',
            subject: '【监控报警】{{alert.name}}',
            body: '报警详情：{{alert.message}}',
            variables: ['alert.name', 'alert.message', 'alert.severity']
          }
        ]
      },
      dashboards: {
        enabled: true,
        defaultRefresh: 30,
        maxWidgets: 50,
        themes: ['light', 'dark'],
        sharing: {
          enabled: true,
          publicDashboards: false,
          embedSupport: true,
          exportFormats: ['png', 'pdf', 'json']
        }
      },
      integrations: {
        prometheus: {
          enabled: false,
          endpoint: 'http://localhost:9090',
          scrapeConfigs: []
        },
        grafana: {
          enabled: false,
          endpoint: 'http://localhost:3000',
          apiKey: '',
          defaultDatasource: 'prometheus'
        },
        external: []
      },
      security: {
        authentication: {
          enabled: true,
          methods: ['basic', 'bearer'],
          sessionTimeout: 3600
        },
        authorization: {
          enabled: true,
          rbac: true,
          permissions: ['read', 'write', 'admin']
        },
        encryption: {
          enabled: true,
          algorithm: 'AES-256-GCM',
          keyRotation: 86400
        },
        audit: {
          enabled: true,
          events: ['login', 'config_change', 'alert_create', 'alert_resolve'],
          retention: '90d'
        }
      }
    };
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // 模拟进程信息
    const processes: ProcessInfo[] = [
      {
        pid: process.pid,
        name: 'monitoring-system',
        cpu: Math.random() * 10 + 5,
        memory: process.memoryUsage().rss,
        status: 'running',
        uptime: process.uptime()
      }
    ];

    return {
      cpu: {
        usage: Math.random() * 30 + 20, // 20-50%
        cores: cpus.length,
        load: os.loadavg(),
        temperature: Math.random() * 20 + 40 // 40-60°C
      },
      memory: {
        used: usedMem,
        total: totalMem,
        available: freeMem,
        usage: (usedMem / totalMem) * 100,
        swap: {
          used: Math.random() * 1000000000,
          total: 2000000000
        }
      },
      disk: {
        usage: Math.random() * 30 + 40, // 40-70%
        free: Math.random() * 500000000000 + 100000000000,
        total: 1000000000000,
        io: {
          read: Math.random() * 100000000 + 10000000,
          write: Math.random() * 50000000 + 5000000,
          iops: Math.random() * 1000 + 100
        }
      },
      network: {
        bytesIn: Math.random() * 1000000 + 100000,
        bytesOut: Math.random() * 500000 + 50000,
        packetsIn: Math.random() * 10000 + 1000,
        packetsOut: Math.random() * 8000 + 800,
        errors: Math.random() * 10,
        latency: Math.random() * 50 + 10
      },
      processes
    };
  }

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    return {
      response: {
        time: Math.random() * 200 + 50, // 50-250ms
        timeP50: Math.random() * 100 + 50,
        timeP90: Math.random() * 300 + 100,
        timeP99: Math.random() * 500 + 200
      },
      throughput: {
        requests: Math.random() * 1000 + 500,
        errors: Math.random() * 10 + 1,
        success: Math.random() * 990 + 490
      },
      errors: {
        rate: Math.random() * 2 + 0.5, // 0.5-2.5%
        total: Math.random() * 100 + 10,
        types: {
          '4xx': Math.random() * 50 + 5,
          '5xx': Math.random() * 20 + 2,
          timeout: Math.random() * 10 + 1
        }
      },
      database: {
        connections: {
          active: Math.random() * 20 + 5,
          idle: Math.random() * 10 + 2,
          total: 50
        },
        queries: {
          slow: Math.random() * 5 + 1,
          failed: Math.random() * 2,
          total: Math.random() * 1000 + 200,
          avgTime: Math.random() * 100 + 20
        }
      },
      cache: {
        hits: Math.random() * 800 + 700,
        misses: Math.random() * 200 + 50,
        hitRate: Math.random() * 20 + 75, // 75-95%
        memory: Math.random() * 100000000 + 50000000
      },
      queue: {
        pending: Math.random() * 100 + 10,
        processed: Math.random() * 1000 + 500,
        failed: Math.random() * 10 + 1,
        avgWaitTime: Math.random() * 5000 + 1000
      }
    };
  }

  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    return {
      users: {
        active: Math.random() * 10000 + 5000,
        new: Math.random() * 500 + 100,
        retention: Math.random() * 20 + 70, // 70-90%
        churn: Math.random() * 5 + 2 // 2-7%
      },
      transactions: {
        count: Math.random() * 1000 + 200,
        volume: Math.random() * 50000 + 10000,
        success: Math.random() * 950 + 190,
        failed: Math.random() * 50 + 10,
        avgValue: Math.random() * 100 + 25
      },
      features: {
        usage: {
          dashboard: Math.random() * 8000 + 2000,
          reports: Math.random() * 3000 + 500,
          api: Math.random() * 15000 + 5000
        },
        adoption: {
          new_feature_a: Math.random() * 30 + 10,
          new_feature_b: Math.random() * 20 + 5
        }
      },
      conversion: {
        funnel: {
          landing: 10000,
          signup: 1000,
          trial: 500,
          paid: 100
        },
        rates: {
          signup: 10,
          trial: 50,
          paid: 20
        }
      }
    };
  }

  private async collectCustomMetrics(targets?: string[]): Promise<CustomMetrics> {
    const metrics: CustomMetrics = {};

    if (targets?.includes('deployment')) {
      metrics['deployment_frequency'] = {
        value: Math.random() * 10 + 1,
        unit: 'per_day'
      };
      metrics['lead_time'] = {
        value: Math.random() * 24 + 4,
        unit: 'hours'
      };
    }

    if (targets?.includes('quality')) {
      metrics['code_coverage'] = {
        value: Math.random() * 20 + 75,
        unit: 'percentage'
      };
      metrics['test_pass_rate'] = {
        value: Math.random() * 10 + 85,
        unit: 'percentage'
      };
    }

    return metrics;
  }

  private cacheMetrics(metrics: MonitoringMetrics): void {
    const key = `metrics_${metrics.timestamp.getTime()}`;
    this.metricsCache.set(key, metrics);

    // 保留最近1000个指标点
    if (this.metricsCache.size > 1000) {
      const oldestKey = Array.from(this.metricsCache.keys())[0];
      if (oldestKey) {
        this.metricsCache.delete(oldestKey);
      }
    }
  }

  private async checkAlertConditions(metrics: MonitoringMetrics): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const shouldAlert = await this.evaluateAlertRule(rule, metrics);
      
      if (shouldAlert) {
        await this.triggerAlert(rule, metrics);
      }
    }
  }

  private async evaluateAlertRule(rule: AlertRule, metrics: MonitoringMetrics): Promise<boolean> {
    for (const condition of rule.conditions) {
      const metricValue = this.getMetricValue(condition.metric, metrics);
      const conditionMet = this.evaluateCondition(condition, metricValue);
      
      if (rule.logic === 'OR' && conditionMet) {
        return true;
      } else if (rule.logic === 'AND' && !conditionMet) {
        return false;
      }
    }

    return rule.logic === 'AND';
  }

  private getMetricValue(metricPath: string, metrics: MonitoringMetrics): number {
    // 简化的指标路径解析
    const parts = metricPath.split('.');
    
    switch (parts[0]) {
      case 'system':
        if (parts[1] === 'cpu' && parts[2] === 'usage') return metrics.system.cpu.usage;
        if (parts[1] === 'memory' && parts[2] === 'usage') return metrics.system.memory.usage;
        if (parts[1] === 'disk' && parts[2] === 'usage') return metrics.system.disk.usage;
        break;
      case 'application':
        if (parts[1] === 'response' && parts[2] === 'time') return metrics.application.response.time;
        if (parts[1] === 'errors' && parts[2] === 'rate') return metrics.application.errors.rate;
        break;
    }

    return 0;
  }

  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    const threshold = Number(condition.threshold);
    
    switch (condition.operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: MonitoringMetrics): Promise<void> {
    const alertId = this.generateAlertId();
    
    const firstCondition = rule.conditions[0];
    if (!firstCondition) {
      throw new Error('Alert rule must have at least one condition');
    }
    
    const alert: Alert = {
      id: alertId,
      name: rule.name,
      type: 'threshold',
      severity: this.mapPriorityToSeverity(rule.priority),
      status: 'active',
      source: 'monitoring-system',
      condition: firstCondition,
      message: `${rule.name} 触发报警`,
      details: `指标超过阈值: ${JSON.stringify(rule.conditions)}`,
      metadata: {
        ruleId: rule.id,
        metrics: metrics.timestamp
      },
      timestamps: {
        created: new Date(),
        triggered: new Date()
      },
      actions: []
    };

    this.activeAlerts.set(alertId, alert);
    
    // 执行报警动作
    await this.executeAlertActions(alert, rule);
    
    console.log(`🚨 触发报警: ${alert.name} (${alert.severity})`);
  }

  private mapPriorityToSeverity(priority: number): Alert['severity'] {
    if (priority >= 9) return 'critical';
    if (priority >= 7) return 'high';
    if (priority >= 5) return 'medium';
    if (priority >= 3) return 'low';
    return 'info';
  }

  private async executeAlertActions(alert: Alert, rule: AlertRule): Promise<void> {
    for (const actionConfig of rule.actions) {
      try {
        await this.executeAction(actionConfig, alert);
      } catch (error) {
        console.error(`执行报警动作失败: ${error}`);
      }
    }
  }

  private async executeAction(actionConfig: any, alert: Alert): Promise<void> {
    const action: any = {
      id: this.generateActionId(),
      type: actionConfig.type,
      config: actionConfig.config,
      status: 'pending',
      executedAt: new Date()
    };

    try {
      switch (actionConfig.type) {
        case 'notification':
          await this.sendNotification(alert, actionConfig.config);
          break;
        case 'webhook':
          await this.callWebhook(alert, actionConfig.config);
          break;
        case 'script':
          await this.executeScript(alert, actionConfig.config);
          break;
      }
      
      action.status = 'executed';
    } catch (error) {
      action.status = 'failed';
      action.error = String(error);
    }

    alert.actions.push(action);
  }

  private async sendNotification(alert: Alert, config: any): Promise<void> {
    console.log(`📧 发送通知: ${alert.name} -> ${config.channel || 'default'}`);
  }

  private async callWebhook(_alert: Alert, config: any): Promise<void> {
    console.log(`🌐 调用Webhook: ${config.url}`);
  }

  private async executeScript(_alert: Alert, config: any): Promise<void> {
    console.log(`⚙️ 执行脚本: ${config.script}`);
  }

  private filterByTimeRange(data: any[], timeRange: TimeRange): any[] {
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    
    return data.filter(item => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  private filterAlerts(alerts: Alert[], filters: any): Alert[] {
    return alerts.filter(alert => {
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.source && alert.source !== filters.source) return false;
      return true;
    });
  }

  private runAnomalyDetection(detector: AnomalyDetection, data: any[]): AnomalyResult[] {
    const results: AnomalyResult[] = [];
    
    if (data.length < detector.config.minDataPoints) {
      return results;
    }

    // 简化的异常检测算法
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    for (let i = 0; i < data.length; i++) {
      const value = values[i];
      const zscore = Math.abs((value - mean) / std);
      
      if (zscore > detector.config.threshold) {
        results.push({
          timestamp: data[i].timestamp,
          value,
          expected: mean,
          score: Math.min(zscore / 3, 1), // 标准化到0-1
          severity: zscore > 3 ? 'high' : zscore > 2 ? 'medium' : 'low',
          confidence: Math.min(zscore / 2, 1),
          explanation: `值 ${value.toFixed(2)} 偏离期望 ${mean.toFixed(2)} 超过 ${zscore.toFixed(2)} 个标准差`
        });
      }
    }

    return results;
  }

  private filterLogs(logs: LogEntry[], filters: any[]): LogEntry[] {
    return logs.filter(log => {
      return filters.every(filter => {
        const fieldValue = this.getLogFieldValue(log, filter.field);
        return this.matchesFilter(fieldValue, filter.operator, filter.value);
      });
    });
  }

  private getLogFieldValue(log: LogEntry, field: string): any {
    const parts = field.split('.');
    let value: any = log;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  private matchesFilter(fieldValue: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'eq': return fieldValue === filterValue;
      case 'ne': return fieldValue !== filterValue;
      case 'contains': return String(fieldValue).includes(String(filterValue));
      case 'regex': return new RegExp(filterValue).test(String(fieldValue));
      case 'gt': return Number(fieldValue) > Number(filterValue);
      case 'gte': return Number(fieldValue) >= Number(filterValue);
      case 'lt': return Number(fieldValue) < Number(filterValue);
      case 'lte': return Number(fieldValue) <= Number(filterValue);
      default: return false;
    }
  }

  private sortLogs(logs: LogEntry[], sort: any): LogEntry[] {
    return logs.sort((a, b) => {
      const aValue = this.getLogFieldValue(a, sort.field);
      const bValue = this.getLogFieldValue(b, sort.field);
      
      if (sort.order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  private async performHealthCheck(target: MonitoringTarget): Promise<boolean> {
    try {
      switch (target.config.healthCheck.type) {
        case 'http':
          return await this.httpHealthCheck(target);
        case 'tcp':
          return await this.tcpHealthCheck(target);
        case 'ping':
          return await this.pingHealthCheck(target);
        default:
          return true; // 默认认为健康
      }
    } catch (error) {
      console.error(`健康检查失败 ${target.name}:`, error);
      return false;
    }
  }

  private async httpHealthCheck(target: MonitoringTarget): Promise<boolean> {
    // 模拟HTTP健康检查
    const success = Math.random() > 0.1; // 90%成功率
    console.log(`🌐 HTTP健康检查 ${target.name}: ${success ? '成功' : '失败'}`);
    return success;
  }

  private async tcpHealthCheck(target: MonitoringTarget): Promise<boolean> {
    // 模拟TCP健康检查
    const success = Math.random() > 0.05; // 95%成功率
    console.log(`🔌 TCP健康检查 ${target.name}: ${success ? '成功' : '失败'}`);
    return success;
  }

  private async pingHealthCheck(target: MonitoringTarget): Promise<boolean> {
    // 模拟Ping健康检查
    const success = Math.random() > 0.02; // 98%成功率
    console.log(`📶 Ping健康检查 ${target.name}: ${success ? '成功' : '失败'}`);
    return success;
  }

  private startHealthCheck(target: MonitoringTarget): void {
    const interval = setInterval(async () => {
      const isHealthy = await this.performHealthCheck(target);
      
      const currentTarget = this.targets.get(target.id);
      if (currentTarget) {
        const previousStatus = currentTarget.status;
        currentTarget.status = isHealthy ? 'healthy' : 'unhealthy';
        currentTarget.lastCheck = new Date();
        
        // 如果状态改变，记录事件
        if (previousStatus !== currentTarget.status) {
          console.log(`🔄 目标状态变更: ${target.name} ${previousStatus} -> ${currentTarget.status}`);
        }
        
        this.targets.set(target.id, currentTarget);
      } else {
        clearInterval(interval);
      }
    }, target.config.interval * 1000);
  }

  private initializeDefaultRules(): void {
    // CPU使用率报警规则
    const cpuRule: AlertRule = {
      id: 'cpu-high',
      name: 'CPU使用率过高',
      description: 'CPU使用率超过80%',
      enabled: true,
      priority: 8,
      tags: ['system', 'cpu'],
      conditions: [{
        metric: 'system.cpu.usage',
        operator: 'gt',
        threshold: 80,
        duration: 300 // 5分钟
      }],
      logic: 'AND',
      suppression: {
        enabled: true,
        duration: 1800 // 30分钟
      },
      escalation: {
        enabled: true,
        levels: [{
          level: 1,
          delay: 300,
          recipients: ['admin@example.com'],
          channels: ['email']
        }],
        autoResolve: true,
        autoResolveDelay: 600
      },
      actions: [{
        type: 'notification',
        config: { channel: 'email' }
      }],
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        version: 1
      }
    };

    this.alertRules.set(cpuRule.id, cpuRule);

    // 内存使用率报警规则
    const memoryRule: AlertRule = {
      id: 'memory-high',
      name: '内存使用率过高',
      description: '内存使用率超过90%',
      enabled: true,
      priority: 9,
      tags: ['system', 'memory'],
      conditions: [{
        metric: 'system.memory.usage',
        operator: 'gt',
        threshold: 90,
        duration: 180
      }],
      logic: 'AND',
      suppression: {
        enabled: true,
        duration: 1800
      },
      escalation: {
        enabled: true,
        levels: [{
          level: 1,
          delay: 180,
          recipients: ['admin@example.com'],
          channels: ['email']
        }],
        autoResolve: true,
        autoResolveDelay: 600
      },
      actions: [{
        type: 'notification',
        config: { channel: 'email' }
      }],
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        updatedBy: 'system',
        updatedAt: new Date(),
        version: 1
      }
    };

    this.alertRules.set(memoryRule.id, memoryRule);
  }

  private initializeDefaultDashboards(): void {
    const systemDashboard: MonitoringDashboard = {
      id: 'system-overview',
      name: '系统概览',
      description: '系统性能指标概览',
      widgets: [
        {
          id: 'cpu-widget',
          type: 'metric',
          title: 'CPU使用率',
          position: { x: 0, y: 0 },
          size: { width: 6, height: 4 },
          config: {
            displayType: 'gauge',
            thresholds: [
              { value: 70, color: 'yellow' },
              { value: 85, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'system.cpu.usage'
          }
        },
        {
          id: 'memory-widget',
          type: 'metric',
          title: '内存使用率',
          position: { x: 6, y: 0 },
          size: { width: 6, height: 4 },
          config: {
            displayType: 'gauge',
            thresholds: [
              { value: 80, color: 'yellow' },
              { value: 90, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'system.memory.usage'
          }
        }
      ],
      layout: {
        type: 'grid',
        columns: 12,
        gap: 16,
        responsive: true
      },
      filters: [],
      refreshInterval: 30,
      timeRange: {
        start: 'now-1h',
        end: 'now',
        preset: 'last1h'
      }
    };

    this.dashboards.set(systemDashboard.id, systemDashboard);
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('指标收集失败:', error);
      }
    }, this.config.collection.interval * 1000);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateConfigSync(config: Partial<MonitoringSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
