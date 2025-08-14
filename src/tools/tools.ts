/**
 * MCP Tools Definition for Copilot Multi-Agent Orchestrator
 * 优化版本 - 合并重叠功能，保留8个核心工具
 */

/**
 * Schema for unified agent management (合并 agent_create, smart_agent_generator, cmmi_init)
 */
const AgentManageSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['create', 'list', 'generate_smart', 'init_cmmi'],
      description: 'Action to perform: create single agent, list agents, generate smart agents, or init CMMI agents'
    },
    // For single agent creation
    name: {
      type: 'string',
      description: 'The name of the agent (for create action)'
    },
    description: {
      type: 'string',
      description: 'Brief description of the agent\'s role and purpose (for create action)'
    },
    capabilities: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of capabilities/skills the agent possesses'
    },
    model: {
      type: 'string',
      enum: ['gpt-4.1', 'gpt-4.5', 'claude-sonnet-4'],
      description: 'The AI model to use for this agent'
    },
    // For listing and filtering
    project_path: {
      type: 'string',
      description: 'Project path to scan for agent configurations'
    },
    filter_by_capability: {
      type: 'string',
      description: 'Filter agents by specific capability'
    },
    // For smart generation
    task_content: {
      type: 'string',
      description: 'Task description to analyze and generate appropriate agents for (for generate_smart action)'
    },
    generation_mode: {
      type: 'string',
      enum: ['smart', 'full'],
      description: 'smart: generate only needed agents, full: generate complete CMMI set'
    }
  },
  required: ['action']
};

/**
 * Schema for task analysis
 */
const TaskAnalyzeSchema = {
  type: 'object',
  properties: {
    task_content: {
      type: 'string',
      description: 'The task description to analyze'
    },
    project_path: {
      type: 'string',
      description: 'Optional project path for context'
    },
    complexity_hint: {
      type: 'string',
      enum: ['simple', 'medium', 'complex'],
      description: 'Optional complexity hint'
    },
    domain_hint: {
      type: 'string',
      description: 'Optional domain hint (e.g., "web development", "data science")'
    }
  },
  required: ['task_content']
};

/**
 * Schema for workflow execution
 */
const WorkflowExecuteSchema = {
  type: 'object',
  properties: {
    task_content: {
      type: 'string',
      description: 'The main task to be executed by the multi-agent workflow'
    },
    project_path: {
      type: 'string',
      description: 'Project path containing agent configurations'
    },
    execution_mode: {
      type: 'string',
      enum: ['sequential', 'parallel', 'smart'],
      description: 'Execution mode for the workflow'
    },
    selected_agents: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Specific agents to use (if not provided, will auto-select based on task)'
    },
    context_sharing: {
      type: 'boolean',
      description: 'Whether agents should share context between steps'
    },
    max_iterations: {
      type: 'number',
      description: 'Maximum number of iterations for the workflow'
    }
  },
  required: ['task_content']
};

/**
 * Schema for intelligent translation
 */
const IntelligentTranslateSchema = {
  type: 'object',
  properties: {
    content: {
      type: 'string',
      description: 'The content to translate'
    },
    sourceLanguage: {
      type: 'string',
      enum: ['zh', 'en'],
      description: 'Source language (zh for Chinese, en for English)'
    },
    targetLanguage: {
      type: 'string',
      enum: ['zh', 'en'],
      description: 'Target language (zh for Chinese, en for English)'
    },
    documentType: {
      type: 'string',
      enum: ['requirements', 'design', 'tasks', 'tests', 'implementation'],
      description: 'Type of document being translated'
    },
    domain: {
      type: 'string',
      enum: ['technical', 'business', 'general'],
      description: 'Domain context for translation',
      default: 'technical'
    }
  },
  required: ['content', 'sourceLanguage', 'targetLanguage', 'documentType']
} as const;

/**
 * Schema for project operations (合并 project_generate 和部分 workflow 功能)
 */
const ProjectOpsSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['generate', 'validate_config'],
      description: 'Action: generate new project or validate configurations'
    },
    // For project generation
    project_name: {
      type: 'string',
      description: 'Name of the project to generate'
    },
    project_type: {
      type: 'string',
      description: 'Type of project (e.g., web-app, api, library)'
    },
    languages: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'Target languages for documentation'
    },
    tech_stack: {
      type: 'string',
      description: 'Technology stack description'
    },
    output_path: {
      type: 'string',
      description: 'Output path for generated project'
    },
    // For config validation
    config_path: {
      type: 'string',
      description: 'Path to directory containing agent configuration files (for validate_config action)'
    }
  },
  required: ['action']
} as const;

/**
 * Schema for quality analysis
 */
