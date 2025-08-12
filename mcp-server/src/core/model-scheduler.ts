/**
 * Model Scheduler Implementation
 * 模型调度器核心实现
 */

import { 
  AIModel, 
  AgentRole, 
  TaskComplexity, 
  ModelInvokeOptions, 
  ModelResponse, 
  TaskComplexityAnalysis,
  CopilotChatRequest,
  ModelSchedulerConfig
} from '../types/model-scheduler.js';

export class ModelScheduler {
  private config: ModelSchedulerConfig;
  
  constructor(config: Partial<ModelSchedulerConfig> = {}) {
    this.config = {
      defaultTimeout: 30000, // 30秒默认超时
      agentModelMap: {
        'requirements-agent': 'gpt-4.1',
        'design-agent': 'claude-sonnet-4',
        'coding-agent': 'claude-sonnet-4',
        'test-agent': 'gpt-4.1',
        'tasks-agent': 'gpt-4.1',
        'spec-agent': 'claude-sonnet-4'
      },
      complexityTimeoutMultipliers: {
        simple: 0.5,    // 15秒
        medium: 1.0,    // 30秒
        complex: 2.0    // 60秒
      },
      copilotChatConfig: {
        timeout: 30000,
        retryPolicy: 'exponential',
        maxRetries: 3,
        baseDelay: 1000
      },
      ...config
    };
  }

  /**
   * 智能选择模型
   * Intelligently select AI model based on agent role and task complexity
   */
  selectModel(agentRole: AgentRole, complexity?: TaskComplexity): AIModel {
    // 1. 基于代理角色的默认模型选择
    let selectedModel = this.config.agentModelMap[agentRole] || 'gpt-4.1';
    
    // 2. 基于任务复杂度的动态调整
    if (complexity) {
      switch (complexity) {
        case 'complex':
          // 复杂任务优先使用Claude Sonnet 4
          selectedModel = 'claude-sonnet-4';
          break;
        case 'simple':
          // 简单任务优先使用GPT-4.1提升响应速度
          selectedModel = 'gpt-4.1';
          break;
        case 'medium':
          // 中等任务保持代理默认选择
          break;
      }
    }
    
    return selectedModel;
  }

