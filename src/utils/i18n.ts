/**
 * 国际化工具 - 支持中英双语
 */

export type Language = 'zh' | 'en';

export interface I18nMessages {
  errors: {
    required_field: string;
    agent_exists: string;
    agent_not_found: string;
    config_path_not_exist: string;
    invalid_config: string;
    task_content_required: string;
    no_agents_found: string;
    execution_failed: string;
  };
  success: {
    agent_created: string;
    agents_initialized: string;
    task_analyzed: string;
    config_validated: string;
    workflow_completed: string;
    execution_plan_created: string;
  };
  labels: {
    agent: string;
    agents: string;
    task: string;
    project: string;
    configuration: string;
    analysis: string;
    workflow: string;
    execution: string;
    validation: string;
    complexity: string;
    duration: string;
    status: string;
    result: string;
    error: string;
    warning: string;
    info: string;
    success: string;
    failed: string;
    completed: string;
    in_progress: string;
    pending: string;
  };
  descriptions: {
    requirements_agent: string;
    design_agent: string;
    coding_agent: string;
    tasks_agent: string;
    test_agent: string;
    spec_agent: string;
    general_agent: string;
  };
  instructions: {
    requirements_agent: string;
    design_agent: string;
    coding_agent: string;
    tasks_agent: string;
    test_agent: string;
    spec_agent: string;
  };
  capabilities: {
    requirement_analysis: string;
    stakeholder_management: string;
    system_architecture: string;
    detailed_design: string;
    code_implementation: string;
    code_review: string;
    task_management: string;
    project_planning: string;
    test_planning: string;
    test_execution: string;
    documentation: string;
    specification: string;
  };
  templates: {
    design: {
      architecture_overview: string;
      system_architecture: string;
      system_description: string;
      presentation_layer: string;
      business_layer: string;
      data_layer: string;
      database_layer: string;
      technology_stack: string;
      module_design: string;
      user_management_module: string;
      user_management_description: string;
      core_components: string;
      interface_design: string;
      business_logic_module: string;
      business_logic_description: string;
      data_persistence_module: string;
      data_persistence_description: string;
      security_design: string;
      authentication_mechanism: string;
      permission_control: string;
      performance_considerations: string;
      optimization_strategy: string;
      scalability_design: string;
    };
  };
}