const QualityAnalyzeSchema = {
  type: 'object',
  properties: {
    project_path: {
      type: 'string',
      description: 'Path to project for quality analysis'
    },
    analysis_type: {
      type: 'string',
      enum: ['quick', 'full', 'security'],
      description: 'Type of quality analysis to perform'
    },
    language: {
      type: 'string',
      description: 'Programming language for analysis'
    }
  },
  required: ['project_path']
} as const;

/**
 * Schema for model scheduling
 */
const ModelScheduleSchema = {
  type: 'object',
  properties: {
    agent_id: {
      type: 'string',
      description: 'ID of the agent requesting model access'
    },
    task_type: {
      type: 'string',
      description: 'Type of task (e.g., translate, analyze, generate)'
    },
    priority: {
      type: 'string',
      enum: ['low', 'normal', 'high', 'urgent'],
      description: 'Priority level for model access'
    },
    preferred_model: {
      type: 'string',
      description: 'Preferred model for the task'
    }
  },
  required: ['agent_id', 'task_type']
} as const;

/**
 * Schema for unified system monitoring (合并 monitoring_status 和 system_diagnosis)
 */
const SystemMonitorSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['status', 'diagnosis'],
      description: 'Action: get monitoring status or perform system diagnosis'
    },
    // For monitoring status
    metric_type: {
      type: 'string',
      enum: ['system', 'application', 'business', 'all'],
      description: 'Type of metrics to retrieve (for status action)'
    },
    // For system diagnosis
    check_type: {
      type: 'string',
      enum: ['quick', 'full', 'deep'],
      description: 'Type of system diagnosis to perform (for diagnosis action)'
    },
    include_recommendations: {
      type: 'boolean',
      description: 'Whether to include improvement recommendations (for diagnosis action)'
    }
  },
  required: ['action']
} as const;

/**
 * 优化后的MCP工具数组 - 8个核心工具
 */
export const mcpTools = [
  {
    name: 'agent_manage',
    description: '[agent_manage] [代理管理] [CMMI代理] [创建代理] [团队管理] Agent management: create agents, generate smart agents, setup CMMI agents, manage team members, build development team, create AI assistants, setup project roles, initialize agent system',
    inputSchema: AgentManageSchema
  },
  {
    name: 'task_analyze',
    description: '[task_analyze] [任务分析] [CMMI分析] [复杂度评估] [项目分析] Task analysis: analyze requirements, evaluate complexity, assess project scope, recommend team structure, estimate effort, analyze user stories, break down features, evaluate technical difficulty',
    inputSchema: TaskAnalyzeSchema
  },
  {
    name: 'workflow_execute',
    description: '[workflow_execute] [工作流执行] [CMMI工作流] [执行流程] [多代理协作] Workflow execution: run multi-agent process, execute development workflow, coordinate team tasks, orchestrate project phases, manage CMMI processes, run automated workflows',
    inputSchema: WorkflowExecuteSchema
  },
  {
    name: 'intelligent_translate',
    description: '[intelligent_translate] [智能翻译] [CMMI翻译] [文档转换] [翻译工具] Intelligent translation: translate documents, convert requirements, localize content, translate technical specs, convert documentation, multilingual support, language conversion',
    inputSchema: IntelligentTranslateSchema
  },
  {
    name: 'config_validate',
    description: '[config_validate] [配置验证] [CMMI配置] [项目初始化] [环境设置] Project configuration: validate project setup, generate project structure, create new projects, setup development environment, initialize codebase, project scaffolding',
    inputSchema: ProjectOpsSchema
  },
  {
    name: 'quality_analyze',
    description: '[quality_analyze] [质量分析] [CMMI质量] [代码审查] [质量检查] Quality analysis: code review, quality assessment, performance analysis, security audit, code quality check, technical debt analysis, compliance validation, best practices review',
    inputSchema: QualityAnalyzeSchema
  },
  {
    name: 'model_schedule',
    description: '[model_schedule] [模型调度] [CMMI调度] [AI资源] [模型管理] Model scheduling: manage AI resources, allocate computing resources, schedule model access, optimize AI usage, coordinate model execution, resource management',
    inputSchema: ModelScheduleSchema
  },
  {
    name: 'system_diagnosis',
    description: '[system_diagnosis] [系统诊断] [CMMI诊断] [系统检查] [健康监控] System diagnosis: monitor system health, check project status, diagnose issues, system analysis, performance monitoring, health check, troubleshooting, system metrics',
    inputSchema: SystemMonitorSchema
  }
];

// Export validation schemas for use in handlers
export { 
  AgentManageSchema,
  TaskAnalyzeSchema, 
  WorkflowExecuteSchema, 
  IntelligentTranslateSchema,
  ProjectOpsSchema,
  QualityAnalyzeSchema,
  ModelScheduleSchema,
  SystemMonitorSchema
};
