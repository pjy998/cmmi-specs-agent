/**
 * MCP-related type definitions
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface CopilotAgent {
  execute(params: {
    prompt: string;
    tools: string[];
    model: string;
    context?: any;
  }): Promise<any>;
}

export interface ModelClientConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
}
