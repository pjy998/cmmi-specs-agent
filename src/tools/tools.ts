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
    description: 'Unified agent management: create, list, generate smart agents, or initialize CMMI agents',
    inputSchema: AgentManageSchema
  },
  {
    name: 'task_analyze',
    description: 'Analyze a task and recommend required agents and complexity',
    inputSchema: TaskAnalyzeSchema
  },
  {
    name: 'workflow_execute',
    description: 'Execute a multi-agent workflow with intelligent orchestration',
    inputSchema: WorkflowExecuteSchema
  },
  {
    name: 'intelligent_translate',
    description: 'Translate content using GPT-4.1 with context awareness for technical documents',
    inputSchema: IntelligentTranslateSchema
  },
  {
    name: 'config_validate',
    description: 'Project operations: generate new projects or validate configurations',
    inputSchema: ProjectOpsSchema
  },
  {
    name: 'quality_analyze',
    description: 'Perform quality analysis on project code and documentation',
    inputSchema: QualityAnalyzeSchema
  },
  {
    name: 'model_schedule',
    description: 'Schedule and manage AI model access for agents',
    inputSchema: ModelScheduleSchema
  },
  {
    name: 'system_diagnosis',
    description: 'Unified system monitoring: get status metrics or perform comprehensive diagnosis',
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