const messages: Record<Language, I18nMessages> = {
  zh: {
    errors: {
      required_field: '必填字段缺失',
      agent_exists: '代理已存在',
      agent_not_found: '代理未找到',
      config_path_not_exist: '配置路径不存在',
      invalid_config: '无效配置',
      task_content_required: '任务内容不能为空',
      no_agents_found: '未找到有效的代理配置。请先运行 init_cmmi_agents',
      execution_failed: '执行失败'
    },
    success: {
      agent_created: '代理创建成功',
      agents_initialized: 'CMMI代理初始化成功',
      task_analyzed: '任务分析完成',
      config_validated: '配置验证完成',
      workflow_completed: '多代理工作流完成',
      execution_plan_created: '执行计划创建成功'
    },
    labels: {
      agent: '代理',
      agents: '代理列表',
      task: '任务',
      project: '项目',
      configuration: '配置',
      analysis: '分析',
      workflow: '工作流',
      execution: '执行',
      validation: '验证',
      complexity: '复杂度',
      duration: '持续时间',
      status: '状态',
      result: '结果',
      error: '错误',
      warning: '警告',
      info: '信息',
      success: '成功',
      failed: '失败',
      completed: '已完成',
      in_progress: '进行中',
      pending: '待处理'
    },
    descriptions: {
      requirements_agent: '需求分析师，负责收集、分析和管理项目需求',
      design_agent: '系统设计师，负责架构设计和详细设计',
      coding_agent: '软件开发工程师，负责代码实现和审查',
      tasks_agent: '项目经理，负责任务分解和项目管理',
      test_agent: '测试工程师，负责测试策略和执行',
      spec_agent: '技术文档工程师，负责规范和文档编写',
      general_agent: '通用助手，可处理多种类型的任务'
    },
    instructions: {
      requirements_agent: '您是需求分析师。您的职责包括收集和分析业务需求，管理利益相关者期望，确保需求的完整性和一致性。请始终遵循CMMI最佳实践，提供详细、专业的输出。',
      design_agent: '您是系统设计师。您的职责包括创建系统架构，设计组件和接口，确保系统的可扩展性和可维护性。请始终遵循CMMI最佳实践，提供详细、专业的输出。',
      coding_agent: '您是软件开发工程师。您的职责包括编写高质量代码，进行代码审查，确保代码符合标准和最佳实践。请始终遵循CMMI最佳实践，提供详细、专业的输出。',
      tasks_agent: '您是项目经理。您的职责包括任务分解，进度管理，资源协调，确保项目按时按质完成。请始终遵循CMMI最佳实践，提供详细、专业的输出。',
      test_agent: '您是测试工程师。您的职责包括制定测试策略，设计测试用例，执行测试并生成质量报告。请始终遵循CMMI最佳实践，提供详细、专业的输出。',
      spec_agent: '您是技术文档工程师。您的职责包括编写技术规范，用户手册，API文档等，确保文档的准确性和完整性。请始终遵循CMMI最佳实践，提供详细、专业的输出。'
    },
    capabilities: {
      requirement_analysis: '需求分析',
      stakeholder_management: '利益相关者管理',
      system_architecture: '系统架构',
      detailed_design: '详细设计',
      code_implementation: '代码实现',
      code_review: '代码审查',
      task_management: '任务管理',
      project_planning: '项目规划',
      test_planning: '测试规划',
      test_execution: '测试执行',
      documentation: '文档编写',
      specification: '规范制定'
    },
    templates: {
      design: {
        architecture_overview: '架构概述',
        system_architecture: '系统架构',
        system_description: '本系统采用分层架构设计，包含以下主要层次：',
        presentation_layer: '用户界面层',
        business_layer: '业务逻辑层',
        data_layer: '数据访问层',
        database_layer: '数据存储层',
        technology_stack: '技术栈',
        module_design: '模块设计',
        user_management_module: '用户管理模块',
        user_management_description: '处理用户注册、登录、权限管理',
        core_components: '核心组件',
        interface_design: '接口设计',
        business_logic_module: '业务逻辑模块',
        business_logic_description: '核心业务处理和数据管理',
        data_persistence_module: '数据持久化模块',
        data_persistence_description: '数据存储和检索',
        security_design: '安全设计',
        authentication_mechanism: '认证机制',
        permission_control: '权限控制',
        performance_considerations: '性能考虑',
        optimization_strategy: '优化策略',
        scalability_design: '扩展性设计'
      }
    }
  },
  en: {
    errors: {
      required_field: 'Required field is missing',
      agent_exists: 'Agent already exists',
      agent_not_found: 'Agent not found',
      config_path_not_exist: 'Configuration path does not exist',
      invalid_config: 'Invalid configuration',
      task_content_required: 'Task content is required',
      no_agents_found: 'No valid agent configurations found. Please run init_cmmi_agents first',
      execution_failed: 'Execution failed'
    },
    success: {
      agent_created: 'Agent created successfully',
      agents_initialized: 'CMMI agents initialized successfully',
      task_analyzed: 'Task analysis completed',
      config_validated: 'Configuration validation completed',
      workflow_completed: 'Multi-agent workflow completed',
      execution_plan_created: 'Execution plan created successfully'
    },
    labels: {
      agent: 'Agent',
      agents: 'Agents',
      task: 'Task',
      project: 'Project',
      configuration: 'Configuration',
      analysis: 'Analysis',
      workflow: 'Workflow',
      execution: 'Execution',
      validation: 'Validation',
      complexity: 'Complexity',
      duration: 'Duration',
      status: 'Status',
      result: 'Result',
      error: 'Error',
      warning: 'Warning',
      info: 'Information',
      success: 'Success',
      failed: 'Failed',
      completed: 'Completed',
      in_progress: 'In Progress',
      pending: 'Pending'
    },
    descriptions: {
      requirements_agent: 'Requirements Analyst responsible for collecting, analyzing and managing project requirements',
      design_agent: 'System Designer responsible for architecture design and detailed design',
      coding_agent: 'Software Developer responsible for code implementation and review',
      tasks_agent: 'Project Manager responsible for task breakdown and project management',
      test_agent: 'Test Engineer responsible for test strategy and execution',
      spec_agent: 'Technical Writer responsible for specifications and documentation',
      general_agent: 'General purpose assistant capable of handling various types of tasks'
    },
    instructions: {
      requirements_agent: 'You are a Requirements Analyst. Your responsibilities include collecting and analyzing business requirements, managing stakeholder expectations, ensuring completeness and consistency of requirements. Always follow CMMI best practices and provide detailed, professional outputs.',
      design_agent: 'You are a System Designer. Your responsibilities include creating system architecture, designing components and interfaces, ensuring system scalability and maintainability. Always follow CMMI best practices and provide detailed, professional outputs.',
      coding_agent: 'You are a Software Developer. Your responsibilities include writing high-quality code, conducting code reviews, ensuring code meets standards and best practices. Always follow CMMI best practices and provide detailed, professional outputs.',
      tasks_agent: 'You are a Project Manager. Your responsibilities include task breakdown, progress management, resource coordination, ensuring projects are completed on time and with quality. Always follow CMMI best practices and provide detailed, professional outputs.',
      test_agent: 'You are a Test Engineer. Your responsibilities include developing test strategies, designing test cases, executing tests and generating quality reports. Always follow CMMI best practices and provide detailed, professional outputs.',
      spec_agent: 'You are a Technical Writer. Your responsibilities include writing technical specifications, user manuals, API documentation, ensuring accuracy and completeness of documentation. Always follow CMMI best practices and provide detailed, professional outputs.'
    },
    capabilities: {
      requirement_analysis: 'Requirement Analysis',
      stakeholder_management: 'Stakeholder Management',
      system_architecture: 'System Architecture',
      detailed_design: 'Detailed Design',
      code_implementation: 'Code Implementation',
      code_review: 'Code Review',
      task_management: 'Task Management',
      project_planning: 'Project Planning',
      test_planning: 'Test Planning',
      test_execution: 'Test Execution',
      documentation: 'Documentation',
      specification: 'Specification'
    },
    templates: {
      design: {
        architecture_overview: 'Architecture Overview',
        system_architecture: 'System Architecture',
        system_description: 'This system adopts a layered architecture design with the following main layers:',
        presentation_layer: 'Presentation Layer',
        business_layer: 'Business Logic Layer',
        data_layer: 'Data Access Layer',
        database_layer: 'Database Layer',
        technology_stack: 'Technology Stack',
        module_design: 'Module Design',
        user_management_module: 'User Management Module',
        user_management_description: 'Handles user registration, login, and permission management',
        core_components: 'Core Components',
        interface_design: 'Interface Design',
        business_logic_module: 'Business Logic Module',
        business_logic_description: 'Core business processing and data management',
        data_persistence_module: 'Data Persistence Module',
        data_persistence_description: 'Data storage and retrieval',
        security_design: 'Security Design',
        authentication_mechanism: 'Authentication Mechanism',
        permission_control: 'Permission Control',
        performance_considerations: 'Performance Considerations',
        optimization_strategy: 'Optimization Strategy',
        scalability_design: 'Scalability Design'
      }
    }
  }
};

