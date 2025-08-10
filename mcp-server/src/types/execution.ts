/**
 * Execution-related type definitions
 * Simplified for core functionality only
 */

export interface ExecutionContext {
  project_path: string;
  shared_variables: Map<string, any>;
  agent_results: Map<string, any>;
  project_files: Map<string, string>;
  start_time: Date;
}