  /**
   * 分析任务复杂度
   * Analyze task complexity based on content characteristics
   */
  analyzeComplexity(content: string, _context?: any): TaskComplexityAnalysis {
    const contentLength = content.length;
    
    // 技术术语密度分析 - 扩展更多关键词
    const technicalTerms = [
      'API', 'interface', 'class', 'function', 'algorithm', 'architecture',
      'protocol', 'framework', 'database', 'optimization', 'implementation',
      'configuration', 'deployment', 'integration', 'middleware', 'component',
      'authentication', 'authorization', 'microservice', 'distributed', 'cluster',
      'scaling', 'performance', 'security', 'encryption', 'validation',
      'token', 'session', 'cache', 'redis', 'mongodb', 'sql', 'nosql',
      'docker', 'kubernetes', 'ci/cd', 'pipeline', 'testing', 'monitoring',
      'logging', 'tracing', 'load balancing', 'sharding', 'replication',
      'async', 'await', 'promise', 'callback', 'event', 'stream', 'queue'
    ];
    
    const technicalTermCount = technicalTerms.reduce((count, term) => {
      return count + (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
    }, 0);
    
    // 结构复杂度分析（基于换行符、特殊字符等）
    const structureComplexity = (content.match(/\n/g) || []).length + 
                                (content.match(/[{}[\]()]/g) || []).length +
                                (content.match(/[,;.]/g) || []).length * 0.1;
    
    // 语言复杂度分析（中英文混合）
    const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    const languageComplexity = Math.min(chineseChars / 10 + englishWords / 5, 100);
    
    // 数字和代码模式检测
    const codePatterns = (content.match(/[=><]+|function|class|if|else|for|while|try|catch/g) || []).length;
    
    // 综合复杂度评分 - 调整权重
    let complexity: TaskComplexity = 'simple';
    const complexityScore = 
      (contentLength / 50) * 0.25 +        // 降低内容长度权重
      technicalTermCount * 0.5 +           // 增加技术术语权重
      (structureComplexity / 5) * 0.15 +   // 增加结构复杂度权重
      (languageComplexity / 20) * 0.05 +   // 降低语言复杂度权重
      codePatterns * 0.05;                 // 添加代码模式权重
    
    // 优化阈值
    if (complexityScore > 10) complexity = 'complex';
    else if (complexityScore > 4) complexity = 'medium';
    
    // 计算推荐超时时间
    const baseTimeout = this.config.defaultTimeout;
    const multiplier = this.config.complexityTimeoutMultipliers[complexity];
    const recommendedTimeout = Math.floor(baseTimeout * multiplier);
    
    return {
      complexity,
      factors: {
        contentLength,
        technicalTermCount,
        structureComplexity,
        languageComplexity
      },
      recommendedTimeout,
      recommendedModel: this.selectModel('coding-agent', complexity)
    };
  }

  /**
   * 自适应超时计算
   * Calculate adaptive timeout based on task characteristics
   */
  calculateTimeout(
    agentRole: AgentRole, 
    complexity: TaskComplexity, 
    options?: ModelInvokeOptions
  ): number {
    // 1. 基础超时时间
    const baseTimeout = options?.timeout || this.config.defaultTimeout;
    
    // 2. 复杂度调整
    const multiplier = this.config.complexityTimeoutMultipliers[complexity];
    
    // 3. 代理角色调整
    const roleMultipliers = {
      'requirements-agent': 1.2,  // 需求分析需要更多时间
      'design-agent': 1.5,        // 设计思考需要更多时间
      'coding-agent': 1.0,        // 代码生成标准时间
      'test-agent': 0.8,          // 测试用例生成相对快速
      'tasks-agent': 0.9,         // 任务分解中等时间
      'spec-agent': 1.3           // 规范编写需要较多时间
    };
    
    const roleMultiplier = roleMultipliers[agentRole] || 1.0;
    
    // 4. 最终超时计算
    const adaptiveTimeout = Math.floor(baseTimeout * multiplier * roleMultiplier);
    
    // 5. 边界限制（最小10秒，最大120秒）
    return Math.max(10000, Math.min(120000, adaptiveTimeout));
  }

  /**
   * 调用模型
   * Invoke AI model with intelligent scheduling
   */
  async invokeModel(
    agentRole: AgentRole,
    prompt: string,
    options: ModelInvokeOptions = {}
  ): Promise<ModelResponse> {
    const startTime = Date.now();
    
    try {
      // 1. 分析任务复杂度
      const analysis = this.analyzeComplexity(prompt);
      const effectiveComplexity = options.complexity || analysis.complexity;
      
      // 2. 选择最优模型
      const selectedModel = this.selectModel(agentRole, effectiveComplexity);
      
      // 3. 计算自适应超时
      const timeout = this.calculateTimeout(agentRole, effectiveComplexity, options);
      
      // 4. 构建请求
      const request: CopilotChatRequest = {
        model: selectedModel,
        prompt,
        options: {
          ...options,
          timeout,
          complexity: effectiveComplexity
        }
      };
      
      // 5. 调用Copilot Chat API
      const response = await this.callCopilotChat(request);
      
      // 6. 构建响应
      const responseTime = Date.now() - startTime;
      
      return {
        content: response,
        model: selectedModel,
        metadata: {
          responseTime,
          complexity: effectiveComplexity
        }
      };
      
    } catch (error) {
      throw new Error(`Model invocation failed for ${agentRole}: ${error}`);
    }
  }

  /**
   * 调用Copilot Chat API
   * Call Copilot Chat API with timeout and retry logic
   */
  private async callCopilotChat(request: CopilotChatRequest): Promise<string> {
    const { model, prompt, options } = request;
    const timeout = options.timeout || this.config.copilotChatConfig.timeout;
    
    // 创建超时Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
    });
    
    // 模拟API调用（实际实现需要集成VS Code Copilot Chat API）
    const apiCallPromise = this.simulateApiCall(model, prompt, options);
    
    try {
      // 使用Promise.race实现超时控制
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Timeout')) {
        throw new Error(`${model} API call timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 模拟API调用（临时实现）
   * Simulate API call (temporary implementation)
   */
  private async simulateApiCall(
    model: AIModel, 
    prompt: string, 
    options: ModelInvokeOptions
  ): Promise<string> {
    // 模拟网络延迟
    const delay = model === 'gpt-4.1' ? 1000 + Math.random() * 2000 : 1500 + Math.random() * 3000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 模拟响应内容
    return `[${model}] 模拟响应内容针对输入: ${prompt.substring(0, 50)}...
    
复杂度: ${options.complexity}
超时设置: ${options.timeout}ms
域: ${options.domain || 'technical'}

这是一个模拟的AI模型响应。在实际实现中，这里会调用真实的Copilot Chat API。`;
  }

  /**
   * 获取性能统计
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      defaultTimeout: this.config.defaultTimeout,
      agentModelMappings: this.config.agentModelMap,
      complexityMultipliers: this.config.complexityTimeoutMultipliers
    };
  }

  /**
   * 更新配置
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<ModelSchedulerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}
