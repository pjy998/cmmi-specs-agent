/**
 * Core type definitions for the multi-agent orchestrator
 * Simplified for core functionality
 */

export type ComplexityLevel = 'simple' | 'medium' | 'complex';
export type AgentModel = 'gpt-4.1' | 'gpt-4.5' | 'claude-sonnet-4';

export interface TaskAnalysisResult {
  complexity: ComplexityLevel;
  domain: string[];
  keywords: string[];
  estimated_duration: string;
  requires_agents: {
    coordinator: boolean;
    requirements: boolean;
    design: boolean;
    implementation: boolean;
    testing: boolean;
    documentation: boolean;
    deployment: boolean;
  };
}

export interface AgentConfig {
  name: string;
  role: string;
  model: AgentModel;
  capabilities: string[];
  dependencies: string[];
  yaml_content: string;
  file_path: string;
}
