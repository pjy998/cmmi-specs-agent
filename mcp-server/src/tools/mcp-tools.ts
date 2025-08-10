/**
 * MCP Tools Definition for Copilot Multi-Agent Orchestrator
 * Simplified to 5 core tools for better maintainability
 */

/**
 * Schema for creating agents
 */
const CreateAgentSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'The name of the agent (unique identifier)'
    },
    description: {
      type: 'string',
      description: 'Brief description of the agent\'s role and purpose'
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
      description: 'The AI model to use for this agent',
      default: 'gpt-4.1'
    },
    systemPrompt: {
      type: 'string',
      description: 'Custom system prompt for the agent'
    },
    tools: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of tools this agent can use'
    },
    project_path: {
      type: 'string',
      description: 'Path where the agent configuration should be saved',
      default: './project'
    }
  },
  required: ['name', 'description']
};

/**
 * Schema for listing agents
 */
const ListAgentsSchema = {
  type: 'object',
  properties: {
    project_path: {
      type: 'string',
      description: 'Project path to scan for agent configurations'
    },
    filter_by_capability: {
      type: 'string',
      description: 'Filter agents by specific capability'
    }
  }
};

/**
 * Schema for analyze_task tool
 */
const AnalyzeTaskSchema = {
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
 * Schema for validate_agent_configs tool
 */
const ValidateAgentConfigsSchema = {
  type: 'object',
  properties: {
    config_path: {
      type: 'string',
      description: 'Path to directory containing agent configuration files'
    }
  },
  required: ['config_path']
};

/**
 * Schema for init_cmmi_agents tool
 */
const InitCmmiAgentsSchema = {
  type: 'object',
  properties: {
    project_path: {
      type: 'string',
      description: 'Project path where CMMI agents should be created',
      default: './project'
    }
  }
};

/**
 * Schema for execute_multi_agent_workflow tool
 */
const ExecuteMultiAgentWorkflowSchema = {
  type: 'object',
  properties: {
    task_content: {
      type: 'string',
      description: 'The main task to be executed by the multi-agent workflow'
    },
    project_path: {
      type: 'string',
      description: 'Project path containing agent configurations',
      default: './project'
    },
    execution_mode: {
      type: 'string',
      enum: ['sequential', 'parallel', 'smart'],
      description: 'Execution mode for the workflow',
      default: 'smart'
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
      description: 'Whether agents should share context between steps',
      default: true
    },
    max_iterations: {
      type: 'number',
      description: 'Maximum number of iterations for the workflow',
      default: 10
    }
  },
  required: ['task_content']
};

/**
 * MCP Tools Array - Core tools with workflow execution
 */
/**
 * MCP Tools Array - Optimized naming for better usability
 */
export const mcpTools = [
  {
    name: 'agent_create',
    description: 'Create a new AI agent with specific capabilities',
    inputSchema: CreateAgentSchema
  },
  {
    name: 'agent_list',
    description: 'List all available agents and their capabilities',
    inputSchema: ListAgentsSchema
  },
  {
    name: 'task_analyze',
    description: 'Analyze a task and recommend required agents and complexity',
    inputSchema: AnalyzeTaskSchema
  },
  {
    name: 'config_validate',
    description: 'Validate agent configuration files for correctness',
    inputSchema: ValidateAgentConfigsSchema
  },
  {
    name: 'cmmi_init',
    description: 'Initialize standard CMMI agents for software development',
    inputSchema: InitCmmiAgentsSchema
  },
  {
    name: 'workflow_execute',
    description: 'Execute a multi-agent workflow with intelligent orchestration',
    inputSchema: ExecuteMultiAgentWorkflowSchema
  }
];

// Export validation schemas for use in handlers
export { CreateAgentSchema, ListAgentsSchema, AnalyzeTaskSchema, ValidateAgentConfigsSchema, InitCmmiAgentsSchema, ExecuteMultiAgentWorkflowSchema };
