/**
 * Simplified tool handlers for MCP tools with i18n support
 */

import { 
  AgentConfig,
  AgentModel
} from '../types/index.js';
import { I18n } from '../utils/i18n.js';
import { IntelligentTranslationService, TranslationRequest } from '../utils/intelligent-translation.js';
import * as fs from 'fs';
import * as path from 'path';

// In-memory storage for agents
const agents = new Map<string, AgentConfig>();

/**
 * Simplified tool handler implementations
 */
export class ToolHandlers {
  
  static async createAgent(params: any): Promise<any> {
    try {
      const { 
        name, 
        description, 
        capabilities, 
        model = 'gpt-4.1', 
        systemPrompt, 
        tools = [],
        project_path = './project',
        language = 'auto'  // 支持语言参数
      } = params;
      
      // 自动检测或设置语言
      if (language === 'auto') {
        I18n.autoSetLanguage(description || name);
      } else {
        I18n.setLanguage(language);
      }
      
      if (!name) {
        throw new Error(I18n.formatError('required_field', I18n.getLabel('agent')));
      }
      
      if (agents.has(name)) {
        throw new Error(I18n.format(I18n.getError('agent_exists'), name));
      }

      const agentConfig: AgentConfig = {
        name,
        role: description || I18n.getDescription('general_agent'),
        model: model as AgentModel,
        capabilities: capabilities || [],
        dependencies: [],
        yaml_content: '',
        file_path: ''
      };

      // Generate YAML content with i18n
      const yamlContent = `version: 1
name: ${name}
title: ${description || I18n.getDescription('general_agent')}
model: ${model}
capabilities:
${capabilities?.map((cap: string) => `  - ${cap}`).join('\n') || '  - general'}
instructions: |
  ${systemPrompt || `You are ${name}, ${I18n.getDescription('general_agent')}.`}
tools:
${tools.map((tool: string) => `  - ${tool}`).join('\n') || '[]'}
`;

      // Save to file if project_path provided
      if (project_path) {
        const agentsDir = path.join(project_path, 'agents');
        if (!fs.existsSync(agentsDir)) {
          fs.mkdirSync(agentsDir, { recursive: true });
        }
        
        const filePath = path.join(agentsDir, `${name}.yaml`);
        fs.writeFileSync(filePath, yamlContent);
        
        agentConfig.file_path = filePath;
      }

      agentConfig.yaml_content = yamlContent;
      agents.set(name, agentConfig);

      return {
        success: true,
        agent_id: name,
        configuration: agentConfig,
        status: I18n.getLabel('completed'),
        message: I18n.formatSuccess('agent_created', name)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : I18n.getError('execution_failed')
      };
    }
  }

  static async listAgents(params: any): Promise<any> {
    try {
      const { project_path, language = 'auto' } = params;
      
      // 设置语言
      if (language !== 'auto') {
        I18n.setLanguage(language);
      }
      
      const agentList = Array.from(agents.values());
      
      // Also check file system if project_path provided
      let fileAgents: any[] = [];
      if (project_path) {
        const agentsDir = path.join(project_path, 'agents');
        if (fs.existsSync(agentsDir)) {
          const files = fs.readdirSync(agentsDir)
            .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
          
          fileAgents = files.map(file => ({
            name: path.basename(file, path.extname(file)),
            file_path: path.join(agentsDir, file),
            source: 'file'
          }));
        }
      }

      return {
        success: true,
        agents: agentList.map(agent => ({
          ...agent,
          status: I18n.getLabel('completed')
        })),
        file_agents: fileAgents,
        total_count: agentList.length + fileAgents.length,
        message: I18n.format('{0}: {1}', I18n.getLabel('agents'), agentList.length + fileAgents.length)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : I18n.getError('execution_failed')
      };
    }
  }

  static async intelligentTranslate(params: any): Promise<any> {
    try {
      const {
        content,
        sourceLanguage,
        targetLanguage,
        documentType,
        domain = 'technical'
      } = params;

      if (!content) {
        return {
          success: false,
          error: 'Content is required for translation'
        };
      }

      if (sourceLanguage === targetLanguage) {
        return {
          success: true,
          result: {
            translatedContent: content,
            sourceLanguage,
            targetLanguage,
            skipped: true,
            reason: 'Source and target languages are the same'
          }
        };
      }

      const translationService = IntelligentTranslationService.getInstance();
      
      const request: TranslationRequest = {
        content,
        sourceLanguage,
        targetLanguage,
        context: {
          domain,
          documentType,
        }
      };

      const result = await translationService.translate(request);

      return {
        success: true,
        result: {
          translatedContent: result.translatedContent,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          confidence: result.confidence,
          preservedElements: result.preservedElements,
          cached: false // TODO: 检测是否来自缓存
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }
}