export class I18n {
  private static currentLanguage: Language = 'zh';
  
  static setLanguage(language: Language): void {
    this.currentLanguage = language;
  }
  
  static getLanguage(): Language {
    return this.currentLanguage;
  }
  
  static detectLanguage(text: string): Language {
    // 检测文本中的中文字符
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(text) ? 'zh' : 'en';
  }
  
  static autoSetLanguage(text?: string): Language {
    if (text) {
      this.currentLanguage = this.detectLanguage(text);
    }
    return this.currentLanguage;
  }
  
  static get(key: keyof I18nMessages): any {
    return messages[this.currentLanguage][key];
  }
  
  static getError(key: keyof I18nMessages['errors']): string {
    return messages[this.currentLanguage].errors[key];
  }
  
  static getSuccess(key: keyof I18nMessages['success']): string {
    return messages[this.currentLanguage].success[key];
  }
  
  static getLabel(key: keyof I18nMessages['labels']): string {
    return messages[this.currentLanguage].labels[key];
  }
  
  static getDescription(key: keyof I18nMessages['descriptions']): string {
    return messages[this.currentLanguage].descriptions[key];
  }
  
  static getInstruction(key: keyof I18nMessages['instructions']): string {
    return messages[this.currentLanguage].instructions[key];
  }
  
  static getCapability(key: keyof I18nMessages['capabilities']): string {
    return messages[this.currentLanguage].capabilities[key];
  }
  
  static getTemplate(section: keyof I18nMessages['templates'], key: string): string {
    return (messages[this.currentLanguage].templates[section] as any)[key] || key;
  }
  
  static getDesignTemplate(key: keyof I18nMessages['templates']['design']): string {
    return messages[this.currentLanguage].templates.design[key];
  }
  
  // 格式化消息
  static format(template: string, ...args: any[]): string {
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      return args[index] !== undefined ? args[index] : match;
    });
  }
  
  // 获取完整的错误信息
  static formatError(key: keyof I18nMessages['errors'], field?: string): string {
    const message = this.getError(key);
    return field ? `${field}: ${message}` : message;
  }
  
  // 获取完整的成功信息
  static formatSuccess(key: keyof I18nMessages['success'], detail?: string): string {
    const message = this.getSuccess(key);
    return detail ? `${message}: ${detail}` : message;
  }
}

export default I18n;
